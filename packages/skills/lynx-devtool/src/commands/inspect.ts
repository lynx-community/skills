// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "./utils.ts";

const DEFAULT_DAEMON_PORT = 21783;

export function registerInspectCommand(program: Command, context: Context) {
  program
    .command("inspect")
    .description("Output the inspector URL for a client/session")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option("--port <port>", "Daemon port", String(DEFAULT_DAEMON_PORT))
    .action(async (options) => {
      const { clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );

      const port = parseInt(options.port, 10) || DEFAULT_DAEMON_PORT;
      const inspectorUrl = `http://127.0.0.1:${port}/devtool/connector/inspector?clientId=${
        encodeURIComponent(clientId)
      }&sessionId=${encodeURIComponent(sessionId)}`;

      console.log(inspectorUrl);
    });
}
