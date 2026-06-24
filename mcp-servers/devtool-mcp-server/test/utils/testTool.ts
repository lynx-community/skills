// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { type Connector } from "@lynx-js/devtool-connector";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { McpContext } from "../../src/McpContext.ts";
import { McpResponse } from "../../src/McpResponse.ts";
import type { ToolDefinition } from "../../src/tools/defineTool.ts";

export function createToolContext<Schema extends z.ZodRawShape>(
  tool: ToolDefinition<Schema>,
  connector: Connector,
  clientId: string,
) {
  const call = async <T = any>(params: Partial<z.infer<z.ZodObject<Schema>>> = {}): Promise<T> => {
    const ctx = new McpContext(connector);
    const resp = new McpResponse();

    // Auto-fill parameters
    const fullParams = { ...params } as any;

    if (tool.schema["clientId"] && !fullParams.clientId) {
      fullParams.clientId = clientId;
    }

    if (tool.schema["sessionId"] && !fullParams.sessionId) {
      try {
        // Auto-fetch session
        const sessions = await connector.sendListSessionMessage(clientId);
        const session = sessions[sessions.length - 1];
        if (session) {
          fullParams.sessionId = session.session_id;
        }
      } catch (e) {
        // Ignore error if session listing fails, maybe tool doesn't strictly need it or will fail gracefully
      }
    }

    await tool.handler(
      { params: fullParams, extra: {} as any },
      resp,
      ctx,
    );

    // Extract result
    const contents = await resp.handle(tool.name, ctx);

    const texts = contents.filter((c): c is TextContent => c.type === "text").map((c) => c.text);
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
