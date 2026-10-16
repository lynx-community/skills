// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import {
  type CommandClient,
  type CommandResult,
  fail,
  HttpCommandClient,
  ok,
  type StreamCommandEvent,
} from '@lynx-js/devtool-connector/command';
import type { Client } from '@lynx-js/devtool-connector/transport';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runWaitForClientCommand } from '../src/commands/wait-for-client.ts';
import { createProgram } from '../src/devtool.ts';
import { MonitorCode } from '../src/telemetry.ts';

interface MonitorEvent {
  code: number;
  data: Record<string, unknown>;
}

function createClient(id: string, info: Partial<Client['info']> = {}): Client {
  return {
    id,
    info: {
      App: 'Example',
      AppVersion: '1.0.0',
      debugRouterId: 'router',
      debugRouterVersion: '1.0.0',
      deviceModel: 'Pixel',
      network: 'wifi',
      osType: 'Android',
      osVersion: '14',
      sdkVersion: '1.0.0',
      ...info,
    },
  };
}

function createCommandClient(
  events: Array<CommandResult<StreamCommandEvent<'wait-for-client'>>>,
  calls: Array<{ action: string; params: unknown; options: unknown; }> = [],
): CommandClient {
  const client = {
    async execute() {
      throw new Error('wait-for-client must not use unary execution');
    },
    async *stream(
      ...[action, params, options]: Parameters<CommandClient['stream']>
    ) {
      calls.push({ action, params, options });
      yield* events;
    },
  } satisfies CommandClient;

  return client;
}

function finalEvent(
  clients: Client[],
  availableClients = clients,
  attempts = 1,
  elapsedMs = 0,
): CommandResult<StreamCommandEvent<'wait-for-client'>> {
  return ok('wait-for-client', {
    matched: true,
    clients,
    availableClients,
    attempts,
    elapsedMs,
  });
}

test('program registers wait-for-client with optional --client-name only', () => {
  const program = createProgram({ env: {} });
  const command = program.commands.find(child =>
    child.name() === 'wait-for-client'
  );

  assert.ok(command);
  assert.ok(!command.options.some(option => option.long === '--client'));
  assert.ok(command.options.some(option => option.long === '--client-name'));
});

test('wait-for-client consumes progress SSE while preserving stdout and optional telemetry', async () => {
  const matched = createClient('device:8901', {
    AppProcessName: 'com.lynx.uiapp',
  });
  const other = createClient('device:8902', { App: 'Other' });
  const calls: Array<{ action: string; params: unknown; options: unknown; }> =
    [];
  const monitorEvents: MonitorEvent[] = [];
  const output: string[] = [];
  const result = await runWaitForClientCommand(
    createCommandClient([
      ok('wait-for-client.progress', {
        matched: false,
        availableClients: [],
        attempts: 1,
        elapsedMs: 0,
      }),
      finalEvent([matched], [matched, other], 2, 25),
    ], calls),
    {
      clientName: 'com.lynx.uiapp',
      timeoutMs: 1_000,
      intervalMs: 25,
      logMonitor(code, data) {
        monitorEvents.push({ code, data: { ...data } });
      },
      print(line) {
        output.push(line);
      },
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.action, 'wait-for-client');
  assert.deepEqual(calls[0]?.params, {
    clientName: 'com.lynx.uiapp',
    timeoutMs: 1_000,
    intervalMs: 25,
  });
  assert.equal((calls[0]?.options as { method?: string; }).method, 'POST');
  assert.ok(
    (calls[0]?.options as { signal?: unknown; }).signal instanceof AbortSignal,
  );
  assert.deepEqual(output.map(line => JSON.parse(line) as unknown), [[
    matched,
  ]]);
  assert.deepEqual(result, {
    clients: [matched, other],
    attempts: 2,
    durationMs: 25,
  });
  assert.deepEqual(monitorEvents.map(event => event.code), [
    MonitorCode.COMMAND_WAIT_FOR_CLIENT,
    MonitorCode.COMMAND_WAIT_FOR_CLIENT_LIST_CLIENTS_SUCCESS,
    MonitorCode.COMMAND_WAIT_FOR_CLIENT_LIST_CLIENTS_SUCCESS,
    MonitorCode.COMMAND_WAIT_FOR_CLIENT_SUCCESS,
  ]);
  assert.deepEqual(
    monitorEvents.slice(1, 3).map(
      event => [event.data['m1'], event.data['m2']],
    ),
    [[0, 1], [2, 2]],
  );
  assert.deepEqual(
    [
      monitorEvents.at(-1)?.data['m1'],
      monitorEvents.at(-1)?.data['m2'],
      monitorEvents.at(-1)?.data['m3'],
    ],
    [2, 2, 25],
  );
});

test('wait-for-client preserves timeout failures after reporting successful discovery attempts', async () => {
  const available = createClient('device:8901', {
    AppProcessName: 'com.lynx.uiapp',
  });
  const monitorEvents: MonitorEvent[] = [];

  await assert.rejects(
    () =>
      runWaitForClientCommand(
        createCommandClient([
          ok('wait-for-client.progress', {
            matched: false,
            availableClients: [available],
            attempts: 1,
            elapsedMs: 0,
          }),
          fail('wait-for-client', 'No matching client', {
            reason: 'timeout',
            recoverable: true,
          }),
        ]),
        {
          clientName: 'com.example.missing',
          timeoutMs: 0,
          logMonitor(code, data) {
            monitorEvents.push({ code, data: { ...data } });
          },
          print() {
            assert.fail('a timed out wait must not print clients');
          },
        },
      ),
    { message: 'No matching client' },
  );

  assert.deepEqual(monitorEvents.map(event => event.code), [
    MonitorCode.COMMAND_WAIT_FOR_CLIENT,
    MonitorCode.COMMAND_WAIT_FOR_CLIENT_LIST_CLIENTS_SUCCESS,
  ]);
});

test('default wait-for-client uses daemon HTTP SSE and never invokes Connector directly', async (t) => {
  const client = createClient('device:8901');
  const lines: string[] = [];
  let connectorCalls = 0;
  let streamCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(
    HttpCommandClient.prototype,
    'stream',
    function(
      ...[action, params, options]: Parameters<CommandClient['stream']>
    ) {
      streamCalls += 1;
      assert.deepEqual({ action, params }, {
        action: 'wait-for-client',
        params: { clientName: 'Example', timeoutMs: 0, intervalMs: 0 },
      });
      assert.equal(options?.method, 'POST');
      return (async function*() {
        yield finalEvent([client]);
      })() as never;
    },
  );
  t.mock.method(Connector.prototype, 'listClients', async () => {
    connectorCalls += 1;
    return [client];
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    'wait-for-client',
    '--client-name',
    'Example',
    '--timeout',
    '0',
    '--interval',
    '0',
  ]);

  assert.equal(streamCalls, 1);
  assert.equal(connectorCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [client]);
});

test('--no-daemon wait-for-client invokes ActionCore in-process and never uses HTTP', async (t) => {
  const client = createClient('device:8901');
  const lines: string[] = [];
  let discoveryCalls = 0;
  let httpCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(HttpCommandClient.prototype, 'stream', function() {
    httpCalls += 1;
    return (async function*() {})() as never;
  });
  t.mock.method(Connector.prototype, 'listClients', async () => {
    discoveryCalls += 1;
    return [client];
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    '--no-daemon',
    'wait-for-client',
    '--timeout',
    '0',
    '--interval',
    '0',
  ]);

  assert.equal(discoveryCalls, 1);
  assert.equal(httpCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [client]);
});

test('wait-for-client validates CLI seconds before opening an SSE stream', async (t) => {
  let streamCalls = 0;
  t.mock.method(HttpCommandClient.prototype, 'stream', function() {
    streamCalls += 1;
    return (async function*() {})() as never;
  });

  await assert.rejects(
    createProgram({ env: {} }).parseAsync([
      'node',
      'agent-lynx',
      'wait-for-client',
      '--timeout',
      'not-a-number',
    ]),
    /Invalid --timeout value/u,
  );
  assert.equal(streamCalls, 0);
});
