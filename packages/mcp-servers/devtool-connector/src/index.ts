// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable n/no-unpublished-import */
import { randomInt } from "node:crypto";
import { ReadableStream, TransformStream } from "node:stream/web";
import { createDebug } from "obug";
import { CDPOutputTransformStream, CDPRequestTransformStream, CDPResponseTransformStream } from "./streams/cdp.ts";
import {
  AppResponseTransformStream,
  CustomizedClientIdTransformStream,
  CustomizedRequestTransformStream,
  CustomizedResponseTransformStream,
  GlobalSwitchRequestTransformStream,
} from "./streams/customized.ts";
import { FilterTransformStream, InspectStream, SessionGuardTransformStream } from "./streams/utils.ts";

export { CDPOutputTransformStream, CDPRequestTransformStream, CDPResponseTransformStream } from "./streams/cdp.ts";

import { ClientId } from "./client-id.ts";
import { DaemonTransport } from "./transport/daemon.ts";
import type { App, Client, Device, OpenAppOptions, Transport, TransportConnectOptions } from "./transport/transport.ts";
import {
  type AppInfo,
  type CDPRequestMessage,
  type GetGlobalSwitchResponse,
  type GlobalKeys,
  type HeadlessPrepareRequest,
  type HeadlessPrepareResponse,
  type HeadlessPrepareState,
  type InitializeRequest,
  type InitializeResponse,
  isGetGlobalSwitchResponse,
  isHeadlessPrepareResponse,
  isInitializeResponse,
  isListSessionResponse,
  isSetGlobalSwitchResponse,
  type ListSessionRequest,
  type ListSessionResponse,
  type Session,
} from "./types.ts";

const debug = createDebug("devtool-mcp-server:connector");

interface OutputStream<O> extends AsyncDisposable, ReadableStream<O> {
  inputClosed: Promise<void>;
}

export { ClientId };

type Pipeline = {
  input: TransformStream[];
  output: TransformStream[];
};

type ClientListTransport = Transport & {
  listClients(): Promise<Client[]>;
};

function hasClientList(transport: Transport): transport is ClientListTransport {
  return typeof transport.listClients === "function";
}

export class Connector {
  #transports: Transport[];
  #daemonTransports: DaemonTransport[];

  constructor(transports: Transport[]) {
    this.#transports = transports;
    this.#daemonTransports = transports.filter((t): t is DaemonTransport => t instanceof DaemonTransport);
  }

  async listClients(): Promise<Client[]> {
    // 0. Try to get clients from daemon transport, which supports multiplexing.
    const daemonClientResults = await Promise.allSettled(
      this.#daemonTransports.map(async (transport) => {
        const clients = await transport.listClients();
        await Promise.allSettled(
          clients.flatMap(({ id }) => this.#setupClient(transport, id)),
        );
        return clients;
      }),
    );
    const fulfilledDaemonClientResults = daemonClientResults
      .filter((r) => r.status === "fulfilled");
    const daemonClients = fulfilledDaemonClientResults.flatMap((r) => r.value);

    if (fulfilledDaemonClientResults.length > 0) {
      debug("Using clients from daemon transport: %o", daemonClients);
      return daemonClients;
    }

    // 1. Try direct connection for other transports.
    const transportDevices = await Promise.allSettled(
      this.#transports
        .filter(t => !(t instanceof DaemonTransport))
        .map(async (transport) => ({
          transport,
          devices: await transport.listDevices(),
        })),
    );

    for (const result of transportDevices) {
      if (result.status === "rejected") {
        debug("listClients: listDevices failed on one transport: %O", result.reason);
      }
    }

    const results = await Promise.allSettled(
      transportDevices
        .filter(r => r.status === "fulfilled")
        .map(r => r.value)
        .flatMap(({ transport, devices }) => devices.flatMap(({ id }) => this.#listClientsForDevice(transport, id))),
    );

    return results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }

  async listDevices(): Promise<Device[]> {
    const results = await Promise.allSettled(
      this.#transports.map(t => t.listDevices()),
    );

    return results
      .filter(result => result.status === "fulfilled")
      .flatMap(({ value }) => value);
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    const transport = await this.#findTransportWithDeviceId(deviceId);

    return await transport.listAvailableApps(deviceId);
  }

  async openApp(deviceId: string, packageName: string, options?: OpenAppOptions): Promise<void> {
    const transport = await this.#findTransportWithDeviceId(deviceId);

    await transport.openApp(deviceId, packageName, options);

    const signal = AbortSignal.any([
      options?.signal,
      AbortSignal.timeout(60_000),
    ].filter(i => i !== undefined));

    const { setTimeout } = await import("node:timers/promises");
    while (!signal.aborted) {
      try {
        const clients = hasClientList(transport)
          ? (await transport.listClients())
            .filter(({ id }) => ClientId.deserialize(id)?.deviceId === deviceId)
          : await this.#listClientsForDevice(transport, deviceId);

        if (
          clients.some(({ info }) =>
            /** Android */ info.AppProcessName === packageName
              /** iOS */ || info.bundleId === packageName
              || info.bundleName === packageName
          )
        ) {
          break;
        }
      } catch (err) {
        // ignore error
        debug(`openApp ${deviceId} ${packageName} client not found %o`, err);
      }
      await setTimeout(1_000);
    }
  }

  async sendMessage<T, R>(
    clientId: string,
    message: T,
    pipeline: Pipeline = { input: [], output: [] },
  ): Promise<R> {
    return this.#sendMessage(clientId, message, pipeline);
  }

  /**
   * Send a message to the device without waiting for a response.
   *
   * Unlike {@link sendMessage}, this method does not wait for the output
   * stream to produce a value. It connects, writes the message, and then
   * disposes of the connection. This is useful for fire-and-forget messages
   * such as `xdb_proxy_config` where the device does not send a reply.
   */
  async sendMessageNoReply<T>(
    clientId: string,
    message: T,
  ): Promise<void> {
    const { deviceId, port } = this.#resolveClientId(clientId);
    const transport = await this.#findTransportWithDeviceId(deviceId);
    const signal = AbortSignal.timeout(5_000);

    const conn = await transport.connect({ deviceId, port, signal });

    try {
      // Write the message through the input pipeline (CustomizedClientIdTransformStream etc.)
      const inputStream = [
        new CustomizedClientIdTransformStream(port),
        new InspectStream((msg: unknown) =>
          debug(`sendMessageNoReply ${deviceId}:${port} send %o`, JSON.stringify(msg))
        ),
      ].reduce(
        (stream, transform) => stream.pipeThrough(transform),
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        ReadableStream.from([message]),
      );

      // Wait for the message to be fully written before closing.
      await inputStream.pipeTo(conn.writable, { preventClose: true });
    } finally {
      await conn[Symbol.asyncDispose]();
    }
  }

  async sendAppMessage<Output, Params = never>(
    clientId: string,
    method: string,
    params?: Params,
  ): Promise<Output> {
    const id = randomInt(10_000, 50_000);

    return await this.#sendMessage<Record<string, unknown>, Output>(clientId, {
      method,
      params: /** App message requires params to be an object */ { ...params },
    }, {
      input: [
        new CustomizedRequestTransformStream({
          type: "App",
          sessionId: -1,
          messageBuilder: (message) => ({ id, ...message }),
        }),
      ],
      output: [
        new CustomizedResponseTransformStream("App", id),
        new AppResponseTransformStream(method),
      ],
    });
  }

  async sendCDPMessage<Output, Params = never>(
    clientId: string,
    sessionId: number,
    method: string,
    params?: Params,
    isMainThread = false,
  ): Promise<Output> {
    const id = randomInt(10_000, 50_000);

    const SUPPORTED_DOMAIN = ["Debugger", "Runtime", "HeapProfiler", "Profiler"];

    if (isMainThread && !SUPPORTED_DOMAIN.some(domain => method.startsWith(domain + "."))) {
      throw new Error(
        `Method ${method} is not supported for main thread. Supported domains: ${SUPPORTED_DOMAIN.join(", ")}`,
      );
    }

    return await this.#sendMessage<Record<string, unknown>, Output>(clientId, {
      method,
      params,
      sessionId: isMainThread ? "Main" : undefined,
    }, {
      input: [
        new CDPRequestTransformStream(sessionId, id),
      ],
      output: [
        new CDPResponseTransformStream(id),
        new CDPOutputTransformStream(),
      ],
    });
  }

  async sendListSessionMessage(
    clientId: string,
  ): Promise<Session[]> {
    return await this.#sendListSessionMessage(clientId);
  }

  /**
   * Probe the headless runtime's readiness. Returns immediately with the
   * current state and, when not ready, kicks off the binary download in the
   * background. Callers (e.g. the `open` command) poll this until `ready` so
   * the download is driven by a caller-controlled timeout rather than a single
   * request that could be cut off mid-download.
   */
  async prepareHeadless(clientId: string): Promise<HeadlessPrepareState> {
    const { data: { data: state } } = await this.#sendMessage<HeadlessPrepareRequest, HeadlessPrepareResponse>(
      clientId,
      {
        event: "Customized",
        data: {
          type: "HeadlessPrepare",
          data: {},
        },
      },
      {
        input: [],
        output: [
          new FilterTransformStream(isHeadlessPrepareResponse),
        ],
      },
    );

    return state;
  }

  /**
   * Block until the headless runtime is ready, polling {@link prepareHeadless}
   * so the (potentially long) first-use binary download is not cut off by a
   * single request timeout. A transient `error` is tolerated until the overall
   * deadline because the transport retries the download on the next poll.
   *
   * Intended to be called from the CLI/tool layer before opening a page on the
   * headless client; the core request path is intentionally left untouched.
   */
  async waitForHeadlessReady(
    clientId: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {},
  ): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 5 * 60_000;
    const pollIntervalMs = options.pollIntervalMs ?? 1_000;
    const { setTimeout: delay } = await import("node:timers/promises");
    const deadline = Date.now() + timeoutMs;
    let lastError: string | undefined;
    for (;;) {
      const state = await this.prepareHeadless(clientId);
      if (state.status === "ready") return;
      if (state.status === "error") {
        lastError = state.message ?? "unknown error";
      }
      if (Date.now() >= deadline) {
        throw new Error(
          lastError !== undefined
            ? `Failed to prepare headless runtime: ${lastError}`
            : `Timed out preparing headless runtime after ${timeoutMs}ms`,
        );
      }
      await delay(pollIntervalMs);
    }
  }

  async #sendListSessionMessage(
    clientId: string,
  ): Promise<Session[]> {
    const { data: { data: sessions } } = await this.#sendMessage<ListSessionRequest, ListSessionResponse>(
      clientId,
      {
        event: "Customized",
        data: {
          type: "ListSession",
          data: {},
        },
      },
      {
        input: [],
        output: [
          new FilterTransformStream(isListSessionResponse),
        ],
      },
    );

    return sessions.map(session => ({
      ...session,
      type: session.type === "" ? "lynx" : session.type,
    }));
  }

  async getGlobalSwitch(
    clientId: string,
    key: GlobalKeys,
  ): Promise<boolean> {
    const {
      data: { data: { message } },
    } = await this.#sendMessage<{ key: GlobalKeys }, GetGlobalSwitchResponse>(clientId, { key }, {
      input: [
        new GlobalSwitchRequestTransformStream("GetGlobalSwitch"),
      ],
      output: [
        new FilterTransformStream(isGetGlobalSwitchResponse),
      ],
    });

    if (typeof message === "object") {
      return message?.global_value === "true" || message?.global_value === true;
    } else {
      return message === "true" || message === true;
    }
  }

  async setGlobalSwitch(
    clientId: string,
    key: GlobalKeys,
    value: boolean,
  ): Promise<void> {
    await this.#sendMessage(clientId, { key, value }, {
      input: [
        new GlobalSwitchRequestTransformStream("SetGlobalSwitch"),
      ],
      output: [
        new FilterTransformStream(isSetGlobalSwitchResponse),
      ],
    });
  }

  async sendStream<I, O>(
    clientId: string,
    inputStream: ReadableStream<I>,
    { signal, pipeline }: { signal?: AbortSignal | undefined; pipeline?: Pipeline | undefined } = {},
  ): Promise<OutputStream<O>> {
    const { deviceId, port } = this.#resolveClientId(clientId);
    const transport = await this.#findTransportWithDeviceId(deviceId);

    return await this.#connect(
      transport,
      { deviceId, port, signal },
      inputStream,
      pipeline ?? { input: [], output: [] },
    );
  }

  async sendCDPStream(
    clientId: string,
    sessionId: number,
    inputStream: ReadableStream<CDPRequestMessage>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<OutputStream<CDPRequestMessage>> {
    return await this.sendStream(clientId, inputStream, {
      signal,
      pipeline: {
        input: [
          new CDPRequestTransformStream(sessionId),
        ],
        output: [
          new SessionGuardTransformStream(sessionId),
          new CDPResponseTransformStream<CDPRequestMessage>(),
        ],
      },
    });
  }

  #resolveClientId(clientId: string): TransportConnectOptions {
    const parsed = ClientId.deserialize(clientId);
    if (!parsed) {
      throw new Error(`Invalid clientId: ${clientId}`);
    }
    return parsed;
  }

  async #findTransportWithDeviceId(deviceId: string): Promise<Transport> {
    // Keep the same preference as listClients(): if a daemon transport can see
    // this device, stick to it for follow-up requests. Otherwise a faster direct
    // transport can win the race here and bypass the stable daemon path that was
    // used during discovery, which is exactly what made list-sessions flaky.
    const daemonTransport = await this.#findTransportWithDeviceIdInPool(this.#daemonTransports, deviceId);
    if (daemonTransport) {
      return daemonTransport;
    }

    const transport = await this.#findTransportWithDeviceIdInPool(
      this.#transports.filter(t => !(t instanceof DaemonTransport)),
      deviceId,
    );
    if (transport) {
      return transport;
    }

    throw new Error(`Device with id: ${deviceId} not found`);
  }

  async #findTransportWithDeviceIdInPool(transports: Transport[], deviceId: string): Promise<Transport | null> {
    return await Promise.any(
      transports.map(async (transport) => {
        const devices = await transport.listDevices();
        if (devices.some(({ id }) => id === deviceId)) return transport;
        throw new Error("Not found in this transport");
      }),
    ).catch(() => null);
  }

  async #connect<I, O>(
    transport: Transport,
    options: TransportConnectOptions,
    inputStream: ReadableStream<I>,
    pipeline: Pipeline,
  ): Promise<OutputStream<O>> {
    const { deviceId, port } = options;

    const conn = await transport.connect<I, O>(options);

    const inputAbortController = new AbortController();

    const inputClosed = [
      ...pipeline.input,
      new CustomizedClientIdTransformStream(port),
      new InspectStream((msg) => debug(`connect ${deviceId}:${port} input stream send %o`, JSON.stringify(msg))),
    ].reduce((stream, transform) => stream.pipeThrough(transform), inputStream)
      .pipeTo(conn.writable, { preventClose: true, signal: inputAbortController.signal })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          debug(`connect ${deviceId}:${port} input stream err %O`, err);
        }
      });

    const outputStream = [
      new InspectStream((msg) => debug(`connect ${deviceId}:${port} output stream receive %O`, msg)),
      ...pipeline.output,
    ].reduce(
      (stream, transform) => stream.pipeThrough(transform, { preventCancel: true }),
      conn.readable,
    );

    return Object.assign(outputStream, {
      inputClosed,
      async [Symbol.asyncDispose]() {
        debug(`connect ${deviceId}:${port} close connection`);
        inputAbortController.abort();
        await inputClosed.catch(() => {});
        return conn[Symbol.asyncDispose]();
      },
    });
  }

  async #sendMessage<I, O>(
    clientId: string,
    input: I,
    pipeline: Pipeline = { input: [], output: [] },
  ): Promise<O> {
    const { deviceId, port } = this.#resolveClientId(clientId);
    const transport = await this.#findTransportWithDeviceId(deviceId);

    const signal = AbortSignal.timeout(10_000);

    return this.#sendMessageWithTransport(
      transport,
      { deviceId, port, signal },
      input,
      pipeline,
    );
  }

  async #sendMessageWithTransport<I, O>(
    transport: Transport,
    options: TransportConnectOptions,
    input: I,
    pipeline: Pipeline,
  ): Promise<O> {
    await using outputStream = await this.#connect<I, O>(
      transport,
      options,
      // We have polyfill for this
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      ReadableStream.from([input]),
      pipeline,
    );
    for await (const response of outputStream) {
      await outputStream.inputClosed;
      return response;
    }

    await outputStream.inputClosed;

    const clientId = ClientId.serialize(options.deviceId, options.port);
    throw new Error(`No response found for clientId: ${clientId}`);
  }

  async #listClientsForDevice(
    transport: Transport,
    deviceId: string,
  ): Promise<{ id: string; info: AppInfo; port: number }[]> {
    const MIN_PORT = 8901;
    const PORTS = Array.from({ length: 10 }, (_, i) => MIN_PORT + i);
    const signal = AbortSignal.timeout(5_000);
    const results = await Promise.allSettled(PORTS.map(async (port: number) => {
      const { data: { info } } = await this.#sendMessageWithTransport<InitializeRequest, InitializeResponse>(
        transport,
        { deviceId, port, signal },
        { event: "Initialize", data: port },
        {
          input: [],
          output: [
            new FilterTransformStream(isInitializeResponse),
          ],
        },
      );

      const clientId = ClientId.serialize(deviceId, port);
      await this.#setupClient(transport, clientId);

      return { id: clientId, info, port };
    }));

    return results
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
  }

  async #setupClient(transport: Transport, clientId: string): Promise<void> {
    const { deviceId, port } = this.#resolveClientId(clientId);
    for (
      const input of [
        { key: "enable_devtool", value: true },
        // `enable_quickjs_debug` is required for `Runtime.*` and `HeapProfiler.*` to work,
        // so we enable it by default. It won't have effect if the devtool doesn't support quickjs debug.
        // And it will not turn off `enable_v8` if it's already on, so it won't break v8 debug.
        { key: "enable_quickjs_debug", value: true },
      ] as const
    ) {
      try {
        await this.#sendMessageWithTransport<{ key: GlobalKeys; value: boolean }, never>(
          transport,
          { deviceId, port, signal: AbortSignal.timeout(3_000) },
          input,
          {
            input: [
              new GlobalSwitchRequestTransformStream("SetGlobalSwitch"),
            ],
            output: [
              new FilterTransformStream(isSetGlobalSwitchResponse),
            ],
          },
        );
      } catch (err) {
        debug(`setupClient ${deviceId}:${port} ${input.key} failed %O`, err);
      }
    }
  }
}

export * from "./types.ts";
