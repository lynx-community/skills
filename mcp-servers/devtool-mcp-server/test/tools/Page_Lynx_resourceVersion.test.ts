// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert";
import { describe, test } from "node:test";
import { GetVersion } from "../../src/tools/Lynx/GetVersion.ts";
import { GetResourceContent } from "../../src/tools/Page/GetResourceContent.ts";
import { GetResourceTree } from "../../src/tools/Page/GetResourceTree.ts";
import { createToolContext } from "../utils/testTool.ts";

type SentCDPMessage = {
  clientId: string;
  sessionId: number;
  method: string;
  params?: Record<string, unknown>;
};

describe("Page resource tools", () => {
  test("gets the page resource tree", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, "Page.getResourceTree");
        return { frameTree: { frame: { id: "frame-1", url: "lynx://page" }, resources: [] } };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetResourceTree, connector as never, "test-client-id:9999");
    const result = await call<{ frameTree: { frame: { id: string } } }>({});

    assert.deepStrictEqual(sentMessages, [
      { clientId: "test-client-id:9999", sessionId: 1, method: "Page.getResourceTree", params: {} },
    ]);
    assert.equal(result.frameTree.frame.id, "frame-1");
  });

  test("gets resource content by url and optional frameId", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, "Page.getResourceContent");
        return { content: "<page />", base64Encoded: false };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetResourceContent, connector as never, "test-client-id:9999");
    const result = await call<{ content: string; base64Encoded: boolean }>({
      url: "lynx://page/template.js",
      frameId: "frame-1",
    });

    assert.deepStrictEqual(sentMessages, [
      {
        clientId: "test-client-id:9999",
        sessionId: 1,
        method: "Page.getResourceContent",
        params: { url: "lynx://page/template.js", frameId: "frame-1" },
      },
    ]);
    assert.deepStrictEqual(result, { content: "<page />", base64Encoded: false });
  });

  test("passes nodeId through for Lynx engines that resolve resource content by node", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, "Page.getResourceContent");
        return { content: "<view />", base64Encoded: false };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetResourceContent, connector as never, "test-client-id:9999");
    await call({ nodeId: 10 });

    assert.deepStrictEqual(sentMessages.at(-1), {
      clientId: "test-client-id:9999",
      sessionId: 1,
      method: "Page.getResourceContent",
      params: { nodeId: 10 },
    });
  });
});

describe("Lynx.getVersion", () => {
  test("gets the Lynx engine version", async () => {
    const sentMessages: SentCDPMessage[] = [];
    const connector = {
      sendCDPMessage: async (
        clientId: string,
        sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        assert.strictEqual(method, "Lynx.getVersion");
        return "3.5.0";
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };

    const { call } = createToolContext(GetVersion, connector as never, "test-client-id:9999");
    const result = await call<string>({});

    assert.deepStrictEqual(sentMessages, [
      { clientId: "test-client-id:9999", sessionId: 1, method: "Lynx.getVersion", params: {} },
    ]);
    assert.equal(result, "3.5.0");
  });
});
