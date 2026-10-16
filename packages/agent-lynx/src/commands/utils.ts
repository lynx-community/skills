// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type {
  CommandClient,
  getOriginalNodeSourceInfo,
  SnapshotAfterResult,
} from '@lynx-js/devtool-connector/command';
import type { Transport } from '@lynx-js/devtool-connector/transport';
import type { ReadableStream } from 'node:stream/web';
import { setTimeout as delay } from 'node:timers/promises';
import { DEFAULT_CLI_PLACEHOLDER } from '../cli-invocation.ts';
import { logMonitor, MonitorCode } from '../telemetry.ts';

export interface Context {
  transports: Transport[];
  getSourceInfo?: typeof getOriginalNodeSourceInfo;
  cliPlaceholder?: string;
  /** ActionCore invocation channel: daemon HTTP by default, in-process for direct mode. */
  commandClient?: CommandClient;
  /** Product-specific default target selection for commands using Connector directly. */
  targetResolver?: {
    getFirstClient: typeof getFirstClient;
    getLatestSession: typeof getLatestSession;
  };
}

/** Race an operation against a deadline and always cancel the losing timer. */
export async function raceWithTimeout<T, TimeoutValue>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  timeoutValue: TimeoutValue,
  options?: { signal?: AbortSignal; },
): Promise<T | TimeoutValue> {
  const controller = new AbortController();
  const signal = options?.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  const timeout = delay(timeoutMs, timeoutValue, { signal });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    controller.abort();
    await timeout.catch(() => {});
  }
}

/**
 * Shared commander option tuple for `-c, --client <clientId>`. Spread into
 * `.option(...CLIENT_OPTION)` so every command uses the same flag name and
 * description.
 */
export const CLIENT_OPTION = [
  '-c, --client <clientId>',
  'Client ID (optional, auto-discovered if omitted).',
] as const;

/**
 * Shared commander option tuple for `-s, --session <sessionId>`. Spread into
 * `.option(...SESSION_OPTION)` so every command uses the same flag name and
 * description.
 */
export const SESSION_OPTION = [
  '-s, --session <sessionId>',
  'Session ID (optional, will auto-discover if not provided)',
] as const;

export const JSON_OPTION = [
  '--json',
  'Emit a machine-readable command result envelope instead of compact text.',
] as const;

export const SNAPSHOT_AFTER_OPTION = [
  '--snapshot',
  'Refresh snapshot refs after this mutating action and include them in JSON output.',
] as const;

export function getCommandClient(context: Context): CommandClient {
  if (!context.commandClient) {
    throw new Error('The command client has not been initialized.');
  }
  return context.commandClient;
}

export function formatSnapshotRefresh(
  data: SnapshotAfterResult,
  commandName = DEFAULT_CLI_PLACEHOLDER,
): string {
  if (data.snapshot) {
    return `Snapshot refreshed with ${data.snapshot.refs.length} refs.`;
  }
  if (data.snapshotError) {
    return `Snapshot refresh failed: ${data.snapshotError.message}. Re-run \`${commandName} snapshot\` before using refs again.`;
  }
  return `Re-run \`${commandName} snapshot\` before using refs again.`;
}

export async function getFirstClient(
  connector: Connector,
): Promise<string> {
  logMonitor(MonitorCode.UTILS_GET_FIRST_CLIENT, {});
  const clients = await connector.listClients();
  const firstClient = clients[0];
  if (!firstClient) {
    throw new Error('No available clients found.');
  }
  logMonitor(MonitorCode.UTILS_GET_FIRST_CLIENT_SUCCESS, {
    m1: clients.length,
    d1: JSON.stringify([{
      App: firstClient.info.App,
      deviceModel: firstClient.info.deviceModel,
      osType: firstClient.info.osType,
      osVersion: firstClient.info.osVersion,
      sdkVersion: firstClient.info.sdkVersion,
    }]),
  });
  return firstClient.id;
}

export async function getLatestSession(
  connector: Connector,
  clientId: string,
): Promise<string> {
  logMonitor(MonitorCode.UTILS_GET_LATEST_SESSION, {});
  const sessions = await connector.sendListSessionMessage(clientId);
  if (!sessions || sessions.length === 0) {
    throw new Error(`No available sessions found for client: ${clientId}`);
  }
  const latestSession = sessions.reduce((max, session) =>
    Number(session.session_id) > Number(max.session_id) ? session : max
  );
  logMonitor(MonitorCode.UTILS_GET_LATEST_SESSION_SUCCESS, {
    m1: sessions.length,
    d1: JSON.stringify([{
      type: latestSession.type,
      session_id: latestSession.session_id,
    }]),
  });
  return String(latestSession.session_id);
}

/**
 * Construct a Connector and resolve the `--client` option, falling back to
 * the first discovered client when `options.client` is not set. Use in every
 * command handler that only needs a client (no session).
 */
export async function resolveClient(
  context: Context,
  options: { client?: string; },
): Promise<{ connector: Connector; clientId: string; }> {
  const connector = new Connector(context.transports);
  const clientId = options.client
    ?? await (context.targetResolver?.getFirstClient ?? getFirstClient)(
      connector,
    );
  return { connector, clientId };
}

/**
 * Construct a Connector and resolve the `--client` and `--session` options,
 * falling back to the first discovered client and the latest discovered
 * session respectively. Use in every command handler that needs both.
 */
export async function resolveClientAndSession(
  context: Context,
  options: { client?: string; session?: string; },
): Promise<{ connector: Connector; clientId: string; sessionId: string; }> {
  const { connector, clientId } = await resolveClient(context, options);
  const sessionId = options.session
    ?? await (context.targetResolver?.getLatestSession ?? getLatestSession)(
      connector,
      clientId,
    );
  return { connector, clientId, sessionId };
}

/**
 * Predicate for the `AbortError` swallow pattern used across stream-driven
 * commands. Accepts any value (typically from a `catch` binding).
 *
 * Usage:
 *
 * ```ts
 * catch (err) {
 *   if (!isAbortError(err)) throw err;
 * }
 * ```
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * Parse a user-supplied on/off-style value from a `--status`-type option.
 * Accepts `on|off|true|false|1|0` (case-insensitive, whitespace-trimmed).
 *
 * @throws if the input does not match any accepted form.
 */
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

/**
 * Build an `AbortSignal` for a watch-or-timeout style command.
 *
 * - When `watch` is `true`: returns a signal wired to `SIGINT` so pressing
 *   Ctrl+C aborts the operation. Callers MUST invoke `cleanup()` in a
 *   `finally` block to remove the process-level listener, otherwise it leaks
 *   across subsequent async iterations.
 * - When `watch` is `false`: returns a signal bounded by
 *   `AbortSignal.timeout(fallbackTimeoutMs)` and a no-op cleanup.
 *
 * The returned `signal` is safe to pass into `sendStream`/`pipeTo`/etc. The
 * shape `{signal, cleanup}` is designed so the call site can stay linear:
 *
 * ```ts
 * const { signal, cleanup } = buildWatchSignal(watch, 1_000);
 * try {
 *   await using stream = await connector.sendStream(...args, { signal });
 *   for await (const chunk of stream) { ... }
 * } catch (err) {
 *   if (!isAbortError(err)) throw err;
 * } finally {
 *   cleanup();
 * }
 * ```
 */
export function buildWatchSignal(
  watch: boolean,
  fallbackTimeoutMs: number,
): { signal: AbortSignal; cleanup: () => void; } {
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

/**
 * Read a `ReadableStream` with both an idle timeout and an overall deadline,
 * yielding each chunk to the caller. The generator:
 *
 * - Terminates normally when the stream reports `done`.
 * - Terminates (and cancels the stream) when no chunk arrives for `idleMs`,
 *   unless `onIdle` returns true to continue the same pending read.
 * - Terminates (and cancels the stream) when `maxMs` elapses from start.
 * - Cancels the stream if the caller `break`s out of the `for await` loop.
 *
 * Use this for "collect for a short window" commands that sit on top of a
 * CDP/xdb stream. For continuous "watch" behavior, consume the stream
 * directly or pass a SIGINT-wired AbortSignal instead.
 */
export async function* readUntilIdle<T>(
  stream: ReadableStream<T>,
  opts: {
    idleMs: number | (() => number);
    maxMs: number;
    onIdle?: () => boolean;
  },
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const startTime = Date.now();
  let terminated = false;
  let pendingRead: Promise<ReadableStreamReadResult<T>> | undefined;
  try {
    while (true) {
      const elapsedMs = Date.now() - startTime;
      if (elapsedMs >= opts.maxMs) {
        await reader.cancel();
        terminated = true;
        return;
      }

      pendingRead ??= reader.read();
      const idleMs = typeof opts.idleMs === 'function'
        ? opts.idleMs()
        : opts.idleMs;
      const remainingMs = opts.maxMs - elapsedMs;
      const deadlineWins = remainingMs <= idleMs;
      const result = await raceWithTimeout(
        pendingRead,
        Math.min(idleMs, remainingMs),
        'timeout' as const,
      );
      if (result === 'timeout') {
        if (deadlineWins || Date.now() - startTime >= opts.maxMs) {
          await reader.cancel();
          terminated = true;
          return;
        }
        if (opts.onIdle?.()) continue;
        await reader.cancel();
        terminated = true;
        return;
      }
      pendingRead = undefined;
      const { done, value } = result;
      if (done) {
        terminated = true;
        return;
      }
      yield value;
    }
  } finally {
    if (!terminated) {
      // Caller broke out of the loop early; cancel the underlying stream so
      // disposal (`await using`) does not hang waiting for more chunks.
      await reader.cancel().catch(() => {});
    }
    reader.releaseLock();
  }
}
