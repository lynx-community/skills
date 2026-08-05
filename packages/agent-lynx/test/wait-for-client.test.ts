// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Client } from '@lynx-js/devtool-connector/transport';
import { runWaitForClientCommand } from '../src/commands/wait-for-client.ts';
import { createProgram } from '../src/devtool.ts';

function createClient(id: string, info: Partial<Client['info']>): Client {
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

function parseClientIds(line: string): string[] {
  const clients = JSON.parse(line) as Client[];
  assert.ok(Array.isArray(clients));
  return clients.map((client) => client.id);
}

test('program registers wait-for-client with optional --client-name only', () => {
  const program = createProgram({ env: {} });
  const command = program.commands.find(
    (child) => child.name() === 'wait-for-client',
  );

  assert.ok(command);
  assert.ok(!command.options.some((option) => option.long === '--client'));
  assert.ok(command.options.some((option) => option.long === '--client-name'));
});

test('wait-for-client waits until a matching client appears', async () => {
  const calls: Client[][] = [
    [],
    [
      createClient('device:8901', {
        App: 'LynxExample',
        AppProcessName: 'com.lynx.uiapp',
      }),
    ],
  ];
  const output: string[] = [];
  const waits: number[] = [];

  await runWaitForClientCommand(
    {
      async listClients() {
        return calls.shift() ?? [];
      },
    },
    {
      clientName: 'com.lynx.uiapp',
      timeoutMs: 1_000,
      intervalMs: 25,
      print: (line) => output.push(line),
      waitForRetry: async (ms) => {
        waits.push(ms);
      },
    },
  );

  assert.deepEqual(waits, [25]);
  assert.deepEqual(parseClientIds(output[0]!), ['device:8901']);
});

test('wait-for-client waits until the first client appears when no client name is provided', async () => {
  const calls: Client[][] = [
    [],
    [
      createClient('device:8901', {
        App: 'LynxExample',
        AppProcessName: 'com.lynx.uiapp',
      }),
    ],
  ];
  const output: string[] = [];
  const waits: number[] = [];

  await runWaitForClientCommand(
    {
      async listClients() {
        return calls.shift() ?? [];
      },
    },
    {
      timeoutMs: 1_000,
      intervalMs: 25,
      print: (line) => output.push(line),
      waitForRetry: async (ms) => {
        waits.push(ms);
      },
    },
  );

  assert.deepEqual(waits, [25]);
  assert.deepEqual(parseClientIds(output[0]!), ['device:8901']);
});

test('wait-for-client returns all clients matching the requested client name', async () => {
  const output: string[] = [];

  await runWaitForClientCommand(
    {
      async listClients() {
        return [
          createClient('device:8901', {
            App: 'LynxExample',
            AppProcessName: 'com.lynx.uiapp',
          }),
          createClient('device:8902', {
            App: 'LynxExample',
            AppProcessName: 'com.lynx.uiapp',
          }),
        ];
      },
    },
    {
      clientName: 'com.lynx.uiapp',
      timeoutMs: 1_000,
      print: (line) => output.push(line),
    },
  );

  assert.deepEqual(parseClientIds(output[0]!), ['device:8901', 'device:8902']);
});

test('wait-for-client reports the last available clients when it times out', async () => {
  await assert.rejects(
    () =>
      runWaitForClientCommand(
        {
          async listClients() {
            return [
              createClient('device:8901', {
                App: 'LynxExample',
                AppProcessName: 'com.lynx.uiapp',
              }),
            ];
          },
        },
        {
          clientName: 'com.example.missing',
          timeoutMs: 0,
          print: () => {},
        },
      ),
    /No client found matching --client-name "com\.example\.missing"[\s\S]*com\.lynx\.uiapp/u,
  );
});

test(
  'wait-for-client enforces its deadline while discovery is stalled',
  { timeout: 250 },
  async () => {
    await assert.rejects(
      () =>
        runWaitForClientCommand(
          {
            async listClients() {
              return await new Promise<Client[]>(() => {});
            },
          },
          {
            clientName: 'com.lynx.uiapp',
            timeoutMs: 20,
            print: () => {},
          },
        ),
      /No client found matching --client-name "com\.lynx\.uiapp"/u,
    );
  },
);
