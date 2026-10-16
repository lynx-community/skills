// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import {
  type CommandClient,
  type CommandResult,
  fail,
  HttpCommandClient,
  NO_CLIENTS_FOUND_MESSAGE,
  ok,
} from '@lynx-js/devtool-connector/command';
import type { Client } from '@lynx-js/devtool-connector/transport';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runListClientsCommand } from '../src/commands/list-clients.ts';
import { createProgram } from '../src/devtool.ts';
import { MonitorCode } from '../src/telemetry.ts';

type MonitorEvent = {
  code: number;
  data: Record<string, unknown>;
};

function createClient(id = 'device:8901', app = 'Example'): Client {
  return {
    id,
    info: {
      App: app,
      AppVersion: '1.0.0',
      debugRouterId: 'router',
      debugRouterVersion: '1.0.0',
      deviceModel: 'Pixel',
      network: 'wifi',
      osType: 'Android',
      osVersion: '14',
      sdkVersion: '1.0.0',
    },
  };
}

function createCommandClient(
  result: CommandResult<{ clients: Client[]; }>,
  calls: Array<{ action: string; params: unknown; }> = [],
): CommandClient {
  return {
    async execute(action, params) {
      calls.push({ action, params });
      return result as never;
    },
    async *stream() {
      yield await Promise.reject<never>(
        new Error('list-clients must not use SSE'),
      );
    },
  } as CommandClient;
}

test('list-clients throws after recording success monitor when discovery is empty', async (t) => {
  const monitorEvents: MonitorEvent[] = [];
  const lines: string[] = [];

  await t.assert.rejects(
    () =>
      runListClientsCommand(
        createCommandClient(fail('list-clients', NO_CLIENTS_FOUND_MESSAGE, {
          reason: 'no-clients',
          recoverable: true,
        })),
        {
          logMonitor(code, data) {
            monitorEvents.push({ code, data: { ...data } });
          },
          print(line) {
            lines.push(line);
          },
        },
      ),
    {
      message: NO_CLIENTS_FOUND_MESSAGE,
    },
  );

  t.assert.deepEqual(monitorEvents.map(({ code }) => code), [
    MonitorCode.COMMAND_LIST_CLIENTS,
    MonitorCode.COMMAND_LIST_CLIENTS_SUCCESS,
  ]);
  t.assert.equal(monitorEvents[1]?.data['m1'], 0);
  t.assert.deepEqual(lines, []);
});

test('list-clients prints discovered clients', async (t) => {
  const client = createClient();
  const lines: string[] = [];
  const calls: Array<{ action: string; params: unknown; }> = [];

  await runListClientsCommand(
    createCommandClient(ok('list-clients', { clients: [client] }), calls),
    {
      logMonitor() {},
      print(line) {
        lines.push(line);
      },
    },
  );

  t.assert.deepEqual(lines.map(line => JSON.parse(line) as unknown), [[
    client,
  ]]);
  t.assert.deepEqual(calls, [{ action: 'list-clients', params: {} }]);
});

test('list-clients reports every transport-provided client without runtime notices', async (t) => {
  const desktopClient = createClient('desktop:1', 'Desktop');
  const client = createClient();
  const monitorEvents: MonitorEvent[] = [];
  const lines: string[] = [];

  await runListClientsCommand(
    createCommandClient(
      ok('list-clients', { clients: [desktopClient, client] }),
    ),
    {
      logMonitor(code, data) {
        monitorEvents.push({ code, data: { ...data } });
      },
      print(line) {
        lines.push(line);
      },
    },
  );

  const success = monitorEvents.find(({ code }) =>
    code === MonitorCode.COMMAND_LIST_CLIENTS_SUCCESS
  );
  t.assert.equal(success?.data['m1'], 2);
  t.assert.deepEqual(JSON.parse(String(success?.data['d1'])), [{
    App: 'Desktop',
    deviceModel: 'Pixel',
    osType: 'Android',
    osVersion: '14',
    sdkVersion: '1.0.0',
  }, {
    App: 'Example',
    deviceModel: 'Pixel',
    osType: 'Android',
    osVersion: '14',
    sdkVersion: '1.0.0',
  }]);

  t.assert.deepEqual(JSON.parse(lines[0] ?? '[]'), [desktopClient, client]);
});

test('default list-clients uses daemon HTTP and never invokes Connector directly', async (t) => {
  const client = createClient();
  const lines: string[] = [];
  let connectorCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(
    HttpCommandClient.prototype,
    'execute',
    async (action: string, params: unknown) => {
      assert.deepEqual({ action, params }, {
        action: 'list-clients',
        params: {},
      });
      return ok('list-clients', { clients: [client] }) as never;
    },
  );
  t.mock.method(Connector.prototype, 'listClients', async () => {
    connectorCalls += 1;
    return [client];
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    'list-clients',
  ]);

  assert.equal(connectorCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [client]);
});

test('--no-daemon list-clients invokes ActionCore in-process and never uses HTTP', async (t) => {
  const client = createClient();
  const lines: string[] = [];
  let discoveryCalls = 0;
  let httpCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(HttpCommandClient.prototype, 'execute', async () => {
    httpCalls += 1;
    return ok('list-clients', { clients: [client] }) as never;
  });
  t.mock.method(Connector.prototype, 'listClients', async () => {
    discoveryCalls += 1;
    return [client];
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    '--no-daemon',
    'list-clients',
  ]);

  assert.equal(discoveryCalls, 1);
  assert.equal(httpCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [client]);
});
