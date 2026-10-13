// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { AndroidTransport } from "../src/transport/android.ts";

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
    value: { createDeviceConnection },
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

test("Android disposal reports a physical close rejection after close succeeds", async () => {
  const transport = new AndroidTransport();
  const rawSocket = createRawSocket();
  const closedError = new Error("physical close failed");
  installClient(transport, async () => rawSocket);

  const connection = await transport.connect({ deviceId: "device", port: 8901 });
  rawSocket.rejectClosed(closedError);

  await assert.rejects(
    connection[Symbol.asyncDispose](),
    error => error === closedError,
  );
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
      const closed = new Promise<undefined>(resolve => {
        socket.once("close", () => resolve(undefined));
      });
      socket.connect(address.port, "127.0.0.1");
      await once(socket, "connect");
      return {
        readable: new ReadableStream<Uint8Array>({
          start(controller) {
            socket.on("data", data => controller.enqueue(data));
            socket.on("end", () => controller.close());
            socket.on("error", error => controller.error(error));
          },
        }),
        writable: new WritableStream<Uint8Array>({
          write(chunk) {
            return new Promise<void>((resolve, reject) => {
              socket.write(chunk, error => error ? reject(error) : resolve());
            });
          },
        }),
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
    await Promise.resolve();
    assert.equal(disposed, false);

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
