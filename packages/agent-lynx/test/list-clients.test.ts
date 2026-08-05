// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import test from 'node:test';
import type { Client } from '@lynx-js/devtool-connector/transport';
import { runListClientsCommand } from '../src/commands/list-clients.ts';

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

test('list-clients throws a guidance error when discovery is empty', async (t) => {
  const lines: string[] = [];

  await t.assert.rejects(
    () =>
      runListClientsCommand(
        {
          async listClients() {
            return [];
          },
        },
        {
          print(line) {
            lines.push(line);
          },
        },
      ),
    {
      message:
        /No Lynx DevTool clients were found\.\n\nTry these steps:\n1\. Make sure the target device\/simulator and app are running\.\n2\. If the app just launched, wait a moment and rerun `list-clients`\.\n3\. If this is unexpected, rerun with `DEBUG='devtool-mcp-server:connector\*'` or try `--no-daemon`\.\n\nRun `agent-lynx skills get lynx-devtool`, then read `references\/troubleshooting\/symptoms\.md#list-clients-returns-` relative to the reported Skill directory\./,
    },
  );

  t.assert.deepEqual(lines, []);
});

test('list-clients prints discovered clients', async (t) => {
  const client = createClient();
  const lines: string[] = [];

  await runListClientsCommand(
    {
      async listClients() {
        return [client];
      },
    },
    {
      print(line) {
        lines.push(line);
      },
    },
  );

  t.assert.deepEqual(
    lines.map((line) => JSON.parse(line) as unknown),
    [[client]],
  );
});

test('list-clients prints every discovered client as a plain array', async (t) => {
  const first = createClient('device:1', 'First');
  const second = createClient('device:2', 'Second');
  const lines: string[] = [];

  await runListClientsCommand(
    {
      async listClients() {
        return [first, second];
      },
    },
    {
      print(line) {
        lines.push(line);
      },
    },
  );

  const output = JSON.parse(lines[0] ?? '[]') as Client[];
  t.assert.equal(output.length, 2);
  t.assert.deepEqual(
    output.map((client) => client.id),
    ['device:1', 'device:2'],
  );
});
