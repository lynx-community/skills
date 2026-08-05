// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream, WritableStream } from 'node:stream/web';
import test from 'node:test';
import type {
  Connection,
  Transport,
} from '@lynx-js/devtool-connector/transport';
import { Command } from 'commander';
import { registerOpenCommand } from '../src/commands/open.ts';
import type { Context } from '../src/commands/utils.ts';

class FakeOpenTransport implements Transport {
  readonly requests: unknown[] = [];
  readonly sessionList = {
    event: 'Customized',
    data: {
      type: 'SessionList',
      data: [{ session_id: 7, url: 'lynx://example/page', type: 'lynx' }],
    },
  };

  async close(): Promise<void> {}

  async listDevices() {
    return [{ id: 'device', os: 'Android' as const }];
  }

  async listAvailableApps() {
    return [];
  }

  async openApp() {}

  async connect<TInput = unknown, TOutput = unknown>(): Promise<
    Connection<TOutput, TInput>
  > {
    let outputController:
      | { enqueue(chunk: unknown): void; close(): void }
      | undefined;
    const readable = new ReadableStream<unknown>({
      start(controller) {
        outputController = controller;
      },
    });

    const writable = new WritableStream<unknown>({
      write: (chunk) => {
        this.requests.push(chunk);
        outputController?.enqueue({
          event: 'Customized',
          data: { type: 'OpenCardAck', data: {} },
        });
        outputController?.enqueue(this.sessionList);
      },
    });

    return {
      readable: readable as ReadableStream<TOutput>,
      writable: writable as WritableStream<TInput>,
      async [Symbol.asyncDispose]() {
        try {
          outputController?.close();
        } catch {
          // Consumer cancellation may have already closed the readable side.
        }
      },
    };
  }
}

test('open resolves with SessionList after OpenCard', async (t) => {
  const transport = new FakeOpenTransport();
  const context: Context = { transports: [transport] };
  const program = new Command();
  const lines: string[] = [];
  program.exitOverride();
  registerOpenCommand(program, context);
  t.mock.method(console, 'log', (line: string) => {
    lines.push(line);
  });

  await program.parseAsync([
    'node',
    'test',
    'open',
    'lynx://example/page',
    '--client',
    'device:8901',
  ]);

  assert.equal(transport.requests.length, 1);
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]!), transport.sessionList);
});
