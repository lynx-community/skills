// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { parseSocketSpec } from '../src/utils/socket_spec.ts';

describe('parseSocketSpec', () => {
  test('uses IPv4 loopback when tcp socket specs omit the host', () => {
    assert.deepEqual(parseSocketSpec('tcp:36445'), {
      host: '127.0.0.1',
      port: 36445,
    });
    assert.deepEqual(parseSocketSpec('tcp::36445'), {
      host: '127.0.0.1',
      port: 36445,
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
  });
});
