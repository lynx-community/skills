// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "../index.ts";
import type { CommandData } from "./contract.ts";
import { type CommandResult, fail, ok } from "./result.ts";

export const NO_CLIENTS_FOUND_MESSAGE: string = [
  "No Lynx DevTool clients were found.",
  "",
  "Try these steps:",
  "1. Make sure the target device/simulator and app are running.",
  "2. If the app just launched, wait a moment and rerun `list-clients`.",
  "3. If this is unexpected, rerun with `DEBUG='devtool-mcp-server:connector*'` or try `--no-daemon`.",
  "",
  "Run `agent-lynx skills get lynx-devtool`, then read `references/troubleshooting/symptoms.md#list-clients-returns-` relative to the reported Skill directory.",
].join("\n");

/** The sole production implementation of the list-clients command. */
export async function listClientsAction(
  connector: Pick<Connector, "listClients">,
): Promise<CommandResult<CommandData<"list-clients">>> {
  const clients = await connector.listClients();
  if (clients.length === 0) {
    return fail("list-clients", NO_CLIENTS_FOUND_MESSAGE, {
      reason: "no-clients",
      recoverable: true,
      nextActions: [
        "Make sure the target device/simulator and app are running, then retry.",
        "Retry with `--no-daemon` to use direct device discovery.",
      ],
    });
  }

  return ok("list-clients", { clients });
}
