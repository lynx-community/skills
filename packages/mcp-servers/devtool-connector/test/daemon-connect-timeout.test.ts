// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test } from 'node:test';
import { DevtoolDaemon } from '../src/daemon/server.ts';
import { DaemonTransport } from '../src/transport/daemon.ts';
import type {
  Connection,
  Transport,
  TransportConnectOptions,
} from '../src/transport/transport.ts';

describe('DaemonTransport connection setup timeout', () => {
  test('listClients returns when a daemon device port connect never settles', async (t) => {
    // Closing the transport must settle the stalled connect, otherwise the
    // daemon's shutdown can never finish draining its pending connections.
    const pendingConnect =
      Promise.withResolvers<Connection<unknown, unknown>>();
    const hangingTransport: Transport = {
      async close() {
        pendingConnect.reject(new Error('transport closed'));
      },
      async listDevices() {
        return [{ id: 'test-device', os: 'Android' as const }];
      },
      async listAvailableApps() {
        return [];
      },
      async openApp() {},
      async connect<TInput, TOutput>(
        options: TransportConnectOptions,
      ): Promise<Connection<TOutput, TInput>> {
        if (options.port === 8901) {
          return (await pendingConnect.promise) as Connection<TOutput, TInput>;
        }

        throw new Error(`Connection refused on port ${options.port}`);
      },
    };
    const daemon = new DevtoolDaemon([hangingTransport]);
    const daemonPort = await daemon.start(0);
    t.after(() => daemon.close());

    const transport = new DaemonTransport(daemonPort);
    const clients = await transport.listClients();

    t.assert.deepEqual(clients, []);
  });
});
