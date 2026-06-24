// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from "commander";
import { FilterTransformStream, isListSessionResponse } from "../connector.ts";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClient } from "./utils.ts";

export function registerOpenCommand(program: Command, context: Context) {
  program
    .command("open")
    .description("Open page")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .argument("<url>", "The url of the page")
    .action(async (url, options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const result = await connector.sendMessage(clientId, {
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
      }, {
        input: [],
        output: [
          new FilterTransformStream(isListSessionResponse),
        ],
      });

      console.log(JSON.stringify(result, null, 2));
    });
}
