// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import type { SocketConnectOpts } from 'node:net';
import { test } from 'node:test';

import { getAndroidTransportSpec } from '../src/program.ts';

test('Android transport uses the standard adb address and port', () => {
  assert.deepEqual(getAndroidTransportSpec({}), {
    host: '127.0.0.1',
    port: 5037,
  });
  assert.deepEqual(
    getAndroidTransportSpec({
      ANDROID_ADB_SERVER_ADDRESS: '::1',
      ANDROID_ADB_SERVER_PORT: '5038',
    }),
    { host: '::1', port: 5038 },
  );
  assert.deepEqual(getAndroidTransportSpec({ ANDROID_ADB_SERVER_PORT: '' }), {
    host: '127.0.0.1',
    port: 5037,
  });
});

test('standard adb variables override the deprecated aliases independently', () => {
  assert.deepEqual(
    getAndroidTransportSpec({
      ANDROID_ADB_SERVER_ADDRESS: 'native.example',
      ANDROID_ADB_SERVER_PORT: '5038',
      ADB_SERVER_HOST: 'legacy.example',
      ADB_SERVER_PORT: '5039',
    }),
    { host: 'native.example', port: 5038 },
  );
  assert.deepEqual(
    getAndroidTransportSpec({
      ADB_SERVER_HOST: 'legacy.example',
      ADB_SERVER_PORT: '5039',
    }),
    {
      host: 'legacy.example',
      port: 5039,
    },
  );
  assert.deepEqual(
    getAndroidTransportSpec({
      ANDROID_ADB_SERVER_ADDRESS: 'native.example',
      ADB_SERVER_PORT: '5039',
    }),
    {
      host: 'native.example',
      port: 5039,
    },
  );
  assert.deepEqual(
    getAndroidTransportSpec({
      ADB_SERVER_HOST: 'legacy.example',
      ANDROID_ADB_SERVER_PORT: '5038',
    }),
    {
      host: 'legacy.example',
      port: 5038,
    },
  );
});

test('adb server socket takes precedence over all address and port variables', () => {
  const cases: readonly [string, SocketConnectOpts][] = [
    ['tcp:5038', { host: 'localhost', port: 5038 }],
    ['tcp:adb.example:5038', { host: 'adb.example', port: 5038 }],
    ['tcp:[::1]:5038', { host: '::1', port: 5038 }],
    ['localfilesystem:/tmp/adb.sock', { path: '/tmp/adb.sock' }],
  ];
  for (const [socket, expected] of cases) {
    if (process.platform === 'win32' && socket.startsWith('localfilesystem:')) {
      continue;
    }
    assert.deepEqual(
      getAndroidTransportSpec({
        ADB_SERVER_SOCKET: socket,
        ANDROID_ADB_SERVER_ADDRESS: 'ignored.example',
        ANDROID_ADB_SERVER_PORT: 'invalid',
        ADB_SERVER_HOST: 'ignored.example',
        ADB_SERVER_PORT: 'invalid',
      }),
      expected,
    );
  }
});

test('invalid standard adb ports and socket specifications fail instead of connecting to the default server', () => {
  for (
    const port of ['0', '-1', '65536', '1.5', '5037junk', ' 5038 ', '0x10']
  ) {
    assert.throws(
      () => getAndroidTransportSpec({ ANDROID_ADB_SERVER_PORT: port }),
      /ANDROID_ADB_SERVER_PORT/u,
    );
  }
  for (const socket of ['', ' ', 'tcp:localhost:invalid', 'unknown:5037']) {
    assert.throws(() => getAndroidTransportSpec({ ADB_SERVER_SOCKET: socket }));
  }
});
