// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import type { Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';
import { getFirstClient, getFirstSession } from './utils.ts';

interface ScriptParsedEvent {
  scriptId: string;
  url: string;
  [key: string]: unknown;
}

export function registerGetSourcesCommand(
  program: Command,
  connector: Connector,
) {
  program
    .command('get-sources')
    .description('List all parsed scripts.')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .option(
      '-s, --session <sessionId>',
      'Session ID (optional, will auto-discover if not provided)',
    )
    .action(async (options) => {
      let { client: clientId, session: sessionId } = options;

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      if (!sessionId) {
        sessionId = await getFirstSession(connector, clientId);
      }

      const numericSessionId = Number(sessionId);

      const messages: { sessionId: number; method: string }[] = [
        {
          sessionId: numericSessionId,
          method: 'Debugger.disable',
        },
        {
          sessionId: numericSessionId,
          method: 'Debugger.enable',
        },
      ];

      await using stream = await connector.sendCDPStream(
        clientId,
        ReadableStream.from(messages),
      );

      const scripts: ScriptParsedEvent[] = [];

      const reader = stream.getReader();
      const IDLE_TIMEOUT = 2000; // Increased timeout for reload
      const MAX_TOTAL_TIME = 5000; // Increased max time for reload
      const startTime = Date.now();

      try {
        while (Date.now() - startTime < MAX_TOTAL_TIME) {
          const result = await Promise.race([
            reader.read(),
            setTimeout(IDLE_TIMEOUT, 'timeout' as const),
          ]);
          if (result === 'timeout') {
            await reader.cancel();
            break;
          }

          const { done, value } = result;
          if (done) break;

          if (value.method === 'Debugger.scriptParsed') {
            scripts.push(value.params as ScriptParsedEvent);
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(
        JSON.stringify(
          scripts.map(({ scriptId, url }) => ({ scriptId, url })),
          null,
          2,
        ),
      );
    });
}
