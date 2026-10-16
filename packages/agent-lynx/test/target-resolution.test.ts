// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type { Client } from '@lynx-js/devtool-connector/transport';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type Context,
  resolveClient,
  resolveClientAndSession,
} from '../src/commands/utils.ts';

test('default target resolution uses discovered clients and the latest session', async (t) => {
  t.mock.method(Connector.prototype, 'listClients', async () => [
    { id: 'desktop:1', info: { App: 'Example' } } as Client,
  ]);
  t.mock.method(
    Connector.prototype,
    'sendListSessionMessage',
    async (clientId: string) => {
      assert.equal(clientId, 'desktop:1');
      return [
        { session_id: 9, type: 'lynx', url: 'lynx://example/page' },
        { session_id: 3, type: 'lynx', url: 'lynx://example/other' },
      ];
    },
  );

  const target = await resolveClientAndSession({ transports: [] }, {});
  assert.equal(target.clientId, 'desktop:1');
  assert.equal(target.sessionId, '9');
});

test('default target resolution reports missing clients and sessions without runtime hints', async (t) => {
  t.mock.method(Connector.prototype, 'listClients', async () => []);
  t.mock.method(Connector.prototype, 'sendListSessionMessage', async () => []);
  await assert.rejects(resolveClient({ transports: [] }, {}), {
    message: 'No available clients found.',
  });
  await assert.rejects(
    resolveClientAndSession({ transports: [] }, { client: 'desktop:1' }),
    {
      message: 'No available sessions found for client: desktop:1',
    },
  );
});

test('a product target resolver stays scoped to its context', async (t) => {
  const context: Context = {
    transports: [],
    targetResolver: {
      async getFirstClient(connector) {
        assert.ok(connector instanceof Connector);
        return 'custom:1';
      },
      async getLatestSession(connector, clientId) {
        assert.ok(connector instanceof Connector);
        assert.equal(clientId, 'custom:1');
        return '42';
      },
    },
  };
  t.mock.method(Connector.prototype, 'listClients', async () => [
    { id: 'desktop:1', info: { App: 'Example' } } as Client,
  ]);

  const custom = await resolveClientAndSession(context, {});
  const standard = await resolveClient({ transports: [] }, {});
  assert.equal(custom.clientId, 'custom:1');
  assert.equal(custom.sessionId, '42');
  assert.equal(standard.clientId, 'desktop:1');
});

test('explicit targets bypass product default resolution', async () => {
  const target = await resolveClientAndSession({
    transports: [],
    targetResolver: {
      async getFirstClient() {
        assert.fail('explicit clients must not be resolved');
      },
      async getLatestSession() {
        assert.fail('explicit sessions must not be resolved');
      },
    },
  }, { client: 'custom:1', session: '7' });
  assert.equal(target.clientId, 'custom:1');
  assert.equal(target.sessionId, '7');
});

test('product target resolution failures propagate without falling back to discovery', async (t) => {
  const failure = new Error('target unavailable');
  t.mock.method(Connector.prototype, 'listClients', async () => {
    assert.fail('must not fall back');
  });
  await assert.rejects(
    resolveClient({
      transports: [],
      targetResolver: {
        async getFirstClient() {
          throw failure;
        },
        async getLatestSession() {
          throw failure;
        },
      },
    }, {}),
    error => error === failure,
  );
});
