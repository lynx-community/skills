// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "../index.ts";
import type { CommandObject } from "./contract.ts";
import { type CommandResult, fail } from "./result.ts";

export type TargetRequirement = "none" | "client" | "session";

function stringParam(params: CommandObject, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function numberParam(params: CommandObject, key: string): number | undefined {
  const value = params[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function targetFailure(action: string, message: string, nextActions: string[]): CommandResult<never> {
  return fail(action, message, {
    reason: "target-not-found",
    recoverable: true,
    nextActions,
  });
}

export type ResolvedTarget =
  | { ok: true; params: CommandObject }
  | { ok: false; result: CommandResult<never> };

/** Resolve only the client/session target required by an action. */
export async function resolveTarget(
  action: string,
  params: CommandObject,
  connector: Connector,
  requirement: TargetRequirement,
): Promise<ResolvedTarget> {
  if (requirement === "none") return { ok: true, params };

  let clientId = stringParam(params, "clientId");
  if (params["clientId"] !== undefined && !clientId) {
    return {
      ok: false,
      result: fail(action, "clientId must be a non-empty string when provided.", { reason: "bad-params" }),
    };
  }
  if (!clientId) {
    const clients = await connector.listClients();
    const firstClient = clients[0];
    if (!firstClient) {
      return {
        ok: false,
        result: targetFailure(
          action,
          "No available clients found.",
          ["Connect a Lynx client, then retry the command.", "Run `agent-lynx list-clients` to verify discovery."],
        ),
      };
    }
    clientId = firstClient.id;
  }

  const withClient: CommandObject = { ...params, clientId };
  if (requirement === "client") return { ok: true, params: withClient };

  let sessionId = numberParam(params, "sessionId");
  if (params["sessionId"] !== undefined && sessionId === undefined) {
    return {
      ok: false,
      result: fail(action, "sessionId must be a finite number when provided.", { reason: "bad-params" }),
    };
  }
  if (sessionId === undefined) {
    const sessions = await connector.sendListSessionMessage(clientId);
    if (sessions.length === 0) {
      return {
        ok: false,
        result: targetFailure(
          action,
          `No available sessions found for client: ${clientId}`,
          [`Open or reload a Lynx page on ${clientId}.`, `Run \`agent-lynx list-sessions --client ${clientId}\`.`],
        ),
      };
    }
    const latest = sessions.reduce((max, session) => session.session_id > max.session_id ? session : max);
    sessionId = latest.session_id;
  }

  return { ok: true, params: { ...withClient, sessionId } };
}
