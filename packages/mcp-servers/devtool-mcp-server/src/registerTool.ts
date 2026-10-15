// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type { Transport } from '@lynx-js/devtool-connector/transport';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type * as z from 'zod';
import { McpContext } from './McpContext.ts';
import { McpResponse } from './McpResponse.ts';
import type { Context, ToolDefinition } from './tools/defineTool.ts';

export type ToolContextFactory<ToolContext extends Context> = () => Promise<
  ToolContext
>;

export type ToolRegistrar = Pick<McpServer, 'registerTool'>;

/** Register a tool while allowing a distribution to supply its own context. */
export function registerToolWithContext<
  Schema extends z.ZodRawShape,
  ToolContext extends Context,
>(
  mcpServer: ToolRegistrar,
  tool: ToolDefinition<Schema, ToolContext>,
  createContext: ToolContextFactory<ToolContext>,
): void;
export function registerToolWithContext<ToolContext extends Context>(
  mcpServer: ToolRegistrar,
  tool: ToolDefinition<z.ZodRawShape, ToolContext>,
  createContext: ToolContextFactory<ToolContext>,
): void {
  if (!tool.schema) {
    throw new Error('Tool schema is required');
  }
  mcpServer.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.schema,
      annotations: tool.annotations,
    },
    async (params, extra): Promise<CallToolResult> => {
      const response = new McpResponse();
      const context = await createContext();
      try {
        await tool.handler({ params, extra }, response, context);
        const content = await response.handle(tool.name, context);
        return { content };
      } catch (error) {
        const errorText = error instanceof Error
          ? error.message
          : String(error);
        return {
          isError: true,
          content: [{ type: 'text', text: errorText }],
        };
      }
    },
  );
}

export function registerTool(
  mcpServer: McpServer,
  tool: ToolDefinition,
  transports: Transport[],
): void {
  registerToolWithContext(
    mcpServer,
    tool,
    () => McpContext.withConnector(new Connector(transports)),
  );
}
