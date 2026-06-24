// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert";
import { describe, test } from "node:test";
import { GetHeapUsage } from "../../src/tools/Runtime/GetHeapUsage.ts";
import { createToolContext } from "../utils/testTool.ts";

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, never>;
  isMainThread: boolean;
};

describe("Runtime.getHeapUsage", () => {
  test("uses the background VM by default", async () => {
    const sentMessages: SentCDPMessage[] = [];

    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, never>,
        isMainThread = false,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params, isMainThread });

        if (method === "Runtime.enable") {
          return {};
        }

        assert.strictEqual(method, "Runtime.getHeapUsage");
        return { usedSize: 1, totalSize: 2 };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetHeapUsage, connector as never, "test-client-id:9999");
    const result = await call<{ usedSize: number; totalSize: number }>({ thread: "background" });

    assert.deepStrictEqual(sentMessages, [
      { clientId: "test-client-id:9999", sessionId: 1, method: "Runtime.enable", params: {}, isMainThread: false },
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "Runtime.getHeapUsage",
        params: {},
        isMainThread: false,
      },
    ]);
    assert.deepStrictEqual(result, { usedSize: 1, totalSize: 2 });
  });

  test("passes main-thread requests through sendCDPMessage", async () => {
    const sentMessages: SentCDPMessage[] = [];

    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, never>,
        isMainThread = false,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params, isMainThread });

        if (method === "Runtime.enable") {
          return {};
        }

        assert.strictEqual(method, "Runtime.getHeapUsage");
        return { usedSize: 3, totalSize: 5 };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetHeapUsage, connector as never, "test-client-id:9999");
    const result = await call<{ usedSize: number; totalSize: number }>({ thread: "main" });

    assert.deepStrictEqual(sentMessages, [
      { clientId: "test-client-id:9999", sessionId: 1, method: "Runtime.enable", params: {}, isMainThread: true },
      { clientId: "test-client-id:9999", sessionId: 1, method: "Runtime.getHeapUsage", params: {}, isMainThread: true },
    ]);
    assert.deepStrictEqual(result, { usedSize: 3, totalSize: 5 });
  });
});
