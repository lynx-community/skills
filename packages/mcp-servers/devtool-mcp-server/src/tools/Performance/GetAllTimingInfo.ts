// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const GetAllTimingInfo = /*#__PURE__*/ defineTool({
  name: "Performance_getAllTimingInfo",
  description: "Get all metric time durations(FR3 / PPE / FCP ..etc)",
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
      "Performance.getAllTimingInfo",
      {},
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
