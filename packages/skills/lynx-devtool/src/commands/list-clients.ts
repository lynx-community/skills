// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';

export function registerListClientsCommand(
  program: Command,
  connector: Connector,
) {
  program
    .command('list-clients')
    .description('List all available clients')
    .action(async () => {
      const clients = await connector.listClients();
      console.log(JSON.stringify(clients, null, 2));
    });
}
