// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type TransformStream, WritableStream } from "node:stream/web";
import { takeoverDebugRouterLock } from "../takeover.ts";
import { encodePeertalkMessage, PeertalkToMessageTransformStream } from "./peertalk.ts";
import type { Connection, TransportConnectOptions } from "./transport.ts";

export async function connectWithPeertalk<TInput = unknown, TOutput = unknown>(
  connectRaw: (options: TransportConnectOptions) => Promise<Connection>,
  options: TransportConnectOptions,
  takeoverHDT = true,
): Promise<Connection<TOutput, TInput>> {
  if (takeoverHDT) {
    await takeoverDebugRouterLock();
  }
  const conn = await connectRaw(options);
  const rawWriter = conn.writable.getWriter();
  const disposeReason = new Error("Peertalk connection disposed");
  let terminationPromise: Promise<void> | undefined;
  let writerReleased = false;
  const releaseWriter = () => {
    if (!writerReleased) {
      writerReleased = true;
      rawWriter.releaseLock();
    }
  };
  const terminateConnection = (reason: unknown) => {
    if (!terminationPromise) {
      const rawAbort = writerReleased ? Promise.resolve() : rawWriter.abort(reason);
      const dispose = Promise.resolve().then(() => conn[Symbol.asyncDispose]());
      terminationPromise = rawAbort.then(
        () => dispose,
        async (error) => {
          await dispose.catch(() => {});
          throw error;
        },
      ).finally(releaseWriter);
      void terminationPromise.catch(() => {});
    }
    return terminationPromise;
  };
  const writable = new WritableStream<TInput>({
    write(message, controller) {
      const signal = (controller as WritableStreamDefaultController & { readonly signal: AbortSignal }).signal;
      const abort = () => void terminateConnection(signal.reason).catch(() => {});
      signal.addEventListener("abort", abort, { once: true });
      const write = Promise.resolve().then(() => rawWriter.write(encodePeertalkMessage(message))).catch((error) => {
        void terminateConnection(error).catch(() => {});
        throw error;
      });
      return write.finally(() => {
        signal.removeEventListener("abort", abort);
      });
    },
    close: releaseWriter,
    abort: terminateConnection,
  });
  const readable = conn.readable.pipeThrough(
    new PeertalkToMessageTransformStream() as TransformStream<Uint8Array, TOutput>,
  );
  return {
    readable,
    writable,
    [Symbol.asyncDispose]() {
      return terminateConnection(disposeReason);
    },
  };
}
