// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert";
import { describe, test } from "node:test";
import { createToolContext } from "../utils/testTool.ts";

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params?: Record<string, unknown>;
};

describe("DOM.getDocument", () => {
  test("disables compression and passes depth through to CDP", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });

        if (method === "DOM.enable") {
          return {};
        }

        assert.strictEqual(method, "DOM.getDocument");
        return { root: { nodeId: 1, nodeName: "#document", childNodeCount: 1 } };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };
    const { GetDocument } = await import("../../src/tools/DOM/GetDocument.ts");

    const { call } = createToolContext(GetDocument, connector as never, "test-client-id:9999");
    const result = await call<{ root: { nodeId: number; nodeName: string; childNodeCount: number } }>({
      depth: -1,
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "DOM.enable",
        params: { useCompression: false },
      },
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "DOM.getDocument",
        params: { depth: -1 },
      },
    ]);
    assert.deepStrictEqual(result, { root: { nodeId: 1, nodeName: "#document", childNodeCount: 1 } });
  });
});
