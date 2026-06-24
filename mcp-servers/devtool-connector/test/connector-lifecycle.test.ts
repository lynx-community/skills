// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { ClientId, Connector } from "../src/index.ts";
import type { App, Client, Connection, Device, Transport } from "../src/transport/transport.ts";

test("Connector.sendMessage waits for input write before disposing connection", async () => {
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
      return Promise.resolve([{ id: "device-1", os: "Android" }]);
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
          controller.enqueue("response" as TOutput);
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
    ClientId.serialize("device-1", 8901),
    "request",
  );

  await responseQueued.promise;

  let settledBeforeWriteFinished = false;
  resultPromise.then(() => {
    settledBeforeWriteFinished = true;
  }, () => {
    settledBeforeWriteFinished = true;
  });
  await sleep(10);

  assert.equal(settledBeforeWriteFinished, false);

  writeFinished.resolve();
  assert.equal(await resultPromise, "response");
  assert.equal(disposedBeforeWriteSettled, false);
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
