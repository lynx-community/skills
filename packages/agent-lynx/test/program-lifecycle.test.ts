// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  iOSTransport,
} from '@lynx-js/devtool-connector/transport';
import { createProgram } from '../src/devtool.ts';

test('default mode closes only the daemon transport after an action failure', async (t) => {
  const actionError = new Error('action failed');
  const closed = trackCloses(t, { daemonError: new Error('cleanup failed') });
  const program = createProgram({ env: {} });
  program.command('fail-action').action(() => {
    throw actionError;
  });

  const rejection = await program
    .parseAsync(['node', 'test', 'fail-action'])
    .then(
      () => assert.fail('expected action failure'),
      (error: unknown) => error,
    );

  assert.strictEqual(rejection, actionError);
  assert.deepEqual(closed, zeroCloses({ daemon: 1 }));
});

test('--no-daemon closes every direct transport without creating a daemon transport', async (t) => {
  const actionError = new Error('action failed');
  const closed = trackCloses(t, { androidError: new Error('cleanup failed') });
  const program = createProgram({ env: {} });
  program.command('fail-action').action(() => {
    throw actionError;
  });

  const rejection = await program
    .parseAsync(['node', 'test', 'fail-action', '--no-daemon'])
    .then(
      () => assert.fail('expected action failure'),
      (error: unknown) => error,
    );

  assert.strictEqual(rejection, actionError);
  assert.deepEqual(closed, directCloses());
});

test('daemon mode warns when direct transport environment is ignored', async (t) => {
  let stderr = '';
  t.mock.method(process.stderr, 'write', (chunk: unknown) => {
    stderr += String(chunk);
    return true;
  });
  const closed = trackCloses(t);
  const program = createProgram({
    env: {
      ADB_SERVER_HOST: '10.0.0.1',
      ADB_SERVER_PORT: '5038',
    },
  });
  program.command('succeed').action(() => undefined);

  await program.parseAsync(['node', 'test', 'succeed']);

  assert.equal(
    stderr,
    'Warning: ADB_SERVER_HOST, ADB_SERVER_PORT are ignored in daemon mode. Pass --no-daemon to apply direct transport configuration.\n',
  );
  assert.deepEqual(closed, zeroCloses({ daemon: 1 }));
});

test('direct mode consumes transport environment without warning', async (t) => {
  let stderr = '';
  t.mock.method(process.stderr, 'write', (chunk: unknown) => {
    stderr += String(chunk);
    return true;
  });
  const closed = trackCloses(t);
  const program = createProgram({
    env: {
      ADB_SERVER_HOST: '127.0.0.1',
      ADB_SERVER_PORT: '5038',
    },
  });
  program.command('succeed').action(() => undefined);

  await program.parseAsync(['node', 'test', '--no-daemon', 'succeed']);

  assert.equal(stderr, '');
  assert.deepEqual(closed, directCloses());
});

test('closes the daemon transport when a later preAction fails', async (t) => {
  const preActionError = new Error('preAction failed');
  const closed = trackCloses(t);
  const program = createProgram({ env: {} });
  program.hook('preAction', () => {
    throw preActionError;
  });
  program
    .command('fail-pre-action')
    .action(() => assert.fail('action must not run'));

  const rejection = await program
    .parseAsync(['node', 'test', 'fail-pre-action'])
    .then(
      () => assert.fail('expected preAction failure'),
      (error: unknown) => error,
    );

  assert.strictEqual(rejection, preActionError);
  assert.deepEqual(closed, zeroCloses({ daemon: 1 }));
});

test('does not turn a successful action into a cleanup failure', async (t) => {
  const closed = trackCloses(t, { androidError: new Error('cleanup failed') });
  const program = createProgram({ env: {} });
  program.command('succeed').action(() => undefined);

  await program.parseAsync(['node', 'test', '--no-daemon', 'succeed']);

  assert.deepEqual(closed, directCloses());
});

test('skill discovery does not create any connector transport', async (t) => {
  const closed = trackCloses(t);
  t.mock.method(console, 'log', () => undefined);
  const program = createProgram({ env: {} });

  await program.parseAsync(['node', 'test', 'skills', 'list']);

  assert.deepEqual(closed, zeroCloses());
});

interface CloseCounts {
  android: number;
  daemon: number;
  desktop: number;
  ios: number;
}

function zeroCloses(overrides: Partial<CloseCounts> = {}): CloseCounts {
  return { android: 0, daemon: 0, desktop: 0, ios: 0, ...overrides };
}

function directCloses(): CloseCounts {
  return { android: 1, daemon: 0, desktop: 1, ios: 1 };
}

function trackCloses(
  t: TestContext,
  {
    androidError,
    daemonError,
  }: { androidError?: Error; daemonError?: Error } = {},
) {
  const closed = zeroCloses();
  t.mock.method(AndroidTransport.prototype, 'close', async () => {
    closed.android += 1;
    if (androidError) throw androidError;
  });
  t.mock.method(DaemonTransport.prototype, 'close', async () => {
    closed.daemon += 1;
    if (daemonError) throw daemonError;
  });
  t.mock.method(DesktopTransport.prototype, 'close', async () => {
    closed.desktop += 1;
  });
  t.mock.method(iOSTransport.prototype, 'close', async () => {
    closed.ios += 1;
  });
  return closed;
}
