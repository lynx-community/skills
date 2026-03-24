// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import type { Connector } from "@lynx-js/devtool-connector";
import { getFirstClient } from "./utils.ts";

export function registerListSessionsCommand(program: Command, connector: Connector) {
  program
    .command("list-sessions")
    .description("List all available sessions")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .action(async (options) => {
      let { client: clientId } = options;

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      const sessions = await connector.sendListSessionMessage(clientId);
      console.log(JSON.stringify(sessions, null, 2));
    });
}
