// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface McpServerCleanupTarget {
  server: Pick<McpServer['server'], 'onclose'>;
  close: McpServer['close'];
}

export function attachMcpServerCleanup(
  mcpServer: McpServerCleanupTarget,
  cleanup: () => Promise<void> | void,
): () => Promise<void> {
  const previousOnClose = mcpServer.server.onclose;
  const close = mcpServer.close.bind(mcpServer);
  let cleanupPromise: Promise<void> | undefined;

  const startCleanup = () => {
    if (!cleanupPromise) {
      cleanupPromise = Promise.resolve().then(cleanup);
      void cleanupPromise.catch((error: unknown) => {
        console.error('Failed to clean up MCP server resource:', error);
      });
    }

    return cleanupPromise;
  };

  mcpServer.server.onclose = () => {
    try {
      previousOnClose?.();
    } finally {
      startCleanup();
    }
  };

  mcpServer.close = async () => {
    try {
      await close();
    } finally {
      await startCleanup();
    }
  };

  return () => cleanupPromise ?? Promise.resolve();
}
