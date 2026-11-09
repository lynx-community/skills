// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable */
import { nextRequestId } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import { ReadableStream } from 'node:stream/web';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import {
  CLIENT_OPTION,
  type Context,
  readUntilIdle,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

interface ScriptParsedEvent {
  scriptId: string;
  url: string;
  [key: string]: unknown;
}

export function registerGetSourcesCommand(program: Command, context: Context) {
  program
    .command('get-sources')
    .description('List all parsed scripts.')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .action(async (options: {
      client?: string;
      session?: string;
    }) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );
      logMonitor(MonitorCode.COMMAND_GET_SOURCES, {});

      const numericSessionId = Number(sessionId);

      const barrierId = nextRequestId();
      const messages: { id?: number; method: string; }[] = [
        { method: 'Debugger.disable' },
        { method: 'Debugger.enable' },
        // Lynx emits the initial script events before this enable response.
        { id: barrierId, method: 'Debugger.enable' },
      ];

      await using stream = await connector.sendCDPStream(
        clientId,
        numericSessionId,
        ReadableStream.from(messages),
      );

      const scripts: ScriptParsedEvent[] = [];
      let didReceiveAnyResponse = false;

      for await (
        const value of readUntilIdle(stream, {
          idleMs: 2000,
          maxMs: 5000,
          onIdle: () => !didReceiveAnyResponse && scripts.length === 0,
        })
      ) {
        if (value.method === 'Debugger.scriptParsed') {
          scripts.push(value.params as ScriptParsedEvent);
        }
        const response = value as unknown as {
          id?: unknown;
          result?: unknown;
          error?: unknown;
        };
        if (response.id !== undefined) {
          didReceiveAnyResponse = true;
        }
        if (
          response.id === barrierId
          && response.result !== undefined
          && response.error === undefined
          && scripts.length > 0
        ) {
          break;
        }
      }

      logMonitor(MonitorCode.COMMAND_GET_SOURCES_SUCCESS, {
        m1: scripts.length,
      });

      console.log(
        JSON.stringify(
          scripts.map(({ scriptId, url }) => ({ scriptId, url })),
          null,
          2,
        ),
      );
    });
}
