// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { GetGlobalSwitch } from '../../src/tools/App/GetGlobalSwitch.ts';
import { ListGlobalSwitch } from '../../src/tools/App/ListGlobalSwitch.ts';
import { SetGlobalSwitch } from '../../src/tools/App/SetGlobalSwitch.ts';
import { createToolContext } from '../utils/testTool.ts';

const createMockConnector = (overrides: Record<string, unknown> = {}) => ({
  getGlobalSwitch: async () => false,
  setGlobalSwitch: async () => {},
  sendListSessionMessage: async () => [{ session_id: 'mock_session' }],
  ...overrides,
});

describe('App global switch tools', () => {
  const testClientId = 'test-client-id';

  test('App_getGlobalSwitch should read one key', async () => {
    let called: { clientId: string; key: string } | null = null;
    const mockConnector = createMockConnector({
      getGlobalSwitch: async (clientId: string, key: string) => {
        called = { clientId, key };
        return true;
      },
    });

    const { call } = createToolContext(
      GetGlobalSwitch,
      mockConnector as never,
      testClientId,
    );
    const result = await call<{ key: string; value: boolean }>({
      key: 'enable_devtool',
    });

    assert.deepStrictEqual(called, {
      clientId: testClientId,
      key: 'enable_devtool',
    });
    assert.deepStrictEqual(result, { key: 'enable_devtool', value: true });
  });

  test('App_setGlobalSwitch should write one key', async () => {
    let called: { clientId: string; key: string; value: boolean } | null = null;
    const mockConnector = createMockConnector({
      setGlobalSwitch: async (
        clientId: string,
        key: string,
        value: boolean,
      ) => {
        called = { clientId, key, value };
      },
    });

    const { call } = createToolContext(
      SetGlobalSwitch,
      mockConnector as never,
      testClientId,
    );
    const result = await call<{ key: string; value: boolean }>({
      key: 'enable_devtool',
      switch: false,
    });

    assert.deepStrictEqual(called, {
      clientId: testClientId,
      key: 'enable_devtool',
      value: false,
    });
    assert.deepStrictEqual(result, { key: 'enable_devtool', value: false });
  });

  test('App_listGlobalSwitch should return all key states', async () => {
    const mockConnector = createMockConnector({
      getGlobalSwitch: async (_clientId: string, key: string) =>
        key !== 'enable_logbox',
    });

    const { call } = createToolContext(
      ListGlobalSwitch,
      mockConnector as never,
      testClientId,
    );
    const result = await call<{
      switches: Array<{ key: string; value?: boolean; error?: string }>;
    }>({});

    assert.equal(result.switches.length, 15);
    assert.deepStrictEqual(
      result.switches.find((item) => item.key === 'enable_devtool'),
      { key: 'enable_devtool', value: true },
    );
    assert.deepStrictEqual(
      result.switches.find((item) => item.key === 'enable_logbox'),
      { key: 'enable_logbox', value: false },
    );
  });

  test('App_listGlobalSwitch should keep per-key failure', async () => {
    const mockConnector = createMockConnector({
      getGlobalSwitch: async (_clientId: string, key: string) => {
        if (key === 'enable_v8') {
          throw new Error('transport timeout');
        }

        return true;
      },
    });

    const { call } = createToolContext(
      ListGlobalSwitch,
      mockConnector as never,
      testClientId,
    );
    const result = await call<{
      switches: Array<{ key: string; value?: boolean; error?: string }>;
    }>({});
    const failed = result.switches.find((item) => item.key === 'enable_v8');

    assert.equal(typeof failed?.error, 'string');
  });
});
