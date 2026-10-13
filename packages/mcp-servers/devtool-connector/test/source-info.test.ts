// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { DebugMetadataAsset } from "@lynx-js/debug-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { remapOriginalNodeSourceInfo } from "../src/command/source-info.ts";

function metadata(line = 12): DebugMetadataAsset {
  return {
    artifacts: [],
    uiSourceMap: { version: 1, sources: ["src/page.tsx"], mappings: [[0, line, 4]], uiMaps: [8] },
    buildInfo: {},
  };
}

const info = { nodeId: 42, tag: "view", nodeIndex: 8, debugMetadataUrl: "https://example.org/metadata.json" };

test("source-info shares concurrent loads, remaps the node and preserves CDP fields", async () => {
  let calls = 0;
  const load = async () => {
    calls++;
    return metadata();
  };
  const [first, second] = await Promise.all([
    remapOriginalNodeSourceInfo(info, load),
    remapOriginalNodeSourceInfo(info, load),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first, {
    ...info,
    repo: null,
    source: "src/page.tsx",
    line: 12,
    column: 4,
    status: "mapped",
    reason: null,
  });
  assert.deepEqual(second, first);
  assert.equal(info.nodeId, 42);
});

test("metadata caches are isolated by loader even for the same URL", async () => {
  const first = await remapOriginalNodeSourceInfo(info, async () => metadata(1));
  const second = await remapOriginalNodeSourceInfo(info, async () => metadata(2));
  assert.equal(first.line, 1);
  assert.equal(second.line, 2);
});

test("failed metadata loads are evicted and retried", async () => {
  let calls = 0;
  const load = async () => {
    if (++calls === 1) throw new Error("temporary metadata failure");
    return metadata();
  };
  const first = await remapOriginalNodeSourceInfo(info, load);
  assert.equal(first.status, "unsupported");
  assert.match(first.reason ?? "", /temporary metadata failure/);
  assert.equal((await remapOriginalNodeSourceInfo(info, load)).status, "mapped");
  assert.equal(calls, 2);
});

test("missing inputs never load, and missing wrapper mappings remain runtime-only", async () => {
  let calls = 0;
  const load = async () => {
    calls++;
    return metadata();
  };
  assert.equal((await remapOriginalNodeSourceInfo({ nodeId: 1 }, load)).status, "unsupported");
  assert.equal(calls, 0);
  assert.equal(
    (await remapOriginalNodeSourceInfo({ ...info, nodeIndex: 9, tag: "wrapper" }, load)).status,
    "runtime_only",
  );
  assert.equal((await remapOriginalNodeSourceInfo({ ...info, nodeIndex: 9 }, load)).status, "unsupported");
});
