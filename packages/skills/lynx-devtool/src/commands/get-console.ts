// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { ConsoleMessage, DevtoolClient } from '../sdk.ts';

export function registerGetConsoleCommand(
  program: Command,
  client: DevtoolClient,
) {
  program
    .command('get-console')
    .description('Capture console logs from the device')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .option(
      '-s, --session <sessionId>',
      'Session ID (optional, will auto-discover if not provided)',
    )
    .option(
      '--offset <number>',
      'The number of console messages to skip before returning results.',
      parseInt,
    )
    .option(
      '--limit <number>',
      'The maximum number of console messages to return.',
      parseInt,
    )
    .option(
      '--include-stack-traces',
      'By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.',
    )
    .option(
      '--level <levels>',
      "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']",
      (value) => value.split(',').map((s) => s.trim()),
    )
    .action(async (options) => {
      const messages = await client.getConsole({
        clientId: options.client,
        sessionId: options.session,
        offset: options.offset,
        limit: options.limit,
        includeStackTraces: options.includeStackTraces,
        level: options.level,
      });

      console.log(formatConsoleMessages(messages));
    });
}

function formatConsoleMessages(messages: ConsoleMessage[]): string {
  return messages
    .map(
      ({ type, args, stackTrace }) =>
        `- [${type}]: ${args
          .map((arg) => {
            if (arg.objectId) {
              return `<${arg.description || arg.className || 'Object'} (objectId:${arg.objectId})>`;
            }
            return arg.value;
          })
          .join(' ')}${
          stackTrace
            ? '\n' +
              stackTrace.callFrames
                .map(
                  ({ url, lineNumber, columnNumber }) =>
                    `    at ${url}:${lineNumber}:${columnNumber}`,
                )
                .join('\n')
            : ''
        }`,
    )
    .join('\n');
}
