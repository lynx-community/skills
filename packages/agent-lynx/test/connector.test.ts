// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DaemonTransport } from '@lynx-js/devtool-connector/transport';
import {
  createDefaultConnector,
  createDefaultTransports,
} from '../src/connector.ts';

describe('programmatic connector defaults', () => {
  test('createDefaultTransports returns only the daemon transport', () => {
    const transports = createDefaultTransports();

    assert.equal(transports.length, 1);
    assert.ok(transports[0] instanceof DaemonTransport);
  });

  test('createDefaultConnector discovers clients through the daemon transport', async (t) => {
    const listClients = t.mock.method(
      DaemonTransport.prototype,
      'listClients',
      async () => [],
    );

    const connector = createDefaultConnector();

    assert.deepEqual(await connector.listClients(), []);
    assert.equal(listClients.mock.callCount(), 1);
  });
});
