// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readdir } from "node:fs/promises";
import { ReadableStream } from "node:stream/web";
import { test, type TestContext } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import type { Connector } from "../src/index.ts";
import type { Session } from "../src/types.ts";
import { type TestingTarget, testWithClient } from "../test/testWithClient.ts";

const DOUYIN_PACKAGE_NAMES = new Set([
  "com.example.app",
  "com.example.app.lite",
  "com.example.app.ep",
]);

const WEBVIEW_UNSUPPORTED_CDP_METHODS = [
  "DOM.getDocumentWithBoxModel",
  "DOM.getOriginalNodeIndex",
  "DOM.innerText",
  "Lynx.getRectToWindow",
  "Lynx.getVersion",
  "Lynx.getViewLocationOnScreen",
  "Lynx.sendVMEvent",
  "Memory.getAllMemoryUsage",
  "Performance.getAllTimingInfo",
  "Performance.getAllPerformanceEntries",
  "WhiteBoard.enable",
  "WhiteBoard.disable",
  "WhiteBoard.setSharedData",
  "WhiteBoard.getSharedData",
  "WhiteBoard.removeSharedData",
  "WhiteBoard.clear",
  "UITree.enable",
  "UITree.getLynxUITree",
] as const;

const WEBVIEW_TESTED_CDP_METHODS = [
  "CSS.getBackgroundColors",
  "CSS.getComputedStyleForNode",
  "CSS.getInlineStylesForNode",
  "CSS.getMatchedStylesForNode",
  "DOM.describeNode",
  "DOM.disable",
  "DOM.discardSearchResults",
  "DOM.enable",
  "DOM.getAttributes",
  "DOM.getBoxModel",
  "DOM.getDocument",
  "DOM.getNodeForLocation",
  "DOM.getOuterHTML",
  "DOM.getSearchResults",
  "DOM.performSearch",
  "DOM.querySelector",
  "DOM.querySelectorAll",
  "DOM.requestChildNodes",
  "DOM.scrollIntoViewIfNeeded",
  "DOM.setAttributesAsText",
  "Debugger.getScriptSource",
  "Input.emulateTouchFromMouseEvent",
  "Overlay.hideHighlight",
  "Overlay.highlightNode",
  "Page.getResourceContent",
  "Page.getResourceTree",
  "Page.reload",
  "Performance.disable",
  "Performance.enable",
  "Runtime.callFunctionOn",
  "Runtime.compileScript",
  "Runtime.disable",
  "Runtime.discardConsoleEntries",
  "Runtime.enable",
  "Runtime.evaluate",
  "Runtime.getHeapUsage",
  "Runtime.getProperties",
  "Runtime.globalLexicalScopeNames",
  "Runtime.runScript",
  "Runtime.setAsyncCallStackDepth",
] as const;

const CDP_REFERENCE_DIR = new URL("../../../skills/lynx-devtool/references/cdp/", import.meta.url);
const TARGET_APP_PACKAGE_NAME = process.env["LYNX_DEVTOOL_MCP_TESTING_APP_PACKAGE"]?.trim() ?? "";
const testWithDouyinWebViewClient = DOUYIN_PACKAGE_NAMES.has(TARGET_APP_PACKAGE_NAME)
  ? testWithClient
  : testWithClient.skip;

type CdpRequest = { method: string; params?: unknown };

interface RemoteObject {
  type: string;
  value?: unknown;
  objectId?: string;
  description?: string;
}

interface RuntimeResult {
  result: RemoteObject;
  exceptionDetails?: unknown;
}

interface RuntimeCompileScriptResult {
  scriptId?: string;
  exceptionDetails?: unknown;
}

interface DomNode {
  nodeId: number;
  backendNodeId?: number;
  nodeType: number;
  nodeName: string;
  localName: string;
  nodeValue: string;
  attributes?: string[];
  childNodeCount?: number;
  children?: DomNode[];
}

interface BoxModel {
  content: number[];
  padding: number[];
  border: number[];
  margin: number[];
  width: number;
  height: number;
}

interface FrameResourceTree {
  frame: {
    id: string;
    url: string;
  };
  resources?: Array<{ url: string }>;
  childFrames?: FrameResourceTree[];
}

interface ScriptParsedEvent {
  scriptId: string;
  url: string;
}

function isDouyinTarget(target: TestingTarget): boolean {
  return DOUYIN_PACKAGE_NAMES.has(target.appPackageName);
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function urlMatchesTarget(url: string, target: TestingTarget): boolean {
  return url === target.openUrl || url === target.pageUrl || url.includes(target.openUrl)
    || url.includes(target.pageUrl);
}

function isTargetWebViewSession(session: Session, target: TestingTarget): boolean {
  if (session.type === "web") return urlMatchesTarget(session.url, target);
  return isHttpUrl(session.url) && urlMatchesTarget(session.url, target) && !session.url.endsWith(".js");
}

function isWebViewLikeSession(session: Session): boolean {
  return session.type === "web" || (isHttpUrl(session.url) && !session.url.endsWith(".js"));
}

async function listDocumentedCdpMethods(dir = CDP_REFERENCE_DIR): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const methods = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) {
      return listDocumentedCdpMethods(new URL(`${entry.name}/`, dir));
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      return [];
    }

    const method = entry.name.slice(0, -".md".length);
    if (method === "index" || !method.includes(".")) {
      return [];
    }
    return [method];
  }));

  return methods.flat().sort();
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function streamFrom<T>(items: T[]): ReadableStream<T> {
  return new ReadableStream<T>({
    start(controller) {
      for (const item of items) {
        controller.enqueue(item);
      }
      controller.close();
    },
  });
}

async function* readUntilIdle<T>(
  stream: ReadableStream<T>,
  opts: { idleMs: number; maxMs: number },
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const startTime = Date.now();
  let terminated = false;

  try {
    while (Date.now() - startTime < opts.maxMs) {
      const result = await Promise.race([
        reader.read(),
        delay(opts.idleMs, "timeout" as const),
      ]);

      if (result === "timeout") {
        await reader.cancel();
        terminated = true;
        return;
      }

      const { done, value } = result;
      if (done) {
        terminated = true;
        return;
      }

      yield value;
    }

    await reader.cancel();
    terminated = true;
  } finally {
    if (!terminated) {
      await reader.cancel().catch(() => {});
    }
    reader.releaseLock();
  }
}

async function waitForWebViewSession(
  connector: Connector,
  clientId: string,
  target: TestingTarget,
  initialSessionIds: Set<number>,
): Promise<Session | undefined> {
  let fallbackSession: Session | undefined;

  for (let i = 0; i < 30; i++) {
    await delay(500);
    const sessions = await connector.sendListSessionMessage(clientId);
    const newWebSession = sessions.find((session) =>
      !initialSessionIds.has(session.session_id)
      && (isTargetWebViewSession(session, target) || isWebViewLikeSession(session))
    );
    if (newWebSession) return newWebSession;

    fallbackSession = sessions.find((session) => isTargetWebViewSession(session, target)) ?? fallbackSession;
  }

  return fallbackSession;
}

async function openDouyinWebViewSession(
  t: TestContext,
  connector: Connector,
  clientId: string,
  target: TestingTarget,
): Promise<Session> {
  if (!isHttpUrl(target.openUrl)) {
    throw new Error(`LYNX_DEVTOOL_MCP_TESTING_OPEN_URL must be an HTTP(S) WebView URL, got ${target.openUrl}`);
  }

  await connector.sendAppMessage(clientId, "App.enableWebviewDebug", {});
  await connector.sendAppMessage(clientId, "App.closeSecSwitch", {}).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    t.diagnostic(`App.closeSecSwitch failed before WebView open: ${message}`);
  });

  const initialSessions = await connector.sendListSessionMessage(clientId);
  const initialSessionIds = new Set(initialSessions.map((session) => session.session_id));

  await connector.sendAppMessage(clientId, "App.openPage", { url: target.openUrl });

  const session = await waitForWebViewSession(connector, clientId, target, initialSessionIds);
  if (!session) {
    const sessions = await connector.sendListSessionMessage(clientId);
    throw new Error(
      `Timed out waiting for a Douyin WebView session for ${target.openUrl}. Available sessions: ${
        sessions.map(({ session_id, type, url }) => `${session_id}:${type}:${url}`).join("; ")
      }`,
    );
  }

  await delay(1_000);
  return session;
}

function assertNoRuntimeException(t: TestContext, result: RuntimeResult | RuntimeCompileScriptResult, label: string) {
  if (result.exceptionDetails) {
    t.assert.fail(`${label} returned exceptionDetails: ${JSON.stringify(result.exceptionDetails)}`);
  }
}

function centerOfQuad(quad: number[]): { x: number; y: number } {
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return {
    x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2),
    y: Math.round((Math.min(...ys) + Math.max(...ys)) / 2),
  };
}

function firstResource(tree: FrameResourceTree): { frameId: string; url: string } {
  if (tree.frame.url) {
    return { frameId: tree.frame.id, url: tree.frame.url };
  }

  const resource = tree.resources?.find((item) => item.url);
  if (resource) {
    return { frameId: tree.frame.id, url: resource.url };
  }

  for (const child of tree.childFrames ?? []) {
    return firstResource(child);
  }

  throw new Error("No resource URL found in Page.getResourceTree response");
}

async function collectScriptParsedEvents(
  connector: Connector,
  clientId: string,
  sessionId: number,
  signal: AbortSignal,
): Promise<ScriptParsedEvent[]> {
  await using stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    streamFrom<CdpRequest>([
      { method: "Debugger.disable" },
      { method: "Debugger.enable" },
    ]),
    { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) },
  );

  const scripts: ScriptParsedEvent[] = [];
  for await (const value of readUntilIdle(stream, { idleMs: 1_000, maxMs: 5_000 })) {
    if (
      typeof value === "object" && value !== null && "method" in value && value.method === "Debugger.scriptParsed"
      && "params" in value
    ) {
      const params = value.params as Partial<ScriptParsedEvent>;
      if (typeof params.scriptId === "string") {
        scripts.push({
          scriptId: params.scriptId,
          url: typeof params.url === "string" ? params.url : "",
        });
      }
    }
  }

  return scripts;
}

test("Douyin WebView CDP test matrix matches documented methods minus unsupported WebView extensions", async (t) => {
  const documentedMethods = await listDocumentedCdpMethods();
  const unsupportedMethods = new Set<string>(WEBVIEW_UNSUPPORTED_CDP_METHODS);
  const expectedMethods = documentedMethods.filter((method) => !unsupportedMethods.has(method)).sort();

  t.assert.deepStrictEqual(
    sortedUnique(WEBVIEW_TESTED_CDP_METHODS),
    expectedMethods,
    "Every documented CDP method should be tested for WebView unless it is explicitly unsupported",
  );
  t.assert.equal(
    WEBVIEW_UNSUPPORTED_CDP_METHODS.length,
    18,
    "The WebView unsupported method allowlist should stay explicit",
  );
});

testWithDouyinWebViewClient("Douyin WebView CDP", async (suite, connector, client, target) => {
  const clientId = client.id;

  await suite.test("supports documented CDP methods except explicit WebView gaps", {
    skip: isDouyinTarget(target)
      ? false
      : `Douyin WebView CDP coverage only runs for Douyin targets, got ${target.appPackageName}`,
  }, async (t: TestContext) => {
    if (!isHttpUrl(target.openUrl)) {
      t.skip(`LYNX_DEVTOOL_MCP_TESTING_OPEN_URL must be an HTTP(S) WebView URL, got ${target.openUrl}`);
      return;
    }

    const session = await openDouyinWebViewSession(t, connector, clientId, target);
    const sessionId = session.session_id;
    const cdp = <Output = Record<string, unknown>, Params = Record<string, unknown>>(
      method: string,
      params?: Params,
    ) => connector.sendCDPMessage<Output, Params>(clientId, sessionId, method, params);

    await t.test("Runtime methods", async (t) => {
      await cdp("Runtime.enable", {});

      const fixtureHtml = [
        `<main id="webview-cdp-fixture" data-cdp="fixture"`,
        ` style="box-sizing:border-box;width:180px;height:120px;margin:12px;padding:8px;`,
        `background:rgb(10, 120, 200);color:white;">`,
        `<button id="webview-cdp-button" data-cdp="button">CDP Button</button>`,
        `</main>`,
      ].join("");
      const evaluation = await cdp<RuntimeResult>("Runtime.evaluate", {
        expression: `(() => {
          if (!document.body) {
            document.documentElement.appendChild(document.createElement("body"));
          }
          document.title = "WebView CDP Fixture";
          document.body.innerHTML = ${JSON.stringify(fixtureHtml)};
          globalThis.__webviewCdpValue = { answer: 42, label: "webview" };
          return {
            title: document.title,
            hasFixture: Boolean(document.querySelector("#webview-cdp-fixture")),
          };
        })()`,
        awaitPromise: true,
        returnByValue: true,
      });
      assertNoRuntimeException(t, evaluation, "Runtime.evaluate");
      t.assert.deepStrictEqual(evaluation.result.value, {
        title: "WebView CDP Fixture",
        hasFixture: true,
      });

      const objectEvaluation = await cdp<RuntimeResult>("Runtime.evaluate", {
        expression: "globalThis.__webviewCdpValue",
        objectGroup: "webview-cdp-test",
      });
      assertNoRuntimeException(t, objectEvaluation, "Runtime.evaluate object");
      t.assert.ok(objectEvaluation.result.objectId, "Runtime.evaluate should return an objectId");

      const properties = await cdp<{ result: Array<{ name: string; value?: RemoteObject }> }>(
        "Runtime.getProperties",
        {
          objectId: objectEvaluation.result.objectId,
          ownProperties: true,
        },
      );
      t.assert.ok(
        properties.result.some((property) => property.name === "answer" && property.value?.value === 42),
        "Runtime.getProperties should expose object properties",
      );

      const callResult = await cdp<RuntimeResult>("Runtime.callFunctionOn", {
        objectId: objectEvaluation.result.objectId,
        functionDeclaration: "function() { return `${this.label}:${this.answer}`; }",
        returnByValue: true,
      });
      assertNoRuntimeException(t, callResult, "Runtime.callFunctionOn");
      t.assert.equal(callResult.result.value, "webview:42");

      const lexicalScopeNames = await cdp<{ names: string[] }>("Runtime.globalLexicalScopeNames", {});
      t.assert.ok(Array.isArray(lexicalScopeNames.names), "Runtime.globalLexicalScopeNames should return names");

      const compiled = await cdp<RuntimeCompileScriptResult>("Runtime.compileScript", {
        expression: "globalThis.__webviewCdpCompiled = 41 + 1; globalThis.__webviewCdpCompiled;",
        sourceURL: "webview-cdp-compiled.js",
        persistScript: true,
      });
      assertNoRuntimeException(t, compiled, "Runtime.compileScript");
      t.assert.ok(compiled.scriptId, "Runtime.compileScript should return a scriptId");

      const runResult = await cdp<RuntimeResult>("Runtime.runScript", {
        scriptId: compiled.scriptId,
        returnByValue: true,
      });
      assertNoRuntimeException(t, runResult, "Runtime.runScript");
      t.assert.equal(runResult.result.value, 42);

      const heap = await cdp<{ usedSize: number; totalSize: number }>("Runtime.getHeapUsage", {});
      t.assert.equal(typeof heap.usedSize, "number");
      t.assert.equal(typeof heap.totalSize, "number");

      await cdp("Runtime.setAsyncCallStackDepth", { maxDepth: 0 });
      await cdp("Runtime.discardConsoleEntries", {});
    });

    let rootNodeId = 0;
    let fixtureNodeId = 0;
    let buttonNodeId = 0;
    let boxCenter = { x: 0, y: 0 };

    await t.test("DOM methods", async (t) => {
      await cdp("DOM.enable", {});

      const document = await cdp<{ root: DomNode }>("DOM.getDocument", { depth: -1, pierce: true });
      rootNodeId = document.root.nodeId;
      t.assert.equal(document.root.nodeName, "#document");

      const fixture = await cdp<{ nodeId: number }>("DOM.querySelector", {
        nodeId: rootNodeId,
        selector: "#webview-cdp-fixture",
      });
      fixtureNodeId = fixture.nodeId;
      t.assert.ok(fixtureNodeId > 0, "DOM.querySelector should find the fixture");

      const button = await cdp<{ nodeId: number }>("DOM.querySelector", {
        nodeId: rootNodeId,
        selector: "#webview-cdp-button",
      });
      buttonNodeId = button.nodeId;
      t.assert.ok(buttonNodeId > 0, "DOM.querySelector should find the button");

      const allFixtureNodes = await cdp<{ nodeIds: number[] }>("DOM.querySelectorAll", {
        nodeId: rootNodeId,
        selector: "[data-cdp]",
      });
      t.assert.ok(allFixtureNodes.nodeIds.length >= 2, "DOM.querySelectorAll should find fixture nodes");

      const description = await cdp<{ node: DomNode }>("DOM.describeNode", {
        nodeId: fixtureNodeId,
        depth: 1,
      });
      t.assert.equal(description.node.nodeName, "MAIN");

      const attributes = await cdp<{ attributes: string[] }>("DOM.getAttributes", { nodeId: fixtureNodeId });
      t.assert.ok(attributes.attributes.includes("data-cdp"), "DOM.getAttributes should include fixture attributes");

      await cdp("DOM.setAttributesAsText", {
        nodeId: fixtureNodeId,
        text: "data-cdp-updated=\"true\"",
        name: "data-cdp-updated",
      });
      const updatedAttributes = await cdp<{ attributes: string[] }>("DOM.getAttributes", { nodeId: fixtureNodeId });
      t.assert.ok(
        updatedAttributes.attributes.includes("data-cdp-updated"),
        "DOM.setAttributesAsText should update attributes",
      );

      const outerHtml = await cdp<{ outerHTML: string }>("DOM.getOuterHTML", { nodeId: fixtureNodeId });
      t.assert.match(outerHtml.outerHTML, /webview-cdp-fixture/);

      await cdp("DOM.requestChildNodes", { nodeId: fixtureNodeId, depth: 1 });
      await cdp("DOM.scrollIntoViewIfNeeded", { nodeId: fixtureNodeId });

      const box = await cdp<{ model: BoxModel }>("DOM.getBoxModel", { nodeId: fixtureNodeId });
      t.assert.ok(Array.isArray(box.model.content), "DOM.getBoxModel should return content quad");
      boxCenter = centerOfQuad(box.model.content);

      const nodeForLocation = await cdp<{ nodeId?: number; backendNodeId?: number }>("DOM.getNodeForLocation", {
        x: boxCenter.x,
        y: boxCenter.y,
      });
      t.assert.ok(
        typeof nodeForLocation.nodeId === "number" || typeof nodeForLocation.backendNodeId === "number",
        "DOM.getNodeForLocation should identify a node",
      );

      const search = await cdp<{ searchId: string; resultCount: number }>("DOM.performSearch", {
        query: "webview-cdp-fixture",
      });
      t.assert.ok(search.searchId, "DOM.performSearch should return searchId");
      t.assert.ok(search.resultCount > 0, "DOM.performSearch should find the fixture");

      const results = await cdp<{ nodeIds: number[] }>("DOM.getSearchResults", {
        searchId: search.searchId,
        fromIndex: 0,
        toIndex: Math.min(search.resultCount, 1),
      });
      t.assert.ok(Array.isArray(results.nodeIds), "DOM.getSearchResults should return nodeIds");

      await cdp("DOM.discardSearchResults", { searchId: search.searchId });
    });

    await t.test("CSS methods", async (t) => {
      await cdp("CSS.enable", {});

      const computed = await cdp<{ computedStyle: Array<{ name: string; value: string }> }>(
        "CSS.getComputedStyleForNode",
        { nodeId: fixtureNodeId },
      );
      t.assert.ok(
        computed.computedStyle.some((item) => item.name === "background-color"),
        "CSS.getComputedStyleForNode should include background-color",
      );

      const inline = await cdp<{ inlineStyle?: unknown; attributesStyle?: unknown }>(
        "CSS.getInlineStylesForNode",
        { nodeId: fixtureNodeId },
      );
      t.assert.ok(
        typeof inline === "object" && inline !== null,
        "CSS.getInlineStylesForNode should return a style object",
      );

      const matched = await cdp<Record<string, unknown>>("CSS.getMatchedStylesForNode", { nodeId: fixtureNodeId });
      t.assert.ok(
        typeof matched === "object" && matched !== null,
        "CSS.getMatchedStylesForNode should return matched style data",
      );

      const backgrounds = await cdp<Record<string, unknown>>("CSS.getBackgroundColors", { nodeId: fixtureNodeId });
      t.assert.ok(
        Object.hasOwn(backgrounds, "backgroundColors") || Object.hasOwn(backgrounds, "computedFontSize")
          || Object.keys(backgrounds).length === 0,
        "CSS.getBackgroundColors should return a valid CDP result object",
      );

      await cdp("CSS.disable", {}).catch(() => {});
    });

    await t.test("Overlay and Input methods", async () => {
      await cdp("Overlay.enable", {});
      await cdp("Overlay.highlightNode", {
        nodeId: fixtureNodeId,
        highlightConfig: {
          showInfo: true,
          contentColor: { r: 10, g: 120, b: 200, a: 0.35 },
          borderColor: { r: 255, g: 255, b: 255, a: 0.8 },
        },
      });
      await cdp("Overlay.hideHighlight", {});

      await cdp("Input.emulateTouchFromMouseEvent", {
        type: "mouseMoved",
        x: boxCenter.x,
        y: boxCenter.y,
        button: "none",
        timestamp: Date.now() / 1000,
      });
    });

    await t.test("Page methods", async (t) => {
      await cdp("Page.enable", {});

      const resourceTree = await cdp<{ frameTree: FrameResourceTree }>("Page.getResourceTree", {});
      const resource = firstResource(resourceTree.frameTree);

      const content = await cdp<{ content: string; base64Encoded: boolean }>("Page.getResourceContent", {
        frameId: resource.frameId,
        url: resource.url,
      });
      t.assert.equal(typeof content.content, "string");
      t.assert.equal(typeof content.base64Encoded, "boolean");

      await cdp("Page.disable", {}).catch(() => {});
    });

    await t.test("Performance methods", async (t) => {
      const result = await cdp<Record<string, never>>("Performance.enable", {});
      t.assert.deepStrictEqual(result, {}, "Performance.enable should return an empty result");
      await cdp("Performance.disable", {});
    });

    await t.test("Debugger methods", async (t) => {
      const scripts = await collectScriptParsedEvents(connector, clientId, sessionId, t.signal);
      t.assert.ok(scripts.length > 0, "Debugger.enable should emit scriptParsed events");

      const script = scripts.find((item) => item.url.includes("webview-cdp-compiled.js"))
        ?? scripts.find((item) => item.url)
        ?? scripts[0];
      const source = await cdp<{ scriptSource: string }>("Debugger.getScriptSource", {
        scriptId: script.scriptId,
      });
      t.assert.equal(typeof source.scriptSource, "string");
    });

    await t.test("Disable and reload methods", async () => {
      await cdp("Runtime.disable", {});
      await cdp("DOM.disable", {});
      await cdp("Page.reload", { ignoreCache: true });
    });
  });
});
