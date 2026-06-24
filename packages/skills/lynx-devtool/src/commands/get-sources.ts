// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/* eslint-disable */
import { Command } from "commander";
import { ReadableStream } from "node:stream/web";
import {
  CLIENT_NAME_OPTION,
  CLIENT_OPTION,
  type Context,
  readUntilIdle,
  resolveClientAndSession,
  SESSION_OPTION,
} from "./utils.ts";

interface ScriptParsedEvent {
  scriptId: string;
  url: string;
  [key: string]: unknown;
}

export function registerGetSourcesCommand(program: Command, context: Context) {
  program
    .command("get-sources")
    .description("List all parsed scripts.")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .action(async (options) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);

      const numericSessionId = Number(sessionId);

      const messages: { method: string }[] = [
        { method: "Debugger.disable" },
        { method: "Debugger.enable" },
      ];

      await using stream = await connector.sendCDPStream(
        clientId,
        numericSessionId,
        ReadableStream.from(messages),
      );

      const scripts: ScriptParsedEvent[] = [];

      for await (const value of readUntilIdle(stream, { idleMs: 2000, maxMs: 5000 })) {
        if (value.method === "Debugger.scriptParsed") {
          scripts.push(value.params as ScriptParsedEvent);
        }
      }

      console.log(JSON.stringify(scripts.map(({ scriptId, url }) => ({ scriptId, url })), null, 2));
    });
}
