// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { Evaluate } from '../../src/tools/Runtime/Evaluate.ts';
import { GetProperties } from '../../src/tools/Runtime/GetProperties.ts';
import { createToolContext } from '../utils/testTool.ts';

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, unknown>;
  isMainThread: boolean;
};

describe('Runtime.evaluate', () => {
  test('injects lynx from the current app on the background VM by default', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
        isMainThread = false,
      ) => {
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params,
          isMainThread,
        });

        assert.strictEqual(method, 'Runtime.evaluate');
        return { result: { type: 'number', value: 4 } };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      Evaluate,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<{ result: { type: string; value: number } }>({
      expression: '2 + 2',
      generatePreview: true,
      objectGroup: 'mcp',
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 1,
        method: 'Runtime.evaluate',
        params: {
          expression:
            '(function(){var __a=globalThis.multiApps&&globalThis.multiApps[globalThis.currentDebugAppId||globalThis.currentAppId];var lynx=__a&&__a.lynx,nativeLynx=lynx&&lynx.getNativeLynx();return(2 + 2);})()',
          generatePreview: true,
          objectGroup: 'mcp',
        },
        isMainThread: false,
      },
    ]);
    assert.deepStrictEqual(result, { result: { type: 'number', value: 4 } });
  });

  test('forwards the original expression on the main VM', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
        isMainThread = false,
      ) => {
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params,
          isMainThread,
        });
        return { result: { type: 'number', value: 4 } };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      Evaluate,
      connector as never,
      'test-client-id:9999',
    );
    await call({ expression: '2 + 2', thread: 'main' });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 1,
        method: 'Runtime.evaluate',
        params: { expression: '2 + 2' },
        isMainThread: true,
      },
    ]);
  });

  for (const [name, runtimeGlobal] of [
    ['multiApps is unavailable', {}],
    [
      'the current app has no lynx object',
      { multiApps: { app: {} }, currentAppId: 'app' },
    ],
  ] as const) {
    test(`evaluates the original expression when ${name}`, async () => {
      const connector = {
        sendCDPMessage: async (
          _clientId: string,
          _sessionId: number,
          method: string,
          params: Record<string, unknown>,
        ) => {
          assert.strictEqual(method, 'Runtime.evaluate');
          const value = runInNewContext(params['expression'] as string, {
            globalThis: runtimeGlobal,
          });
          return { result: { type: typeof value, value } };
        },
        sendListSessionMessage: async () => [{ session_id: 1 }],
      };

      const { call } = createToolContext(
        Evaluate,
        connector as never,
        'test-client-id:9999',
      );
      const result = await call<{ result: { type: string; value: number } }>({
        expression: '2 + 2',
      });

      assert.deepStrictEqual(result, { result: { type: 'number', value: 4 } });
    });
  }
});

describe('Runtime.getProperties', () => {
  test('queries object properties directly on the requested VM thread', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
        isMainThread = false,
      ) => {
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params,
          isMainThread,
        });

        assert.strictEqual(method, 'Runtime.getProperties');
        return {
          result: [{ name: 'answer', value: { type: 'number', value: 42 } }],
        };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      GetProperties,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<{ result: Array<{ name: string }> }>({
      objectId: 'remote-object-id',
      ownProperties: true,
      thread: 'main',
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 1,
        method: 'Runtime.getProperties',
        params: { objectId: 'remote-object-id', ownProperties: true },
        isMainThread: true,
      },
    ]);
    assert.deepStrictEqual(
      result.result.map(({ name }) => name),
      ['answer'],
    );
  });
});
