// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';

import { Command, InvalidArgumentError } from 'commander';
import {
  CLIENT_OPTION,
  type Context,
  isAbortError,
  readUntilIdle,
  resolveClient,
} from './utils.ts';

interface HostEventRecord {
  version: 1;
  source: 'hsr';
  clientId: string;
  sessionId: -1;
  receivedAt: string;
  message: string;
  data?: unknown;
}

/** The CLI entrypoint may exit after cleanup, discarding cancelled pipe data. */
export class InterruptedLogOutputError extends Error {
  constructor() {
    super('Log output was interrupted with an unfinished pipe write');
    this.name = 'InterruptedLogOutputError';
  }
}

function positiveInteger(value: string): number {
  const parsed = Number(value);
  if (!/^\d+$/u.test(value) || !Number.isSafeInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError('Expected a positive integer.');
  }
  return parsed;
}

function isBrokenPipe(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EPIPE';
}

function isOwnAbort(error: unknown, signal: AbortSignal): boolean {
  if (!signal.aborted) return false;
  const seen = new Set<unknown>();
  for (let current = error; !seen.has(current);) {
    if (current === signal.reason || isAbortError(current)) return true;
    seen.add(current);
    if (!(current instanceof Error)) return false;
    // Transports may wrap a cancelled subscribe handshake with target context.
    current = current.cause;
  }
  return false;
}

function recordEvent(clientId: string, message: string): HostEventRecord {
  const record: HostEventRecord = {
    version: 1,
    source: 'hsr',
    clientId,
    sessionId: -1,
    receivedAt: new Date().toISOString(),
    message,
  };
  try {
    record.data = JSON.parse(message) as unknown;
  } catch {
    // The protocol allows arbitrary strings, including empty messages.
  }
  return record;
}

async function writeLine(
  line: string,
  signal: AbortSignal,
  onAbandon: (completed: Promise<void>) => void,
): Promise<void> {
  signal.throwIfAborted();
  let complete!: () => void;
  const completed = new Promise<void>((resolve) => {
    complete = resolve;
  });
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      // Node cannot cancel an OS stdout write. The entrypoint owns process
      // termination; library callers retain an error handler until it settles.
      onAbandon(completed);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    // Await the write callback: a slow consumer applies backpressure rather
    // than allowing an unbounded queue of log events to accumulate in stdout.
    process.stdout.write(line, (error) => {
      complete();
      signal.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else resolve();
    });
  });
}

export function registerLogsCommand(program: Command, context: Context): void {
  program
    .command('logs')
    .description('Read asynchronous Host Script observer events')
    .option(...CLIENT_OPTION)
    .option('-f, --follow', 'Keep listening until interrupted', false)
    .option('-j, --json', 'Output one complete event record per line', false)
    .option('--limit <number>', 'Stop after this many events', positiveInteger)
    .addHelpText(
      'after',
      '\nListens to HSR.messageReceived on global session -1. Without --follow, '
        + 'capture ends after 500 ms of silence or 5 seconds. No history or replay '
        + 'is available. Start listening before installing observers or triggering actions.',
    )
    .action(async (options: {
      client?: string;
      follow: boolean;
      json: boolean;
      limit?: number;
    }) => {
      const lifetime = new AbortController();
      let outputError: Error | undefined;
      let interrupted = false;
      let abandonedOutput: Promise<void> | undefined;
      const stop = () => lifetime.abort();
      const interrupt = () => {
        interrupted = true;
        stop();
      };
      const onOutputError = (error: Error) => {
        outputError = error;
        lifetime.abort(error);
      };
      process.once('SIGINT', interrupt);
      process.once('SIGTERM', interrupt);
      process.stdout.on('error', onOutputError);
      process.stdout.once('close', stop);

      try {
        const { connector, clientId } = await resolveClient(context, options);
        lifetime.signal.throwIfAborted();
        await using stream = await connector.sendCDPStream(
          clientId,
          -1,
          ReadableStream.from([]),
          { signal: lifetime.signal },
        );
        lifetime.signal.throwIfAborted();
        if (options.follow) {
          process.stderr.write(
            `Listening for HSR events on ${clientId} (session -1).\n`,
          );
        }
        const events = options.follow
          ? stream
          : readUntilIdle(stream, { idleMs: 500, maxMs: 5000 });
        let produced = 0;
        for await (const event of events) {
          if (event.method !== 'HSR.messageReceived') continue;
          const params = event.params;
          if (
            !params || typeof params !== 'object' || !('message' in params)
            || typeof params.message !== 'string'
          ) continue;
          const record = recordEvent(clientId, params.message);
          await writeLine(
            options.json
              ? `${JSON.stringify(record)}\n`
              : `[${record.receivedAt}] [hsr] ${record.message}\n`,
            lifetime.signal,
            completed => {
              abandonedOutput = completed;
            },
          );
          produced++;
          if (options.limit !== undefined && produced >= options.limit) break;
        }
      } catch (error) {
        if (outputError && !isBrokenPipe(outputError)) throw outputError;
        if (
          !isBrokenPipe(error)
          && !isOwnAbort(error, lifetime.signal)
        ) throw error;
      } finally {
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', interrupt);
        const removeOutputHandler = () =>
          process.stdout.off('error', onOutputError);
        if (abandonedOutput) {
          // A failed write invokes its callback before emitting "error".
          // Keep the listener through that emission even after parseAsync ends.
          void abandonedOutput.then(() => {
            setImmediate(removeOutputHandler);
          });
        } else {
          removeOutputHandler();
        }
        process.stdout.off('close', stop);
      }
      if (interrupted && abandonedOutput) throw new InterruptedLogOutputError();
    });
}
