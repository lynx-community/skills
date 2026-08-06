// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream, WritableStream } from 'node:stream/web';
import { type RawData, WebSocket } from 'ws';

function stringifyWebSocketData(data: RawData | string): string {
  return typeof data === 'string' ? data : data.toString();
}

/**
 * WebSocket close codes that represent an orderly shutdown, so the readable
 * side should simply reach EOF instead of erroring:
 *
 * - `1000` Normal Closure
 * - `1001` Going Away
 * - `1005` No Status Received (the peer closed without a status code)
 *
 * Every other code (notably `1006` Abnormal Closure and `1011` Internal Error)
 * means the connection died unexpectedly, and callers such as the daemon
 * handshake must be able to tell that apart from a clean end of stream.
 */
const NORMAL_CLOSE_CODES = new Set([1000, 1001, 1005]);

function createWebSocketCloseError(
  code: number,
  reason: Buffer,
): (Error & { code: number; reason: string }) | null {
  if (NORMAL_CLOSE_CODES.has(code)) return null;
  const text = reason.toString('utf8');
  return Object.assign(
    new Error(
      `WebSocket closed abnormally (${code})${text ? `: ${text}` : ''}`,
    ),
    { code, reason: text },
  );
}

function createOwnedWebSocketReadable(ws: WebSocket): {
  readable: ReadableStream<string>;
  prepareForClose(): void;
} {
  let cleanup = () => {};
  let prepareForClose = () => {};
  let resume = () => {};

  const readable = new ReadableStream<string>({
    start(controller) {
      let active = true;
      let acceptingMessages = true;
      let paused = false;

      resume = () => {
        if (!active || !paused) {
          return;
        }
        paused = false;
        ws.resume();
      };

      const stop = () => {
        if (!active) {
          return;
        }
        active = false;
        acceptingMessages = false;
        if (paused) {
          paused = false;
          ws.resume();
        }
        ws.off('message', onMessage);
        ws.off('close', onClose);
        ws.off('error', onError);
      };
      const stopAcceptingMessages = () => {
        if (!active || !acceptingMessages) {
          return;
        }
        acceptingMessages = false;
        ws.off('message', onMessage);
        resume();
      };
      const onMessage = (data: RawData | string) => {
        if (!active || !acceptingMessages) {
          return;
        }
        controller.enqueue(stringifyWebSocketData(data));
        if (controller.desiredSize !== null && controller.desiredSize <= 0) {
          paused = true;
          ws.pause();
        }
      };
      const onClose = (code: number, reason: Buffer) => {
        const error = createWebSocketCloseError(code, reason);
        stop();
        try {
          if (error) controller.error(error);
          else controller.close();
        } catch {
          // already closed / errored
        }
      };
      const onError = (err: Error) => {
        stop();
        try {
          controller.error(err);
        } catch {
          // already errored / closed
        }
      };

      cleanup = stop;
      prepareForClose = stopAcceptingMessages;
      ws.on('message', onMessage);
      ws.on('close', onClose);
      ws.on('error', onError);
    },
    pull() {
      resume();
    },
    cancel() {
      cleanup();
      ws.close();
    },
  });

  return {
    readable,
    prepareForClose() {
      prepareForClose();
    },
  };
}

/**
 * Wraps a `ws` WebSocket into a `ReadableStream<string>` of text frames.
 *
 * The stream applies backpressure by pausing the socket once the queue is
 * full, reaches EOF on an orderly close, and errors with a
 * `code`/`reason`-carrying `Error` on an abnormal close.
 */
export function createWebSocketReadable(ws: WebSocket): ReadableStream<string> {
  return createOwnedWebSocketReadable(ws).readable;
}

/**
 * A lightweight wrapper around the `ws` WebSocket that exposes a
 * `WebSocketStream`-compatible interface (opened / closed / close).
 *
 * This allows `DaemonTransport` to work on Node 18+
 * without depending on `undici`'s `WebSocketStream` (which requires
 * Node 22+).
 */
export class WsWebSocketStream {
  #ws: WebSocket;
  #prepareReadableForClose = () => {};

  opened: Promise<{ readable: ReadableStream; writable: WritableStream }>;
  closed: Promise<void>;

  #resolveClosed!: () => void;
  #rejectClosed!: (err: unknown) => void;

  constructor(url: string) {
    this.#ws = new WebSocket(url);

    this.closed = new Promise<void>((resolve, reject) => {
      this.#resolveClosed = resolve;
      this.#rejectClosed = reject;
    });

    this.opened = new Promise((resolve, reject) => {
      const ws = this.#ws;

      const onError = (err: Error) => {
        cleanup();
        reject(err);
        this.#rejectClosed(err);
      };

      const onClose = (code: number, reason: Buffer) => {
        cleanup();
        const error = createWebSocketCloseError(code, reason);
        reject(error ?? new Error('WebSocket closed before opening.'));
        if (error) this.#rejectClosed(error);
        else this.#resolveClosed();
      };

      const cleanup = () => {
        ws.removeListener('error', onError);
        ws.removeListener('close', onClose);
      };

      ws.once('open', () => {
        cleanup();

        // --- readable ---
        const { readable, prepareForClose } = createOwnedWebSocketReadable(ws);
        this.#prepareReadableForClose = prepareForClose;

        // --- writable ---
        const writable = new WritableStream<string>({
          write(chunk) {
            return new Promise<void>((res, rej) => {
              ws.send(chunk, (err) => {
                if (err) rej(err);
                else res();
              });
            });
          },
          close: () => {
            this.close();
          },
          abort: () => {
            this.close();
          },
        });

        resolve({ readable, writable });

        // Wire up closed promise
        ws.on('close', (code, reason) => {
          const error = createWebSocketCloseError(code, reason);
          if (error) this.#rejectClosed(error);
          else this.#resolveClosed();
        });

        ws.on('error', (err) => {
          this.#rejectClosed(err);
        });
      });

      ws.once('error', onError);
      ws.once('close', onClose);
    });
  }

  close(): void {
    this.#prepareReadableForClose();
    this.#ws.close();
  }
}

/**
 * Factory namespace for creating WebSocketStream instances.
 *
 * Transport classes use `wsStreams.create(url)` instead of `new WsWebSocketStream(url)`
 * to allow tests to swap the implementation without relying on ESM module mocking.
 */
export const wsStreams = {
  create(url: string): WsWebSocketStream {
    return new WsWebSocketStream(url);
  },
};
