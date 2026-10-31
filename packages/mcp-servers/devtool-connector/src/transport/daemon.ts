// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { randomInt } from "node:crypto";
import { TransformStream, WritableStream } from "node:stream/web";
import type { ReadableStream } from "node:stream/web";
import { setTimeout as sleep } from "node:timers/promises";
import { createDebug } from "obug";
import { DAEMON_CONVERGENCE_TIMEOUT_MS, DaemonManager, DEFAULT_DAEMON_PORT } from "../daemon/manager.ts";
import type { ClientListEntry, ControlResponse } from "../daemon/protocol.ts";
import { readMessages, writeOnce } from "./stream-lifecycle.ts";
import type {
  App,
  Client,
  Connection,
  Device,
  OpenAppOptions,
  Transport,
  TransportConnectOptions,
} from "./transport.ts";

const debug = createDebug("devtool-mcp-server:daemon:transport");

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
  #endpoint: number | string;

  constructor(endpoint: number | string = DEFAULT_DAEMON_PORT) {
    if (typeof endpoint === "string") {
      const url = new URL(endpoint);
      if (url.protocol !== "ws:" && url.protocol !== "wss:") {
        throw new TypeError(`Daemon WebSocket URL must use ws: or wss:, got ${url.protocol}`);
      }
      this.#endpoint = url.href;
      return;
    }

    this.#endpoint = endpoint;
  }

  async close(): Promise<void> {
    // DaemonTransport is stateless — nothing to close.
    // The daemon itself manages its own lifecycle.
  }

  async listDevices(): Promise<Device[]> {
    const result = await this.#controlRequest<Device[]>("listDevices");
    return result;
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    const result = await this.#controlRequest<App[]>("listAvailableApps", { deviceId });
    return result;
  }

  async openApp(deviceId: string, packageName: string, options?: OpenAppOptions): Promise<void> {
    await this.#controlRequest(
      "openApp",
      {
        deviceId,
        packageName,
        withDataCleared: options?.withDataCleared,
        restart: options?.restart,
        schema: options?.schema,
      },
      options?.signal,
    );
  }

  async listClients(): Promise<Client[]> {
    const entries = await this.#controlRequest<ClientListEntry[]>("listClients");
    debug("received ClientList with %d entries", entries.length);
    return entries.map(({ id, info }) => ({ id, info }));
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    const { deviceId, signal } = options;
    const { port } = options;
    debug("connect to %s:%o via daemon", deviceId, port);

    const conn = await this.#createWebSocketConnection(signal);

    try {
      // Subscribe this WS session to the target device:port on the daemon
      const subscribeSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
        : undefined;
      await this.#controlRequestOnConn(conn, "subscribe", { deviceId, port }, subscribeSignal);
    } catch (error) {
      await conn[Symbol.asyncDispose]();
      throw new Error(
        `Failed to subscribe to ${deviceId}:${port}`,
        { cause: error },
      );
    }

    const writable = new WritableStream<TInput>({
      async write(chunk) {
        const message = routeDaemonMessage(chunk, conn.assignedId, port);
        await writeOnce(conn.writable, stringifyMessage(message), signal);
      },
      async abort() {
        await conn[Symbol.asyncDispose]();
      },
    });

    // Set up output pipeline: WS → JSON parse → TOutput
    const outputReadable = conn.readable
      .pipeThrough(new JSONStringToObjectStream()) as ReadableStream<TOutput>;

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
    signal?: AbortSignal,
  ): Promise<T> {
    const conn = await this.#createWebSocketConnection(signal);
    try {
      return await this.#controlRequestOnConn<T>(conn, method, params, signal);
    } finally {
      await conn[Symbol.asyncDispose]();
    }
  }

  /**
   * Send a Control request on an already-open WS connection and wait for
   * the matching ControlResponse.
   */
  async #controlRequestOnConn<T>(
    conn: { readable: ReadableStream<string>; writable: WritableStream<string> },
    method: string,
    params?: Record<string, unknown>,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    const id = randomInt(10_000, 50_000);

    const signal = callerSignal ?? AbortSignal.timeout(10_000);

    try {
      await this.#writeMessage(
        conn.writable,
        JSON.stringify({
          event: "Control",
          data: { id, method, params },
        }),
        signal,
      );

      for await (const value of this.#readMessages(conn.readable, signal)) {
        const msg = value as { event: string; data: unknown };

        if (msg.event === "ControlResponse") {
          const resp = msg.data as ControlResponse["data"];
          if (resp.id === id) {
            if (resp.error) {
              throw new Error(resp.error);
            }
            return resp.result as T;
          }
        }
      }

      signal.throwIfAborted();
      throw new Error(`No response for control request: ${method}`);
    } catch (error) {
      // A stream can reject while it is being cancelled. Preserve the
      // request signal's reason so callers can distinguish their own abort
      // from the control request's internal deadline.
      signal.throwIfAborted();
      throw error;
    }
  }

  async #createWebSocketConnection(signal?: AbortSignal): Promise<{
    assignedId: number;
    readable: ReadableStream<string>;
    writable: WritableStream<string>;
    [Symbol.asyncDispose](): Promise<void>;
  }> {
    const deadline = Date.now() + DAEMON_CONVERGENCE_TIMEOUT_MS;
    let retry = 0;

    while (true) {
      try {
        return await this.#createWebSocketConnectionOnce(signal);
      } catch (error) {
        signal?.throwIfAborted();
        if (!isRetryableDaemonHandshakeError(error) || Date.now() >= deadline) throw error;

        const delayMs = Math.min(50 * 2 ** retry, 250);
        retry += 1;
        debug("daemon WebSocket handshake raced with a lifecycle transition; retrying in %dms: %O", delayMs, error);
        if (signal) await sleep(delayMs, undefined, { signal });
        else await sleep(delayMs);
      }
    }
  }

  protected ensureDaemonRunning(port: number): Promise<string> {
    return DaemonManager.ensureRunning(port);
  }

  async #createWebSocketConnectionOnce(signal?: AbortSignal): Promise<{
    assignedId: number;
    readable: ReadableStream<string>;
    writable: WritableStream<string>;
    [Symbol.asyncDispose](): Promise<void>;
  }> {
    const url = typeof this.#endpoint === "string"
      ? this.#endpoint
      : await this.ensureDaemonRunning(this.#endpoint);

    signal?.throwIfAborted();

    const { wsStreams } = await import("./ws-stream.ts");
    const wss = wsStreams.create(url);

    const abortHandler = () => {
      wss.close();
    };
    signal?.addEventListener("abort", abortHandler, { once: true });

    wss.closed.catch(() => {
      debug("WebSocket to daemon closed");
    });

    try {
      const { readable, writable } = await this.#withAbortSignal(wss.opened, signal);

      // Read Initialize message
      const reader = readable.getReader();
      const { value, done } = await (async () => {
        try {
          return await reader.read();
        } finally {
          reader.releaseLock();
        }
      })();

      if (done) {
        throw new Error("WebSocket closed before initialization.");
      }

      const initMsg = JSON.parse(value as string) as { event: "Initialize"; data: number };
      if (initMsg.event !== "Initialize") {
        throw new Error(`Expected Initialize, got ${initMsg.event}`);
      }

      const assignedId = initMsg.data;

      // Send Register
      await this.#writeMessage(
        writable,
        JSON.stringify({
          event: "Register",
          data: { id: assignedId, type: "Driver" },
        }),
        signal,
      );

      return {
        assignedId,
        readable,
        writable,
        async [Symbol.asyncDispose]() {
          signal?.removeEventListener("abort", abortHandler);
          wss.close();
          await wss.closed.catch(() => {});
        },
      };
    } catch (err) {
      signal?.removeEventListener("abort", abortHandler);
      try {
        wss.close();
      } catch { /* ignore */ }
      try {
        await wss.closed;
      } catch { /* ignore */ }
      throw err;
    }
  }

  async *#readMessages(readable: ReadableStream<string>, signal: AbortSignal): AsyncGenerator<unknown> {
    for await (const value of readMessages(readable, signal)) {
      try {
        yield JSON.parse(value as string);
      } catch {
        // skip unparseable messages
      }
    }
  }

  async #writeMessage(writable: WritableStream, chunk: string, signal?: AbortSignal) {
    await writeOnce(writable, chunk, signal);
  }

  async #withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return promise;
    signal.throwIfAborted();

    return new Promise<T>((resolve, reject) => {
      const abortHandler = () => {
        reject(signal.reason);
      };
      signal.addEventListener("abort", abortHandler, { once: true });
      promise.then(
        (value) => {
          signal.removeEventListener("abort", abortHandler);
          resolve(value);
        },
        (error: unknown) => {
          signal.removeEventListener("abort", abortHandler);
          reject(error);
        },
      );
    });
  }
}

function isRetryableDaemonHandshakeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as Error & { code?: unknown }).code;
  if (
    code === "ECONNREFUSED"
    || code === "ECONNRESET"
    || code === "EPIPE"
    || code === "ETIMEDOUT"
    || code === 1006
  ) {
    return true;
  }

  return error.message === "WebSocket closed before initialization."
    || error.message === "WebSocket closed before opening."
    || error.message === "socket hang up"
    || error.message.startsWith("Unexpected server response: 503");
}

function routeDaemonMessage<T>(chunk: T, sender: number, port: TransportConnectOptions["port"]): unknown {
  if (isRecord(chunk) && chunk["event"] === "Customized") {
    const data = isRecord(chunk["data"]) ? chunk["data"] : {};
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
    throw new Error(`Failed to stringify object: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class JSONStringToObjectStream extends TransformStream<string, unknown> {
  constructor() {
    super({
      transform(chunk, controller) {
        try {
          controller.enqueue(JSON.parse(chunk));
        } catch (err) {
          controller.error(new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`));
        }
      },
    });
  }
}
