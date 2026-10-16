// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CommandClient,
  StreamCommandParams,
} from '@lynx-js/devtool-connector/command';
import type { Client } from '@lynx-js/devtool-connector/transport';
import { Command } from 'commander';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import { type Context, getCommandClient } from './utils.ts';

interface WaitForClientCommandOptions {
  clientName?: string;
  timeoutMs?: number;
  intervalMs?: number;
  print?: (line: string) => void;
  logMonitor?: typeof logMonitor;
}

export interface WaitForClientResult {
  clients: Client[];
  attempts: number;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 1_000;
function parseSecondsOption(value: string, optionName: string): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(
      `Invalid ${optionName} value: ${value}. Use a non-negative number of seconds.`,
    );
  }
  return seconds * 1_000;
}

function reportListClientsSuccess(
  clients: Client[],
  attempt: number,
  writeMonitor: typeof logMonitor,
): void {
  writeMonitor(MonitorCode.COMMAND_WAIT_FOR_CLIENT_LIST_CLIENTS_SUCCESS, {
    m1: clients.length,
    m2: attempt,
    d1: JSON.stringify(
      clients.map(client => ({
        App: client.info.App,
        deviceModel: client.info.deviceModel,
        osType: client.info.osType,
        osVersion: client.info.osVersion,
        sdkVersion: client.info.sdkVersion,
      })),
    ),
  });
}

export async function runWaitForClientCommand(
  commandClient: CommandClient,
  {
    clientName,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    print = console.log,
    logMonitor: writeMonitor = logMonitor,
  }: WaitForClientCommandOptions,
): Promise<WaitForClientResult> {
  writeMonitor(MonitorCode.COMMAND_WAIT_FOR_CLIENT, {
    d1: clientName ?? '',
    m1: timeoutMs,
    m2: intervalMs,
  });
  const params: StreamCommandParams<'wait-for-client'> = {
    ...(clientName === undefined ? {} : { clientName }),
    timeoutMs,
    intervalMs,
  };
  const signal = AbortSignal.timeout(
    Math.min(timeoutMs + 15_000, 2_147_483_647),
  );

  for await (
    const event of commandClient.stream('wait-for-client', params, {
      signal,
      method: 'POST',
    })
  ) {
    if (!event.ok) throw new Error(event.error.message);
    const availableClients = event.data.availableClients;
    reportListClientsSuccess(
      availableClients,
      event.data.attempts,
      writeMonitor,
    );
    if (event.data.matched) {
      writeMonitor(MonitorCode.COMMAND_WAIT_FOR_CLIENT_SUCCESS, {
        m1: availableClients.length,
        m2: event.data.attempts,
        m3: event.data.elapsedMs,
        d1: JSON.stringify(
          availableClients.map(client => ({
            App: client.info.App,
            deviceModel: client.info.deviceModel,
            osType: client.info.osType,
            osVersion: client.info.osVersion,
            sdkVersion: client.info.sdkVersion,
          })),
        ),
      });
      print(JSON.stringify(event.data.clients, null, 2));
      return {
        clients: availableClients,
        attempts: event.data.attempts,
        durationMs: event.data.elapsedMs,
      };
    }
  }

  throw new Error(
    'Wait-for-client stream ended before producing a final result.',
  );
}

export function registerWaitForClientCommand(
  program: Command,
  context: Context,
) {
  program
    .command('wait-for-client')
    .description('Wait until a client is available')
    .option(
      '--client-name <name>',
      'Client package/app name to wait for; omit to wait for the first client (e.g. com.lynx.uiapp)',
    )
    .option('--timeout <seconds>', 'Maximum seconds to wait', '30')
    .option(
      '--interval <seconds>',
      'Seconds between client discovery attempts',
      '1',
    )
    .action(async (options) => {
      const timeoutMs = parseSecondsOption(options.timeout, '--timeout');
      const intervalMs = parseSecondsOption(options.interval, '--interval');
      await runWaitForClientCommand(getCommandClient(context), {
        clientName: options.clientName,
        timeoutMs,
        intervalMs,
      });
    });
}
