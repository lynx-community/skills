// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import assert from 'node:assert/strict';
import { syncBuiltinESMExports } from 'node:module';
import { ReadableStream } from 'node:stream/web';
import { test, type TestContext } from 'node:test';
import { registerGetSourcesCommand } from '../src/commands/get-sources.ts';

const scripts = [
  { scriptId: '1', url: 'app-service.js' },
  { scriptId: '2', url: 'file://fixture/backgroundbundle.js' },
];
const parsed = (index: number) => ({
  method: 'Debugger.scriptParsed',
  params: scripts[index],
});
async function flush(): Promise<void> {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}

function fixture(t: TestContext, mode?: string) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.timers.reset();
    syncBuiltinESMExports();
  });
  let controller!: ReadableStreamDefaultController<unknown>;
  let cancelled = 0;
  let disposed = 0;
  const stream = new ReadableStream({
    start(value) {
      controller = value;
    },
    cancel() {
      cancelled++;
    },
  });
  let requests: Array<{ id?: number; method: string; }> = [];
  t.mock.method(
    Connector.prototype,
    'sendCDPStream',
    async (
      _client: string,
      _session: number,
      input: ReadableStream<{ id?: number; method: string; }>,
    ) => {
      requests = await Array.fromAsync(input);
      return Object.assign(stream, {
        async [Symbol.asyncDispose]() {
          disposed++;
        },
      });
    },
  );
  const output: string[] = [];
  t.mock.method(console, 'log', (line: string) => output.push(line));
  const program = new Command().exitOverride();
  program.configureOutput({ writeErr() {} });
  registerGetSourcesCommand(program, { transports: [] });
  const done = program.parseAsync([
    'node',
    'test',
    'get-sources',
    '--client',
    'device:8901',
    '--session',
    '7',
    ...(mode ? ['--completion-mode', mode] : []),
  ]);
  // Keep the original rejection available to assertions without a late unhandled rejection.
  void done.catch(() => {});
  return {
    done,
    output,
    stream,
    send: (value: unknown) => controller.enqueue(value),
    close: () => controller.close(),
    requests: () => requests,
    checkCleanup() {
      assert.equal(disposed, 1);
      assert.equal(stream.locked, false);
      assert.equal(cancelled, 1);
    },
  };
}

test('default idle sends only disable/enable and keeps the two-second idle window', async t => {
  const f = fixture(t);
  await flush();
  assert.deepEqual(f.requests(), [{ method: 'Debugger.disable' }, {
    method: 'Debugger.enable',
  }]);
  f.send(parsed(0));
  f.send(parsed(1));
  await flush();
  t.mock.timers.tick(1999);
  await flush();
  assert.deepEqual(f.output, []);
  t.mock.timers.tick(1);
  await f.done;
  assert.equal(f.output[0], JSON.stringify(scripts, null, 2));
  f.checkCleanup();
});

test('barrier completes only on its matching successful ack after scripts', async t => {
  const f = fixture(t, 'barrier');
  await flush();
  const requests = f.requests();
  assert.equal(requests.length, 3);
  const id = requests[2]?.id;
  assert.equal(typeof id, 'number');
  assert.equal(requests[2]?.method, 'Debugger.enable');
  f.send(parsed(0));
  f.send({ id: Number(id) + 1, result: {} });
  await flush();
  assert.deepEqual(f.output, []);
  f.send(parsed(1));
  f.send({ id, result: {} });
  await f.done;
  assert.deepEqual(JSON.parse(f.output[0]!), scripts);
  assert.equal(Date.now(), 1000);
  f.checkCleanup();
});

for (const kind of ['early', 'error', 'missing-result', 'missing', 'empty']) {
  test(`barrier ${kind} falls back to the original idle timeout`, async t => {
    const f = fixture(t, 'barrier');
    await flush();
    const id = f.requests()[2]?.id;
    if (kind === 'early') f.send({ id, result: {} });
    if (kind !== 'empty') f.send(parsed(0));
    if (kind === 'error') {
      f.send({ id, result: {}, error: { message: 'unsupported' } });
    }
    if (kind === 'missing-result') f.send({ id });
    if (kind === 'empty') f.send({ id, result: {} });
    await flush();
    assert.deepEqual(f.output, []);
    t.mock.timers.tick(2000);
    await f.done;
    assert.deepEqual(
      JSON.parse(f.output[0]!),
      kind === 'empty' ? [] : [scripts[0]],
    );
    f.checkCleanup();
  });
}

test('unrelated traffic cannot extend the five-second hard deadline', async t => {
  const f = fixture(t, 'barrier');
  await flush();
  f.send(parsed(0));
  await flush();
  for (let i = 0; i < 5; i++) {
    t.mock.timers.tick(1000);
    if (i < 4) f.send({ method: 'Runtime.consoleAPICalled', params: {} });
    await flush();
  }
  await f.done;
  assert.deepEqual(JSON.parse(f.output[0]!), [scripts[0]]);
  f.checkCleanup();
});

test('natural completion preserves script order and duplicates', async t => {
  const f = fixture(t, 'idle');
  await flush();
  f.send(parsed(1));
  f.send(parsed(0));
  f.send(parsed(1));
  f.close();
  await f.done;
  assert.deepEqual(JSON.parse(f.output[0]!), [
    scripts[1],
    scripts[0],
    scripts[1],
  ]);
  assert.equal(f.stream.locked, false);
});

test('invalid completion modes are rejected before contacting the connector', async t => {
  const f = fixture(t, 'unknown');
  await assert.rejects(f.done, { code: 'commander.invalidArgument' });
  assert.deepEqual(f.requests(), []);
});
