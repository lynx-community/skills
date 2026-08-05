// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { GetAllTimingInfo } from '../../src/tools/Performance/GetAllTimingInfo.ts';
import { createToolContext } from '../utils/testTool.ts';

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, never>;
};

describe('Performance.getAllTimingInfo', () => {
  test('reads timing info without enabling Performance first', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, never>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, 'Performance.getAllTimingInfo');
        return { metrics: { fcp: 10 } };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      GetAllTimingInfo,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<{ metrics: { fcp: number } }>({});

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 1,
        method: 'Performance.getAllTimingInfo',
        params: {},
      },
    ]);
    assert.deepStrictEqual(result, { metrics: { fcp: 10 } });
  });
});
