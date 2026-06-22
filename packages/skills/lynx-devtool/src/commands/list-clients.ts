// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerListClientsCommand(
  program: Command,
  client: DevtoolClient,
) {
  program
    .command('list-clients')
    .description('List all available clients')
    .action(async () => {
      const clients = await client.listClients();
      console.log(JSON.stringify(clients, null, 2));
    });
}
