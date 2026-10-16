// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DaemonCommandLifecycle } from '../src/commands/daemon.ts';
import { createProgram } from '../src/devtool.ts';

function createFixture(fetchVersion?: typeof fetch) {
  const starts: number[] = [];
  const stops: number[] = [];
  const output: string[] = [];
  const lifecycle: DaemonCommandLifecycle = {
    async ensureRunning(port) {
      starts.push(port);
      return `ws://127.0.0.1:${port}/devtool/connector`;
    },
    async stop(port) {
      stops.push(port);
    },
  };
  const program = createProgram({
    daemonCommand: {
      ...(fetchVersion ? { fetch: fetchVersion } : {}),
      lifecycle,
      print: line => output.push(line),
    },
    env: {},
  });

  return { output, program, starts, stops };
}

test('daemon start ensures the default daemon is running', async () => {
  const fixture = createFixture();

  await fixture.program.parseAsync(['node', 'test', 'daemon', 'start']);

  assert.deepEqual(fixture.starts, [21783]);
  assert.deepEqual(fixture.stops, []);
  assert.deepEqual(JSON.parse(fixture.output[0] ?? ''), {
    status: 'running',
    port: 21783,
    url: 'ws://127.0.0.1:21783/devtool/connector',
  });
});

test('daemon start accepts an explicit loopback port', async () => {
  const fixture = createFixture();

  await fixture.program.parseAsync([
    'node',
    'test',
    'daemon',
    'start',
    '--port',
    '21800',
  ]);

  assert.deepEqual(fixture.starts, [21800]);
  assert.deepEqual(JSON.parse(fixture.output[0] ?? ''), {
    status: 'running',
    port: 21800,
    url: 'ws://127.0.0.1:21800/devtool/connector',
  });
});

test('daemon stop gracefully stops the selected daemon', async () => {
  const fixture = createFixture();

  await fixture.program.parseAsync([
    'node',
    'test',
    'daemon',
    'stop',
    '--port',
    '21800',
  ]);

  assert.deepEqual(fixture.starts, []);
  assert.deepEqual(fixture.stops, [21800]);
  assert.deepEqual(JSON.parse(fixture.output[0] ?? ''), {
    status: 'stopped',
    port: 21800,
  });
});

test('daemon commands reject invalid ports before invoking the lifecycle', async () => {
  const fixture = createFixture();

  await assert.rejects(
    fixture.program.parseAsync([
      'node',
      'test',
      'daemon',
      'start',
      '--port',
      '70000',
    ]),
    /Invalid --port value/u,
  );

  assert.deepEqual(fixture.starts, []);
  assert.deepEqual(fixture.stops, []);
});

const metadata = {
  product: '@lynx-js/devtool-connector',
  version: '0.15.9',
  lifecycleProtocol: 1,
  commandProtocol: 2,
  browserPreviewProtocol: 3,
  instanceId: 'test-instance',
  startedAt: 1234,
};

test('daemon status reads metadata from the selected port without lifecycle actions', async () => {
  for (const port of [21783, 21800]) {
    const fixture = createFixture(async (input) => {
      assert.equal(input, `http://127.0.0.1:${port}/devtool/connector/version`);
      return Response.json(metadata);
    });
    await fixture.program.parseAsync([
      'node',
      'test',
      'daemon',
      'status',
      '--port',
      String(port),
    ]);
    assert.deepEqual(JSON.parse(fixture.output[0] ?? ''), metadata);
    assert.deepEqual(fixture.starts, []);
    assert.deepEqual(fixture.stops, []);
  }
});

test('daemon status propagates fetch failures without lifecycle actions', async () => {
  const error = new TypeError('fetch failed');
  const fixture = createFixture(async () => {
    throw error;
  });
  await assert.rejects(
    fixture.program.parseAsync(['node', 'test', 'daemon', 'status']),
    error,
  );
  assert.deepEqual(fixture.output, []);
  assert.deepEqual(fixture.starts, []);
  assert.deepEqual(fixture.stops, []);
});

test('daemon status rejects invalid ports before making a request', async () => {
  const fixture = createFixture(async () => {
    assert.fail('must not fetch');
  });
  await assert.rejects(
    fixture.program.parseAsync([
      'node',
      'test',
      'daemon',
      'status',
      '--port',
      '0',
    ]),
    /Invalid --port value/u,
  );
});
