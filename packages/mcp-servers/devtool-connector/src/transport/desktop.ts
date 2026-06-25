// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import net from 'node:net';
import { Duplex } from 'node:stream';
import { createDebug } from 'obug';
import { connectWithPeertalk } from './base.ts';
import type {
  App,
  Connection,
  Device,
  Transport,
  TransportConnectOptions,
} from './transport.ts';

const debug = createDebug('devtool-mcp-server:connector:desktop');

export class DesktopTransport implements Transport {
  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    return connectWithPeertalk<TInput, TOutput>(
      (opts) => this.#connectRaw(opts),
      options,
    );
  }

  async close(): Promise<void> {
    debug('Desktop transport closed');
  }

  async listDevices(): Promise<Device[]> {
    return [{ id: 'localhost', os: 'Desktop' }];
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    void deviceId;
    return [];
  }

  async openApp(deviceId: string, packageName: string): Promise<void> {
    void deviceId;
    void packageName;
    throw new Error('openApp is not supported on DesktopTransport');
  }

  async #connectRaw({
    deviceId,
    port,
    signal,
  }: TransportConnectOptions): Promise<Connection> {
    if (deviceId !== 'localhost') {
      throw new Error(
        `DesktopTransport only supports 'localhost' deviceId, got: ${deviceId}`,
      );
    }

    debug(`connect: connecting to 127.0.0.1:${port}`);

    const socket = net.createConnection({ host: '127.0.0.1', port, signal });

    try {
      if (!socket.connecting) {
        // already connected or failed immediately
      } else {
        await new Promise<void>((resolve, reject) => {
          socket.once('connect', resolve);
          socket.once('error', reject);
        });
      }

      debug(`connect: connected to 127.0.0.1:${port}`);

      const { readable, writable } = Duplex.toWeb(socket);
      return {
        readable,
        writable,
        async [Symbol.asyncDispose]() {
          debug(`connect: closing connection to 127.0.0.1:${port}`);
          socket.destroy();
        },
      };
    } catch (err) {
      debug(`connect: error connecting to 127.0.0.1:${port} %O`, err);
      socket.destroy();
      throw err;
    }
  }
}
