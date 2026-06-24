// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";
import { globalSwitchKeySchema } from "./globalSwitch.ts";

export const GetGlobalSwitch = /*#__PURE__*/ defineTool({
  name: "App_getGlobalSwitch",
  description: "Get global switch state for one key.",
  schema: {
    clientId,
    key: globalSwitchKeySchema,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    const value = await connector.getGlobalSwitch(params.clientId, params.key);

    response.appendLines(JSON.stringify({ key: params.key, value }));
  },
});
