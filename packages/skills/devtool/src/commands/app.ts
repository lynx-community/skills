// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import type { Connector } from "@lynx-js/devtool-connector";
import { getFirstClient } from "./utils.ts";

export function registerAppCommand(program: Command, connector: Connector) {
  program
    .command("app")
    .description("Send an App request")
    .requiredOption("-m, --method <method>", "App method (e.g., App.openPage)")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .argument("[params]", "JSON string of parameters")
    .action(async (paramsStr, options) => {
      const { method } = options;
      let { client: clientId } = options;

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      const params = paramsStr ? JSON.parse(paramsStr) : {};
      const result = await connector.sendAppMessage(clientId, method, params);
      console.log(JSON.stringify(result, null, 2));
    });
}
