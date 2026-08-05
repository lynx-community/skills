// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandData } from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
} from './utils.ts';

type GetTextResult = CommandData<'get-text'>;
type GetStyleResult = CommandData<'get-style'>;

export function registerGetCommand(program: Command, context: Context): void {
  const get = program
    .command('get')
    .description('Read element properties by snapshot ref.');

  const text = get
    .command('text')
    .description('Get the visible text of an element by its snapshot ref.')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...JSON_OPTION);
  text.action(
    async (
      ref: string,
      options: { client?: string; session?: string; json?: boolean },
    ) => {
      await runSnapshotCommand<GetTextResult>(
        'get-text',
        text,
        options,
        () =>
          getCommandClient(context).execute('get-text', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
          }),
        (data) => data.text,
      );
    },
  );

  const style = get
    .command('style')
    .description('Get the computed style of an element by its snapshot ref.')
    .argument('<ref>', 'A ref produced by `agent-lynx snapshot`.')
    .option(
      '--property <names>',
      'Comma-separated style property names to include.',
      (value) =>
        value
          .split(',')
          .map((name: string) => name.trim())
          .filter(Boolean),
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...JSON_OPTION);
  style.action(
    async (
      ref: string,
      options: {
        property?: string[];
        client?: string;
        session?: string;
        json?: boolean;
      },
    ) => {
      await runSnapshotCommand<GetStyleResult>(
        'get-style',
        style,
        options,
        () =>
          getCommandClient(context).execute('get-style', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            ...(options.property ? { property: options.property } : {}),
          }),
        (data) =>
          Object.entries(data.style)
            .map(([name, value]) => `${name}: ${value}`)
            .join('\n') || '(no computed style)',
      );
    },
  );
}
