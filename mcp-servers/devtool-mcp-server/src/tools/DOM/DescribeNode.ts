// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { backendNodeId, clientId, depth, nodeId, pierce, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const DescribeNode = /*#__PURE__*/ defineTool({
  name: "DOM_describeNode",
  description: "Describe a DOM node, optionally including descendants.",
  schema: {
    clientId,
    sessionId,
    nodeId: nodeId.optional(),
    backendNodeId: backendNodeId.optional(),
    depth,
    pierce,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params: { clientId, sessionId, nodeId, backendNodeId, depth, pierce } }, response, context) {
    const connector = context.connector();

    await connector.sendCDPMessage(clientId, sessionId, "DOM.enable", {
      useCompression: false,
    });

    const result = await connector.sendCDPMessage(clientId, sessionId, "DOM.describeNode", {
      nodeId,
      backendNodeId,
      depth,
      pierce,
    });

    response.appendLines(JSON.stringify(result));
  },
});
