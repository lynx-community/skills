// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream } from "node:stream/web";
import { test } from "node:test";
import zlib from "node:zlib";
import { TarballCache } from "../src/daemon/tarball-cache.ts";

/** A gzipped ustar archive; paths over 100 bytes use the ustar prefix field, as `pnpm pack` does. */
function tarball(files: Record<string, string>): Buffer {
  const blocks = Object.entries(files).flatMap(([file, content]) => {
    const header = Buffer.alloc(512);
    const split = file.length > 100 ? file.lastIndexOf("/", 155) : -1;
    header.write(file.slice(split + 1), 0);
    if (split >= 0) header.write(file.slice(0, split), 345);
    header.write(Buffer.byteLength(content).toString(8).padStart(11, "0"), 124);
    header.write("0", 156);
    const body = Buffer.alloc(Math.ceil(Buffer.byteLength(content) / 512) * 512);
    body.write(content);
    return [header, body];
  });
  return zlib.gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024)]));
}

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

test("TarballCache keeps only the entries under its prefix", async (t) => {
  const longPath = `package/front_end/${"nested/".repeat(15)}module.js`;
  t.mock.method(globalThis, "fetch", async () =>
    new Response(
      new Uint8Array(tarball({
        "package/LICENSE": "BSD",
        "package/front_end/devtools_app.html": "<!doctype html>",
        [longPath]: "export {};",
      })),
    ));

  const cache = new TarballCache("package/front_end/");
  cache.start("https://example.com/devtools-frontend.tgz");

  const entry = await cache.waitFor(longPath);
  assert.equal(entry && zlib.gunzipSync(entry.gzipped).toString(), "export {};");
  assert.ok(await cache.waitFor("package/front_end/devtools_app.html"));
  assert.equal(await cache.waitFor("package/LICENSE"), null);
});
