// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert";
import { describe, test } from "node:test";
import { GetLynxUITree } from "../../src/tools/UITree/GetLynxUITree.ts";
import { createToolContext } from "../utils/testTool.ts";

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params?: Record<string, unknown>;
};

describe("UITree.getLynxUITree", () => {
  test("enables UITree without compression before reading native UI metadata", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });

        if (method === "UITree.enable") {
          return {};
        }

        assert.strictEqual(method, "UITree.getLynxUITree");
        return {
          root: {
            name: "com.lynx.tasm.behavior.ui.LynxUI",
            id: 3,
            tagName: "view",
            nodeIndex: 2,
            props: { id: "card" },
            label: "Card",
            frame: [0, 0, 100, 40],
            children: [],
          },
          compress: false,
        };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetLynxUITree, connector as never, "test-client-id:9999");
    const result = await call<{
      root: {
        tagName: string;
        nodeIndex: number;
        props: Record<string, unknown>;
        label: string;
      };
      compress: boolean;
    }>({});

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "UITree.enable",
        params: { useCompression: false },
      },
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "UITree.getLynxUITree",
        params: undefined,
      },
    ]);
    assert.deepStrictEqual(result.root, {
      name: "com.lynx.tasm.behavior.ui.LynxUI",
      id: 3,
      tagName: "view",
      nodeIndex: 2,
      props: { id: "card" },
      label: "Card",
      frame: [0, 0, 100, 40],
      children: [],
    });
    assert.strictEqual(result.compress, false);
  });
});
