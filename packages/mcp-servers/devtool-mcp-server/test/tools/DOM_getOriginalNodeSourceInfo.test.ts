// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { OriginalNodeSourceInfo } from '@lynx-js/devtool-connector/command';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GetOriginalNodeSourceInfo } from '../../src/tools/DOM/GetOriginalNodeSourceInfo.ts';
import { createToolContext } from '../utils/testTool.ts';

function tool(result: OriginalNodeSourceInfo) {
  const connector = {
    async sendCDPMessage(
      clientId: string,
      sessionId: number,
      method: string,
      params: unknown,
    ) {
      assert.equal(clientId, 'fixture:8901');
      assert.equal(sessionId, 1);
      assert.equal(method, 'DOM.getOriginalNodeSourceInfo');
      assert.deepEqual(params, { nodeId: 13 });
      return result;
    },
    async sendListSessionMessage() {
      return [{ session_id: 1 }];
    },
  };
  return createToolContext(
    GetOriginalNodeSourceInfo,
    connector as never,
    'fixture:8901',
  );
}

test('source info remaps generic debug metadata without product-specific loaders', async t => {
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    assert.equal(String(input), 'https://fixtures.invalid/mapped.json');
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({
      artifacts: [],
      uiSourceMap: {
        version: 1,
        sources: ['src/Example.tsx'],
        mappings: [[0, 32, 5]],
        uiMaps: [1],
      },
      buildInfo: {
        git: {
          commit: 'abc123',
          rootDir: null,
          remoteUrl: 'https://github.com/example/fixture.git',
          commitUrl: null,
        },
      },
    });
  });
  const { call } = tool({
    nodeId: 13,
    tag: 'view',
    nodeIndex: 1,
    debugMetadataUrl: 'https://fixtures.invalid/mapped.json',
  });
  const result = await call<OriginalNodeSourceInfo>({ nodeId: 13 });
  assert.equal(result.status, 'mapped');
  assert.equal(result.source, 'src/Example.tsx');
  assert.equal(result.line, 32);
  assert.equal(result.column, 5);
  assert.equal(result.nodeId, 13);
});

test('source info preserves unsupported runtime data without a metadata fetch', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('unexpected fetch');
  });
  const { call } = tool({ nodeId: 13, nodeIndex: 4, tag: 'view' });
  const result = await call<OriginalNodeSourceInfo>({ nodeId: 13 });
  assert.equal(result.status, 'unsupported');
  assert.equal(result.nodeId, 13);
  assert.equal(fetch.mock.callCount(), 0);
});

test('source info preserves fallback behavior when generic metadata loading fails', async t => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('fixture failure');
  });
  const { call } = tool({
    nodeId: 13,
    nodeIndex: 0,
    debugMetadataUrl: 'https://fixtures.invalid/failure.json',
  });
  const result = await call<OriginalNodeSourceInfo>({ nodeId: 13 });
  assert.equal(result.status, 'unsupported');
  assert.match(result.reason ?? '', /fixture failure/);
  assert.equal(result.nodeId, 13);
});
