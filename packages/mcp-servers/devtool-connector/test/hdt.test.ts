// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { WebSocketServer } from "ws";
import { ClientId, Connector } from "../src/index.ts";
import { HDTTransport } from "../src/transport/hdt.ts";
import { wsStreams } from "../src/transport/ws-stream.ts";
import { raceWithTimeout } from "./raceWithTimeout.ts";

test("HDTTransport waits for RoomJoined before sending driver messages", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    server.close();
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  assert.ok(address);

  let customizedBeforeReady = false;
  let customizedAfterReady = false;
  let customizedDebugRouterId: unknown;
  let listClientsRequests = 0;
  let resolveCustomized: (() => void) | undefined;
  const customizedReceived = new Promise<void>((resolve) => {
    resolveCustomized = resolve;
  });

  server.on("connection", (socket) => {
    socket.send(JSON.stringify({ event: "Initialize", data: 123 }));

    let ready = false;
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as { debugRouterId?: unknown; event?: string };

      if (message.event === "Register") {
        setTimeout(() => {
          ready = true;
          socket.send(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        }, 20);
        return;
      }

      if (message.event === "ListClients") {
        listClientsRequests += 1;
      }

      if (message.event === "Customized") {
        customizedDebugRouterId = message.debugRouterId;
        if (ready) {
          customizedAfterReady = true;
        } else {
          customizedBeforeReady = true;
        }
        socket.send(JSON.stringify({ event: "RouteRejected", data: { reason: "legacy-frame" } }));
        resolveCustomized?.();
      }
    });
  });

  const transport = new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`);
  await using conn = await transport.connect({
    deviceId: `HDT-${address.port}`,
    port: 2,
    signal: AbortSignal.timeout(1_000),
  });

  const writer = conn.writable.getWriter();
  try {
    await writer.write({
      event: "Customized",
      data: {
        type: "ListSession",
        data: {},
      },
    });
  } finally {
    writer.releaseLock();
  }

  const timeout = Symbol("timeout");
  const result = await raceWithTimeout(customizedReceived, 500, timeout);
  if (result === timeout) throw new Error("Timed out waiting for Customized message");

  assert.equal(customizedBeforeReady, false);
  assert.equal(customizedAfterReady, true);
  assert.equal(customizedDebugRouterId, undefined);
  assert.equal(listClientsRequests, 0);

  const reader = conn.readable.getReader();
  try {
    assert.deepEqual(await reader.read(), {
      done: false,
      value: { event: "RouteRejected", data: { reason: "legacy-frame" } },
    });
  } finally {
    reader.releaseLock();
  }
});

test("HDTTransport preserves an abnormal websocket close across disposal", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    for (const socket of server.clients) socket.terminate();
    server.close();
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  const reason = "RouteRejected: 路由不可用🚫";

  server.on("connection", (socket) => {
    socket.send(JSON.stringify({ event: "Initialize", data: 123 }));
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as { event?: string };
      if (message.event === "Register") {
        socket.send(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
      } else if (message.event === "Customized") {
        socket.close(1011, reason);
      }
    });
  });

  const transport = new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`);
  const conn = await transport.connect({
    deviceId: `HDT-${address.port}`,
    port: 2,
    signal: AbortSignal.timeout(1_000),
  });
  t.after(() => conn[Symbol.asyncDispose]().catch(() => {}));

  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();
  let primaryError: unknown;
  try {
    await writer.write({
      event: "Customized",
      data: { type: "ListSession", data: {} },
    });
    primaryError = await reader.read().then(
      () => {
        throw new Error("Expected HDT readable to reject");
      },
      error => error,
    );
  } finally {
    writer.releaseLock();
    reader.releaseLock();
  }

  assert(primaryError instanceof Error);
  assert.match(primaryError.message, /1011/);
  assert.match(primaryError.message, /RouteRejected: 路由不可用🚫/);
  assert.equal((primaryError as Error & { code?: number }).code, 1011);
  assert.equal((primaryError as Error & { reason?: string }).reason, reason);
  await conn[Symbol.asyncDispose]();
});

test("Connector preserves the request timeout when an HDT socket closes without a response", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    for (const socket of server.clients) socket.terminate();
    server.close();
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  const cdpRequestReceived = deferred<void>();

  server.on("connection", (socket) => {
    socket.send(JSON.stringify({ event: "Initialize", data: 123 }));
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as { event?: string; data?: { type?: string } };
      if (message.event === "Register") {
        socket.send(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        socket.send(JSON.stringify({
          event: "ClientList",
          data: [{ id: 4, info: { App: "TestApp", debugRouterId: "router-uuid" } }],
        }));
      } else if (message.event === "ListClients") {
        socket.send(JSON.stringify({
          event: "ClientList",
          data: [{ id: 4, info: { App: "TestApp", debugRouterId: "router-uuid" } }],
        }));
      } else if (message.event === "Customized") {
        if (message.data?.type === "CDP") cdpRequestReceived.resolve();
      }
    });
  });

  const connector = new Connector([
    new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`),
  ]);
  const clientId = ClientId.serialize(`HDT-${address.port}`, "router-uuid");

  const controller = new AbortController();
  const timeout = new DOMException("The operation timed out", "TimeoutError");
  t.mock.method(AbortSignal, "timeout", () => controller.signal);

  const request = connector.sendCDPMessage(clientId, 2, "Runtime.evaluate", { expression: "1 + 1" });
  try {
    const timedOut = Symbol("timed out waiting for CDP request");
    const sent = await raceWithTimeout(cdpRequestReceived.promise, 2_000, timedOut);
    if (sent === timedOut) throw new Error("Timed out waiting for the CDP request to reach the HDT service");

    await new Promise<void>(resolve => setImmediate(resolve));
    controller.abort(timeout);

    await assert.rejects(request, error => error === timeout);
  } finally {
    if (!controller.signal.aborted) controller.abort(new Error("Test cleanup"));
    await request.catch(() => {});
  }
});

test("HDTTransport exposes debugRouterId as the client target", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    server.close();
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  assert.ok(address);
  let listClientsRequests = 0;

  server.on("connection", (socket) => {
    socket.send(JSON.stringify({ event: "Initialize", data: 123 }));
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as { event?: string };
      if (message.event === "Register") {
        socket.send(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        socket.send(JSON.stringify({ event: "ClientList", data: [] }));
      } else if (message.event === "ListClients") {
        listClientsRequests += 1;
        socket.send(JSON.stringify({
          event: "ClientList",
          data: [{
            id: 2,
            type: "runtime",
            info: {
              App: "TestApp",
              AppVersion: "1.0.0",
              debugRouterId: "router-uuid",
              debugRouterVersion: "1.0.0",
              deviceModel: "TestDevice",
              network: "USB",
              osVersion: "1",
              sdkVersion: "1.0.0",
            },
          }],
        }));
      }
    });
  });

  const transport = new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`);
  const clients = await transport.listClients();

  assert.equal(listClientsRequests, 1);
  assert.equal(clients[0]?.id, `HDT-${address.port}:router-uuid`);
});

test("HDTTransport normalizes the selected sender and follows ClientList updates", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    for (const socket of server.clients) socket.terminate();
    server.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let selectedSender = 9;
  let otherSender = 10;
  const clientList = () => ({
    event: "ClientList",
    data: [
      { id: selectedSender, info: { App: "Selected", debugRouterId: "selected-router" } },
      { id: otherSender, info: { App: "Other", debugRouterId: "other-router" } },
    ],
  });
  const replies = () => [
    { event: "Customized", data: { type: "SessionList", sender: otherSender, data: [{ session_id: 2 }] } },
    { event: "Customized", data: { type: "SessionList", sender: selectedSender, data: [{ session_id: 2 }] } },
    { event: "Customized", data: { type: "CDP", sender: otherSender, data: { session_id: 2, message: "other" } } },
    {
      event: "Customized",
      data: { type: "CDP", sender: String(selectedSender), data: { session_id: 2, message: "selected" } },
    },
    { event: "Customized", data: { type: "SessionList", sender: -1, data: [] } },
    { event: "Customized", data: { type: "SessionList", sender: 0xffffffff, data: [] } },
  ];
  const broadcast = (message: unknown) => {
    for (const socket of server.clients) socket.send(JSON.stringify(message));
  };
  server.on("connection", socket => {
    const send = (message: unknown) => socket.send(JSON.stringify(message));
    send({ event: "Initialize", data: 123 });
    socket.on("message", raw => {
      const message = JSON.parse(raw.toString()) as { event: string };
      if (message.event === "Register") {
        send({ event: "RoomJoined", data: { room: "", id: 123 } });
        send(clientList());
      } else if (message.event === "ListClients") send(clientList());
      else if (message.event === "Customized") {
        for (const reply of replies()) send(reply);
      }
    });
  });
  const transport = new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`);
  for (const port of ["selected-router", 9]) {
    selectedSender = 9;
    otherSender = 10;
    await using connection = await transport.connect({
      deviceId: `HDT-${address.port}`,
      port,
      signal: AbortSignal.timeout(2_000),
    });
    const reader = connection.readable.getReader();
    const writer = connection.writable.getWriter();
    const readReplies = async () => {
      await writer.write({ event: "Customized", data: { type: "ListSession", data: {} } });
      const received = [];
      for (const _reply of replies()) {
        void _reply;
        const result = await reader.read();
        assert.equal(result.done, false);
        received.push(result.value);
      }
      return received;
    };
    const normalizedReplies = () =>
      replies().map(reply =>
        String(reply.data.sender) === String(selectedSender)
          ? { ...reply, data: { ...reply.data, sender: port } }
          : reply
      );
    try {
      // A numeric target keeps the legacy wire format, including discovery messages.
      if (typeof port === "number") assert.deepEqual((await reader.read()).value, clientList());
      assert.deepEqual(await readReplies(), typeof port === "string" ? normalizedReplies() : replies());
      if (typeof port === "number") continue;

      // HDT can reuse the old numeric ID for another App while this socket stays open.
      selectedSender = 11;
      otherSender = 9;
      broadcast(clientList());
      assert.deepEqual((await reader.read()).value, clientList());
      assert.deepEqual(await readReplies(), normalizedReplies());

      for (const data of [[], [{ id: "invalid", info: { debugRouterId: "selected-router" } }]]) {
        broadcast({ event: "ClientList", data });
        assert.deepEqual((await reader.read()).value, { event: "ClientList", data });
        assert.deepEqual(await readReplies(), replies(), "an absent or invalid mapping must not normalize senders");
      }
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }
  }
});

test("HDTTransport resolves a stable target and closes failed target resolution", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/mdevices/page/android" });
  t.after(() => {
    server.close();
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  assert.ok(address);

  let resolveCustomized: ((message: Record<string, unknown>) => void) | undefined;
  const customizedReceived = new Promise<Record<string, unknown>>((resolve) => {
    resolveCustomized = resolve;
  });
  let connectionCount = 0;
  let listClientsRequests = 0;
  let streamCount = 0;
  const failedConnectionClosed = deferred<void>();
  const failedConnectionCloseStarted = deferred<void>();
  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });
  wsStreams.create = (url) => {
    const stream = originalCreate(url);
    if (++streamCount === 1) return stream;
    return {
      opened: stream.opened,
      closed: failedConnectionClosed.promise,
      close() {
        stream.close();
        failedConnectionCloseStarted.resolve();
      },
    } as never;
  };

  server.on("connection", (socket) => {
    const routes = ++connectionCount === 1 ? [4] : [];
    socket.send(JSON.stringify({ event: "Initialize", data: 123 }));
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (message["event"] === "Register") {
        socket.send(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        socket.send(JSON.stringify({ event: "ClientList", data: [] }));
        return;
      }

      if (message["event"] === "ListClients") {
        listClientsRequests += 1;
        socket.send(JSON.stringify({
          event: "ClientList",
          data: routes.map(id => ({
            id,
            type: "runtime",
            info: {
              App: "TestApp",
              AppVersion: "1.0.0",
              debugRouterId: "router-uuid",
              debugRouterVersion: "1.0.0",
              deviceModel: "TestDevice",
              network: "USB",
              osVersion: "1",
              sdkVersion: "1.0.0",
            },
          })),
        }));
        return;
      }

      if (message["event"] === "Customized") {
        resolveCustomized?.(message);
      }
    });
  });

  const transport = new HDTTransport(`ws://127.0.0.1:${address.port}/mdevices/page/android`);
  await using conn = await transport.connect({
    deviceId: `HDT-${address.port}`,
    port: "router-uuid",
    signal: AbortSignal.timeout(1_000),
  });

  const writer = conn.writable.getWriter();
  try {
    await writer.write({
      event: "Customized",
      data: {
        type: "ListSession",
        data: {},
      },
    });
  } finally {
    writer.releaseLock();
  }

  const timeout = Symbol("timeout");
  const message = await raceWithTimeout(customizedReceived, 500, timeout);
  if (message === timeout) throw new Error("Timed out waiting for Customized message");

  assert.equal(message["to"], 4);
  assert.equal(message["debugRouterId"], "router-uuid");
  assert.deepStrictEqual(message["data"], {
    type: "ListSession",
    data: { client_id: 4 },
    sender: 123,
  });
  assert.equal(listClientsRequests, 1);

  const failedConnection = transport.connect({
    deviceId: `HDT-${address.port}`,
    port: "router-uuid",
    signal: AbortSignal.timeout(1_000),
  });
  await failedConnectionCloseStarted.promise;

  let settled = false;
  void failedConnection.then(() => {
    settled = true;
  }, () => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(settled, false);

  const cleanupError = new Error("controlled cleanup failure");
  failedConnectionClosed.reject(cleanupError);
  await assert.rejects(failedConnection, error => {
    assert.notEqual(error, cleanupError);
    assert.match(String(error), /HDT client with debugRouterId router-uuid was not found/);
    return true;
  });
  assert.equal(listClientsRequests, 2);
});

test("HDTTransport writable waits for the websocket write to finish", async (t) => {
  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const websocketWrite = deferred<void>();
  const customizedWriteStarted = deferred<void>();
  const websocketClosed = deferred<void>();
  let hdtWriteFinished = false;
  let enqueueReadable: ((chunk: string) => void) | undefined;

  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = chunk => controller.enqueue(chunk);
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 123 }));
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      const message = JSON.parse(chunk) as { event?: string };
      if (message.event === "Register") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        });
        return Promise.resolve();
      }

      if (message.event === "Customized") {
        customizedWriteStarted.resolve();
        return websocketWrite.promise;
      }

      return Promise.resolve();
    },
  });

  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        websocketWrite.resolve();
        websocketClosed.resolve();
      },
    }) as never;

  const transport = new HDTTransport("ws://127.0.0.1:19783/mdevices/page/android");
  await using conn = await transport.connect({
    deviceId: "HDT-19783",
    port: 2,
    signal: AbortSignal.timeout(1_000),
  });

  const writer = conn.writable.getWriter();
  try {
    const writePromise = writer.write({
      event: "Customized",
      data: {
        type: "OpenCard",
        data: {},
      },
    }).then(() => {
      hdtWriteFinished = true;
    });

    await customizedWriteStarted.promise;
    await sleep(20);

    assert.equal(hdtWriteFinished, false);

    websocketWrite.resolve();
    await writePromise;

    assert.equal(hdtWriteFinished, true);
  } finally {
    writer.releaseLock();
  }
});

test("HDTTransport surfaces a rejected stable route as a readable error", async (t) => {
  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const websocketClosed = deferred<void>();
  let enqueueReadable: ((chunk: string) => void) | undefined;
  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = chunk => controller.enqueue(chunk);
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 123 }));
    },
  });
  const writable = new WritableStream<string>({
    write(chunk) {
      const message = JSON.parse(chunk) as { event?: string };
      if (message.event === "Register") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
          enqueueReadable?.(JSON.stringify({ event: "ClientList", data: [] }));
        });
      } else if (message.event === "ListClients") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({
            event: "ClientList",
            data: [{ id: 4, info: { debugRouterId: "router-uuid" } }],
          }));
        });
      } else if (message.event === "Customized") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({
            event: "RouteRejected",
            data: {
              debugRouterId: "router-uuid",
              reason: "not_found",
              target: 4,
            },
          }));
        });
      }
    },
  });

  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        websocketClosed.resolve();
      },
    }) as never;

  const transport = new HDTTransport("ws://127.0.0.1:19783/mdevices/page/android");
  await using conn = await transport.connect({
    deviceId: "HDT-19783",
    port: "router-uuid",
    signal: AbortSignal.timeout(1_000),
  });
  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();
  try {
    await writer.write({ event: "Customized", data: { type: "ListSession", data: {} } });
    await assert.rejects(
      () => reader.read(),
      /HDT route router-uuid \(numeric fallback 4\) was rejected: not_found/,
    );
  } finally {
    writer.releaseLock();
    reader.releaseLock();
  }
});

test("HDTTransport listClients rejects when the server never sends ClientList", async (t) => {
  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const websocketClosed = deferred<void>();
  let enqueueReadable: ((chunk: string) => void) | undefined;

  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = chunk => controller.enqueue(chunk);
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 123 }));
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      const message = JSON.parse(chunk) as { event?: string };
      if (message.event === "Register") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({ event: "RoomJoined", data: { room: "", id: 123 } }));
        });
      }
      return Promise.resolve();
    },
  });

  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        websocketClosed.resolve();
      },
    }) as never;

  const transport = new HDTTransport("ws://127.0.0.1:19783/mdevices/page/android");

  await assert.rejects(
    () => transport.listClients(),
    /Timed out waiting for ClientList from HDT transport/,
  );
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
