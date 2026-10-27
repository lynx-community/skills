// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import test from "node:test";
import { ClientId, Connector } from "../src/index.ts";
import type { Connection, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

class OpenPageTransport implements Transport {
  readonly requests: unknown[] = [];

  close(): Promise<void> {
    return Promise.resolve();
  }

  listDevices() {
    return Promise.resolve([{ id: "device", os: "Android" as const }]);
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
        output.enqueue(sessionList([{
          session_id: 42,
          type: "lynx",
          url: "lynx://example/new-page",
        }]) as TOutput);
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

class DelayedOpenPageTransport implements Transport {
  close(): Promise<void> {
    return Promise.resolve();
  }

  listDevices() {
    return Promise.resolve([{ id: "device", os: "Android" as const }]);
  }

  listAvailableApps() {
    return Promise.resolve([]);
  }

  openApp(): Promise<void> {
    return Promise.resolve();
  }

  connect<TInput, TOutput>({ signal }: TransportConnectOptions): Promise<Connection<TOutput, TInput>> {
    let output!: ReadableStreamDefaultController<TOutput>;
    let timer: NodeJS.Timeout | undefined;
    const readable = new ReadableStream<TOutput>({
      start(controller) {
        output = controller;
        const abort = () => {
          if (timer !== undefined) clearTimeout(timer);
          controller.error(signal?.reason);
        };
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) abort();
      },
    });
    const writable = new WritableStream<TInput>({
      async write() {
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            if (timer !== undefined) clearTimeout(timer);
            reject(signal?.reason);
          };
          timer = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
          }, 100);
          signal?.addEventListener("abort", abort, { once: true });
          if (signal?.aborted) abort();
        });
        output.enqueue(sessionList([{
          session_id: 43,
          type: "lynx",
          url: "lynx://example/delayed-page",
        }]) as TOutput);
      },
    });

    return Promise.resolve({
      readable,
      writable,
      async [Symbol.asyncDispose]() {
        if (timer !== undefined) clearTimeout(timer);
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
    event: "Customized",
    data: {
      type: "SessionList",
      data,
    },
  };
}

async function withShortConnectorTimeout<T>(run: () => Promise<T>): Promise<T> {
  const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  Object.defineProperty(AbortSignal, "timeout", {
    ...descriptor,
    value: (milliseconds: number) => timeout(milliseconds === 10_000 ? 20 : milliseconds),
  });
  try {
    return await run();
  } finally {
    if (descriptor) Object.defineProperty(AbortSignal, "timeout", descriptor);
  }
}

test("openPage ignores an uncorrelated empty SessionList before the new page plugs in", async (t) => {
  const transport = new OpenPageTransport();
  const connector = new Connector([transport]);

  const response = await connector.openPage(
    ClientId.serialize("device", 8901),
    "lynx://example/new-page",
  );

  t.assert.deepEqual(
    response,
    sessionList([{
      session_id: 42,
      type: "lynx",
      url: "lynx://example/new-page",
    }]),
  );
  t.assert.equal(transport.requests.length, 1);
});

test("sendListSessionMessage still reports a legitimate empty session snapshot", async (t) => {
  const connector = new Connector([new OpenPageTransport()]);

  const sessions = await connector.sendListSessionMessage(ClientId.serialize("device", 8901));

  t.assert.deepEqual(sessions, []);
});

test("openPage cancels a delayed SessionList when its caller deadline expires", async () => {
  const connector = new Connector([new DelayedOpenPageTransport()]);
  const controller = new AbortController();
  const reason = new Error("caller deadline expired");
  const pending = connector.openPage(
    ClientId.serialize("device", 8901),
    "lynx://example/delayed-page",
    controller.signal,
  );
  const deadline = setTimeout(() => controller.abort(reason), 20);

  try {
    await assert.rejects(pending, reason);
  } finally {
    clearTimeout(deadline);
  }
});

test("openPage uses its caller deadline instead of the shorter library default", async () => {
  await withShortConnectorTimeout(async () => {
    const connector = new Connector([new DelayedOpenPageTransport()]);
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 500);

    try {
      const response = await connector.openPage(
        ClientId.serialize("device", 8901),
        "lynx://example/delayed-page",
        controller.signal,
      );
      assert.deepEqual(
        response,
        sessionList([{
          session_id: 43,
          type: "lynx",
          url: "lynx://example/delayed-page",
        }]),
      );
    } finally {
      clearTimeout(deadline);
    }
  });
});

test("openPage keeps its library default deadline when no caller signal is supplied", async () => {
  await withShortConnectorTimeout(async () => {
    const connector = new Connector([new DelayedOpenPageTransport()]);

    await assert.rejects(
      connector.openPage(ClientId.serialize("device", 8901), "lynx://example/delayed-page"),
      { name: "TimeoutError" },
    );
  });
});
