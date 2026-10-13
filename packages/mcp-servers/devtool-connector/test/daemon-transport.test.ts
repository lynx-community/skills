// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { WebSocketServer } from "ws";
import { DaemonManager } from "../src/daemon/manager.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import { wsStreams } from "../src/transport/ws-stream.ts";
import { raceWithTimeout } from "./raceWithTimeout.ts";

test("DaemonTransport connects to an explicit WebSocket URL without managing port 21783", async (t) => {
  const server = new WebSocketServer({ port: 0 });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  let requestUrl: string | undefined;
  server.on("connection", (ws, request) => {
    requestUrl = request.url;
    ws.send(JSON.stringify({ event: "Initialize", data: 1 }));
    ws.on("message", (raw) => {
      const message = JSON.parse(String(raw)) as {
        event?: string;
        data?: { id?: number; method?: string };
      };
      if (message.event === "Control" && message.data?.method === "listDevices") {
        ws.send(JSON.stringify({
          event: "ControlResponse",
          data: { id: message.data.id, result: [] },
        }));
      }
    });
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  const ensureRunning = t.mock.method(DaemonManager, "ensureRunning", async () => {
    throw new Error("explicit URLs must not start the default daemon");
  });
  const endpoint = `ws://127.0.0.1:${address.port}/devtool/connector/by-session?session=test`;

  assert.deepEqual(await new DaemonTransport(endpoint).listDevices(), []);
  assert.equal(requestUrl, "/devtool/connector/by-session?session=test");
  assert.equal(ensureRunning.mock.callCount(), 0);
});

test("DaemonTransport rejects non-WebSocket explicit URLs", () => {
  assert.throws(
    () => new DaemonTransport("https://sandbox.example/devtool/connector"),
    /must use ws: or wss:/u,
  );
});

test("DaemonTransport listClients sends explicit Control listClients request", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/devtool/connector" });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  server.on("connection", (ws) => {
    ws.send(JSON.stringify({ event: "Initialize", data: 1 }));
    ws.on("message", (raw) => {
      const msg = JSON.parse(String(raw)) as {
        event?: string;
        data?: { id?: number; method?: string };
      };
      if (msg.event !== "Control" || msg.data?.method !== "listClients") {
        return;
      }

      setTimeout(() => {
        ws.send(JSON.stringify({
          event: "ControlResponse",
          data: {
            id: msg.data.id,
            result: [{ id: "device:8901", info: { App: "FakeApp" } }],
          },
        }));
      }, 1_200);
    });
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  t.mock.method(
    DaemonManager,
    "ensureRunning",
    async () => `ws://127.0.0.1:${address.port}/devtool/connector`,
  );

  const transport = new DaemonTransport(address.port);
  const clients = await transport.listClients();

  assert.equal(clients.length, 1);
  assert.equal(clients[0]?.id, "device:8901");
});

test("DaemonTransport closes daemon connection when subscribe fails", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/devtool/connector" });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  let resolveClosed: (() => void) | undefined;
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve;
  });

  server.on("connection", (ws) => {
    ws.send(JSON.stringify({ event: "Initialize", data: 1 }));
    ws.on("close", () => {
      resolveClosed?.();
    });
    ws.on("message", (raw) => {
      const msg = JSON.parse(String(raw)) as {
        event?: string;
        data?: { id?: number; method?: string };
      };

      if (msg.event !== "Control" || msg.data?.method !== "subscribe") {
        return;
      }

      ws.send(JSON.stringify({
        event: "ControlResponse",
        data: { id: msg.data.id, error: "device unavailable" },
      }));
    });
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  t.mock.method(
    DaemonManager,
    "ensureRunning",
    async () => `ws://127.0.0.1:${address.port}/devtool/connector`,
  );

  const transport = new DaemonTransport(address.port);
  await assert.rejects(() => transport.connect({ deviceId: "device", port: 8901 }));

  const timeout = Symbol("timeout");
  const result = await raceWithTimeout(closed, 500, timeout);
  if (result === timeout) throw new Error("Timed out waiting for daemon connection to close");
});

test("DaemonTransport aborts a stalled subscribe with the caller reason", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const subscribeReceived = deferred<void>();
  const readCanceled = deferred<void>();
  const websocketClosed = deferred<void>();
  let readCanceledReason: unknown;
  let closeReadable!: () => void;
  const readable = new ReadableStream<string>({
    start(controller) {
      closeReadable = () => controller.close();
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 1 }));
    },
    cancel(reason) {
      readCanceledReason = reason;
      readCanceled.resolve();
    },
  });
  const writable = new WritableStream<string>({
    write(chunk) {
      const msg = JSON.parse(chunk) as {
        event?: string;
        data?: { method?: string };
      };
      if (msg.event === "Control" && msg.data?.method === "subscribe") {
        subscribeReceived.resolve();
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

  const controller = new AbortController();
  const reason = new Error("caller canceled subscribe");
  const connecting = new DaemonTransport(21783).connect({
    deviceId: "device",
    port: 8901,
    signal: controller.signal,
  });

  const subscribeTimeout = Symbol("subscribe timeout");
  if (await raceWithTimeout(subscribeReceived.promise, 500, subscribeTimeout) === subscribeTimeout) {
    throw new Error("Timed out waiting for stalled subscribe");
  }
  controller.abort(reason);

  const rejection = connecting.then(
    () => undefined,
    (error: unknown) => error,
  );
  const rejectionTimeout = Symbol("rejection timeout");
  const error = await raceWithTimeout(rejection, 500, rejectionTimeout);
  if (error === rejectionTimeout) {
    closeReadable();
    await connecting.catch(() => {});
    throw new Error("Timed out waiting for stalled subscribe to abort");
  }
  assert(error instanceof Error);
  assert.equal(error.message, "Failed to subscribe to device:8901");
  assert.equal(error.cause, reason);

  const readCancelTimeout = Symbol("read cancel timeout");
  if (await raceWithTimeout(readCanceled.promise, 500, readCancelTimeout) === readCancelTimeout) {
    throw new Error("Timed out waiting for stalled subscribe reader to cancel");
  }
  assert.equal(readCanceledReason, reason);
});

test("DaemonTransport preserves the internal subscribe timeout cause", async (t) => {
  const server = new WebSocketServer({ port: 0, path: "/devtool/connector" });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  const subscribeReceived = deferred<void>();
  const closed = deferred<void>();
  server.on("connection", (ws) => {
    ws.send(JSON.stringify({ event: "Initialize", data: 1 }));
    ws.on("close", () => {
      closed.resolve();
    });
    ws.on("message", (raw) => {
      const msg = JSON.parse(String(raw)) as {
        event?: string;
        data?: { method?: string };
      };
      if (msg.event === "Control" && msg.data?.method === "subscribe") {
        subscribeReceived.resolve();
      }
    });
  });

  const address = server.address();
  assert(address && typeof address !== "string");
  t.mock.method(
    DaemonManager,
    "ensureRunning",
    async () => `ws://127.0.0.1:${address.port}/devtool/connector`,
  );

  const internalTimeout = new DOMException("subscribe timed out", "TimeoutError");
  const timeoutController = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  let requestedTimeoutMs: number | undefined;
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    if (delay === 10_000) {
      requestedTimeoutMs = delay;
      return timeoutController.signal;
    }
    return originalTimeout(delay);
  });

  const connecting = new DaemonTransport(address.port).connect({
    deviceId: "device",
    port: 8901,
  });

  const subscribeTimeout = Symbol("subscribe timeout");
  if (await raceWithTimeout(subscribeReceived.promise, 500, subscribeTimeout) === subscribeTimeout) {
    throw new Error("Timed out waiting for stalled subscribe");
  }
  assert.equal(requestedTimeoutMs, 10_000);
  timeoutController.abort(internalTimeout);

  await assert.rejects(connecting, (error: unknown) => {
    assert(error instanceof Error);
    assert.equal(error.message, "Failed to subscribe to device:8901");
    assert.equal(error.cause, internalTimeout);
    return true;
  });

  const closeTimeout = Symbol("close timeout");
  if (await raceWithTimeout(closed.promise, 500, closeTimeout) === closeTimeout) {
    throw new Error("Timed out waiting for daemon connection to close");
  }
});

test("DaemonTransport does not attach the subscribe timeout to an established connection", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const timeoutController = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(
    AbortSignal,
    "timeout",
    (delay: number) => delay === 10_000 ? timeoutController.signal : originalTimeout(delay),
  );

  let enqueueReadable!: (chunk: string) => void;
  let closeReadable!: () => void;
  let customizedWritten = false;
  let closeCalls = 0;
  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = chunk => controller.enqueue(chunk);
      closeReadable = () => controller.close();
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 1 }));
    },
  });
  const writable = new WritableStream<string>({
    write(chunk) {
      const msg = JSON.parse(chunk) as {
        event?: string;
        data?: { id?: number; method?: string };
      };
      if (msg.event === "Control" && msg.data?.method === "subscribe") {
        queueMicrotask(() => {
          enqueueReadable(JSON.stringify({
            event: "ControlResponse",
            data: { id: msg.data?.id, result: null },
          }));
        });
      } else if (msg.event === "Customized") {
        customizedWritten = true;
      }
    },
  });
  const websocketClosed = deferred<void>();
  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        closeCalls++;
        closeReadable();
        websocketClosed.resolve();
      },
    }) as never;

  await using connection = await new DaemonTransport(21783).connect({
    deviceId: "device",
    port: 8901,
  });
  timeoutController.abort(new DOMException("subscribe timed out", "TimeoutError"));

  const writer = connection.writable.getWriter();
  try {
    await writer.write({
      event: "Customized",
      data: { type: "ListSession", data: {} },
    });
  } finally {
    writer.releaseLock();
  }

  assert.equal(customizedWritten, true);
  assert.equal(closeCalls, 0);
});

test("DaemonTransport aborts stalled daemon Register writes", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  let abortCalled = false;

  class HangingWebSocketStream {
    #resolveClosed: (() => void) | undefined;

    opened = Promise.resolve({
      readable: new ReadableStream<string>({
        start(controller) {
          controller.enqueue(JSON.stringify({ event: "Initialize", data: 1 }));
          controller.close();
        },
      }),
      writable: {
        getWriter() {
          let rejectWrite: ((reason?: unknown) => void) | undefined;

          return {
            write() {
              return new Promise<never>((_, reject) => {
                rejectWrite = reject;
              });
            },
            abort(reason?: unknown) {
              abortCalled = true;
              rejectWrite?.(reason);
              return Promise.resolve();
            },
            releaseLock() {},
          };
        },
      },
    });

    closed = new Promise<void>((resolve) => {
      this.#resolveClosed = resolve;
    });

    close() {
      this.#resolveClosed?.();
    }
  }

  wsStreams.create = (/* url */) => new HangingWebSocketStream() as never;

  const transport = new DaemonTransport(21783);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new DOMException("register write timed out", "TimeoutError"));
  }, 20);
  t.after(() => {
    clearTimeout(timeout);
  });

  await assert.rejects(
    async () => {
      const timeout = Symbol("timeout");
      const result = await raceWithTimeout(
        transport.connect({ deviceId: "device", port: 8901, signal: controller.signal }),
        500,
        timeout,
      );
      if (result === timeout) throw new Error("Timed out waiting for stalled Register write to abort");
      return result;
    },
    (error: unknown) =>
      error instanceof DOMException
      && error.name === "TimeoutError"
      && error.message === "register write timed out",
  );
  assert.equal(abortCalled, true);
});

test("DaemonTransport releases the Initialize reader when the first read fails", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const failure = new Error("Initialize read failed");
  const readable = new ReadableStream<string>({
    start(controller) {
      controller.error(failure);
    },
  });

  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable: new WritableStream<string>() }),
      closed: Promise.resolve(),
      close() {},
    }) as never;

  const transport = new DaemonTransport(21783);
  await assert.rejects(
    () => transport.connect({ deviceId: "device", port: 8901 }),
    failure,
  );
  assert.equal(readable.locked, false);
});

test("DaemonTransport retries refused handshakes through daemon convergence without replaying Control", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");
  let now = 0;
  t.mock.method(Date, "now", () => {
    now += 3_000;
    return now;
  });

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const refused = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:21783"), { code: "ECONNREFUSED" });
  const websocketClosed = deferred<void>();
  let attempts = 0;
  let controlRequests = 0;
  let enqueueReadable: ((chunk: string) => void) | undefined;
  let closeReadable: (() => void) | undefined;

  wsStreams.create = () => {
    attempts += 1;
    if (attempts <= 2) {
      return {
        opened: Promise.reject(refused),
        closed: Promise.reject(refused),
        close() {},
      } as never;
    }

    const readable = new ReadableStream<string>({
      start(controller) {
        enqueueReadable = chunk => controller.enqueue(chunk);
        closeReadable = () => controller.close();
        controller.enqueue(JSON.stringify({ event: "Initialize", data: 123 }));
      },
    });
    const writable = new WritableStream<string>({
      write(chunk) {
        const message = JSON.parse(chunk) as { event?: string; data?: { id?: number; method?: string } };
        if (message.event === "Control") {
          controlRequests += 1;
          queueMicrotask(() => {
            enqueueReadable?.(JSON.stringify({
              event: "ControlResponse",
              data: { id: message.data?.id, result: [] },
            }));
          });
        }
      },
    });
    return {
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        closeReadable?.();
        websocketClosed.resolve();
      },
    } as never;
  };

  assert.deepStrictEqual(await new DaemonTransport(21783).listDevices(), []);
  assert.equal(attempts, 3);
  assert.equal(controlRequests, 1);
});

test("DaemonTransport writable waits for the websocket write to finish", async (t) => {
  t.mock.method(DaemonManager, "ensureRunning", async () => "ws://daemon.test/devtool/connector");

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const websocketWrite = deferred<void>();
  const customizedWriteStarted = deferred<void>();
  const websocketClosed = deferred<void>();
  let daemonWriteFinished = false;
  let enqueueReadable: ((chunk: string) => void) | undefined;

  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = chunk => controller.enqueue(chunk);
      controller.enqueue(JSON.stringify({ event: "Initialize", data: 123 }));
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      const message = JSON.parse(chunk) as { event?: string; data?: { id?: number; method?: string } };
      if (message.event === "Control" && message.data?.method === "subscribe") {
        queueMicrotask(() => {
          enqueueReadable?.(JSON.stringify({
            event: "ControlResponse",
            data: { id: message.data?.id, result: null },
          }));
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

  const transport = new DaemonTransport(21783);
  await using conn = await transport.connect({
    deviceId: "device",
    port: 8901,
    signal: AbortSignal.timeout(1_000),
  });

  const writer = conn.writable.getWriter();
  try {
    const writePromise = writer.write({
      event: "Customized",
      data: {
        type: "ListSession",
        data: {},
      },
    }).then(() => {
      daemonWriteFinished = true;
    });

    await customizedWriteStarted.promise;
    await sleep(20);

    assert.equal(daemonWriteFinished, false);

    websocketWrite.resolve();
    await writePromise;

    assert.equal(daemonWriteFinished, true);
  } finally {
    writer.releaseLock();
  }
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
