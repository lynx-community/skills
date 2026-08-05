// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import type { CDPResponseMessage, Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';
import { registerTraceQueryCommands } from './trace-query.ts';
import {
  CLIENT_OPTION,
  type Context,
  isAbortError,
  resolveClient,
} from './utils.ts';

const DEBUG_MODE_KEY = 'enable_debug_mode';
const DEFAULT_TIMEOUT_SECONDS = 30;
const IO_CLOSE_TIMEOUT_MS = 5_000;
const IO_READ_CHUNK_SIZE = 5 * 1024 * 1024;
const TRACE_DOCUMENTATION_URL =
  'https://lynxjs.org/guide/devtool/trace/record-trace.html#setup';

type JSProfileType = '' | 'quickjs' | 'v8';

interface TraceStartOptions {
  enableSystrace: boolean;
  includedCategories: string[];
  excludedCategories: string[];
  enableMemoryTrace: boolean;
  forceGC: boolean;
  enableAutoHeapSnapshot: boolean;
  sharedGroupId: string;
  jsProfileInterval: number;
  jsProfileType: JSProfileType;
}

interface TraceStartCommandOptions {
  client?: string;
  systrace: boolean;
  includeCategories: string;
  excludeCategories: string;
  enableMemoryTrace: boolean;
  forceGc: boolean;
  enableAutoHeapSnapshot: boolean;
  sharedGroupId: string;
  jsProfileInterval: number;
  jsProfileType: JSProfileType;
}

interface TraceTimeoutCommandOptions {
  client?: string;
  timeout: number;
}

interface TraceReadDataCommandOptions extends TraceTimeoutCommandOptions {
  output?: string;
}

export type TraceStartResult =
  | { started: true; restartRequired: false; message: string }
  | { started: false; restartRequired: true; message: string };

export interface TraceEndResult {
  stream: string;
  dataLossOccurred: boolean;
}

export interface TraceReadDataResult {
  filePath: string;
  bytesWritten: number;
}

type TraceConnector = Pick<
  Connector,
  | 'getGlobalSwitch'
  | 'listClients'
  | 'sendCDPMessage'
  | 'sendCDPStream'
  | 'setGlobalSwitch'
>;

interface TraceIOReadResult {
  data?: string;
  base64Encoded?: boolean;
  eof?: boolean;
}

interface TraceCompleteParams {
  stream?: string | number;
  dataLossOccurred?: boolean;
}

function parsePositiveSeconds(value: string): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(
      `Invalid --timeout value: ${value}. Use a positive number of seconds.`,
    );
  }
  return seconds;
}

function parseJSProfileInterval(value: string): number {
  const interval = Number(value);
  if (!Number.isInteger(interval) || interval < -1) {
    throw new Error(
      `Invalid --js-profile-interval value: ${value}. Use -1 or a non-negative integer.`,
    );
  }
  return interval;
}

function parseJSProfileType(value: string): JSProfileType {
  if (value === 'quickjs' || value === 'v8') return value;
  throw new Error(
    `Invalid --js-profile-type value: ${value}. Use quickjs or v8.`,
  );
}

function parseCategories(
  categories: string | undefined,
  defaultCategories: string[],
): string[] {
  const parsedCategories =
    categories
      ?.split(',')
      .map((category) => category.trim())
      .filter(Boolean) ?? [];

  return parsedCategories.length > 0 ? parsedCategories : defaultCategories;
}

function traceUnsupportedError(cause: unknown): Error {
  return new Error(
    'Tracing is not supported by this app or Lynx runtime. Use an Android local_test build ' +
      `or an iOS Lynx Profile build. See ${TRACE_DOCUMENTATION_URL}`,
    { cause },
  );
}

function normalizeTraceStartError(error: unknown): Error {
  if (!(error instanceof Error))
    return new Error(`Trace start failed: ${String(error)}`);
  if (
    error.message.includes('Failed to get trace controller') ||
    error.message.includes('Not implemented:') ||
    error.message.includes('Tracing not enabled') ||
    error.message.includes('Failed to start tracing')
  ) {
    return traceUnsupportedError(error);
  }
  return error;
}

async function ensureTraceDebugMode(
  connector: TraceConnector,
  clientId: string,
): Promise<boolean> {
  const clients = await connector.listClients();
  const client = clients.find((candidate) => candidate.id === clientId);

  // The original trace recorder only toggles this app-level switch for
  // Android-style clients. iOS/Profile clients do not expose AppProcessName.
  if (!client?.info.AppProcessName) return false;

  const enabled = await connector.getGlobalSwitch(clientId, DEBUG_MODE_KEY);
  if (enabled) return false;

  await connector.setGlobalSwitch(clientId, DEBUG_MODE_KEY, true);
  return true;
}

export async function runTraceStart(
  connector: TraceConnector,
  clientId: string,
  options: TraceStartOptions,
): Promise<TraceStartResult> {
  try {
    if (await ensureTraceDebugMode(connector, clientId)) {
      return {
        started: false,
        restartRequired: true,
        message:
          '`enable_debug_mode` has been enabled. Restart the app and run `trace start` again.',
      };
    }

    await connector.sendCDPMessage(clientId, -1, 'Tracing.start', {
      traceConfig: {
        recordMode: 'recordContinuously',
        includedCategories: options.includedCategories,
        excludedCategories: options.excludedCategories,
        enableSystrace: options.enableSystrace,
        enableMemoryTrace: options.enableMemoryTrace,
        forceGC: options.forceGC,
        enableAutoHeapSnapshot: options.enableAutoHeapSnapshot,
        sharedGroupId: options.sharedGroupId,
        bufferSize: 200 * 1024,
        JSProfileInterval: options.jsProfileInterval,
        JSProfileType: options.jsProfileType,
        enableCompress: true,
      },
    });

    return {
      started: true,
      restartRequired: false,
      message:
        'Tracing started successfully. Open the target page and perform the actions to capture.',
    };
  } catch (error) {
    throw normalizeTraceStartError(error);
  }
}

export async function runTraceEnd(
  connector: TraceConnector,
  clientId: string,
  timeoutMs: number,
): Promise<TraceEndResult> {
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    await using stream = await connector.sendCDPStream(
      clientId,
      -1,
      ReadableStream.from([{ method: 'Tracing.end', params: {} }]),
      { signal },
    );

    for await (const value of stream as unknown as AsyncIterable<
      CDPResponseMessage & {
        method?: string;
        params?: TraceCompleteParams;
        error?: { message?: string };
      }
    >) {
      if (value.error) {
        throw new Error(
          value.error.message || 'Tracing.end returned an unknown CDP error.',
        );
      }
      if (value.method !== 'Tracing.tracingComplete') continue;

      const rawHandle = value.params?.stream;
      const streamHandle = rawHandle === undefined ? '' : String(rawHandle);
      if (!/^\d+$/.test(streamHandle)) {
        throw new Error(
          value.params?.dataLossOccurred
            ? 'Tracing completed with data loss and did not return a readable stream handle.'
            : 'Tracing.tracingComplete did not return a readable stream handle.',
        );
      }

      return {
        stream: streamHandle,
        dataLossOccurred: value.params?.dataLossOccurred === true,
      };
    }
  } catch (error) {
    if (
      isAbortError(error) ||
      (error instanceof Error && error.name === 'TimeoutError')
    ) {
      throw new Error(
        `Trace end timed out after ${timeoutMs / 1_000} seconds before Tracing.tracingComplete was received.`,
        { cause: error },
      );
    }
    if (
      error instanceof Error &&
      error.message.includes('Failed to get trace controller')
    ) {
      throw traceUnsupportedError(error);
    }
    if (
      error instanceof Error &&
      error.message.includes('Tracing is not started')
    ) {
      throw new Error(
        'Tracing is not started. Run `agent-lynx trace start` first.',
        { cause: error },
      );
    }
    throw error;
  }

  throw new Error(
    'Trace stream closed before Tracing.tracingComplete was received. ' +
      'Make sure tracing was started and the device is still connected.',
  );
}

function validateStreamHandle(streamHandle: string): string {
  if (!/^\d+$/.test(streamHandle)) {
    throw new Error(
      `Invalid --stream value: ${streamHandle}. Use the numeric handle returned by \`trace end\`.`,
    );
  }
  return streamHandle;
}

function abortable<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  timeoutMessage: string,
): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error(timeoutMessage));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error(timeoutMessage));
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

export async function runTraceReadData(
  connector: TraceConnector,
  clientId: string,
  streamHandleInput: string,
  output: string | undefined,
  timeoutMs: number,
): Promise<TraceReadDataResult> {
  const streamHandle = validateStreamHandle(streamHandleInput);
  const outputPath = path.resolve(
    output ?? path.join(os.tmpdir(), `trace-${Date.now()}.pftrace`),
  );
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${randomUUID()}.tmp`,
  );
  const signal = AbortSignal.timeout(timeoutMs);
  let temporaryFile: fs.FileHandle | undefined;
  let published = false;
  let bytesWritten = 0;

  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    temporaryFile = await fs.open(temporaryPath, 'wx');

    for (;;) {
      const chunk = await abortable(
        connector.sendCDPMessage<
          TraceIOReadResult,
          { handle: string; size: number }
        >(clientId, -1, 'IO.read', {
          handle: streamHandle,
          size: IO_READ_CHUNK_SIZE,
        }),
        signal,
        `Trace download timed out after ${timeoutMs / 1_000} seconds while reading stream ${streamHandle}.`,
      );

      if (chunk.data) {
        const data = Buffer.from(
          chunk.data,
          chunk.base64Encoded === false ? 'utf8' : 'base64',
        );
        await temporaryFile.write(data);
        bytesWritten += data.byteLength;
      }
      if (chunk.eof) break;
    }

    await temporaryFile.close();
    temporaryFile = undefined;
    await fs.rename(temporaryPath, outputPath);
    published = true;
    return { filePath: outputPath, bytesWritten };
  } finally {
    await abortable(
      connector.sendCDPMessage(clientId, -1, 'IO.close', {
        handle: streamHandle,
      }),
      AbortSignal.timeout(IO_CLOSE_TIMEOUT_MS),
      `IO.close timed out for trace stream ${streamHandle}.`,
    ).catch(() => {});
    await temporaryFile?.close().catch(() => {});
    if (!published) await fs.unlink(temporaryPath).catch(() => {});
  }
}

export function registerTraceCommand(program: Command, context: Context): void {
  const trace = program
    .command('trace')
    .description('Record, download, and inspect Lynx performance traces');

  trace
    .command('start')
    .description('Start trace event collection before opening the target page')
    .option(...CLIENT_OPTION)
    .option('--no-systrace', 'Disable systrace')
    .option(
      '--include-categories <categories>',
      'Comma-separated trace categories to include: lynx, vitals, javascript, jsb, devtool',
      '*',
    )
    .option(
      '--exclude-categories <categories>',
      'Comma-separated trace categories to exclude: lynx, vitals, javascript, jsb, devtool',
      '*',
    )
    .option('--enable-memory-trace', 'Enable memory data collection', false)
    .option('--force-gc', 'Enable automatic Garbage Collection', true)
    .option('--no-force-gc', 'Disable automatic Garbage Collection')
    .option(
      '--enable-auto-heap-snapshot',
      'Enable automatic heap snapshots for "shared-group" VMs',
      false,
    )
    .option(
      '--shared-group-id <id>',
      'Only capture automatic heap snapshots for the specified "shared-group" VM',
      '',
    )
    .option(
      '--js-profile-interval <interval>',
      'JS profile interval; defaults to 100 when profiling is enabled, otherwise -1',
      parseJSProfileInterval,
      -1,
    )
    .option(
      '--js-profile-type <type>',
      'JS profile type: quickjs or v8',
      parseJSProfileType,
      '',
    )
    .action(async (options: TraceStartCommandOptions) => {
      const { connector, clientId } = await resolveClient(context, options);
      const includedCategories = parseCategories(options.includeCategories, [
        '*',
      ]);
      const excludedCategories = parseCategories(options.excludeCategories, [
        '*',
      ]);
      const jsProfileInterval =
        options.jsProfileType && options.jsProfileInterval <= 0
          ? 100
          : options.jsProfileInterval;

      const result = await runTraceStart(connector, clientId, {
        enableSystrace: options.systrace,
        includedCategories,
        excludedCategories,
        enableMemoryTrace: options.enableMemoryTrace,
        forceGC: options.forceGc,
        enableAutoHeapSnapshot: options.enableAutoHeapSnapshot,
        sharedGroupId: options.sharedGroupId,
        jsProfileInterval,
        jsProfileType: options.jsProfileType,
      });
      if (result.started) {
      } else {
        process.exitCode = 1;
      }
      console.log(JSON.stringify({ success: result.started, ...result }));
    });

  trace
    .command('end')
    .description('Stop trace collection and return its stream handle')
    .option(...CLIENT_OPTION)
    .option(
      '--timeout <seconds>',
      'Seconds to wait for Tracing.tracingComplete',
      parsePositiveSeconds,
      DEFAULT_TIMEOUT_SECONDS,
    )
    .action(async (options: TraceTimeoutCommandOptions) => {
      const { connector, clientId } = await resolveClient(context, options);
      const result = await runTraceEnd(
        connector,
        clientId,
        options.timeout * 1_000,
      );
      console.log(
        JSON.stringify({
          success: true,
          message:
            'Tracing completed successfully. Download the stream with `trace read-data`.',
          ...result,
        }),
      );
    });

  trace
    .command('read-data')
    .description('Download a trace stream to a .pftrace file')
    .requiredOption(
      '-s, --stream <stream>',
      'Stream handle returned by trace end',
    )
    .option(...CLIENT_OPTION)
    .option(
      '-o, --output <path>',
      'Output path (default: <tmpdir>/trace-<timestamp>.pftrace)',
    )
    .option(
      '--timeout <seconds>',
      'Total trace download timeout in seconds',
      parsePositiveSeconds,
      DEFAULT_TIMEOUT_SECONDS,
    )
    .action(
      async (options: TraceReadDataCommandOptions & { stream: string }) => {
        const { connector, clientId } = await resolveClient(context, options);
        const result = await runTraceReadData(
          connector,
          clientId,
          options.stream,
          options.output,
          options.timeout * 1_000,
        );
        console.log(
          JSON.stringify({
            success: true,
            message: 'Trace data saved successfully.',
            ...result,
          }),
        );
      },
    );

  registerTraceQueryCommands(trace);
}
