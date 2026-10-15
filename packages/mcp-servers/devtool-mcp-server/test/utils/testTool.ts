// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { type Connector } from '@lynx-js/devtool-connector';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';
import { McpContext } from '../../src/McpContext.ts';
import { McpResponse } from '../../src/McpResponse.ts';
import type { Request, ToolDefinition } from '../../src/tools/defineTool.ts';

export function createToolContext<Schema extends z.ZodRawShape>(
  tool: ToolDefinition<Schema>,
  connector: Connector,
  clientId: string,
  defaultSessionId?: number,
) {
  const call = async <T = unknown>(
    params: Partial<z.infer<z.ZodObject<Schema>>> = {},
  ): Promise<T> => {
    const ctx = new McpContext(connector);
    const resp = new McpResponse();

    // Auto-fill parameters
    const fullParams: Record<string, unknown> = { ...params };

    if (tool.schema['clientId'] && !fullParams['clientId']) {
      fullParams['clientId'] = clientId;
    }

    const sessionSchema = tool.schema['sessionId'];
    const requiresSession = sessionSchema !== undefined
      && !z.safeParse(sessionSchema, undefined).success;

    if (
      sessionSchema && fullParams['sessionId'] == null
      && defaultSessionId !== undefined
    ) {
      fullParams['sessionId'] = defaultSessionId;
    }

    if (requiresSession && fullParams['sessionId'] == null) {
      const sessions = await connector.sendListSessionMessage(clientId);
      const session = sessions[sessions.length - 1];
      if (!session) {
        throw new Error(
          `No session found for required sessionId (tool: ${tool.name}, clientId: ${clientId})`,
        );
      }
      fullParams['sessionId'] = session.session_id;
    }

    await tool.handler(
      {
        params: fullParams as Request<Schema>['params'],
        extra: {
          signal: new AbortController().signal,
          requestId: 'unit-test',
          sendNotification: async () => {},
          sendRequest: async () => {
            throw new Error('Unexpected server request in tool unit test');
          },
        },
      },
      resp,
      ctx,
    );

    // Extract result
    const contents = await resp.handle(tool.name, ctx);

    const texts = contents.filter((c): c is TextContent => c.type === 'text')
      .map((c) => c.text);
    if (texts.length === 1 && texts[0]) {
      try {
        return JSON.parse(texts[0]) as T;
      } catch {
        return texts[0] as unknown as T;
      }
    }

    return contents as unknown as T;
  };

  return { call };
}
