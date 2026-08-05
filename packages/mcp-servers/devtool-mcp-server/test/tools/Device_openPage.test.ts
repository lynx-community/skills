// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import type { Connector } from '@lynx-js/devtool-connector';
import { OpenPage } from '../../src/tools/Device/OpenPage.ts';
import { createToolContext } from '../utils/testTool.ts';

// Mock connector
const createMockConnector = (overrides = {}) => ({
  openPage: async () => {},
  waitForHeadlessReady: async () => {},
  sendListSessionMessage: async () => [{ session_id: 'mock_session' }],
  ...overrides,
});

describe('Device.openPage', () => {
  const testClientId = 'test-client-id';

  test('should call connector.openPage with correct arguments', async () => {
    let calledClientId = '';
    let calledUrl = '';

    const mockConnector = createMockConnector({
      openPage: async (clientId: string, url: string) => {
        calledClientId = clientId;
        calledUrl = url;
      },
    });

    const { call } = createToolContext(
      OpenPage,
      mockConnector as unknown as Connector,
      testClientId,
    );

    await call({
      url: 'https://example.com',
    });

    assert.strictEqual(calledClientId, testClientId);
    assert.strictEqual(calledUrl, 'https://example.com');
  });

  test('should wait for headless runtime before opening page', async () => {
    const callOrder: string[] = [];

    const mockConnector = createMockConnector({
      waitForHeadlessReady: async () => {
        callOrder.push('waitForHeadlessReady');
      },
      openPage: async () => {
        callOrder.push('openPage');
      },
    });

    const headlessClientId = 'headless:test';
    const { call } = createToolContext(
      OpenPage,
      mockConnector as unknown as Connector,
      headlessClientId,
    );

    await call({
      url: 'https://example.com',
    });

    assert.deepStrictEqual(callOrder, ['waitForHeadlessReady', 'openPage']);
  });
});
