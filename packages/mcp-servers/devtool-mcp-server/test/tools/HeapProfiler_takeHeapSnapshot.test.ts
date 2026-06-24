// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ClientId } from "@lynx-js/devtool-connector";
import assert from "node:assert";
import fs from "node:fs/promises";
import { ReadableStream } from "node:stream/web";
import { describe, test } from "node:test";
import { TakeHeapSnapshot } from "../../src/tools/HeapProfiler/TakeHeapSnapshot.ts";
import { createToolContext } from "../utils/testTool.ts";

type ParsedCdpMessage = {
  method?: string;
  params?: {
    chunk?: string;
    finished?: boolean;
  };
  id?: number;
  result?: Record<string, never>;
  sessionId?: string;
};

function createOutputStream(messages: ParsedCdpMessage[]) {
  const stream = ReadableStream.from(messages);
  return Object.assign(stream, {
    async [Symbol.asyncDispose]() {
      try {
        await stream.cancel();
      } catch {
        // ReadableStream may already be closed in tests.
      }
    },
  });
}

async function collectMessages(stream: ReadableStream<unknown>): Promise<unknown[]> {
  const messages: unknown[] = [];

  for await (const message of stream) {
    messages.push(message);
  }

  return messages;
}

const testClientId = ClientId.serialize("test-device", 8901);

const createMockConnector = (buildMessages: (requestId: number) => ParsedCdpMessage[]) => ({
  sendCDPMessage: async () => ({}),
  sendStream: async (_clientId: string, inputStream: ReadableStream<unknown>) => {
    const requests = await collectMessages(inputStream) as Array<{
      data: {
        data: {
          message: {
            method: string;
            id: number;
          };
        };
      };
    }>;

    const request = requests.find((message) => message.data.data.message.method === "HeapProfiler.takeHeapSnapshot");

    assert.ok(request, "Expected HeapProfiler.takeHeapSnapshot request in stream");

    return createOutputStream(buildMessages(request.data.data.message.id));
  },
  sendListSessionMessage: async () => [{ session_id: 1 }],
});

describe("HeapProfiler.takeHeapSnapshot", () => {
  test("preserves chunk order when writing a background snapshot", async () => {
    const firstChunk = "{\"snapshot\":{\"meta\":{},\"node_count\":1,\"edge_count\":0,\"trace_function_count\":0},";
    const secondChunk = "\"nodes\":[],\"edges\":[],\"strings\":[]}";

    const connector = createMockConnector((requestId) => [
      {
        method: "HeapProfiler.reportHeapSnapshotProgress",
        params: { finished: true },
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: firstChunk },
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: secondChunk },
      },
      { id: requestId, result: {} },
    ]);

    const { call } = createToolContext(TakeHeapSnapshot, connector as never, testClientId);
    const result = await call<string>({ thread: "background" });
    const filePath = result.replace("Heap snapshot saved to ", "");

    try {
      const content = await fs.readFile(filePath, "utf8");
      assert.deepStrictEqual(JSON.parse(content), {
        snapshot: {
          meta: {},
          node_count: 1,
          edge_count: 0,
          trace_function_count: 0,
        },
        nodes: [],
        edges: [],
        strings: [],
      });
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  });

  test("streams snapshot chunks to disk without joining them in memory", async () => {
    const firstChunk = "{\"snapshot\":{\"streamed\":true},";
    const secondChunk = "\"strings\":[\"large-snapshot\"]}";

    const connector = createMockConnector((requestId) => [
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: firstChunk },
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: secondChunk },
      },
      { id: requestId, result: {} },
    ]);

    const { call } = createToolContext(TakeHeapSnapshot, connector as never, testClientId);
    const originalJoin = Array.prototype.join;
    let result: string;

    try {
      Array.prototype.join = function patchedJoin(separator?: string) {
        if (Array.isArray(this) && this.some((value) => value === firstChunk || value === secondChunk)) {
          throw new Error("Array.prototype.join should not be used to assemble heap snapshots");
        }

        return originalJoin.call(this, separator);
      } as typeof Array.prototype.join;

      result = await call<string>({ thread: "background" });
    } finally {
      Array.prototype.join = originalJoin;
    }

    const filePath = result.replace("Heap snapshot saved to ", "");

    try {
      const content = await fs.readFile(filePath, "utf8");
      assert.deepStrictEqual(JSON.parse(content), {
        snapshot: { streamed: true },
        strings: ["large-snapshot"],
      });
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  });

  test("ignores chunks from another VM while capturing main-thread snapshot", async () => {
    const backgroundSnapshot = JSON.stringify({ snapshot: { source: "background" } });
    const mainSnapshot = JSON.stringify({ snapshot: { source: "main" } });

    const connector = createMockConnector((requestId) => [
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: backgroundSnapshot },
      },
      {
        method: "HeapProfiler.reportHeapSnapshotProgress",
        params: { finished: true },
        sessionId: "Main",
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: mainSnapshot },
        sessionId: "Main",
      },
      {
        id: requestId,
        result: {},
      },
    ]);

    const { call } = createToolContext(TakeHeapSnapshot, connector as never, testClientId);
    const result = await call<string>({ thread: "main" });
    const filePath = result.replace("Heap snapshot saved to ", "");

    try {
      const content = await fs.readFile(filePath, "utf8");
      assert.deepStrictEqual(JSON.parse(content), JSON.parse(mainSnapshot));
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  });

  test("waits for the matching snapshot response instead of stopping on unrelated ids", async () => {
    const firstChunk = "{\"snapshot\":{\"phase\":\"first\"},";
    const secondChunk = "\"strings\":[\"renderPage\"]}";

    const connector = createMockConnector((requestId) => [
      {
        method: "HeapProfiler.reportHeapSnapshotProgress",
        params: { finished: true },
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: firstChunk },
      },
      {
        id: requestId + 1,
        result: {},
      },
      {
        method: "HeapProfiler.addHeapSnapshotChunk",
        params: { chunk: secondChunk },
      },
      {
        id: requestId,
        result: {},
      },
    ]);

    const { call } = createToolContext(TakeHeapSnapshot, connector as never, testClientId);
    const result = await call<string>({ thread: "background" });
    const filePath = result.replace("Heap snapshot saved to ", "");

    try {
      const content = await fs.readFile(filePath, "utf8");
      assert.deepStrictEqual(JSON.parse(content), {
        snapshot: { phase: "first" },
        strings: ["renderPage"],
      });
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  });
});
