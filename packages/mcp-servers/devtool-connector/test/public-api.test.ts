// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Connector } from "../src/index.ts";
import * as TransportApi from "../src/transport/index.ts";

test("Connector does not expose the removed no-reply API", () => {
  const removedMethod = ["sendMessage", "NoReply"].join("");
  assert.equal(removedMethod in Connector.prototype, false);
});

test("transport exports retain daemon and HDT transports without exposing low-level WebSocket helpers", () => {
  assert.equal(typeof TransportApi.DaemonTransport, "function");
  assert.equal(typeof TransportApi.HDTTransport, "function");
  for (const name of ["wsStreams", "WsWebSocketStream", "createWebSocketReadable"]) {
    assert.equal(name in TransportApi, false, `${name} must remain an internal implementation detail`);
  }
});
