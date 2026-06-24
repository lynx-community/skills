// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  ReadableStream,
  ReadableStreamDefaultReader,
} from 'node:stream/web';
import { setTimeout as delay } from 'node:timers/promises';
import { Connector } from '@lynx-js/devtool-connector';
import type { Client, Transport } from '@lynx-js/devtool-connector/transport';

export interface Context {
  transports: Transport[];
}

export const CLIENT_OPTION = [
  '-c, --client <clientId>',
  'Client ID (optional, auto-discovered if omitted).',
] as const;

export const CLIENT_NAME_OPTION = [
  '--client-name <name>',
  'Client package/app name (optional, resolved from list-clients; e.g. com.example.app)',
] as const;

export const SESSION_OPTION = [
  '-s, --session <sessionId>',
  'Session ID (optional, will auto-discover if not provided)',
] as const;

export async function getFirstClient(connector: Connector): Promise<string> {
  const clients = await connector.listClients();
  const firstClient = clients[0];
  if (!firstClient) {
    throw new Error('No available clients found.');
  }
  return firstClient.id;
}

function uniqueNonEmptyStrings(values: Array<unknown>): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function getClientNames(client: Client): string[] {
  return uniqueNonEmptyStrings([
    client.info.AppProcessName,
    client.info.bundleId,
    client.info.bundleName,
    client.info.App,
  ]);
}

function formatClientForError(client: Client): string {
  const names = getClientNames(client);
  const suffix = names.length > 0 ? ` (${names.join(', ')})` : '';
  return `  ${client.id}${suffix}`;
}

export async function getClientByName(
  connector: Pick<Connector, 'listClients'>,
  clientName: string,
): Promise<string> {
  const clients = await connector.listClients();
  const matches = clients.filter((client) =>
    getClientNames(client).includes(clientName),
  );

  if (matches.length === 1) {
    const matchedClient = matches[0]!;
    return matchedClient.id;
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple clients found matching --client-name "${clientName}". Use --client with one of:\n` +
        matches.map(formatClientForError).join('\n'),
    );
  }

  const availableClients = clients.map(formatClientForError).join('\n');
  throw new Error(
    `No client found matching --client-name "${clientName}".` +
      (availableClients
        ? `\nAvailable clients:\n${availableClients}`
        : '\nNo real-device clients are available.'),
  );
}

export async function getLatestSession(
  connector: Connector,
  clientId: string,
): Promise<string> {
  const sessions = await connector.sendListSessionMessage(clientId);
  if (!sessions || sessions.length === 0) {
    throw new Error(`No available sessions found for client: ${clientId}`);
  }
  const latestSession = sessions.reduce((max, session) =>
    Number(session.session_id) > Number(max.session_id) ? session : max,
  );
  return String(latestSession.session_id);
}

export async function resolveClient(
  { transports }: Context,
  options: { client?: string; clientName?: string },
): Promise<{ connector: Connector; clientId: string }> {
  const connector = new Connector(transports);
  if (options.client && options.clientName) {
    throw new Error('Use either --client or --client-name, not both.');
  }
  const clientId =
    options.client ??
    (options.clientName
      ? await getClientByName(connector, options.clientName)
      : await getFirstClient(connector));
  return { connector, clientId };
}

export async function resolveClientAndSession(
  context: Context,
  options: { client?: string; clientName?: string; session?: string },
): Promise<{ connector: Connector; clientId: string; sessionId: string }> {
  const { connector, clientId } = await resolveClient(context, options);
  const sessionId =
    options.session ?? (await getLatestSession(connector, clientId));
  return { connector, clientId, sessionId };
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function parseOnOff(input: string, optionName = '--status'): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'on' || normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'off' || normalized === 'false' || normalized === '0') {
    return false;
  }
  throw new Error(`Invalid ${optionName} value: ${input}. Use on/off.`);
}

export function buildWatchSignal(
  watch: boolean,
  fallbackTimeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  if (!watch) {
    return {
      signal: AbortSignal.timeout(fallbackTimeoutMs),
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  const onSigint = () => {
    controller.abort();
  };
  process.once('SIGINT', onSigint);
  return {
    signal: controller.signal,
    cleanup: () => process.off('SIGINT', onSigint),
  };
}

type ReadOrTimeoutResult<T> = ReadableStreamReadResult<T> | 'timeout';

async function readOrTimeout<T>(
  reader: ReadableStreamDefaultReader<T>,
  idleMs: number,
): Promise<ReadOrTimeoutResult<T>> {
  const idleAbortController = new AbortController();
  const idle = delay(idleMs, 'timeout' as const, {
    signal: idleAbortController.signal,
  });

  try {
    return await Promise.race([reader.read(), idle]);
  } finally {
    idleAbortController.abort();
    await idle.catch(() => {});
  }
}

export async function* readUntilIdle<T>(
  stream: ReadableStream<T>,
  opts: { idleMs: number; maxMs: number },
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const startTime = Date.now();
  let terminated = false;
  try {
    while (Date.now() - startTime < opts.maxMs) {
      const result = await readOrTimeout(reader, opts.idleMs);
      if (result === 'timeout') {
        await reader.cancel();
        terminated = true;
        return;
      }
      const { done, value } = result;
      if (done) {
        terminated = true;
        return;
      }
      yield value;
    }
    await reader.cancel();
    terminated = true;
  } finally {
    if (!terminated) {
      await reader.cancel().catch(() => {});
    }
    reader.releaseLock();
  }
}
