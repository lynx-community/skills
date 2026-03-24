// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import type { Connector } from "@lynx-js/devtool-connector";
import { getFirstClient, getFirstSession } from "./utils.ts";

export function registerCdpCommand(program: Command, connector: Connector) {
  program
    .command("cdp")
    .description("Send a CDP request")
    .requiredOption("-m, --method <method>", "CDP method (e.g., DOM.getDocument)")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .option("-s, --session <sessionId>", "Session ID (optional, will auto-discover if not provided)")
    .argument("[params]", "JSON string of parameters")
    .action(async (paramsStr, options) => {
      const { method } = options;
      let { client: clientId, session: sessionId } = options;

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      if (!sessionId) {
        sessionId = await getFirstSession(connector, clientId);
      }

      const params = paramsStr ? JSON.parse(paramsStr) : {};

      const result = await connector.sendCDPMessage(clientId, Number(sessionId), method, params);

      console.log(JSON.stringify(result, null, 2));
    });
}
