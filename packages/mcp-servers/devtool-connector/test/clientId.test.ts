// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TestContext } from 'node:test';
import { describe, test } from 'node:test';
import { ClientId } from '../src/index.ts';

describe('ClientId', () => {
  describe('serialize', () => {
    test('returns deviceId:port format', (t: TestContext) => {
      const serialized = ClientId.serialize('device-001', 9000);

      t.assert.equal(serialized, 'device-001:9000');
    });

    test('URL encodes deviceId', (t: TestContext) => {
      const serialized = ClientId.serialize('设备 001/测试', 9100);

      t.assert.equal(
        serialized,
        '%E8%AE%BE%E5%A4%87%20001%2F%E6%B5%8B%E8%AF%95:9100',
      );
    });

    test('encodes colon inside deviceId', (t: TestContext) => {
      const serialized = ClientId.serialize('foo:bar', 9200);

      t.assert.equal(serialized, 'foo%3Abar:9200');
    });
  });

  describe('deserialize', () => {
    test('parses previously serialized value', (t: TestContext) => {
      const result = ClientId.deserialize('device-001:9000');

      t.assert.deepStrictEqual(result, { deviceId: 'device-001', port: 9000 });
    });

    test('uses the last colon when multiple are present', (t: TestContext) => {
      const result = ClientId.deserialize('foo:bar:1234');

      t.assert.deepStrictEqual(result, { deviceId: 'foo:bar', port: 1234 });
    });

    test('returns null when no colon exists', (t: TestContext) => {
      const result = ClientId.deserialize('foobar');

      t.assert.equal(result, null);
    });

    test('returns null when port cannot be parsed', (t: TestContext) => {
      const result = ClientId.deserialize('foo:port');

      t.assert.equal(result, null);
    });

    test('returns null when decodeURIComponent throws', (t: TestContext) => {
      const result = ClientId.deserialize('%E0%A4%:1234');

      t.assert.equal(result, null);
    });

    test('decodes colon inside deviceId', (t: TestContext) => {
      const result = ClientId.deserialize('foo%3Abar:9300');

      t.assert.deepStrictEqual(result, { deviceId: 'foo:bar', port: 9300 });
    });
  });
});
