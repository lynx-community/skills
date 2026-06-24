// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NetConnectOpts } from "node:net";
import { createDebug } from "obug";
import { connectWithPeertalk } from "./base.ts";
import type { App, Connection, Device, OpenAppOptions, Transport, TransportConnectOptions } from "./transport.ts";
import { Usbmux } from "./usbmux.ts";

const debug = createDebug("devtool-mcp-server:connector:ios");

export class iOSTransport implements Transport {
  #client: Usbmux;

  constructor(options?: NetConnectOpts) {
    this.#client = new Usbmux(options);
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    return connectWithPeertalk<TInput, TOutput>(opts => this.#connectRaw(opts), options);
  }

  async close(): Promise<void> {
    debug("iOS transport closed");
  }

  async #connectRaw(
    { deviceId, port, signal }: TransportConnectOptions,
  ): Promise<Connection> {
    debug(`connect: create connection to deviceId: ${deviceId}, port: ${port}`);

    const id = await this.#resolveUsbmuxDeviceId(deviceId, signal);
    const conn = await this.#client.connect(id, port, signal);

    return {
      readable: conn.readable,
      writable: conn.writable,
      async [Symbol.asyncDispose]() {
        debug(`connect: close connection to deviceId: ${deviceId}, port: ${port}`);
        conn.dispose();
      },
    };
  }

  async #resolveUsbmuxDeviceId(deviceId: string, signal?: AbortSignal): Promise<number> {
    const numericDeviceId = Number(deviceId);
    if (Number.isInteger(numericDeviceId)) {
      return numericDeviceId;
    }

    const devices = await this.#client.listDevices(signal);
    const device = devices.find(({ Properties }) => Properties.SerialNumber === deviceId);
    if (!device) {
      throw new Error(`iOS device with id: ${deviceId} not found`);
    }

    return device.DeviceID;
  }

  async listDevices(): Promise<Device[]> {
    const devices = await this.#client.listDevices(AbortSignal.timeout(1_000));
    debug("listDevices: devices %o", devices);
    return devices.map(({ Properties }) => ({
      os: "iOS",
      id: Properties.SerialNumber,
    }));
  }

  async listAvailableApps(): Promise<App[]> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async openApp(_: string, __?: string, ___?: OpenAppOptions): Promise<void> {
    throw new Error("Not implemented");
  }
}
