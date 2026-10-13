// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Connector } from "../src/index.ts";
import type { App, Client, Connection, Device, Transport } from "../src/transport/transport.ts";

class ClientListTransport implements Transport {
  #openedPackageName: string | null = null;
  listClientsCalls = 0;

  async close(): Promise<void> {
  }

  async listDevices(): Promise<Device[]> {
    return [{ id: "device", os: "Android" }];
  }

  async listAvailableApps(): Promise<App[]> {
    return [];
  }

  async openApp(_: string, packageName: string): Promise<void> {
    this.#openedPackageName = packageName;
  }

  async listClients(): Promise<Client[]> {
    this.listClientsCalls++;
    if (!this.#openedPackageName) {
      return [];
    }

    return [{
      id: "device:8902",
      info: {
        App: "LynxPlayground",
        AppProcessName: this.#openedPackageName,
        AppVersion: "1.0.0",
        debugRouterId: "debug-router-id",
        debugRouterVersion: "0.0.20",
        deviceModel: "device",
        network: "USB",
        osVersion: "10",
        sdkVersion: "0.0.1",
      },
    }];
  }

  async connect<TInput = unknown, TOutput = unknown>(): Promise<Connection<TOutput, TInput>> {
    throw new Error("openApp should use transport.listClients instead of probing ports");
  }
}

class EmptyClientListTransport implements Transport {
  listClientsCalls = 0;

  async close(): Promise<void> {
  }

  async listDevices(): Promise<Device[]> {
    return [{ id: "device", os: "Android" }];
  }

  async listAvailableApps(): Promise<App[]> {
    return [];
  }

  async openApp(): Promise<void> {
  }

  async listClients(): Promise<Client[]> {
    this.listClientsCalls++;
    return [];
  }

  async connect<TInput = unknown, TOutput = unknown>(): Promise<Connection<TOutput, TInput>> {
    throw new Error("openApp should use transport.listClients instead of probing ports");
  }
}

test("Connector.openApp waits for clients through transport.listClients when available", async () => {
  const transport = new ClientListTransport();
  const connector = new Connector([transport]);

  const clientId = await connector.openApp("device", "com.lynx.uiapp", {
    signal: AbortSignal.timeout(50),
  });

  assert.equal(clientId, "device:8902");
  assert.equal(transport.listClientsCalls, 1);
});

test("Connector.openApp rejects when the opened app never registers a client", async () => {
  const transport = new EmptyClientListTransport();
  const connector = new Connector([transport]);

  await assert.rejects(
    () =>
      connector.openApp("device", "com.lynx.uiapp", {
        signal: AbortSignal.timeout(10),
      }),
    /Timed out waiting for app client com\.lynx\.uiapp on device device/u,
  );

  assert.equal(transport.listClientsCalls, 1);
});
