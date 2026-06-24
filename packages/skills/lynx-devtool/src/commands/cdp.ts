// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "./utils.ts";

export function registerCdpCommand(program: Command, context: Context) {
  program
    .command("cdp")
    .description("Send a CDP request")
    .requiredOption("-m, --method <method>", "CDP method (e.g., DOM.getDocument)")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option("--thread <thread>", "Thread to target (e.g., 'main' or 'background'). Defaults to 'background'")
    .argument("[params]", "JSON string of parameters")
    .action(async (paramsStr, options) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
      const { method } = options;
      const thread = options.thread ?? "background";

      const params = paramsStr ? JSON.parse(paramsStr) : {};

      const result = await connector.sendCDPMessage(clientId, Number(sessionId), method, params, thread === "main");

      console.log(JSON.stringify(result, null, 2));
    });
}
