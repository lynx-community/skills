// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream, WritableStream } from 'node:stream/web';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { WebSocketServer } from 'ws';
import { DaemonManager } from '../src/daemon/manager.ts';
import { DaemonTransport } from '../src/transport/daemon.ts';
import { wsStreams } from '../src/transport/ws-stream.ts';

test('DaemonTransport listClients sends explicit Control listClients request', async (t) => {
  const server = new WebSocketServer({ port: 0, path: '/devtool/connector' });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  server.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'Initialize', data: 1 }));
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw)) as {
        event?: string;
        data?: { id?: number; method?: string };
      };
      if (msg.event !== 'Control' || msg.data?.method !== 'listClients') {
        return;
      }

      setTimeout(() => {
        ws.send(
          JSON.stringify({
            event: 'ControlResponse',
            data: {
              id: msg.data.id,
              result: [{ id: 'device:8901', info: { App: 'FakeApp' } }],
            },
          }),
        );
      }, 1_200);
    });
  });

  const address = server.address();
  assert(address && typeof address !== 'string');
  t.mock.method(
    DaemonManager,
    'ensureRunning',
    async () => `ws://127.0.0.1:${address.port}/devtool/connector`,
  );

  const transport = new DaemonTransport(address.port);
  const clients = await transport.listClients();

  assert.equal(clients.length, 1);
  assert.equal(clients[0]?.id, 'device:8901');
});

test('DaemonTransport closes daemon connection when subscribe fails', async (t) => {
  const server = new WebSocketServer({ port: 0, path: '/devtool/connector' });
  t.after(() => {
    for (const client of server.clients) {
      client.terminate();
    }
    server.close();
  });

  let resolveClosed: (() => void) | undefined;
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve;
  });

  server.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'Initialize', data: 1 }));
    ws.on('close', () => {
      resolveClosed?.();
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw)) as {
        event?: string;
        data?: { id?: number; method?: string };
      };

      if (msg.event !== 'Control' || msg.data?.method !== 'subscribe') {
        return;
      }

      ws.send(
        JSON.stringify({
          event: 'ControlResponse',
          data: { id: msg.data.id, error: 'device unavailable' },
        }),
      );
    });
  });

  const address = server.address();
  assert(address && typeof address !== 'string');
  t.mock.method(
    DaemonManager,
    'ensureRunning',
    async () => `ws://127.0.0.1:${address.port}/devtool/connector`,
  );

  const transport = new DaemonTransport(address.port);
  await assert.rejects(() =>
    transport.connect({ deviceId: 'device', port: 8901 }),
  );

  await Promise.race([
    closed,
    sleep(500).then(() => {
      throw new Error('Timed out waiting for daemon connection to close');
    }),
  ]);
});

test('DaemonTransport aborts stalled daemon Register writes', async (t) => {
  t.mock.method(
    DaemonManager,
    'ensureRunning',
    async () => 'ws://daemon.test/devtool/connector',
  );

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  let abortCalled = false;

  class HangingWebSocketStream {
    #resolveClosed: (() => void) | undefined;

    opened = Promise.resolve({
      readable: new ReadableStream<string>({
        start(controller) {
          controller.enqueue(JSON.stringify({ event: 'Initialize', data: 1 }));
          controller.close();
        },
      }),
      writable: {
        getWriter() {
          let rejectWrite: ((reason?: unknown) => void) | undefined;

          return {
            write() {
              return new Promise<never>((_, reject) => {
                rejectWrite = reject;
              });
            },
            abort(reason?: unknown) {
              abortCalled = true;
              rejectWrite?.(reason);
              return Promise.resolve();
            },
            releaseLock() {},
          };
        },
      },
    });

    closed = new Promise<void>((resolve) => {
      this.#resolveClosed = resolve;
    });

    close() {
      this.#resolveClosed?.();
    }
  }

  wsStreams.create = (/* url */) => new HangingWebSocketStream() as never;

  const transport = new DaemonTransport(21783);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(
      new DOMException('register write timed out', 'TimeoutError'),
    );
  }, 20);
  t.after(() => {
    clearTimeout(timeout);
  });

  await assert.rejects(
    () =>
      Promise.race([
        transport.connect({
          deviceId: 'device',
          port: 8901,
          signal: controller.signal,
        }),
        sleep(500).then(() => {
          throw new Error(
            'Timed out waiting for stalled Register write to abort',
          );
        }),
      ]),
    (error: unknown) =>
      error instanceof DOMException &&
      error.name === 'TimeoutError' &&
      error.message === 'register write timed out',
  );
  assert.equal(abortCalled, true);
});

test('DaemonTransport writable waits for the websocket write to finish', async (t) => {
  t.mock.method(
    DaemonManager,
    'ensureRunning',
    async () => 'ws://daemon.test/devtool/connector',
  );

  const originalCreate = wsStreams.create;
  t.after(() => {
    wsStreams.create = originalCreate;
  });

  const websocketWrite = deferred<void>();
  const customizedWriteStarted = deferred<void>();
  const websocketClosed = deferred<void>();
  let daemonWriteFinished = false;
  let enqueueReadable: ((chunk: string) => void) | undefined;

  const readable = new ReadableStream<string>({
    start(controller) {
      enqueueReadable = (chunk) => controller.enqueue(chunk);
      controller.enqueue(JSON.stringify({ event: 'Initialize', data: 123 }));
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      const message = JSON.parse(chunk) as {
        event?: string;
        data?: { id?: number; method?: string };
      };
      if (message.event === 'Control' && message.data?.method === 'subscribe') {
        queueMicrotask(() => {
          enqueueReadable?.(
            JSON.stringify({
              event: 'ControlResponse',
              data: { id: message.data?.id, result: null },
            }),
          );
        });
        return Promise.resolve();
      }

      if (message.event === 'Customized') {
        customizedWriteStarted.resolve();
        return websocketWrite.promise;
      }

      return Promise.resolve();
    },
  });

  wsStreams.create = () =>
    ({
      opened: Promise.resolve({ readable, writable }),
      closed: websocketClosed.promise,
      close() {
        websocketWrite.resolve();
        websocketClosed.resolve();
      },
    }) as never;

  const transport = new DaemonTransport(21783);
  await using conn = await transport.connect({
    deviceId: 'device',
    port: 8901,
    signal: AbortSignal.timeout(1_000),
  });

  const writer = conn.writable.getWriter();
  try {
    const writePromise = writer
      .write({
        event: 'Customized',
        data: {
          type: 'ListSession',
          data: {},
        },
      })
      .then(() => {
        daemonWriteFinished = true;
      });

    await customizedWriteStarted.promise;
    await sleep(20);

    assert.equal(daemonWriteFinished, false);

    websocketWrite.resolve();
    await writePromise;

    assert.equal(daemonWriteFinished, true);
  } finally {
    writer.releaseLock();
  }
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
