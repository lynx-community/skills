// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { GetAllMemoryUsage } from '../../src/tools/Memory/GetAllMemoryUsage.ts';
import { createToolContext } from '../utils/testTool.ts';

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, unknown>;
};

describe('Memory.getAllMemoryUsage', () => {
  test('uses the global DevTool session by default', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });

        assert.strictEqual(method, 'Memory.getAllMemoryUsage');
        return {
          collectionStatus: 'completed',
          totalBytes: 1024,
          instances: [],
        };
      },
      sendListSessionMessage: async () => {
        throw new Error(
          'Memory.getAllMemoryUsage should not require a LynxView session',
        );
      },
    };

    const { call } = createToolContext(
      GetAllMemoryUsage,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<{
      collectionStatus: string;
      totalBytes: number;
      instances: unknown[];
    }>({
      timeoutMs: 50_000,
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: -1,
        method: 'Memory.getAllMemoryUsage',
        params: { timeoutMs: 50_000 },
      },
    ]);
    assert.deepStrictEqual(result, {
      collectionStatus: 'completed',
      totalBytes: 1024,
      instances: [],
    });
  });

  test('supports explicit session override', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });

        assert.strictEqual(method, 'Memory.getAllMemoryUsage');
        return {
          collectionStatus: 'timeout',
          totalBytes: 2048,
          instances: [],
        };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      GetAllMemoryUsage,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<{
      collectionStatus: string;
      totalBytes: number;
      instances: unknown[];
    }>({
      sessionId: 7,
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 7,
        method: 'Memory.getAllMemoryUsage',
        params: {},
      },
    ]);
    assert.deepStrictEqual(result, {
      collectionStatus: 'timeout',
      totalBytes: 2048,
      instances: [],
    });
  });
});
