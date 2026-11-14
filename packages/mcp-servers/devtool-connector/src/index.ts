// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { ReadableStream, type TransformStream } from "node:stream/web";
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

export { CDPOutputTransformStream, CDPRequestTransformStream, CDPResponseTransformStream };

import { throwClientDiscoveryFailures } from "./client-discovery-errors.ts";
import { ClientId } from "./client-id.ts";
import { isDaemonLifecycleError } from "./daemon/manager.ts";
import { nextRequestId } from "./request-id.ts";
import { DaemonTransport } from "./transport/daemon.ts";
import { HDTTransport } from "./transport/hdt.ts";
import {
  type App,
  type Client,
  type ClientList,
  type Connection,
  type Device,
  type OpenAppOptions,
  type Transport,
  type TransportConnectOptions,
  withTransports,
} from "./transport/transport.ts";
import {
  type AppInfo,
  type CDPRequestMessage,
  createCorrelatedFilter,
  type GetGlobalSwitchResponse,
  type GlobalKeys,
  type InitializeRequest,
  isGetGlobalSwitchResponse,
  isInitializeResponse,
  isListSessionResponse,
  isSetGlobalSwitchResponse,
  type ListSessionRequest,
  type ListSessionResponse,
  type Response,
  type Session,
} from "./types.ts";

const debug = createDebug("devtool-mcp-server:connector");
const openAppClientWaitTimeoutMs = 55_000;
const clientSetupSwitches = [
  { key: "enable_devtool", value: true, required: true },
  // `enable_quickjs_debug` is required for `Runtime.*` and `HeapProfiler.*` to work,
  // so we enable it by default. It won't have effect if the devtool doesn't support quickjs debug.
  // And it will not turn off `enable_v8` if it's already on, so it won't break v8 debug.
  { key: "enable_quickjs_debug", value: true, required: true },
] as const satisfies readonly {
  key: GlobalKeys;
  value: boolean;
  required: boolean;
}[];

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

function describeRequest(input: unknown): string {
  if (typeof input !== "object" || input === null) return "request";
  const message = input as Record<string, unknown>;
  if (typeof message["method"] === "string") return `method ${message["method"]}`;
  if (typeof message["event"] !== "string") return "request";

  const data = typeof message["data"] === "object" && message["data"] !== null
    ? message["data"] as Record<string, unknown>
    : undefined;
  if (typeof data?.["type"] === "string") return `${message["event"]} ${data["type"]}`;
  return `${message["event"]} event`;
}

function isNonEmptyListSessionResponse(response: Response): response is ListSessionResponse {
  return isListSessionResponse(response) && response.data.data.length > 0;
}

export class Connector {
  #transports: Transport[];
  #hdtTransports: HDTTransport[];
  #daemonTransports: DaemonTransport[];

  constructor(transports: Transport[]) {
    this.#transports = transports;
    this.#hdtTransports = transports.filter((t): t is HDTTransport => t instanceof HDTTransport);
    this.#daemonTransports = transports.filter((t): t is DaemonTransport => t instanceof DaemonTransport);
  }

  async listClients(): Promise<ClientList> {
    const discoveryFailures: unknown[] = [];

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
    discoveryFailures.push(
      ...daemonClientResults.filter((r) => r.status === "rejected").map((r) => r.reason),
    );
    const daemonClients = fulfilledDaemonClientResults.flatMap((r) => r.value);

    if (fulfilledDaemonClientResults.length > 0) {
      debug("Using clients from daemon transport: %o", daemonClients);
      return withTransports(
        daemonClients,
        fulfilledDaemonClientResults.flatMap(r => r.value.transports ?? ["daemon"]),
      );
    }

    const daemonLifecycleFailure = daemonClientResults
      .filter((result) => result.status === "rejected")
      .map(result => result.reason)
      .find(isDaemonLifecycleError);
    if (daemonLifecycleFailure) {
      // A lifecycle failure means the daemon may still own the one permitted
      // debug-router connection. Falling back to HDT/direct transports here
      // could create a second active connection and break both callers.
      throw daemonLifecycleFailure;
    }

    // 1. If no daemon transport fulfilled, try HDT transport, which also supports multiplexing.
    const hdtClientResults = await Promise.allSettled(
      this.#hdtTransports.map(async (transport) => {
        const clients = await transport.listClients();
        await Promise.allSettled(
          clients.flatMap(({ id }) => this.#setupClient(transport, id)),
        );
        return { clients, id: transport.id };
      }),
    );
    const fulfilledHDTClientResults = hdtClientResults
      .filter((r) => r.status === "fulfilled");
    discoveryFailures.push(
      ...hdtClientResults.filter((r) => r.status === "rejected").map((r) => r.reason),
    );
    const hdtClients = fulfilledHDTClientResults.flatMap((r) => r.value.clients);
    if (fulfilledHDTClientResults.length > 0) {
      debug("Using clients from HDT transport: %o", hdtClients);
      return withTransports(hdtClients, fulfilledHDTClientResults.map(r => r.value.id));
    }

    // 2. Try direct connection for other transports.
    const directTransports = this.#transports
      .filter(t => !(t instanceof DaemonTransport));
    const clientListTransports = directTransports
      .filter(t => !(t instanceof HDTTransport))
      .filter(hasClientList);
    const deviceProbeTransports = directTransports.filter(t => !hasClientList(t));

    const [clientListResults, transportDevices] = await Promise.all([
      Promise.allSettled(
        clientListTransports.map(async (transport) => {
          const clients = await transport.listClients();
          await Promise.allSettled(
            clients.flatMap(({ id }) => this.#setupClient(transport, id)),
          );
          return { clients, id: transport.id };
        }),
      ),
      Promise.allSettled(
        deviceProbeTransports.map(async (transport) => ({
          transport,
          devices: await transport.listDevices(),
        })),
      ),
    ]);

    for (const result of clientListResults) {
      if (result.status === "rejected") {
        discoveryFailures.push(result.reason);
        debug("listClients: listClients failed on one transport: %O", result.reason);
      }
    }

    for (const result of transportDevices) {
      if (result.status === "rejected") {
        discoveryFailures.push(result.reason);
        debug("listClients: listDevices failed on one transport: %O", result.reason);
      }
    }

    const fulfilledClientListResults = clientListResults
      .filter(result => result.status === "fulfilled");
    const fulfilledTransportDevices = transportDevices
      .filter(result => result.status === "fulfilled");
    if (
      fulfilledClientListResults.length === 0
      && fulfilledTransportDevices.length === 0
      && discoveryFailures.length > 0
    ) {
      throwClientDiscoveryFailures(discoveryFailures);
    }

    const results = await Promise.allSettled(
      fulfilledTransportDevices
        .map(r => r.value)
        .flatMap(({ transport, devices }) => devices.flatMap(({ id }) => this.#listClientsForDevice(transport, id))),
    );

    const fulfilledClientResults = results
      .filter((r) => r.status === "fulfilled");
    if (
      fulfilledClientListResults.length === 0
      && fulfilledClientResults.length === 0
      && results.length > 0
    ) {
      throwClientDiscoveryFailures(
        [
          ...discoveryFailures,
          ...results.filter(result => result.status === "rejected").map(result => result.reason),
        ],
      );
    }

    const fulfilledTransports = [
      ...fulfilledClientListResults.map(r => r.value.id),
      ...fulfilledTransportDevices.map(r => r.value.transport.id),
    ];
    return withTransports(
      [
        ...fulfilledClientListResults.flatMap((r) => r.value.clients),
        ...fulfilledClientResults.flatMap((r) => r.value),
      ],
      fulfilledTransports.length > 0 ? fulfilledTransports : undefined,
    );
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

  async openApp(deviceId: string, packageName: string, options?: OpenAppOptions): Promise<string> {
    const transport = await this.#findTransportWithDeviceId(deviceId);

    await transport.openApp(deviceId, packageName, options);

    const signal = AbortSignal.any([
      options?.signal,
      AbortSignal.timeout(openAppClientWaitTimeoutMs),
    ].filter(i => i !== undefined));

    const { setTimeout } = await import("node:timers/promises");
    while (!signal.aborted) {
      try {
        const clients = hasClientList(transport)
          ? (await transport.listClients())
            .filter(({ id }) => ClientId.deserialize(id)?.deviceId === deviceId)
          : await this.#listClientsForDevice(transport, deviceId);

        const appClient = clients.find(({ info }) =>
          /** Android */ info.AppProcessName === packageName
            /** iOS */ || info.bundleId === packageName
            /** OpenHarmony */ || info.bundleName === packageName
        );
        if (appClient !== undefined) {
          return appClient.id;
        }
      } catch (err) {
        // ignore error
        debug(`openApp ${deviceId} ${packageName} client not found %o`, err);
      }
      try {
        await setTimeout(1_000, undefined, { signal });
      } catch {
        break;
      }
    }

    throw new Error(
      `Timed out waiting for app client ${packageName} on device ${deviceId}.`,
    );
  }

  async sendMessage<T, R>(
    clientId: string,
    message: T,
    pipeline: Pipeline = { input: [], output: [] },
  ): Promise<R> {
    return this.#sendMessage(clientId, message, pipeline);
  }

  async sendAppMessage<Output, Params = never>(
    clientId: string,
    method: string,
    params?: Params,
  ): Promise<Output> {
    const id = nextRequestId();

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

  /**
   * Open a page on the given client by sending an `OpenCard` Customized event.
   */
  async openPage(clientId: string, url: string, signal?: AbortSignal): Promise<ListSessionResponse> {
    return await this.#sendMessage<Record<string, unknown>, ListSessionResponse>(clientId, {
      event: "Customized",
      data: {
        type: "OpenCard",
        data: {
          type: "url",
          url,
        },
        sender: -1,
      },
      from: -1,
    }, {
      input: [],
      output: [
        // Pulling an old page and plugging the requested page both broadcast an
        // uncorrelated SessionList. An empty list cannot mean OpenCard succeeded.
        new FilterTransformStream(isNonEmptyListSessionResponse),
      ],
    }, signal);
  }

  async sendCDPMessage<Output, Params = never>(
    clientId: string,
    sessionId: number,
    method: string,
    params?: Params,
    isMainThread = false,
  ): Promise<Output> {
    const id = nextRequestId();

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

  async #sendListSessionMessage(
    clientId: string,
  ): Promise<Session[]> {
    const id = nextRequestId();
    const { data: { data: sessions } } = await this.#sendMessage<ListSessionRequest, ListSessionResponse>(
      clientId,
      {
        event: "Customized",
        data: {
          type: "ListSession",
          data: {},
          id,
        },
      },
      {
        input: [],
        output: [
          new FilterTransformStream(createCorrelatedFilter(isListSessionResponse, id)),
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
    const { transportId, deviceId, port } = this.#resolveClientId(clientId);
    const transport = await this.#findTransportWithDeviceId(deviceId, transportId);

    return await this.#connect(
      transport,
      { transportId, deviceId, port, signal },
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

  #resolveClientId(clientId: string): ClientId {
    const parsed = ClientId.deserialize(clientId);
    if (!parsed) {
      throw new Error(`Invalid clientId: ${clientId}`);
    }
    return parsed;
  }

  async #findTransportWithDeviceId(deviceId: string, transportId?: string): Promise<Transport> {
    const [onlyTransport] = this.#transports;
    if (this.#transports.length === 1 && onlyTransport instanceof DaemonTransport) {
      // The daemon can reuse its pooled target before requiring a fresh device scan.
      return onlyTransport;
    }

    // Keep the same preference as listClients(): if a daemon transport can see
    // this device, stick to it for follow-up requests. Otherwise a faster direct
    // transport can win the race here and bypass the stable daemon path that was
    // used during discovery, which is exactly what made list-sessions flaky.
    const daemonTransport = await this.#findTransportWithDeviceIdInPool(this.#daemonTransports, deviceId);
    if (daemonTransport) {
      return daemonTransport;
    }

    const nonDaemonTransports = this.#transports.filter(t => !(t instanceof DaemonTransport));
    if (transportId !== undefined) {
      const matchedById = nonDaemonTransports.find(t => t.id === transportId);
      if (matchedById) {
        return matchedById;
      }
      throw new Error(`Transport with id: ${transportId} not found`);
    }

    const transport = await this.#findTransportWithDeviceIdInPool(
      nonDaemonTransports,
      deviceId,
    );
    if (transport) {
      return transport;
    }

    throw new Error(`Device with id: ${deviceId} not found`);
  }

  async #findTransportWithDeviceIdInPool(transports: Transport[], deviceId: string): Promise<Transport | null> {
    try {
      return await Promise.any(
        transports.map(async (transport) => {
          const devices = await transport.listDevices();
          if (devices.some(({ id }) => id === deviceId)) return transport;
          throw new Error("Not found in this transport");
        }),
      );
    } catch (error) {
      if (error instanceof AggregateError) {
        const daemonLifecycleFailure = error.errors.find(isDaemonLifecycleError);
        if (daemonLifecycleFailure) throw daemonLifecycleFailure;
      }
      return null;
    }
  }

  async #connect<I, O>(
    transport: Transport,
    options: TransportConnectOptions & { transportId: string },
    inputStream: ReadableStream<I>,
    pipeline: Pipeline,
  ): Promise<OutputStream<O>> {
    const { deviceId, port } = options;

    const conn = transport instanceof DaemonTransport
      ? await transport.connect<I, O>(options)
      : await transport.connect<I, O>({ deviceId, port, signal: options.signal });

    const inputAbortController = new AbortController();
    const inputAbortReason = new Error("Connector input stream disposed");

    const inputClosed = [
      ...pipeline.input,
      new CustomizedClientIdTransformStream(port),
      new InspectStream((msg) => debug(`connect ${deviceId}:${port} input stream send %o`, JSON.stringify(msg))),
    ].reduce((stream, transform) => stream.pipeThrough(transform), inputStream)
      .pipeTo(conn.writable, { preventClose: true, signal: inputAbortController.signal })
      .catch((err) => {
        if (err === inputAbortReason) {
          return;
        }
        debug(`connect ${deviceId}:${port} input stream err %O`, err);
        throw err;
      });
    const inputSettled = inputClosed.catch(() => {});

    const outputStream = [
      new InspectStream((msg) => debug(`connect ${deviceId}:${port} output stream receive %O`, msg)),
      ...pipeline.output,
    ].reduce(
      (stream, transform) => stream.pipeThrough(transform),
      conn.readable,
    );

    return Object.assign(outputStream, {
      inputClosed,
      async [Symbol.asyncDispose]() {
        debug(`connect ${deviceId}:${port} close connection`);
        inputAbortController.abort(inputAbortReason);
        const connectionDisposed = Promise.resolve().then(() => conn[Symbol.asyncDispose]());
        void connectionDisposed.catch(() => {});
        await inputSettled;
        return connectionDisposed;
      },
    });
  }

  async #sendMessage<I, O>(
    clientId: string,
    input: I,
    pipeline: Pipeline = { input: [], output: [] },
    signal?: AbortSignal,
  ): Promise<O> {
    const { transportId, deviceId, port } = this.#resolveClientId(clientId);
    const transport = await this.#findTransportWithDeviceId(deviceId, transportId);

    return this.#sendMessageWithTransport(
      transport,
      { transportId, deviceId, port, signal: signal ?? AbortSignal.timeout(10_000) },
      input,
      pipeline,
      describeRequest(input),
    );
  }

  async #sendMessageWithTransport<I, O>(
    transport: Transport,
    options: TransportConnectOptions & { transportId: string },
    input: I,
    pipeline: Pipeline,
    request = "request",
  ): Promise<O> {
    const outputStream = await this.#connect<I, O>(
      transport,
      options,
      // We have polyfill for this
      ReadableStream.from([input]),
      pipeline,
    );
    const reader = outputStream.getReader();
    let failed = false;
    let primaryError: unknown;
    let result!: O;
    try {
      const read = reader.read();
      await Promise.race([read, outputStream.inputClosed]);
      const response = await read;
      await outputStream.inputClosed;
      if (!response.done) {
        result = response.value;
      } else {
        options.signal?.throwIfAborted();
        const clientId = ClientId.serialize(options.transportId, options.deviceId, options.port);
        throw new Error(
          `Transport ${transport.constructor.name} ended cleanly (EOF) while waiting for a response to ${request} on clientId: ${clientId}.`,
        );
      }
    } catch (err) {
      failed = true;
      primaryError = err;
    } finally {
      await reader.cancel(primaryError).catch(() => {});
      reader.releaseLock();
    }

    try {
      await outputStream[Symbol.asyncDispose]();
    } catch (err) {
      if (!failed) {
        failed = true;
        primaryError = err;
      } else {
        debug("connection cleanup suppressed after request failure %O", err);
      }
    }

    if (failed) {
      throw primaryError;
    }
    return result;
  }

  async #listClientsForDevice(
    transport: Transport,
    deviceId: string,
  ): Promise<{ id: string; info: AppInfo; port: number }[]> {
    const MIN_PORT = 8901;
    const PORTS = Array.from({ length: 10 }, (_, i) => MIN_PORT + i);
    const discoverySignal = AbortSignal.timeout(5_000);
    const results = await Promise.allSettled(PORTS.map(async (port: number) => {
      const info = await this.#discoverAndSetupClient(transport, deviceId, port, discoverySignal);
      return { id: ClientId.serialize(transport.id, deviceId, port), info, port };
    }));

    const clients = results
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
    if (clients.length === 0) {
      discoverySignal.throwIfAborted();
    }
    return clients;
  }

  async #discoverAndSetupClient(
    transport: Transport,
    deviceId: string,
    port: number,
    discoverySignal: AbortSignal,
  ): Promise<AppInfo> {
    const result = await this.#probeClient(transport, deviceId, port, discoverySignal, true);
    if (!result.setupTimedOut) return result.info;

    // App-only runtimes may register but never acknowledge Lynx switches. The timed-out
    // connection has been disposed; confirm the same runtime on a fresh connection before
    // publishing it. Do not turn disconnects, cancellation, or replacement into success.
    const current = await this.#probeClient(transport, deviceId, port, AbortSignal.timeout(3_000), false);
    const identityKeys = ["debugRouterId", "AppProcessName", "bundleId", "bundleName", "App"] as const;
    if (identityKeys.some(key => current.info[key] !== result.info[key])) {
      throw new Error("Client identity changed after global-switch setup timed out");
    }
    debug(`setupClient ${deviceId}:${port} retaining registered client without confirmed Lynx switches`);
    return current.info;
  }

  async #probeClient(
    transport: Transport,
    deviceId: string,
    port: number,
    discoverySignal: AbortSignal,
    setup: boolean,
  ): Promise<{ info: AppInfo; setupTimedOut?: boolean }> {
    const lifetime = new AbortController();
    const forwardStageSignal = (signal: AbortSignal): () => void => {
      const abort = () => lifetime.abort(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      try {
        lifetime.signal.throwIfAborted();
      } catch (err) {
        signal.removeEventListener("abort", abort);
        throw err;
      }
      return () => signal.removeEventListener("abort", abort);
    };

    const exchange = async <T extends Response>(
      connection: Connection<Response, unknown>,
      message: unknown,
      predicate: (response: Response) => response is T,
      signal: AbortSignal,
    ): Promise<T> => {
      const stopForwardingSignal = forwardStageSignal(signal);
      try {
        signal.throwIfAborted();
        const writer = connection.writable.getWriter();
        debug("connect input stream send %o", JSON.stringify(message));
        await writer.write(message).finally(() => writer.releaseLock());

        signal.throwIfAborted();
        for await (const value of connection.readable.values({ preventCancel: true })) {
          signal.throwIfAborted();
          debug("connect output stream receive %O", value);
          if (predicate(value)) return value;
        }
        signal.throwIfAborted();
        throw new Error("Connection closed before receiving the expected response");
      } catch (err) {
        signal.throwIfAborted();
        throw err;
      } finally {
        stopForwardingSignal();
      }
    };

    const stopForwardingDiscovery = forwardStageSignal(discoverySignal);
    await using connection = await transport.connect<unknown, Response>({
      deviceId,
      port,
      signal: lifetime.signal,
    }).finally(stopForwardingDiscovery);
    const register = await exchange(
      connection,
      { event: "Initialize", data: port } satisfies InitializeRequest,
      isInitializeResponse,
      discoverySignal,
    );

    if (!setup) return { info: register.data.info };

    for (const { key, value, required } of clientSetupSwitches) {
      const setupSignal = AbortSignal.timeout(3_000);
      try {
        await exchange(
          connection,
          {
            event: "Customized",
            data: {
              type: "SetGlobalSwitch",
              data: {
                client_id: port,
                session_id: -1,
                message: { global_key: key, global_value: value },
              },
              sender: port,
            },
          },
          isSetGlobalSwitchResponse,
          setupSignal,
        );
      } catch (err) {
        debug(`setupClient ${deviceId}:${port} ${key} failed %O`, err);
        if (
          setupSignal.aborted && err === setupSignal.reason
          && err instanceof DOMException && err.name === "TimeoutError"
          && register.data.info.debugRouterId
        ) {
          return { info: register.data.info, setupTimedOut: true };
        }
        if (required) throw err;
      }
    }

    return { info: register.data.info };
  }

  async #setupClient(transport: Transport, clientId: string): Promise<void> {
    const { transportId, deviceId, port } = this.#resolveClientId(clientId);
    for (const { key, value } of clientSetupSwitches) {
      try {
        await this.#sendMessageWithTransport<{ key: GlobalKeys; value: boolean }, never>(
          transport,
          { transportId, deviceId, port, signal: AbortSignal.timeout(3_000) },
          { key, value },
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
        debug(`setupClient ${deviceId}:${port} ${key} failed %O`, err);
      }
    }
  }
}

export * from "./types.ts";

export type { ClientTarget } from "./client-id.ts";
export { nextRequestId } from "./request-id.ts";
