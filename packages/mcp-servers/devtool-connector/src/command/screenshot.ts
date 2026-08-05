// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';
import type { Connector } from '../index.ts';

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

/** Node 18-compatible equivalent of Promise.withResolvers for this published package. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
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
    signal.addEventListener('abort', listener, { once: true });
    listeners.push({ signal, listener });
  }

  return {
    signal: controller.signal,
    dispose() {
      for (const entry of listeners)
        entry.signal.removeEventListener('abort', entry.listener);
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
  constructor(timeoutMs: number) {
    super(
      `Failed to capture screenshot, no Page.screencastFrame event received within ${timeoutMs / 1_000} seconds.`,
    );
    this.name = 'ScreenshotTimeoutError';
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
  const timeout = setTimeout(() => {
    timeoutController.abort(new ScreenshotTimeoutError(timeoutMs));
  }, timeoutMs);
  timeout.unref();

  const frame = deferred<void>();
  const ack = deferred<void>();
  const aborted = new Promise<never>((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), {
      once: true,
    });
  });

  try {
    await using stream = await connector.sendCDPStream(
      clientId,
      sessionId,
      new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue({
              method: 'Page.startScreencast',
              params: {
                format: 'jpeg',
                quality: options.quality ?? 80,
                mode: options.fullscreen === true ? 'fullscreen' : 'lynxview',
              },
            });
            await Promise.race([frame.promise, aborted]);
            controller.enqueue({ method: 'Page.screencastFrameAck' });
          } finally {
            controller.close();
            ack.resolve();
          }
        },
      }),
      { signal },
    );

    for await (const { method, params } of stream) {
      if (method !== 'Page.screencastFrame') continue;
      const { data, metadata } = params as {
        data?: unknown;
        metadata?: unknown;
      };
      if (typeof data !== 'string' || data.length === 0) continue;
      frame.resolve();
      await ack.promise;
      return metadata !== null && typeof metadata === 'object'
        ? { data, metadata: metadata as ScreencastFrameMetadata }
        : { data };
    }

    const error = new ScreenshotTimeoutError(timeoutMs);
    timeoutController.abort(error);
    throw error;
  } catch (error) {
    if (timeoutController.signal.aborted && options.signal?.aborted !== true) {
      const reason = timeoutController.signal.reason;
      if (reason instanceof ScreenshotTimeoutError) throw reason;
    }
    throw error;
  } finally {
    combinedSignal?.dispose();
    clearTimeout(timeout);
  }
}

/** Capture one JPEG screencast frame and return only its base64 image data. */
export async function captureScreenshot(
  connector: Connector,
  clientId: string,
  sessionId: number,
  options: CaptureScreenshotOptions = {},
): Promise<string> {
  return (await captureScreenshotFrame(connector, clientId, sessionId, options))
    .data;
}
