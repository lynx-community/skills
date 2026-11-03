// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { parseSocketSpec } from '../src/utils/socket_spec.ts';

describe('parseSocketSpec', () => {
  test('uses IPv4 loopback when tcp socket specs give a port only', () => {
    assert.deepEqual(parseSocketSpec('tcp:36445'), {
      host: '127.0.0.1',
      port: 36445,
    });
  });

  test('falls back to the default server port when tcp socket specs omit the port', () => {
    assert.deepEqual(parseSocketSpec('tcp:localhost'), {
      host: 'localhost',
      port: 5037,
    });
    assert.deepEqual(parseSocketSpec('tcp:::1'), {
      host: '::1',
      port: 5037,
    });
  });

  test('preserves explicit tcp hosts', () => {
    assert.deepEqual(parseSocketSpec('tcp:localhost:36445'), {
      host: 'localhost',
      port: 36445,
    });
    assert.deepEqual(parseSocketSpec('tcp:[::1]:36445'), {
      host: '::1',
      port: 36445,
    });
    assert.deepEqual(parseSocketSpec('tcp:10.0.0.1:36445'), {
      host: '10.0.0.1',
      port: 36445,
    });
  });

  test(
    'rejects host-less tcp specs, out-of-range and non-decimal tcp ports',
    () => {
      for (
        const socketSpec of [
          'tcp:',
          'tcp::36445',
          'tcp:0',
          'tcp:99999',
          'tcp:127.0.0.1:70000',
          'tcp:127.0.0.1:36445abc',
          'tcp:[::1]',
        ]
      ) {
        assert.throws(() => parseSocketSpec(socketSpec));
      }
    },
  );

  test('parses unix domain socket specs', () => {
    assert.deepEqual(parseSocketSpec('local:/tmp/adb.sock'), {
      path: '/tmp/adb.sock',
    });
    assert.deepEqual(parseSocketSpec('localfilesystem:/tmp/adb.sock'), {
      path: '/tmp/adb.sock',
    });
    // Linux abstract namespace sockets need a leading null byte.
    assert.deepEqual(parseSocketSpec('localabstract:adb'), { path: '\0adb' });
  });
});
