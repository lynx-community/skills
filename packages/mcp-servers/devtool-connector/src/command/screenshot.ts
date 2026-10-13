// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { ReadableStream } from "node:stream/web";
import type { Connector } from "../index.ts";

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

/** Node 18-compatible equivalent of Promise.withResolvers for this published package. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

interface CombinedAbortSignal {
  signal: AbortSignal;
  dispose(): void;
}

/** Node 18-compatible equivalent of AbortSignal.any for this published package. */
function combineSignals(signals: readonly AbortSignal[]): CombinedAbortSignal {
  const controller = new AbortController();
  const listeners: Array<{ signal: AbortSignal; listener: () => void }> = [];

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    const listener = () => controller.abort(signal.reason);
    signal.addEventListener("abort", listener, { once: true });
    listeners.push({ signal, listener });
  }

  return {
    signal: controller.signal,
    dispose() {
      for (const entry of listeners) entry.signal.removeEventListener("abort", entry.listener);
    },
  };
}

export interface CaptureScreenshotOptions {
  fullscreen?: boolean;
  quality?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Coordinate metadata attached to `Page.screencastFrame` by the Lynx runtime. */
export interface ScreencastFrameMetadata {
  offsetTop?: number;
  pageScaleFactor?: number;
  deviceWidth?: number;
  deviceHeight?: number;
  scrollOffsetX?: number;
  scrollOffsetY?: number;
  timestamp?: number;
}

export interface CapturedScreenshot {
  data: string;
  metadata?: ScreencastFrameMetadata;
}

export class ScreenshotTimeoutError extends Error {
  constructor(timeoutMs: number, phase: "frame" | "acknowledgement" = "frame") {
    super(
      phase === "frame"
        ? `Failed to capture screenshot, no Page.screencastFrame event received within ${timeoutMs / 1_000} seconds.`
        : `Failed to capture screenshot, the Page.screencastFrame acknowledgement was not flushed within ${
          timeoutMs / 1_000
        } seconds.`,
    );
    this.name = "ScreenshotTimeoutError";
  }
}

/** Capture one JPEG screencast frame, including its logical coordinate metadata. */
export async function captureScreenshotFrame(
  connector: Connector,
  clientId: string,
  sessionId: number,
  options: CaptureScreenshotOptions = {},
): Promise<CapturedScreenshot> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const timeoutController = new AbortController();
  const combinedSignal = options.signal
    ? combineSignals([options.signal, timeoutController.signal])
    : undefined;
  const signal = combinedSignal?.signal ?? timeoutController.signal;
  let timeoutPhase: "frame" | "acknowledgement" = "frame";
  const timeout = setTimeout(() => {
    timeoutController.abort(new ScreenshotTimeoutError(timeoutMs, timeoutPhase));
  }, timeoutMs);
  timeout.unref();

  let frame = deferred<boolean>();
  let ack = deferred<void>();
  let result: CapturedScreenshot | undefined;
  let screencastStarted = false;
  let primaryFailed = false;
  let primaryError: unknown;
  let cleanupFailed = false;
  let cleanupError: unknown;
  const aborted = new Promise<never>((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });

  try {
    await using stream = await connector.sendCDPStream(
      clientId,
      sessionId,
      new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue({
              method: "Page.startScreencast",
              params: {
                format: "jpeg",
                quality: options.quality ?? 80,
                mode: options.fullscreen === true ? "fullscreen" : "lynxview",
              },
            });
            screencastStarted = true;
            while (true) {
              const usable = await Promise.race([frame.promise, aborted]);
              controller.enqueue({ method: "Page.screencastFrameAck" });
              ack.resolve();
              if (usable) break;
              frame = deferred<boolean>();
              ack = deferred<void>();
            }
          } finally {
            controller.close();
            ack.resolve();
          }
        },
      }),
      { signal },
    );

    try {
      for await (const { method, params } of stream) {
        if (method !== "Page.screencastFrame") continue;
        const { data, metadata } = params as { data?: unknown; metadata?: unknown };
        const usable = typeof data === "string" && data.length > 0;
        if (usable) timeoutPhase = "acknowledgement";
        frame.resolve(usable);
        await ack.promise;
        if (!usable) continue;
        // Enqueuing the acknowledgement does not mean it has reached the transport.
        // Finish the write before leaving this loop cancels and closes the stream.
        await stream.inputClosed;
        result = metadata !== null && typeof metadata === "object"
          ? { data, metadata: metadata as ScreencastFrameMetadata }
          : { data };
        break;
      }

      if (result === undefined) {
        if (signal.aborted) throw signal.reason;
        const error = new Error(
          "Screenshot stream ended before a usable Page.screencastFrame event was received.",
        );
        timeoutController.abort(error);
        throw error;
      }
    } catch (error) {
      if (!timeoutController.signal.aborted) timeoutController.abort(error);
      throw error;
    }
  } catch (error) {
    primaryFailed = true;
    if (timeoutController.signal.aborted && options.signal?.aborted !== true) {
      const reason = timeoutController.signal.reason;
      primaryError = reason instanceof ScreenshotTimeoutError ? reason : error;
    } else {
      primaryError = error;
    }
  }

  try {
    if (screencastStarted) {
      await connector.sendCDPMessage(clientId, sessionId, "Page.stopScreencast");
    }
  } catch (error) {
    cleanupFailed = true;
    cleanupError = error;
  } finally {
    combinedSignal?.dispose();
    clearTimeout(timeout);
  }

  if (primaryFailed) throw primaryError;
  if (cleanupFailed) throw cleanupError;
  if (result === undefined) throw new Error("Screenshot capture ended without a result.");
  return result;
}

/** Capture one JPEG screencast frame and return only its base64 image data. */
export async function captureScreenshot(
  connector: Connector,
  clientId: string,
  sessionId: number,
  options: CaptureScreenshotOptions = {},
): Promise<string> {
  return (await captureScreenshotFrame(connector, clientId, sessionId, options)).data;
}
