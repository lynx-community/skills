// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream } from "node:stream/web";
import { test, type TestContext } from "node:test";
import { setImmediate as nextTurn, setTimeout as sleep } from "node:timers/promises";
import { WebSocket, WebSocketServer } from "ws";
import { captureScreenshotFrame } from "../src/command/screenshot.ts";
import { DAEMON_WS_PATH } from "../src/daemon/protocol.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import { ClientId, Connector } from "../src/index.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import { HDTTransport } from "../src/transport/hdt.ts";
import type { CDPRequestMessage, Session } from "../src/types.ts";
import { raceWithTimeout } from "./raceWithTimeout.ts";

const TARGET_PORT = 17;
const UPDATED_TARGET_PORT = 37;
const SIBLING_PORT = 29;
const TARGET_ROUTER_ID = "target-debug-router";
const SIBLING_ROUTER_ID = "sibling-debug-router";
const SESSION_ID = 7;

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

interface ObservedCDPRequest extends CDPRequestMessage {
  id: number;
  to?: number | undefined;
}

interface HdtClientHarness {
  clientId: string;
  connector: Connector;
  broadcast(message: unknown): void;
  disconnectTarget(): void;
  updateTargetPort(port: number): void;
  nextRequest(method: string): Promise<ObservedCDPRequest>;
  onCDPRequest: ((request: ObservedCDPRequest) => void) | undefined;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

async function within<T>(promise: Promise<T>, operation: string): Promise<T> {
  const timeout = Symbol("timeout");
  const result = await raceWithTimeout(promise, 2_000, timeout);
  if (result === timeout) throw new Error(`Timed out waiting for ${operation}`);
  return result;
}

async function createHdtClientHarness(
  t: TestContext,
  target: number | string,
  viaDaemon: boolean,
): Promise<HdtClientHarness> {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  await new Promise<void>(resolve => server.once("listening", resolve));
  t.after(async () => {
    for (const socket of server.clients) socket.terminate();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const requests = new Map<string, ObservedCDPRequest[]>();
  const waiters = new Map<string, Deferred<ObservedCDPRequest>[]>();
  let onCDPRequest: HdtClientHarness["onCDPRequest"];
  let driverId = 100;
  let targetPort: number | undefined = TARGET_PORT;

  const clientList = () => ({
    event: "ClientList",
    data: [
      ...(targetPort === undefined
        ? []
        : [{ id: targetPort, info: { App: "TargetApp", debugRouterId: TARGET_ROUTER_ID } }]),
      { id: SIBLING_PORT, info: { App: "SiblingApp", debugRouterId: SIBLING_ROUTER_ID } },
    ],
  });

  server.on("connection", socket => {
    const id = driverId++;
    const send = (message: unknown) => socket.send(JSON.stringify(message));
    send({ event: "Initialize", data: id });

    socket.on("message", raw => {
      const message = JSON.parse(raw.toString()) as {
        event?: string;
        to?: number;
        data?: { type?: string; data?: { message?: unknown } };
      };

      if (message.event === "Register") {
        send({ event: "RoomJoined", data: { room: "", id } });
        send(clientList());
        return;
      }

      if (message.event === "ListClients") {
        send(clientList());
        return;
      }

      if (message.event !== "Customized" || message.data?.type !== "CDP") return;
      const cdpMessage = message.data.data?.message as ObservedCDPRequest | undefined;
      if (!cdpMessage || typeof cdpMessage.method !== "string" || cdpMessage.id === undefined) return;
      const observed: ObservedCDPRequest = { ...cdpMessage, to: message.to };

      const pending = waiters.get(observed.method)?.shift();
      if (pending) pending.resolve(observed);
      else {
        const queue = requests.get(observed.method) ?? [];
        queue.push(observed);
        requests.set(observed.method, queue);
      }
      onCDPRequest?.(observed);
    });
  });

  const deviceId = `HDT-${address.port}`;
  const hdt = new HDTTransport(address.port);
  let connector: Connector;
  if (viaDaemon) {
    const daemon = new DevtoolDaemon([hdt]);
    const daemonPort = await daemon.start(0);
    t.after(() => daemon.close());
    connector = new Connector([new DaemonTransport(`ws://127.0.0.1:${daemonPort}${DAEMON_WS_PATH}`)]);
  } else {
    connector = new Connector([hdt]);
  }

  return {
    clientId: ClientId.serialize(deviceId, deviceId, target),
    connector,
    broadcast(message) {
      const serialized = JSON.stringify(message);
      for (const socket of server.clients) {
        if (socket.readyState === WebSocket.OPEN) socket.send(serialized);
      }
    },
    disconnectTarget() {
      targetPort = undefined;
      for (const socket of server.clients) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(clientList()));
      }
    },
    updateTargetPort(port) {
      targetPort = port;
      // Persistent daemon connections learn route changes through ClientList broadcasts.
      for (const socket of server.clients) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(clientList()));
      }
    },
    nextRequest(method) {
      const queue = requests.get(method);
      const queued = queue?.shift();
      if (queued) return Promise.resolve(queued);
      const waiter = deferred<ObservedCDPRequest>();
      const methodWaiters = waiters.get(method) ?? [];
      methodWaiters.push(waiter);
      waiters.set(method, methodWaiters);
      return waiter.promise;
    },
    get onCDPRequest() {
      return onCDPRequest;
    },
    set onCDPRequest(callback) {
      onCDPRequest = callback;
    },
  };
}

function sessionList(sender: number, sessions: Session[]) {
  return {
    event: "Customized",
    data: { type: "SessionList", sender, data: sessions },
  };
}

function cdpMessage(
  sender: number | string | undefined,
  sessionId: number,
  message: Record<string, unknown>,
) {
  return {
    event: "Customized",
    data: {
      type: "CDP",
      ...(sender === undefined ? {} : { sender }),
      data: { session_id: sessionId, message: JSON.stringify(message) },
    },
  };
}

function makeSession(sessionId: number): Session {
  return { session_id: sessionId, type: "lynx", url: "about:blank" };
}

for (const viaDaemon of [false, true]) {
  test(`${viaDaemon ? "daemon" : "direct"}: stable HDT target follows an updated numeric route and ignores sibling broadcasts`, async t => {
    const harness = await createHdtClientHarness(t, TARGET_ROUTER_ID, viaDaemon);

    const initialRequest = harness.nextRequest("Runtime.evaluate");
    harness.onCDPRequest = request => {
      if (request.method === "Runtime.evaluate") {
        harness.broadcast(cdpMessage(TARGET_PORT, SESSION_ID, {
          id: request.id,
          result: { source: "before-route-update" },
        }));
      }
    };
    const initialResult = harness.connector.sendCDPMessage<{ source: string }, { expression: string }>(
      harness.clientId,
      SESSION_ID,
      "Runtime.evaluate",
      { expression: "1 + 1" },
    );
    await within(initialRequest, "Runtime.evaluate before route update");
    assert.deepEqual(await within(initialResult, "response before route update"), { source: "before-route-update" });

    // The stable client ID follows route changes even on a pooled daemon connection.
    harness.updateTargetPort(UPDATED_TARGET_PORT);
    const startRequest = harness.nextRequest("Page.startScreencast");
    harness.onCDPRequest = request => {
      if (request.method === "Page.startScreencast") {
        harness.broadcast(sessionList(SIBLING_PORT, [makeSession(99)]));
        harness.broadcast(cdpMessage(SIBLING_PORT, SESSION_ID, {
          method: "Page.screencastFrame",
          params: { data: "sibling-frame" },
        }));
        harness.broadcast(cdpMessage(TARGET_PORT, SESSION_ID, {
          method: "Page.screencastFrame",
          params: { data: "stale-route-frame" },
        }));
        harness.broadcast(cdpMessage(UPDATED_TARGET_PORT, SESSION_ID, {
          method: "Page.screencastFrame",
          params: { data: "target-frame" },
        }));
      } else if (request.method === "Page.screencastFrameAck") {
        harness.broadcast(cdpMessage(SIBLING_PORT, 99, { id: request.id, result: {} }));
        harness.broadcast(cdpMessage(UPDATED_TARGET_PORT, SESSION_ID, { id: request.id, result: {} }));
      } else if (request.method === "Page.stopScreencast") {
        harness.broadcast(cdpMessage(UPDATED_TARGET_PORT, SESSION_ID, { id: request.id, result: {} }));
      }
    };

    const capture = captureScreenshotFrame(harness.connector, harness.clientId, SESSION_ID, { timeoutMs: 1_000 });
    await within(startRequest, "Page.startScreencast");
    assert.equal((await within(capture, "the target screenshot and its acknowledgement")).data, "target-frame");
  });

  test(`${viaDaemon ? "daemon" : "direct"}: numeric HDT target ignores a sibling CDP response with the same request id`, async t => {
    const harness = await createHdtClientHarness(t, TARGET_PORT, viaDaemon);
    const requestReceived = harness.nextRequest("Runtime.evaluate");
    harness.onCDPRequest = request => {
      if (request.method !== "Runtime.evaluate") return;
      harness.broadcast(cdpMessage(SIBLING_PORT, 99, {
        id: request.id,
        result: { source: "sibling" },
      }));
      void nextTurn().then(() => {
        harness.broadcast(cdpMessage(TARGET_PORT, SESSION_ID, {
          id: request.id,
          result: { source: "target" },
        }));
      });
    };

    const result = harness.connector.sendCDPMessage<{ source: string }, { expression: string }>(
      harness.clientId,
      SESSION_ID,
      "Runtime.evaluate",
      { expression: "1 + 1" },
    );
    await within(requestReceived, "Runtime.evaluate request");
    assert.deepEqual(await within(result, "the target Runtime.evaluate response"), { source: "target" });
  });

  test(`${viaDaemon ? "daemon" : "direct"}: stable HDT target still ends its stream when its own SessionList removes the session`, async t => {
    const harness = await createHdtClientHarness(t, TARGET_ROUTER_ID, viaDaemon);
    const requestReceived = harness.nextRequest("Runtime.evaluate");
    harness.onCDPRequest = request => {
      if (request.method !== "Runtime.evaluate") return;
      harness.broadcast(sessionList(TARGET_PORT, []));
      void nextTurn().then(() => {
        harness.broadcast(cdpMessage(TARGET_PORT, SESSION_ID, {
          method: "Runtime.consoleAPICalled",
          params: {},
        }));
      });
    };

    const input = new ReadableStream<CDPRequestMessage>({
      start(controller) {
        controller.enqueue({ method: "Runtime.evaluate", params: { expression: "1 + 1" } });
      },
    });
    await using stream = await harness.connector.sendCDPStream(harness.clientId, SESSION_ID, input);
    const reader = stream.getReader();
    try {
      await within(requestReceived, "Runtime.evaluate request");
      const result = await within(reader.read(), "the selected session removal");
      assert.equal(result.done, true);
    } finally {
      reader.releaseLock();
    }
  });

  test(`${viaDaemon ? "daemon" : "direct"}: numeric HDT target accepts matching and legacy CDP response sender forms`, async t => {
    const cases: { name: string; sender: number | string | undefined }[] = [
      { name: "omitted sender", sender: undefined },
      { name: "numeric -1 sender", sender: -1 },
      { name: "string -1 sender", sender: "-1" },
      { name: "numeric 0xffffffff sender", sender: 0xffffffff },
      { name: "string 0xffffffff sender", sender: "4294967295" },
      { name: "matching target sender", sender: TARGET_PORT },
    ];

    for (const { name, sender } of cases) {
      await t.test(name, async t => {
        const harness = await createHdtClientHarness(t, TARGET_PORT, viaDaemon);
        const requestReceived = harness.nextRequest("Runtime.evaluate");
        harness.onCDPRequest = request => {
          if (request.method === "Runtime.evaluate") {
            harness.broadcast(cdpMessage(sender, SESSION_ID, {
              id: request.id,
              result: { source: name },
            }));
          }
        };

        const result = harness.connector.sendCDPMessage<{ source: string }, { expression: string }>(
          harness.clientId,
          SESSION_ID,
          "Runtime.evaluate",
          { expression: "1 + 1" },
        );
        await within(requestReceived, "Runtime.evaluate request");
        assert.deepEqual(await within(result, `${name} response`), { source: name });
      });
    }
  });

  test(`${viaDaemon ? "daemon" : "direct"}: stable HDT target recovers across a transient ClientList disconnect gap`, async t => {
    const harness = await createHdtClientHarness(t, TARGET_ROUTER_ID, viaDaemon);

    // Cold connect while target is temporarily absent from ClientList (e.g. ~350ms ADB flap).
    harness.disconnectTarget();
    const observedTo: Array<number | undefined> = [];
    harness.onCDPRequest = request => {
      observedTo.push(request.to);
      if (request.method === "Runtime.evaluate") {
        harness.broadcast(cdpMessage(request.to, SESSION_ID, {
          id: request.id,
          result: { source: `port-${String(request.to)}` },
        }));
      }
    };

    const coldResult = harness.connector.sendCDPMessage<{ source: string }, { expression: string }>(
      harness.clientId,
      SESSION_ID,
      "Runtime.evaluate",
      { expression: "cold" },
    );
    await sleep(120);
    harness.updateTargetPort(TARGET_PORT);
    assert.deepEqual(await within(coldResult, "cold connect across transient ClientList gap"), {
      source: `port-${TARGET_PORT}`,
    });
    assert.deepEqual(observedTo, [TARGET_PORT]);

    // Warm pooled/direct follow-up while target drops out of ClientList and reconnects under a new numeric ID.
    harness.disconnectTarget();
    await sleep(20);
    const warmResult = harness.connector.sendCDPMessage<{ source: string }, { expression: string }>(
      harness.clientId,
      SESSION_ID,
      "Runtime.evaluate",
      { expression: "warm" },
    );
    await sleep(120);
    harness.updateTargetPort(UPDATED_TARGET_PORT);
    assert.deepEqual(await within(warmResult, "warm route across transient ClientList gap"), {
      source: `port-${UPDATED_TARGET_PORT}`,
    });
    assert.deepEqual(observedTo, [TARGET_PORT, UPDATED_TARGET_PORT]);
  });
}
