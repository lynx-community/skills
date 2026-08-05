// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import type { CDPResponseMessage, Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';
import {
  analyzeRecordingBuffer,
  type FileDiagnostic,
  recordingOutputPath,
} from './recorder-analysis.ts';
import {
  CLIENT_OPTION,
  type Context,
  isAbortError,
  resolveClient,
} from './utils.ts';

const IO_READ_CHUNK_SIZE = 1024 * 1024;
const RECORDING_END_TIMEOUT_MS = 60_000;

export function registerEndCommand(parent: Command, context: Context) {
  parent
    .command('end')
    .description('Stop TestBench recording and save the replay file')
    .option(...CLIENT_OPTION)
    .option(
      '-o, --output <path>',
      'Output file or directory path (defaults to ~/.lynx-devtool/files/lynxrecorder/recording-<clientId>-<timestamp>.json)',
    )
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);
      const { output } = options;
      const result = await runRecordingEnd(connector, clientId, output);
      console.log(
        JSON.stringify({
          success: true,
          message: 'Recording ended successfully.',
          ...result,
        }),
      );
    });
}

export async function runRecordingEnd(
  connector: Connector,
  clientId: string,
  output: string | undefined,
): Promise<{
  savedFiles: string[];
  recordingComplete: Record<string, unknown>;
  diagnostics: FileDiagnostic[];
}> {
  const recordingComplete = await readRecordingCompleteEvent(
    connector,
    clientId,
  );

  const savedFiles: string[] = [];
  const diagnostics: FileDiagnostic[] = [];
  const baseOutputPath = await resolveRecordingBaseOutputPath(output, clientId);

  const streams = recordingComplete['stream'] as number[] | undefined;
  const sessionIDs = recordingComplete['sessionIDs'] as number[] | undefined;

  if (!Array.isArray(streams) || streams.length === 0) {
    throw new Error(
      'Recording.recordingComplete did not include any streams. ' +
        'If recording was never started, run `recorder start` first.',
    );
  }

  for (const [index, streamHandle] of streams.entries()) {
    const sessionId = sessionIDs?.[index];
    if (sessionId === undefined) {
      throw new Error(
        'Recording.recordingComplete returned mismatched `stream` and `sessionIDs` lengths. ' +
          'Reconnect and retry `recorder end`.',
      );
    }
    if (sessionId === -1) continue;

    // Per-stream timeout so a slow earlier stream cannot starve later ones.
    const signal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
    const data = await readStreamFully(
      connector,
      clientId,
      streamHandle,
      signal,
    );
    const filePath = recordingOutputPath(
      baseOutputPath,
      sessionId,
      savedFiles.length,
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    savedFiles.push(filePath);
    diagnostics.push(analyzeRecordingBuffer(filePath, data));
  }

  if (savedFiles.length === 0) {
    throw new Error(
      buildNoPageRecordingMessage(
        clientId,
        recordingComplete,
        streams,
        sessionIDs,
      ),
    );
  }

  const unhealthy = diagnostics.filter((d) => !d.healthy);
  if (unhealthy.length > 0) {
    console.warn(
      'Recording saved, but the following file(s) may be unusable:\n' +
        unhealthy.map((d) => `  - ${d.file}: ${d.verdict}`).join('\n'),
    );
  }

  const noTemplate = diagnostics.filter((d) => d.healthy && !d.hasTemplate);
  if (noTemplate.length > 0) {
    console.warn(
      'Note: the following file(s) have no `loadTemplate` action and cannot be replayed,\n' +
        'but may still be useful for inspecting recorded behavior:\n' +
        noTemplate.map((d) => `  - ${d.file}: ${d.verdict}`).join('\n'),
    );
  }

  return { savedFiles, recordingComplete, diagnostics };
}

function buildNoPageRecordingMessage(
  clientId: string,
  recordingComplete: Record<string, unknown>,
  streams: number[],
  sessionIDs: number[] | undefined,
): string {
  const filenames = recordingComplete['filenames'];
  const nativeFiles =
    Array.isArray(filenames) && filenames.length > 0
      ? ` Native filenames: ${JSON.stringify(filenames)}.`
      : '';

  return [
    'Recording ended, but no page recording was produced.',
    `Native returned sessionIDs=${JSON.stringify(sessionIDs ?? [])}, streams=${streams.length}.${nativeFiles}`,
    'This usually means no Lynx page session was opened or reloaded after `recorder start`.',
    'To produce a replayable file:',
    `1. Run \`list-sessions --client ${clientId}\` and confirm there is a Lynx session.`,
    '2. After `recorder start`, open or reload the target page.',
    `   Example: \`cdp --client ${clientId} --session <sessionId> -m Page.reload '{"ignoreCache":true}'\``,
    '3. Interact with the page, then run `recorder end` again.',
  ].join('\n');
}

async function readRecordingCompleteEvent(
  connector: Connector,
  clientId: string,
): Promise<Record<string, unknown>> {
  const timeoutSignal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
  const isTimeoutError = (err: unknown) =>
    isAbortError(err) || (err instanceof Error && err.name === 'TimeoutError');

  try {
    await using stream = await connector.sendCDPStream(
      clientId,
      -1,
      ReadableStream.from([{ method: 'Recording.end', params: {} }]),
      { signal: timeoutSignal },
    );

    for await (const value of stream as unknown as AsyncIterable<
      CDPResponseMessage & {
        method?: string;
        params?: Record<string, unknown>;
        error?: { message: string };
      }
    >) {
      if (value.method === 'Recording.recordingComplete') {
        return value.params ?? {};
      }
      if (value.error) {
        throw new Error(
          `Recording.end failed: ${value.error.message}. ` +
            'If recording was never started, run `recorder start` first.',
        );
      }
    }
  } catch (err) {
    if (!isTimeoutError(err)) throw err;
    throw new Error(
      'Recording.end timed out before receiving Recording.recordingComplete. ' +
        'Make sure recording was started with `recorder start` and the device is still connected.',
      { cause: err },
    );
  }

  throw new Error(
    'Recording.end stream closed before Recording.recordingComplete was received. ' +
      'Make sure recording was started with `recorder start` and the device is still connected.',
  );
}

async function readStreamFully(
  connector: Connector,
  clientId: string,
  handle: number,
  signal: AbortSignal,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  try {
    while (true) {
      const chunk = await abortable(
        connector.sendCDPMessage<
          { data?: string; base64Encoded?: boolean; eof?: boolean },
          Record<string, unknown>
        >(clientId, -1, 'IO.read', { handle, size: IO_READ_CHUNK_SIZE }),
        signal,
        `IO.read timed out reading recording stream handle ${handle}. ` +
          'The device may have stalled; reconnect and retry `recorder end`.',
      );
      if (chunk.data) {
        chunks.push(
          Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf-8'),
        );
      }
      if (chunk.eof) break;
    }
    return Buffer.concat(chunks);
  } finally {
    await abortable(
      connector.sendCDPMessage(clientId, -1, 'IO.close', { handle }),
      AbortSignal.timeout(5_000),
      `IO.close timed out closing recording stream handle ${handle}. Proceeding with local cleanup.`,
    ).catch(() => {});
  }
}

function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  message: string,
): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error(message));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error(message));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
}

async function resolveRecordingBaseOutputPath(
  output: string | undefined,
  clientId: string,
): Promise<string> {
  const defaultFileName = `recording-${clientId.replace(/[<>:"/\\|?*()]/g, '_')}-${Date.now()}.json`;
  if (!output) {
    return path.resolve(
      os.homedir(),
      '.lynx-devtool',
      'files',
      'lynxrecorder',
      defaultFileName,
    );
  }

  const resolvedOutput = path.resolve(output);
  const outputLooksLikeDirectory =
    output.endsWith(path.sep) || output.endsWith('/') || output.endsWith('\\');
  const outputIsDirectory =
    outputLooksLikeDirectory ||
    (await fs
      .stat(resolvedOutput)
      .then((stats) => stats.isDirectory())
      .catch(() => false));

  if (outputIsDirectory) {
    await fs.mkdir(resolvedOutput, { recursive: true });
    return path.join(resolvedOutput, defaultFileName);
  }

  return resolvedOutput;
}
