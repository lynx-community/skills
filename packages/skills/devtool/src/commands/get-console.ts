// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "@lynx-js/devtool-connector";
import { Command } from "commander";
import { ReadableStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import { getFirstClient, getFirstSession } from "./utils.ts";

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
}

interface ConsoleMessage {
  type: string;
  args: ConsoleArg[];
  stackTrace?: ConsoleStackTrace;
  url?: string;
}

export function registerGetConsoleCommand(program: Command, connector: Connector) {
  program
    .command("get-console")
    .description("Capture console logs from the device")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .option("-s, --session <sessionId>", "Session ID (optional, will auto-discover if not provided)")
    .option("--offset <number>", "The number of console messages to skip before returning results.", parseInt)
    .option("--limit <number>", "The maximum number of console messages to return.", parseInt)
    .option(
      "--include-stack-traces",
      "By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.",
    )
    .option(
      "--level <levels>",
      "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']",
      (value) => value.split(",").map((s) => s.trim()),
    )
    .action(async (options) => {
      let { client: clientId, session: sessionId, limit } = options;
      const { offset = 0, includeStackTraces, level } = options

      if (limit) {
        limit = Math.max(1, Math.min(100, limit));
      }

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      if (!sessionId) {
        sessionId = await getFirstSession(connector, clientId);
      }

      const numericSessionId = Number(sessionId);

      await using stream = await connector.sendCDPStream(
        clientId,
        ReadableStream.from([{
          sessionId: numericSessionId,
          method: "Page.enable",
        }, {
          sessionId: numericSessionId,
          method: "Runtime.enable",
        }]),
      );

      const messages: ConsoleMessage[] = [];
      const defaultLevels = ["info", "log", "warning", "error"];
      const allowedLevels = level || defaultLevels;
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
            const params = value.params as ConsoleMessage;
            if (allowedLevels.includes(params.type)) {
              if (skipped < offset) {
                skipped++;
                continue;
              }

              if (!includeStackTraces && params.type !== "error") {
                delete params.stackTrace;
              }

              messages.push(params);

              if (limit && messages.length >= limit) {
                await reader.cancel();
                break;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(
        messages.map(({ type, args, stackTrace }) =>
          `- [${type}]: ${args.map(({ value }) => value).join(" ")}${stackTrace
            ? '\n' + stackTrace.callFrames.map(({ url, lineNumber, columnNumber }) =>
              `    at ${url}:${lineNumber}:${columnNumber}`
            ).join("\n")
            : ""
          }`
        ).join("\n"),
      );
    });
}
