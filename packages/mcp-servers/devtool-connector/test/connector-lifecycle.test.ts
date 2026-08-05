// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream, WritableStream } from 'node:stream/web';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { ClientId, Connector } from '../src/index.ts';
import type {
  App,
  Client,
  Connection,
  Device,
  Transport,
} from '../src/transport/transport.ts';

test('Connector.sendMessage waits for input write before disposing connection', async () => {
  const writeStarted = deferred<void>();
  const writeFinished = deferred<void>();
  const responseQueued = deferred<void>();

  let writeSettled = false;
  let disposedBeforeWriteSettled = false;

  class DelayedWriteTransport implements Transport {
    close(): Promise<void> {
      return Promise.resolve();
    }

    listDevices(): Promise<Device[]> {
      return Promise.resolve([{ id: 'device-1', os: 'Android' }]);
    }

    listAvailableApps(): Promise<App[]> {
      return Promise.resolve([]);
    }

    openApp(): Promise<void> {
      return Promise.resolve();
    }

    async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
      const readable = new ReadableStream<TOutput>({
        async start(controller) {
          await writeStarted.promise;
          controller.enqueue('response' as TOutput);
          responseQueued.resolve();
        },
      });

      const writable = new WritableStream<TInput>({
        async write() {
          writeStarted.resolve();
          await writeFinished.promise;
          writeSettled = true;
        },
      });

      return {
        readable,
        writable,
        async [Symbol.asyncDispose]() {
          disposedBeforeWriteSettled ||= !writeSettled;
        },
      };
    }

    listClients(): Promise<Client[]> {
      return Promise.resolve([]);
    }
  }

  const connector = new Connector([new DelayedWriteTransport()]);
  const resultPromise = connector.sendMessage<string, string>(
    ClientId.serialize('device-1', 8901),
    'request',
  );

  await responseQueued.promise;

  let settledBeforeWriteFinished = false;
  resultPromise.then(
    () => {
      settledBeforeWriteFinished = true;
    },
    () => {
      settledBeforeWriteFinished = true;
    },
  );
  await sleep(10);

  assert.equal(settledBeforeWriteFinished, false);

  writeFinished.resolve();
  assert.equal(await resultPromise, 'response');
  assert.equal(disposedBeforeWriteSettled, false);
});

test('Connector.sendMessage preserves input write failures', async () => {
  const writeFailure = new Error('sentinel input write failure');
  await assertInputWriteFailurePreserved(writeFailure);
});

test('Connector.sendMessage does not let cleanup failures replace input write failures', async () => {
  const writeFailure = new Error('sentinel input write failure');
  const disposeFailure = new Error('sentinel dispose failure');
  await assertInputWriteFailurePreserved(writeFailure, disposeFailure);
});

test('Connector.sendMessage preserves transport AbortErrors', async () => {
  const transportAbort = new DOMException('transport aborted', 'AbortError');
  await assertInputWriteFailurePreserved(transportAbort);
});

test('Connector.sendStream cleanup preserves a delivered response', async () => {
  let readableCanceled = false;

  class CancellableReadableTransport implements Transport {
    close(): Promise<void> {
      return Promise.resolve();
    }

    listDevices(): Promise<Device[]> {
      return Promise.resolve([{ id: 'device-1', os: 'Android' }]);
    }

    listAvailableApps(): Promise<App[]> {
      return Promise.resolve([]);
    }

    openApp(): Promise<void> {
      return Promise.resolve();
    }

    async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
      const readable = new ReadableStream<TOutput>({
        start(controller) {
          controller.enqueue('response' as TOutput);
        },
        cancel() {
          readableCanceled = true;
        },
      });

      const writable = new WritableStream<TInput>();

      return {
        readable,
        writable,
        async [Symbol.asyncDispose]() {},
      };
    }
  }

  const input = new ReadableStream<string>({
    start(controller) {
      controller.enqueue('request');
    },
  });
  const connector = new Connector([new CancellableReadableTransport()]);
  const stream = await connector.sendStream<string, string>(
    ClientId.serialize('device-1', 8901),
    input,
  );

  try {
    const reader = stream.getReader();
    try {
      const first = await reader.read();
      assert.deepEqual(first, { done: false, value: 'response' });
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  } finally {
    await stream[Symbol.asyncDispose]();
  }

  assert.equal(readableCanceled, true);
});

async function assertInputWriteFailurePreserved(
  writeFailure: Error,
  disposeFailure?: Error,
) {
  const writeAttempted = deferred<void>();
  let disposeCount = 0;
  let outputCanceled = false;

  class RejectingWriteTransport implements Transport {
    close(): Promise<void> {
      return Promise.resolve();
    }

    listDevices(): Promise<Device[]> {
      return Promise.resolve([{ id: 'device-1', os: 'Android' }]);
    }

    listAvailableApps(): Promise<App[]> {
      return Promise.resolve([]);
    }

    openApp(): Promise<void> {
      return Promise.resolve();
    }

    async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
      return {
        readable: new ReadableStream<TOutput>({
          cancel() {
            outputCanceled = true;
          },
        }),
        writable: new WritableStream<TInput>({
          write() {
            writeAttempted.resolve();
            throw writeFailure;
          },
        }),
        async [Symbol.asyncDispose]() {
          disposeCount += 1;
          if (disposeFailure) {
            throw disposeFailure;
          }
        },
      };
    }
  }

  const connector = new Connector([new RejectingWriteTransport()]);
  const resultPromise = connector.sendMessage<string, string>(
    ClientId.serialize('device-1', 8901),
    'request',
  );
  await writeAttempted.promise;

  await assert.rejects(resultPromise, (error) => error === writeFailure);
  assert.equal(outputCanceled, true);
  assert.equal(disposeCount, 1);
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
