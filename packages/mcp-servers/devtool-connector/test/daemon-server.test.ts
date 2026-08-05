// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { TransformStream } from 'node:stream/web';
import type { TestContext } from 'node:test';
import { describe, test } from 'node:test';
import { WebSocket } from 'ws';
import type { ClientTarget } from '../src/client-id.ts';
import { DAEMON_PRODUCT } from '../src/daemon/protocol.ts';
import { DevtoolDaemon } from '../src/daemon/server.ts';
import type {
  Client,
  Connection,
  Transport,
  TransportConnectOptions,
} from '../src/transport/transport.ts';

const packageJson = createRequire(import.meta.url)('../package.json') as {
  version: string;
};

// ---------------------------------------------------------------------------
// Fake transport
// ---------------------------------------------------------------------------

/**
 * A fake transport that simulates a device running on a specific set of ports.
 * When `connect()` is called, it:
 *   1. Returns an in-memory readable/writable pair
 *   2. Waits for an Initialize message
 *   3. Responds with a Register message (completing the handshake)
 *   4. Echoes all subsequent messages back to the caller
 */
function createFakeTransport(opts: {
  deviceId: string;
  activePorts: ClientTarget[];
  silentPorts?: ClientTarget[];
  registerDelayMs?: number;
  registerDelayMsByPort?: Record<number, number>;
  connectDelayMs?: number;
  connectGate?: Promise<void>;
  disposeGate?: Promise<void>;
  disposeError?: unknown;
  registerGate?: Promise<void>;
  registerError?: unknown;
  onConnected?: (close: () => Promise<void>) => void;
  onConnectStarted?: () => void;
  onDispose?: () => void;
  onDisposeStarted?: () => void;
  onInitialize?: () => void;
  onListDevices?: () => void | Promise<void>;
  onMessage?: (message: unknown, options: TransportConnectOptions) => void;
  mapResponse?: (
    message: unknown,
    options: TransportConnectOptions,
  ) => unknown | Promise<unknown>;
}): Transport {
  const {
    deviceId,
    activePorts,
    silentPorts = [],
    registerDelayMs = 0,
    registerDelayMsByPort = {},
    connectDelayMs = 0,
    connectGate,
    disposeGate,
    disposeError,
    registerGate,
    registerError,
    onConnected,
    onConnectStarted,
    onDispose,
    onDisposeStarted,
    onInitialize,
    onListDevices,
    onMessage,
    mapResponse,
  } = opts;

  return {
    async close() {},
    async listDevices() {
      await onListDevices?.();
      return [{ id: deviceId, os: 'Android' as const }];
    },
    async listAvailableApps() {
      return [{ packageName: 'com.test.app', name: 'Test App' }];
    },
    async openApp() {},
    async connect<TInput, TOutput>(
      options: TransportConnectOptions,
    ): Promise<Connection<TOutput, TInput>> {
      if (connectDelayMs > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, connectDelayMs),
        );
      }

      if (!activePorts.includes(options.port)) {
        throw new Error(`Connection refused on port ${options.port}`);
      }
      onConnectStarted?.();
      await connectGate;

      // In-memory pipe: what the connector writes → device reads → device writes → connector reads
      const { readable: toDevice, writable: toDeviceWritable } =
        new TransformStream<TInput>();
      const { readable: fromDevice, writable: fromDeviceWritable } =
        new TransformStream<TOutput>();
      const fromDeviceWriter = fromDeviceWritable.getWriter();
      onConnected?.(() => fromDeviceWriter.close());

      // Process incoming messages from the connector
      void (async () => {
        try {
          for await (const msg of toDevice) {
            onMessage?.(msg, options);
            const parsed = msg as Record<string, unknown>;
            if (parsed['event'] === 'Initialize') {
              onInitialize?.();
              if (silentPorts.includes(options.port)) {
                continue;
              }
              if (registerError !== undefined) {
                await fromDeviceWriter.abort(registerError);
                break;
              }

              if (registerGate) await registerGate;

              const delayMs =
                typeof options.port === 'number'
                  ? (registerDelayMsByPort[options.port] ?? registerDelayMs)
                  : registerDelayMs;
              if (delayMs > 0) {
                await new Promise<void>((resolve) =>
                  setTimeout(resolve, delayMs),
                );
              }

              // Respond with Register
              await fromDeviceWriter.write({
                event: 'Register',
                data: {
                  id: options.port,
                  info: {
                    App: 'FakeApp',
                    AppVersion: '1.0',
                    AppProcessName: 'com.test.app',
                    debugRouterId: '1',
                    debugRouterVersion: '1.0',
                    deviceModel: 'FakeDevice',
                    network: 'USB',
                    osVersion: '14',
                    sdkVersion: '1.0',
                  },
                },
              } as TOutput);
            } else {
              // Echo by default; individual tests may emulate a real protocol
              // response while retaining the same pooled transport behavior.
              const response = mapResponse
                ? await mapResponse(msg, options)
                : msg;
              await fromDeviceWriter.write(response as TOutput);
            }
          }
        } catch {
          // stream closed
        } finally {
          try {
            await fromDeviceWriter.close();
          } catch {
            /* ignore */
          }
        }
      })();

      return {
        readable: fromDevice,
        writable: toDeviceWritable,
        async [Symbol.asyncDispose]() {
          onDisposeStarted?.();
          await disposeGate;
          onDispose?.();
          if (disposeError !== undefined) throw disposeError;
          try {
            await fromDeviceWriter.close();
          } catch {
            /* ignore */
          }
        },
      };
    },
  };
}

function createCountingFakeTransport(opts: {
  deviceId: string;
  activePorts: ClientTarget[];
  registerDelayMs?: number;
  connectDelayMs?: number;
}): {
  transport: Transport;
  getConnectCount: (port?: ClientTarget) => number;
} {
  const connectCounts = new Map<ClientTarget, number>();
  const baseTransport = createFakeTransport(opts);

  return {
    transport: {
      ...baseTransport,
      async connect<TInput, TOutput>(
        options: TransportConnectOptions,
      ): Promise<Connection<TOutput, TInput>> {
        connectCounts.set(
          options.port,
          (connectCounts.get(options.port) ?? 0) + 1,
        );
        return baseTransport.connect<TInput, TOutput>(options);
      },
    },
    getConnectCount: (port?: number) =>
      port === undefined
        ? Array.from(connectCounts.values()).reduce(
            (sum, count) => sum + count,
            0,
          )
        : (connectCounts.get(port) ?? 0),
  };
}

/**
 * A multiplexing transport that answers `listClients()` directly instead of
 * being probed device-by-device.
 */
class EmptyClientListTransport implements Transport {
  listClientsCalls = 0;
  listDevicesCalls = 0;

  async close(): Promise<void> {}

  async listClients(): Promise<Client[]> {
    this.listClientsCalls += 1;
    return [];
  }

  async listDevices() {
    this.listDevicesCalls += 1;
    return [];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error('EmptyClientListTransport should not connect');
  }
}

/** A multiplexing transport whose `listClients()` always rejects. */
class RejectingClientListTransport implements Transport {
  #failure: Error;

  constructor(failure: Error) {
    this.#failure = failure;
  }

  async close(): Promise<void> {}

  async listClients(): Promise<Client[]> {
    throw this.#failure;
  }

  async listDevices() {
    return [];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error('RejectingClientListTransport should not connect');
  }
}

/**
 * A transport with no `listClients()` whose device discovery always rejects, so
 * a lone instance leaves no fulfilled result to mask the failure.
 */
class RejectingDiscoveryTransport implements Transport {
  #failure: Error;

  constructor(failure: Error) {
    this.#failure = failure;
  }

  async close(): Promise<void> {}

  async listDevices(): Promise<never> {
    throw this.#failure;
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error('RejectingDiscoveryTransport should not connect');
  }
}

class DaemonDirectFallbackProbeTransport implements Transport {
  listDevicesCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    this.listDevicesCalls += 1;
    return [{ id: 'emulator-5554', os: 'Android' as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error('Direct fallback probe should not connect');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PORT = 29783; // Avoid collisions with real daemons

/**
 * Creates a WS connection that buffers all incoming messages from the start,
 * avoiding race conditions between `open` and early server messages.
 */
function connectWs(port: number): Promise<WebSocket & { inbox: unknown[] }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/devtool/connector`);
    const inbox: unknown[] = [];
    // Start collecting messages immediately, before 'open' fires
    ws.on('message', (raw) => {
      inbox.push(JSON.parse(String(raw)));
    });
    ws.on('open', () => resolve(Object.assign(ws, { inbox })));
    ws.on('error', reject);
  });
}

async function readMessage(
  ws: WebSocket & { inbox: unknown[] },
): Promise<unknown> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (ws.inbox.length > 0) {
      return ws.inbox.shift()!;
    }
    await new Promise<void>((r) => setTimeout(r, 10));
  }
  throw new Error('timeout waiting for WS message');
}

async function readMessageWithin(
  ws: WebSocket & { inbox: unknown[] },
  timeoutMs: number,
): Promise<unknown | 'timeout'> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (ws.inbox.length > 0) {
      return ws.inbox.shift()!;
    }
    await new Promise<void>((r) => setTimeout(r, 10));
  }
  return 'timeout';
}

async function assertNoMessage(
  ws: WebSocket & { inbox: unknown[] },
  timeoutMs = 100,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (ws.inbox.length > 0) {
      assert.fail(
        `expected no WS message, got ${JSON.stringify(ws.inbox.shift())}`,
      );
    }
    await new Promise<void>((r) => setTimeout(r, 10));
  }
}

async function yieldToIo(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function createGatedRawSession(
  t: TestContext,
  port: number,
  onDispose?: () => void,
): Promise<{
  daemon: DevtoolDaemon;
  initializeObserved: Promise<void>;
  register: () => void;
  ws: WebSocket & { inbox: unknown[] };
}> {
  const initializeObserved = Promise.withResolvers<void>();
  const register = Promise.withResolvers<void>();
  const daemon = new DevtoolDaemon([
    createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      ...(onDispose ? { onDispose } : {}),
      onInitialize: initializeObserved.resolve,
      registerGate: register.promise,
    }),
  ]);
  await daemon.start(port);
  t.after(() => daemon.close());
  const ws = await connectWs(port);
  t.after(() => ws.close());
  await performHandshake(ws);
  return {
    daemon,
    initializeObserved: initializeObserved.promise,
    register: register.resolve,
    ws,
  };
}

async function createRetiringGenerationFixture(
  t: TestContext,
  port: number,
): Promise<{
  closeGenerations: Array<() => Promise<void>>;
  daemon: DevtoolDaemon;
  releaseDisposal: () => void;
  ws: WebSocket & { inbox: unknown[] };
}> {
  const disposeGate = Promise.withResolvers<void>();
  const disposalStarted = Promise.withResolvers<void>();
  const discoveryEntered = Promise.withResolvers<void>();
  const discoveryRelease = Promise.withResolvers<void>();
  const closeGenerations: Array<() => Promise<void>> = [];
  let disposeCount = 0;
  let blockDiscovery = false;
  const daemon = new DevtoolDaemon([
    createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      disposeGate: disposeGate.promise,
      onConnected: (close) => closeGenerations.push(close),
      onDisposeStarted() {
        disposeCount += 1;
        disposalStarted.resolve();
      },
      async onListDevices() {
        if (!blockDiscovery) return;
        discoveryEntered.resolve();
        await discoveryRelease.promise;
      },
    }),
  ]);
  await daemon.start(port);
  t.after(() => {
    disposeGate.resolve();
    return daemon.close();
  });

  const firstWs = await connectWs(port);
  await performHandshake(firstWs);
  await subscribeToPort(firstWs, {
    id: 1,
    deviceId: 'emulator-5554',
    port: 8901,
  });
  const firstWsClosed = new Promise<void>((resolve) =>
    firstWs.once('close', () => resolve()),
  );
  await closeGenerations[0]!();
  await firstWsClosed;
  assert.equal(disposeCount, 1);
  await disposalStarted.promise;

  const ws = await connectWs(port);
  t.after(() => ws.close());
  await performHandshake(ws);
  blockDiscovery = true;
  ws.send(
    JSON.stringify({
      event: 'Control',
      data: { id: 2, method: 'listClients' },
    }),
  );
  await discoveryEntered.promise;
  discoveryRelease.resolve();
  const pong = (await sendAndRead(ws, { event: 'Ping' })) as { event: string };
  assert.equal(pong.event, 'Pong');

  return { closeGenerations, daemon, releaseDisposal: disposeGate.resolve, ws };
}

const STALE_MESSAGE_ID = 7;
const REPLACEMENT_MARKER_ID = 8;

function getCustomizedMessageId(message: unknown): number | undefined {
  return (
    message as {
      data?: { data?: { message?: { id?: number } } };
    }
  ).data?.data?.message?.id;
}

async function createClosingReplacementFixture(
  t: TestContext,
  port: number,
): Promise<{
  closeStaleServerConnection(): Promise<void>;
  delayedServerWs: WebSocket;
  getConnectCount(): number;
  getDisposeStartedCount(): number;
  getGenerationMessages(generation: number): unknown[];
  replacementMarkerHandled: Promise<void>;
  replacementWs: WebSocket & { inbox: unknown[] };
  staleWs: WebSocket & { inbox: unknown[] };
}> {
  const generationByOptions = new WeakMap<TransportConnectOptions, number>();
  const messagesByGeneration = new Map<number, unknown[]>();
  const closeGenerations: Array<() => Promise<void>> = [];
  const firstGenerationDisposed = Promise.withResolvers<void>();
  const replacementMarkerHandled = Promise.withResolvers<void>();
  let connectCount = 0;
  let disposeStartedCount = 0;
  const baseTransport = createFakeTransport({
    deviceId: 'emulator-5554',
    activePorts: [8901],
    onConnected: (close) => closeGenerations.push(close),
    onDispose: firstGenerationDisposed.resolve,
    onDisposeStarted: () => {
      disposeStartedCount += 1;
    },
    onMessage(message, options) {
      if ((message as { event?: unknown }).event === 'Initialize') return;
      const generation = generationByOptions.get(options);
      assert.ok(generation);
      const messages = messagesByGeneration.get(generation) ?? [];
      messages.push(message);
      messagesByGeneration.set(generation, messages);
      if (
        generation === 2 &&
        getCustomizedMessageId(message) === REPLACEMENT_MARKER_ID
      ) {
        replacementMarkerHandled.resolve();
      }
    },
  });
  const transport: Transport = {
    ...baseTransport,
    async connect<TInput, TOutput>(
      options: TransportConnectOptions,
    ): Promise<Connection<TOutput, TInput>> {
      if (options.port === 8901) {
        connectCount += 1;
        generationByOptions.set(options, connectCount);
      }
      return await baseTransport.connect<TInput, TOutput>(options);
    },
  };
  const daemon = new DevtoolDaemon([transport]);
  await daemon.start(port);
  t.after(() => daemon.close());

  const staleWs = await connectWs(port);
  t.after(() => staleWs.close());
  await performHandshake(staleWs);
  await subscribeToPort(staleWs, {
    id: 1,
    deviceId: 'emulator-5554',
    port: 8901,
  });
  assert.equal(connectCount, 1);

  const originalClose = WebSocket.prototype.close;
  const serverCloseRequested = Promise.withResolvers<WebSocket>();
  let delayServerClose = true;
  t.mock.method(
    WebSocket.prototype,
    'close',
    function (this: WebSocket, code?: number, data?: string | Buffer): void {
      if (delayServerClose && this !== staleWs) {
        delayServerClose = false;
        serverCloseRequested.resolve(this);
        return;
      }
      originalClose.call(this, code, data);
    },
  );

  await closeGenerations[0]!();
  const delayedServerWs = await serverCloseRequested.promise;
  await firstGenerationDisposed.promise;
  t.after(() => {
    if (delayedServerWs.readyState === WebSocket.OPEN)
      originalClose.call(delayedServerWs);
  });

  const replacementWs = await connectWs(port);
  t.after(() => replacementWs.close());
  await performHandshake(replacementWs);
  const clients = await requestClientList(replacementWs, 2);
  assert.deepEqual(
    clients.map((client) => client.id),
    ['emulator-5554:8901'],
  );
  assert.equal(connectCount, 2);

  return {
    async closeStaleServerConnection() {
      const staleWsClosed = new Promise<void>((resolve) =>
        staleWs.once('close', () => resolve()),
      );
      // Registered after the daemon's close handler, this proves cleanup was
      // scheduled (or rejected as stale) before the method resolves.
      const serverCloseHandled = new Promise<void>((resolve) =>
        delayedServerWs.once('close', () => resolve()),
      );
      originalClose.call(delayedServerWs);
      await Promise.all([serverCloseHandled, staleWsClosed]);
    },
    delayedServerWs,
    getConnectCount: () => connectCount,
    getDisposeStartedCount: () => disposeStartedCount,
    getGenerationMessages: (generation) => [
      ...(messagesByGeneration.get(generation) ?? []),
    ],
    replacementMarkerHandled: replacementMarkerHandled.promise,
    replacementWs,
    staleWs,
  };
}

function sendAndRead(
  ws: WebSocket & { inbox: unknown[] },
  msg: unknown,
): Promise<unknown> {
  ws.send(JSON.stringify(msg));
  return readMessage(ws);
}

async function requestClientList(
  ws: WebSocket & { inbox: unknown[] },
  id: number,
): Promise<Array<{ id: string; info: { App: string } }>> {
  ws.send(
    JSON.stringify({
      event: 'Control',
      data: { id, method: 'listClients' },
    }),
  );

  const response = (await readMessage(ws)) as {
    event: string;
    data: {
      id: number;
      result?: Array<{ id: string; info: { App: string } }>;
      error?: string;
    };
  };
  assert.equal(response.event, 'ControlResponse');
  assert.equal(response.data.id, id);
  assert.equal(response.data.error, undefined);
  return response.data.result ?? [];
}

function requestJson<T>(
  port: number,
  path: string,
  method: string = 'GET',
  options: { body?: unknown; headers?: http.OutgoingHttpHeaders } = {},
): Promise<{
  body: T;
  headers: http.IncomingHttpHeaders;
  statusCode: number;
}> {
  return new Promise((resolve, reject) => {
    const body =
      options.body === undefined ? undefined : JSON.stringify(options.body);
    const headers: http.OutgoingHttpHeaders = {
      connection: 'close',
      ...options.headers,
      ...(body === undefined
        ? {}
        : {
            'content-length': Buffer.byteLength(body),
            'content-type': 'application/json',
          }),
    };
    const request = http.request(
      { headers, host: '127.0.0.1', method, path, port },
      (response) => {
        let rawBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          rawBody += chunk;
        });
        response.on('end', () => {
          try {
            resolve({
              body: JSON.parse(rawBody) as T,
              headers: response.headers,
              statusCode: response.statusCode ?? 0,
            });
          } catch (err) {
            reject(err);
          }
        });
      },
    );

    request.on('error', reject);
    request.end(body);
  });
}

async function subscribeToPort(
  ws: WebSocket & { inbox: unknown[] },
  params: { id: number; deviceId: string; port: ClientTarget },
): Promise<void> {
  ws.send(
    JSON.stringify({
      event: 'Control',
      data: {
        id: params.id,
        method: 'subscribe',
        params: { deviceId: params.deviceId, port: params.port },
      },
    }),
  );

  const response = (await readMessage(ws)) as {
    event: string;
    data: { id: number; error?: string };
  };
  assert.equal(response.event, 'ControlResponse');
  assert.equal(response.data.id, params.id);
  assert.equal(response.data.error, undefined);
}

/**
 * Performs the Initialize/Register handshake and returns the assigned client ID.
 */
async function performHandshake(
  ws: WebSocket & { inbox: unknown[] },
): Promise<number> {
  const init = (await readMessage(ws)) as { event: string; data: number };
  assert.equal(init.event, 'Initialize');
  const id = init.data;
  ws.send(JSON.stringify({ event: 'Register', data: { id, type: 'Driver' } }));
  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DevtoolDaemon', () => {
  test('starts and stops cleanly', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT);
    t.after(() => daemon.close());
    // If we get here without throwing, the server started successfully
  });

  test('serves connector version over HTTP', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 14);
    t.after(() => daemon.close());

    const response = await requestJson<{
      commandProtocol?: number;
      instanceId?: string;
      lifecycleProtocol?: number;
      product?: string;
      startedAt?: number;
      version?: string;
    }>(TEST_PORT + 14, '/devtool/connector/version');
    const repeatedResponse = await requestJson<typeof response.body>(
      TEST_PORT + 14,
      '/devtool/connector/version',
    );
    const contentType = response.headers['content-type'];

    t.assert.equal(response.statusCode, 200);
    t.assert.match(
      Array.isArray(contentType) ? contentType.join(',') : (contentType ?? ''),
      /application\/json/,
    );
    t.assert.equal(response.body.product, DAEMON_PRODUCT);
    t.assert.equal(response.body.version, packageJson.version);
    t.assert.equal(response.body.lifecycleProtocol, 1);
    t.assert.equal(response.body.commandProtocol, 1);
    t.assert.match(
      response.body.instanceId ?? '',
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/iu,
    );
    t.assert.equal(Number.isSafeInteger(response.body.startedAt), true);
    t.assert.equal(repeatedResponse.body.instanceId, response.body.instanceId);
  });

  test('accepts HTTP shutdown requests', async (t: TestContext) => {
    let resolveShutdown: (() => void) | undefined;
    const shutdown = new Promise<void>((resolve) => {
      resolveShutdown = resolve;
    });
    const daemon = new DevtoolDaemon([], {
      onShutdown: () => resolveShutdown?.(),
    });
    await daemon.start(TEST_PORT + 15);
    t.after(() => daemon.close());

    const metadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 15,
      '/devtool/connector/version',
    );
    const response = await requestJson<{ ok?: boolean }>(
      TEST_PORT + 15,
      '/devtool/connector/shutdown',
      'POST',
      { body: { expectedInstanceId: metadata.body.instanceId } },
    );
    const contentType = response.headers['content-type'];

    t.assert.equal(response.statusCode, 202);
    t.assert.match(
      Array.isArray(contentType) ? contentType.join(',') : (contentType ?? ''),
      /application\/json/,
    );
    assert.deepStrictEqual(response.body, { ok: true });
    await shutdown;
    await assert.rejects(() =>
      requestJson(TEST_PORT + 15, '/devtool/connector/shutdown', 'POST'),
    );
  });

  test('rejects shutdown requests without an expected daemon instance', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 34);
    t.after(() => daemon.close());

    const metadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 34,
      '/devtool/connector/version',
    );
    const response = await requestJson<{ error?: string; ok?: boolean }>(
      TEST_PORT + 34,
      '/devtool/connector/shutdown',
      'POST',
      { body: {} },
    );

    t.assert.equal(response.statusCode, 428);
    t.assert.equal(response.body.ok, false);
    t.assert.match(response.body.error ?? '', /instance/iu);
    const stillRunning = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 34,
      '/devtool/connector/version',
    );
    t.assert.equal(stillRunning.body.instanceId, metadata.body.instanceId);
  });

  test('rejects shutdown requests aimed at a replaced daemon instance', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 35);
    t.after(() => daemon.close());

    const metadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 35,
      '/devtool/connector/version',
    );
    const response = await requestJson<{ error?: string; ok?: boolean }>(
      TEST_PORT + 35,
      '/devtool/connector/shutdown',
      'POST',
      { body: { expectedInstanceId: '00000000-0000-4000-8000-000000000000' } },
    );

    t.assert.equal(response.statusCode, 409);
    t.assert.equal(response.body.ok, false);
    t.assert.match(response.body.error ?? '', /instance/iu);
    const stillRunning = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 35,
      '/devtool/connector/version',
    );
    t.assert.equal(stillRunning.body.instanceId, metadata.body.instanceId);
  });

  test('assigns a new instance identity after daemon recreation', async (t: TestContext) => {
    const firstDaemon = new DevtoolDaemon([]);
    await firstDaemon.start(TEST_PORT + 36);
    const firstMetadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 36,
      '/devtool/connector/version',
    );
    await firstDaemon.close();

    const secondDaemon = new DevtoolDaemon([]);
    await secondDaemon.start(TEST_PORT + 36);
    t.after(() => secondDaemon.close());
    const secondMetadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 36,
      '/devtool/connector/version',
    );

    t.assert.notEqual(
      firstMetadata.body.instanceId,
      secondMetadata.body.instanceId,
    );
  });

  test('coalesces concurrent shutdown requests for the same daemon generation', async (t: TestContext) => {
    const releaseClose = Promise.withResolvers<void>();
    const closeStarted = Promise.withResolvers<void>();
    const shutdownFinished = Promise.withResolvers<void>();
    let shutdownCalls = 0;
    const transport: Transport = {
      ...createFakeTransport({ deviceId: 'emulator-5554', activePorts: [] }),
      async close() {
        closeStarted.resolve();
        await releaseClose.promise;
      },
    };
    const daemon = new DevtoolDaemon([transport], {
      onShutdown() {
        shutdownCalls += 1;
        shutdownFinished.resolve();
      },
    });
    await daemon.start(TEST_PORT + 37);
    t.after(() => {
      releaseClose.resolve();
      return daemon.close();
    });
    const metadata = await requestJson<{ instanceId?: string }>(
      TEST_PORT + 37,
      '/devtool/connector/version',
    );
    const body = { expectedInstanceId: metadata.body.instanceId };

    const first = await requestJson<{
      alreadyStopping?: boolean;
      ok?: boolean;
    }>(TEST_PORT + 37, '/devtool/connector/shutdown', 'POST', { body });
    await closeStarted.promise;
    const second = await requestJson<{
      alreadyStopping?: boolean;
      ok?: boolean;
    }>(TEST_PORT + 37, '/devtool/connector/shutdown', 'POST', { body });

    t.assert.equal(first.statusCode, 202);
    t.assert.deepStrictEqual(first.body, { ok: true });
    t.assert.equal(second.statusCode, 202);
    t.assert.deepStrictEqual(second.body, { ok: true, alreadyStopping: true });

    releaseClose.resolve();
    await shutdownFinished.promise;
    t.assert.equal(shutdownCalls, 1);
  });

  test('performs Initialize/Register handshake with connecting client', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 1);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 1);
    t.after(() => ws.close());

    // Should receive Initialize
    const init = (await readMessage(ws)) as { event: string; data: number };
    t.assert.equal(init.event, 'Initialize');
    t.assert.equal(typeof init.data, 'number');

    // Send Register
    ws.send(
      JSON.stringify({
        event: 'Register',
        data: { id: init.data, type: 'Driver' },
      }),
    );

    await assertNoMessage(ws);
  });

  test('responds to Ping with Pong', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 2);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 2);
    t.after(() => ws.close());

    await performHandshake(ws);

    const pong = await sendAndRead(ws, { event: 'Ping' });
    assert.deepStrictEqual(pong, { event: 'Pong' });
  });

  test('handles Control listDevices request', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 3);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 3);
    t.after(() => ws.close());

    await performHandshake(ws);

    ws.send(
      JSON.stringify({
        event: 'Control',
        data: { id: 42, method: 'listDevices' },
      }),
    );

    const resp = (await readMessage(ws)) as {
      event: string;
      data: { id: number; result: unknown };
    };
    t.assert.equal(resp.event, 'ControlResponse');
    t.assert.equal(resp.data.id, 42);
    assert.deepStrictEqual(resp.data.result, [
      { id: 'emulator-5554', os: 'Android' },
    ]);
  });

  test('handles Control listAvailableApps request', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 4);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 4);
    t.after(() => ws.close());

    await performHandshake(ws);

    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 99,
          method: 'listAvailableApps',
          params: { deviceId: 'emulator-5554' },
        },
      }),
    );

    const resp = (await readMessage(ws)) as {
      event: string;
      data: { id: number; result: unknown };
    };
    t.assert.equal(resp.event, 'ControlResponse');
    t.assert.equal(resp.data.id, 99);
    assert.deepStrictEqual(resp.data.result, [
      { packageName: 'com.test.app', name: 'Test App' },
    ]);
  });

  test('Control request returns error for unknown device', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 5);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 5);
    t.after(() => ws.close());

    await performHandshake(ws);

    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 77,
          method: 'listAvailableApps',
          params: { deviceId: 'nonexistent' },
        },
      }),
    );

    const resp = (await readMessage(ws)) as {
      event: string;
      data: { id: number; error?: string };
    };
    t.assert.equal(resp.event, 'ControlResponse');
    t.assert.equal(resp.data.id, 77);
    t.assert.ok(typeof resp.data.error === 'string');
    t.assert.ok(resp.data.error.includes('not found'));
  });

  test('subscribe + Customized message forwarding round-trip', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 6);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 6);
    t.after(() => ws.close());

    await performHandshake(ws);

    // Subscribe to device:port
    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 1,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );

    const subResp = (await readMessage(ws)) as {
      event: string;
      data: { id: number; error?: string };
    };
    t.assert.equal(subResp.event, 'ControlResponse');
    t.assert.equal(subResp.data.id, 1);
    t.assert.equal(subResp.data.error, undefined);

    // Send a Customized message — the fake transport echoes it back
    ws.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: 100, method: 'DOM.getDocument' },
          },
          sender: 1,
        },
        to: 8901,
      }),
    );

    const echo = (await readMessage(ws)) as {
      event: string;
      data: { type: string };
    };
    t.assert.equal(echo.event, 'Customized');
    t.assert.equal(echo.data.type, 'CDP');
  });

  test('POST commands reuse an existing pooled debug-router connection', async (t: TestContext) => {
    let connectCount = 0;
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      onConnectStarted: () => {
        connectCount += 1;
      },
      mapResponse(message) {
        const request = message as {
          event?: string;
          data?: {
            type?: string;
            data?: { message?: { id?: number; method?: string } };
          };
        };
        const cdpRequest = request.data?.data?.message;
        if (
          request.event !== 'Customized' ||
          request.data?.type !== 'CDP' ||
          cdpRequest?.id === undefined
        ) {
          return message;
        }

        const result =
          cdpRequest.method === 'DOM.getDocumentWithBoxModel'
            ? {
                root: {
                  nodeId: 1,
                  localName: 'page',
                  box_model: { content: [0, 0, 320, 0, 320, 640, 0, 640] },
                  children: [],
                },
                compress: false,
              }
            : {};
        return {
          ...request,
          data: {
            ...request.data,
            data: {
              ...request.data.data,
              message: JSON.stringify({ id: cdpRequest.id, result }),
            },
          },
        };
      },
    });
    const port = TEST_PORT + 27;
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(port);
    t.after(() => daemon.close());

    const ws = await connectWs(port);
    t.after(() => ws.close());
    await performHandshake(ws);
    await subscribeToPort(ws, { id: 1, deviceId: 'emulator-5554', port: 8901 });
    t.assert.equal(connectCount, 1);

    const response = await fetch(`http://127.0.0.1:${port}/command/snapshot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientId: 'emulator-5554:8901', sessionId: 1 }),
    });
    const result = (await response.json()) as { ok?: boolean };

    t.assert.equal(response.status, 200);
    t.assert.equal(result.ok, true);
    t.assert.equal(
      connectCount,
      1,
      'POST /command must not open a second debug-router TCP connection',
    );
  });

  test('forwards subscribed messages to a stable string target', async (t: TestContext) => {
    const forwardedMessages: unknown[] = [];
    const fakeTransport = createFakeTransport({
      deviceId: 'router-19783',
      activePorts: ['router-uuid'],
      onMessage: (message) => forwardedMessages.push(message),
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 20);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 20);
    t.after(() => ws.close());
    await performHandshake(ws);
    await subscribeToPort(ws, {
      id: 1,
      deviceId: 'router-19783',
      port: 'router-uuid',
    });

    ws.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 'router-uuid',
            session_id: 1,
            message: { id: 100, method: 'DOM.getDocument' },
          },
          sender: 1,
        },
        to: 'router-uuid',
      }),
    );

    const deadline = Date.now() + 1_000;
    while (forwardedMessages.length < 2 && Date.now() < deadline) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    const customized = forwardedMessages.filter(
      (
        message,
      ): message is {
        event: string;
        data: { sender?: ClientTarget; data?: { client_id?: ClientTarget } };
      } =>
        typeof message === 'object' &&
        message !== null &&
        (message as { event?: string }).event === 'Customized',
    );
    t.assert.equal(customized.length, 1);
    t.assert.equal(customized[0]?.data.sender, 'router-uuid');
    t.assert.equal(customized[0]?.data.data?.client_id, 'router-uuid');
  });

  test('rejects WebSocket connections to wrong path', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([]);
    await daemon.start(TEST_PORT + 7);
    t.after(() => daemon.close());

    await t.assert.rejects(
      () =>
        new Promise((resolve, reject) => {
          const ws = new WebSocket(
            `ws://127.0.0.1:${TEST_PORT + 7}/wrong/path`,
          );
          ws.on('open', () => {
            ws.close();
            resolve(undefined);
          });
          ws.on('error', reject);
          setTimeout(() => reject(new Error('timeout')), 2_000);
        }),
    );
  });

  test('multiple clients both receive broadcasts from same device', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 8);
    t.after(() => daemon.close());

    // Connect client A
    const wsA = await connectWs(TEST_PORT + 8);
    t.after(() => wsA.close());
    await performHandshake(wsA);

    // Subscribe A
    wsA.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 1,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await readMessage(wsA); // consume ControlResponse

    // Connect client B
    const wsB = await connectWs(TEST_PORT + 8);
    t.after(() => wsB.close());
    await performHandshake(wsB);

    // Subscribe B to same device:port
    wsB.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 2,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await readMessage(wsB); // consume ControlResponse

    // Client A sends a message — device echoes it — both A and B should get it
    wsA.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: 200, method: 'test' },
          },
          sender: 1,
        },
        to: 8901,
      }),
    );

    const echoA = (await readMessage(wsA)) as { event: string };
    const echoB = (await readMessage(wsB)) as { event: string };

    t.assert.equal(echoA.event, 'Customized');
    t.assert.equal(echoB.event, 'Customized');
  });

  test('forwards subscribed client messages with one stable app-side sender', async (t: TestContext) => {
    const forwardedMessages: unknown[] = [];
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      onMessage: (message) => forwardedMessages.push(message),
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 13);
    t.after(() => daemon.close());

    const wsA = await connectWs(TEST_PORT + 13);
    t.after(() => wsA.close());
    await performHandshake(wsA);
    await subscribeToPort(wsA, {
      id: 1,
      deviceId: 'emulator-5554',
      port: 8901,
    });

    const wsB = await connectWs(TEST_PORT + 13);
    t.after(() => wsB.close());
    await performHandshake(wsB);
    await subscribeToPort(wsB, {
      id: 2,
      deviceId: 'emulator-5554',
      port: 8901,
    });

    wsA.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: 201, method: 'DOM.getDocument' },
          },
          sender: 101,
        },
        to: 8901,
      }),
    );
    wsB.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: 202, method: 'Runtime.evaluate' },
          },
          sender: 102,
        },
        to: 8901,
      }),
    );

    const deadline = Date.now() + 1_000;
    let forwardedCustomized: Array<{ data: { sender?: number } }> = [];
    while (Date.now() < deadline) {
      forwardedCustomized = forwardedMessages.filter(
        (message): message is { data: { sender?: number } } =>
          typeof message === 'object' &&
          message !== null &&
          (message as { event?: string }).event === 'Customized',
      );
      if (forwardedCustomized.length >= 2) break;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    t.assert.equal(forwardedCustomized.length, 2);
    t.assert.deepEqual(
      forwardedCustomized.map((message) => message.data.sender),
      [8901, 8901],
    );
  });

  test('Control listClients waits for delayed device Register', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      registerDelayMs: 800,
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 9);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 9);
    t.after(() => ws.close());

    await performHandshake(ws);

    const clientList = await requestClientList(ws, 42);

    t.assert.equal(clientList.length, 1);
    t.assert.equal(clientList[0]?.id, 'emulator-5554:8901');
    t.assert.equal(clientList[0]?.info.App, 'FakeApp');
  });

  test('subscribe does not acknowledge a raw target before Register', async (t) => {
    const { initializeObserved, register, ws } = await createGatedRawSession(
      t,
      TEST_PORT + 19,
    );
    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 49,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await initializeObserved;
    await assertNoMessage(ws, 50);

    register();
    const response = (await readMessage(ws)) as {
      event: string;
      data: { id: number; error?: string };
    };
    t.assert.equal(response.event, 'ControlResponse');
    t.assert.equal(response.data.id, 49);
    t.assert.equal(response.data.error, undefined);
  });

  test('a requester disconnecting before Register does not retain a subscription', async (t) => {
    let disposeCount = 0;
    const { initializeObserved, register, ws } = await createGatedRawSession(
      t,
      TEST_PORT + 21,
      () => {
        disposeCount += 1;
      },
    );
    t.mock.timers.enable({ apis: ['setTimeout'] });
    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 51,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await initializeObserved;
    const disconnected = new Promise<void>((resolve) =>
      ws.once('close', () => resolve()),
    );
    ws.close();
    await disconnected;

    register();
    await yieldToIo();
    t.mock.timers.tick(10_000);
    await yieldToIo();
    t.assert.equal(disposeCount, 1);
  });

  test('daemon shutdown rejects a connection that registers after close starts', async (t) => {
    let disposeCount = 0;
    const { daemon, initializeObserved, register, ws } =
      await createGatedRawSession(t, TEST_PORT + 22, () => {
        disposeCount += 1;
      });
    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 52,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await initializeObserved;

    await daemon.close();
    register();
    await yieldToIo();

    t.assert.equal(disposeCount, 1);
  });

  test('subscribe reuses the exact healthy pooled target when fresh device discovery is empty', async (t) => {
    const baseTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    let deviceVisible = true;
    let listDevicesCalls = 0;
    const transport: Transport = {
      ...baseTransport,
      async listDevices() {
        listDevicesCalls += 1;
        return deviceVisible ? await baseTransport.listDevices() : [];
      },
    };
    const daemon = new DevtoolDaemon([transport]);
    await daemon.start(TEST_PORT + 18);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 18);
    t.after(() => ws.close());
    await performHandshake(ws);

    const clients = await requestClientList(ws, 47);
    t.assert.deepEqual(
      clients.map((client) => client.id),
      ['emulator-5554:8901'],
    );

    deviceVisible = false;
    await subscribeToPort(ws, {
      id: 48,
      deviceId: 'emulator-5554',
      port: 8901,
    });
    t.assert.equal(listDevicesCalls, 1);

    ws.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: 100, method: 'DOM.getDocument' },
          },
        },
        to: 8901,
      }),
    );
    const echo = (await readMessage(ws)) as {
      event: string;
      data: { type: string };
    };
    t.assert.equal(echo.event, 'Customized');
    t.assert.equal(echo.data.type, 'CDP');
  });

  test('Control listClients consults a fulfilled listClients() transport', async (t: TestContext) => {
    const clientListTransport = new EmptyClientListTransport();
    const directTransport = new DaemonDirectFallbackProbeTransport();
    const daemon = new DevtoolDaemon([clientListTransport, directTransport]);
    await daemon.start(TEST_PORT + 17);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 17);
    t.after(() => ws.close());

    await performHandshake(ws);

    const clientList = await requestClientList(ws, 46);

    t.assert.deepEqual(clientList, []);
    t.assert.equal(clientListTransport.listClientsCalls, 1);
    // A fulfilled listClients() must not suppress real device discovery.
    t.assert.equal(directTransport.listDevicesCalls, 1);
  });

  test('Control listClients reports the sole discovery rejection', async (t: TestContext) => {
    const failure = new Error('ClientList unavailable');
    const daemon = new DevtoolDaemon([
      new RejectingDiscoveryTransport(failure),
    ]);
    await daemon.start(TEST_PORT + 30);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 30);
    t.after(() => ws.close());
    await performHandshake(ws);

    ws.send(
      JSON.stringify({
        event: 'Control',
        data: { id: 53, method: 'listClients' },
      }),
    );
    const response = (await readMessage(ws)) as {
      event: string;
      data: { id: number; result?: unknown[]; error?: string };
    };

    t.assert.equal(response.event, 'ControlResponse');
    t.assert.equal(response.data.id, 53);
    t.assert.equal(response.data.result, undefined);
    t.assert.equal(response.data.error, failure.message);
  });

  test('Control listClients uses a successful direct fallback after a listClients() rejection', async (t: TestContext) => {
    const rejectingTransport = new RejectingClientListTransport(
      new Error('ClientList unavailable'),
    );
    const directTransport = new DaemonDirectFallbackProbeTransport();
    const daemon = new DevtoolDaemon([rejectingTransport, directTransport]);
    await daemon.start(TEST_PORT + 31);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 31);
    t.after(() => ws.close());
    await performHandshake(ws);

    const clientList = await requestClientList(ws, 54);

    t.assert.deepEqual(clientList, []);
    t.assert.equal(directTransport.listDevicesCalls, 1);
  });

  test('Control listClients returns a healthy pooled client when fresh discovery rejects', async (t: TestContext) => {
    const baseTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    let discoveryRejects = false;
    const directTransport: Transport = {
      ...baseTransport,
      async listDevices() {
        if (discoveryRejects) throw new Error('ADB discovery unavailable');
        return await baseTransport.listDevices();
      },
    };
    const daemon = new DevtoolDaemon([
      new RejectingClientListTransport(new Error('ClientList unavailable')),
      directTransport,
    ]);
    await daemon.start(TEST_PORT + 33);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 33);
    t.after(() => ws.close());
    await performHandshake(ws);
    await subscribeToPort(ws, {
      id: 55,
      deviceId: 'emulator-5554',
      port: 8901,
    });

    discoveryRejects = true;
    const clientList = await requestClientList(ws, 56);

    t.assert.deepEqual(
      clientList.map((client) => client.id),
      ['emulator-5554:8901'],
    );
  });

  test('legacy ListClients keeps its empty-list fallback after discovery rejects', async (t: TestContext) => {
    const daemon = new DevtoolDaemon([
      new RejectingClientListTransport(new Error('ClientList unavailable')),
    ]);
    await daemon.start(TEST_PORT + 32);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 32);
    t.after(() => ws.close());
    await performHandshake(ws);

    ws.send(JSON.stringify({ event: 'ListClients' }));
    const clientList = (await readMessage(ws)) as {
      event: string;
      data: unknown[];
    };
    t.assert.deepEqual(clientList, { event: 'ClientList', data: [] });

    const pong = await sendAndRead(ws, { event: 'Ping' });
    t.assert.deepEqual(pong, { event: 'Pong' });
  });

  test('caps discovery wait while returning all responsive clients', async (t: TestContext) => {
    const fakeTransport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901, 8902, 8903],
      silentPorts: [8901],
      registerDelayMsByPort: {
        8903: 800,
      },
    });
    const daemon = new DevtoolDaemon([fakeTransport]);
    await daemon.start(TEST_PORT + 12);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 12);
    t.after(() => ws.close());

    await performHandshake(ws);

    const clientList = await requestClientList(ws, 43);

    t.assert.deepEqual(clientList.map((client) => client.id).sort(), [
      'emulator-5554:8902',
      'emulator-5554:8903',
    ]);
  });

  test('Control listClients skips device ports whose connect never settles', async (t: TestContext) => {
    const hangingConnect =
      Promise.withResolvers<Connection<unknown, unknown>>();
    const hangingTransport: Transport = {
      async close() {},
      async listDevices() {
        return [{ id: 'emulator-5554', os: 'Android' as const }];
      },
      async listAvailableApps() {
        return [];
      },
      async openApp() {},
      async connect<TInput, TOutput>(
        options: TransportConnectOptions,
      ): Promise<Connection<TOutput, TInput>> {
        if (options.port === 8901) {
          return (await hangingConnect.promise) as Connection<TOutput, TInput>;
        }
        throw new Error(`Connection refused on port ${options.port}`);
      },
    };
    const daemon = new DevtoolDaemon([hangingTransport]);
    await daemon.start(TEST_PORT + 16);
    t.after(() => daemon.close());

    const ws = await connectWs(TEST_PORT + 16);
    t.after(() => ws.close());
    await performHandshake(ws);

    ws.send(
      JSON.stringify({
        event: 'Control',
        data: { id: 45, method: 'listClients' },
      }),
    );

    try {
      const response = (await readMessageWithin(ws, 6_000)) as
        | 'timeout'
        | {
            event: string;
            data: { id: number; result?: unknown[]; error?: string };
          };

      t.assert.notEqual(response, 'timeout');
      t.assert.equal(response.event, 'ControlResponse');
      t.assert.equal(response.data.id, 45);
      t.assert.equal(response.data.error, undefined);
      t.assert.deepEqual(response.data.result, []);
    } finally {
      hangingConnect.reject(
        new Error('test connection released after capped discovery'),
      );
    }
  });

  test('reusing a device connection resets the idle cleanup grace period', async (t: TestContext) => {
    const { transport, getConnectCount } = createCountingFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
    });
    const daemon = new DevtoolDaemon([transport]);
    await daemon.start(TEST_PORT + 10);
    t.after(() => daemon.close());

    const wsA = await connectWs(TEST_PORT + 10);
    await performHandshake(wsA);
    await subscribeToPort(wsA, {
      id: 1,
      deviceId: 'emulator-5554',
      port: 8901,
    });
    wsA.close();

    await new Promise<void>((resolve) => setTimeout(resolve, 9_000));

    const wsB = await connectWs(TEST_PORT + 10);
    await performHandshake(wsB);
    await subscribeToPort(wsB, {
      id: 2,
      deviceId: 'emulator-5554',
      port: 8901,
    });
    wsB.close();

    await new Promise<void>((resolve) => setTimeout(resolve, 1_500));

    const wsC = await connectWs(TEST_PORT + 10);
    t.after(() => wsC.close());
    await performHandshake(wsC);
    const clientList = await requestClientList(wsC, 44);

    t.assert.equal(clientList.length, 1);
    t.assert.equal(getConnectCount(8901), 1);
  });

  test('waits for a terminated generation to finish disposal before reconnecting', async (t: TestContext) => {
    const { closeGenerations, releaseDisposal, ws } =
      await createRetiringGenerationFixture(t, TEST_PORT + 23);
    t.assert.equal(closeGenerations.length, 1);

    releaseDisposal();
    const response = (await readMessage(ws)) as {
      event: string;
      data: { id: number; result: Array<{ id: string }> };
    };
    t.assert.equal(response.event, 'ControlResponse');
    t.assert.equal(response.data.id, 2);
    t.assert.deepEqual(
      response.data.result.map((client) => client.id),
      ['emulator-5554:8901'],
    );
    t.assert.equal(closeGenerations.length, 2);
  });

  test('a closing session cannot forward to a replacement generation', async (t) => {
    const fixture = await createClosingReplacementFixture(t, TEST_PORT + 28);
    await subscribeToPort(fixture.replacementWs, {
      id: 3,
      deviceId: 'emulator-5554',
      port: 8901,
    });

    const staleCustomizedHandled = new Promise<void>((resolve) =>
      fixture.delayedServerWs.once('message', () => resolve()),
    );
    fixture.staleWs.send(
      JSON.stringify({
        event: 'Customized',
        data: {
          type: 'CDP',
          data: {
            client_id: 8901,
            session_id: 1,
            message: { id: STALE_MESSAGE_ID, method: 'DOM.getDocument' },
          },
        },
        to: 8901,
      }),
    );
    await staleCustomizedHandled;

    const replacementMarker = {
      event: 'Customized',
      data: {
        type: 'CDP',
        data: {
          client_id: 8901,
          session_id: 1,
          message: {
            id: REPLACEMENT_MARKER_ID,
            method: 'Test.replacementMarker',
          },
        },
      },
      to: 8901,
    };
    fixture.replacementWs.send(JSON.stringify(replacementMarker));
    await fixture.replacementMarkerHandled;
    const markerEcho = await readMessage(fixture.replacementWs);
    const routedReplacementMarker = {
      ...replacementMarker,
      data: {
        ...replacementMarker.data,
        sender: 8901,
      },
    };

    t.assert.deepEqual(markerEcho, routedReplacementMarker);
    t.assert.deepEqual(fixture.getGenerationMessages(2), [
      routedReplacementMarker,
    ]);
    await fixture.closeStaleServerConnection();
  });

  test('a closing session cannot subscribe to or retire a replacement generation', async (t) => {
    const fixture = await createClosingReplacementFixture(t, TEST_PORT + 29);

    const staleSubscribeHandled = new Promise<void>((resolve) =>
      fixture.delayedServerWs.once('message', () => resolve()),
    );
    fixture.staleWs.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 3,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await staleSubscribeHandled;

    t.mock.timers.enable({ apis: ['setTimeout'] });
    await fixture.closeStaleServerConnection();
    t.mock.timers.tick(10_000);
    const disposalsAfterStaleCleanup = fixture.getDisposeStartedCount();
    t.mock.timers.reset();

    await subscribeToPort(fixture.replacementWs, {
      id: 4,
      deviceId: 'emulator-5554',
      port: 8901,
    });
    t.assert.deepEqual(
      {
        connectCount: fixture.getConnectCount(),
        disposalsAfterStaleCleanup,
      },
      {
        connectCount: 2,
        disposalsAfterStaleCleanup: 1,
      },
    );
  });

  test('does not replace a pre-Register generation whose disposal failed', async (t: TestContext) => {
    const registerCause = new Error('device closed before Register');
    const cleanupCause = new Error('device cleanup failed');
    let connectCount = 0;
    let disposeCount = 0;
    const transport = createFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      disposeError: cleanupCause,
      registerError: registerCause,
      onConnected: () => {
        connectCount += 1;
      },
      onDispose: () => {
        disposeCount += 1;
      },
    });
    const daemon = new DevtoolDaemon([transport]);
    await daemon.start(TEST_PORT + 24);
    t.after(() => daemon.close());
    const ws = await connectWs(TEST_PORT + 24);
    t.after(() => ws.close());
    await performHandshake(ws);

    t.assert.deepEqual(await requestClientList(ws, 60), []);
    t.assert.deepEqual(await requestClientList(ws, 61), []);
    t.assert.equal(connectCount, 1);
    t.assert.equal(disposeCount, 1);
  });

  test('does not reconnect after shutdown starts during retirement', async (t: TestContext) => {
    const { closeGenerations, daemon, releaseDisposal } =
      await createRetiringGenerationFixture(t, TEST_PORT + 25);
    const closing = daemon.close();
    t.assert.equal(daemon.close(), closing);
    await t.assert.rejects(connectWs(TEST_PORT + 25));
    releaseDisposal();
    await closing;
    t.assert.equal(closeGenerations.length, 1);
  });

  test('shutdown retires an in-flight connection before it can send Initialize', async (t: TestContext) => {
    const connectGate = Promise.withResolvers<void>();
    const connectStarted = Promise.withResolvers<void>();
    const disposeGate = Promise.withResolvers<void>();
    const disposalStarted = Promise.withResolvers<void>();
    let disposeCount = 0;
    let initializeCount = 0;
    const daemon = new DevtoolDaemon([
      createFakeTransport({
        deviceId: 'emulator-5554',
        activePorts: [8901],
        connectGate: connectGate.promise,
        disposeGate: disposeGate.promise,
        onConnectStarted: connectStarted.resolve,
        onDisposeStarted() {
          disposeCount += 1;
          disposalStarted.resolve();
        },
        onInitialize: () => {
          initializeCount += 1;
        },
      }),
    ]);
    await daemon.start(TEST_PORT + 26);
    t.after(() => {
      disposeGate.resolve();
      return daemon.close();
    });
    const ws = await connectWs(TEST_PORT + 26);
    await performHandshake(ws);
    ws.send(
      JSON.stringify({
        event: 'Control',
        data: {
          id: 1,
          method: 'subscribe',
          params: { deviceId: 'emulator-5554', port: 8901 },
        },
      }),
    );
    await connectStarted.promise;

    let closeSettled = false;
    const closing = daemon.close().then(() => {
      closeSettled = true;
    });
    connectGate.resolve();
    await disposalStarted.promise;

    t.assert.equal(closeSettled, false);
    t.assert.equal(initializeCount, 0);
    t.assert.equal(disposeCount, 1);

    disposeGate.resolve();
    await closing;
    t.assert.equal(initializeCount, 0);
    t.assert.equal(disposeCount, 1);
  });

  test('concurrent ClientList discovery reuses one in-flight connection per port', async (t: TestContext) => {
    const { transport, getConnectCount } = createCountingFakeTransport({
      deviceId: 'emulator-5554',
      activePorts: [8901],
      connectDelayMs: 100,
      registerDelayMs: 100,
    });
    const daemon = new DevtoolDaemon([transport]);
    await daemon.start(TEST_PORT + 11);
    t.after(() => daemon.close());

    const sockets = await Promise.all([
      connectWs(TEST_PORT + 11),
      connectWs(TEST_PORT + 11),
      connectWs(TEST_PORT + 11),
    ]);
    for (const socket of sockets) {
      t.after(() => socket.close());
    }

    await Promise.all(sockets.map((socket) => performHandshake(socket)));

    const clientLists = await Promise.all(
      sockets.map((socket, index) => requestClientList(socket, index + 1)),
    );

    for (const clientList of clientLists) {
      t.assert.equal(clientList.length, 1);
    }

    t.assert.equal(getConnectCount(), 10);
    t.assert.equal(getConnectCount(8901), 1);
  });
});
