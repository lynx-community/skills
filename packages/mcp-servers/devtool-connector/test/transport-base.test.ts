// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { ClientId, Connector } from "../src/index.ts";
import { connectWithPeertalk } from "../src/transport/base.ts";
import type { Connection, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

test("Peertalk writes await the raw sink and preserve its failure", async () => {
  const started = deferred<void>();
  const finished = deferred<void>();
  const writeFailure = new Error("raw write failure");
  const cleanupFailure = new Error("cleanup failure");
  let disposeCount = 0;
  const raw = rawConnection({
    async write() {
      started.resolve();
      await finished.promise;
      throw writeFailure;
    },
  }, () => {
    disposeCount += 1;
    throw cleanupFailure;
  });
  const connection = await connectRaw(raw);
  const writer = connection.writable.getWriter();
  const write = writer.write(1);

  await started.promise;
  assert.equal(await isSettled(write), false);
  finished.resolve();
  await assert.rejects(write, error => error === writeFailure);
  await assert.rejects(connection[Symbol.asyncDispose](), error => error === cleanupFailure);
  writer.releaseLock();
  assert.equal(disposeCount, 1);
});

test("closing the Peertalk writer keeps raw open and disposal is exact once", async () => {
  let closeCount = 0;
  let disposeCount = 0;
  const connection = await connectRaw(rawConnection({ close: () => closeCount++ }, () => disposeCount++));
  const writer = connection.writable.getWriter();

  await writer.close();
  writer.releaseLock();
  await Promise.all([connection[Symbol.asyncDispose](), connection[Symbol.asyncDispose]()]);
  assert.deepEqual({ closeCount, disposeCount }, { closeCount: 0, disposeCount: 1 });
});

test("Connector aborts a pending Peertalk write before physical disposal", async () => {
  const started = deferred<void>();
  const finished = deferred<void>();
  const events: string[] = [];
  let disposeCount = 0;
  const raw = rawConnection({
    async write(_chunk, controller) {
      const signal = (controller as WritableStreamDefaultController & { readonly signal: AbortSignal }).signal;
      signal.addEventListener("abort", () => events.push("abort"), { once: true });
      started.resolve();
      await finished.promise;
    },
  }, () => {
    disposeCount += 1;
    events.push("dispose");
    assert.deepEqual(events, ["abort", "dispose"]);
    finished.resolve();
  });
  const input = new ReadableStream<string>({ start: controller => controller.enqueue("request") });
  const output = await new Connector([peertalkTransport(raw)]).sendStream<string, string>(
    ClientId.serialize("device", 8901),
    input,
  );
  await started.promise;

  const disposal = output[Symbol.asyncDispose]();
  await setImmediate();
  try {
    assert.deepEqual(events, ["abort", "dispose"]);
  } finally {
    finished.resolve();
  }
  await disposal;
  assert.equal(disposeCount, 1);
});

function connectRaw(raw: Connection<Uint8Array, Uint8Array>) {
  return connectWithPeertalk(() => Promise.resolve(raw), { deviceId: "device", port: 8901 });
}

function peertalkTransport(raw: Connection): Transport {
  return {
    close: () => Promise.resolve(),
    listDevices: () => Promise.resolve([{ id: "device", os: "Android" }]),
    listAvailableApps: () => Promise.resolve([]),
    openApp: () => Promise.resolve(),
    connect<TInput, TOutput>(options: TransportConnectOptions): Promise<Connection<TOutput, TInput>> {
      return connectWithPeertalk<TInput, TOutput>(() => Promise.resolve(raw), options);
    },
  };
}

function rawConnection(
  sink: UnderlyingSink<Uint8Array>,
  dispose: () => void | Promise<void>,
): Connection<Uint8Array, Uint8Array> {
  return {
    readable: new ReadableStream(),
    writable: new WritableStream(sink),
    async [Symbol.asyncDispose]() {
      await dispose();
    },
  };
}

async function isSettled(promise: Promise<unknown>) {
  let settled = false;
  void promise.then(() => {
    settled = true;
  }, () => {
    settled = true;
  });
  await setImmediate();
  return settled;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}
