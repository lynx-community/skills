// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, test } from "node:test";
import type { TestContext } from "node:test";
import { ClientId } from "../src/index.ts";

describe("ClientId", () => {
  describe("serialize", () => {
    test("returns transportId:deviceId:port format", (t: TestContext) => {
      const serialized = ClientId.serialize("android", "device-001", 9000);

      t.assert.equal(serialized, "android:device-001:9000");
    });

    test("URL encodes deviceId", (t: TestContext) => {
      const serialized = ClientId.serialize("android", "设备 001/测试", 9100);

      t.assert.equal(serialized, "android:%E8%AE%BE%E5%A4%87%20001%2F%E6%B5%8B%E8%AF%95:9100");
    });

    test("encodes colon inside deviceId", (t: TestContext) => {
      const serialized = ClientId.serialize("android", "foo:bar", 9200);

      t.assert.equal(serialized, "android:foo%3Abar:9200");
    });

    test("accepts a string target", (t: TestContext) => {
      const serialized = ClientId.serialize("HDT-19783", "HDT-19783", "router-uuid");

      t.assert.equal(serialized, "HDT-19783:HDT-19783:router-uuid");
    });

    test("round-trips transportId, deviceId, and port into a ClientId instance", (t: TestContext) => {
      const serialized = ClientId.serialize("android", "emulator-5554", 8901);

      t.assert.equal(serialized, "android:emulator-5554:8901");
      t.assert.deepStrictEqual(
        ClientId.deserialize(serialized),
        new ClientId("android", "emulator-5554", 8901),
      );
    });

    test("encodes reserved characters in a string target", (t: TestContext) => {
      const serialized = ClientId.serialize("HDT-19783", "HDT-19783", "router:sub-id%");

      t.assert.equal(serialized, "HDT-19783:HDT-19783:router%3Asub-id%25");
      t.assert.deepStrictEqual(
        ClientId.deserialize(serialized),
        new ClientId("HDT-19783", "HDT-19783", "router:sub-id%"),
      );
    });
  });

  describe("deserialize", () => {
    test("returns null for 2-segment value", (t: TestContext) => {
      const result = ClientId.deserialize("device-001:9000");

      t.assert.equal(result, null);
    });

    test("parses 3-segment transportId:deviceId:port", (t: TestContext) => {
      const result = ClientId.deserialize("sandbox:10.0.0.1%3A5555:com.lynx.uiapp");

      t.assert.deepStrictEqual(
        result,
        new ClientId("sandbox", "10.0.0.1:5555", "com.lynx.uiapp"),
      );
    });

    test("returns null when no colon exists", (t: TestContext) => {
      const result = ClientId.deserialize("foobar");

      t.assert.equal(result, null);
    });

    test("parses a string target", (t: TestContext) => {
      const result = ClientId.deserialize("android:foo:port");

      t.assert.deepStrictEqual(result, new ClientId("android", "foo", "port"));
    });

    test("does not truncate a string target that starts with digits", (t: TestContext) => {
      const result = ClientId.deserialize("HDT-19783:HDT-19783:123-router");

      t.assert.deepStrictEqual(result, new ClientId("HDT-19783", "HDT-19783", "123-router"));
    });

    test("returns null when decodeURIComponent throws", (t: TestContext) => {
      const result = ClientId.deserialize("android:%E0%A4%:1234");

      t.assert.equal(result, null);
    });

    test("decodes colon inside deviceId", (t: TestContext) => {
      const result = ClientId.deserialize("android:foo%3Abar:9300");

      t.assert.deepStrictEqual(result, new ClientId("android", "foo:bar", 9300));
    });
  });
});
