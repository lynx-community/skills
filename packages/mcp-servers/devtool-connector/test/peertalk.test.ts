// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { test } from "node:test";
import { encodePeertalkMessage, PeertalkToMessageTransformStream } from "../src/transport/peertalk.ts";

async function decodeFragments(fragments: Iterable<Uint8Array>): Promise<unknown[]> {
  const transform = new PeertalkToMessageTransformStream();
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  const messages: unknown[] = [];
  const output = (async () => {
    for (;;) {
      const result = await reader.read();
      if (result.done) return;
      messages.push(result.value);
    }
  })();

  try {
    for (const fragment of fragments) await writer.write(fragment);
    await writer.close();
    await output;
    return messages;
  } finally {
    reader.releaseLock();
  }
}

test("Peertalk decoder preserves messages across arbitrary fragment boundaries", async () => {
  const encoded = [
    encodePeertalkMessage({ method: "first", params: { value: 1 } }),
    encodePeertalkMessage({ method: "second", params: { value: 2 } }),
  ].reduce((combined, message) => {
    const result = new Uint8Array(combined.length + message.length);
    result.set(combined);
    result.set(message, combined.length);
    return result;
  }, new Uint8Array(0));
  const fragmentSizes = [0, 1, 7, 12, 19, 20, 3, 41];
  const fragments: Uint8Array[] = [];
  let offset = 0;
  for (const size of fragmentSizes) {
    const end = Math.min(offset + size, encoded.length);
    fragments.push(encoded.subarray(offset, end));
    offset = end;
  }
  if (offset < encoded.length) fragments.push(encoded.subarray(offset));

  assert.deepEqual(await decodeFragments(fragments), [
    { method: "first", params: { value: 1 } },
    { method: "second", params: { value: 2 } },
  ]);
});

test("Peertalk decoder handles a multi-megabyte fragmented message", async () => {
  const payload = "x".repeat(8 * 1024 * 1024);
  const encoded = encodePeertalkMessage({
    method: "Page.screencastFrame",
    params: { data: payload },
  });
  const fragmentSize = 4 * 1024;
  const fragments = Array.from(
    { length: Math.ceil(encoded.length / fragmentSize) },
    (_, index) => encoded.subarray(index * fragmentSize, (index + 1) * fragmentSize),
  );

  const [decoded] = await decodeFragments(fragments);
  assert.deepEqual(decoded, {
    method: "Page.screencastFrame",
    params: { data: payload },
  });
});
