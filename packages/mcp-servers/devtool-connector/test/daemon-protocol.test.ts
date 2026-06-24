// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test } from "node:test";
import type { TestContext } from "node:test";
import {
  isControlRequest,
  isCustomizedMessage,
  isListClientsRequest,
  isPingEvent,
  isRegisterEvent,
} from "../src/daemon/protocol.ts";

describe("daemon protocol type guards", () => {
  describe("isRegisterEvent", () => {
    test("returns true for a valid Register message", (t: TestContext) => {
      t.assert.ok(isRegisterEvent({ event: "Register", data: { id: 1, type: "Driver" } }));
    });

    test("returns false for Initialize", (t: TestContext) => {
      t.assert.ok(!isRegisterEvent({ event: "Initialize", data: 1 }));
    });

    test("returns false for null", (t: TestContext) => {
      t.assert.ok(!isRegisterEvent(null));
    });

    test("returns false for a string", (t: TestContext) => {
      t.assert.ok(!isRegisterEvent("Register"));
    });
  });

  describe("isCustomizedMessage", () => {
    test("returns true for a Customized message", (t: TestContext) => {
      t.assert.ok(isCustomizedMessage({
        event: "Customized",
        data: { type: "CDP", data: { client_id: 1 } },
      }));
    });

    test("returns false for a non-Customized message", (t: TestContext) => {
      t.assert.ok(!isCustomizedMessage({ event: "Register", data: {} }));
    });

    test("returns false for undefined", (t: TestContext) => {
      t.assert.ok(!isCustomizedMessage(undefined));
    });
  });

  describe("isControlRequest", () => {
    test("returns true for a Control message", (t: TestContext) => {
      t.assert.ok(isControlRequest({
        event: "Control",
        data: { id: 1, method: "listDevices" },
      }));
    });

    test("returns false for Customized", (t: TestContext) => {
      t.assert.ok(!isControlRequest({ event: "Customized", data: {} }));
    });
  });

  describe("isListClientsRequest", () => {
    test("returns true for ListClients", (t: TestContext) => {
      t.assert.ok(isListClientsRequest({ event: "ListClients" }));
    });

    test("returns false for Ping", (t: TestContext) => {
      t.assert.ok(!isListClientsRequest({ event: "Ping" }));
    });
  });

  describe("isPingEvent", () => {
    test("returns true for Ping", (t: TestContext) => {
      t.assert.ok(isPingEvent({ event: "Ping" }));
    });

    test("returns false for Pong", (t: TestContext) => {
      t.assert.ok(!isPingEvent({ event: "Pong" }));
    });

    test("returns false for an empty object", (t: TestContext) => {
      t.assert.ok(!isPingEvent({}));
    });
  });
});
