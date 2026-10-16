// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import { CLIENT_OPTION, type Context, getCommandClient } from './utils.ts';

type OpenCommandOptions = {
  logMonitor?: typeof logMonitor;
  print?: (line: string) => void;
};

export async function runOpenCommand(
  commandClient: CommandClient,
  url: string,
  clientId?: string,
  {
    logMonitor: writeMonitor = logMonitor,
    print = console.log,
  }: OpenCommandOptions = {},
): Promise<void> {
  writeMonitor(MonitorCode.COMMAND_OPEN, {});
  const result = await commandClient.execute('open', {
    url,
    ...(clientId === undefined ? {} : { clientId }),
  });
  if (!result.ok) throw new Error(result.error.message);

  writeMonitor(MonitorCode.COMMAND_OPEN_SUCCESS, { d1: url });
  print(JSON.stringify(result.data.response, null, 2));
}

export function registerOpenCommand(program: Command, context: Context): void {
  program
    .command('open')
    .description('Open page')
    .option(...CLIENT_OPTION)
    .argument('<url>', 'The url of the page')
    .action(async (url: string, options: { client?: string; }) => {
      await runOpenCommand(getCommandClient(context), url, options.client);
    });
}
