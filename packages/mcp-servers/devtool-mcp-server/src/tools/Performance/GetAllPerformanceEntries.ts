// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const GetAllPerformanceEntries = /*#__PURE__*/ defineTool({
  name: "Performance_getAllPerformanceEntries",
  description: "Get all cached PerformanceEntry objects from the current page.",
  schema: {
    clientId,
    sessionId,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      "Performance.enable",
      {},
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      "Performance.getAllPerformanceEntries",
      {},
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
