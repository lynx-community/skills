// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { setTimeout as delay } from "node:timers/promises";
import type { Connector } from "../index.ts";
import type { Client } from "../transport/transport.ts";
import type { StreamCommandEvent, StreamCommandParams } from "./contract.ts";
import { type CommandResult, fail, ok } from "./result.ts";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 1_000;
const DISCOVERY_DEADLINE = Symbol("discoveryDeadline");

function isHeadlessClientId(clientId: string): boolean {
  return clientId.startsWith("headless:");
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function uniqueNonEmptyStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map(value => value.trim())
        .filter(Boolean),
    ),
  );
}

function getClientNames(client: Client): string[] {
  return uniqueNonEmptyStrings([
    client.info.AppProcessName,
    client.info.bundleId,
    client.info.bundleName,
    client.info.App,
  ]);
}

function formatClientForError(client: Client): string {
  const names = getClientNames(client);
  const suffix = names.length > 0 ? ` (${names.join(", ")})` : "";
  return `  ${client.id}${suffix}`;
}

function selectClients(clients: Client[], clientName: string | undefined): Client[] {
  const realClients = clients.filter(client => !isHeadlessClientId(client.id));
  if (clientName === undefined) return realClients.slice(0, 1);
  return realClients.filter(client => getClientNames(client).includes(clientName));
}

function timeoutMessage(clientName: string | undefined, clients: Client[]): string {
  if (clientName !== undefined) {
    const availableClients = clients
      .filter(client => !isHeadlessClientId(client.id))
      .map(formatClientForError)
      .join("\n");
    return `No client found matching --client-name "${clientName}".`
      + (availableClients ? `\nAvailable clients:\n${availableClients}` : "\nNo real-device clients are available.");
  }
  if (clients.some(client => isHeadlessClientId(client.id))) {
    return "Only headless Lynx DevTool clients were found before timeout; "
      + "waiting without --client-name requires a non-headless client.";
  }
  return "No Lynx DevTool clients were found before timeout.";
}

async function discoverBeforeDeadline(
  connector: Pick<Connector, "listClients">,
  deadline: number,
  signal: AbortSignal,
): Promise<Client[] | typeof DISCOVERY_DEADLINE> {
  signal.throwIfAborted();
  const timerController = new AbortController();
  const timerSignal = AbortSignal.any([signal, timerController.signal]);
  const discovery = connector.listClients();
  const timeout = delay(
    Math.max(0, deadline - Date.now()),
    DISCOVERY_DEADLINE,
    { signal: timerSignal },
  );
  try {
    return await Promise.race([discovery, timeout]);
  } finally {
    timerController.abort();
    await timeout.catch(() => {});
  }
}

/** The sole production implementation of the wait-for-client command. */
export async function* waitForClientStream(
  connector: Pick<Connector, "listClients">,
  params: StreamCommandParams<"wait-for-client">,
  signal: AbortSignal,
): AsyncGenerator<CommandResult<StreamCommandEvent<"wait-for-client">>> {
  const rawClientName: unknown = params.clientName;
  if (rawClientName !== undefined && typeof rawClientName !== "string") {
    yield fail("wait-for-client", "clientName must be a string when provided.", { reason: "bad-params" });
    return;
  }
  const clientName = rawClientName === "" ? undefined : rawClientName;
  const rawTimeoutMs: unknown = params.timeoutMs;
  const rawIntervalMs: unknown = params.intervalMs;
  const timeoutMs = rawTimeoutMs === undefined ? DEFAULT_TIMEOUT_MS : finiteNumber(rawTimeoutMs);
  const intervalMs = rawIntervalMs === undefined ? DEFAULT_INTERVAL_MS : finiteNumber(rawIntervalMs);
  if (timeoutMs === undefined || intervalMs === undefined || timeoutMs < 0 || intervalMs < 0) {
    yield fail(
      "wait-for-client",
      "timeoutMs and intervalMs must be non-negative finite numbers when provided.",
      { reason: "bad-params" },
    );
    return;
  }

  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  let attempts = 0;
  let lastClients: Client[] = [];

  for (;;) {
    signal.throwIfAborted();
    const discovery = await discoverBeforeDeadline(connector, deadline, signal);
    if (discovery === DISCOVERY_DEADLINE) {
      yield fail("wait-for-client", timeoutMessage(clientName, lastClients), {
        reason: "timeout",
        recoverable: true,
        nextActions: ["Run `agent-lynx list-clients` to inspect currently available clients."],
      });
      return;
    }

    lastClients = discovery;
    attempts += 1;
    const availableClients = lastClients.filter(client => !isHeadlessClientId(client.id));
    const clients = selectClients(lastClients, clientName);
    const elapsedMs = Date.now() - startedAt;
    if (clients.length > 0) {
      yield ok("wait-for-client", {
        matched: true,
        clients,
        availableClients,
        attempts,
        elapsedMs,
      });
      return;
    }

    yield ok("wait-for-client.progress", {
      matched: false,
      availableClients,
      attempts,
      elapsedMs,
    });
    if (Date.now() >= deadline) {
      yield fail("wait-for-client", timeoutMessage(clientName, lastClients), {
        reason: "timeout",
        recoverable: true,
        nextActions: ["Run `agent-lynx list-clients` to inspect currently available clients."],
      });
      return;
    }

    await delay(Math.min(intervalMs, Math.max(0, deadline - Date.now())), undefined, { signal });
  }
}
