// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream, WritableStream } from 'node:stream/web';
import test from 'node:test';
import type { Connector } from '@lynx-js/devtool-connector';
import type {
  Connection,
  Transport,
} from '@lynx-js/devtool-connector/transport';
import { Command } from 'commander';
import {
  registerTakeContentScreenshotCommand,
  takeContentScreenshot,
} from '../src/commands/take-content-screenshot.ts';
import type { Context } from '../src/commands/utils.ts';

type CustomizedCDPRequest = {
  event: 'Customized';
  data: {
    data: {
      message: {
        id: number;
        method: string;
        params?: unknown;
      };
    };
  };
};

class FakeRuntimeTransport implements Transport {
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
        const params = request.data.data.message.params as {
          expression: string;
        };
        const isCleanup = params.expression.includes('delete globalThis');
        outputController?.enqueue({
          event: 'Customized',
          data: {
            type: 'CDP',
            data: {
              message: JSON.stringify({
                id: request.data.data.message.id,
                result: isCleanup
                  ? { result: { type: 'boolean', value: true } }
                  : {
                      result: {
                        type: 'string',
                        value: JSON.stringify({
                          status: 'success',
                          data: {
                            data: `data:image/png;base64,${Buffer.from('content screenshot').toString('base64')}`,
                            width: 120,
                            height: 640,
                          },
                        }),
                      },
                    },
              }),
            },
          },
        });
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

test('take-content-screenshot captures scroll content through Runtime.evaluate', async (t) => {
  const transport = new FakeRuntimeTransport();
  const context: Context = { transports: [transport] };
  const program = new Command();
  program.exitOverride();
  registerTakeContentScreenshotCommand(program, context);

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lynx-content-screenshot-'),
  );
  t.after(() => {
    void fs.rm(tempDir, { recursive: true, force: true });
  });
  const output = path.join(tempDir, 'content.png');

  await program.parseAsync([
    'node',
    'test',
    'take-content-screenshot',
    '--client',
    'device:1234',
    '--session',
    '7',
    '--selector',
    '#feed',
    '--format',
    'png',
    '--scale',
    '0.5',
    '--output',
    output,
  ]);

  const runtimeRequests = transport.requests.filter(
    (request) => request.data.data.message.method === 'Runtime.evaluate',
  );
  t.assert.equal(runtimeRequests.length, 2);
  const invocationParams = runtimeRequests[0]?.data.data.message.params as {
    expression: string;
    returnByValue: boolean;
  };
  const invocation = invocationParams.expression;
  t.assert.equal(invocationParams.returnByValue, true);
  t.assert.equal(
    invocation.match(/\(function\(\)\{var __a=globalThis\.multiApps/g)?.length,
    1,
  );
  t.assert.match(invocation, /createSelectorQuery\|\|lynx\.createSelector/);
  t.assert.match(invocation, /\.select\("#feed"\)\.invoke/);
  t.assert.match(invocation, /method:"takeContentScreenshot"/);
  t.assert.match(invocation, /params:\{format:"png",scale:0\.5\}/);
  t.assert.match(
    invocation,
    /success:function\(__data\)\{if\(globalThis\[__key\]\)/,
  );
  t.assert.match(invocation, /__task\.exec\(\)/);
  t.assert.match(invocation, /else if\(__usesSelectorQuery\)/);
  t.assert.match(
    (runtimeRequests[1]?.data.data.message.params as { expression: string })
      .expression,
    /delete globalThis/,
  );
  t.assert.equal(await fs.readFile(output, 'utf8'), 'content screenshot');
});

function createRuntimeConnector(
  handler: (expression: string, call: number) => unknown,
): Connector & { expressions: string[] } {
  const expressions: string[] = [];
  return {
    expressions,
    async sendCDPMessage(_clientId, _sessionId, method, params) {
      const expression = (params as { expression: string }).expression;
      expressions.push(expression);
      if (method !== 'Runtime.evaluate') {
        throw new Error(`Unexpected CDP method: ${method}`);
      }
      return handler(expression, expressions.length);
    },
  } as Connector & { expressions: string[] };
}

function runtimeState(state: unknown): unknown {
  return { result: { type: 'string', value: JSON.stringify(state) } };
}

test('takeContentScreenshot polls pending state and cleans up its global key', async (t) => {
  const connector = createRuntimeConnector((expression) => {
    if (expression.includes('delete globalThis')) {
      return { result: { type: 'boolean', value: true } };
    }
    if (expression.includes('takeContentScreenshot')) {
      return runtimeState({ status: 'pending' });
    }
    return runtimeState({
      status: 'success',
      data: {
        data: 'data:image/jpeg;base64,c2NyZWVuc2hvdA==',
        width: 80,
        height: 300,
      },
    });
  });

  const result = await takeContentScreenshot(
    connector,
    'client',
    7,
    '#scroll"quoted',
    {
      format: 'jpeg',
      scale: 1,
      pollIntervalMs: 0,
      timeoutMs: 1_000,
      waitForPoll: async () => {},
      stateKey: '__test_content_screenshot',
    },
  );

  t.assert.equal(result.width, 80);
  t.assert.equal(connector.expressions.length, 3);
  t.assert.match(connector.expressions[0]!, /\.select\("#scroll\\"quoted"\)/);
  t.assert.match(connector.expressions[1]!, /JSON\.stringify\(globalThis/);
  t.assert.match(connector.expressions[2]!, /delete globalThis/);
});

test('takeContentScreenshot explains when the selector matches no node and still cleans up', async (t) => {
  const connector = createRuntimeConnector((expression) => {
    if (expression.includes('delete globalThis')) {
      return { result: { type: 'boolean', value: true } };
    }
    return runtimeState({
      status: 'error',
      error: { code: 2, data: "no node found for selector '.missing'" },
    });
  });

  await t.assert.rejects(
    () =>
      takeContentScreenshot(connector, 'client', 7, '.missing', {
        format: 'png',
        scale: 1,
        stateKey: '__test_content_screenshot',
      }),
    /\[code 2 NODE_NOT_FOUND\].*No node matched the selector\..*Runtime detail: no node found for selector/u,
  );
  t.assert.match(connector.expressions.at(-1)!, /delete globalThis/);
});

test('takeContentScreenshot explains when the matched node does not support the UI method', async (t) => {
  const connector = createRuntimeConnector((expression) => {
    if (expression.includes('delete globalThis')) {
      return { result: { type: 'boolean', value: true } };
    }
    return runtimeState({ status: 'error', error: { code: 3 } });
  });

  await t.assert.rejects(
    () =>
      takeContentScreenshot(connector, 'client', 7, 'view', {
        format: 'png',
        scale: 1,
        stateKey: '__test_content_screenshot',
      }),
    /\[code 3 METHOD_NOT_FOUND\].*does not support takeContentScreenshot.*targets a <scroll-view>/u,
  );
  t.assert.match(connector.expressions.at(-1)!, /delete globalThis/);
});

test('takeContentScreenshot times out while the UI method is pending', async (t) => {
  const connector = createRuntimeConnector((expression) => {
    if (expression.includes('delete globalThis')) {
      return { result: { type: 'boolean', value: true } };
    }
    return runtimeState({ status: 'pending' });
  });

  await t.assert.rejects(
    () =>
      takeContentScreenshot(connector, 'client', 7, 'list', {
        format: 'jpeg',
        scale: 1,
        timeoutMs: 0,
        stateKey: '__test_content_screenshot',
      }),
    /Timed out waiting for takeContentScreenshot/,
  );
  t.assert.match(connector.expressions.at(-1)!, /delete globalThis/);
});
