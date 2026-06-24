// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream, WritableStream } from 'node:stream/web';
import type { TestContext } from 'node:test';
import { describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { ClientId, Connector } from '../src/index.ts';
import { DaemonTransport } from '../src/transport/daemon.ts';
import type { Connection, Transport } from '../src/transport/transport.ts';

class SlowDaemonSessionTransport extends DaemonTransport {
  readonly #deviceId = 'device under:test';
  connectCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    await sleep(10);
    return [{ id: this.#deviceId, os: 'Android' as const }];
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
          event: 'Customized',
          data: {
            type: 'SessionList',
            data: [
              {
                session_id: 101,
                type: 'lynx',
                url: 'https://example.test/session/101',
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
    return (
      typeof message === 'object' &&
      message !== null &&
      'event' in message &&
      message.event === 'Customized' &&
      'data' in message &&
      typeof message.data === 'object' &&
      message.data !== null &&
      'type' in message.data &&
      message.data.type === 'ListSession'
    );
  }
}

class FastDirectNoResponseTransport implements Transport {
  readonly #deviceId = 'device under:test';
  connectCalls = 0;

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: this.#deviceId, os: 'Android' as const }];
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

describe('Connector transport selection', () => {
  test('prefers daemon transports over other transports for the same device', async (t: TestContext) => {
    const daemonTransport = new SlowDaemonSessionTransport();
    const directTransport = new FastDirectNoResponseTransport();
    const connector = new Connector([directTransport, daemonTransport]);

    const sessions = await connector.sendListSessionMessage(
      ClientId.serialize('device under:test', 8901),
    );

    t.assert.deepStrictEqual(sessions, [
      {
        session_id: 101,
        type: 'lynx',
        url: 'https://example.test/session/101',
      },
    ]);
    t.assert.equal(daemonTransport.connectCalls, 1);
    t.assert.equal(directTransport.connectCalls, 0);
  });
});
