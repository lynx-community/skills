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

async function loadDescribeNodeTool() {
  const module = await import("../../src/tools/DOM/DescribeNode.ts").catch(() => undefined);

  assert.ok(module && "DescribeNode" in module, "Expected DOM DescribeNode tool module to exist");

  return module.DescribeNode;
}

describe("DOM.describeNode", () => {
  test("disables compression before describing a node by nodeId", async () => {
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

        assert.strictEqual(method, "DOM.describeNode");
        return { node: { nodeId: 7, nodeName: "view" }, compress: false };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };
    const DescribeNode = await loadDescribeNodeTool();

    const { call } = createToolContext(DescribeNode, connector as never, "test-client-id:9999");
    const result = await call<{ node: { nodeId: number; nodeName: string }; compress: boolean }>({
      nodeId: 7,
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
        method: "DOM.describeNode",
        params: { nodeId: 7, backendNodeId: undefined, depth: undefined, pierce: undefined },
      },
    ]);
    assert.deepStrictEqual(result, { node: { nodeId: 7, nodeName: "view" }, compress: false });
  });

  test("passes backendNodeId, depth, and pierce through to CDP", async () => {
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

        assert.strictEqual(method, "DOM.describeNode");
        return { node: { backendNodeId: 9, childNodeCount: 1 }, compress: false };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };
    const DescribeNode = await loadDescribeNodeTool();

    const { call } = createToolContext(DescribeNode, connector as never, "test-client-id:9999");
    const result = await call<{ node: { backendNodeId: number; childNodeCount: number }; compress: boolean }>({
      backendNodeId: 9,
      depth: -1,
      pierce: true,
    });

    assert.deepStrictEqual(sentMessages.at(-1), {
      clientId: "test-client-id:9999",
      sessionId: 1,
      method: "DOM.describeNode",
      params: { nodeId: undefined, backendNodeId: 9, depth: -1, pierce: true },
    });
    assert.deepStrictEqual(result, { node: { backendNodeId: 9, childNodeCount: 1 }, compress: false });
  });

  test("preserves Lynx depth semantics in returned nodes", async () => {
    const connector = {
      sendCDPMessage: async (
        _clientId: string,
        _sessionId: number,
        method: string,
        params?: Record<string, unknown>,
      ) => {
        if (method === "DOM.enable") {
          return {};
        }

        assert.strictEqual(method, "DOM.describeNode");

        if (params?.depth === 0) {
          return { node: { nodeId: 3, childNodeCount: 1 }, compress: false };
        }

        return {
          node: {
            nodeId: 3,
            childNodeCount: 1,
            children: [{ nodeId: 4, childNodeCount: 1 }],
          },
          compress: false,
        };
      },
      sendListSessionMessage: async () => [{ session_id: 1 }],
    };
    const DescribeNode = await loadDescribeNodeTool();

    const { call } = createToolContext(DescribeNode, connector as never, "test-client-id:9999");
    const depthZero = await call<{ node: { nodeId: number; childNodeCount: number; children?: unknown[] } }>({
      nodeId: 3,
      depth: 0,
    });
    const depthOne = await call<{ node: { nodeId: number; children?: Array<{ children?: unknown[] }> } }>({
      nodeId: 3,
      depth: 1,
    });

    assert.deepStrictEqual(depthZero.node, { nodeId: 3, childNodeCount: 1 });
    assert.equal(depthOne.node.children?.length, 1);
    assert.equal(depthOne.node.children?.[0]?.children, undefined);
  });
});
