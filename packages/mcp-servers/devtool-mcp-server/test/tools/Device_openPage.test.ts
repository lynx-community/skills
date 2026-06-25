// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { ReadableStream, type TransformStream } from 'node:stream/web';
import { describe, test } from 'node:test';
import type { Connector } from '@lynx-js/devtool-connector';
import { OpenPage } from '../../src/tools/Device/OpenPage.ts';
import { createToolContext } from '../utils/testTool.ts';

// Mock connector
const createMockConnector = (overrides = {}) => ({
  sendAppMessage: async () => {},
  sendMessage: async () => {},
  sendListSessionMessage: async () => [{ session_id: 'mock_session' }],
  ...overrides,
});

describe('Device.openPage', () => {
  const testClientId = 'test-client-id';

  test('should send App.openPage message on success', async () => {
    let sentMethod = '';
    let sentParams: unknown = null;

    const mockConnector = createMockConnector({
      sendAppMessage: async (cid: string, method: string, params: unknown) => {
        if (cid === testClientId) {
          sentMethod = method;
          sentParams = params;
        }
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

    assert.strictEqual(sentMethod, 'App.openPage');
    assert.deepStrictEqual(sentParams, { url: 'https://example.com' });
  });

  test('should fallback to Customized event if App.openPage fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sentMessage: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sentPipeline: any = null;

    const mockConnector = createMockConnector({
      sendAppMessage: async () => {
        throw new Error('Failed');
      },
      sendMessage: async (cid: string, message: unknown, pipeline: unknown) => {
        sentMessage = message;
        sentPipeline = pipeline;
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

    assert.ok(sentMessage);
    assert.strictEqual(sentMessage.event, 'Customized');
    assert.strictEqual(sentMessage.data.type, 'OpenCard');
    assert.strictEqual(sentMessage.data.data.type, 'url');
    assert.strictEqual(sentMessage.data.data.url, 'https://example.com');

    assert.strictEqual(sentMessage.data.sender, -1, 'Sender should be -1');
    assert.strictEqual(sentMessage.from, -1, 'From should be -1');

    const sessionList = {
      event: 'Customized',
      data: { type: 'SessionList', data: [{ session_id: 'opened_session' }] },
    };
    const filtered = await Array.fromAsync(
      ReadableStream.from([
        { event: 'Customized', data: { type: 'OpenCard', data: {} } },
        sessionList,
      ]).pipeThrough(sentPipeline.output[0] as TransformStream),
    );
    assert.deepStrictEqual(filtered, [sessionList]);
  });
});
