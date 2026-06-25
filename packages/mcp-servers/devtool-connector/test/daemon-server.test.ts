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
import { DevtoolDaemon } from '../src/daemon/server.ts';
import type {
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
  activePorts: number[];
  silentPorts?: number[];
  registerDelayMs?: number;
  registerDelayMsByPort?: Record<number, number>;
  connectDelayMs?: number;
  onMessage?: (message: unknown, options: TransportConnectOptions) => void;
}): Transport {
  const {
    deviceId,
    activePorts,
    silentPorts = [],
    registerDelayMs = 0,
    registerDelayMsByPort = {},
    connectDelayMs = 0,
    onMessage,
  } = opts;

  return {
    async close() {},
    async listDevices() {
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

      // In-memory pipe: what the connector writes → device reads → device writes → connector reads
      const { readable: toDevice, writable: toDeviceWritable } =
        new TransformStream<TInput>();
      const { readable: fromDevice, writable: fromDeviceWritable } =
        new TransformStream<TOutput>();
      const fromDeviceWriter = fromDeviceWritable.getWriter();

      // Process incoming messages from the connector
      void (async () => {
        try {
          for await (const msg of toDevice) {
            onMessage?.(msg, options);
            const parsed = msg as Record<string, unknown>;
            if (parsed['event'] === 'Initialize') {
              if (silentPorts.includes(options.port)) {
                continue;
              }

              const delayMs =
                registerDelayMsByPort[options.port] ?? registerDelayMs;
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
              // Echo back any other message
              await fromDeviceWriter.write(msg as unknown as TOutput);
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
  activePorts: number[];
  registerDelayMs?: number;
  connectDelayMs?: number;
}): {
  transport: Transport;
  getConnectCount: (port?: number) => number;
} {
  const connectCounts = new Map<number, number>();
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
    // Start collecting messages immediately, before "open" fires
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
): Promise<{
  body: T;
  headers: http.IncomingHttpHeaders;
  statusCode: number;
}> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { host: '127.0.0.1', method, path, port },
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
    request.end();
  });
}

async function subscribeToPort(
  ws: WebSocket & { inbox: unknown[] },
  params: { id: number; deviceId: string; port: number },
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

    const response = await requestJson<{ version?: string }>(
      TEST_PORT + 14,
      '/devtool/connector/version',
    );
    const contentType = response.headers['content-type'];

    t.assert.equal(response.statusCode, 200);
    t.assert.match(
      Array.isArray(contentType) ? contentType.join(',') : (contentType ?? ''),
      /application\/json/,
    );
    assert.deepStrictEqual(response.body, { version: packageJson.version });
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

    const response = await requestJson<{ ok?: boolean }>(
      TEST_PORT + 15,
      '/devtool/connector/shutdown',
      'POST',
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
          return await new Promise<Connection<TOutput, TInput>>(() => {});
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
