// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "../index.ts";
import type { CommandData, CommandParams } from "./contract.ts";
import { type CommandResult, fail, ok } from "./result.ts";

function isHeadlessClientId(clientId: string): boolean {
  return clientId.startsWith("headless:");
}

/** The sole production implementation of the open command. */
export async function openAction(
  connector: Pick<Connector, "openPage" | "waitForHeadlessReady">,
  params: CommandParams<"open">,
  signal?: AbortSignal,
): Promise<CommandResult<CommandData<"open">>> {
  const clientId = params.clientId;
  if (!clientId) {
    return fail("open", "clientId is required after target resolution.", { reason: "bad-params" });
  }
  if (typeof params.url !== "string" || params.url.trim() === "") {
    return fail("open", "url must be a non-empty string.", { reason: "bad-params" });
  }

  signal?.throwIfAborted();
  if (isHeadlessClientId(clientId)) {
    await connector.waitForHeadlessReady(clientId, signal ? { signal } : {});
  }
  signal?.throwIfAborted();

  const response = await connector.openPage(clientId, params.url, signal);
  return ok("open", { clientId, response });
}
