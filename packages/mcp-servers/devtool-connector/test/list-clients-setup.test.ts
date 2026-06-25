// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream, WritableStream } from 'node:stream/web';
import type { TestContext } from 'node:test';
import { describe, test } from 'node:test';
import { ClientId, Connector } from '../src/index.ts';
import type {
  Connection,
  Transport,
  TransportConnectOptions,
} from '../src/transport/transport.ts';

class SetupAwareTransport implements Transport {
  readonly #deviceId = 'device under:test';
  readonly #ports = [8901, 8902];
  readonly setupRequests: { key: string; port: number }[] = [];

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: this.#deviceId, os: 'Android' as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect(
    options: TransportConnectOptions,
  ): Promise<Connection<unknown, unknown>> {
    if (options.deviceId !== this.#deviceId) {
      throw new Error(`Unexpected deviceId: ${options.deviceId}`);
    }

    let enqueueResponse: ((value: unknown) => void) | undefined;
    let closeReadable: (() => void) | undefined;

    const readable = new ReadableStream<unknown>({
      start(controller) {
        enqueueResponse = (value) => controller.enqueue(value);
        closeReadable = () => controller.close();
      },
    });

    const writable = new WritableStream<unknown>({
      write: (chunk) => {
        if (this.#isExpectedInitialize(chunk, options.port)) {
          enqueueResponse?.(this.#createRegisterResponse(options.port));
          closeReadable?.();
          return;
        }

        const setupKey = this.#getSetGlobalSwitchKey(chunk);
        if (setupKey) {
          this.setupRequests.push({ key: setupKey, port: options.port });
          enqueueResponse?.({
            event: 'Customized',
            data: {
              type: 'SetGlobalSwitch',
              data: {
                client_id: options.port,
                session_id: -1,
                message: 'ok',
              },
            },
          });
          closeReadable?.();
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
      async [Symbol.asyncDispose]() {},
    };
  }

  #createRegisterResponse(port: number) {
    return {
      event: 'Register',
      data: {
        id: port,
        info: {
          App: `app-${port}`,
          AppVersion: '1.0.0',
          AppProcessName: `app-${port}`,
          debugRouterId: `router-${port}`,
          debugRouterVersion: '1.0.0',
          deviceModel: 'fake-device',
          network: 'wifi',
          osVersion: '1',
          sdkVersion: '1',
        },
      },
    };
  }

  #isExpectedInitialize(message: unknown, port: number): boolean {
    return (
      this.#ports.includes(port) &&
      typeof message === 'object' &&
      message !== null &&
      'event' in message &&
      message.event === 'Initialize' &&
      'data' in message &&
      message.data === port
    );
  }

  #getSetGlobalSwitchKey(message: unknown): string | null {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('event' in message) ||
      message.event !== 'Customized' ||
      !('data' in message) ||
      typeof message.data !== 'object' ||
      message.data === null ||
      !('type' in message.data) ||
      message.data.type !== 'SetGlobalSwitch' ||
      !('data' in message.data) ||
      typeof message.data.data !== 'object' ||
      message.data.data === null ||
      !('message' in message.data.data) ||
      typeof message.data.data.message !== 'object' ||
      message.data.data.message === null ||
      !('global_key' in message.data.data.message) ||
      typeof message.data.data.message.global_key !== 'string'
    ) {
      return null;
    }

    return message.data.data.message.global_key;
  }
}

describe('Connector listClients setup', () => {
  test('sets up every discovered client each time clients are listed', async (t: TestContext) => {
    const transport = new SetupAwareTransport();
    const connector = new Connector([transport]);

    const clients = await connector.listClients();

    t.assert.deepStrictEqual(clients.map(({ id }) => id).sort(), [
      ClientId.serialize('device under:test', 8901),
      ClientId.serialize('device under:test', 8902),
    ]);
    t.assert.deepStrictEqual(transport.setupRequests, [
      { key: 'enable_devtool', port: 8901 },
      { key: 'enable_devtool', port: 8902 },
      { key: 'enable_quickjs_debug', port: 8901 },
      { key: 'enable_quickjs_debug', port: 8902 },
    ]);

    await connector.listClients();

    t.assert.equal(transport.setupRequests.length, 8);
  });
});
