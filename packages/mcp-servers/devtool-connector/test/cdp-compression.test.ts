// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import zlib from "node:zlib";
import { buildSnapshotStructure, type DomNode } from "../src/command/snapshot.ts";
import type { Connector } from "../src/index.ts";
import { decompressCDPResult } from "../src/streams/cdp.ts";

function deflateBase64(value: unknown): string {
  return zlib.deflateSync(Buffer.from(JSON.stringify(value), "utf8")).toString("base64");
}

describe("CDP response decompression", () => {
  test("decompresses DOM.getDocument root when compress is true", async () => {
    const root = {
      nodeId: 1,
      nodeName: "#document",
      children: [{ nodeId: 2, localName: "page" }],
    };

    const result = await decompressCDPResult("DOM.getDocument", {
      compress: true,
      root: deflateBase64(root),
    });

    assert.deepEqual(result, {
      compress: false,
      root,
    });
  });

  test("decompresses DOM.getDocumentWithBoxModel root when compress is true", async () => {
    const root = {
      nodeId: 1,
      localName: "page",
      box_model: { content: [0, 0, 300, 0, 300, 500, 0, 500] },
    };

    const result = await decompressCDPResult("DOM.getDocumentWithBoxModel", {
      compress: true,
      root: deflateBase64(root),
    });

    assert.deepEqual(result, {
      compress: false,
      root,
    });
  });

  test("decompresses DOM.describeNode node when compress is true", async () => {
    const node = {
      nodeId: 42,
      backendNodeId: 42,
      nodeName: "view",
      childNodeCount: 2,
    };

    const result = await decompressCDPResult("DOM.describeNode", {
      compress: true,
      node: deflateBase64(node),
    });

    assert.deepEqual(result, {
      compress: false,
      node,
    });
  });

  test("decompresses UITree.getLynxUITree root when compress is true", async () => {
    const root = {
      name: "com.lynx.tasm.behavior.ui.LynxUI",
      id: 1,
      tagName: "page",
      frame: [0, 0, 390, 844],
      children: [],
    };

    const result = await decompressCDPResult("UITree.getLynxUITree", {
      compress: true,
      root: deflateBase64(root),
    });

    assert.deepEqual(result, {
      compress: false,
      root,
    });
  });

  test("passes uncompressed responses through unchanged", async () => {
    const domResult = { compress: false, root: { nodeId: 1, nodeName: "#document" } };
    assert.strictEqual(await decompressCDPResult("DOM.getDocument", domResult), domResult);

    const standardCdp = { root: { nodeId: 1, nodeName: "#document" } };
    assert.strictEqual(await decompressCDPResult("DOM.getDocument", standardCdp), standardCdp);

    const emptyDescribe = {};
    assert.strictEqual(await decompressCDPResult("DOM.describeNode", emptyDescribe), emptyDescribe);

    const nullUiTree = { compress: false, root: null };
    assert.strictEqual(await decompressCDPResult("UITree.getLynxUITree", nullUiTree), nullUiTree);

    const unrelated = { compress: true, root: "not-compressed-for-this-method" };
    assert.strictEqual(await decompressCDPResult("Runtime.evaluate", unrelated), unrelated);
  });

  test("throws a clear error when a compressed payload is malformed", async () => {
    await assert.rejects(
      () =>
        decompressCDPResult("DOM.getDocument", {
          compress: true,
          root: Buffer.from("not-valid-zlib").toString("base64"),
        }),
      /Failed to decompress DOM\.getDocument response/,
    );
  });

  test("buildSnapshotStructure enables compression and handles both compressed and uncompressed trees", async () => {
    const tree: DomNode = {
      nodeId: 1,
      localName: "page",
      box_model: { content: [0, 0, 300, 0, 300, 500, 0, 500] },
      children: [
        {
          nodeId: 2,
          localName: "text",
          attributes: ["text", "Hello"],
          box_model: { content: [10, 20, 110, 20, 110, 50, 10, 50] },
        },
      ],
    };

    for (const compressed of [true, false]) {
      const calls: Array<{ method: string; params: unknown }> = [];
      const connector = {
        async sendCDPMessage(_clientId: string, _sessionId: number, method: string, params?: unknown) {
          calls.push({ method, params });
          if (method === "DOM.enable") return {};
          if (method === "DOM.getDocumentWithBoxModel") {
            return compressed
              ? { compress: true, root: deflateBase64(tree) }
              : { compress: false, root: tree };
          }
          throw new Error(`Unexpected method: ${method}`);
        },
      } as unknown as Connector;

      const snapshot = await buildSnapshotStructure(connector, "client-1", 1);
      assert.deepEqual(calls[0], {
        method: "DOM.enable",
        params: { useCompression: true },
      });
      assert.equal(snapshot.refs.length, 1);
      assert.equal(snapshot.refs[0]?.text, "Hello");
    }
  });
});
