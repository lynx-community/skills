// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream } from "node:stream/web";
import { test } from "node:test";
import { CustomizedResponseTransformStream } from "../src/streams/customized.ts";
import {
  createCorrelatedFilter,
  type CustomizedResponse,
  isCustomizedResponseWithType,
  type Response,
} from "../src/types.ts";

function response(type: string, message: string): CustomizedResponse {
  return { event: "Customized", data: { type, data: { message } } };
}

test("Customized response streams parse host-defined protocols and ignore other message types", async () => {
  const messages = [
    response("OtherProtocol", "not json"),
    response("ExampleProtocol", JSON.stringify({ value: "first" })),
    response("ExampleProtocol", JSON.stringify({ value: "second" })),
  ];
  const parsed = ReadableStream.from(messages).pipeThrough(
    new CustomizedResponseTransformStream<"ExampleProtocol", { value: string }>("ExampleProtocol"),
  );
  assert.deepEqual(await Array.fromAsync(parsed), [{ value: "first" }, { value: "second" }]);
});

test("Customized response streams preserve message-id filtering", async () => {
  const messages = [
    response("ExampleProtocol", JSON.stringify({ id: 1, value: "other" })),
    response("ExampleProtocol", JSON.stringify({ value: "missing id" })),
    response("ExampleProtocol", JSON.stringify({ id: 2, value: "ours" })),
  ];
  const parsed = ReadableStream.from(messages).pipeThrough(
    new CustomizedResponseTransformStream<"ExampleProtocol", { id: number; value: string }>("ExampleProtocol", 2),
  );
  assert.deepEqual(await Array.fromAsync(parsed), [{ id: 2, value: "ours" }]);
});

test("Customized response streams report malformed matching JSON", async () => {
  const parsed = ReadableStream.from([response("ExampleProtocol", "not json")]).pipeThrough(
    new CustomizedResponseTransformStream("ExampleProtocol"),
  );
  await assert.rejects(Array.fromAsync(parsed), error =>
    error instanceof Error
    && error.message === "Failed to parse response for type ExampleProtocol"
    && error.cause instanceof SyntaxError);
});

test("Customized type guards and correlation filters support host-defined envelopes", () => {
  const filter = createCorrelatedFilter<CustomizedResponse<"ExampleProtocol">, Response | CustomizedResponse>(
    (message): message is CustomizedResponse<"ExampleProtocol"> =>
      isCustomizedResponseWithType(message, "ExampleProtocol"),
    7,
  );
  const message: CustomizedResponse<"ExampleProtocol"> = {
    event: "Customized",
    data: { type: "ExampleProtocol", data: { message: "{}" } },
  };
  assert.equal(filter(message), true);
  assert.equal(filter({ ...message, data: { ...message.data, id: 7 } }), true);
  assert.equal(filter({ ...message, data: { ...message.data, id: -1 } }), false);
  assert.equal(filter({ ...message, data: { ...message.data, id: 8 } }), false);
  assert.equal(filter(response("OtherProtocol", "{}")), false);
});
