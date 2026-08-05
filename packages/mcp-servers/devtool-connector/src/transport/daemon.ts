// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomInt } from 'node:crypto';
import type { ReadableStream } from 'node:stream/web';
import { TransformStream, WritableStream } from 'node:stream/web';
import { createDebug } from 'obug';
import { DaemonManager, DEFAULT_DAEMON_PORT } from '../daemon/manager.ts';
import type { ClientTarget } from '../client-id.ts';
import type { ClientListEntry, ControlResponse } from '../daemon/protocol.ts';
import type {
  App,
  Client,
  Connection,
  Device,
  OpenAppOptions,
  Transport,
  TransportConnectOptions,
} from './transport.ts';

const debug = createDebug('devtool-mcp-server:daemon:transport');

/**
 * A Transport implementation that communicates with devices through the
 * daemon process over WebSocket.
 *
 * The daemon holds the real transports (Android, iOS, etc.) and maintains
 * persistent connections to device ports. DaemonTransport simply relays
 * messages through the daemon's WebSocket API using the same
 * Initialize/Register/Customized protocol as HDT.
 */
export class DaemonTransport implements Transport {
  #port: number;

  constructor(port: number = DEFAULT_DAEMON_PORT) {
    this.#port = port;
  }

  async close(): Promise<void> {
    // DaemonTransport is stateless — nothing to close.
    // The daemon itself manages its own lifecycle.
  }

  async listDevices(): Promise<Device[]> {
    const result = await this.#controlRequest<Device[]>('listDevices');
    return result;
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    const result = await this.#controlRequest<App[]>('listAvailableApps', {
      deviceId,
    });
    return result;
  }

  async openApp(
    deviceId: string,
    packageName: string,
    options?: OpenAppOptions,
  ): Promise<void> {
    await this.#controlRequest('openApp', {
      deviceId,
      packageName,
      withDataCleared: options?.withDataCleared,
    });
  }

  async listClients(): Promise<Client[]> {
    const entries =
      await this.#controlRequest<ClientListEntry[]>('listClients');
    debug('received ClientList with %d entries', entries.length);
    return entries.map(({ id, info }) => ({ id, info }));
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    const { deviceId, port, signal } = options;
    debug('connect to %s:%d via daemon', deviceId, port);

    await DaemonManager.ensureRunning(this.#port);
    const conn = await this.#createWebSocketConnection(signal);

    try {
      // Subscribe this WS session to the target device:port on the daemon
      await this.#controlRequestOnConn(conn, 'subscribe', { deviceId, port });
    } catch (error) {
      await conn[Symbol.asyncDispose]();
      throw new Error(`Failed to subscribe to ${deviceId}:${port}`, {
        cause: error,
      });
    }

    const writable = new WritableStream<TInput>({
      async write(chunk) {
        const message = routeDaemonMessage(chunk, conn.assignedId, port);
        await writeMessage(conn.writable, stringifyMessage(message), signal);
      },
      async abort() {
        await conn[Symbol.asyncDispose]();
      },
    });

    // Set up output pipeline: WS → JSON parse → TOutput
    const outputReadable = conn.readable.pipeThrough(
      new JSONStringToObjectStream(),
    ) as ReadableStream<TOutput>;

    return {
      readable: outputReadable,
      writable,
      async [Symbol.asyncDispose]() {
        await conn[Symbol.asyncDispose]();
      },
    };
  }

  // ---- Private helpers ----

  async #controlRequest<T>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    await DaemonManager.ensureRunning(this.#port);
    const conn = await this.#createWebSocketConnection();
    try {
      return await this.#controlRequestOnConn<T>(conn, method, params);
    } finally {
      await conn[Symbol.asyncDispose]();
    }
  }

  /**
   * Send a Control request on an already-open WS connection and wait for
   * the matching ControlResponse.
   */
  async #controlRequestOnConn<T>(
    conn: {
      readable: ReadableStream<string>;
      writable: WritableStream<string>;
    },
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const id = randomInt(10_000, 50_000);

    const signal = AbortSignal.timeout(10_000);

    await this.#writeMessage(
      conn.writable,
      JSON.stringify({
        event: 'Control',
        data: { id, method, params },
      }),
      signal,
    );

    for await (const value of this.#readMessages(conn.readable, signal)) {
      const msg = value as { event: string; data: unknown };

      if (msg.event === 'ControlResponse') {
        const resp = msg.data as ControlResponse['data'];
        if (resp.id === id) {
          if (resp.error) {
            throw new Error(resp.error);
          }
          return resp.result as T;
        }
      }
    }

    throw new Error(`No response for control request: ${method}`);
  }

  async #createWebSocketConnection(signal?: AbortSignal): Promise<{
    assignedId: number;
    readable: ReadableStream<string>;
    writable: WritableStream<string>;
    [Symbol.asyncDispose](): Promise<void>;
  }> {
    const url = await DaemonManager.ensureRunning(this.#port);

    signal?.throwIfAborted();

    const { wsStreams } = await import('./ws-stream.ts');
    const wss = wsStreams.create(url);

    const abortHandler = () => {
      wss.close();
    };
    signal?.addEventListener('abort', abortHandler, { once: true });

    wss.closed.catch(() => {
      debug('WebSocket to daemon closed');
    });

    try {
      const { readable, writable } = await this.#withAbortSignal(
        wss.opened,
        signal,
      );

      // Read Initialize message
      const reader = readable.getReader();
      const { value, done } = await reader.read();
      reader.releaseLock();

      if (done) {
        throw new Error('WebSocket closed before initialization.');
      }

      const initMsg = JSON.parse(value as string) as {
        event: 'Initialize';
        data: number;
      };
      if (initMsg.event !== 'Initialize') {
        throw new Error(`Expected Initialize, got ${initMsg.event}`);
      }

      const assignedId = initMsg.data;

      // Send Register
      await this.#writeMessage(
        writable,
        JSON.stringify({
          event: 'Register',
          data: { id: assignedId, type: 'Driver' },
        }),
        signal,
      );

      return {
        assignedId,
        readable,
        writable,
        async [Symbol.asyncDispose]() {
          signal?.removeEventListener('abort', abortHandler);
          wss.close();
          await wss.closed.catch(() => {});
        },
      };
    } catch (err) {
      signal?.removeEventListener('abort', abortHandler);
      try {
        wss.close();
      } catch {
        /* ignore */
      }
      try {
        await wss.closed;
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  async *#readMessages(
    readable: ReadableStream<string>,
    signal: AbortSignal,
  ): AsyncGenerator<unknown> {
    const reader = readable.getReader();
    const abortHandler = () => {
      void reader.cancel(signal.reason);
    };
    signal.addEventListener('abort', abortHandler, { once: true });

    try {
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        try {
          yield JSON.parse(value as string);
        } catch {
          // skip unparseable messages
        }
      }
    } finally {
      signal.removeEventListener('abort', abortHandler);
      reader.releaseLock();
    }
  }

  async #writeMessage(
    writable: WritableStream,
    chunk: string,
    signal?: AbortSignal,
  ) {
    await writeMessage(writable, chunk, signal);
  }

  async #withAbortSignal<T>(
    promise: Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!signal) return promise;
    signal.throwIfAborted();

    return new Promise<T>((resolve, reject) => {
      const abortHandler = () => {
        reject(signal.reason);
      };
      signal.addEventListener('abort', abortHandler, { once: true });
      promise.then(
        (value) => {
          signal.removeEventListener('abort', abortHandler);
          resolve(value);
        },
        (error: unknown) => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        },
      );
    });
  }
}

function routeDaemonMessage<T>(
  chunk: T,
  sender: number,
  port: ClientTarget,
): unknown {
  if (isRecord(chunk) && chunk['event'] === 'Customized') {
    const data = isRecord(chunk['data']) ? chunk['data'] : {};
    return {
      ...chunk,
      data: {
        ...data,
        sender,
      },
      to: port,
    };
  }

  return chunk;
}

function stringifyMessage(message: unknown): string {
  try {
    return JSON.stringify(message);
  } catch (err) {
    throw new Error(
      `Failed to stringify object: ${err instanceof Error ? err.message : String(err)}`,
      {
        cause: err,
      },
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function writeMessage(
  writable: WritableStream,
  chunk: string,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const writer = writable.getWriter();
  const abortHandler = () => {
    void writer.abort(signal?.reason);
  };

  signal?.addEventListener('abort', abortHandler, { once: true });

  try {
    await writer.write(chunk);
  } finally {
    signal?.removeEventListener('abort', abortHandler);
    writer.releaseLock();
  }
}

class JSONStringToObjectStream extends TransformStream<string, unknown> {
  constructor() {
    super({
      transform(chunk, controller) {
        try {
          controller.enqueue(JSON.parse(chunk));
        } catch (err) {
          controller.error(
            new Error(
              `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
        }
      },
    });
  }
}
