// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { once } from "node:events";
import { ReadableStream, type ReadableStreamDefaultController, WritableStream } from "node:stream/web";
import { test, type TestContext } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { type ClientOptions, WebSocket } from "ws";
import type { CdpMessage } from "../src/daemon/cdp-adapter.ts";
import { DAEMON_CDP_HOST_PATH, DAEMON_CDP_PATH } from "../src/daemon/protocol.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import type { Connection, Transport } from "../src/transport/transport.ts";

const CLIENT_ID = "device:8901";
const VIEW_ID = "view-1234";

type Quad = [number, number, number, number, number, number, number, number];

function rect(left: number, top: number, right: number, bottom: number): Quad {
  return [left, top, right, top, right, bottom, left, bottom];
}

/**
 * A Lynx App on a 400×800 dp screen: session 1 fills the screen and session 2 is a 200×200 card at
 * (100, 100). Session 3, when listed, fills the screen as well, like a page an Activity covers, and
 * session 5 is a WebView whose frames and boxes use its own 400×600 viewport. The top 50 dp hold native
 * UI without nodes. Hit tests report both ids, which differ, so mixing them up fails.
 */
const SESSIONS = {
  1: {
    documentId: 1,
    rootId: 10,
    root: rect(0, 0, 400, 800),
    nodeId: 11,
    backendNodeId: 111,
    node: rect(0, 600, 400, 800),
  },
  2: {
    documentId: 2,
    rootId: 20,
    root: rect(100, 100, 300, 300),
    nodeId: 21,
    backendNodeId: 121,
    node: rect(150, 150, 250, 250),
  },
  3: {
    documentId: 3,
    rootId: 30,
    root: rect(0, 0, 400, 800),
    nodeId: 31,
    backendNodeId: 131,
    node: rect(0, 600, 400, 800),
  },
  5: {
    documentId: 5,
    rootId: 50,
    root: rect(0, 0, 400, 600),
    nodeId: 51,
    backendNodeId: 151,
    node: rect(0, 0, 400, 100),
    screen: { deviceWidth: 400, deviceHeight: 600 },
  },
} as const;

class FakeLynxApp implements Transport {
  /** CDP requests that reached the App, with the Lynx session they targeted. */
  readonly requests: (CdpMessage & { session: unknown })[] = [];
  sessions: { session_id: number; type: string; url: string }[] = [
    { session_id: 1, type: "lynx", url: "a" },
    { session_id: 2, type: "lynx", url: "b" },
  ];
  /** Returns true to leave a request unanswered, or to answer it itself later. */
  hold: ((request: CdpMessage & { session: unknown }) => boolean) | null = null;
  #output: ReadableStreamDefaultController<unknown> | null = null;

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: "device", os: "Android" as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
    const readable = new ReadableStream<unknown>({
      start: (controller) => {
        this.#output = controller;
      },
    });
    const writable = new WritableStream<unknown>({ write: chunk => this.#receive(chunk) });
    return {
      readable: readable as ReadableStream<TOutput>,
      writable: writable as WritableStream<TInput>,
      [Symbol.asyncDispose]: async () => this.disconnect(),
    };
  }

  disconnect(): void {
    try {
      this.#output?.close();
    } catch {
      // Already closed.
    }
  }

  /** Announces the current sessions, as Lynx does when a LynxView opens or closes. */
  emitSessions(): void {
    this.#emit("SessionList", this.sessions);
  }

  emitEvent(session: number, event: CdpMessage): void {
    this.#reply(session, event);
  }

  #emit(type: string, data: unknown): void {
    this.#output?.enqueue({ event: "Customized", data: { type, data, sender: 8901 } });
  }

  #reply(session: unknown, message: CdpMessage): void {
    this.#emit("CDP", { client_id: 8901, session_id: session, message: JSON.stringify(message) });
  }

  #receive(chunk: unknown): void {
    const message = chunk as {
      event?: string;
      data?: { type?: string; data?: { session_id?: unknown; message?: unknown } };
    };
    if (message.event === "Initialize") {
      this.#output?.enqueue({ event: "Register", data: { id: 8901, info: { App: "FakeLynx", sdkVersion: "3.0" } } });
      return;
    }
    if (message.event !== "Customized") return;
    if (message.data?.type === "ListSession") {
      this.emitSessions();
      return;
    }
    if (message.data?.type !== "CDP") return;
    const session = message.data.data?.session_id;
    const request = message.data.data?.message as CdpMessage;
    this.requests.push({ ...request, session });
    if (this.hold?.({ ...request, session })) return;
    const model = SESSIONS[session as keyof typeof SESSIONS];
    const id = request.id!;
    switch (request.method) {
      case "DOM.getDocument":
        this.#reply(session, {
          id,
          result: { root: { nodeId: model.documentId, children: [{ nodeId: model.rootId }] } },
        });
        return;
      case "DOM.getBoxModel": {
        const { nodeId, backendNodeId } = request.params ?? {};
        const quad = nodeId === model.rootId
          ? model.root
          : nodeId === model.nodeId || backendNodeId === model.backendNodeId
          ? model.node
          : null;
        this.#reply(
          session,
          quad ? { id, result: { model: { border: quad } } } : { id, error: { code: -32000, message: "No node" } },
        );
        return;
      }
      case "DOM.getNodeForLocation":
        // Lynx reports `{nodeId: 0}` where no node is.
        this.#reply(session, {
          id,
          result: Number(request.params?.["y"]) < 50
            ? { nodeId: 0 }
            : { nodeId: model.nodeId, backendNodeId: model.backendNodeId },
        });
        return;
      case "Page.startScreencast":
        this.#reply(session, { id, result: {} });
        this.#reply(session, {
          method: "Page.screencastFrame",
          params: {
            data: "",
            sessionId: 1,
            metadata: {
              deviceWidth: 400,
              deviceHeight: 800,
              pageScaleFactor: 1,
              ...("screen" in model && model.screen),
            },
          },
        });
        return;
      case "Runtime.evaluate":
        // Native Lynx agents drop `sessionId` from their replies.
        this.#reply(session, { id, result: { result: { type: "number", value: 0 } } });
        return;
      default:
        this.#reply(session, { id, result: {} });
    }
  }
}

type Message = Record<string, unknown>;

interface Peer {
  readonly ws: WebSocket;
  /** Every message received so far. */
  readonly messages: Message[];
  send(message: unknown): void;
  /** Resolves with the oldest matching message not returned before, waiting for it if needed. */
  next(predicate: (message: Message) => boolean): Promise<Message>;
}

async function openPeer(t: TestContext, url: string, options?: ClientOptions): Promise<Peer> {
  const ws = new WebSocket(url, options);
  t.after(() => ws.terminate());
  const messages: Message[] = [];
  const unread: Message[] = [];
  const waiters = new Set<{ predicate: (message: Message) => boolean; resolve: (message: Message) => void }>();
  ws.on("message", (raw) => {
    const message = JSON.parse(String(raw)) as Message;
    messages.push(message);
    for (const waiter of waiters) {
      if (!waiter.predicate(message)) continue;
      waiters.delete(waiter);
      waiter.resolve(message);
      return;
    }
    unread.push(message);
  });
  await once(ws, "open");
  return {
    ws,
    messages,
    send: message => ws.send(JSON.stringify(message)),
    next(predicate) {
      const index = unread.findIndex(predicate);
      if (index >= 0) return Promise.resolve(unread.splice(index, 1)[0]!);
      const { promise, resolve, reject } = Promise.withResolvers<Message>();
      const waiter = { predicate, resolve };
      waiters.add(waiter);
      setTimeout(() => {
        if (waiters.delete(waiter)) reject(new Error("Timed out waiting for a gateway message"));
      }, 5_000).unref();
      return promise;
    },
  };
}

async function startDaemon(t: TestContext, app: Transport, options?: { idleTimeoutMs: number; onIdle: () => void }) {
  const daemon = new DevtoolDaemon([app], options);
  const port = await daemon.start(0);
  t.after(() => daemon.close());
  const base = `ws://127.0.0.1:${port}`;
  const query = (params: Record<string, string>) => new URLSearchParams({ clientId: CLIENT_ID, ...params });
  return {
    frontendUrl: (sessionId: number, view?: string) =>
      `${base}${DAEMON_CDP_PATH}?${query({ sessionId: String(sessionId), ...(view ? { view } : {}) })}`,
    hostUrl: `${base}${DAEMON_CDP_HOST_PATH}?${query({ view: VIEW_ID })}`,
  };
}

const byId = (id: number) => (message: Message) => message["id"] === id;
const byType = (type: string, extra: (message: Message) => boolean = () => true) => (message: Message) =>
  message["type"] === type && extra(message);

test("CDP gateway adapts a standard frontend to a Lynx session", async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl } = await startDaemon(t, app);
  const frontend = await openPeer(t, frontendUrl(1));
  const other = await openPeer(t, frontendUrl(1));

  frontend.send({ id: 1, method: "DOM.getDocument", params: { depth: 1 } });
  other.send({ id: 1, method: "DOM.getDocument", params: { depth: 1 } });
  assert.deepEqual((await frontend.next(byId(1)))["result"], { root: { nodeId: 1, children: [{ nodeId: 10 }] } });
  await other.next(byId(1));
  // Both frontends used id 1; each claimed only its own reply.
  assert.equal(frontend.messages.filter(byId(1)).length, 1);
  assert.equal(other.messages.filter(byId(1)).length, 1);

  frontend.send({ id: 2, method: "Target.setAutoAttach", params: { autoAttach: true } });
  assert.deepEqual((await frontend.next(byId(2)))["result"], {});

  frontend.send({ id: 3, method: "Runtime.evaluate", params: { expression: "1" }, sessionId: "Main" });
  assert.equal((await frontend.next(byId(3)))["sessionId"], "Main");

  frontend.send({ id: 4, method: "Input.dispatchMouseEvent", params: { type: "mousePressed", x: 1, y: 2 } });
  frontend.send({ id: 5, method: "Overlay.highlightNode", params: { nodeId: 11 } });
  await frontend.next(byId(4));
  assert.deepEqual((await frontend.next(byId(5)))["result"], {});

  const methods = app.requests.map(request => request.method);
  assert.ok(!methods.includes("Target.setAutoAttach"));
  assert.ok(!methods.includes("Overlay.highlightNode"), "the screencast view draws standalone highlights");
  const touch = app.requests.find(request => request.method === "Input.emulateTouchFromMouseEvent");
  assert.deepEqual(touch?.params, { button: "none", type: "mousePressed", x: 1, y: 2 });
  assert.equal(new Set(app.requests.filter(r => r.method === "DOM.getDocument").map(r => r.id)).size, 2);
});

test("CDP gateway resolves picks on the host's video and reveals nodes across LynxViews", async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  const pick = (x: number, y: number, commit: boolean) =>
    host.send({ type: "pick", x, y, videoWidth: 800, videoHeight: 1600, commit });

  frontend.send({ id: 0, method: "Runtime.enable" });
  await frontend.next(byId(0));

  // The host shows the 400×800 dp screen as 800×1600 video pixels. Picks only count in inspect
  // mode; the request count at the end shows that this one never reached the App.
  host.send({ type: "video-size", videoWidth: 800, videoHeight: 1600 });
  pick(440, 440, false);
  host.send({ type: "clear-highlight" });
  assert.deepEqual(await host.next(byType("highlight")), { type: "highlight", box: null });
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: true });
  await frontend.next(byId(1));

  // (440, 440) is (220, 220) dp, inside the session 2 card: its node is highlighted.
  pick(440, 440, false);
  const box = { x: 300, y: 300, width: 200, height: 200 };
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), { type: "highlight", box });
  // Native UI at (20, 20) dp has no node, so the box goes away.
  pick(40, 40, false);
  assert.deepEqual(await host.next(byType("highlight")), { type: "highlight", box: null });
  pick(440, 440, false);
  await host.next(byType("highlight", m => m["box"] !== null));

  // A click there ends inspect mode and asks the host to open session 2; a hover that follows
  // the click is ignored. The new session 2 frontend then reveals the node.
  pick(440, 440, true);
  pick(600, 1400, false);
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: false });
  assert.deepEqual(await host.next(byType("open-session")), { type: "open-session", sessionId: 2 });
  const second = await openPeer(t, frontendUrl(2, VIEW_ID));
  second.send({ id: 7, method: "DOM.getDocument", params: { depth: -1 } });
  await second.next(byId(7));
  assert.deepEqual(await second.next(m => m["method"] === "Overlay.inspectNodeRequested"), {
    method: "Overlay.inspectNodeRequested",
    params: { backendNodeId: 121 },
  });
  frontend.ws.close();
  await once(frontend.ws, "close");

  // Only the session 2 frontend is left; a point outside the card belongs to session 1.
  second.send({ id: 8, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await second.next(byId(8));
  pick(40, 1400, true);
  assert.deepEqual(await host.next(byType("open-session")), { type: "open-session", sessionId: 1 });

  // Clicking native UI selects nothing and turns the frontend's picker off.
  second.send({ id: 9, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await second.next(byId(9));
  pick(40, 40, true);
  assert.deepEqual(await second.next(m => m["method"] === "Overlay.inspectModeCanceled"), {
    method: "Overlay.inspectModeCanceled",
  });

  // Hovering a node in Elements draws a box on the host's video instead of repainting the App.
  const highlights = host.messages.filter(byType("highlight", m => m["box"] !== null)).length;
  second.send({ id: 10, method: "Overlay.highlightNode", params: { nodeId: 21 } });
  await second.next(byId(10));
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), { type: "highlight", box });
  assert.equal(highlights, 2, "only the hovers inside inspect mode drew a box");
  // Three hovers and three clicks; the picks outside inspect mode were dropped.
  assert.equal(app.requests.filter(request => request.method === "DOM.getNodeForLocation").length, 6);
  assert.ok(!app.requests.some(request => request.method?.startsWith("Overlay.")));
  // Each of the three inspect sessions measured the screen with one tiny fullscreen frame, which also
  // restores the coordinate mode an Agent screenshot may have switched; the frontends never saw them.
  assert.equal(app.requests.filter(request => request.method === "Page.startScreencast").length, 3);
  assert.equal(app.requests.filter(request => request.method === "Page.stopScreencast").length, 3);
  assert.ok(![...frontend.messages, ...second.messages].some(m => m["method"] === "Page.screencastFrame"));
});

test("CDP gateway accepts Chrome's bundled DevTools but no other foreign origin", async (t) => {
  const { frontendUrl, hostUrl } = await startDaemon(t, new FakeLynxApp());
  const bundled = await openPeer(t, frontendUrl(1), { origin: "devtools://devtools" });
  bundled.send({ id: 1, method: "Runtime.enable" });
  await bundled.next(byId(1));

  for (const [url, origin] of [[frontendUrl(1), "https://example.org"], [hostUrl, "devtools://devtools"]] as const) {
    const ws = new WebSocket(url, { origin });
    t.after(() => ws.terminate());
    await assert.rejects(once(ws, "open"));
  }

  const invalid = new WebSocket(frontendUrl(1).replace("sessionId=1", "sessionId=main"));
  t.after(() => invalid.terminate());
  const [code] = await once(invalid, "close") as [number];
  assert.equal(code, 1008);
});

test("CDP gateway releases the Lynx client when its last connection leaves", { timeout: 5_000 }, async (t) => {
  let onIdle = () => {};
  const { frontendUrl } = await startDaemon(t, new FakeLynxApp(), { idleTimeoutMs: 50, onIdle: () => onIdle() });
  const frontend = await openPeer(t, frontendUrl(1));
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));

  const idle = new Promise<void>((resolve) => {
    onIdle = resolve;
  });
  frontend.ws.close();
  await idle;
});

test("CDP gateway closes its connections when the App goes away", { timeout: 5_000 }, async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  const host = await openPeer(t, hostUrl);
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));

  const closed = Promise.all([frontend, host].map(peer => once(peer.ws, "close") as Promise<[number, Buffer]>));
  app.disconnect();
  for (const [code, reason] of await closed) {
    assert.equal(code, 1001);
    assert.equal(reason.toString(), "Lynx client disconnected");
  }
});

test("CDP gateway leaves inspect mode when the host cancels it", async (t) => {
  const { frontendUrl, hostUrl } = await startDaemon(t, new FakeLynxApp());
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: true });

  host.send({ type: "cancel-inspect" });
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: false });
  assert.deepEqual(await frontend.next(m => m["method"] === "Overlay.inspectModeCanceled"), {
    method: "Overlay.inspectModeCanceled",
  });
});

test("CDP gateway survives malformed frames", async (t) => {
  const { frontendUrl, hostUrl } = await startDaemon(t, new FakeLynxApp());
  for (const url of [frontendUrl(1), hostUrl]) {
    const ws = new WebSocket(url);
    t.after(() => ws.terminate());
    await once(ws, "open");
    // A text frame that is not UTF-8.
    ws.send(Buffer.from([0xc3, 0x28]), { binary: false });
    const [code] = await once(ws, "close") as [number];
    assert.equal(code, 1007);
  }

  const frontend = await openPeer(t, frontendUrl(1));
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));
});

test("CDP gateway closes a frontend whose LynxView closes", { timeout: 5_000 }, async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl } = await startDaemon(t, app);
  const first = await openPeer(t, frontendUrl(1));
  const second = await openPeer(t, frontendUrl(2));
  for (const peer of [first, second]) {
    peer.send({ id: 1, method: "Runtime.enable" });
    await peer.next(byId(1));
  }

  app.sessions = app.sessions.filter(session => session.session_id === 1);
  app.emitSessions();
  const [code, reason] = await once(second.ws, "close") as [number, Buffer];
  assert.equal(code, 1001);
  assert.equal(reason.toString(), "Lynx session closed");
  first.send({ id: 2, method: "Runtime.enable" });
  await first.next(byId(2));

  // A frontend that joins later for the closed LynxView hears so as well.
  const late = await openPeer(t, frontendUrl(2));
  assert.equal((await once(late.ws, "close") as [number])[0], 1001);
});

test("CDP gateway announces an unannounced main-thread target exactly once", { timeout: 10_000 }, async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl } = await startDaemon(t, app);
  const frontend = await openPeer(t, frontendUrl(1));
  const isMain = (m: Message) =>
    m["method"] === "Target.attachedToTarget" && (m["params"] as Message | undefined)?.["sessionId"] === "Main";

  // The App never announces it, so the gateway does after checking that the target answers.
  await frontend.next(isMain);
  app.emitEvent(1, {
    method: "Target.attachedToTarget",
    params: { sessionId: "Main", targetInfo: { targetId: "Main" } },
  });
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));
  assert.equal(frontend.messages.filter(isMain).length, 1);

  // A reload detaches the target and announces it again; that announcement goes through.
  app.emitEvent(1, { method: "Target.detachedFromTarget", params: { sessionId: "Main", targetId: "Main" } });
  app.emitEvent(1, {
    method: "Target.attachedToTarget",
    params: { sessionId: "Main", targetInfo: { targetId: "Main" } },
  });
  frontend.send({ id: 2, method: "Runtime.enable" });
  await frontend.next(byId(2));
  assert.equal(frontend.messages.filter(isMain).length, 2);
});

test("CDP gateway announces the main-thread target only while the App has not", { timeout: 10_000 }, async (t) => {
  const isMain = (m: Message) =>
    m["method"] === "Target.attachedToTarget" && (m["params"] as Message | undefined)?.["sessionId"] === "Main";

  // Another target's announcement says nothing about the main thread.
  const app = new FakeLynxApp();
  const { frontendUrl } = await startDaemon(t, app);
  const frontend = await openPeer(t, frontendUrl(1));
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));
  app.emitEvent(1, {
    method: "Target.attachedToTarget",
    params: { sessionId: "Worker", targetInfo: { targetId: "Worker" } },
  });
  await frontend.next(isMain);

  // The App announces it while the gateway's probe is out; the gateway leaves it at that.
  const late = new FakeLynxApp();
  late.hold = (request) => {
    if (request.method !== "Runtime.evaluate" || request.sessionId !== "Main") return false;
    setTimeout(() => {
      late.emitEvent(1, {
        method: "Target.attachedToTarget",
        params: { sessionId: "Main", targetInfo: { targetId: "Main" } },
      });
      late.emitEvent(1, { id: request.id!, result: { result: { type: "number", value: 0 } } });
    }, 100);
    return true;
  };
  const daemon = await startDaemon(t, late);
  const probed = await openPeer(t, daemon.frontendUrl(1));
  probed.send({ id: 1, method: "Runtime.enable" });
  await probed.next(byId(1));
  await delay(2_000);
  assert.equal(probed.messages.filter(isMain).length, 1);
});

test("CDP gateway leaves a main-thread target the App announces alone", { timeout: 10_000 }, async (t) => {
  const app = new FakeLynxApp();
  const { frontendUrl } = await startDaemon(t, app);
  const frontend = await openPeer(t, frontendUrl(1));
  frontend.send({ id: 1, method: "Runtime.enable" });
  await frontend.next(byId(1));
  app.emitEvent(1, {
    method: "Target.attachedToTarget",
    params: { sessionId: "Main", targetInfo: { targetId: "Main" } },
  });

  // Past the gateway's 1.5 s wait: it neither probed the target nor announced it a second time.
  await delay(2_000);
  const isMain = (m: Message) =>
    m["method"] === "Target.attachedToTarget" && (m["params"] as Message | undefined)?.["sessionId"] === "Main";
  assert.equal(frontend.messages.filter(isMain).length, 1);
  assert.ok(!app.requests.some(request => request.method === "Runtime.evaluate" && request.sessionId === "Main"));
});

test("CDP gateway prefers the inspected LynxView among views of equal size", async (t) => {
  const app = new FakeLynxApp();
  // Neither the list order nor the newer session decides: the frontend shows the older session 1.
  app.sessions = [{ session_id: 3, type: "lynx", url: "c" }, { session_id: 1, type: "lynx", url: "a" }];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));

  // Both pages fill the screen; the click selects in the page the frontend shows instead of opening the other.
  host.send({ type: "pick", x: 400, y: 1300, videoWidth: 800, videoHeight: 1600, commit: true });
  assert.deepEqual(await frontend.next(m => m["method"] === "Overlay.inspectNodeRequested"), {
    method: "Overlay.inspectNodeRequested",
    params: { backendNodeId: 111 },
  });
  assert.ok(!host.messages.some(byType("open-session")));
});

test("CDP gateway prefers a page opened after the frontend attached among views of equal size", async (t) => {
  const app = new FakeLynxApp();
  app.sessions = [{ session_id: 1, type: "lynx", url: "a" }];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  // The second reply follows the session list the attach asked for.
  for (const id of [1, 2]) {
    frontend.send({ id, method: "Runtime.enable" });
    await frontend.next(byId(id));
  }

  // The user goes on to a page that covers the one the frontend shows: a click there opens it.
  app.sessions = [...app.sessions, { session_id: 3, type: "lynx", url: "c" }];
  app.emitSessions();
  frontend.send({ id: 3, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(3));
  host.send({ type: "pick", x: 400, y: 1300, videoWidth: 800, videoHeight: 1600, commit: true });
  assert.deepEqual(await host.next(byType("open-session")), { type: "open-session", sessionId: 3 });
});

test("CDP gateway follows the session the user chooses again over a newer page", async (t) => {
  const app = new FakeLynxApp();
  app.sessions = [{ session_id: 1, type: "lynx", url: "a" }];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const attach = async () => {
    const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
    // The second reply follows the session list the attach asked for.
    for (const id of [1, 2]) {
      frontend.send({ id, method: "Runtime.enable" });
      await frontend.next(byId(id));
    }
    return frontend;
  };

  // The user goes on to page 3, then chooses session 1 again, which reloads the frontend.
  const first = await attach();
  app.sessions = [...app.sessions, { session_id: 3, type: "lynx", url: "c" }];
  app.emitSessions();
  first.ws.close();
  await once(first.ws, "close");
  const again = await attach();
  again.send({ id: 3, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await again.next(byId(3));
  host.send({ type: "pick", x: 400, y: 1300, videoWidth: 800, videoHeight: 1600, commit: true });
  assert.deepEqual(await again.next(m => m["method"] === "Overlay.inspectNodeRequested"), {
    method: "Overlay.inspectNodeRequested",
    params: { backendNodeId: 111 },
  });
  assert.ok(!host.messages.some(byType("open-session")));
});

test("CDP gateway gives a tie between views the frontend does not show to the newest", async (t) => {
  const app = new FakeLynxApp();
  app.sessions = [
    { session_id: 1, type: "lynx", url: "a" },
    { session_id: 3, type: "lynx", url: "c" },
    { session_id: 2, type: "lynx", url: "b" },
  ];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(2, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));
  host.send({ type: "pick", x: 40, y: 1400, videoWidth: 800, videoHeight: 1600, commit: true });
  assert.deepEqual(await host.next(byType("open-session")), { type: "open-session", sessionId: 3 });
});

test("CDP gateway picks without waiting for a slow LynxView, which counts once it answers", async (t) => {
  const app = new FakeLynxApp();
  // Session 2 answers DOM.getDocument after 1.2 s, e.g. a large page on a Lynx that ignores `depth`.
  const answers: ReturnType<typeof setTimeout>[] = [];
  t.after(() => answers.forEach(clearTimeout));
  app.hold = (request) => {
    if (request.method !== "DOM.getDocument" || request.session !== 2) return false;
    answers.push(setTimeout(() => {
      app.emitEvent(2, { id: request.id!, result: { root: { nodeId: 2, children: [{ nodeId: 20 }] } } });
    }, 1_200));
    return true;
  };
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));
  const hover = () => host.send({ type: "pick", x: 440, y: 440, videoWidth: 800, videoHeight: 1600, commit: false });

  // After a second, the card does not count yet, so the page under it is highlighted.
  const started = performance.now();
  hover();
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), {
    type: "highlight",
    box: { x: 0, y: 1200, width: 800, height: 400 },
  });
  const waited = performance.now() - started;
  assert.ok(waited >= 900 && waited < 2_500, `waited ${waited} ms`);

  // Once the rectangles are stale again, the card's late answer has made it count.
  await delay(2_100);
  hover();
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), {
    type: "highlight",
    box: { x: 300, y: 300, width: 200, height: 200 },
  });

  // A failed answer drops the card's rectangle instead of keeping a stale one.
  app.hold = (request) => {
    if (request.method !== "DOM.getDocument" || request.session !== 2) return false;
    app.emitEvent(2, { id: request.id!, error: { code: -32000, message: "No document" } });
    return true;
  };
  await delay(2_100);
  hover();
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), {
    type: "highlight",
    box: { x: 0, y: 1200, width: 800, height: 400 },
  });
});

test("CDP gateway asks a slow LynxView for its rectangle once at a time", async (t) => {
  const app = new FakeLynxApp();
  const answers: ReturnType<typeof setTimeout>[] = [];
  t.after(() => answers.forEach(clearTimeout));
  app.hold = (request) => {
    if (request.method !== "DOM.getDocument" || request.session !== 2) return false;
    answers.push(setTimeout(() => {
      app.emitEvent(2, { id: request.id!, result: { root: { nodeId: 2, children: [{ nodeId: 20 }] } } });
    }, 3_000));
    return true;
  };
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));
  const hover = () => host.send({ type: "pick", x: 440, y: 440, videoWidth: 800, videoHeight: 1600, commit: false });

  // The rectangles go stale while the card still owes its first answer; it is not asked again.
  hover();
  await host.next(byType("highlight", m => m["box"] !== null));
  await delay(1_200);
  hover();
  await delay(1_100);
  assert.equal(app.requests.filter(request => request.method === "DOM.getDocument" && request.session === 2).length, 1);
});

test("CDP gateway measures the screen through a LynxView while a WebView is inspected", async (t) => {
  const app = new FakeLynxApp();
  app.sessions = [{ session_id: 1, type: "lynx", url: "a" }, { session_id: 5, type: "web", url: "w" }];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(5, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));

  // The video scales the axes differently: 2 px per dp across and 1.5 down. (440, 1050) is (220, 700) dp,
  // inside session 1, whose node there is drawn in video pixels.
  host.send({ type: "pick", x: 440, y: 1050, videoWidth: 800, videoHeight: 1200, commit: false });
  assert.deepEqual(await host.next(byType("highlight", m => m["box"] !== null)), {
    type: "highlight",
    box: { x: 0, y: 900, width: 800, height: 300 },
  });
  assert.deepEqual(
    app.requests.filter(request => request.method?.endsWith("Screencast")).map(r => [r.method, r.session]),
    [["Page.startScreencast", 1], ["Page.stopScreencast", 1]],
  );

  // A WebView box is in the WebView's own coordinates, which the host cannot place.
  frontend.send({ id: 2, method: "Overlay.highlightNode", params: { nodeId: 51 } });
  await frontend.next(byId(2));
  assert.deepEqual(await host.next(byType("highlight")), { type: "highlight", box: null });
});

test("CDP gateway selects nothing outside every LynxView while a WebView is inspected", async (t) => {
  const app = new FakeLynxApp();
  app.sessions = [{ session_id: 2, type: "lynx", url: "b" }, { session_id: 5, type: "web", url: "w" }];
  const { frontendUrl, hostUrl } = await startDaemon(t, app);
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(5, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));

  // (20, 700) dp is outside the card; the WebView's own coordinates do not apply there.
  host.send({ type: "pick", x: 40, y: 1400, videoWidth: 800, videoHeight: 1600, commit: true });
  await frontend.next(m => m["method"] === "Overlay.inspectModeCanceled");
  assert.ok(!app.requests.some(request => request.method === "DOM.getNodeForLocation"));
});

test("CDP gateway keeps a cross-session pick for the next frontend only until picking starts again", async (t) => {
  const { frontendUrl, hostUrl } = await startDaemon(t, new FakeLynxApp());
  const host = await openPeer(t, hostUrl);
  const first = await openPeer(t, frontendUrl(1, VIEW_ID));
  const pickCard = async () => {
    first.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
    await first.next(byId(1));
    host.send({ type: "pick", x: 440, y: 440, videoWidth: 800, videoHeight: 1600, commit: true });
    assert.deepEqual(await host.next(byType("open-session")), { type: "open-session", sessionId: 2 });
  };
  const openSecond = async () => {
    const second = await openPeer(t, frontendUrl(2, VIEW_ID));
    second.send({ id: 7, method: "DOM.getDocument", params: { depth: -1 } });
    await second.next(byId(7));
    return second;
  };

  // The host ignores the request and picking starts again, so a frontend opened later reveals nothing.
  await pickCard();
  first.send({ id: 2, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await first.next(byId(2));
  const unrelated = await openSecond();
  await delay(100);
  assert.ok(!unrelated.messages.some(m => m["method"] === "Overlay.inspectNodeRequested"));
  unrelated.ws.close();
  first.send({ id: 3, method: "Overlay.setInspectMode", params: { mode: "none" } });
  await first.next(byId(3));

  // The old frontend may leave before the requested one connects; the pick waits for it.
  await pickCard();
  first.ws.close();
  await once(first.ws, "close");
  const second = await openSecond();
  assert.deepEqual(await second.next(m => m["method"] === "Overlay.inspectNodeRequested"), {
    method: "Overlay.inspectNodeRequested",
    params: { backendNodeId: 121 },
  });
});

test("CDP gateway stops the host picking when the frontend leaves", { timeout: 5_000 }, async (t) => {
  const { frontendUrl, hostUrl } = await startDaemon(t, new FakeLynxApp());
  const host = await openPeer(t, hostUrl);
  const frontend = await openPeer(t, frontendUrl(1, VIEW_ID));
  frontend.send({ id: 1, method: "Overlay.setInspectMode", params: { mode: "searchForNode" } });
  await frontend.next(byId(1));
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: true });

  frontend.ws.close();
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: false });
  assert.deepEqual(await host.next(byType("highlight")), { type: "highlight", box: null });
  // A click the host sent before it heard so is answered again.
  host.send({ type: "pick", x: 1, y: 1, videoWidth: 800, videoHeight: 1600, commit: true });
  assert.deepEqual(await host.next(byType("inspect-mode")), { type: "inspect-mode", enabled: false });
});
