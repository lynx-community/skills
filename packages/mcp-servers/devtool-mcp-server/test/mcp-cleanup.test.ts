// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { attachMcpServerCleanup } from '../src/utils/mcp_cleanup.ts';

class ClosingTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start(): Promise<void> {
  }

  async send(): Promise<void> {
  }

  async close(): Promise<void> {
    this.onclose?.();
  }
}

describe('attachMcpServerCleanup', () => {
  test('awaits cleanup when the MCP server closes', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '0.0.0' });
    const calls: string[] = [];
    mcpServer.server.onclose = () => {
      calls.push('existing');
    };

    let cleanupFinished = false;
    const waitForCleanup = attachMcpServerCleanup(mcpServer, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      cleanupFinished = true;
      calls.push('cleanup');
    });

    await mcpServer.connect(new ClosingTransport());
    await mcpServer.close();

    assert.equal(cleanupFinished, true);
    assert.deepEqual(calls, ['existing', 'cleanup']);
    await waitForCleanup();
  });

  test('runs cleanup when the MCP transport closes independently', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '0.0.0' });
    let cleanupFinished = false;
    const waitForCleanup = attachMcpServerCleanup(mcpServer, async () => {
      cleanupFinished = true;
    });
    const transport = new ClosingTransport();

    await mcpServer.connect(transport);
    await transport.close();
    await waitForCleanup();

    assert.equal(cleanupFinished, true);
  });
});
