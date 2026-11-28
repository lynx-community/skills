// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { ReadableStream, WritableStream } from "node:stream/web";
import { describe, test } from "node:test";
import type { TestContext } from "node:test";
import { ClientId, Connector } from "../src/index.ts";
import type { Connection, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

class SetupAwareTransport implements Transport {
  readonly id = "setup-aware";
  readonly #deviceId = "device under:test";
  readonly #failRegisterPorts: Set<number>;
  readonly #failSetup: { key: string; port: number } | undefined;
  readonly #onSetupRequest: ((key: string, port: number) => boolean | void) | undefined;
  readonly #ports = [8901, 8902];
  readonly messagesByConnection = new Map<number, { kind: string; port: number }[]>();
  readonly setupRequests: { key: string; value: boolean; port: number }[] = [];
  readonly registerAttempts = new Map<number, number>();
  recovery: "same" | "changed" | "closed" | "silent" = "same";
  readonly activePorts = new Set<number>();
  appRequests = 0;
  connectCalls = 0;
  disposeCalls = 0;

  constructor(options: {
    failRegisterPorts?: number[];
    failSetup?: { key: string; port: number };
    onSetupRequest?: (key: string, port: number) => boolean | void;
  } = {}) {
    this.#failRegisterPorts = new Set(options.failRegisterPorts);
    this.#failSetup = options.failSetup;
    this.#onSetupRequest = options.onSetupRequest;
  }

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: this.#deviceId, os: "Android" as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(options: TransportConnectOptions): Promise<Connection<unknown, unknown>> {
    if (options.deviceId !== this.#deviceId) {
      throw new Error(`Unexpected deviceId: ${options.deviceId}`);
    }

    if (this.activePorts.has(options.port)) throw new Error("Overlapping physical connections");
    this.activePorts.add(options.port);
    let enqueueResponse: ((value: unknown) => void) | undefined;
    let closeReadable: (() => void) | undefined;
    const connectionId = ++this.connectCalls;
    const dispose = () => {
      this.disposeCalls += 1;
      this.activePorts.delete(options.port);
      options.signal?.removeEventListener("abort", abortHandler);
      closeReadable?.();
    };
    const abortHandler = () => closeReadable?.();
    options.signal?.addEventListener("abort", abortHandler, { once: true });
    const messages: { kind: string; port: number }[] = [];
    this.messagesByConnection.set(connectionId, messages);

    const readable = new ReadableStream<unknown>({
      start(controller) {
        enqueueResponse = (value) => controller.enqueue(value);
        closeReadable = () => {
          try {
            controller.close();
          } catch {
            // The Connector may already have cancelled after consuming the response.
          }
        };
      },
    });

    const writable = new WritableStream<unknown>({
      write: (chunk) => {
        if (this.#isExpectedInitialize(chunk, options.port)) {
          messages.push({ kind: "Initialize", port: options.port });
          const attempt = (this.registerAttempts.get(options.port) ?? 0) + 1;
          this.registerAttempts.set(options.port, attempt);
          if (attempt > 1 && this.recovery === "silent") return;
          if (this.#failRegisterPorts.has(options.port) || (attempt > 1 && this.recovery === "closed")) {
            closeReadable?.();
          } else {
            const response = this.#createRegisterResponse(options.port);
            if (attempt > 1 && this.recovery === "changed") response.data.info.debugRouterId = "replacement";
            enqueueResponse?.(response);
          }
          return;
        }

        const setupRequest = this.#getSetGlobalSwitchRequest(chunk);
        if (setupRequest) {
          messages.push({ kind: setupRequest.key, port: options.port });
          this.setupRequests.push({ ...setupRequest, port: options.port });
          if (this.#onSetupRequest?.(setupRequest.key, options.port) === false) {
            return;
          }
          if (this.#failSetup?.port === options.port && this.#failSetup.key === setupRequest.key) {
            closeReadable?.();
            return;
          }
          enqueueResponse?.({
            event: "Customized",
            data: {
              type: "SetGlobalSwitch",
              data: {
                client_id: options.port,
                session_id: -1,
                message: "ok",
              },
            },
          });
          return;
        }

        const request = chunk as { event?: string; data?: { type?: string; data?: { message?: { id: number } } } };
        if (request.event === "Customized" && request.data?.type === "App" && request.data.data?.message) {
          this.appRequests += 1;
          enqueueResponse?.({
            event: "Customized",
            data: {
              type: "App",
              data: {
                message: JSON.stringify({
                  id: request.data.data.message.id,
                  result: JSON.stringify({ code: 0, switch: false, value: "" }),
                }),
              },
            },
          });
          return;
        }
        closeReadable?.();
      },
      close: () => {
        closeReadable?.();
      },
    });

    return {
      readable,
      writable,
      async [Symbol.asyncDispose]() {
        dispose();
      },
    };
  }

  #createRegisterResponse(port: number) {
    return {
      event: "Register",
      data: {
        id: port,
        info: {
          App: `app-${port}`,
          AppVersion: "1.0.0",
          AppProcessName: `app-${port}`,
          debugRouterId: `router-${port}`,
          debugRouterVersion: "1.0.0",
          deviceModel: "fake-device",
          network: "wifi",
          osVersion: "1",
          sdkVersion: "1",
        },
      },
    };
  }

  #isExpectedInitialize(message: unknown, port: number): boolean {
    return this.#ports.includes(port)
      && typeof message === "object"
      && message !== null
      && "event" in message
      && message.event === "Initialize"
      && "data" in message
      && message.data === port;
  }

  #getSetGlobalSwitchRequest(message: unknown): { key: string; value: boolean } | null {
    if (
      typeof message !== "object"
      || message === null
      || !("event" in message)
      || message.event !== "Customized"
      || !("data" in message)
      || typeof message.data !== "object"
      || message.data === null
      || !("type" in message.data)
      || message.data.type !== "SetGlobalSwitch"
      || !("data" in message.data)
      || typeof message.data.data !== "object"
      || message.data.data === null
      || !("message" in message.data.data)
      || typeof message.data.data.message !== "object"
      || message.data.data.message === null
      || !("global_key" in message.data.data.message)
      || typeof message.data.data.message.global_key !== "string"
      || !("global_value" in message.data.data.message)
      || typeof message.data.data.message.global_value !== "boolean"
    ) {
      return null;
    }

    return {
      key: message.data.data.message.global_key,
      value: message.data.data.message.global_value,
    };
  }
}

describe("Connector listClients setup", () => {
  test("sets up only required switches for every discovered client", async (t: TestContext) => {
    const transport = new SetupAwareTransport();
    const connector = new Connector([transport]);

    const clients = await connector.listClients();

    t.assert.deepStrictEqual(
      clients.map(({ id }) => id).sort(),
      [
        ClientId.serialize("setup-aware", "device under:test", 8901),
        ClientId.serialize("setup-aware", "device under:test", 8902),
      ],
    );
    t.assert.deepStrictEqual(transport.setupRequests, [
      { key: "enable_devtool", value: true, port: 8901 },
      { key: "enable_devtool", value: true, port: 8902 },
      { key: "enable_quickjs_debug", value: true, port: 8901 },
      { key: "enable_quickjs_debug", value: true, port: 8902 },
    ]);
    t.assert.equal(transport.connectCalls, 10, "one scan should open one connection per probed port");
    t.assert.equal(transport.disposeCalls, 10);
    for (const port of [8901, 8902]) {
      t.assert.deepStrictEqual(
        [...transport.messagesByConnection.values()].filter(messages =>
          messages.some(message => message.port === port)
        ),
        [[
          { kind: "Initialize", port },
          { kind: "enable_devtool", port },
          { kind: "enable_quickjs_debug", port },
        ]],
        `port ${port} should use one connection generation for discovery and setup`,
      );
    }

    await connector.listClients();

    t.assert.equal(transport.setupRequests.length, 8);
    t.assert.equal(transport.connectCalls, 20);
    t.assert.equal(transport.disposeCalls, 20);
  });

  test("publishes a client only after both setup acknowledgments", async (t) => {
    for (const key of ["enable_devtool", "enable_quickjs_debug"]) {
      const transport = new SetupAwareTransport({
        failRegisterPorts: [8902],
        failSetup: { key, port: 8901 },
      });

      const clients = await new Connector([transport]).listClients();

      t.assert.deepStrictEqual(clients, [], `${key} failure must not publish the client`);
      t.assert.equal(transport.connectCalls, 10);
      t.assert.equal(transport.disposeCalls, 10);
    }
  });

  for (const key of ["enable_devtool", "enable_quickjs_debug"]) {
    test(`revalidates a registered client after ${key} times out`, async (t) => {
      const transport = timeoutTransport(t, key);
      const connector = new Connector([transport]);
      const clients = await connector.listClients();
      t.assert.deepStrictEqual(clients.map(({ id }) => id), [
        ClientId.serialize("setup-aware", "device under:test", 8901),
      ]);
      t.assert.equal(transport.registerAttempts.get(8901), 2);
      t.assert.equal(transport.connectCalls, 11);
      t.assert.equal(transport.disposeCalls, 11);
      const recovery = [...transport.messagesByConnection.values()].at(-1);
      t.assert.deepStrictEqual(recovery, [{ kind: "Initialize", port: 8901 }]);
      t.assert.equal(transport.setupRequests.filter(request => request.key === key).length, 1);
      t.assert.deepStrictEqual(await connector.sendAppMessage(clients[0]!.id, "App.getPPE"), {
        code: 0,
        switch: false,
        value: "",
      });
      t.assert.equal(transport.appRequests, 1);
      t.assert.equal(transport.activePorts.size, 0);
    });
  }

  for (const recovery of ["changed", "closed", "silent"] as const) {
    test(`does not publish a ${recovery} client after setup timeout`, async (t) => {
      const transport = timeoutTransport(t, "enable_devtool");
      transport.recovery = recovery;
      const clients = await new Connector([transport]).listClients();
      t.assert.deepStrictEqual(clients, []);
      t.assert.equal(transport.registerAttempts.get(8901), 2);
      t.assert.equal(transport.connectCalls, transport.disposeCalls);
    });
  }

  test("does not let the completed discovery deadline abort setup", async (t) => {
    const discovery = new AbortController();
    const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
    t.mock.method(
      AbortSignal,
      "timeout",
      (delay: number) => delay === 5_000 ? discovery.signal : originalTimeout(delay),
    );
    const transport = new SetupAwareTransport({
      failRegisterPorts: [8902],
      onSetupRequest(key, port) {
        if (key === "enable_devtool" && port === 8901) discovery.abort();
      },
    });

    const clients = await new Connector([transport]).listClients();

    t.assert.deepStrictEqual(clients.map(({ id }) => id), [
      ClientId.serialize("setup-aware", "device under:test", 8901),
    ]);
    t.assert.deepStrictEqual(transport.setupRequests, [
      { key: "enable_devtool", value: true, port: 8901 },
      { key: "enable_quickjs_debug", value: true, port: 8901 },
    ]);
  });

  test("setup deadline interrupts a pending response without publishing the client", async (t) => {
    const discovery = new AbortController();
    const setup = new AbortController();
    const setupRequested = Promise.withResolvers<void>();
    const setupAborted = Promise.withResolvers<void>();
    t.mock.method(
      AbortSignal,
      "timeout",
      (delay: number) => delay === 5_000 ? discovery.signal : setup.signal,
    );
    const transport = new SetupAwareTransport({
      failRegisterPorts: [8902],
      onSetupRequest(key, port) {
        if (key === "enable_devtool" && port === 8901) {
          setupRequested.resolve();
          setImmediate(() => {
            setup.abort();
            setupAborted.resolve();
          });
          return false;
        }
      },
    });
    const clientsPromise = new Connector([transport]).listClients();

    await setupRequested.promise;
    await setupAborted.promise;
    const settled = await settlesBeforeImmediate(clientsPromise);
    if (!settled) discovery.abort();
    const clients = await clientsPromise;

    t.assert.equal(settled, true);
    t.assert.deepStrictEqual(clients, []);
  });
});

async function settlesBeforeImmediate(promise: Promise<unknown>): Promise<boolean> {
  return await Promise.race([
    promise.then(
      () => true,
      () => true,
    ),
    new Promise<false>(resolve => setImmediate(() => resolve(false))),
  ]);
}

function timeoutTransport(t: TestContext, key: string): SetupAwareTransport {
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  const setup = new AbortController();
  let setupStarted = false;
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    if (delay === 5_000) return originalTimeout(delay);
    return setupStarted ? originalTimeout(20) : setup.signal;
  });
  return new SetupAwareTransport({
    failRegisterPorts: [8902],
    onSetupRequest(requestKey, port) {
      if (requestKey !== key || port !== 8901) return;
      setupStarted = true;
      setImmediate(() => setup.abort(new DOMException("Switch response timed out", "TimeoutError")));
      return false;
    },
  });
}
