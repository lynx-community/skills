// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { testWithClient } from "@lynx-js/devtool-connector/test-with-client";
import fs from "node:fs/promises";
import type { TestContext } from "node:test";
import { setTimeout } from "node:timers/promises";
import { DescribeNode } from "../src/tools/DOM/DescribeNode.ts";
import { GetAttributes } from "../src/tools/DOM/GetAttributes.ts";
import { GetBoxModel } from "../src/tools/DOM/GetBoxModel.ts";
import { GetDocument } from "../src/tools/DOM/GetDocument.ts";
import { GetDocumentWithBoxModel } from "../src/tools/DOM/GetDocumentWithBoxModel.ts";
import { GetNodeForLocation } from "../src/tools/DOM/GetNodeForLocation.ts";
import { GetOriginalNodeIndex } from "../src/tools/DOM/GetOriginalNodeIndex.ts";
import { GetSearchResults } from "../src/tools/DOM/GetSearchResults.ts";
import { InnerText } from "../src/tools/DOM/InnerText.ts";
import { PerformSearch } from "../src/tools/DOM/PerformSearch.ts";
import { PushNodesByBackendIdsToFrontend } from "../src/tools/DOM/PushNodesByBackendIdsToFrontend.ts";
import { QuerySelector } from "../src/tools/DOM/QuerySelector.ts";
import { QuerySelectorAll } from "../src/tools/DOM/QuerySelectorAll.ts";
import { RequestChildNodes } from "../src/tools/DOM/RequestChildNodes.ts";
import { ScrollIntoViewIfNeeded } from "../src/tools/DOM/ScrollIntoViewIfNeeded.ts";
import { SetAttributesAsText } from "../src/tools/DOM/SetAttributesAsText.ts";
import { TakeHeapSnapshot } from "../src/tools/HeapProfiler/TakeHeapSnapshot.ts";
import { GetVersion } from "../src/tools/Lynx/GetVersion.ts";
import { GetResourceContent } from "../src/tools/Page/GetResourceContent.ts";
import { GetResourceTree } from "../src/tools/Page/GetResourceTree.ts";
import { GetAllPerformanceEntries } from "../src/tools/Performance/GetAllPerformanceEntries.ts";
import { GetAllTimingInfo } from "../src/tools/Performance/GetAllTimingInfo.ts";
import { Evaluate } from "../src/tools/Runtime/Evaluate.ts";
import { GetHeapUsage } from "../src/tools/Runtime/GetHeapUsage.ts";
import { GetProperties } from "../src/tools/Runtime/GetProperties.ts";
import { GetLynxUITree } from "../src/tools/UITree/GetLynxUITree.ts";
import type {
  DescribeNodeResponse,
  GetAllPerformanceEntriesResponse,
  GetAttributesResponse,
  GetBoxModelResponse,
  GetDocumentResponse,
  GetLynxUITreeResponse,
  GetOriginalNodeIndexResponse,
  GetSearchResultsResponse,
  InnerTextResponse,
  Node,
  PerformSearchResponse,
  PushNodesByBackendIdsToFrontendResponse,
  QuerySelectorAllResponse,
  QuerySelectorResponse,
  UITreeNode,
} from "../test/utils/cdp-types.ts";
import { createToolContext } from "../test/utils/testTool.ts";

function flattenUITree(node: UITreeNode): UITreeNode[] {
  return [node, ...(node.children ?? []).flatMap(flattenUITree)];
}

function findFirstElementNode(node: Node): Node | undefined {
  if (node.nodeType === 1) {
    return node;
  }

  for (const child of node.children ?? []) {
    const found = findFirstElementNode(child);
    if (found) return found;
  }

  return undefined;
}

function hasLynx4Metadata(node: UITreeNode): node is UITreeNode & {
  tagName: string;
  nodeIndex: number;
  props: Record<string, unknown>;
  label: string;
} {
  return typeof node.tagName === "string"
    && typeof node.nodeIndex === "number"
    && typeof node.props === "object"
    && node.props !== null
    && !Array.isArray(node.props)
    && typeof node.label === "string";
}

testWithClient("Tools", async (suite, connector, client, target) => {
  await setTimeout(1000);
  const clientId = client.id;

  const latestSessionId = async () => {
    const sessions = await connector.sendListSessionMessage(clientId);
    return sessions[sessions.length - 1]?.session_id;
  };

  await suite.test("DOM.getDocument", async (t: TestContext) => {
    const { call } = createToolContext(GetDocument, connector, clientId);
    const tree = await call<GetDocumentResponse>({});

    if (typeof tree === "object" && tree !== null) {
      t.assert.ok(tree.root);
      t.assert.equal(tree.root.nodeName, "#document");
    } else {
      t.assert.fail("Response should be a DOM tree object");
    }

    const countNodes = (node: Node): number =>
      1 + (node.children ?? []).reduce((sum, child) => sum + countNodes(child), 0);
    const depthZeroTree = await call<GetDocumentResponse>({ depth: 0 });
    const fullTree = await call<GetDocumentResponse>({ depth: -1 });

    t.assert.ok(depthZeroTree.root, "Depth 0 should return a root node");
    t.assert.equal(depthZeroTree.root.nodeName, "#document", "Depth 0 should return the document root");
    t.assert.ok(fullTree.root, "Depth -1 should return a root node");
    t.assert.equal(fullTree.root.nodeName, "#document", "Depth -1 should return the document root");
    t.assert.ok(
      countNodes(fullTree.root) > countNodes(depthZeroTree.root),
      "Depth -1 should include more descendants than depth 0",
    );
  });

  await suite.test("DOM.describeNode", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse, { depth: number }>(
      clientId,
      sessionId!,
      "DOM.getDocument",
      {
        depth: -1,
      },
    );
    t.assert.ok(root, "Should have a root node");

    const findElementWithChildren = (node: Node): Node | undefined => {
      if (
        node.nodeType === 1 && node.nodeName !== "PAGE" && (node.childNodeCount ?? 0) > 0
        && node.children?.length === node.childNodeCount
      ) {
        return node;
      }
      for (const child of node.children ?? []) {
        const found = findElementWithChildren(child);
        if (found) return found;
      }
      return undefined;
    };

    const targetNode = findElementWithChildren(root);
    t.assert.ok(targetNode, "Should find an element with children");

    const { call } = createToolContext(DescribeNode, connector, clientId);
    const depthZeroResult = await call<DescribeNodeResponse>({
      nodeId: targetNode.nodeId,
      depth: 0,
    });
    const depthOneResult = await call<DescribeNodeResponse>({
      nodeId: targetNode.nodeId,
      depth: 1,
    });

    t.assert.equal(depthZeroResult.compress, false, "Should disable compression for tool output");
    t.assert.equal(depthZeroResult.node?.nodeId, targetNode.nodeId, "Should describe the requested node");
    t.assert.equal(
      depthZeroResult.node?.childNodeCount,
      targetNode.childNodeCount,
      "Should keep child count at depth 0",
    );
    t.assert.equal(depthZeroResult.node?.children, undefined, "Depth 0 should not include children");

    t.assert.equal(depthOneResult.node?.nodeId, targetNode.nodeId, "Depth 1 should describe the same node");
    t.assert.ok(Array.isArray(depthOneResult.node?.children), "Depth 1 should include direct children");
    t.assert.equal(
      depthOneResult.node?.children?.length,
      targetNode.childNodeCount,
      "Depth 1 should include exactly the direct children",
    );
    t.assert.equal(
      depthOneResult.node?.children?.[0]?.children,
      undefined,
      "Depth 1 should not include grandchildren",
    );
  });

  await suite.test("DOM.querySelector", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");
    const rootNodeId = root.nodeId;

    const { call } = createToolContext(QuerySelector, connector, clientId);
    const result = await call<QuerySelectorResponse>({
      nodeId: rootNodeId,
      selector: "*",
    });

    t.assert.ok(result.nodeId, "Should return a nodeId");
  });

  await suite.test("DOM.querySelectorAll", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");
    const rootNodeId = root.nodeId;

    const { call } = createToolContext(QuerySelectorAll, connector, clientId);
    const result = await call<QuerySelectorAllResponse>({
      nodeId: rootNodeId,
      selector: "*",
    });

    t.assert.ok(Array.isArray(result.nodeIds), "Should return an array of nodeIds");
  });

  await suite.test("DOM.getAttributes", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");

    const nodeId = root.children?.[0]?.nodeId ?? root.nodeId;

    const { call } = createToolContext(GetAttributes, connector, clientId);
    const result = await call<GetAttributesResponse>({
      nodeId,
    });

    t.assert.ok(Array.isArray(result.attributes), "Should return an array of attributes");
  });

  await suite.test("DOM.setAttributesAsText updates node attributes", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse, { depth: number }>(
      clientId,
      sessionId!,
      "DOM.getDocument",
      { depth: -1 },
    );
    const targetNode = findFirstElementNode(root);
    t.assert.ok(targetNode, "Should find an element node");

    const { call: setAttributes } = createToolContext(SetAttributesAsText, connector, clientId);
    await setAttributes<Record<string, unknown>>({
      nodeId: targetNode.nodeId,
      text: "style=\"opacity: 0.99;\"",
      name: "style",
    });

    const { call: getAttributes } = createToolContext(GetAttributes, connector, clientId);
    const result = await getAttributes<GetAttributesResponse>({
      nodeId: targetNode.nodeId,
    });

    t.assert.ok(result.attributes.includes("style"), "Updated node should include the style attribute");
  });

  await suite.test("DOM.getBoxModel", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse, { depth: number }>(
      clientId,
      sessionId!,
      "DOM.getDocument",
      {
        depth: -1,
      },
    );
    t.assert.ok(root, "Should have a root node");

    const findLayoutNode = (node: Node): number | undefined => {
      if (
        node.nodeType === 1 && node.nodeName !== "HTML" && node.nodeName !== "BODY" && node.nodeName !== "#document"
      ) {
        return node.nodeId;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findLayoutNode(child);
          if (found) return found;
        }
      }
      return undefined;
    };

    const nodeId = findLayoutNode(root);
    t.assert.ok(nodeId, "Should find a node with layout");

    const { call } = createToolContext(GetBoxModel, connector, clientId);
    const result = await call<GetBoxModelResponse>({
      nodeId,
    });

    t.assert.ok(result.model, "Should return a box model");
    t.assert.ok(result.model.content, "Should have content box");
  });

  await suite.test("DOM.getDocumentWithBoxModel", async (t: TestContext) => {
    const { call } = createToolContext(GetDocumentWithBoxModel, connector, clientId);
    const result = await call<GetDocumentResponse>({});

    t.assert.ok(result.root, "Should return a root node");

    const hasBoxModel = (node: Node): boolean => {
      if (node.box_model) return true;
      if (node.children) {
        return node.children.some(hasBoxModel);
      }
      return false;
    };

    t.assert.ok(hasBoxModel(result.root), "Some node in the tree should have box_model");
  });

  await suite.test("DOM.getNodeForLocation", async (t: TestContext) => {
    const { call } = createToolContext(GetNodeForLocation, connector, clientId);
    const result = await call<QuerySelectorResponse>({
      x: 100,
      y: 100,
    });

    t.assert.ok(result.nodeId, "Should return a nodeId");
  });

  await suite.test("DOM.innerText", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");

    const nodeId = root.nodeId;

    const { call } = createToolContext(InnerText, connector, clientId);
    const result = await call<InnerTextResponse>({
      nodeId,
    });

    t.assert.ok(result.nodeId, "Should return nodeId");
    t.assert.ok(Array.isArray(result.rawTextValues), "Should return rawTextValues array");
  });

  await suite.test("DOM.getOriginalNodeIndex", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");

    const nodeId = root.children?.[0]?.nodeId ?? root.nodeId;

    const { call } = createToolContext(GetOriginalNodeIndex, connector, clientId);
    const result = await call<GetOriginalNodeIndexResponse>({
      nodeId,
    });

    t.assert.ok(result.nodeIndex !== undefined, "Should return a nodeIndex");
  });

  await suite.test("DOM.performSearch", async (t: TestContext) => {
    const { call } = createToolContext(PerformSearch, connector, clientId);
    const result = await call<PerformSearchResponse>({
      query: "*",
    });

    t.assert.ok(result.searchId, "Should return a searchId");
    t.assert.ok(result.resultCount !== undefined, "Should return a resultCount");
  });

  await suite.test("DOM.getSearchResults", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { searchId, resultCount } = await connector.sendCDPMessage<PerformSearchResponse, { query: string }>(
      clientId,
      sessionId!,
      "DOM.performSearch",
      {
        query: "*",
      },
    );
    t.assert.ok(searchId, "Should have a searchId");

    const { call } = createToolContext(GetSearchResults, connector, clientId);
    const result = await call<GetSearchResultsResponse>({
      searchId,
      fromIndex: 0,
      toIndex: Math.min(resultCount, 1),
    });

    t.assert.ok(Array.isArray(result.nodeIds), "Should return an array of nodeIds");
  });

  await suite.test("DOM.pushNodesByBackendIdsToFrontend", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");
    t.assert.ok(root.backendNodeId, "Root should have backendNodeId");

    const { call } = createToolContext(PushNodesByBackendIdsToFrontend, connector, clientId);
    const result = await call<PushNodesByBackendIdsToFrontendResponse>({
      backendNodeIds: [root.backendNodeId],
    });

    t.assert.ok(Array.isArray(result.nodeIds), "Should return an array of nodeIds");
  });

  await suite.test("DOM.requestChildNodes", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");

    const { call } = createToolContext(RequestChildNodes, connector, clientId);
    const result = await call<Record<string, unknown>>({
      nodeId: root.nodeId,
      depth: 1,
    });

    t.assert.ok(result, "Should return a result (likely empty object)");
  });

  await suite.test("DOM.scrollIntoViewIfNeeded", async (t: TestContext) => {
    const sessionId = await latestSessionId();
    t.assert.ok(sessionId, "Should have a sessionId");

    const { root } = await connector.sendCDPMessage<GetDocumentResponse>(clientId, sessionId!, "DOM.getDocument");
    t.assert.ok(root, "Should have a root node");

    const nodeId = root.children?.[0]?.nodeId ?? root.nodeId;

    const { call } = createToolContext(ScrollIntoViewIfNeeded, connector, clientId);
    const result = await call<Record<string, unknown>>({
      nodeId,
    });

    t.assert.ok(result, "Should return a result");
  });

  await suite.test("Page.getResourceTree and Page.getResourceContent", async (t: TestContext) => {
    const { call: getTree } = createToolContext(GetResourceTree, connector, clientId);
    const tree = await getTree<{ frameTree?: { frame?: { id?: string; url?: string }; resources?: unknown[] } }>({});

    t.assert.ok(typeof tree === "object" && tree !== null, "Should return a resource tree object");
    t.assert.ok(tree.frameTree, "Should include frameTree");

    const { call: getContent } = createToolContext(GetResourceContent, connector, clientId);
    const content = await getContent<{ content: string; base64Encoded: boolean }>({
      url: tree.frameTree?.frame?.url ?? target.pageUrl,
      frameId: tree.frameTree?.frame?.id,
    });

    t.assert.equal(typeof content.content, "string", "Should return resource content");
    t.assert.equal(typeof content.base64Encoded, "boolean", "Should report whether the content is base64 encoded");
  });

  await suite.test("Lynx.getVersion", {
    skip: target.appPackageName === "EmbeddedLynx"
      ? "EmbeddedLynx does not support Lynx.getVersion (for now)"
      : false,
  }, async (t: TestContext) => {
    const { call } = createToolContext(GetVersion, connector, clientId);
    const version = await call<string>({});

    t.assert.equal(typeof version, "string", "Should return a version string");
    t.assert.ok(version.length > 0, "Version string should not be empty");
  });

  await suite.test("Runtime.evaluate and Runtime.getProperties inspect an object", async (t: TestContext) => {
    const { call: evaluate } = createToolContext(Evaluate, connector, clientId);
    const evaluated = await evaluate<{
      result?: { objectId?: string; type?: string; description?: string };
    }>({
      expression: "({ answer: 42, label: 'lynx-use' })",
      objectGroup: "mcp-tools-test",
      generatePreview: true,
    });

    const objectId = evaluated.result?.objectId;
    t.assert.equal(typeof objectId, "string", "Evaluation result should include an objectId");

    const { call: getProperties } = createToolContext(GetProperties, connector, clientId);
    const properties = await getProperties<{
      result?: Array<{ name: string; value?: { value?: unknown; type?: string } }>;
    }>({
      objectId: objectId!,
      ownProperties: true,
    });

    const answer = properties.result?.find(({ name }) => name === "answer");
    t.assert.ok(answer, "Should include the evaluated object's answer property");
    if (answer?.value && "value" in answer.value) {
      t.assert.equal(answer.value.value, 42, "answer should preserve its numeric value when returned by value");
    }
  });

  await suite.test("Runtime.getHeapUsage", async (t: TestContext) => {
    const { call } = createToolContext(GetHeapUsage, connector, clientId);
    const result = await call<{ usedSize: number; totalSize: number }>({});

    t.assert.ok(typeof result.usedSize === "number", "Should return usedSize");
    t.assert.ok(typeof result.totalSize === "number", "Should return totalSize");
  });

  await suite.test("Runtime.getHeapUsage supports the main thread", async (t: TestContext) => {
    const { call } = createToolContext(GetHeapUsage, connector, clientId);
    const result = await call<{ usedSize: number; totalSize: number }>({
      thread: "main",
    });

    t.assert.ok(typeof result.usedSize === "number", "Should return usedSize");
    t.assert.ok(typeof result.totalSize === "number", "Should return totalSize");
  });

  await suite.test("UITree.getLynxUITree returns an uncompressed native UI tree", async (t: TestContext) => {
    if (target.appPackageName === "EmbeddedLynx") {
      t.skip("EmbeddedLynx does not support UITree.getLynxUITree yet");
      return;
    }

    const { call } = createToolContext(GetLynxUITree, connector, clientId);
    const result = await call<GetLynxUITreeResponse>({});

    t.assert.equal(result.compress, false, "Should request an uncompressed UITree response");
    t.assert.ok(result.root, "Should return a UITree root");
    t.assert.ok(typeof result.root.name === "string", "Root should include the native class name");
    t.assert.ok(typeof result.root.id === "number", "Root should include the native UI id");
    t.assert.ok(Array.isArray(result.root.children), "Root should include child UI nodes");

    const nodes = flattenUITree(result.root);
    t.assert.ok(nodes.length > 0, "Should include at least one UI node");

    const nodeWithFrame = nodes.find(node => Array.isArray(node.frame));
    if (!nodeWithFrame?.frame) {
      t.assert.fail("Should include frame data for at least one UI node");
      return;
    }
    t.assert.equal(nodeWithFrame.frame.length, 4, "Frame should be [x, y, width, height]");
    for (const value of nodeWithFrame.frame) {
      t.assert.ok(typeof value === "number", "Frame values should be numbers");
    }
  });

  await suite.test("UITree.getLynxUITree exposes Lynx 4 metadata fields", async (t: TestContext) => {
    if (target.appPackageName === "EmbeddedLynx") {
      t.skip("EmbeddedLynx does not support UITree.getLynxUITree yet");
      return;
    }

    const { call } = createToolContext(GetLynxUITree, connector, clientId);
    const result = await call<GetLynxUITreeResponse>({});
    const nodes = flattenUITree(result.root);

    const metadataNode = nodes.find(hasLynx4Metadata);

    if (!metadataNode) {
      t.assert.fail("Should include Lynx 4 UI metadata on at least one node");
      return;
    }
    t.assert.ok(metadataNode.nodeIndex >= 0, "nodeIndex should map to a non-negative DOM node index");
    t.assert.ok(metadataNode.tagName.length > 0, "tagName should be readable");
  });

  await suite.test("Performance.getAllTimingInfo", async (t: TestContext) => {
    if (target.appPackageName === "EmbeddedLynx") {
      t.skip("EmbeddedLynx does not support Performance.getAllTimingInfo yet");
      return;
    }
    const { call } = createToolContext(GetAllTimingInfo, connector, clientId);
    const result = await call<Record<string, unknown>>({});

    t.assert.ok(typeof result === "object" && result !== null, "Should return a timing info object");

    const timing = result as Record<string, unknown>;

    t.assert.ok(typeof timing.url === "string", "Should include url");
    t.assert.ok(typeof timing.has_reload === "number", "Should include has_reload");
    t.assert.ok(typeof timing.thread_strategy === "number", "Should include thread_strategy");

    const metrics = timing.metrics;
    t.assert.ok(typeof metrics === "object" && metrics !== null, "Should include metrics object");
    // Some engine timing metrics are flaky across transport CI runs.
    t.assert.ok(
      typeof (metrics as Record<string, unknown>).lynx_tti === "number",
      "metrics.lynx_tti should be a number",
    );
    // Container-level metrics depend on extra timing from the host app. They are useful when present,
    // but not guaranteed by the engine timing contract.
    for (const key of ["fcp", "tti", "total_fcp", "total_tti"]) {
      if (Object.hasOwn(metrics as Record<string, unknown>, key)) {
        t.assert.ok(
          typeof (metrics as Record<string, unknown>)[key] === "number",
          `metrics.${key} should be a number when present`,
        );
      }
    }

    const setupTiming = timing.setup_timing;
    t.assert.ok(typeof setupTiming === "object" && setupTiming !== null, "Should include setup_timing object");
    for (const key of ["pipeline_start", "load_template_start", "load_template_end", "draw_end"]) {
      t.assert.ok(
        typeof (setupTiming as Record<string, unknown>)[key] === "number",
        `setup_timing.${key} should be a number`,
      );
    }

    const extraTiming = timing.extra_timing;
    t.assert.ok(typeof extraTiming === "object" && extraTiming !== null, "Should include extra_timing object");
    for (const key of ["open_time", "container_init_start", "container_init_end"]) {
      t.assert.ok(
        typeof (extraTiming as Record<string, unknown>)[key] === "number",
        `extra_timing.${key} should be a number`,
      );
    }

    t.assert.ok(typeof timing.update_timings === "object", "Should include update_timings object");
  });

  await suite.test("Performance.getAllPerformanceEntries", async (t: TestContext) => {
    const { call } = createToolContext(GetAllPerformanceEntries, connector, clientId);
    const result = await call<GetAllPerformanceEntriesResponse>({});

    t.assert.ok(typeof result === "object" && result !== null, "Should return a performance entries object");
    t.assert.ok(Array.isArray(result.entries), "Should include entries array");

    for (const entry of result.entries) {
      t.assert.ok(typeof entry === "object" && entry !== null, "Each entry should be an object");

      if (Object.hasOwn(entry, "entryType")) {
        t.assert.ok(typeof entry.entryType === "string", "entry.entryType should be a string when present");
      }
      if (Object.hasOwn(entry, "name")) {
        t.assert.ok(typeof entry.name === "string", "entry.name should be a string when present");
      }
      if (Object.hasOwn(entry, "instanceId")) {
        t.assert.ok(typeof entry.instanceId === "number", "entry.instanceId should be a number when present");
      }
    }
  });

  await suite.test("HeapProfiler.takeHeapSnapshot saves a background snapshot filename by default", async (t: TestContext) => {
    if (target.appPackageName === "EmbeddedLynx") {
      t.skip("EmbeddedLynx does not support background-thread heap snapshots yet");
      return;
    }
    const { call } = createToolContext(TakeHeapSnapshot, connector, clientId);
    const result = await call<string>({});

    t.assert.ok(typeof result === "string", "Should return a string");
    t.assert.match(
      result,
      /Heap snapshot saved to .*heap-background-\d+\.heapsnapshot$/,
      "Should save a background snapshot by default",
    );
  });

  await suite.test("HeapProfiler.takeHeapSnapshot saves a main-thread snapshot filename when requested", async (t: TestContext) => {
    const { call } = createToolContext(TakeHeapSnapshot, connector, clientId);
    const result = await call<string>({
      thread: "main",
    });

    t.assert.ok(typeof result === "string", "Should return a string");
    t.assert.match(
      result,
      /Heap snapshot saved to .*heap-main-\d+\.heapsnapshot$/,
      "Should save a main-thread snapshot when requested",
    );

    const filePath = result.replace("Heap snapshot saved to ", "");

    try {
      const content = await fs.readFile(filePath, "utf8");
      const snapshot = JSON.parse(content) as { strings?: string[] };

      t.assert.ok(
        Array.isArray(snapshot.strings),
        "Main-thread heap snapshot should include strings array",
      );
      t.assert.ok(
        snapshot.strings.includes("renderPage"),
        "Main-thread heap snapshot should include renderPage",
      );
      t.assert.ok(
        snapshot.strings.includes("updatePage"),
        "Main-thread heap snapshot should include updatePage",
      );
      t.assert.ok(
        snapshot.strings.includes("updateGlobalProps"),
        "Main-thread heap snapshot should include updateGlobalProps",
      );
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  });
});
