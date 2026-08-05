// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CommandData,
  CommandParams,
  CommandResult,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { fail, runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
} from './utils.ts';

type WaitResult = CommandData<'wait'>;

async function consumeWaitStream(
  context: Context,
  params: CommandParams<'wait'>,
  timeout: number,
): Promise<CommandResult<WaitResult>> {
  const interrupt = new AbortController();
  const onSigint = () => interrupt.abort(new Error('Interrupted by SIGINT.'));
  process.once('SIGINT', onSigint);
  const signal = AbortSignal.any([
    interrupt.signal,
    AbortSignal.timeout(timeout + 15_000),
  ]);

  try {
    for await (const event of getCommandClient(context).stream('wait', params, {
      signal,
      method: 'POST',
    })) {
      if (!event.ok || event.action === 'wait') {
        return event as CommandResult<WaitResult>;
      }
    }
    return fail('wait', 'Wait stream ended before producing a final result.', {
      reason: 'empty-stream',
      recoverable: true,
    });
  } finally {
    process.off('SIGINT', onSigint);
  }
}

export function registerWaitCommand(program: Command, context: Context): void {
  const command = program
    .command('wait')
    .description(
      'Stream fresh snapshots until text appears or a ref resolves, then cache the snapshot.',
    )
    .option('--text <text>', 'Wait until this text appears in any element.')
    .option('--ref <ref>', 'Wait until this ref resolves in a fresh snapshot.')
    .option(
      '--timeout <ms>',
      'Maximum time to wait in milliseconds.',
      (value) => Number.parseInt(value, 10),
      10_000,
    )
    .option(
      '--interval <ms>',
      'Polling interval in milliseconds.',
      (value) => Number.parseInt(value, 10),
      500,
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...JSON_OPTION);
  command.action(
    async (options: {
      text?: string;
      ref?: string;
      timeout: number;
      interval: number;
      client?: string;
      session?: string;
      json?: boolean;
    }) => {
      await runSnapshotCommand<WaitResult>(
        'wait',
        command,
        options,
        async () => {
          if (!options.text && !options.ref) {
            return fail(
              'wait',
              'Provide --text <text> or --ref <ref> to wait for.',
            );
          }
          return await consumeWaitStream(
            context,
            {
              ...(options.client ? { clientId: options.client } : {}),
              ...(options.session
                ? { sessionId: Number(options.session) }
                : {}),
              timeout: options.timeout,
              interval: options.interval,
              ...(options.text ? { text: options.text } : {}),
              ...(options.ref ? { ref: options.ref } : {}),
            },
            options.timeout,
          );
        },
        (data) =>
          `Matched ${data.by} "${data.query}" after ${data.elapsedMs}ms. A fresh snapshot was cached.`,
      );
    },
  );
}
