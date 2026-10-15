// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { describe, test } from 'node:test';
import * as z from 'zod';
import { defineTool } from '../../src/tools/defineTool.ts';
import { createToolContext } from './testTool.ts';

function createTool(sessionId: z.ZodNumber | z.ZodOptional<z.ZodNumber>) {
  return defineTool({
    name: 'Test_sessionTool',
    description: 'Test session resolution.',
    schema: { sessionId },
    annotations: { readOnlyHint: true },
    async handler({ params }, response) {
      response.appendLines(JSON.stringify({ sessionId: params.sessionId }));
    },
  });
}

function createConnector(
  sendListSessionMessage: () => Promise<Array<{ session_id: number; }>>,
) {
  return { sendListSessionMessage } as never;
}

describe('createToolContext session resolution', () => {
  test('propagates required-session discovery errors', async () => {
    const discoveryError = new Error('list sessions failed');
    const { call } = createToolContext(
      createTool(z.number()),
      createConnector(async () => {
        throw discoveryError;
      }),
      'public-client',
    );

    await assert.rejects(call(), error => error === discoveryError);
  });

  test('throws contextual error for empty required-session discovery', async () => {
    const { call } = createToolContext(
      createTool(z.number()),
      createConnector(async () => []),
      'public-client',
    );

    await assert.rejects(
      call(),
      /No session found.*Test_sessionTool.*public-client/,
    );
  });

  test('does not discover an optional session', async () => {
    let discoveryCalls = 0;
    const { call } = createToolContext(
      createTool(z.number().optional()),
      createConnector(async () => {
        discoveryCalls += 1;
        return [];
      }),
      'public-client',
    );

    assert.deepEqual(await call(), {});
    assert.equal(discoveryCalls, 0);
  });

  test('prefers explicit session over default and default over discovery', async () => {
    let discoveryCalls = 0;
    const { call } = createToolContext(
      createTool(z.number()),
      createConnector(async () => {
        discoveryCalls += 1;
        return [{ session_id: 30 }];
      }),
      'public-client',
      20,
    );

    assert.deepEqual(await call({ sessionId: 10 }), { sessionId: 10 });
    assert.deepEqual(await call(), { sessionId: 20 });
    assert.equal(discoveryCalls, 0);
  });
});
