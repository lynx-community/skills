// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import test from "node:test";
import type { McpContext } from "../src/McpContext.ts";
import { McpResponse } from "../src/McpResponse.ts";

test("McpResponse emits appended text without a generated title", async () => {
  const response = new McpResponse();
  response.appendLines(JSON.stringify({ ok: true }));

  const content = await response.handle("Example_tool", {} as McpContext);

  assert.deepEqual(content, [
    {
      type: "text",
      text: "{\"ok\":true}",
    },
  ]);
});
