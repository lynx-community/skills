// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';
import type { Context } from './utils.ts';

type ListClientsConnector = Pick<Connector, 'listClients'>;
type ListClientsCommandOptions = {
  print?: (line: string) => void;
};

const NO_CLIENTS_FOUND_MESSAGE = [
  'No Lynx DevTool clients were found.',
  '',
  'Try these steps:',
  '1. Make sure the target device/simulator and app are running.',
  '2. If the app just launched, wait a moment and rerun `list-clients`.',
  "3. If this is unexpected, rerun with `DEBUG='devtool-mcp-server:connector*'` or try `--no-daemon`.",
  '',
  'Run `agent-lynx skills get lynx-devtool`, then read `references/troubleshooting/symptoms.md#list-clients-returns-` relative to the reported Skill directory.',
].join('\n');

export async function runListClientsCommand(
  connector: ListClientsConnector,
  { print = console.log }: ListClientsCommandOptions = {},
): Promise<void> {
  const clients = await connector.listClients();

  if (clients.length === 0) {
    throw new Error(NO_CLIENTS_FOUND_MESSAGE);
  }

  print(JSON.stringify(clients, null, 2));
}

export function registerListClientsCommand(
  program: Command,
  { transports }: Context,
) {
  program
    .command('list-clients')
    .description('List all available clients')
    .action(async () => {
      const connector = new Connector(transports);
      await runListClientsCommand(connector);
    });
}
