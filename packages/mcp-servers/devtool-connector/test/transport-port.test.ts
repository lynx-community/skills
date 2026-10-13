// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import net from "node:net";
import { Duplex } from "node:stream";
import { test } from "node:test";
import { DesktopTransport } from "../src/transport/desktop.ts";

test("numeric transports reject a non-numeric client target before connecting", async () => {
  const transport = new DesktopTransport();

  await assert.rejects(
    () => transport.connect({ deviceId: "localhost", port: "router-uuid" }),
    /requires a numeric port/,
  );
});

test("DesktopTransport waits for the socket to close before disposal settles", async (t) => {
  const socket = new DeferredCloseSocket();
  t.mock.method(net, "createConnection", () => socket as net.Socket);
  const transport = new DesktopTransport();
  const connection = await transport.connect({ deviceId: "localhost", port: 8901 });
  let settled = false;

  const disposal = Promise.all([
    connection[Symbol.asyncDispose](),
    connection[Symbol.asyncDispose](),
  ]).then(() => {
    settled = true;
  });
  await socket.destroyStarted.promise;
  await Promise.resolve();

  assert.equal(settled, false);
  socket.finishClose();
  await disposal;
  assert.equal(socket.destroyCalls, 1);
});

test("DesktopTransport preserves a connect error after socket cleanup", async (t) => {
  const socket = new DeferredCloseSocket();
  const connectError = new Error("connect failed");
  socket.connecting = true;
  t.mock.method(net, "createConnection", () => {
    queueMicrotask(() => socket.emit("error", connectError));
    return socket as net.Socket;
  });
  const transport = new DesktopTransport();
  const connecting = transport.connect({ deviceId: "localhost", port: 8901 }).then(
    () => ({ status: "fulfilled" as const }),
    reason => ({ reason, status: "rejected" as const }),
  );

  await socket.destroyStarted.promise;
  const settledBeforeClose = await settlesBeforeImmediate(connecting);

  socket.finishClose();
  const result = await connecting;
  assert.equal(settledBeforeClose, false);
  assert.equal(result.status, "rejected");
  if (result.status === "rejected") {
    assert.strictEqual(result.reason, connectError);
  }
  assert.equal(socket.destroyCalls, 1);
});

class DeferredCloseSocket extends Duplex {
  connecting = false;
  destroyCalls = 0;
  readonly destroyStarted = Promise.withResolvers<void>();
  #finishDestroy: ((error?: Error | null) => void) | undefined;

  override _read(): void {}

  override _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    callback();
  }

  override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    this.destroyCalls += 1;
    this.#finishDestroy = callback;
    this.destroyStarted.resolve();
    void error;
  }

  finishClose(): void {
    this.#finishDestroy?.();
  }
}

async function settlesBeforeImmediate(promise: Promise<unknown>): Promise<boolean> {
  return await Promise.race([
    promise.then(
      () => true,
      () => true,
    ),
    new Promise<false>(resolve => setImmediate(() => resolve(false))),
  ]);
}
