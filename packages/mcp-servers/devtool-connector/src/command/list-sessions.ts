// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "../index.ts";
import type { CommandData, CommandParams } from "./contract.ts";
import { type CommandResult, fail, ok } from "./result.ts";

/** The sole production implementation of the list-sessions command. */
export async function listSessionsAction(
  connector: Pick<Connector, "sendListSessionMessage">,
  params: CommandParams<"list-sessions">,
): Promise<CommandResult<CommandData<"list-sessions">>> {
  const clientId = params.clientId;
  if (!clientId) {
    return fail("list-sessions", "clientId is required after target resolution.", { reason: "bad-params" });
  }

  const sessions = await connector.sendListSessionMessage(clientId);
  return ok("list-sessions", { clientId, sessions });
}
