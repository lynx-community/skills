// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream } from "node:stream/web";
import { test } from "node:test";
import { TarballCache } from "../src/daemon/tarball-cache.ts";

test("TarballCache propagates response stream failures to waiters", async (t) => {
  const failure = new Error("tarball download interrupted");
  t.mock.method(globalThis, "fetch", async () =>
    new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(failure);
        },
      }),
    ));

  const cache = new TarballCache();
  cache.start("https://example.com/devtool.tar.gz");

  await assert.rejects(
    cache.waitFor("package/static-resources/devtool/lynx/index.html"),
    /tarball download interrupted/,
  );
  assert.equal(cache.isDone, true);
});
