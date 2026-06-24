// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const GetLynxUITree = /*#__PURE__*/ defineTool({
  name: "UITree_getLynxUITree",
  description:
    "Get the rendered Lynx UI tree with native UI metadata. The metadata fields tagName, nodeIndex, props, and label require Lynx 4.0 or newer.",
  schema: {
    clientId,
    sessionId,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params: { clientId, sessionId } }, response, context) {
    const connector = context.connector();

    await connector.sendCDPMessage(clientId, sessionId, "UITree.enable", {
      useCompression: false,
    });

    const result = await connector.sendCDPMessage(clientId, sessionId, "UITree.getLynxUITree");

    response.appendLines(JSON.stringify(result));
  },
});
