// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { type TestContext, test } from 'node:test';
import { WebSocket, WebSocketServer } from 'ws';
import {
  createWebSocketReadable,
  WsWebSocketStream,
} from '../src/transport/ws-stream.ts';

class FakeWebSocket extends EventEmitter {
  closeCount = 0;
  pauseCount = 0;
  resumeCount = 0;

  close(): void {
    this.closeCount += 1;
  }

  pause(): void {
    this.pauseCount += 1;
  }

  resume(): void {
    this.resumeCount += 1;
  }
}

test('websocket readable ignores events after consumer cancellation', async () => {
  const ws = new FakeWebSocket();
  ws.on('error', () => {});
  const readable = createWebSocketReadable(ws as unknown as WebSocket);
  const reader = readable.getReader();

  try {
    ws.emit('message', 'first');
    assert.equal(ws.pauseCount, 1);
    assert.deepEqual(await reader.read(), { done: false, value: 'first' });
    assert.equal(ws.resumeCount, 1);

    await reader.cancel();

    assert.doesNotThrow(() => {
      ws.emit('message', 'late');
      ws.emit('close', 1011, Buffer.from('late close'));
      ws.emit('error', new Error('late error'));
    });
    assert.equal(ws.closeCount, 1);
  } finally {
    reader.releaseLock();
  }
});

test('1000, 1001, and 1005 websocket closes remain normal EOF', async () => {
  for (const code of [1000, 1001, 1005]) {
    const { closed, readable } = await observeTermination((socket) => {
      if (code === 1005) socket.close();
      else socket.close(code, `close ${code}`);
    });
    assert.deepEqual(readable, {
      status: 'fulfilled',
      value: { done: true, value: undefined },
    });
    assert.deepEqual(closed, { status: 'fulfilled', value: undefined });
  }
});

test('1011 and 1006 websocket closes error readable and closed', async () => {
  const cases = [
    {
      // Keeps multi-byte characters so the `reason.toString('utf8')` decoding
      // in `createWebSocketCloseError` stays covered.
      code: 1011,
      reason: 'RouteRejected: 路由不可用🚫',
      terminate: (socket: WebSocket) =>
        socket.close(1011, 'RouteRejected: 路由不可用🚫'),
    },
    {
      code: 1006,
      reason: '',
      terminate: (socket: WebSocket) => socket.terminate(),
    },
  ];
  for (const { code, reason, terminate } of cases) {
    const { closed, closedAfterDispose, readable } =
      await observeTermination(terminate);
    assert.equal(readable.status, 'rejected');
    assertCloseError(getReason(readable), code, reason);
    assert.equal(closed.status, 'rejected');
    assertCloseError(getReason(closed), code, reason);
    assert.equal(closedAfterDispose.status, 'rejected');
    assert.equal(getReason(closedAfterDispose), getReason(closed));
  }
});

test('websocket readable preserves an error that arrives before close', async () => {
  const ws = new FakeWebSocket();
  const reader = createWebSocketReadable(
    ws as unknown as WebSocket,
  ).getReader();
  const firstCause = new Error('socket failed first');

  ws.emit('error', firstCause);
  ws.emit('close', 1006, Buffer.alloc(0));

  try {
    const outcome = await settle(reader.read());
    assert.equal(outcome.status, 'rejected');
    assert.equal(getReason(outcome), firstCause);
  } finally {
    reader.releaseLock();
  }
});

test('websocket stream preserves a connection error that arrives before 1006', async () => {
  const server = new WebSocketServer({ port: 0 });
  const address = server.address();
  assert(address && typeof address !== 'string');
  await closeServer(server);

  const stream = new WsWebSocketStream(`ws://127.0.0.1:${address.port}`);
  const [opened, closed] = await Promise.all([
    settle(stream.opened),
    settle(stream.closed),
  ]);

  assert.equal(opened.status, 'rejected');
  assert.equal(closed.status, 'rejected');
  assert.equal(getReason(closed), getReason(opened));

  stream.close();
  const closedAfterDispose = await settle(stream.closed);
  assert.equal(closedAfterDispose.status, 'rejected');
  assert.equal(getReason(closedAfterDispose), getReason(closed));
});

const pausedLocalCloseModes = [
  'stream close',
  'writable close',
  'writable abort',
] as const;

for (const closeMode of pausedLocalCloseModes) {
  test(`websocket ${closeMode} completes while its readable is paused`, async (t) => {
    await assertPausedLocalClose(t, closeMode);
  });
}

async function assertPausedLocalClose(
  t: TestContext,
  closeMode: (typeof pausedLocalCloseModes)[number],
): Promise<void> {
  const originalPause = WebSocket.prototype.pause;
  const originalResume = WebSocket.prototype.resume;
  const paused = deferred<void>();
  let resumeCount = 0;
  WebSocket.prototype.pause = function () {
    paused.resolve();
    originalPause.call(this);
  };
  WebSocket.prototype.resume = function () {
    resumeCount += 1;
    originalResume.call(this);
  };
  t.after(() => {
    WebSocket.prototype.pause = originalPause;
    WebSocket.prototype.resume = originalResume;
  });

  const fixture = await openWebSocketFixture();
  const { peerClosed, reader, socket, stream } = fixture;

  try {
    socket.send('queued');
    await paused.promise;
    await withCleanupWatchdog(
      (async () => {
        await sendWebSocketMessage(socket, 'late');
        const closed = settle(stream.closed);
        if (closeMode === 'stream close') {
          stream.close();
        } else {
          const writer = fixture.writable.getWriter();
          try {
            await (closeMode === 'writable close'
              ? writer.close()
              : writer.abort());
          } finally {
            writer.releaseLock();
          }
        }

        assert.equal(resumeCount, 1);
        assert.deepEqual(await closed, {
          status: 'fulfilled',
          value: undefined,
        });
        assert.deepEqual(await peerClosed, { code: 1005, reason: '' });
        assert.deepEqual(await reader.read(), {
          done: false,
          value: 'queued',
        });
        assert.deepEqual(await reader.read(), {
          done: true,
          value: undefined,
        });
      })(),
      () => {
        void reader.cancel().catch(() => {});
        socket.terminate();
      },
    );
  } finally {
    await fixture.dispose();
  }
}

test('websocket stream close is idempotent while its readable is flowing', async () => {
  const fixture = await openWebSocketFixture();
  const { peerClosed, reader, socket, stream } = fixture;

  try {
    const firstRead = reader.read();
    socket.send('flowing');
    assert.deepEqual(await firstRead, { done: false, value: 'flowing' });

    stream.close();
    stream.close();

    await stream.closed;
    assert.deepEqual(await peerClosed, { code: 1005, reason: '' });
    assert.deepEqual(await reader.read(), { done: true, value: undefined });
  } finally {
    await fixture.dispose();
  }
});

async function observeTermination(
  terminate: (socket: WebSocket) => void,
): Promise<{
  closed: Outcome;
  closedAfterDispose: Outcome;
  readable: Outcome;
}> {
  const server = new WebSocketServer({ port: 0 });
  const address = server.address();
  assert(address && typeof address !== 'string');
  server.on('connection', (socket) => setImmediate(() => terminate(socket)));
  const stream = new WsWebSocketStream(`ws://127.0.0.1:${address.port}`);
  const closed = settle(stream.closed);
  const { readable } = await stream.opened;
  const reader = readable.getReader();
  try {
    const result = {
      closed: await closed,
      readable: await settle(reader.read()),
    };
    stream.close();
    return { ...result, closedAfterDispose: await settle(stream.closed) };
  } finally {
    reader.releaseLock();
    await closeServer(server);
  }
}

type Outcome =
  | { status: 'fulfilled'; value: unknown }
  | { status: 'rejected'; reason: unknown };

function settle(promise: PromiseLike<unknown>): Promise<Outcome> {
  return Promise.resolve(promise).then(
    (value) => ({ status: 'fulfilled', value }),
    (reason) => ({ status: 'rejected', reason }),
  );
}

function getReason(outcome: Outcome): unknown {
  assert.equal(outcome.status, 'rejected');
  return outcome.status === 'rejected' ? outcome.reason : undefined;
}

function assertCloseError(error: unknown, code: number, reason: string): void {
  assert(error instanceof Error);
  assert.match(error.message, new RegExp(String(code)));
  if (reason) assert.match(error.message, new RegExp(reason));
  assert.equal((error as Error & { code?: number }).code, code);
  assert.equal((error as Error & { reason?: string }).reason, reason);
}

function closeServer(server: WebSocketServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function openWebSocketFixture() {
  const server = new WebSocketServer({ port: 0 });
  const address = server.address();
  assert(address && typeof address !== 'string');
  const peer = deferred<WebSocket>();
  server.on('connection', (socket) => peer.resolve(socket));

  const stream = new WsWebSocketStream(`ws://127.0.0.1:${address.port}`);
  const { readable, writable } = await stream.opened;
  const socket = await peer.promise;
  const reader = readable.getReader();

  return {
    peerClosed: observePeerClose(socket),
    reader,
    socket,
    stream,
    writable,
    async dispose() {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
      socket.terminate();
      await closeServer(server);
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function observePeerClose(
  socket: WebSocket,
): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    socket.once('close', (code, reason) =>
      resolve({ code, reason: reason.toString('utf8') }),
    );
  });
}

function sendWebSocketMessage(
  socket: WebSocket,
  message: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.send(message, (error) => (error ? reject(error) : resolve()));
  });
}

async function withCleanupWatchdog<T>(
  operation: Promise<T>,
  cleanup: () => void,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const watchdog = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error('Timed out waiting for locally initiated WebSocket close.'),
      );
    }, 5_000);
  });

  try {
    return await Promise.race([operation, watchdog]);
  } finally {
    clearTimeout(timeout);
  }
}
