// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { DAEMON_WS_PATH, DevtoolDaemon } from "../src/daemon/index.ts";
import { ClientId, Connector } from "../src/index.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import type { Connection, Transport } from "../src/transport/transport.ts";

const appInfo = {
  App: "TestApp",
  AppVersion: "1.0",
  debugRouterId: "1",
  debugRouterVersion: "2.0",
  deviceModel: "Pixel",
  network: "USB",
  osVersion: "14",
  sdkVersion: "3.0",
};

function createEofTransport(upstreamError?: Error): Transport {
  const appToDaemon = new TransformStream<unknown>();
  const appWriter = appToDaemon.writable.getWriter();

  return {
    async close() {
      await appWriter.close().catch(() => {});
    },
    async listDevices() {
      return [{ id: "fake-device", os: "Android" }];
    },
    async listAvailableApps() {
      return [];
    },
    async openApp() {},
    async connect<TOutput, TInput>(): Promise<Connection<TOutput, TInput>> {
      let requestEnded = false;
      const writable = new WritableStream<unknown>({
        async write(message) {
          if (isInitializeRequest(message)) {
            const { data: id } = message as { data: number };
            await appWriter.write({ event: "Register", data: { id, info: appInfo } });
            return;
          }

          if (!requestEnded) {
            requestEnded = true;
            if (upstreamError) await appWriter.abort(upstreamError);
            else await appWriter.close();
          }
        },
      });
      return {
        readable: appToDaemon.readable as ReadableStream<TOutput>,
        writable: writable as WritableStream<TInput>,
        async [Symbol.asyncDispose]() {
          if (!requestEnded) {
            requestEnded = true;
            await appWriter.close().catch(() => {});
          }
        },
      };
    },
  };
}

function isInitializeRequest(message: unknown): boolean {
  return typeof message === "object"
    && message !== null
    && (message as { event?: unknown }).event === "Initialize";
}

test("daemon read failures preserve the transport close reason", async t => {
  const upstreamError = Object.assign(new Error("upstream socket reset"), { code: "ECONNRESET" });
  const daemon = new DevtoolDaemon([createEofTransport(upstreamError)]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const connector = new Connector([
    new DaemonTransport(`ws://127.0.0.1:${port}${DAEMON_WS_PATH}`),
  ]);
  const clientId = ClientId.serialize("fake-device", 8901);

  await assert.rejects(
    connector.sendCDPMessage(clientId, 7, "Runtime.evaluate", { expression: "1 + 1" }),
    error => {
      assert(error instanceof Error);
      assert.equal(
        error.message,
        "WebSocket closed abnormally (1011): Error (ECONNRESET): upstream socket reset",
      );
      assert.equal((error as Error & { reason?: string }).reason, "Error (ECONNRESET): upstream socket reset");
      assert.doesNotMatch(error.message, /1 \+ 1/u);
      assert.equal((error as Error & { code?: number }).code, 1011);
      return true;
    },
  );
});

test("daemon close reasons remain valid when a transport error is long UTF-8", async t => {
  const upstreamError = Object.assign(new Error("连接中断 😀".repeat(40)), { code: "E_LONG" });
  const daemon = new DevtoolDaemon([createEofTransport(upstreamError)]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const connector = new Connector([
    new DaemonTransport(`ws://127.0.0.1:${port}${DAEMON_WS_PATH}`),
  ]);
  const clientId = ClientId.serialize("fake-device", 8901);

  await assert.rejects(
    connector.sendCDPMessage(clientId, 7, "Runtime.evaluate", { expression: "1 + 1" }),
    error => {
      assert(error instanceof Error);
      const reason = (error as Error & { reason?: string }).reason;
      assert.equal(typeof reason, "string");
      assert(Buffer.byteLength(reason) <= 123);
      assert(reason.endsWith("…"));
      assert.match(reason, /E_LONG/u);
      return true;
    },
  );
});
