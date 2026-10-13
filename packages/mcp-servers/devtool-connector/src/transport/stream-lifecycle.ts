// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ReadableStream, ReadableStreamReadResult, WritableStream } from "node:stream/web";

interface StreamLock {
  releaseLock(): void;
}

function startCleanup(cleanup: () => Promise<void>): Promise<void> {
  try {
    return cleanup();
  } catch (error) {
    return Promise.reject(error);
  }
}

async function releaseAfterCleanup(
  lock: StreamLock,
  cleanupPromise: Promise<void> | undefined,
  hasPrimaryError: boolean,
): Promise<void> {
  let cleanupFailure: { error: unknown } | undefined;
  try {
    await cleanupPromise;
  } catch (error) {
    cleanupFailure = { error };
  }

  let releaseFailure: { error: unknown } | undefined;
  try {
    lock.releaseLock();
  } catch (error) {
    releaseFailure = { error };
  }

  if (!hasPrimaryError) {
    if (cleanupFailure) throw cleanupFailure.error;
    if (releaseFailure) throw releaseFailure.error;
  }
}

export async function readOnce<T>(
  readable: ReadableStream<T>,
  signal?: AbortSignal,
): Promise<ReadableStreamReadResult<T>> {
  signal?.throwIfAborted();
  const reader = readable.getReader();
  let cancelPromise: Promise<void> | undefined;
  const abortHandler = () => {
    cancelPromise ??= startCleanup(() => reader.cancel(signal?.reason));
  };

  signal?.addEventListener("abort", abortHandler, { once: true });
  if (signal?.aborted) abortHandler();

  let hasPrimaryError = false;
  try {
    return await reader.read();
  } catch (error) {
    hasPrimaryError = true;
    throw error;
  } finally {
    signal?.removeEventListener("abort", abortHandler);
    await releaseAfterCleanup(reader, cancelPromise, hasPrimaryError);
  }
}

export async function writeOnce<T>(
  writable: WritableStream<T>,
  chunk: T,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  const writer = writable.getWriter();
  let abortPromise: Promise<void> | undefined;
  const abortHandler = () => {
    abortPromise ??= startCleanup(() => writer.abort(signal?.reason));
  };

  signal?.addEventListener("abort", abortHandler, { once: true });
  if (signal?.aborted) abortHandler();

  let hasPrimaryError = false;
  try {
    await writer.write(chunk);
  } catch (error) {
    hasPrimaryError = true;
    throw error;
  } finally {
    signal?.removeEventListener("abort", abortHandler);
    await releaseAfterCleanup(writer, abortPromise, hasPrimaryError);
  }
}

export async function* readMessages<T>(
  readable: ReadableStream<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  signal.throwIfAborted();
  const reader = readable.getReader();
  let cancelPromise: Promise<void> | undefined;
  const abortHandler = () => {
    cancelPromise ??= startCleanup(() => reader.cancel(signal.reason));
  };

  signal.addEventListener("abort", abortHandler, { once: true });
  if (signal.aborted) abortHandler();

  let hasPrimaryError = false;
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      yield value;
    }
  } catch (error) {
    hasPrimaryError = true;
    throw error;
  } finally {
    signal.removeEventListener("abort", abortHandler);
    await releaseAfterCleanup(reader, cancelPromise, hasPrimaryError);
  }
}
