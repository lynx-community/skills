// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';

import type { Command } from 'commander';
import {
  CLIENT_OPTION,
  type Context,
  readUntilIdle,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

interface ConsoleCallFrame {
  url: string;
  lineNumber: number;
  columnNumber: number;
}

interface ConsoleStackTrace {
  callFrames: ConsoleCallFrame[];
}

interface ConsoleArg {
  type: string;
  value?: unknown;
  className?: string;
  description?: string;
  objectId?: string;
  subtype?: string;
}

interface ConsoleMessage {
  type: string;
  args: ConsoleArg[];
  stackTrace?: ConsoleStackTrace;
  url?: string;
  consoleTag?: string;
}

function formatConsoleMessage({
  type,
  args,
  stackTrace,
  consoleTag,
}: ConsoleMessage): string {
  return `- [${type}/${consoleTag === 'Lepus' ? 'main-thread' : 'background'}]: ${args
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
  }`;
}

export function registerGetConsoleCommand(program: Command, context: Context) {
  program
    .command('get-console')
    .description('Capture console logs from the device')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
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
    .option('--thread <thread...>', 'VM thread to target: background or main', [
      'background',
      'main',
    ])
    .option(
      '-w, --watch',
      'Stream console logs as they arrive, printing each message immediately, until interrupted (Ctrl+C) or --limit is reached',
      false,
    )
    .action(async (options) => {
      const { offset = 0, includeStackTraces, level, watch } = options;
      let { limit, thread } = options;

      if (!Array.isArray(thread)) {
        thread = [thread];
      }

      if (!thread.every((t: string) => t === 'background' || t === 'main')) {
        throw new Error(
          `Invalid thread: ${thread}. Expected 'background' or 'main'.`,
        );
      }

      if (limit) {
        limit = Math.max(1, Math.min(100, limit));
      }

      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );

      await using stream = await connector.sendCDPStream(
        clientId,
        Number(sessionId),
        ReadableStream.from([
          { method: 'Page.enable' },
          { method: 'Page.getResourceTree' },
          ...thread.map((t: string) => ({
            method: 'Debugger.enable',
            sessionId: t === 'main' ? 'Main' : undefined,
          })),
          ...thread.map((t: string) => ({
            method: 'Runtime.enable',
            sessionId: t === 'main' ? 'Main' : undefined,
          })),
        ]),
      );

      const defaultLevels = ['info', 'log', 'warning', 'error'];
      const allowedLevels = level || defaultLevels;
      let skipped = 0;
      let produced = 0;

      if (watch) {
        const reader = stream.getReader();
        let aborted = false;
        const onSigint = () => {
          aborted = true;
          reader.cancel().catch(() => {});
        };
        process.once('SIGINT', onSigint);

        try {
          while (!aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value.method !== 'Runtime.consoleAPICalled') continue;
            const params = value.params as ConsoleMessage;
            if (!allowedLevels.includes(params.type)) continue;

            if (skipped < offset) {
              skipped++;
              continue;
            }

            if (!includeStackTraces && params.type !== 'error') {
              delete params.stackTrace;
            }

            console.log(formatConsoleMessage(params));
            produced++;

            if (limit && produced >= limit) {
              await reader.cancel();
              break;
            }
          }
        } finally {
          process.off('SIGINT', onSigint);
          reader.releaseLock();
        }

        return;
      }

      const messages: ConsoleMessage[] = [];

      for await (const value of readUntilIdle(stream, {
        idleMs: 500,
        maxMs: 5000,
      })) {
        if (value.method !== 'Runtime.consoleAPICalled') continue;
        const params = value.params as ConsoleMessage;
        if (!allowedLevels.includes(params.type)) continue;

        if (skipped < offset) {
          skipped++;
          continue;
        }

        if (!includeStackTraces && params.type !== 'error') {
          delete params.stackTrace;
        }

        messages.push(params);

        if (limit && messages.length >= limit) {
          break;
        }
      }

      console.log(messages.map(formatConsoleMessage).join('\n'));
    });
}
