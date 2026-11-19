// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import { Readable, Writable } from "node:stream";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { Connector } from "../src/index.ts";
import { AndroidTransport } from "../src/transport/android.ts";
import { encodePeertalkMessage } from "../src/transport/peertalk.ts";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type RawSocket = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  closed: Promise<undefined>;
  close: () => void | Promise<void>;
  closeCalls: number;
  closeRequested: Promise<void>;
  resolveClosed: () => void;
  rejectClosed: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>["resolve"];
  let reject!: Deferred<T>["reject"];
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createRawSocket(signal?: AbortSignal): RawSocket {
  const closed = deferred<undefined>();
  const closeRequested = deferred<void>();
  let closeCalls = 0;
  if (signal) {
    if (signal.aborted) {
      closed.resolve(undefined);
    } else {
      signal.addEventListener("abort", () => closed.resolve(undefined), { once: true });
    }
  }
  return {
    readable: new ReadableStream<Uint8Array>(),
    writable: new WritableStream<Uint8Array>(),
    closed: closed.promise,
    close() {
      closeCalls += 1;
      closeRequested.resolve();
    },
    get closeCalls() {
      return closeCalls;
    },
    closeRequested: closeRequested.promise,
    resolveClosed() {
      closed.resolve(undefined);
    },
    rejectClosed(reason) {
      closed.reject(reason);
    },
  };
}

function installClient(
  transport: AndroidTransport,
  createDeviceConnection: (...args: unknown[]) => Promise<RawSocket>,
): void {
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor() {},
      createDeviceConnection,
    },
  });
}

function nextImmediate(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

test("Android direct connections bind cancellation to the ADB service socket", async () => {
  const controller = new AbortController();
  const reason = new Error("discovery canceled");
  const events: string[] = [];
  let receivedSignal: AbortSignal | undefined;
  let createAdbCount = 0;
  let closeCalls = 0;
  const transport = new AndroidTransport();
  const rawSocket = createRawSocket();
  rawSocket.close = () => {
    closeCalls += 1;
    events.push("close");
    rawSocket.resolveClosed();
  };
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor() {},
      async createAdb() {
        createAdbCount += 1;
        throw new Error("direct connection must not create an Adb transport");
      },
      async createDeviceConnection(
        _device: unknown,
        _service: unknown,
        options?: { signal?: AbortSignal },
      ) {
        receivedSignal = options?.signal;
        options?.signal?.addEventListener(
          "abort",
          () => {
            events.push("socket-abort");
            rawSocket.resolveClosed();
          },
          { once: true },
        );
        return rawSocket;
      },
    },
  });

  const connection = await transport.connect({
    deviceId: "device",
    port: 8901,
    signal: controller.signal,
  });
  assert.notEqual(receivedSignal, controller.signal);
  assert.equal(receivedSignal?.aborted, false);
  assert.equal(createAdbCount, 0);

  controller.abort(reason);
  assert.deepEqual(events.sort(), ["close", "socket-abort"]);

  await connection[Symbol.asyncDispose]();
  assert.equal(closeCalls, 1);
});

test("Android disposal waits for the physical socket close before the next connection", async () => {
  const transport = new AndroidTransport();
  const sockets: RawSocket[] = [];
  const signals: AbortSignal[] = [];
  installClient(transport, async (...args) => {
    const options = args[2] as { signal?: AbortSignal } | undefined;
    const signal = options?.signal;
    assert.ok(signal);
    const socket = createRawSocket(signal);
    sockets.push(socket);
    signals.push(signal);
    return socket;
  });

  const firstConnection = await transport.connect({ deviceId: "device", port: 8901 });
  const firstSocket = sockets[0]!;
  let firstDisposed = false;
  const firstDispose = firstConnection[Symbol.asyncDispose]().then(() => {
    firstDisposed = true;
  });
  await firstSocket.closeRequested;
  await Promise.resolve();
  assert.equal(firstDisposed, false);
  assert.equal(firstSocket.closeCalls, 1);

  const secondConnectionPromise = firstDispose.then(() => {
    return transport.connect({ deviceId: "device", port: 8901 });
  });
  await Promise.resolve();
  assert.equal(sockets.length, 1);

  await nextImmediate();
  const secondConnection = await secondConnectionPromise;
  assert.equal(firstDisposed, true);
  assert.equal(signals[0]?.aborted, true);
  assert.equal(sockets.length, 2);

  const secondSocket = sockets[1]!;
  await secondConnection[Symbol.asyncDispose]();
  assert.equal(secondSocket.closeCalls, 1);
});

test("Android already-aborted connections wait for the socket close and preserve the abort reason", async () => {
  const transport = new AndroidTransport();
  const controller = new AbortController();
  const reason = new Error("request deadline");
  const rawSocket = createRawSocket();
  installClient(transport, async () => {
    controller.abort(reason);
    return rawSocket;
  });

  const connectionPromise = transport.connect({
    deviceId: "device",
    port: 8901,
    signal: controller.signal,
  });
  await rawSocket.closeRequested;
  let settled = false;
  void connectionPromise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await Promise.resolve();
  assert.equal(settled, false);

  rawSocket.resolveClosed();
  await assert.rejects(connectionPromise, error => error === reason);
});

test("Android already-aborted cleanup errors do not mask the abort reason", async () => {
  const transport = new AndroidTransport();
  const controller = new AbortController();
  const reason = new Error("request deadline");
  const closeError = new Error("close failed");
  const closedError = new Error("closed failed");
  const rawSocket = createRawSocket();
  rawSocket.close = () => {
    throw closeError;
  };
  installClient(transport, async () => {
    controller.abort(reason);
    rawSocket.rejectClosed(closedError);
    return rawSocket;
  });

  await assert.rejects(
    transport.connect({
      deviceId: "device",
      port: 8901,
      signal: controller.signal,
    }),
    error => error === reason,
  );
});

test("Android disposal ignores socket.closed rejection caused by stream cancellation", async () => {
  const transport = new AndroidTransport();
  const rawSocket = createRawSocket();
  const closedError = new Error("socket closed by stream abort");
  installClient(transport, async () => rawSocket);

  const connection = await transport.connect({ deviceId: "device", port: 8901 });
  rawSocket.rejectClosed(closedError);

  await connection[Symbol.asyncDispose]();
  assert.equal(rawSocket.closeCalls, 1);
});

test("Android abort and disposal share one close request", async () => {
  const transport = new AndroidTransport();
  const controller = new AbortController();
  const rawSockets: RawSocket[] = [];
  installClient(transport, async (...args) => {
    const options = args[2] as { signal?: AbortSignal } | undefined;
    const socket = createRawSocket(options?.signal);
    rawSockets.push(socket);
    return socket;
  });

  const connection = await transport.connect({
    deviceId: "device",
    port: 8901,
    signal: controller.signal,
  });
  const dispose = connection[Symbol.asyncDispose]();
  controller.abort(new Error("request canceled"));

  await dispose;
  assert.equal(rawSockets[0]?.closeCalls, 1);
});

test("Android disposal hard-closes a half-open Node socket", async () => {
  const serverSockets = new Set<net.Socket>();
  const server = net.createServer({ allowHalfOpen: true }, socket => {
    serverSockets.add(socket);
    socket.once("close", () => serverSockets.delete(socket));
    socket.on("error", () => {});
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  if (!address || typeof address === "string") {
    throw new Error("test server did not expose a TCP address");
  }

  let clientSocket: net.Socket | undefined;
  try {
    const transport = new AndroidTransport();
    installClient(transport, async (...args) => {
      const options = args[2] as { signal?: AbortSignal } | undefined;
      const socket = new net.Socket({ signal: options?.signal });
      clientSocket = socket;
      socket.on("error", () => {});
      const closed = new Promise<undefined>((resolve, reject) => {
        socket.once("close", () => resolve(undefined));
        socket.once("error", reject);
      });
      socket.connect(address.port, "127.0.0.1");
      await once(socket, "connect");
      return {
        readable: Readable.toWeb(socket) as ReadableStream<Uint8Array>,
        writable: Writable.toWeb(socket) as WritableStream<Uint8Array>,
        closed,
        close() {
          socket.end();
        },
      };
    });

    const connection = await transport.connect({ deviceId: "device", port: 8901 });
    let disposed = false;
    const dispose = connection[Symbol.asyncDispose]().then(() => {
      disposed = true;
    });
    await nextImmediate();
    assert.equal(disposed, false);
    assert.equal(clientSocket?.destroyed, false);

    await dispose;
    assert.equal(clientSocket?.destroyed, true);
  } finally {
    clientSocket?.destroy();
    for (const socket of serverSockets) socket.destroy();
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test("Android connect waits for the ADB device before creating the socket", async () => {
  const transport = new AndroidTransport();
  const events: string[] = [];
  let waitSignal: AbortSignal | undefined;
  let receivedSignal: AbortSignal | undefined;
  const rawSocket = createRawSocket();
  rawSocket.close = () => {
    rawSocket.resolveClosed();
  };
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor(
        device: unknown,
        state: unknown,
        options?: { signal?: AbortSignal },
      ) {
        events.push(`waitFor:${JSON.stringify(device)}:${String(state)}`);
        waitSignal = options?.signal;
      },
      async createDeviceConnection(
        device: unknown,
        service: unknown,
        options?: { signal?: AbortSignal },
      ) {
        events.push(`createDeviceConnection:${JSON.stringify(device)}:${String(service)}`);
        receivedSignal = options?.signal;
        return rawSocket;
      },
    },
  });

  const connection = await transport.connect({
    deviceId: "adb.lynx-sandbox.byted.org:29453",
    port: 8901,
  });
  assert.deepEqual(events, [
    "waitFor:{\"serial\":\"adb.lynx-sandbox.byted.org:29453\"}:device",
    "createDeviceConnection:{\"serial\":\"adb.lynx-sandbox.byted.org:29453\"}:tcp:8901",
  ]);
  assert.equal(waitSignal?.aborted, false);
  assert.equal(receivedSignal?.aborted, false);
  await connection[Symbol.asyncDispose]();
});

test("Android listDevices includes offline devices and honours the configured ADB serials", async (t) => {
  const previousEnv = process.env["LYNX_DEVTOOL_MCP_TESTING_ADB_DEVICES"];
  t.after(() => {
    if (previousEnv === undefined) {
      delete process.env["LYNX_DEVTOOL_MCP_TESTING_ADB_DEVICES"];
    } else {
      process.env["LYNX_DEVTOOL_MCP_TESTING_ADB_DEVICES"] = previousEnv;
    }
  });
  delete process.env["LYNX_DEVTOOL_MCP_TESTING_ADB_DEVICES"];

  const transport = new AndroidTransport();
  let includeStates: readonly string[] | undefined;
  Object.defineProperty(transport, "client", {
    value: {
      async getDevices(states?: readonly string[]) {
        includeStates = states;
        return [{ serial: "device" }, { serial: "unauthorized" }, { serial: "offline" }];
      },
    },
  });

  assert.deepEqual(await transport.listDevices(), [
    { os: "Android", id: "device" },
    { os: "Android", id: "unauthorized" },
    { os: "Android", id: "offline" },
  ]);
  assert.deepEqual(includeStates, ["device", "unauthorized", "offline"]);

  process.env["LYNX_DEVTOOL_MCP_TESTING_ADB_DEVICES"] = " offline , other ";
  assert.deepEqual(await transport.listDevices(), [{ os: "Android", id: "offline" }]);
});

test("Android concurrent waits for one device share a single ADB wait without cancelling active peers", async () => {
  const transport = new AndroidTransport();
  const waits: AbortSignal[] = [];
  const release = deferred<void>();
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor(_device: unknown, _state: unknown, options?: { signal?: AbortSignal }) {
        waits.push(options!.signal!);
        await release.promise;
      },
      async createDeviceConnection() {
        const rawSocket = createRawSocket();
        rawSocket.close = () => rawSocket.resolveClosed();
        return rawSocket;
      },
    },
  });

  const abortingCaller = new AbortController();
  const first = transport.connect({ deviceId: "device", port: 8901, signal: abortingCaller.signal });
  const second = transport.connect({ deviceId: "device", port: 8902 });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(waits.length, 1);

  abortingCaller.abort(new Error("early abort"));
  await assert.rejects(first, { message: "early abort" });
  assert.equal(waits[0]?.aborted, false);

  release.resolve();
  const connection = await second;
  assert.equal(waits.length, 1);
  assert.equal(waits[0]?.aborted, false);
  await connection[Symbol.asyncDispose]();
});

test("Android connection retries once when the ADB handshake finds a disconnected device", async () => {
  const transport = new AndroidTransport();
  let waitForCalls = 0;
  const handshakes: unknown[] = [];
  const rawSocket = createRawSocket();
  rawSocket.close = () => rawSocket.resolveClosed();
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor() {
        waitForCalls += 1;
      },
      async createDeviceConnection(_device: unknown, service: unknown) {
        handshakes.push(service);
        if (handshakes.length === 1) throw new Error("closed");
        return rawSocket;
      },
    },
  });

  const connection = await transport.connect({ deviceId: "device", port: 8901 });
  assert.deepEqual(handshakes, ["tcp:8901", "tcp:8901"]);
  assert.equal(waitForCalls, 2);
  await connection[Symbol.asyncDispose]();
});

test("Android connection does not retry refused ports or aborted callers", async () => {
  for (const [message, abort] of [["cannot connect", false], ["closed", true]] as const) {
    const transport = new AndroidTransport();
    const controller = new AbortController();
    let handshakeCalls = 0;
    const failure = new Error(message);
    Object.defineProperty(transport, "client", {
      value: {
        async waitFor() {},
        async createDeviceConnection() {
          handshakeCalls += 1;
          if (abort) controller.abort(failure);
          throw failure;
        },
      },
    });

    await assert.rejects(
      transport.connect({ deviceId: "device", port: 8901, signal: controller.signal }),
      error => error === failure,
    );
    assert.equal(handshakeCalls, 1);
  }
});

test("Android openApp falls through to createAdb when waitFor times out on a missing device", async (t) => {
  const timeoutController = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  let requestedTimeoutMs: number | undefined;
  t.mock.method(
    AbortSignal,
    "timeout",
    (delay: number) => {
      if (delay === 8_000) {
        requestedTimeoutMs = delay;
        return timeoutController.signal;
      }
      return originalTimeout(delay);
    },
  );

  const transport = new AndroidTransport();
  Object.defineProperty(transport, "client", {
    value: {
      async waitFor(_device: unknown, _state: unknown, options?: { signal?: AbortSignal }) {
        timeoutController.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
        options?.signal?.throwIfAborted();
      },
      async createAdb() {
        throw new Error("device 'foo.bar' not found");
      },
    },
  });

  await assert.rejects(
    () => transport.openApp("foo.bar", "baz"),
    {
      name: "Error",
      message: "device 'foo.bar' not found",
    },
  );
  assert.equal(requestedTimeoutMs, 8_000);
});

test("Android direct discovery and request disposal succeed over AdbServerNodeJsClient", async () => {
  const serverSockets = new Set<net.Socket>();
  const server = net.createServer({ allowHalfOpen: true }, (sock) => {
    serverSockets.add(sock);
    sock.once("close", () => serverSockets.delete(sock));
    sock.on("error", () => {});
    let mode = "adb";
    let buf = "";
    sock.on("data", (chunk) => {
      if (mode === "peertalk") {
        const msg = JSON.parse(chunk.subarray(20).toString("utf8")) as {
          event: string;
          data?: { type?: string; data?: { message?: { global_key?: string } } };
        };
        if (msg.event === "Initialize") {
          sock.write(encodePeertalkMessage({
            event: "Register",
            data: { info: { App: "com.lynx.uiapp", AppProcessName: "com.lynx.uiapp" }, id: 8901 },
          }));
        } else if (msg.event === "Customized") {
          if (msg.data?.type === "SetGlobalSwitch") {
            sock.write(encodePeertalkMessage({
              event: "Customized",
              data: {
                type: "SetGlobalSwitch",
                data: {
                  client_id: 8901,
                  session_id: -1,
                  message: JSON.stringify({
                    global_key: msg.data.data?.message?.global_key,
                    global_value: true,
                  }),
                },
              },
            }));
          } else if (msg.data?.type === "ListSession") {
            sock.write(encodePeertalkMessage({
              event: "Customized",
              data: {
                type: "SessionList",
                data: [{ session_id: 1, url: "https://example.com/template.js" }],
                sender: 8901,
              },
            }));
          }
        }
        return;
      }
      buf += chunk.toString("utf8");
      while (buf.length >= 4) {
        const len = Number.parseInt(buf.slice(0, 4), 16);
        if (buf.length < 4 + len) break;
        const cmd = buf.slice(4, 4 + len);
        buf = buf.slice(4 + len);
        if (cmd === "host:version") {
          sock.write("OKAY00040029");
        } else if (cmd === "host:devices-l") {
          const line = "test-device device product:a model:b device:c transport_id:1\n";
          sock.write(`OKAY${line.length.toString(16).padStart(4, "0")}${line}`);
        } else if (cmd.startsWith("host-serial:test-device:wait-for-")) {
          sock.write("OKAYOKAY");
        } else if (cmd === "host:tport:serial:test-device") {
          const resp = Buffer.alloc(12);
          resp.write("OKAY", 0);
          resp.writeBigUInt64LE(1n, 4);
          sock.write(resp);
        } else if (cmd === "tcp:8901") {
          sock.write("OKAY");
          mode = "peertalk";
        } else if (cmd.startsWith("tcp:")) {
          sock.write("FAIL000ecannot connect");
        }
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const transport = new AndroidTransport({ host: "127.0.0.1", port: address.port });
    const connector = new Connector([transport]);
    const clients = await connector.listClients();
    assert.deepEqual(clients, [
      {
        id: "android:test-device:8901",
        info: { App: "com.lynx.uiapp", AppProcessName: "com.lynx.uiapp" },
        port: 8901,
      },
    ]);

    const sessions = await connector.sendListSessionMessage("android:test-device:8901");
    assert.deepEqual(sessions, [
      { session_id: 1, url: "https://example.com/template.js", type: undefined },
    ]);
  } finally {
    for (const socket of serverSockets) socket.destroy();
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});
