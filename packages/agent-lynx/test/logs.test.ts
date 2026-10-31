// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { test, type TestContext } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import {
  InterruptedLogOutputError,
  registerLogsCommand,
} from '../src/commands/logs.ts';

function hsrEvent(message: string) {
  return { method: 'HSR.messageReceived', params: { message } };
}

function harness(t: TestContext, options: string[] = []) {
  const originalWrite = process.stdout.write.bind(process.stdout);
  // A real subscription owns a socket; keep the mock alive while idle timers
  // are unref'ed by the shared short-window reader.
  const keepAlive = setTimeout(() => {}, 5000);
  t.after(() => clearTimeout(keepAlive));
  const output: string[] = [];
  const diagnostics: string[] = [];
  let disposed = 0;
  let cancelled = 0;
  let signal: AbortSignal | undefined;
  let controller!: ReadableStreamDefaultController<unknown>;
  const stream = new ReadableStream<unknown>({
    start(value) {
      controller = value;
    },
    cancel() {
      cancelled++;
    },
  });
  const connected = Promise.withResolvers<void>();
  t.mock.method(
    Connector.prototype,
    'sendCDPStream',
    async (
      clientId: string,
      sessionId: number,
      input: ReadableStream<unknown>,
      options: { signal: AbortSignal; },
    ) => {
      assert.equal(clientId, 'test-device:8901');
      assert.equal(sessionId, -1);
      assert.deepEqual(
        await Array.fromAsync(input),
        [],
        'subscription sends no commands',
      );
      signal = options.signal;
      const abort = () => controller.error(signal?.reason);
      signal.addEventListener('abort', abort, { once: true });
      connected.resolve();
      return Object.assign(stream, {
        async [Symbol.asyncDispose]() {
          disposed++;
          signal?.removeEventListener('abort', abort);
        },
      });
    },
  );
  t.mock.method(
    process.stdout,
    'write',
    (line: string, callback: (error?: Error) => void) => {
      if (typeof line !== 'string') return originalWrite(line, callback);
      output.push(line);
      queueMicrotask(() => callback());
      return false;
    },
  );
  t.mock.method(process.stderr, 'write', (line: string) => {
    diagnostics.push(line);
    return true;
  });
  const counts = ['SIGINT', 'SIGTERM'].map(name => process.listenerCount(name));
  const stdoutCounts = ['error', 'close'].map(name =>
    process.stdout.listenerCount(name)
  );
  const originalSignals = new Set([
    ...process.listeners('SIGINT'),
    ...process.listeners('SIGTERM'),
  ]);
  const originalOutputHandlers = new Set([
    ...process.stdout.listeners('error'),
    ...process.stdout.listeners('close'),
  ]);
  const program = new Command().exitOverride();
  program.configureOutput({ writeErr() {} });
  registerLogsCommand(program, { transports: [] });
  return {
    controller,
    connected: connected.promise,
    output,
    diagnostics,
    program,
    interrupt(signal: 'SIGINT' | 'SIGTERM') {
      // Do not interrupt node:test's own runner when testing CLI handlers.
      for (const listener of process.listeners(signal)) {
        if (!originalSignals.has(listener)) listener();
      }
    },
    outputEvent(event: 'error' | 'close', error?: Error) {
      for (const listener of process.stdout.listeners(event)) {
        if (!originalOutputHandlers.has(listener)) listener(error);
      }
    },
    run: () =>
      program.parseAsync([
        'node',
        'test',
        'logs',
        '--client',
        'test-device:8901',
        ...options,
      ]),
    assertClean() {
      assert.equal(disposed, 1);
      assert.equal(stream.locked, false);
      assert.deepEqual(
        ['SIGINT', 'SIGTERM'].map(name => process.listenerCount(name)),
        counts,
      );
      assert.deepEqual(
        ['error', 'close'].map(name => process.stdout.listenerCount(name)),
        stdoutCounts,
      );
    },
    get cancelled() {
      return cancelled;
    },
  };
}

test('logs follows an observer error after its registration response, preserving structured and opaque events', async (t) => {
  const h = harness(t, ['--follow', '--json', '--limit', '3']);
  const running = h.run();
  await h.connected;
  h.controller.enqueue({ id: 7, result: {} });
  h.controller.enqueue({
    method: 'Runtime.consoleAPICalled',
    params: { type: 'error' },
  });
  h.controller.enqueue({
    method: 'HSR.messageReceived',
    params: { message: 12 },
  });
  await delay(25);
  assert.equal(
    h.output.length,
    0,
    'command results and unrelated events are not logs',
  );
  const payload = {
    version: 1,
    thread: 'ui',
    runtimeId: '4',
    payload: {
      type: 'hsr.error',
      level: 'error',
      message: 'Error: observer failed\n🌍',
      phase: 'interceptor',
    },
  };
  const message = JSON.stringify(payload);
  h.controller.enqueue(hsrEvent(message));
  h.controller.enqueue(hsrEvent('opaque message'));
  h.controller.enqueue(hsrEvent(''));
  await running;
  const records = h.output.map(line =>
    JSON.parse(line) as Record<string, unknown>
  );
  assert.equal(records.length, 3);
  assert.deepEqual(records[0], {
    version: 1,
    source: 'hsr',
    clientId: 'test-device:8901',
    sessionId: -1,
    receivedAt: records[0]?.receivedAt,
    message,
    data: payload,
  });
  assert.equal(typeof records[0]?.receivedAt, 'string');
  assert.equal(records[1]?.message, 'opaque message');
  assert.equal(records[2]?.message, '');
  assert.equal('data' in records[1]!, false);
  assert.ok(
    h.output.every(line => line.split('\n').length === 2),
    'each event occupies one JSONL line',
  );
  assert.match(h.diagnostics.join(''), /Listening for HSR events/);
  assert.equal(h.cancelled, 1);
  h.assertClean();
});

test('logs non-follow captures a short live window and produces JSONL', async (t) => {
  const h = harness(t, ['--json']);
  const running = h.run();
  await h.connected;
  h.controller.enqueue(hsrEvent('null'));
  await running;
  assert.equal(h.output.length, 1);
  assert.equal((JSON.parse(h.output[0]!) as { data: unknown; }).data, null);
  assert.equal(h.cancelled, 1);
  h.assertClean();
});

test('logs formats opaque messages without inventing an error level', async (t) => {
  const h = harness(t, ['--follow', '--limit', '1']);
  const running = h.run();
  await h.connected;
  h.controller.enqueue(hsrEvent('ready'));
  await running;
  assert.match(h.output[0]!, /^\[.+\] \[hsr\] ready\n$/u);
  h.assertClean();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`logs cancels silent waiting on ${signal} and releases listeners`, async (t) => {
    const h = harness(t, ['--follow', '--json']);
    const running = h.run();
    await h.connected;
    h.interrupt(signal);
    await running;
    assert.equal(h.output.length, 0);
    h.assertClean();
  });
}

test('logs propagates source failures after disposing the subscription', async (t) => {
  const h = harness(t, ['--follow']);
  const running = h.run();
  await h.connected;
  h.controller.error(new Error('device disconnected'));
  await assert.rejects(running, /device disconnected/);
  h.assertClean();
});

for (const code of ['EPIPE', 'EIO']) {
  test(`logs handles stdout ${code} and cleans up a blocked read`, async (t) => {
    const h = harness(t, ['--follow']);
    const running = h.run();
    await h.connected;
    const error = Object.assign(new Error('output failed'), { code });
    h.outputEvent('error', error);
    if (code === 'EPIPE') await running;
    else await assert.rejects(running, (actual) => actual === error);
    h.assertClean();
  });
}

test('logs stops when the output pipe closes', async (t) => {
  const h = harness(t, ['--follow']);
  const running = h.run();
  await h.connected;
  h.outputEvent('close');
  await running;
  h.assertClean();
});

test('logs applies stdout backpressure before reading another event', async (t) => {
  const h = harness(t, ['--follow', '--limit', '2']);
  let release!: () => void;
  const writes: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  t.mock.method(
    process.stdout,
    'write',
    (line: string, callback: () => void) => {
      if (typeof line !== 'string') return originalWrite(line, callback);
      writes.push(line);
      release = callback;
      return false;
    },
  );
  const running = h.run();
  await h.connected;
  h.controller.enqueue(hsrEvent('first'));
  h.controller.enqueue(hsrEvent('second'));
  await delay(10);
  assert.equal(writes.length, 1);
  release();
  await delay(10);
  assert.equal(writes.length, 2);
  release();
  await running;
  h.assertClean();
});

test('logs accepts cancellation while stdout is blocked', async (t) => {
  const h = harness(t, ['--follow']);
  let complete!: () => void;
  const originalWrite = process.stdout.write.bind(process.stdout);
  t.mock.method(
    process.stdout,
    'write',
    (line: string, callback: () => void) => {
      if (typeof line !== 'string') return originalWrite(line, callback);
      complete = callback;
      return false;
    },
  );
  const running = h.run();
  await h.connected;
  h.controller.enqueue(hsrEvent('event'));
  await delay(10);
  h.interrupt('SIGINT');
  await assert.rejects(running, InterruptedLogOutputError);
  complete();
  await Promise.resolve();
  await new Promise<void>(resolve => setImmediate(resolve));
  h.assertClean();
});

for (const value of ['0', '-1', '1.5', '1oops', '9007199254740992']) {
  test(`logs rejects invalid limit ${value} before connecting`, async (t) => {
    const h = harness(t, ['--limit', value]);
    await assert.rejects(h.run(), /positive integer/);
  });
}

for (const wrapped of [false, true]) {
  test(`logs cancels connection establishment with ${wrapped ? 'wrapped' : 'direct'} abort errors`, async (t) => {
    const h = harness(t, ['--follow']);
    t.mock.method(Connector.prototype, 'sendCDPStream', async (
      _client: string,
      _session: number,
      _input: unknown,
      { signal }: { signal: AbortSignal; },
    ) =>
      await new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(
            wrapped
              ? new Error('Failed to subscribe', { cause: signal.reason })
              : signal.reason,
          ), {
          once: true,
        });
        queueMicrotask(() => h.interrupt('SIGTERM'));
      }));
    await h.run();
    assert.equal(h.output.length, 0);
  });
}
