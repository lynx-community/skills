// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from "zod";
import { clientId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const Reload = /*#__PURE__*/ defineTool({
  name: "Page_reload",
  description: "Reload the current page.",
  schema: {
    clientId,
    sessionId,
    url: z.string()
      .describe("The URL to reload, if different from the current page. Optional.")
      .optional(),
    ignoreCache: z.boolean()
      .describe("Whether to ignore the cache when reloading the page. Defaults to `true`")
      .default(true),
  },
  annotations: {
    readOnlyHint: false,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    const result = await connector.sendCDPMessage(params.clientId, params.sessionId, "Page.reload", {
      ignoreCache: params.ignoreCache,
      url: params.url,
    });

    response.appendLines(JSON.stringify(result));
  },
});
