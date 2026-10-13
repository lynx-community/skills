// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import type { ReadableStream, ReadableStreamReadResult, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { readMessages, readOnce, writeOnce } from "../src/transport/stream-lifecycle.ts";

test("readOnce waits for cancellation before releasing the reader lock", async () => {
  const read = deferred<ReadableStreamReadResult<string>>();
  const cancel = deferred<void>();
  let released = false;
  const reader = {
    read: () => read.promise,
    cancel: () => cancel.promise,
    releaseLock: () => {
      released = true;
    },
  };
  const controller = new AbortController();
  const pending = readOnce(fakeReadable(reader), controller.signal);

  controller.abort(new Error("read canceled"));
  read.resolve({ done: true, value: undefined });
  await setImmediate();
  assert.equal(await isSettled(pending), false);
  assert.equal(released, false);

  cancel.resolve();
  assert.deepEqual(await pending, { done: true, value: undefined });
  assert.equal(released, true);
});

test("readOnce preserves the read error when cancellation also fails", async () => {
  const read = deferred<ReadableStreamReadResult<string>>();
  const cancel = deferred<void>();
  const readError = new Error("read failed");
  const reader = {
    read: () => read.promise,
    cancel: () => cancel.promise,
    releaseLock() {},
  };
  const controller = new AbortController();
  const pending = readOnce(fakeReadable(reader), controller.signal);

  controller.abort(new Error("read canceled"));
  read.reject(readError);
  await setImmediate();
  assert.equal(await isSettled(pending), false);

  cancel.reject(new Error("cancel failed"));
  await assert.rejects(pending, error => error === readError);
});

test("readOnce handles an abort while acquiring the reader", async () => {
  const abortReason = new Error("read canceled");
  const controller = new AbortController();
  let cancelReason: unknown;
  let released = false;
  const reader = {
    read: () => Promise.resolve<ReadableStreamReadResult<string>>({ done: true, value: undefined }),
    cancel: (reason?: unknown) => {
      cancelReason = reason;
      return Promise.resolve();
    },
    releaseLock: () => {
      released = true;
    },
  };
  const readable = {
    getReader: () => {
      controller.abort(abortReason);
      return reader;
    },
  } as unknown as ReadableStream<string>;

  assert.deepEqual(await readOnce(readable, controller.signal), { done: true, value: undefined });
  assert.equal(cancelReason, abortReason);
  assert.equal(released, true);
});

test("writeOnce waits for abort before releasing the writer lock", async () => {
  const write = deferred<void>();
  const abort = deferred<void>();
  let released = false;
  const writer = {
    write: () => write.promise,
    abort: () => abort.promise,
    releaseLock: () => {
      released = true;
    },
  };
  const controller = new AbortController();
  const pending = writeOnce(fakeWritable(writer), "chunk", controller.signal);

  controller.abort(new Error("write canceled"));
  write.resolve();
  await setImmediate();
  assert.equal(await isSettled(pending), false);
  assert.equal(released, false);

  abort.resolve();
  await pending;
  assert.equal(released, true);
});

test("writeOnce preserves the write error when abort cleanup also fails", async () => {
  const write = deferred<void>();
  const abort = deferred<void>();
  const writeError = new Error("write failed");
  const writer = {
    write: () => write.promise,
    abort: () => abort.promise,
    releaseLock() {},
  };
  const controller = new AbortController();
  const pending = writeOnce(fakeWritable(writer), "chunk", controller.signal);

  controller.abort(new Error("write canceled"));
  write.reject(writeError);
  await setImmediate();
  assert.equal(await isSettled(pending), false);

  abort.reject(new Error("abort failed"));
  await assert.rejects(pending, error => error === writeError);
});

test("readMessages waits for cancellation before releasing the reader lock", async () => {
  const read = deferred<ReadableStreamReadResult<string>>();
  const cancel = deferred<void>();
  let released = false;
  const reader = {
    read: () => read.promise,
    cancel: () => cancel.promise,
    releaseLock: () => {
      released = true;
    },
  };
  const controller = new AbortController();
  const pending = readMessages(fakeReadable(reader), controller.signal).next();

  controller.abort(new Error("messages canceled"));
  read.resolve({ done: true, value: undefined });
  await setImmediate();
  assert.equal(await isSettled(pending), false);
  assert.equal(released, false);

  cancel.resolve();
  assert.deepEqual(await pending, { done: true, value: undefined });
  assert.equal(released, true);
});

function fakeReadable<T>(reader: {
  read(): Promise<ReadableStreamReadResult<T>>;
  cancel(reason?: unknown): Promise<void>;
  releaseLock(): void;
}): ReadableStream<T> {
  return { getReader: () => reader } as unknown as ReadableStream<T>;
}

function fakeWritable<T>(writer: {
  write(chunk: T): Promise<void>;
  abort(reason?: unknown): Promise<void>;
  releaseLock(): void;
}): WritableStream<T> {
  return { getWriter: () => writer } as unknown as WritableStream<T>;
}

async function isSettled<T>(promise: Promise<T>): Promise<boolean> {
  let settled = false;
  void promise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await setImmediate();
  return settled;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}
