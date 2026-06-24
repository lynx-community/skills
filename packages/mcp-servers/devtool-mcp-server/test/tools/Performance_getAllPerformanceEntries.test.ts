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
  params: Record<string, never>;
};

async function loadGetAllPerformanceEntriesTool() {
  const module = await import("../../src/tools/Performance/GetAllPerformanceEntries.ts").catch(() => undefined);

  assert.ok(
    module && "GetAllPerformanceEntries" in module,
    "Expected Performance GetAllPerformanceEntries tool module to exist",
  );

  return module.GetAllPerformanceEntries;
}

describe("Performance.getAllPerformanceEntries", () => {
  test("enables Performance before reading all entries", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, never>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });

        if (method === "Performance.enable") {
          return {};
        }

        assert.strictEqual(method, "Performance.getAllPerformanceEntries");
        return {
          entries: [
            {
              entryType: "metric",
              name: "testMetric",
              startTime: 1.5,
              instanceId: 100,
            },
          ],
        };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };
    const GetAllPerformanceEntries = await loadGetAllPerformanceEntriesTool();

    const { call } = createToolContext(GetAllPerformanceEntries, connector as never, "test-client-id:9999");
    const result = await call<{
      entries: Array<{ entryType: string; name: string; startTime: number; instanceId: number }>;
    }>({});

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "Performance.enable",
        params: {},
      },
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "Performance.getAllPerformanceEntries",
        params: {},
      },
    ]);
    assert.deepStrictEqual(result, {
      entries: [
        {
          entryType: "metric",
          name: "testMetric",
          startTime: 1.5,
          instanceId: 100,
        },
      ],
    });
  });
});
