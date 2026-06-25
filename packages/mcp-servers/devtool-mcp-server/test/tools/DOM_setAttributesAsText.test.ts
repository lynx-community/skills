// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { SetAttributesAsText } from '../../src/tools/DOM/SetAttributesAsText.ts';
import { createToolContext } from '../utils/testTool.ts';

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, unknown>;
};

describe('DOM.setAttributesAsText', () => {
  test('passes nodeId, text, and optional name through to CDP', async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, 'DOM.setAttributesAsText');
        return {};
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(
      SetAttributesAsText,
      connector as never,
      'test-client-id:9999',
    );
    const result = await call<Record<string, never>>({
      nodeId: 13,
      text: "style='color: pink;'",
      name: 'style',
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: 'test-client-id:9999',
        sessionId: 1,
        method: 'DOM.setAttributesAsText',
        params: { nodeId: 13, text: "style='color: pink;'", name: 'style' },
      },
    ]);
    assert.deepStrictEqual(result, {});
  });
});
