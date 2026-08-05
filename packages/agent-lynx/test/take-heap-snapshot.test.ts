// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream, WritableStream } from 'node:stream/web';
import test from 'node:test';
import type {
  Connection,
  Transport,
} from '@lynx-js/devtool-connector/transport';
import { Command } from 'commander';
import { registerTakeHeapSnapshotCommand } from '../src/commands/take-heap-snapshot.ts';
import type { Context } from '../src/commands/utils.ts';

type CustomizedCDPRequest = {
  event: 'Customized';
  data: {
    data: {
      message: {
        id: number;
        method: string;
      };
    };
  };
};

class FakeHeapSnapshotTransport implements Transport {
  readonly #chunks: readonly string[];
  readonly #failureAfterChunks: Error | undefined;
  readonly methods: string[] = [];

  constructor(chunks: readonly string[], failureAfterChunks?: Error) {
    this.#chunks = chunks;
    this.#failureAfterChunks = failureAfterChunks;
  }

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
    let outputController: ReadableStreamDefaultController<unknown> | undefined;
    const readable = new ReadableStream<unknown>({
      start(controller) {
        outputController = controller;
      },
    });

    const writable = new WritableStream<unknown>({
      write: (chunk) => {
        const request = chunk as CustomizedCDPRequest;
        const { id, method } = request.data.data.message;
        this.methods.push(method);

        if (method !== 'HeapProfiler.takeHeapSnapshot') {
          return;
        }

        for (const snapshotChunk of this.#chunks) {
          outputController?.enqueue(
            cdpMessage({
              method: 'HeapProfiler.addHeapSnapshotChunk',
              params: { chunk: snapshotChunk },
            }),
          );
        }
        if (this.#failureAfterChunks) {
          outputController?.error(this.#failureAfterChunks);
          return;
        }
        outputController?.enqueue(cdpMessage({ id, result: {} }));
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

function cdpMessage(message: unknown) {
  return {
    event: 'Customized',
    data: {
      type: 'CDP',
      data: { message: JSON.stringify(message) },
    },
  };
}

test('take-heap-snapshot streams chunks to an atomically published file', async (t) => {
  const firstChunk = '{"snapshot":{"streamed":true},';
  const secondChunk = '"strings":["large-snapshot"]}';
  const transport = new FakeHeapSnapshotTransport([firstChunk, secondChunk]);
  const context: Context = { transports: [transport] };
  const program = new Command();
  program.exitOverride();
  registerTakeHeapSnapshotCommand(program, context);

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lynx-heap-snapshot-'),
  );
  t.after(() => {
    void fs.rm(tempDir, { recursive: true, force: true });
  });
  const output = path.join(tempDir, 'snapshot.heapsnapshot');
  const originalJoin = Array.prototype.join;

  t.mock.method(console, 'log', () => {});
  Array.prototype.join = function patchedJoin(
    this: unknown,
    separator?: string,
  ) {
    if (
      Array.isArray(this) &&
      this.some((value) => value === firstChunk || value === secondChunk)
    ) {
      throw new Error('heap snapshot chunks must not be joined in memory');
    }
    return originalJoin.call(this, separator);
  } as typeof Array.prototype.join;

  try {
    await program.parseAsync([
      'node',
      'test',
      'take-heap-snapshot',
      '--client',
      'device:8901',
      '--session',
      '7',
      '--output',
      output,
    ]);
  } finally {
    Array.prototype.join = originalJoin;
  }

  t.assert.deepEqual(transport.methods, [
    'HeapProfiler.enable',
    'HeapProfiler.takeHeapSnapshot',
  ]);
  t.assert.equal(await fs.readFile(output, 'utf8'), firstChunk + secondChunk);
  t.assert.deepEqual(await fs.readdir(tempDir), ['snapshot.heapsnapshot']);
});

test('take-heap-snapshot preserves the previous output when streaming fails', async (t) => {
  const streamFailure = new Error('snapshot stream failed');
  const transport = new FakeHeapSnapshotTransport(
    ['partial snapshot'],
    streamFailure,
  );
  const context: Context = { transports: [transport] };
  const program = new Command();
  program.exitOverride();
  registerTakeHeapSnapshotCommand(program, context);

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lynx-heap-snapshot-failure-'),
  );
  t.after(() => {
    void fs.rm(tempDir, { recursive: true, force: true });
  });
  const output = path.join(tempDir, 'snapshot.heapsnapshot');
  await fs.writeFile(output, 'previous snapshot');

  await t.assert.rejects(
    program.parseAsync([
      'node',
      'test',
      'take-heap-snapshot',
      '--client',
      'device:8901',
      '--session',
      '7',
      '--output',
      output,
    ]),
    (error) => error === streamFailure,
  );

  t.assert.equal(await fs.readFile(output, 'utf8'), 'previous snapshot');
  t.assert.deepEqual(await fs.readdir(tempDir), ['snapshot.heapsnapshot']);
});
