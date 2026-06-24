// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from "zod";
import { clientId, nodeId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const SetAttributesAsText = /*#__PURE__*/ defineTool({
  name: "DOM_setAttributesAsText",
  description: "Set node attributes from a text representation.",
  schema: {
    clientId,
    sessionId,
    nodeId,
    text: z.string().describe("Attribute text, for example `style='color: pink;'`."),
    name: z.string().optional().describe("Optional attribute name to replace."),
  },
  annotations: {
    readOnlyHint: false,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    const cdpParams = Object.fromEntries(
      [
        ["nodeId", params.nodeId],
        ["text", params.text],
        ["name", params.name],
      ].filter(([, value]) => value !== undefined),
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      "DOM.setAttributesAsText",
      cdpParams,
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
