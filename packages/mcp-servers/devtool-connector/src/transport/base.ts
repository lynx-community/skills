// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type TransformStream, WritableStream, type WritableStreamDefaultWriter } from "node:stream/web";
import { takeoverDebugRouterLock } from "../takeover.ts";
import { encodePeertalkMessage, PeertalkToMessageTransformStream } from "./peertalk.ts";
import type { Connection, TransportConnectOptions } from "./transport.ts";

const PEERTALK_PING_DELAY_MS = 100;
const PEERTALK_PING_FRAME = encodePeertalkMessage({ event: "Ping" });

export async function connectWithPeertalk<TInput = unknown, TOutput = unknown>(
  connectRaw: (options: TransportConnectOptions) => Promise<Connection>,
  options: TransportConnectOptions,
  takeoverHDT = true,
): Promise<Connection<TOutput, TInput>> {
  if (takeoverHDT) {
    await takeoverDebugRouterLock();
  }
  const conn = await connectRaw(options);
  let rawWriter: WritableStreamDefaultWriter<Uint8Array> | undefined = conn.writable.getWriter();
  let writing = false;
  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let terminationPromise: Promise<void> | undefined;
  const clearPingTimer = () => {
    if (pingTimer !== undefined) {
      clearTimeout(pingTimer);
      pingTimer = undefined;
    }
  };
  const releaseWriter = () => {
    clearPingTimer();
    rawWriter?.releaseLock();
    rawWriter = undefined;
  };
  const terminateConnection = (reason: unknown, abortIdleWriter = true) => {
    clearPingTimer();
    if (!terminationPromise) {
      const writer = rawWriter;
      const shouldAbort = writer !== undefined && (abortIdleWriter || writing);
      if (!shouldAbort) releaseWriter();
      const rawAbort = shouldAbort ? writer.abort(reason) : Promise.resolve();
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
  const schedulePing = () => {
    clearPingTimer();
    if (!rawWriter || terminationPromise) return;
    pingTimer = setTimeout(() => {
      pingTimer = undefined;
      if (!rawWriter || writing || terminationPromise) return;
      writing = true;
      void rawWriter.write(PEERTALK_PING_FRAME).catch(() => {}).finally(() => {
        writing = false;
      });
    }, PEERTALK_PING_DELAY_MS);
    pingTimer.unref?.();
  };
  const writable = new WritableStream<TInput>({
    async write(message, controller) {
      const signal = (controller as WritableStreamDefaultController & { readonly signal: AbortSignal }).signal;
      const abort = () => void terminateConnection(signal.reason).catch(() => {});
      signal.addEventListener("abort", abort, { once: true });
      clearPingTimer();
      writing = true;
      try {
        await rawWriter!.write(encodePeertalkMessage(message));
        schedulePing();
      } catch (error) {
        void terminateConnection(error).catch(() => {});
        throw error;
      } finally {
        writing = false;
        signal.removeEventListener("abort", abort);
      }
    },
    close: releaseWriter,
    abort(reason) {
      return terminateConnection(reason, true);
    },
  });
  const readable = conn.readable.pipeThrough(
    new PeertalkToMessageTransformStream() as TransformStream<Uint8Array, TOutput>,
  );
  return {
    readable,
    writable,
    [Symbol.asyncDispose]() {
      return terminateConnection(new Error("Peertalk connection disposed"), false);
    },
  };
}
