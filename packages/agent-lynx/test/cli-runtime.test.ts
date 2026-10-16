// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';

import type { Transport } from '@lynx-js/devtool-connector/transport';
import { createRootCommand, logMonitor, withTelemetry } from '../src/cli.ts';

test('concurrent CLI hosts keep their reporters isolated', async () => {
  const first: number[] = [];
  const second: number[] = [];
  const barrier = Promise.withResolvers<void>();
  await Promise.all([
    withTelemetry(code => {
      first.push(code);
    }, async () => {
      logMonitor(1);
      await barrier.promise;
      logMonitor(2);
    }),
    withTelemetry(code => {
      second.push(code);
    }, async () => {
      logMonitor(3);
      barrier.resolve();
      await setImmediate();
      logMonitor(4);
    }),
  ]);
  logMonitor(5);
  assert.deepEqual(first, [1, 2]);
  assert.deepEqual(second, [3, 4]);
});

test('reporter failures never replace an action result', async () => {
  const result = await withTelemetry(async () => {
    throw new Error('reporter unavailable');
  }, async () => {
    logMonitor(1);
    await setImmediate();
    return 42;
  });
  assert.equal(result, 42);
  assert.equal(
    withTelemetry(() => {
      throw new Error('reporter failure');
    }, () => {
      logMonitor(2);
      return 43;
    }),
    43,
  );
});

test('a custom root reports its action and closes only caller-owned transports', async () => {
  const actionError = new Error('action failed');
  let closed = 0;
  const transport = {
    async close() {
      closed++;
    },
  } as Transport;
  const events: number[] = [];
  const program = createRootCommand({ transports: [transport] }, code => {
    events.push(code);
  });
  program.command('fail').action(() => {
    logMonitor(10);
    throw actionError;
  });
  await assert.rejects(
    program.parseAsync(['node', 'cli', 'fail']),
    error => error === actionError,
  );
  assert.deepEqual(events, [10]);
  assert.equal(closed, 1);
});
