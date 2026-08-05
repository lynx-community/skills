// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandData } from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  formatSnapshotRefresh,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
  SNAPSHOT_AFTER_OPTION,
} from './utils.ts';

type ScrollResult = CommandData<'scroll'>;

export function registerScrollCommand(
  program: Command,
  context: Context,
): void {
  const command = program
    .command('scroll')
    .description('Scroll a scrollable element by its snapshot ref.')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .option(
      '--direction <direction>',
      'Scroll direction: up | down | left | right.',
      'down',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...SNAPSHOT_AFTER_OPTION)
    .option(...JSON_OPTION);
  command.action(
    async (
      ref: string,
      options: {
        direction: string;
        client?: string;
        session?: string;
        snapshot?: boolean;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<ScrollResult>(
        'scroll',
        command,
        options,
        () =>
          getCommandClient(context).execute('scroll', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            direction: options.direction as 'up' | 'down' | 'left' | 'right',
            snapshotAfter: options.snapshot ?? false,
          }),
        (data) =>
          `Scrolled ${data.ref} ${data.direction}. ${formatSnapshotRefresh(data)}`,
      );
    },
  );
}
