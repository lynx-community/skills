// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import type { Connector } from "@lynx-js/devtool-connector";
import { getFirstClient } from "./utils.ts";

export function registerOpenCommand(program: Command, connector: Connector) {
  program
    .command("open")
    .description("Open page")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .argument("<url>", "The url of the page")
    .action(async (url, options) => {
      let { client: clientId } = options;

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      const openCardMessage = {
        event: "Customized",
        data: {
          type: "OpenCard",
          data: {
            type: "url",
            url,
          },
          sender: -1,
        },
        from: -1,
      } as const;

      let result;
      try {
        result = await connector.sendMessage(clientId, openCardMessage);
      } catch (error) {
        console.warn(`OpenCard failed, falling back to App.openPage for ${url}`, error);
        result = await connector.sendAppMessage(clientId, "App.openPage", { url });
      }

      console.log(JSON.stringify(result, null, 2));
    });
}
