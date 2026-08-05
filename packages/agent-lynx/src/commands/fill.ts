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

type FillResult = CommandData<'fill'>;
type ClearResult = CommandData<'clear'>;

export function registerFillCommand(program: Command, context: Context): void {
  const fill = program
    .command('fill')
    .description('Fill an editable field by its snapshot ref.')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .argument('<text>', 'The text to set in the field.')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...SNAPSHOT_AFTER_OPTION)
    .option(...JSON_OPTION);
  fill.action(
    async (
      ref: string,
      text: string,
      options: {
        client?: string;
        session?: string;
        snapshot?: boolean;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<FillResult>(
        'fill',
        fill,
        options,
        () =>
          getCommandClient(context).execute('fill', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            text,
            snapshotAfter: options.snapshot ?? false,
          }),
        (data) =>
          `Filled ${data.ref} with "${data.value}". ${formatSnapshotRefresh(data)}`,
      );
    },
  );

  const clear = program
    .command('clear')
    .description('Clear an editable field by its snapshot ref.')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...SNAPSHOT_AFTER_OPTION)
    .option(...JSON_OPTION);
  clear.action(
    async (
      ref: string,
      options: {
        client?: string;
        session?: string;
        snapshot?: boolean;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<ClearResult>(
        'clear',
        clear,
        options,
        () =>
          getCommandClient(context).execute('clear', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            snapshotAfter: options.snapshot ?? false,
          }),
        (data) => `Cleared ${data.ref}. ${formatSnapshotRefresh(data)}`,
      );
    },
  );
}
