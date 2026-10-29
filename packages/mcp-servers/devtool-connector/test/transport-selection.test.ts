// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { describe, test } from "node:test";
import type { TestContext } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { DAEMON_WS_PATH } from "../src/daemon/protocol.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import { ClientId, Connector } from "../src/index.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import type { Connection, Device, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

class SlowDaemonSessionTransport extends DaemonTransport {
  readonly #deviceId = "device under:test";
  connectCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    await sleep(10);
    return [{ id: this.#deviceId, os: "Android" as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    this.connectCalls += 1;

    let closeReadable: (() => void) | undefined;
    let enqueueResponse: ((value: unknown) => void) | undefined;

    const readable = new ReadableStream<unknown>({
      start(controller) {
        closeReadable = () => controller.close();
        enqueueResponse = (value) => controller.enqueue(value);
      },
    });

    const writable = new WritableStream<unknown>({
      write: (chunk) => {
        if (!this.#isListSessionRequest(chunk)) {
          closeReadable?.();
          return;
        }

        enqueueResponse?.({
          event: "Customized",
          data: {
            type: "SessionList",
            data: [
              {
                session_id: 101,
                type: "lynx",
                url: "https://example.test/session/101",
              },
            ],
          },
        });
        closeReadable?.();
      },
      close: () => {
        closeReadable?.();
      },
    });

    return {
      readable,
      writable,
      async [Symbol.asyncDispose]() {},
    };
  }

  #isListSessionRequest(message: unknown): boolean {
    return typeof message === "object"
      && message !== null
      && "event" in message
      && message.event === "Customized"
      && "data" in message
      && typeof message.data === "object"
      && message.data !== null
      && "type" in message.data
      && message.data.type === "ListSession";
  }
}

class FastDirectNoResponseTransport implements Transport {
  readonly #deviceId = "device under:test";
  connectCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: this.#deviceId, os: "Android" as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    this.connectCalls += 1;

    let closeReadable: (() => void) | undefined;

    const readable = new ReadableStream<unknown>({
      start(controller) {
        closeReadable = () => controller.close();
      },
    });

    const writable = new WritableStream<unknown>({
      write: () => {
        closeReadable?.();
      },
      close: () => {
        closeReadable?.();
      },
    });

    return {
      readable,
      writable,
      async [Symbol.asyncDispose]() {},
    };
  }
}

class PooledTargetTransport implements Transport {
  readonly #deviceId = "device under:test";
  discovery: "visible" | "empty" | "throws" = "visible";
  listDevicesCalls = 0;
  connectCalls = 0;
  disposeCalls = 0;

  async close(): Promise<void> {}

  async listDevices(): Promise<Device[]> {
    this.listDevicesCalls += 1;
    if (this.discovery === "throws") throw new Error("temporary discovery failure");
    if (this.discovery === "empty") return [];
    return [{ id: this.#deviceId, os: "Android" }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    if (options.deviceId !== this.#deviceId) {
      throw new Error(`Unexpected device ${options.deviceId}`);
    }
    this.connectCalls += 1;

    let enqueueResponse: ((value: TOutput) => void) | undefined;
    let closeReadable: (() => void) | undefined;
    const readable = new ReadableStream<TOutput>({
      start(controller) {
        enqueueResponse = (value) => controller.enqueue(value);
        closeReadable = () => controller.close();
      },
    });
    const writable = new WritableStream<TInput>({
      write: (chunk) => {
        const message = chunk as { event?: string; data?: { type?: string } };
        if (message.event === "Initialize") {
          enqueueResponse?.({
            event: "Register",
            data: {
              id: typeof options.port === "number" ? options.port : 0,
              info: {
                App: "FakeApp",
                AppVersion: "1.0",
                debugRouterId: "1",
                debugRouterVersion: "1.0",
                deviceModel: "FakeDevice",
                network: "USB",
                osVersion: "14",
                sdkVersion: "1.0",
              },
            },
          } as TOutput);
        } else if (message.event === "Customized" && message.data?.type === "ListSession") {
          enqueueResponse?.({
            event: "Customized",
            data: {
              type: "SessionList",
              data: [{ session_id: 101, type: "lynx", url: "https://example.test/session/101" }],
            },
          } as TOutput);
        }
      },
    });
    return {
      readable,
      writable,
      [Symbol.asyncDispose]: async () => {
        this.disposeCalls += 1;
        closeReadable?.();
      },
    };
  }
}

describe("Connector transport selection", () => {
  test("prefers daemon transports over other transports for the same device", async (t: TestContext) => {
    const daemonTransport = new SlowDaemonSessionTransport();
    const directTransport = new FastDirectNoResponseTransport();
    const connector = new Connector([directTransport, daemonTransport]);

    const sessions = await connector.sendListSessionMessage(ClientId.serialize("device under:test", 8901));

    t.assert.deepStrictEqual(sessions, [{
      session_id: 101,
      type: "lynx",
      url: "https://example.test/session/101",
    }]);
    t.assert.equal(daemonTransport.connectCalls, 1);
    t.assert.equal(directTransport.connectCalls, 0);
  });

  test("a sole daemon routes requests through its healthy pool when fresh device discovery is empty or fails", async () => {
    const physicalTransport = new PooledTargetTransport();
    const daemon = new DevtoolDaemon([physicalTransport]);
    const port = await daemon.start(0);
    const endpoint = `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`;
    const clientId = ClientId.serialize("device under:test", 8901);

    try {
      const keepAlive = await new DaemonTransport(endpoint).connect({
        deviceId: "device under:test",
        port: 8901,
      });
      try {
        const connector = new Connector([new DaemonTransport(endpoint)]);
        const expectedSessions = [{
          session_id: 101,
          type: "lynx",
          url: "https://example.test/session/101",
        }];

        physicalTransport.discovery = "empty";
        assert.deepEqual(await connector.sendListSessionMessage(clientId), expectedSessions);
        physicalTransport.discovery = "throws";
        assert.deepEqual(await connector.sendListSessionMessage(clientId), expectedSessions);

        assert.equal(physicalTransport.listDevicesCalls, 1);
        assert.equal(physicalTransport.connectCalls, 1);
        assert.equal(physicalTransport.disposeCalls, 0);

        physicalTransport.discovery = "empty";
        await assert.rejects(
          connector.sendListSessionMessage(ClientId.serialize("unknown device", 8901)),
          error =>
            error instanceof Error
            && error.message.includes("Failed to subscribe to unknown device:8901")
            && error.cause instanceof Error
            && error.cause.message === "Device with id: unknown device not found",
        );
        assert.equal(physicalTransport.connectCalls, 1);
      } finally {
        await keepAlive[Symbol.asyncDispose]();
      }
    } finally {
      await daemon.close();
    }
  });
});
