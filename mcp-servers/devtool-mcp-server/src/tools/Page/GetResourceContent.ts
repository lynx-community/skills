// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from "zod";
import { clientId, nodeId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const GetResourceContent = /*#__PURE__*/ defineTool({
  name: "Page_getResourceContent",
  description: "Return the content of a page resource by URL or Lynx node id.",
  schema: {
    clientId,
    sessionId,
    url: z.string().optional().describe("Resource URL returned by Page_getResourceTree."),
    frameId: z.string().optional().describe("Frame id returned by Page_getResourceTree, when present."),
    nodeId: nodeId.optional().describe("Lynx node id for engines that resolve resource content by node."),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    if (!params.url && params.nodeId === undefined) {
      throw new Error("Either url or nodeId is required.");
    }

    const connector = context.connector();
    const cdpParams = Object.fromEntries(
      [
        ["url", params.url],
        ["frameId", params.frameId],
        ["nodeId", params.nodeId],
      ].filter(([, value]) => value !== undefined),
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      "Page.getResourceContent",
      cdpParams,
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
