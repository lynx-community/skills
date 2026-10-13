// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, test } from "node:test";
import { Connector } from "../src/index.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import { HDTTransport } from "../src/transport/hdt.ts";
import type { Client, Connection, Device, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

class EmptyDaemonTransport extends DaemonTransport {
  listClientsCalls = 0;

  override async listClients(): Promise<Client[]> {
    this.listClientsCalls += 1;
    return [];
  }
}

class EmptyHDTTransport extends HDTTransport {
  listClientsCalls = 0;

  constructor() {
    super("ws://127.0.0.1:19783/mdevices/page/android");
  }

  override async listClients(): Promise<Client[]> {
    this.listClientsCalls += 1;
    return [];
  }
}

class RejectingDaemonTransport extends DaemonTransport {
  #failure: Error;

  constructor(failure: Error) {
    super();
    this.#failure = failure;
  }

  override async listClients(): Promise<Client[]> {
    throw this.#failure;
  }

  override async listDevices(): Promise<never> {
    throw this.#failure;
  }
}

class RejectingHDTTransport extends HDTTransport {
  #failure: Error;

  constructor(failure: Error) {
    super("ws://127.0.0.1:19783/mdevices/page/android");
    this.#failure = failure;
  }

  override async listClients(): Promise<Client[]> {
    throw this.#failure;
  }
}

class DirectFallbackProbeTransport implements Transport {
  #devices: Device[];
  listAvailableAppsCalls = 0;
  listDevicesCalls = 0;

  constructor(devices: Device[] = []) {
    this.#devices = devices;
  }

  async close(): Promise<void> {}

  async listDevices(): Promise<Device[]> {
    this.listDevicesCalls += 1;
    return this.#devices;
  }

  async listAvailableApps() {
    this.listAvailableAppsCalls += 1;
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error("Direct fallback probe should not connect");
  }
}

class TestDaemonLifecycleError extends Error {
  readonly code = "ERR_DAEMON_LIFECYCLE";

  constructor(message: string) {
    super(message);
    this.name = "DaemonLifecycleError";
  }
}

class RejectingDirectTransport extends DirectFallbackProbeTransport {
  #failure: Error;

  constructor(failure: Error) {
    super();
    this.#failure = failure;
  }

  override async listDevices(): Promise<never> {
    this.listDevicesCalls += 1;
    throw this.#failure;
  }
}

class DeadlineDirectTransport extends DirectFallbackProbeTransport {
  connectCalls = 0;

  constructor() {
    super([{ id: "ios-device", os: "iOS" }]);
  }

  override async connect(options: TransportConnectOptions): Promise<Connection<unknown, unknown>> {
    this.connectCalls += 1;
    const { signal } = options;
    if (!signal) throw new Error("Expected client discovery to own a deadline");

    return await new Promise((_, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  }
}

describe("Connector listClients fallback", () => {
  test("preserves the sole discovery rejection", async (t) => {
    const failure = new Error("HDT ClientList unavailable");

    await t.assert.rejects(
      new Connector([new RejectingHDTTransport(failure)]).listClients(),
      error => error === failure,
    );
  });

  test("uses a successful direct fallback after an HDT rejection", async (t) => {
    const directTransport = new DirectFallbackProbeTransport();
    const clients = await new Connector([
      new RejectingHDTTransport(new Error("HDT ClientList unavailable")),
      directTransport,
    ]).listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(directTransport.listDevicesCalls, 1);
  });

  test("preserves a direct discovery rejection when it is the only authority", async (t) => {
    const failure = new Error("ADB discovery unavailable");

    await t.assert.rejects(
      new Connector([new RejectingDirectTransport(failure)]).listClients(),
      error => error === failure,
    );
  });

  test("treats failed port probes on a discovered device as an empty client list", async (t) => {
    const directTransport = new DirectFallbackProbeTransport([
      { id: "emulator-5554", os: "Android" },
    ]);

    t.assert.deepStrictEqual(await new Connector([directTransport]).listClients(), []);
    t.assert.equal(directTransport.listDevicesCalls, 1);
  });

  test("preserves a port-scan deadline instead of reporting an empty client list", async (t) => {
    const deadline = new DOMException("client discovery deadline", "TimeoutError");
    const deadlineController = new AbortController();
    const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
    t.mock.method(
      AbortSignal,
      "timeout",
      (delay: number) => delay === 5_000 ? deadlineController.signal : originalTimeout(delay),
    );
    const directTransport = new DeadlineDirectTransport();
    const listing = new Connector([directTransport]).listClients();

    await new Promise<void>(resolve => setImmediate(resolve));
    t.assert.equal(directTransport.connectCalls, 10);
    deadlineController.abort(deadline);

    await t.assert.rejects(listing, error => error === deadline);
  });

  test("uses an empty HDT answer when another HDT transport rejects", async (t) => {
    const emptyHDTTransport = new EmptyHDTTransport();
    const directTransport = new DirectFallbackProbeTransport();
    const clients = await new Connector([
      new RejectingHDTTransport(new Error("HDT ClientList unavailable")),
      emptyHDTTransport,
      directTransport,
    ]).listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(emptyHDTTransport.listClientsCalls, 1);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });

  test("uses an empty HDT fallback after daemon discovery rejects", async (t) => {
    const hdtTransport = new EmptyHDTTransport();
    const directTransport = new DirectFallbackProbeTransport();
    const clients = await new Connector([
      new RejectingDaemonTransport(new Error("daemon discovery unavailable")),
      hdtTransport,
      directTransport,
    ]).listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(hdtTransport.listClientsCalls, 1);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });

  test("does not fall back after an exclusive daemon lifecycle failure", async (t) => {
    const failure = new TestDaemonLifecycleError(
      "Incompatible daemon still owns the device connection",
    );
    const hdtTransport = new EmptyHDTTransport();
    const directTransport = new DirectFallbackProbeTransport();

    await t.assert.rejects(
      new Connector([
        new RejectingDaemonTransport(failure),
        hdtTransport,
        directTransport,
      ]).listClients(),
      error => error === failure,
    );
    t.assert.equal(hdtTransport.listClientsCalls, 0);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });

  test("does not select a direct transport after daemon lifecycle failure", async (t) => {
    const failure = new TestDaemonLifecycleError(
      "Connector daemon could not be recreated safely",
    );
    const directTransport = new DirectFallbackProbeTransport([
      { id: "emulator-5554", os: "Android" },
    ]);
    const connector = new Connector([
      new RejectingDaemonTransport(failure),
      directTransport,
    ]);

    await t.assert.rejects(
      connector.listAvailableApps("emulator-5554"),
      error => error === failure,
    );
    t.assert.equal(directTransport.listDevicesCalls, 0);
    t.assert.equal(directTransport.listAvailableAppsCalls, 0);
  });

  test("aggregates failures when every configured authority rejects", async (t) => {
    const daemonFailure = new Error("daemon discovery unavailable");
    const hdtFailure = new Error("HDT ClientList unavailable");
    const directFailure = new Error("ADB discovery unavailable");

    await t.assert.rejects(
      new Connector([
        new RejectingDaemonTransport(daemonFailure),
        new RejectingHDTTransport(hdtFailure),
        new RejectingDirectTransport(directFailure),
      ]).listClients(),
      (error) => {
        t.assert.ok(error instanceof AggregateError);
        t.assert.deepStrictEqual(error.errors, [daemonFailure, hdtFailure, directFailure]);
        return true;
      },
    );
  });

  test("returns an empty list when no discovery transport is configured", async (t) => {
    t.assert.deepStrictEqual(await new Connector([]).listClients(), []);
  });

  test("uses a fulfilled daemon result even when it is empty", async (t) => {
    const daemonTransport = new EmptyDaemonTransport();
    const hdtTransport = new EmptyHDTTransport();
    const directTransport = new DirectFallbackProbeTransport();
    const connector = new Connector([daemonTransport, hdtTransport, directTransport]);

    const clients = await connector.listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(daemonTransport.listClientsCalls, 1);
    t.assert.equal(hdtTransport.listClientsCalls, 0);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });

  test("uses a fulfilled HDT result even when it is empty", async (t) => {
    const hdtTransport = new EmptyHDTTransport();
    const directTransport = new DirectFallbackProbeTransport();
    const connector = new Connector([hdtTransport, directTransport]);

    const clients = await connector.listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(hdtTransport.listClientsCalls, 1);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });
});
