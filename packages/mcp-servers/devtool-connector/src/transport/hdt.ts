// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ReadableStream } from "node:stream/web";
import { TransformStream, WritableStream } from "node:stream/web";
import { createDebug } from "obug";
import { ClientId } from "../client-id.ts";
import { readOnce, writeOnce } from "./stream-lifecycle.ts";
import type { App, Client, Connection, Device, Transport, TransportConnectOptions } from "./transport.ts";

const debug = createDebug("devtool-mcp-server:connector:hdt");
const ROUTE_CONNECT_RECOVERY_TIMEOUT_MS = 2_000;
const ROUTE_WRITE_RECOVERY_TIMEOUT_MS = 1_000;

function urlToDeviceId(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (
      (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1")
      && parsedUrl.pathname === "/mdevices/page/android"
      && parsedUrl.port
    ) {
      return `HDT-${parsedUrl.port}`;
    }
  } catch {
    // Fall back to a stable encoded identifier when the input is not a valid URL.
  }
  return `HDT-${url}`;
}

export class HDTTransport implements Transport {
  readonly id: string;
  #url: string;

  static DEFAULT_PORT = 19783;

  static createTransports(port: number = HDTTransport.DEFAULT_PORT, backoff = 10): Transport[] {
    return Array.from(
      { length: backoff },
      (_, i) => new HDTTransport(`ws://127.0.0.1:${port + i}/mdevices/page/android`),
    );
  }

  constructor(urlOrPort: string | number) {
    this.#url = typeof urlOrPort === "number"
      ? `ws://127.0.0.1:${urlOrPort}/mdevices/page/android`
      : urlOrPort;
    this.id = urlToDeviceId(this.#url);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  async listClients(): Promise<Client[]> {
    const signal = AbortSignal.timeout(3_000);
    await using conn = await this.#createWebSocketStream(signal);

    let clients: Client[];
    try {
      clients = await this.#readFreshClientList(conn.readable, conn.writable, signal);
    } catch (error) {
      if (signal.aborted) {
        throw new Error("Timed out waiting for ClientList from HDT transport.", { cause: error });
      }
      throw error;
    }

    debug("Received client list from HDT transport: %o", clients);
    return clients
      .filter(client => this.filterClient(client))
      .map(({ info, id }) => ({
        id: ClientId.serialize(this.id, this.id, info.debugRouterId || Number(id)),
        info,
      }));
  }

  listDevices(): Promise<Device[]> {
    return Promise.resolve([{ id: this.id, os: "HDT" }]);
  }

  listAvailableApps(): Promise<App[]> {
    throw new Error("listAvailableApps method not implemented in HDTTransport.");
  }

  openApp(): Promise<void> {
    throw new Error("openApp method not implemented in HDTTransport.");
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    const { port, signal } = options;
    const debugRouterId = typeof port === "string" ? port : undefined;
    const conn = await this.#createWebSocketStream(signal);
    let targetPort: number;
    try {
      targetPort = typeof port === "string"
        ? await this.#resolveTargetPort(conn.readable, conn.writable, port, signal)
        : port;
    } catch (error) {
      await conn[Symbol.asyncDispose]().catch(disposeError => {
        debug("Failed to dispose HDT connection after target resolution failed: %O", disposeError);
      });
      throw error;
    }

    let activePort: number | undefined = targetPort;
    let routeRecoveryDeadline = 0;
    let streamClosed = false;
    let resolveRouteWaiters: (() => void) | undefined;
    let routeWaitPromise: Promise<void> | undefined;

    const wakeRouteWaiters = () => {
      resolveRouteWaiters?.();
      resolveRouteWaiters = undefined;
      routeWaitPromise = undefined;
    };

    const waitForActiveRoute = async (): Promise<void> => {
      const remainingMs = routeRecoveryDeadline - Date.now();
      if (activePort !== undefined || remainingMs <= 0 || streamClosed) return;
      signal?.throwIfAborted();
      routeWaitPromise ??= new Promise<void>(resolve => {
        resolveRouteWaiters = resolve;
      });
      const waitPromise = routeWaitPromise;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(cleanupAndResolve, remainingMs);
        const onAbort = () => {
          clearTimeout(timer);
          reject(signal?.reason);
        };
        function cleanupAndResolve() {
          clearTimeout(timer);
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }
        signal?.addEventListener("abort", onAbort, { once: true });
        void waitPromise.then(cleanupAndResolve);
      });
    };

    const writable = new WritableStream<TInput>({
      write: async chunk => {
        if (
          debugRouterId !== undefined
          && activePort === undefined
          && isRecord(chunk)
          && chunk["event"] === "Customized"
        ) {
          await waitForActiveRoute();
        }
        const message = routeDriverMessage(chunk, conn.id, activePort ?? targetPort, debugRouterId);
        debug("Transformed chunk for HDT transport: %o", message);
        await this.writeMessage(conn.writable, stringifyMessage(message), signal);
      },
      async abort() {
        streamClosed = true;
        wakeRouteWaiters();
        await conn[Symbol.asyncDispose]();
      },
    });

    return {
      readable: conn.readable.pipeThrough(
        new TransformStream<string, TOutput>(
          {
            transform(chunk, controller) {
              try {
                const obj = JSON.parse(chunk);
                if (!isRecord(obj)) {
                  controller.enqueue(obj as TOutput);
                  return;
                }
                if (debugRouterId !== undefined && obj["event"] === "ClientList") {
                  const entry = findClientEntry(obj["data"], debugRouterId);
                  const nextPort = parseClientPort(entry);
                  if (nextPort !== undefined) {
                    activePort = nextPort;
                    targetPort = nextPort;
                    routeRecoveryDeadline = 0;
                    wakeRouteWaiters();
                  } else {
                    if (activePort !== undefined && entry === undefined) {
                      routeRecoveryDeadline = Date.now() + ROUTE_WRITE_RECOVERY_TIMEOUT_MS;
                    } else if (entry !== undefined) {
                      routeRecoveryDeadline = 0;
                      wakeRouteWaiters();
                    }
                    activePort = undefined;
                  }
                }
                if (obj["event"] === "Customized" && isRecord(obj["data"])) {
                  const data = obj["data"];
                  const sender = data["sender"];
                  if (activePort !== undefined && String(sender) === String(activePort)) {
                    if (debugRouterId !== undefined) obj["data"] = { ...data, sender: debugRouterId };
                  } else if (sender !== undefined && String(sender) !== "-1" && String(sender) !== "4294967295") {
                    return;
                  }
                }
                if (debugRouterId !== undefined && obj["event"] === "RouteRejected") {
                  streamClosed = true;
                  wakeRouteWaiters();
                  const data = isRecord(obj["data"]) ? obj["data"] : {};
                  const rejectedId = typeof data["debugRouterId"] === "string" ? data["debugRouterId"] : debugRouterId;
                  controller.error(
                    new Error(
                      `HDT route ${rejectedId} (numeric fallback ${
                        String(data["target"] ?? "unknown")
                      }) was rejected: ${String(data["reason"] ?? "unknown")}`,
                      { cause: obj },
                    ),
                  );
                  return;
                }
                controller.enqueue(obj as TOutput);
              } catch (err) {
                streamClosed = true;
                wakeRouteWaiters();
                controller.error(
                  new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`),
                );
              }
            },
            flush() {
              streamClosed = true;
              wakeRouteWaiters();
            },
          },
          undefined,
          { highWaterMark: 16 },
        ),
      ),
      writable,
      async [Symbol.asyncDispose]() {
        streamClosed = true;
        wakeRouteWaiters();
        await conn[Symbol.asyncDispose]();
      },
    };
  }

  protected filterClient(client: Client): boolean {
    void client;
    return true;
  }

  /**
   * Read messages from the stream until one with the specified event type is found.
   * Earlier messages are discarded. This is used during the handshake to wait for
   * server acknowledgments (Registered, RoomJoined) before proceeding.
   */
  protected async readUntilEvent(
    readable: ReadableStream<string>,
    eventName: string,
    signal?: AbortSignal,
  ): Promise<{ event: string; data: unknown }> {
    while (true) {
      const { value, done } = await readOnce(readable, signal);
      if (done) {
        throw new Error(`WebSocket closed while waiting for ${eventName}.`);
      }
      const msg = JSON.parse(value) as { event: string; data: unknown };
      debug("readUntilEvent(%s): received %s", eventName, msg.event);
      if (msg.event === eventName) return msg;
    }
  }

  protected writeMessage(
    writable: WritableStream<string>,
    chunk: string,
    signal?: AbortSignal,
  ): Promise<void> {
    return writeOnce(writable, chunk, signal);
  }

  protected async completeRegistration(
    readable: ReadableStream<string>,
    writable: WritableStream<string>,
    signal?: AbortSignal,
  ): Promise<void> {
    void writable;
    // Local debug-router creates the Driver client after Register, then
    // sends RoomJoined. Sending the first request before that point can
    // fall into the registration gap and be dropped.
    await this.readUntilEvent(readable, "RoomJoined", signal);
  }

  protected async requestClientList(
    readable: ReadableStream<string>,
    writable: WritableStream<string>,
    signal?: AbortSignal,
  ): Promise<void> {
    // Discard the cached ClientList pushed immediately after RoomJoined.
    await this.readUntilEvent(readable, "ClientList", signal);
    await this.writeMessage(writable, `{"event":"ListClients"}`, signal);
  }

  async #readFreshClientList(
    readable: ReadableStream<string>,
    writable: WritableStream<string>,
    signal?: AbortSignal,
  ): Promise<Client[]> {
    await this.requestClientList(readable, writable, signal);
    const { data } = await this.readUntilEvent(readable, "ClientList", signal);
    if (!Array.isArray(data)) {
      throw new Error("HDT ClientList response did not contain an array of clients");
    }
    return data as Client[];
  }

  async #resolveTargetPort(
    readable: ReadableStream<string>,
    writable: WritableStream<string>,
    debugRouterId: string,
    signal?: AbortSignal,
  ): Promise<number> {
    const initialClients = await this.#readFreshClientList(readable, writable, signal);
    const initialEntry = findClientEntry(initialClients, debugRouterId);
    if (initialEntry !== undefined) {
      return parseClientTarget(initialEntry, debugRouterId);
    }

    const recoveryTimeout = AbortSignal.timeout(ROUTE_CONNECT_RECOVERY_TIMEOUT_MS);
    const waitSignal = signal ? AbortSignal.any([signal, recoveryTimeout]) : recoveryTimeout;
    try {
      while (true) {
        const { data } = await this.readUntilEvent(readable, "ClientList", waitSignal);
        const entry = findClientEntry(data, debugRouterId);
        if (entry !== undefined) {
          return parseClientTarget(entry, debugRouterId);
        }
      }
    } catch (error) {
      if (recoveryTimeout.aborted || isTimeoutAbort(signal)) {
        throw new Error(`HDT client with debugRouterId ${debugRouterId} was not found in ClientList`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  async #createWebSocketStream(signal?: AbortSignal) {
    signal?.throwIfAborted();

    const { wsStreams } = await import("./ws-stream.ts");
    const wss = wsStreams.create(this.#url);
    const abortHandler = () => {
      wss.close();
    };
    signal?.addEventListener("abort", abortHandler, { once: true });

    wss.closed.catch(() => {
      debug(`WebSocket connection to HDT on ${this.#url} closed.`);
    });

    try {
      const { readable, writable } = await withAbortSignal(wss.opened, signal);
      const { value, done } = await readOnce(readable, signal);
      if (done) {
        throw new Error("WebSocket closed before initialization.");
      }

      const { event, data } = JSON.parse(value) as { event: "Initialize"; data: number };
      if (event === "Initialize") {
        await this.writeMessage(
          writable,
          JSON.stringify({ event: "Register", data: { id: data, type: "Driver" } }),
          signal,
        );
        await this.completeRegistration(readable, writable, signal);
      }

      return {
        id: data,
        readable,
        writable,
        [Symbol.asyncDispose]: async () => {
          signal?.removeEventListener("abort", abortHandler);
          wss.close();
          await wss.closed.catch(() => {});
          debug(`WebSocket connection to HDT on ${this.#url} closed.`);
        },
      };
    } catch (err) {
      signal?.removeEventListener("abort", abortHandler);
      try {
        wss.close();
      } catch {
        // ignore close errors on abort/failure
      }
      try {
        await wss.closed;
      } catch {
        // ignore close errors on abort/failure
      }
      throw err;
    }
  }
}

function routeDriverMessage<T>(chunk: T, sender: number, port: number, debugRouterId?: string): unknown {
  if (!isRecord(chunk) || chunk["event"] !== "Customized") return chunk;
  const data = isRecord(chunk["data"]) ? chunk["data"] : {};
  return {
    ...chunk,
    ...(debugRouterId === undefined ? {} : { debugRouterId }),
    data: {
      ...data,
      ...(debugRouterId === undefined
        ? {}
        : { data: { ...(isRecord(data["data"]) ? data["data"] : {}), client_id: port } }),
      sender,
    },
    to: port,
  };
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

function findClientEntry(clients: unknown, debugRouterId: string): Record<string, unknown> | undefined {
  if (!Array.isArray(clients)) return undefined;
  return clients.find(
    (client): client is Record<string, unknown> =>
      isRecord(client) && isRecord(client["info"]) && client["info"]["debugRouterId"] === debugRouterId,
  );
}

function parseClientPort(client: Record<string, unknown> | undefined): number | undefined {
  const port = client ? Number(client["id"]) : NaN;
  return Number.isSafeInteger(port) ? port : undefined;
}

function parseClientTarget(client: Record<string, unknown>, debugRouterId: string): number {
  const port = parseClientPort(client);
  if (port !== undefined) return port;
  throw new Error(`HDT client ${debugRouterId} has an invalid numeric target: ${String(client["id"])}`);
}

function isTimeoutAbort(signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted && isRecord(signal.reason) && signal.reason["name"] === "TimeoutError");
}

async function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return await new Promise<T>((resolve, reject) => {
    const abortHandler = () => reject(signal.reason);
    signal.addEventListener("abort", abortHandler, { once: true });
    promise.then(
      value => {
        signal.removeEventListener("abort", abortHandler);
        resolve(value);
      },
      error => {
        signal.removeEventListener("abort", abortHandler);
        reject(error);
      },
    );
  });
}
