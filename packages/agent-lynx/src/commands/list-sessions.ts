// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import { CLIENT_OPTION, type Context, getCommandClient } from './utils.ts';

type ListSessionsCommandOptions = {
  logMonitor?: typeof logMonitor;
  print?: (line: string) => void;
};

export async function runListSessionsCommand(
  commandClient: CommandClient,
  clientId?: string,
  {
    logMonitor: writeMonitor = logMonitor,
    print = console.log,
  }: ListSessionsCommandOptions = {},
): Promise<void> {
  writeMonitor(MonitorCode.COMMAND_LIST_SESSIONS, {});
  const result = await commandClient.execute(
    'list-sessions',
    clientId === undefined ? {} : { clientId },
  );
  if (!result.ok) throw new Error(result.error.message);

  const { sessions } = result.data;
  writeMonitor(MonitorCode.COMMAND_LIST_SESSIONS_SUCCESS, {
    m1: sessions.length,
    d1: JSON.stringify(sessions.map((session) => ({
      type: session.type,
    }))),
  });

  print(JSON.stringify(sessions, null, 2));
}

export function registerListSessionsCommand(
  program: Command,
  context: Context,
) {
  program
    .command('list-sessions')
    .description('List all available sessions')
    .option(...CLIENT_OPTION)
    .action(async (options) => {
      await runListSessionsCommand(getCommandClient(context), options.client);
    });
}
