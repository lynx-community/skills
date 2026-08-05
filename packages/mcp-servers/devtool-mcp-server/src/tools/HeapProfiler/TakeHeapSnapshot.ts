// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomInt } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import {
  type CDPResponseMessage,
  CDPResponseTransformStream,
} from '@lynx-js/devtool-connector';
import { clientId, sessionId, thread } from '../../schema/index.ts';
import { raceWithTimeout } from '../../utils/raceWithTimeout.ts';
import { defineTool } from '../defineTool.ts';

export const TakeHeapSnapshot = /*#__PURE__*/ defineTool({
  name: 'HeapProfiler_takeHeapSnapshot',
  description: 'Take a heap snapshot and save it to a .heapsnapshot file.',
  schema: {
    clientId,
    sessionId,
    thread,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params, extra }, response, context) {
    const connector = context.connector();
    const expectedSessionId = params.thread === 'main' ? 'Main' : undefined;
    const extraParams = expectedSessionId
      ? { sessionId: expectedSessionId }
      : {};

    const timeoutSignal = AbortSignal.timeout(60_000); // 60s timeout for heap snapshot
    const signal = extra.signal
      ? AbortSignal.any([extra.signal, timeoutSignal])
      : timeoutSignal;

    const requestId = randomInt(10_000, 50_000);

    await using stream = await connector.sendStream(
      params.clientId,
      ReadableStream.from([
        {
          event: 'Customized',
          data: {
            type: 'CDP',
            data: {
              session_id: params.sessionId,
              message: {
                id: requestId - 1,
                method: 'HeapProfiler.enable',
                params: {},
                ...extraParams,
              },
            },
          },
        },
        {
          event: 'Customized',
          data: {
            type: 'CDP',
            data: {
              session_id: params.sessionId,
              message: {
                id: requestId,
                method: 'HeapProfiler.takeHeapSnapshot',
                params: {
                  reportProgress: true,
                  treatGlobalObjectsAsRoots: true,
                  captureNumericValue: false,
                },
                ...extraParams,
              },
            },
          },
        },
      ]),
      {
        signal,
        pipeline: {
          input: [],
          output: [new CDPResponseTransformStream()],
        },
      },
    );

    let didReceiveSnapshotResponse = false;
    const tmpFile = path.join(
      tmpdir(),
      `heap-${params.thread === 'main' ? 'main' : 'background'}-${Date.now()}.heapsnapshot`,
    );

    const reader = stream.getReader();
    const IDLE_TIMEOUT = 15000;
    const MAX_TOTAL_TIME = 60000;
    const startTime = Date.now();
    let didWriteSnapshotChunk = false;
    let shouldKeepSnapshotFile = false;

    try {
      async function* snapshotChunks() {
        while (Date.now() - startTime < MAX_TOTAL_TIME) {
          const result = await raceWithTimeout(
            reader.read(),
            IDLE_TIMEOUT,
            'timeout' as const,
          );

          if (result === 'timeout') {
            await reader.cancel();
            break;
          }

          const { done, value } = result;
          if (done) break;

          const {
            method,
            params: eventParams,
            id,
            sessionId,
          } = value as CDPResponseMessage & {
            method?: string;
            params?: {
              chunk?: string;
              finished?: boolean;
            };
            sessionId?: string;
          };

          if (method === 'HeapProfiler.addHeapSnapshotChunk') {
            if (sessionId !== expectedSessionId) {
              continue;
            }

            const chunk = eventParams?.chunk;
            if (!chunk) {
              continue;
            }

            didWriteSnapshotChunk = true;
            yield chunk;
            if (didReceiveSnapshotResponse) {
              break;
            }
          } else if (method === 'HeapProfiler.reportHeapSnapshotProgress') {
            if (sessionId !== expectedSessionId) {
            }
          } else if (id === requestId) {
            didReceiveSnapshotResponse = true;
            if (didWriteSnapshotChunk) {
              break;
            }
          }
        }
      }

      await pipeline(
        snapshotChunks(),
        createWriteStream(tmpFile, { encoding: 'utf8' }),
        { signal },
      );

      if (!didWriteSnapshotChunk) {
        throw new Error(
          'Failed to capture heap snapshot, no chunks received or timed out.',
        );
      }

      shouldKeepSnapshotFile = true;
    } finally {
      reader.releaseLock();
      if (!shouldKeepSnapshotFile) {
        await fs.unlink(tmpFile).catch(() => {});
      }
    }

    response.appendLines(`Heap snapshot saved to ${tmpFile}`);
  },
});
