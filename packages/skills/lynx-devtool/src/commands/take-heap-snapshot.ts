// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/* eslint-disable */
import { type CDPResponseMessage, CDPResponseTransformStream } from "@lynx-js/devtool-connector";
import { Command } from "commander";
import { randomInt } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ReadableStream } from "node:stream/web";
import {
  CLIENT_NAME_OPTION,
  CLIENT_OPTION,
  type Context,
  readUntilIdle,
  resolveClientAndSession,
  SESSION_OPTION,
} from "./utils.ts";

export function registerTakeHeapSnapshotCommand(program: Command, context: Context) {
  program
    .command("take-heap-snapshot")
    .description("Take a heap snapshot and save it to a .heapsnapshot file")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option("--thread <thread>", "VM thread to target: background or main", "background")
    .option("-o, --output <path>", "Output file path (default: <tmpdir>/heap-<thread>-<timestamp>.heapsnapshot)")
    .action(async (options) => {
      const { output, thread = "background" } = options;

      if (thread !== "background" && thread !== "main") {
        throw new Error(`Invalid thread: ${thread}. Expected 'background' or 'main'.`);
      }

      const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);

      const expectedSessionId = thread === "main" ? "Main" : undefined;
      const extraParams = expectedSessionId ? { sessionId: expectedSessionId } : {};
      const timeoutSignal = AbortSignal.timeout(60_000);
      const requestId = randomInt(10_000, 50_000);

      await using stream = await connector.sendStream(
        clientId,
        ReadableStream.from([{
          event: "Customized",
          data: {
            type: "CDP",
            data: {
              session_id: Number(sessionId),
              message: {
                id: requestId - 1,
                method: "HeapProfiler.enable",
                params: {},
                ...extraParams,
              },
            },
          },
        }, {
          event: "Customized",
          data: {
            type: "CDP",
            data: {
              session_id: Number(sessionId),
              message: {
                id: requestId,
                method: "HeapProfiler.takeHeapSnapshot",
                params: {
                  reportProgress: true,
                  treatGlobalObjectsAsRoots: true,
                  captureNumericValue: false,
                },
                ...extraParams,
              },
            },
          },
        }]),
        {
          signal: timeoutSignal,
          pipeline: {
            input: [],
            output: [
              new CDPResponseTransformStream(),
            ],
          },
        },
      );

      let chunks: string[] = [];
      let didReceiveSnapshotResponse = false;
      const fileName = output ?? path.join(tmpdir(), `heap-${thread}-${Date.now()}.heapsnapshot`);

      for await (const value of readUntilIdle(stream, { idleMs: 15_000, maxMs: 60_000 })) {
        const { method, params: eventParams, id, sessionId: responseSessionId } = value as CDPResponseMessage & {
          method?: string;
          params?: {
            chunk?: string;
            finished?: boolean;
          };
          sessionId?: string;
        };

        if (method === "HeapProfiler.addHeapSnapshotChunk") {
          if (responseSessionId !== expectedSessionId) {
            continue;
          }

          const chunk = eventParams?.chunk;
          if (!chunk) {
            continue;
          }

          chunks.push(chunk);
          if (didReceiveSnapshotResponse) {
            break;
          }
        } else if (method === "HeapProfiler.reportHeapSnapshotProgress") {
          if (responseSessionId !== expectedSessionId) {
            continue;
          }
        } else if (id === requestId) {
          didReceiveSnapshotResponse = true;
          if (chunks.length > 0) {
            break;
          }
        }
      }

      if (chunks.length === 0) {
        throw new Error("Failed to capture heap snapshot, no chunks received or timed out.");
      }

      await fs.writeFile(fileName, chunks.join(""));

      console.log(`Heap snapshot saved to ${fileName}`);
    });
}
