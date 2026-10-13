// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import test from "node:test";
import { Connector, type HeadlessPrepareState } from "../src/index.ts";

test("waitForHeadlessReady keeps polling through transient preparation errors", async (t) => {
  const connector = new Connector([]);
  const states: HeadlessPrepareState[] = [
    { status: "preparing" },
    { status: "error", message: "download interrupted" },
    { status: "ready" },
  ];
  let calls = 0;
  t.mock.method(connector, "prepareHeadless", async () => {
    calls += 1;
    return states.shift() ?? { status: "ready" };
  });

  await connector.waitForHeadlessReady("headless:0", { timeoutMs: 1_000, pollIntervalMs: 0 });

  assert.equal(calls, 3);
});

test("waitForHeadlessReady stops when its ActionCore request is aborted", async (t) => {
  const connector = new Connector([]);
  const controller = new AbortController();
  const reason = new Error("HTTP command client disconnected");
  t.mock.method(connector, "prepareHeadless", async () => {
    controller.abort(reason);
    return { status: "preparing" as const };
  });

  await assert.rejects(
    connector.waitForHeadlessReady("headless:0", {
      timeoutMs: 1_000,
      pollIntervalMs: 100,
      signal: controller.signal,
    }),
    error => error === reason,
  );
});
