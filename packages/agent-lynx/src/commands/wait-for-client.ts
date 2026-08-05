// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { setTimeout as delay } from 'node:timers/promises';
import { Connector } from '@lynx-js/devtool-connector';
import type { Client } from '@lynx-js/devtool-connector/transport';
import type { Command } from 'commander';
import {
  type Context,
  formatNoClientByNameMessage,
  getClientsByName,
  raceWithTimeout,
} from './utils.ts';

type WaitForClientConnector = Pick<Connector, 'listClients'>;

interface WaitForClientCommandOptions {
  clientName?: string;
  timeoutMs?: number;
  intervalMs?: number;
  print?: (line: string) => void;
  waitForRetry?: (ms: number) => Promise<void>;
}

export interface WaitForClientResult {
  clients: Client[];
  attempts: number;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 1_000;
const DISCOVERY_TIMEOUT = Symbol('discovery timeout');

function parseSecondsOption(value: string, optionName: string): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(
      `Invalid ${optionName} value: ${value}. Use a non-negative number of seconds.`,
    );
  }
  return seconds * 1_000;
}

function selectClients(clients: Client[], clientName?: string): Client[] {
  if (!clientName) {
    const firstClient = clients[0];
    return firstClient ? [firstClient] : [];
  }

  return getClientsByName(clients, clientName);
}

function createNoClientError(
  clientName: string | undefined,
  clients: Client[],
): Error {
  if (clientName) {
    return new Error(formatNoClientByNameMessage(clientName, clients));
  }
  return new Error('No Lynx DevTool clients were found before timeout.');
}

export async function runWaitForClientCommand(
  connector: WaitForClientConnector,
  {
    clientName,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    print = console.log,
    waitForRetry = delay,
  }: WaitForClientCommandOptions,
): Promise<WaitForClientResult> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  let attempts = 0;
  let lastClients: Client[] = [];

  for (;;) {
    const discovery = await raceWithTimeout(
      connector.listClients(),
      Math.max(0, deadline - Date.now()),
      DISCOVERY_TIMEOUT,
    );
    if (discovery === DISCOVERY_TIMEOUT) {
      throw createNoClientError(clientName, lastClients);
    }
    lastClients = discovery;
    attempts++;
    const selectedClients = selectClients(lastClients, clientName);
    if (selectedClients.length > 0) {
      print(JSON.stringify(selectedClients, null, 2));
      return {
        clients: lastClients,
        attempts,
        durationMs: Date.now() - startedAt,
      };
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw createNoClientError(clientName, lastClients);
    }

    await waitForRetry(Math.min(intervalMs, remainingMs));
  }
}

export function registerWaitForClientCommand(
  program: Command,
  { transports }: Context,
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
      const connector = new Connector(transports);
      const timeoutMs = parseSecondsOption(options.timeout, '--timeout');
      const intervalMs = parseSecondsOption(options.interval, '--interval');

      await runWaitForClientCommand(connector, {
        clientName: options.clientName,
        timeoutMs,
        intervalMs,
      });
    });
}
