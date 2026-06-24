// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test } from "node:test";
import { Connector } from "../src/index.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import type { Client, Connection, Transport } from "../src/transport/transport.ts";

class EmptyDaemonTransport extends DaemonTransport {
  listClientsCalls = 0;

  override async listClients(): Promise<Client[]> {
    this.listClientsCalls += 1;
    return [];
  }
}

class DirectFallbackProbeTransport implements Transport {
  listDevicesCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    this.listDevicesCalls += 1;
    return [];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(): Promise<Connection<unknown, unknown>> {
    throw new Error("Direct fallback probe should not connect");
  }
}

describe("Connector listClients fallback", () => {
  test("uses a fulfilled daemon result even when it is empty", async (t) => {
    const daemonTransport = new EmptyDaemonTransport();
    const directTransport = new DirectFallbackProbeTransport();
    const connector = new Connector([daemonTransport, directTransport]);

    const clients = await connector.listClients();

    t.assert.deepStrictEqual(clients, []);
    t.assert.equal(daemonTransport.listClientsCalls, 1);
    t.assert.equal(directTransport.listDevicesCalls, 0);
  });
});
