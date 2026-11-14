// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command } from 'commander';
import { cliPlaceholder } from '../cli-invocation.ts';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import {
  CLIENT_OPTION,
  type Context,
  resolveClientAndSession,
  resolveJsonParams,
  SESSION_OPTION,
} from './utils.ts';

export function registerCdpCommand(program: Command, context: Context): void {
  const name = cliPlaceholder(context);
  program
    .command('cdp')
    .description('Send a CDP request')
    .requiredOption(
      '-m, --method <method>',
      'CDP method (e.g., DOM.getDocument)',
    )
    .option(
      '-p, --params <json>',
      'JSON string of parameters (alias for positional [params])',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--thread <thread>',
      "Thread to target (e.g., 'main' or 'background'). Defaults to 'background'",
    )
    .argument('[params]', 'JSON string of parameters')
    .addHelpText(
      'after',
      `\nExamples:
  $ ${name} cdp -m Page.reload '{"ignoreCache":true}'
  $ ${name} cdp -m Runtime.evaluate --thread main -p '{"expression":"globalThis.__lynxProps"}'
  $ ${name} cdp -s -1 -m Memory.getAllMemoryUsage`,
    )
    .action(
      async (
        paramsStr: string | undefined,
        options: {
          method: string;
          params?: string;
          client?: string;
          session?: string;
          thread?: string;
        },
      ) => {
        const params = resolveJsonParams(paramsStr, options.params, {
          label: 'params',
          example: '{"ignoreCache":true}',
        });
        const { connector, clientId, sessionId } =
          await resolveClientAndSession(
            context,
            options,
          );
        const { method } = options;
        const thread = options.thread ?? 'background';

        logMonitor(MonitorCode.COMMAND_CDP, { d1: method });

        const result = await connector.sendCDPMessage(
          clientId,
          Number(sessionId),
          method,
          params,
          thread === 'main',
        );

        logMonitor(MonitorCode.COMMAND_CDP_SUCCESS, {});

        console.log(JSON.stringify(result, null, 2));
      },
    );
}
