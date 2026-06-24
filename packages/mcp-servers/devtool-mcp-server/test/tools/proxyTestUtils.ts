// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';

export const testClientId = 'test-client-id';

export const createMockConnector = (
  overrides: Record<string, unknown> = {},
) => ({
  sendMessage: async () => {},
  sendListSessionMessage: async () => [{ session_id: 'mock_session' }],
  ...overrides,
});

export const readRequestMessage = (
  message: unknown,
): Record<string, unknown> => {
  const envelope = message as {
    event?: unknown;
    data?: {
      type?: unknown;
      data?: {
        session_id?: unknown;
        message?: unknown;
      };
    };
  };

  assert.equal(envelope.event, 'Customized');
  assert.equal(envelope.data?.type, 'xdb_msg');
  assert.equal(envelope.data?.data?.session_id, -1);
  const rawMessage = envelope.data?.data?.message;
  assert.equal(typeof rawMessage, 'string');

  return JSON.parse(rawMessage as string) as Record<string, unknown>;
};

export const createRespondingConnector = (
  data: unknown,
  onRequest?: (request: Record<string, unknown>) => void,
) =>
  createMockConnector({
    sendMessage: async (_clientId: string, message: unknown) => {
      const request = readRequestMessage(message);
      onRequest?.(request);
      return {
        type: 'xdb_msg_resp',
        __id: request['__id'],
        data,
      };
    },
  });
