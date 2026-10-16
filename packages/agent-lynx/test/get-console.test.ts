// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { test, type TestContext } from 'node:test';
import { registerGetConsoleCommand } from '../src/commands/get-console.ts';
import { createProgram, type CreateProgramOptions } from '../src/devtool.ts';
import { MonitorCode, withTelemetry } from '../src/telemetry.ts';

function consoleEvent(params: Record<string, unknown>) {
  return { method: 'Runtime.consoleAPICalled', params };
}

async function captureConsole(
  t: TestContext,
  messages: unknown[],
  options: string[],
  rootOptions?: CreateProgramOptions,
  globalOptions: string[] = [],
) {
  const stream = ReadableStream.from(messages);
  let disposed = 0;
  t.mock.method(
    Connector.prototype,
    'sendCDPStream',
    async () =>
      Object.assign(stream, {
        async [Symbol.asyncDispose]() {
          disposed++;
        },
      }),
  );
  const output: string[] = [];
  t.mock.method(console, 'log', (line: string) => output.push(line));
  const program = rootOptions
    ? createProgram(rootOptions).exitOverride()
    : new Command().exitOverride();
  if (!rootOptions) registerGetConsoleCommand(program, { transports: [] });
  await program.parseAsync([
    'node',
    'test',
    ...globalOptions,
    'get-console',
    '--client',
    'test-device:8901',
    '--session',
    '7',
    ...options,
  ]);
  assert.equal(disposed, 1, 'the console stream should be disposed');
  assert.equal(stream.locked, false, 'the console reader should be released');
  return output.join('\n');
}

for (const watch of [false, true]) {
  const mode = watch ? 'watch' : 'one-shot';
  const options = watch ? ['--watch'] : [];

  test(`get-console ${mode} JSON preserves complete event params, stack traces and argument metadata`, async (t) => {
    const params = [
      {
        type: 'log',
        timestamp: 1_700_000_000_123,
        executionContextId: 2,
        viewId: 7,
        url: 'file://background.js',
        args: [
          { type: 'string', value: 'quoted "text"\nsecond line' },
          {
            type: 'object',
            objectId: 'object-1',
            description: 'Object',
            preview: {
              type: 'object',
              properties: [{ name: 'answer', type: 'number', value: '42' }],
            },
          },
          { type: 'number', unserializableValue: 'Infinity' },
        ],
        stackTrace: {
          callFrames: [{
            functionName: 'log',
            url: 'background.js',
            lineNumber: 2,
            columnNumber: 3,
          }],
          parent: { callFrames: [] },
        },
        extra: { source: 'engine' },
      },
      {
        type: 'error',
        timestamp: 0,
        consoleTag: 'Lepus',
        args: [{ type: 'string', value: 'main error' }],
        stackTrace: {
          callFrames: [{
            functionName: 'main',
            url: 'main.js',
            lineNumber: 4,
            columnNumber: 5,
          }],
        },
      },
    ];
    const output = await captureConsole(t, params.map(consoleEvent), [
      ...options,
      '--json',
    ]);
    const actual = watch
      ? output.split('\n').map(line => JSON.parse(line) as unknown)
      : JSON.parse(output) as unknown;
    assert.deepEqual(actual, params);
    if (watch) {
      assert.equal(
        output.split('\n').length,
        params.length,
        'each event should occupy one JSON line',
      );
    }
  });

  test(`get-console ${mode} JSON retains level, offset and limit filters without removing stack traces`, async (t) => {
    const params = ['log', 'warning', 'warning', 'warning'].map((
      type,
      index,
    ) => ({
      type,
      timestamp: 1_700_000_000_123 + index,
      args: [{ type: 'string', value: `message-${index}` }],
      stackTrace: {
        callFrames: [{ url: 'background.js', lineNumber: 1, columnNumber: 0 }],
      },
    }));
    const output = await captureConsole(t, [
      { method: 'Debugger.scriptParsed', params: {} },
      ...params.map(consoleEvent),
    ], [
      ...options,
      '--json',
      '--level',
      'warning',
      '--offset',
      '1',
      '--limit',
      '1',
    ]);
    assert.deepEqual(JSON.parse(output), watch ? params[2] : [params[2]]);
  });

  test(`get-console ${mode} JSON handles an empty console`, async (t) => {
    const output = await captureConsole(t, [], [...options, '--json']);
    assert.equal(output, watch ? '' : '[]');
  });

  test(`get-console ${mode} prints event timestamps for both threads and preserves error details`, async (t) => {
    const output = await captureConsole(t, [
      consoleEvent({
        type: 'log',
        timestamp: 1_700_000_000_123,
        args: [{ type: 'string', value: 'cached background log' }],
      }),
      consoleEvent({
        type: 'error',
        timestamp: 0,
        consoleTag: 'Lepus',
        args: [{
          type: 'object',
          objectId: 'object-1',
          description: 'Error: boom',
        }],
        stackTrace: {
          callFrames: [{ url: 'main.js', lineNumber: 2, columnNumber: 3 }],
        },
      }),
    ], options);
    assert.equal(
      output,
      [
        '[22:13:20.123Z] [log/background] cached background log',
        '[00:00:00.000Z] [error/main-thread] <Error: boom (objectId:object-1)>',
        '    at main.js:2:3',
      ].join('\n'),
    );
  });

  test(`get-console ${mode} tolerates missing and invalid timestamps`, async (t) => {
    const timestamps = [
      undefined,
      null,
      '1700000000123',
      Number.NaN,
      Infinity,
      8.64e15 + 1,
    ];
    const output = await captureConsole(
      t,
      timestamps.map((timestamp, index) =>
        consoleEvent({
          type: 'log',
          timestamp,
          args: [{ type: 'string', value: `message-${index}` }],
        })
      ),
      options,
    );
    assert.equal(
      output,
      timestamps.map((_, index) => `[log/background] message-${index}`).join(
        '\n',
      ),
    );
  });

  test(`get-console ${mode} retains the selected event timestamp after level, offset and limit filters`, async (t) => {
    const output = await captureConsole(t, [
      { method: 'Debugger.scriptParsed', params: {} },
      ...['log', 'warning', 'warning', 'warning'].map((type, index) =>
        consoleEvent({
          type,
          timestamp: 1_700_000_000_123 + index,
          args: [{ type: 'string', value: `message-${index}` }],
          stackTrace: {
            callFrames: [{
              url: 'background.js',
              lineNumber: 1,
              columnNumber: 0,
            }],
          },
        })
      ),
    ], [...options, '--level', 'warning', '--offset', '1', '--limit', '1']);
    assert.equal(output, '[22:13:20.125Z] [warning/background] message-2');
  });
}

for (
  const { name, options, threads } of [
    { name: 'default threads', options: [], threads: ['background', 'main'] },
    {
      name: 'selected thread',
      options: ['--thread', 'main'],
      threads: ['main'],
    },
  ]
) {
  test(`get-console reports ${name} as a scalar telemetry field`, async (t) => {
    const events: Array<{ code: number; data: Record<string, unknown>; }> = [];
    await withTelemetry((code, data) => {
      events.push({ code, data });
    }, () => captureConsole(t, [], options));

    assert.deepEqual(events.map(event => event.code), [
      MonitorCode.COMMAND_GET_CONSOLE,
      MonitorCode.COMMAND_GET_CONSOLE_SUCCESS,
    ]);
    assert.equal(typeof events[0]?.data['d3'], 'string');
    assert.deepEqual(JSON.parse(events[0]?.data['d3'] as string), threads);
    assert.ok(
      Object.values(events[0]?.data ?? {}).every(value =>
        value === undefined
        || ['string', 'number', 'boolean'].includes(typeof value)
      ),
      'call telemetry fields must be scalars',
    );
  });
}

for (
  const { name, rootOptions, globalOptions } of [
    {
      name: 'root --json',
      rootOptions: { env: {} },
      globalOptions: ['--json'],
    },
    {
      name: 'host JSON preference',
      rootOptions: { env: { AGENT_LYNX_FORCE_JSON: '1' } },
      globalOptions: [],
    },
    { name: 'root CLI --json', rootOptions: { env: {} }, globalOptions: [] },
  ]
) {
  test(`get-console honors ${name}`, async (t) => {
    const params = {
      type: 'log',
      timestamp: 1_700_000_000_123,
      args: [{ type: 'string', value: 'raw event' }],
    };
    const output = await captureConsole(
      t,
      [consoleEvent(params)],
      name === 'root CLI --json' ? ['--json'] : [],
      rootOptions,
      globalOptions,
    );
    assert.deepEqual(JSON.parse(output), [params]);
  });
}
