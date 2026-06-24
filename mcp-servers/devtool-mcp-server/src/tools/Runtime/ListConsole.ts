// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import * as z from "zod";
import { clientId, sessionId, thread } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

interface ConsoleCallFrame {
  url: string;
  lineNumber: number;
  columnNumber: number;
}

interface ConsoleStackTrace {
  callFrames: ConsoleCallFrame[];
}

interface ConsoleArg {
  value?: unknown;
  className?: string;
  description?: string;
  objectId?: string;
}

interface ConsoleMessage {
  type: string;
  args: ConsoleArg[];
  stackTrace?: ConsoleStackTrace;
  consoleTag?: string;
}

export const ListConsole = /*#__PURE__*/ defineTool({
  name: "Runtime_listConsole",
  description: "List all console messages.",
  schema: {
    clientId,
    sessionId,

    offset: z.number().optional().describe("The number of console messages to skip before returning results."),
    limit: z.number().min(1).max(100).optional().describe("The maximum number of console messages to return."),
    includeStackTraces: z.boolean().optional().describe(
      "By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.",
    ),
    level: z.array(z.enum(["log", "info", "warning", "error"])).optional().describe(
      "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']",
    ),
    thread: z.array(thread).optional().describe("VM thread to target: background or main. Defaults to both."),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    const {
      offset = 0,
      limit,
      includeStackTraces = false,
      level = ["info", "log", "warning", "error"],
      thread: threads = ["background", "main"],
    } = params;

    await using stream = await connector.sendCDPStream(
      params.clientId,
      params.sessionId,
      ReadableStream.from([
        {
          method: "Page.enable",
        },
        ...threads.map((t: "background" | "main") => ({
          method: "Runtime.enable",
          sessionId: t === "main" ? "Main" : undefined,
        })),
      ]),
    );

    const messages: ConsoleMessage[] = [];
    let skipped = 0;

    const reader = stream.getReader();
    const IDLE_TIMEOUT = 500;
    const MAX_TOTAL_TIME = 5000;
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < MAX_TOTAL_TIME) {
        const result = await Promise.race([
          reader.read(),
          setTimeout(IDLE_TIMEOUT, "timeout" as const),
        ]);
        if (result === "timeout") {
          await reader.cancel();
          break;
        }

        const { done, value } = result;
        if (done) break;

        if (value.method === "Runtime.consoleAPICalled") {
          const message = value.params as ConsoleMessage;
          if (!level.includes(message.type as "log" | "info" | "warning" | "error")) {
            continue;
          }

          if (skipped < offset) {
            skipped++;
            continue;
          }

          if (!includeStackTraces && message.type !== "error") {
            delete message.stackTrace;
          }

          messages.push(message);

          if (limit && messages.length >= limit) {
            await reader.cancel();
            break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    response.appendLines(
      ...messages
        .map(({ type, args, stackTrace, consoleTag }) =>
          `- [${type}/${consoleTag === "Lepus" ? "main-thread" : "background"}]: ${
            args
              .map(arg => {
                if (arg.objectId) {
                  return `<${arg.description || arg.className || "Object"} (objectId:${arg.objectId})>`;
                }
                return String(arg.value);
              })
              .join(" ")
          }${
            stackTrace
              ? `\n${
                stackTrace.callFrames
                  .map(({ url, lineNumber, columnNumber }) => `    at ${url}:${lineNumber}:${columnNumber}`)
                  .join("\n")
              }`
              : ""
          }`
        ),
    );
  },
});
