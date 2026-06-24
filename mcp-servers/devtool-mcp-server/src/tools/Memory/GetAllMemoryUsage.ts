// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from "zod";
import { clientId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

const GLOBAL_CDP_SESSION_ID = -1;
const MAX_MEMORY_USAGE_TIMEOUT_MS = 300_000;

const globalSessionId = z
  .number()
  .int()
  .optional()
  .describe(
    "CDP session ID. Defaults to -1 for the global DevTool handler. Override only for platform-specific routing.",
  );

const timeoutMs = z
  .number()
  .int()
  .min(0)
  .max(MAX_MEMORY_USAGE_TIMEOUT_MS)
  .optional()
  .describe(
    `Optional query timeout in milliseconds. Must be between 0 and ${MAX_MEMORY_USAGE_TIMEOUT_MS}.`,
  );

export const GetAllMemoryUsage = /*#__PURE__*/ defineTool({
  name: "Memory_getAllMemoryUsage",
  description: "Get global Lynx-attributed memory usage across live registered Lynx instances.",
  schema: {
    clientId,
    sessionId: globalSessionId,
    timeoutMs,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    const requestParams = params.timeoutMs === undefined ? {} : { timeoutMs: params.timeoutMs };

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId ?? GLOBAL_CDP_SESSION_ID,
      "Memory.getAllMemoryUsage",
      requestParams,
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
