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

type TapResult = CommandData<'tap'>;
type LongPressResult = CommandData<'long-press'>;

export function registerTapCommand(program: Command, context: Context): void {
  const tap = program
    .command('tap')
    .description('Tap an element by its snapshot ref (e.g. @e3).')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`, e.g. @e3.')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...SNAPSHOT_AFTER_OPTION)
    .option(...JSON_OPTION);
  tap.action(
    async (
      ref: string,
      options: {
        client?: string;
        session?: string;
        snapshot?: boolean;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<TapResult>(
        'tap',
        tap,
        options,
        () =>
          getCommandClient(context).execute('tap', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            snapshotAfter: options.snapshot ?? false,
          }),
        (data) =>
          `Tapped ${data.ref} at (${data.point.x},${data.point.y}). ${formatSnapshotRefresh(data)}`,
      );
    },
  );

  const longPress = program
    .command('long-press')
    .description('Long-press an element by its snapshot ref (e.g. @e3).')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .option(
      '--duration <ms>',
      'Hold duration in milliseconds.',
      (value) => Number.parseInt(value, 10),
      600,
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...SNAPSHOT_AFTER_OPTION)
    .option(...JSON_OPTION);
  longPress.action(
    async (
      ref: string,
      options: {
        duration: number;
        client?: string;
        session?: string;
        snapshot?: boolean;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<LongPressResult>(
        'long-press',
        longPress,
        options,
        () =>
          getCommandClient(context).execute('long-press', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            duration: options.duration,
            snapshotAfter: options.snapshot ?? false,
          }),
        (data) =>
          `Long-pressed ${data.ref} at (${data.point.x},${data.point.y}). ${formatSnapshotRefresh(data)}`,
      );
    },
  );
}
