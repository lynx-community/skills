// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type CommandData,
  getOriginalNodeSourceInfo,
} from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

function parseNodeId(value: string): number {
  const nodeId = Number(value);
  if (!Number.isInteger(nodeId) || nodeId < 0) {
    throw new Error(`nodeId must be a non-negative integer (got ${value})`);
  }
  return nodeId;
}

function parseTarget(value: string): number | string {
  const target = value.trim();
  if (!target.startsWith('@')) {
    return parseNodeId(target);
  }
  if (!/^@e[1-9]\d*$/u.test(target)) {
    throw new Error(`ref must be @e1, @e2, ... (got ${value})`);
  }
  return target;
}

export function registerGetSourceInfoCommand(
  program: Command,
  context: Context,
): void {
  const command = program
    .command('get-source-info')
    .description('Get the source location for a Lynx element node.')
    .argument('<target>', 'Element node ID or Snapshot ref (@eN)', parseTarget)
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION);

  command.action(
    async (
      target: number | string,
      options: { client?: string; session?: string; },
    ) => {
      if (typeof target === 'string') {
        await runSnapshotCommand<CommandData<'get-source-info'>>(
          'get-source-info',
          command,
          {},
          () =>
            getCommandClient(context).execute('get-source-info', {
              ...(options.client ? { clientId: options.client } : {}),
              ...(options.session
                ? { sessionId: Number(options.session) }
                : {}),
              ref: target,
            }),
          data => JSON.stringify(data, null, 2),
        );
      } else {
        const { connector, clientId, sessionId } =
          await resolveClientAndSession(context, options);
        const result =
          await (context.getSourceInfo ?? getOriginalNodeSourceInfo)(
            connector,
            clientId,
            Number(sessionId),
            target,
          );
        console.log(JSON.stringify(result, null, 2));
      }
    },
  );
}
