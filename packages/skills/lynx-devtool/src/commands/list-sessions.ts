// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from 'commander';
import {
  CLIENT_NAME_OPTION,
  CLIENT_OPTION,
  type Context,
  resolveClient,
} from './utils.ts';

export function registerListSessionsCommand(
  program: Command,
  context: Context,
) {
  program
    .command('list-sessions')
    .description('List all available sessions')
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const sessions = await connector.sendListSessionMessage(clientId);

      console.log(JSON.stringify(sessions, null, 2));
    });
}
