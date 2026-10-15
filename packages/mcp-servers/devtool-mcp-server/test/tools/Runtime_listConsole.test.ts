// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { test, type TestContext } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { ListConsole } from '../../src/tools/Runtime/ListConsole.ts';
import { createToolContext } from '../utils/testTool.ts';

interface Request {
  id: number;
  method: string;
  sessionId?: string;
}

async function flush(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve));
}

async function startConsole(options: {
  includeStackTraces?: boolean;
  level?: Array<'log' | 'info' | 'warning' | 'error'>;
  offset?: number;
  limit?: number;
} = {}) {
  const ready = Promise.withResolvers<void>();
  const requests: Request[] = [];
  let controller: ReadableStreamDefaultController<unknown>;
  let cancelled = 0;
  let disposed = 0;
  let settled = false;
  const stream = new ReadableStream<unknown>({
    start(value) {
      controller = value;
    },
    cancel() {
      cancelled++;
    },
  });
  const connector = {
    async sendCDPStream(
      _client: string,
      _session: number,
      input: ReadableStream<Request>,
    ) {
      for await (const request of input) requests.push(request);
      ready.resolve();
      return Object.assign(stream, {
        async [Symbol.asyncDispose]() {
          disposed++;
        },
      });
    },
  };
  const { call } = createToolContext(
    ListConsole,
    connector as never,
    'test-device:8901',
    1,
  );
  const result = call<unknown>(options);
  void result.then(() => settled = true, () => settled = true);
  await ready.promise;
  await flush();
  return {
    requests,
    result,
    stream,
    emit(message: unknown) {
      controller.enqueue(message);
    },
    close() {
      controller.close();
    },
    error(reason: Error) {
      controller.error(reason);
    },
    status: () => ({ cancelled, disposed, settled }),
  };
}

function consoleMessage(text: string) {
  return {
    method: 'Runtime.consoleAPICalled',
    params: { type: 'log', args: [{ value: text }] },
  };
}

test('ListConsole prints cached event timestamps for both threads and preserves error details', async () => {
  const console = await startConsole();
  console.emit({
    method: 'Runtime.consoleAPICalled',
    params: {
      type: 'log',
      timestamp: 1_700_000_000_123,
      args: [{ value: 'cached background log' }],
    },
  });
  console.emit({
    method: 'Runtime.consoleAPICalled',
    params: {
      type: 'error',
      timestamp: 0,
      consoleTag: 'Lepus',
      args: [{ objectId: 'object-1', description: 'Error: boom' }],
      stackTrace: {
        callFrames: [{ url: 'main.js', lineNumber: 2, columnNumber: 3 }],
      },
    },
  });
  console.close();
  assert.equal(
    await console.result,
    [
      '[22:13:20.123Z] [log/background] cached background log',
      '[00:00:00.000Z] [error/main-thread] <Error: boom (objectId:object-1)>',
      '    at main.js:2:3',
    ].join('\n'),
  );
});

test('ListConsole tolerates missing and invalid timestamps', async () => {
  const console = await startConsole();
  const timestamps = [
    undefined,
    null,
    '1700000000123',
    Number.NaN,
    Infinity,
    8.64e15 + 1,
  ];
  for (const [index, timestamp] of timestamps.entries()) {
    console.emit({
      method: 'Runtime.consoleAPICalled',
      params: { type: 'log', timestamp, args: [{ value: `message-${index}` }] },
    });
  }
  console.close();
  assert.equal(
    await console.result,
    timestamps.map((_, index) => `[log/background] message-${index}`).join(
      '\n',
    ),
  );
});

test('ListConsole retains the selected event timestamp after level, offset and limit filters', async () => {
  const console = await startConsole({
    level: ['warning'],
    offset: 1,
    limit: 1,
  });
  console.emit({ method: 'Debugger.scriptParsed', params: {} });
  for (
    const [index, type] of ['log', 'warning', 'warning', 'warning'].entries()
  ) {
    console.emit({
      method: 'Runtime.consoleAPICalled',
      params: {
        type,
        timestamp: 1_700_000_000_123 + index,
        args: [{ value: `message-${index}` }],
        stackTrace: {
          callFrames: [{
            url: 'background.js',
            lineNumber: 1,
            columnNumber: 0,
          }],
        },
      },
    });
  }
  assert.equal(
    await console.result,
    '[22:13:20.125Z] [warning/background] message-2',
  );
  assert.deepEqual(console.status(), {
    cancelled: 1,
    disposed: 1,
    settled: true,
  });
});

test('ListConsole waits for every enable response before applying its idle timeout', async () => {
  const console = await startConsole();
  assert.deepEqual(
    console.requests.map(({ method, sessionId }) => ({ method, sessionId })),
    [
      { method: 'Page.enable', sessionId: undefined },
      { method: 'Runtime.enable', sessionId: undefined },
      { method: 'Runtime.enable', sessionId: 'Main' },
    ],
  );
  console.emit({ id: console.requests[0]!.id, result: {} });
  console.emit({ id: -1, result: {} });
  await flush();

  await delay(800);
  assert.equal(
    console.status().settled,
    false,
    'pending enable responses must keep the stream open',
  );
  assert.equal(new Set(console.requests.map(request => request.id)).size, 3);
  console.emit(consoleMessage('late-console-marker'));
  for (const request of console.requests.slice(1)) {
    console.emit({ id: request.id, result: {} });
  }
  assert.match(await console.result as string, /late-console-marker/u);
  assert.deepEqual(console.status(), {
    cancelled: 1,
    disposed: 1,
    settled: true,
  });
  assert.equal(console.stream.locked, false);
});

test('ListConsole still finishes after enabling is acknowledged and the console becomes idle', async () => {
  const console = await startConsole();
  for (const request of console.requests) {
    console.emit({ id: request.id, result: {} });
  }
  await console.result;
  assert.deepEqual(console.status(), {
    cancelled: 1,
    disposed: 1,
    settled: true,
  });
});

test(
  'ListConsole preserves the five-second deadline when enable never responds',
  { timeout: 10_000 },
  async () => {
    const console = await startConsole();
    await delay(800);
    assert.equal(
      console.status().settled,
      false,
      'silence during setup must not use the console idle cutoff',
    );
    await console.result;
    assert.deepEqual(console.status(), {
      cancelled: 1,
      disposed: 1,
      settled: true,
    });
    assert.equal(console.stream.locked, false);
  },
);

test(
  'ListConsole bounds an active console by the same five-second deadline',
  { timeout: 10_000 },
  async (t: TestContext) => {
    const console = await startConsole();
    for (const request of console.requests) {
      console.emit({ id: request.id, result: {} });
    }
    const interval = setInterval(
      () => console.emit(consoleMessage('active-console')),
      100,
    );
    t.after(() => clearInterval(interval));
    assert.match(await console.result as string, /active-console/u);
    assert.deepEqual(console.status(), {
      cancelled: 1,
      disposed: 1,
      settled: true,
    });
  },
);

test('ListConsole releases its reader and connection when the stream fails', async () => {
  const console = await startConsole();
  const failure = new Error('device disconnected');
  const rejected = assert.rejects(console.result, failure);
  console.error(failure);
  await rejected;
  assert.equal(console.status().disposed, 1);
  assert.equal(console.stream.locked, false);
});
