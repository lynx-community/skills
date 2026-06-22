// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerGetSourcesCommand(
  program: Command,
  client: DevtoolClient,
) {
  program
    .command('get-sources')
    .description('List all parsed scripts.')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .option(
      '-s, --session <sessionId>',
      'Session ID (optional, will auto-discover if not provided)',
    )
    .action(async (options) => {
      const sources = await client.getSources({
        clientId: options.client,
        sessionId: options.session,
      });
      console.log(JSON.stringify(sources, null, 2));
    });
}
