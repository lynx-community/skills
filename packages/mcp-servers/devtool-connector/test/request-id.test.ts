// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { ReadableStream } from "node:stream/web";
import { test } from "node:test";
import { nextRequestId } from "../src/request-id.ts";
import { CDPRequestTransformStream } from "../src/streams/cdp.ts";
import type { CDPRequest, CDPRequestMessage } from "../src/types.ts";

test("CDP streams do not reuse generated request IDs within the former ID space", async () => {
  const ids = new Set<number>();
  const requestCount = 40_001;
  let emitted = 0;
  const requests = new ReadableStream<CDPRequestMessage>({
    pull(controller) {
      if (emitted === requestCount) {
        controller.close();
      } else {
        emitted++;
        controller.enqueue({ method: "Runtime.evaluate" });
      }
    },
  }).pipeThrough(new CDPRequestTransformStream(1));

  for await (const request of requests) {
    const id = (request as CDPRequest).data.data.message.id;
    assert.ok(Number.isInteger(id) && id > 0 && id <= 0x7FFF_FFFF);
    assert.equal(ids.has(id), false, `request ID ${id} was reused`);
    ids.add(id);
  }
  assert.equal(ids.size, requestCount);

  // Connector App/CDP/ListSession calls and streams share the allocator.
  assert.equal(ids.has(nextRequestId()), false);
});

test("CDP streams preserve explicit and fixed request IDs", async () => {
  const requests = new ReadableStream<CDPRequestMessage & { id?: number }>({
    start(controller) {
      controller.enqueue({ method: "Runtime.enable", id: 123 });
      controller.enqueue({ method: "Page.enable" });
      controller.close();
    },
  }).pipeThrough(new CDPRequestTransformStream(1, 456));
  const ids: number[] = [];
  for await (const request of requests) {
    ids.push((request as CDPRequest).data.data.message.id);
  }
  assert.deepEqual(ids, [123, 456]);
});

test("generated request IDs wrap within the native signed 32-bit range", async (t) => {
  const randomInt = t.mock.method(crypto, "randomInt", () => 0x7FFF_FFFE);
  syncBuiltinESMExports();
  t.after(() => {
    randomInt.mock.restore();
    syncBuiltinESMExports();
  });
  const moduleUrl = new URL("../src/request-id.ts?wrap", import.meta.url);
  const { nextRequestId } = await import(moduleUrl.href) as typeof import("../src/request-id.ts");

  assert.deepEqual([nextRequestId(), nextRequestId(), nextRequestId()], [0x7FFF_FFFE, 0x7FFF_FFFF, 1]);
});
