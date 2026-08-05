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
import { requireNumericPort } from '../src/transport/transport.ts';

class SetupAwareTransport implements Transport {
  readonly #deviceId = 'device under:test';
  readonly #failRegisterPorts: Set<number>;
  readonly #failSetup: { key: string; port: number } | undefined;
  readonly #onSetupRequest:
    | ((key: string, port: number) => boolean | undefined)
    | undefined;
  readonly #ports = [8901, 8902];
  readonly messagesByConnection = new Map<
    number,
    { kind: string; port: number }[]
  >();
  readonly setupRequests: { key: string; value: boolean; port: number }[] = [];
  connectCalls = 0;
  disposeCalls = 0;

  constructor(
    options: {
      failRegisterPorts?: number[];
      failSetup?: { key: string; port: number };
      onSetupRequest?: (key: string, port: number) => boolean | undefined;
    } = {},
  ) {
    this.#failRegisterPorts = new Set(options.failRegisterPorts);
    this.#failSetup = options.failSetup;
    this.#onSetupRequest = options.onSetupRequest;
  }

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
    const connectionId = ++this.connectCalls;
    const dispose = () => {
      this.disposeCalls += 1;
      options.signal?.removeEventListener('abort', abortHandler);
      closeReadable?.();
    };
    const abortHandler = () => closeReadable?.();
    options.signal?.addEventListener('abort', abortHandler, { once: true });
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
        const port = requireNumericPort(options.port);
        if (this.#isExpectedInitialize(chunk, port)) {
          messages.push({ kind: 'Initialize', port });
          if (this.#failRegisterPorts.has(port)) {
            closeReadable?.();
          } else {
            enqueueResponse?.(this.#createRegisterResponse(port));
          }
          return;
        }

        const setupRequest = this.#getSetGlobalSwitchRequest(chunk);
        if (setupRequest) {
          messages.push({ kind: setupRequest.key, port });
          this.setupRequests.push({ ...setupRequest, port });
          if (this.#onSetupRequest?.(setupRequest.key, port) === false) {
            return;
          }
          if (
            this.#failSetup?.port === port &&
            this.#failSetup.key === setupRequest.key
          ) {
            closeReadable?.();
            return;
          }
          enqueueResponse?.({
            event: 'Customized',
            data: {
              type: 'SetGlobalSwitch',
              data: {
                client_id: port,
                session_id: -1,
                message: 'ok',
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

  #getSetGlobalSwitchRequest(
    message: unknown,
  ): { key: string; value: boolean } | null {
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
      typeof message.data.data.message.global_key !== 'string' ||
      !('global_value' in message.data.data.message) ||
      typeof message.data.data.message.global_value !== 'boolean'
    ) {
      return null;
    }

    return {
      key: message.data.data.message.global_key,
      value: message.data.data.message.global_value,
    };
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
      { key: 'enable_devtool', value: true, port: 8901 },
      { key: 'enable_devtool', value: true, port: 8902 },
      { key: 'enable_quickjs_debug', value: true, port: 8901 },
      { key: 'enable_quickjs_debug', value: true, port: 8902 },
      { key: 'enable_pixel_copy', value: false, port: 8901 },
      { key: 'enable_pixel_copy', value: false, port: 8902 },
    ]);
    t.assert.equal(
      transport.connectCalls,
      10,
      'one scan should open one connection per probed port',
    );
    t.assert.equal(transport.disposeCalls, 10);
    for (const port of [8901, 8902]) {
      t.assert.deepStrictEqual(
        [...transport.messagesByConnection.values()].filter((messages) =>
          messages.some((message) => message.port === port),
        ),
        [
          [
            { kind: 'Initialize', port },
            { kind: 'enable_devtool', port },
            { kind: 'enable_quickjs_debug', port },
            { kind: 'enable_pixel_copy', port },
          ],
        ],
        `port ${port} should use one connection generation for discovery and setup`,
      );
    }

    await connector.listClients();

    t.assert.equal(transport.setupRequests.length, 12);
    t.assert.equal(transport.connectCalls, 20);
    t.assert.equal(transport.disposeCalls, 20);
  });

  test('publishes a client only after both setup acknowledgments', async (t) => {
    for (const key of ['enable_devtool', 'enable_quickjs_debug']) {
      const transport = new SetupAwareTransport({
        failRegisterPorts: [8902],
        failSetup: { key, port: 8901 },
      });

      const clients = await new Connector([transport]).listClients();

      t.assert.deepStrictEqual(
        clients,
        [],
        `${key} failure must not publish the client`,
      );
      t.assert.equal(transport.connectCalls, 10);
      t.assert.equal(transport.disposeCalls, 10);
    }
  });

  test('keeps clients that do not support the optional pixel copy setup', async (t) => {
    const transport = new SetupAwareTransport({
      failRegisterPorts: [8902],
      failSetup: { key: 'enable_pixel_copy', port: 8901 },
    });

    const clients = await new Connector([transport]).listClients();

    t.assert.deepStrictEqual(
      clients.map(({ id }) => id),
      [ClientId.serialize('device under:test', 8901)],
    );
    t.assert.deepStrictEqual(transport.setupRequests, [
      { key: 'enable_devtool', value: true, port: 8901 },
      { key: 'enable_quickjs_debug', value: true, port: 8901 },
      { key: 'enable_pixel_copy', value: false, port: 8901 },
    ]);
  });

  test('does not let the completed discovery deadline abort setup', async (t) => {
    const discovery = new AbortController();
    const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
    t.mock.method(AbortSignal, 'timeout', (delay: number) =>
      delay === 5_000 ? discovery.signal : originalTimeout(delay),
    );
    const transport = new SetupAwareTransport({
      failRegisterPorts: [8902],
      onSetupRequest(key, port) {
        if (key === 'enable_devtool' && port === 8901) discovery.abort();
      },
    });

    const clients = await new Connector([transport]).listClients();

    t.assert.deepStrictEqual(
      clients.map(({ id }) => id),
      [ClientId.serialize('device under:test', 8901)],
    );
    t.assert.deepStrictEqual(transport.setupRequests, [
      { key: 'enable_devtool', value: true, port: 8901 },
      { key: 'enable_quickjs_debug', value: true, port: 8901 },
      { key: 'enable_pixel_copy', value: false, port: 8901 },
    ]);
  });

  test('setup deadline interrupts a pending response without publishing the client', async (t) => {
    const discovery = new AbortController();
    const setup = new AbortController();
    const setupRequested = Promise.withResolvers<void>();
    const setupAborted = Promise.withResolvers<void>();
    t.mock.method(AbortSignal, 'timeout', (delay: number) =>
      delay === 5_000 ? discovery.signal : setup.signal,
    );
    const transport = new SetupAwareTransport({
      failRegisterPorts: [8902],
      onSetupRequest(key, port) {
        if (key === 'enable_devtool' && port === 8901) {
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

async function settlesBeforeImmediate(
  promise: Promise<unknown>,
): Promise<boolean> {
  return await Promise.race([
    promise.then(
      () => true,
      () => true,
    ),
    new Promise<false>((resolve) => setImmediate(() => resolve(false))),
  ]);
}
