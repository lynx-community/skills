// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerOpenCommand(program: Command, client: DevtoolClient) {
  program
    .command('open')
    .description('Open page')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .argument('<url>', 'The url of the page')
    .action(async (url, options) => {
      const result = await client.open({
        clientId: options.client,
        url,
      });
      console.log(JSON.stringify(result, null, 2));
    });
}
