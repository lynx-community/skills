// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream, WritableStream } from 'node:stream/web';
import test from 'node:test';
import { ClientId, Connector } from '../src/index.ts';
import type { Connection, Transport } from '../src/transport/transport.ts';

class OpenPageTransport implements Transport {
  readonly requests: unknown[] = [];

  close(): Promise<void> {
    return Promise.resolve();
  }

  listDevices() {
    return Promise.resolve([{ id: 'device', os: 'Android' as const }]);
  }

  listAvailableApps() {
    return Promise.resolve([]);
  }

  openApp(): Promise<void> {
    return Promise.resolve();
  }

  connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
    let output!: ReadableStreamDefaultController<TOutput>;
    const readable = new ReadableStream<TOutput>({
      start(controller) {
        output = controller;
      },
    });
    const writable = new WritableStream<TInput>({
      write: (request) => {
        this.requests.push(request);
        output.enqueue(sessionList([]) as TOutput);
        output.enqueue(
          sessionList([
            {
              session_id: 42,
              type: 'lynx',
              url: 'lynx://example/new-page',
            },
          ]) as TOutput,
        );
      },
    });

    return Promise.resolve({
      readable,
      writable,
      async [Symbol.asyncDispose]() {
        try {
          output.close();
        } catch {
          // The connector may already have canceled the readable side.
        }
      },
    });
  }
}

function sessionList(data: unknown[]) {
  return {
    event: 'Customized',
    data: {
      type: 'SessionList',
      data,
    },
  };
}

test('openPage ignores an uncorrelated empty SessionList before the new page plugs in', async (t) => {
  const transport = new OpenPageTransport();
  const connector = new Connector([transport]);

  const response = await connector.openPage(
    ClientId.serialize('device', 8901),
    'lynx://example/new-page',
  );

  t.assert.deepEqual(
    response,
    sessionList([
      {
        session_id: 42,
        type: 'lynx',
        url: 'lynx://example/new-page',
      },
    ]),
  );
  t.assert.equal(transport.requests.length, 1);
});

test('sendListSessionMessage still reports a legitimate empty session snapshot', async (t) => {
  const connector = new Connector([new OpenPageTransport()]);

  const sessions = await connector.sendListSessionMessage(
    ClientId.serialize('device', 8901),
  );

  t.assert.deepEqual(sessions, []);
});
