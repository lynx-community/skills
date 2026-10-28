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
  #url: string;

  static DEFAULT_PORT = 19783;

  static createTransports(port: number = HDTTransport.DEFAULT_PORT, backoff = 10): Transport[] {
    return Array.from(
      { length: backoff },
      (_, i) => new HDTTransport(`ws://127.0.0.1:${port + i}/mdevices/page/android`),
    ).concat([
      new HDTTransport(`ws://127.0.0.1:3005/ws`), // For Aiden App & Cloud
    ]);
  }

  constructor(urlOrPort: string | number) {
    const url = typeof urlOrPort === "number"
      ? `ws://127.0.0.1:${urlOrPort}/mdevices/page/android`
      : urlOrPort;

    this.#url = url;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  async listClients(): Promise<Client[]> {
    const signal = AbortSignal.timeout(3_000);
    await using conn = await this.#createWebSocketStream(signal);

    if (this.#url !== "ws://127.0.0.1:3005/ws") {
      try {
        await requestFreshClientList(conn.readable, conn.writable, signal);
      } catch (error) {
        if (signal.aborted) {
          throw new Error("Timed out waiting for ClientList from HDT transport.", { cause: error });
        }
        throw error;
      }
    }

    while (!signal.aborted) {
      const { value, done } = await readOnce(conn.readable, signal);

      if (done) {
        if (signal.aborted) {
          throw new Error("Timed out waiting for ClientList from HDT transport.");
        }
        throw new Error("WebSocket closed while waiting for ClientList.");
      }

      const msg = JSON.parse(value as string) as { event: string; data: unknown };

      if (msg.event === "ClientList") {
        const clients = msg.data as Client[];

        debug("Received client list from HDT transport: %o", clients);

        return clients
          .filter(({ info }) => this.#url !== "ws://127.0.0.1:3005/ws" || info.osType !== "unknown")
          .map(({ info, id }) => ({
            id: ClientId.serialize(urlToDeviceId(this.#url), info.debugRouterId || Number(id)),
            info,
          }));
      }
    }

    throw new Error("Timed out waiting for ClientList from HDT transport.");
  }

  listDevices(): Promise<Device[]> {
    return Promise.resolve([
      { id: urlToDeviceId(this.#url), os: "HDT" },
    ]);
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
    const conn = await this.#createWebSocketStream(signal);
    let targetPort: number;
    try {
      if (typeof port === "string" && this.#url !== "ws://127.0.0.1:3005/ws") {
        await requestFreshClientList(conn.readable, conn.writable, signal);
      }
      targetPort = typeof port === "string"
        ? await resolveClientTarget(conn.readable, port, signal)
        : port;
    } catch (error) {
      await conn[Symbol.asyncDispose]().catch(disposeError => {
        debug("Failed to dispose HDT connection after target resolution failed: %O", disposeError);
      });
      throw error;
    }

    const writable = new WritableStream<TInput>({
      async write(chunk) {
        const message = routeDriverMessage(
          chunk,
          conn.id,
          targetPort,
          typeof port === "string" ? port : undefined,
        );
        debug("Transformed chunk for HDT transport: %o", message);
        await writeOnce(conn.writable, stringifyMessage(message), signal);
      },
      async abort() {
        await conn[Symbol.asyncDispose]();
      },
    });

    return {
      readable: [
        new JSONStringToObjectStream(typeof port === "string" ? port : undefined, targetPort),
      ].reduce(
        (stream, transform) => stream.pipeThrough(transform),
        conn.readable,
      ),
      writable,
      async [Symbol.asyncDispose]() {
        await conn[Symbol.asyncDispose]();
      },
    };
  }

  /**
   * @returns ID assigned by HDT for this connection, which is used as part of the sender for routing messages.
   */
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
        const id = data;

        await writeOnce(
          writable,
          JSON.stringify({
            event: "Register",
            data: { id, type: "Driver" },
          }),
          signal,
        );

        if (this.#url === "ws://127.0.0.1:3005/ws") {
          // Wait for Registered acknowledgment before sending JoinRoom.
          // The server may drop JoinRoom if Register hasn't completed yet.
          await readUntilEvent(readable, "Registered", signal);

          await writeOnce(
            writable,
            `{"event":"JoinRoom","data":"33ad9856-6085-42e7-80ea-b0c4b5c99b40"}`,
            signal,
          );

          // Wait for RoomJoined acknowledgment before sending ListClients.
          await readUntilEvent(readable, "RoomJoined", signal);

          await writeOnce(
            writable,
            `{"event":"ListClients"}`,
            signal,
          );
        } else {
          // Local debug-router creates the Driver client after Register, then
          // sends RoomJoined. Sending the first request before that point can
          // fall into the registration gap and be dropped.
          await readUntilEvent(readable, "RoomJoined", signal);
        }
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

async function requestFreshClientList(
  readable: ReadableStream,
  writable: WritableStream,
  signal?: AbortSignal,
): Promise<void> {
  await readUntilEvent(readable, "ClientList", signal);
  await writeOnce(writable, `{"event":"ListClients"}`, signal);
}

class JSONStringToObjectStream extends TransformStream<string, unknown> {
  constructor(debugRouterId?: string, targetPort?: number) {
    super({
      transform(chunk, controller) {
        try {
          const obj = JSON.parse(chunk);
          if (debugRouterId !== undefined && isRecord(obj)) {
            if (obj["event"] === "ClientList" && Array.isArray(obj["data"])) {
              const client = obj["data"].find(client =>
                isRecord(client) && isRecord(client["info"]) && client["info"]["debugRouterId"] === debugRouterId
              );
              const nextPort = isRecord(client) ? Number(client["id"]) : NaN;
              targetPort = Number.isSafeInteger(nextPort) ? nextPort : undefined;
            }
            const data = obj["data"];
            // HDT broadcasts replies from every App. Normalize only this client's sender.
            if (
              obj["event"] === "Customized" && targetPort !== undefined && isRecord(data)
              && String(data["sender"]) === String(targetPort)
            ) {
              obj["data"] = { ...data, sender: debugRouterId };
            }
          }
          if (isRecord(obj) && obj["event"] === "Customized" && isRecord(obj["data"])) {
            const sender = obj["data"]["sender"];
            // shortcut: legacy unassigned senders cannot be isolated until the peer supplies an App route.
            if (
              sender !== undefined && String(sender) !== "-1" && String(sender) !== "4294967295"
              && String(sender) !== String(debugRouterId ?? targetPort)
            ) return;
          }
          if (debugRouterId !== undefined && isRecord(obj) && obj["event"] === "RouteRejected") {
            const data = isRecord(obj["data"]) ? obj["data"] : {};
            const rejectedId = typeof data["debugRouterId"] === "string"
              ? data["debugRouterId"]
              : debugRouterId;
            const target = String(data["target"] ?? "unknown");
            const reason = String(data["reason"] ?? "unknown");
            controller.error(
              new Error(`HDT route ${rejectedId} (numeric fallback ${target}) was rejected: ${reason}`, {
                cause: obj,
              }),
            );
            return;
          }
          controller.enqueue(obj);
        } catch (err) {
          controller.error(new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`));
        }
      },
    });
  }
}

function routeDriverMessage<T>(chunk: T, sender: number, port: number, debugRouterId?: string): unknown {
  if (isRecord(chunk) && chunk["event"] === "Customized") {
    const data = isRecord(chunk["data"]) ? chunk["data"] : {};
    return {
      ...chunk,
      ...(debugRouterId === undefined ? {} : { debugRouterId }),
      data: {
        ...data,
        ...(debugRouterId === undefined
          ? {}
          : {
            data: {
              ...(isRecord(data["data"]) ? data["data"] : {}),
              client_id: port,
            },
          }),
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

/** Resolve a stable debug-router ID to the current numeric HDT target. */
async function resolveClientTarget(
  readable: ReadableStream,
  debugRouterId: string,
  signal?: AbortSignal,
): Promise<number> {
  const { data } = await readUntilEvent(readable, "ClientList", signal);
  if (!Array.isArray(data)) {
    throw new Error("HDT ClientList response did not contain an array of clients");
  }

  for (const client of data) {
    if (!isRecord(client) || !isRecord(client["info"]) || client["info"]["debugRouterId"] !== debugRouterId) {
      continue;
    }

    const port = Number(client["id"]);
    if (Number.isSafeInteger(port)) {
      return port;
    }

    throw new Error(`HDT client ${debugRouterId} has an invalid numeric target: ${String(client["id"])}`);
  }

  throw new Error(`HDT client with debugRouterId ${debugRouterId} was not found in ClientList`);
}

/**
 * Read messages from the stream until one with the specified event type is found.
 * Earlier messages are discarded. This is used during the handshake to wait for
 * server acknowledgments (Registered, RoomJoined) before proceeding.
 */
async function readUntilEvent(
  readable: ReadableStream,
  eventName: string,
  signal?: AbortSignal,
): Promise<{ event: string; data: unknown }> {
  while (true) {
    const { value, done } = await readOnce(readable, signal);
    if (done) {
      throw new Error(`WebSocket closed while waiting for ${eventName}.`);
    }
    const msg = JSON.parse(value as string) as { event: string; data: unknown };
    debug("readUntilEvent(%s): received %s", eventName, msg.event);
    if (msg.event === eventName) {
      return msg;
    }
  }
}

async function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }

  signal.throwIfAborted();

  return await new Promise<T>((resolve, reject) => {
    const abortHandler = () => {
      reject(signal.reason);
    };

    signal.addEventListener("abort", abortHandler, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", abortHandler);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abortHandler);
        reject(error);
      },
    );
  });
}
