// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command } from 'commander';
import { cliPlaceholder } from '../cli-invocation.ts';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import {
  CLIENT_OPTION,
  type Context,
  resolveClient,
  resolveJsonParams,
} from './utils.ts';

export function registerAppCommand(program: Command, context: Context): void {
  const name = cliPlaceholder(context);
  program
    .command('app')
    .description('Send an App request')
    .requiredOption('-m, --method <method>', 'App method (e.g., App.openPage)')
    .option(
      '-p, --params <json>',
      'JSON string of parameters (alias for positional [params])',
    )
    .option(...CLIENT_OPTION)
    .argument('[params]', 'JSON string of parameters')
    .addHelpText(
      'after',
      `\nExamples:
  $ ${name} app -m App.openPage '{"url":"https://example.com/main.lynx.bundle"}'
  $ ${name} app -m App.getAppInfo -p '{}'`,
    )
    .action(
      async (
        paramsStr: string | undefined,
        options: { method: string; params?: string; client?: string; },
      ) => {
        const params = resolveJsonParams(paramsStr, options.params, {
          label: 'params',
          example: '{"url":"https://example.com/main.lynx.bundle"}',
        });
        const { connector, clientId } = await resolveClient(context, options);
        const { method } = options;
        logMonitor(MonitorCode.COMMAND_APP, { d1: method });

        const result = await connector.sendAppMessage(clientId, method, params);
        logMonitor(MonitorCode.COMMAND_APP_SUCCESS, {});
        console.log(JSON.stringify(result, null, 2));
      },
    );
}
