// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerAppCommand(program: Command, client: DevtoolClient) {
  program
    .command('app')
    .description('Send an App request')
    .requiredOption('-m, --method <method>', 'App method (e.g., App.openPage)')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .argument('[params]', 'JSON string of parameters')
    .action(async (paramsStr, options) => {
      const { method } = options;
      const params = paramsStr ? JSON.parse(paramsStr) : {};
      const result = await client.app({
        clientId: options.client,
        method,
        params,
      });
      console.log(JSON.stringify(result, null, 2));
    });
}
