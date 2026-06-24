// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream, WritableStream } from 'node:stream/web';
import { WebSocket } from 'ws';

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

      const onClose = () => {
        cleanup();
        reject(new Error('WebSocket closed before opening.'));
        this.#resolveClosed();
      };

      const cleanup = () => {
        ws.removeListener('error', onError);
        ws.removeListener('close', onClose);
      };

      ws.once('open', () => {
        cleanup();

        // --- readable ---
        const readable = new ReadableStream<string>({
          start(controller) {
            ws.on('message', (data) => {
              controller.enqueue(
                typeof data === 'string' ? data : data.toString(),
              );
            });

            ws.on('close', () => {
              try {
                controller.close();
              } catch {
                // already closed
              }
            });

            ws.on('error', (err) => {
              try {
                controller.error(err);
              } catch {
                // already errored / closed
              }
            });
          },
          cancel() {
            ws.close();
          },
        });

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
          close() {
            ws.close();
          },
          abort() {
            ws.close();
          },
        });

        resolve({ readable, writable });

        // Wire up closed promise
        ws.on('close', () => {
          this.#resolveClosed();
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
