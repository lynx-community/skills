// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import { type Context, getCommandClient } from './utils.ts';

type ListClientsCommandOptions = {
  logMonitor?: typeof logMonitor;
  print?: (line: string) => void;
};

export async function runListClientsCommand(
  commandClient: CommandClient,
  {
    logMonitor: writeMonitor = logMonitor,
    print = console.log,
  }: ListClientsCommandOptions = {},
): Promise<void> {
  writeMonitor(MonitorCode.COMMAND_LIST_CLIENTS, {});
  const result = await commandClient.execute('list-clients', {});
  if (!result.ok) {
    if (result.error.reason === 'no-clients') {
      writeMonitor(MonitorCode.COMMAND_LIST_CLIENTS_SUCCESS, {
        m1: 0,
        d1: '[]',
      });
    }
    throw new Error(result.error.message);
  }

  const { clients } = result.data;
  writeMonitor(MonitorCode.COMMAND_LIST_CLIENTS_SUCCESS, {
    m1: clients.length,
    d1: JSON.stringify(
      clients.map(client => ({
        App: client.info.App,
        deviceModel: client.info.deviceModel,
        osType: client.info.osType,
        osVersion: client.info.osVersion,
        sdkVersion: client.info.sdkVersion,
      })),
    ),
  });
  print(JSON.stringify(clients, null, 2));
}

export function registerListClientsCommand(
  program: Command,
  context: Context,
): void {
  program
    .command('list-clients')
    .description('List all available clients')
    .action(async () => {
      await runListClientsCommand(getCommandClient(context));
    });
}
