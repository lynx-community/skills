// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerListSessionsCommand(
  program: Command,
  client: DevtoolClient,
) {
  program
    .command('list-sessions')
    .description('List all available sessions')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .action(async (options) => {
      const sessions = await client.listSessions({
        clientId: options.client,
      });
      console.log(JSON.stringify(sessions, null, 2));
    });
}
