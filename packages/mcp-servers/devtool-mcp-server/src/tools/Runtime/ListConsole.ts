// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomInt } from 'node:crypto';
import * as z from 'zod';
import { clientId, sessionId, thread } from '../../schema/index.ts';
import { raceWithTimeout } from '../../utils/raceWithTimeout.ts';
import { readableFromIterable } from '../../utils/readableFromIterable.ts';
import { defineTool } from '../defineTool.ts';

interface ConsoleCallFrame {
  url: string;
  lineNumber: number;
  columnNumber: number;
}

interface ConsoleStackTrace {
  callFrames: ConsoleCallFrame[];
}

interface ConsoleArg {
  value?: unknown;
  className?: string;
  description?: string;
  objectId?: string;
}

interface ConsoleMessage {
  type: string;
  args: ConsoleArg[];
  timestamp?: number;
  stackTrace?: ConsoleStackTrace;
  consoleTag?: string;
}

function formatConsoleTimestamp(timestamp?: number): string {
  if (typeof timestamp !== 'number') return '';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ''
    : `[${date.toISOString().slice(-13)}] `;
}

export const ListConsole = /*#__PURE__*/ defineTool({
  name: 'Runtime_listConsole',
  description: 'List console messages with UTC time, level, and VM thread.',
  schema: {
    clientId,
    sessionId,

    offset: z.number().optional().describe(
      'The number of console messages to skip before returning results.',
    ),
    limit: z.number().min(1).max(100).optional().describe(
      'The maximum number of console messages to return.',
    ),
    includeStackTraces: z.boolean().optional().describe(
      'By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.',
    ),
    level: z.array(z.enum(['log', 'info', 'warning', 'error'])).optional()
      .describe(
        "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']",
      ),
    thread: z.array(thread).optional().describe(
      'VM thread to target: background or main. Defaults to both.',
    ),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    const {
      offset = 0,
      limit,
      includeStackTraces = false,
      level = ['info', 'log', 'warning', 'error'],
      thread: threads = ['background', 'main'],
    } = params;

    const requestId = randomInt(10_000, 50_000);
    const requests = [
      { method: 'Page.enable' },
      ...threads.map(t => ({
        method: 'Runtime.enable',
        sessionId: t === 'main' ? 'Main' : undefined,
      })),
    ].map((request, index) => ({ id: requestId + index, ...request }));
    const pendingRequests = new Set(requests.map(request => request.id));

    await using stream = await connector.sendCDPStream(
      params.clientId,
      params.sessionId,
      readableFromIterable(requests),
    );

    const messages: ConsoleMessage[] = [];
    let skipped = 0;

    const reader = stream.getReader();
    const IDLE_TIMEOUT = 500;
    const MAX_TOTAL_TIME = 5000;
    const startTime = Date.now();

    try {
      while (true) {
        const remaining = MAX_TOTAL_TIME - (Date.now() - startTime);
        if (remaining <= 0) {
          await reader.cancel();
          break;
        }
        // A slow Runtime.enable response is still setup, not an idle console.
        const timeout = pendingRequests.size > 0
          ? remaining
          : Math.min(IDLE_TIMEOUT, remaining);
        const result = await raceWithTimeout(
          reader.read(),
          timeout,
          'timeout' as const,
        );
        if (result === 'timeout') {
          await reader.cancel();
          break;
        }

        const { done, value } = result;
        if (done) break;

        if ('id' in value && typeof value.id === 'number') {
          pendingRequests.delete(value.id);
        }

        if (value.method === 'Runtime.consoleAPICalled') {
          const message = value.params as ConsoleMessage;
          if (
            !level.includes(
              message.type as 'log' | 'info' | 'warning' | 'error',
            )
          ) {
            continue;
          }

          if (skipped < offset) {
            skipped++;
            continue;
          }

          if (!includeStackTraces && message.type !== 'error') {
            delete message.stackTrace;
          }

          messages.push(message);

          if (limit && messages.length >= limit) {
            await reader.cancel();
            break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    response.appendLines(
      ...messages
        .map(({ type, args, timestamp, stackTrace, consoleTag }) =>
          `${formatConsoleTimestamp(timestamp)}[${type}/${
            consoleTag === 'Lepus' ? 'main-thread' : 'background'
          }] ${
            args
              .map(arg => {
                if (arg.objectId) {
                  return `<${
                    arg.description || arg.className || 'Object'
                  } (objectId:${arg.objectId})>`;
                }
                return String(arg.value);
              })
              .join(' ')
          }${
            stackTrace
              ? `\n${
                stackTrace.callFrames
                  .map(({ url, lineNumber, columnNumber }) =>
                    `    at ${url}:${lineNumber}:${columnNumber}`
                  )
                  .join('\n')
              }`
              : ''
          }`
        ),
    );
  },
});
