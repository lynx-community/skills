// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { TransformStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { ClientId, Connector } from "../src/index.ts";
import type { Connection, Device, Transport } from "../src/transport/transport.ts";

class EofTransport implements Transport {
  async close(): Promise<void> {}
  async listDevices(): Promise<Device[]> {
    return [{ id: "fake-device", os: "Android" }];
  }
  async listAvailableApps(): Promise<[]> {
    return [];
  }
  async openApp(): Promise<void> {}
  async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
    const stream = new TransformStream<TOutput>();
    const writer = stream.writable.getWriter();
    return {
      readable: stream.readable,
      writable: new WritableStream<TInput>({
        async write() {
          await writer.close();
        },
      }),
      async [Symbol.asyncDispose]() {
        writer.releaseLock();
      },
    };
  }
}

test("Connector identifies the request when a transport ends before its response", async () => {
  const connector = new Connector([new EofTransport()]);
  const clientId = ClientId.serialize("fake-device", 8901);
  await assert.rejects(
    connector.sendCDPMessage(clientId, 7, "Runtime.evaluate", { expression: "private payload" }),
    error => {
      assert(error instanceof Error);
      assert.equal(
        error.message,
        "Transport EofTransport ended cleanly (EOF) while waiting for a response to method Runtime.evaluate on clientId: fake-device:8901.",
      );
      assert.doesNotMatch(error.message, /private payload/u);
      return true;
    },
  );
});
