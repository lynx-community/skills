// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream, WritableStream } from 'node:stream/web';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import type {
  Connection,
  Transport,
} from '@lynx-js/devtool-connector/transport';
import { Command } from 'commander';
import { registerTakeScreenshotCommand } from '../src/commands/take-screenshot.ts';
import type { Context } from '../src/commands/utils.ts';

type CustomizedCDPRequest = {
  event: 'Customized';
  data: {
    data: {
      message: {
        method: string;
        params?: unknown;
      };
    };
  };
};

class FakeTransport implements Transport {
  readonly requests: CustomizedCDPRequest[] = [];

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
        const request = chunk as CustomizedCDPRequest;
        this.requests.push(request);

        if (request.data.data.message.method === 'Page.startScreencast') {
          outputController?.enqueue({
            event: 'Customized',
            data: {
              type: 'CDP',
              data: {
                message: JSON.stringify({
                  method: 'Page.screencastFrame',
                  params: {
                    data: Buffer.from('screenshot').toString('base64'),
                    sessionId: 42,
                  },
                }),
              },
            },
          });
        }
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

test('take-screenshot acks the captured frame without stopping screencast', async (t) => {
  const transport = new FakeTransport();
  const context: Context = { transports: [transport] };
  const program = new Command();
  program.exitOverride();
  registerTakeScreenshotCommand(program, context);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lynx-screenshot-'));
  t.after(() => {
    void fs.rm(tempDir, { recursive: true, force: true });
  });
  const output = path.join(tempDir, 'screenshot.jpeg');

  await program.parseAsync([
    'node',
    'test',
    'take-screenshot',
    '--client',
    'device:1234',
    '--session',
    '7',
    '--output',
    output,
  ]);
  await setTimeout(0);

  const methods = transport.requests.map(
    (request) => request.data.data.message.method,
  );
  t.assert.deepEqual(methods, [
    'Page.startScreencast',
    'Page.screencastFrameAck',
  ]);
  t.assert.equal(methods.includes('Page.stopScreencast'), false);
  t.assert.equal(transport.requests[1]?.data.data.message.params, undefined);
  t.assert.equal(await fs.readFile(output, 'utf8'), 'screenshot');
});
