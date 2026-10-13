// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ActionCore } from "../src/command/core.ts";
import type { CommandResult } from "../src/command/result.ts";
import type { Connector } from "../src/index.ts";
import type { Client } from "../src/transport/transport.ts";

function createClient(
  id: string,
  info: Partial<Client["info"]> = {},
): Client {
  return {
    id,
    info: {
      App: "Example",
      AppVersion: "1.0.0",
      debugRouterId: "router",
      debugRouterVersion: "1.0.0",
      deviceModel: "Pixel",
      network: "wifi",
      osType: "Android",
      osVersion: "14",
      sdkVersion: "1.0.0",
      ...info,
    },
  };
}

async function collectWaitForClient(
  connector: Pick<Connector, "listClients">,
  params: Record<string, unknown>,
): Promise<CommandResult[]> {
  const events: CommandResult[] = [];
  for await (
    const event of new ActionCore().stream(
      "wait-for-client",
      params,
      { connector: connector as Connector },
      new AbortController().signal,
    )
  ) {
    events.push(event);
  }
  return events;
}

test("wait-for-client streams retries and returns every exact name match", async () => {
  const matchingOne = createClient("device:8901", { AppProcessName: "com.lynx.uiapp" });
  const matchingTwo = createClient("device:8902", { bundleId: "com.lynx.uiapp" });
  const other = createClient("device:8903", { AppProcessName: "com.example.other" });
  const discoveries = [
    [createClient("headless:0", { App: "EmbeddedLynx" })],
    [matchingOne, other, matchingTwo],
  ];
  let calls = 0;

  const events = await collectWaitForClient(
    {
      async listClients() {
        calls += 1;
        return discoveries.shift() ?? [];
      },
    },
    { clientName: "com.lynx.uiapp", timeoutMs: 1_000, intervalMs: 0 },
  );

  assert.equal(calls, 2);
  assert.deepEqual(events.map(event => event.action), ["wait-for-client.progress", "wait-for-client"]);
  const progress = events[0];
  assert.equal(progress?.ok, true);
  if (!progress?.ok) return;
  const progressData = progress.data as {
    matched: boolean;
    availableClients: Client[];
    attempts: number;
    elapsedMs: number;
  };
  assert.equal(progressData.matched, false);
  assert.deepEqual(progressData.availableClients, []);
  assert.equal(progressData.attempts, 1);
  assert.ok(progressData.elapsedMs >= 0);
  const final = events[1];
  assert.equal(final?.ok, true);
  if (!final?.ok) return;
  const data = final.data as {
    matched: boolean;
    clients: Client[];
    availableClients: Client[];
    attempts: number;
    elapsedMs: number;
  };
  assert.equal(data.matched, true);
  assert.deepEqual(data.clients, [matchingOne, matchingTwo]);
  assert.deepEqual(data.availableClients, [matchingOne, other, matchingTwo]);
  assert.equal(data.attempts, 2);
  assert.ok(data.elapsedMs >= 0);
});

test("wait-for-client without a name selects only the first non-headless client", async () => {
  const first = createClient("device:8901");
  const second = createClient("device:8902");
  const events = await collectWaitForClient(
    {
      async listClients() {
        return [createClient("headless:0"), first, second];
      },
    },
    { timeoutMs: 1_000 },
  );

  assert.equal(events.length, 1);
  const final = events[0];
  assert.equal(final?.ok, true);
  if (!final?.ok) return;
  const data = final.data as { clients: Client[]; availableClients: Client[] };
  assert.deepEqual(data.clients, [first]);
  assert.deepEqual(data.availableClients, [first, second]);
});

test("wait-for-client preserves the headless-only timeout diagnostic", async () => {
  const events = await collectWaitForClient(
    {
      async listClients() {
        return [createClient("headless:0", { App: "EmbeddedLynx" })];
      },
    },
    { timeoutMs: 0 },
  );

  assert.deepEqual(events.map(event => event.action), ["wait-for-client.progress", "wait-for-client"]);
  const failure = events.at(-1);
  assert.equal(failure?.ok, false);
  if (!failure || failure.ok) return;
  assert.equal(failure.error.reason, "timeout");
  assert.equal(
    failure.error.message,
    "Only headless Lynx DevTool clients were found before timeout; "
      + "waiting without --client-name requires a non-headless client.",
  );
});

test("wait-for-client timeout reports the last available client names", async () => {
  const events = await collectWaitForClient(
    {
      async listClients() {
        return [createClient("device:8901", { App: "LynxExample", AppProcessName: "com.lynx.uiapp" })];
      },
    },
    { clientName: "com.example.missing", timeoutMs: 0 },
  );

  const failure = events.at(-1);
  assert.equal(failure?.ok, false);
  if (!failure || failure.ok) return;
  assert.equal(failure.error.reason, "timeout");
  assert.match(failure.error.message, /No client found matching --client-name "com\.example\.missing"/u);
  assert.match(failure.error.message, /device:8901 \(com\.lynx\.uiapp, LynxExample\)/u);
});

test("wait-for-client enforces its deadline while discovery is stalled", { timeout: 500 }, async () => {
  const startedAt = Date.now();
  const events = await collectWaitForClient(
    {
      async listClients() {
        return await new Promise<Client[]>(() => {});
      },
    },
    { timeoutMs: 20 },
  );

  assert.ok(Date.now() - startedAt < 250);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.ok, false);
  assert.equal(events[0]?.error?.reason, "timeout");
});

test("wait-for-client keeps a late discovery rejection handled after its deadline", async () => {
  let rejectDiscovery: ((reason?: unknown) => void) | undefined;
  const discovery = new Promise<Client[]>((_, reject) => {
    rejectDiscovery = reject;
  });
  const events = await collectWaitForClient(
    {
      async listClients() {
        return await discovery;
      },
    },
    { timeoutMs: 0 },
  );

  rejectDiscovery?.(new Error("late discovery failure"));
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(events.at(-1)?.error?.reason, "timeout");
});

test("wait-for-client accepts numeric strings from the curl-friendly GET route", async () => {
  const events = await collectWaitForClient(
    {
      async listClients() {
        return [];
      },
    },
    { timeoutMs: "0", intervalMs: "0" },
  );

  assert.equal(events.at(-1)?.error?.reason, "timeout");
  assert.equal(events.some(event => event.error?.reason === "bad-params"), false);
});

test("wait-for-client rejects invalid polling parameters before discovery", async () => {
  let calls = 0;
  const events = await collectWaitForClient(
    {
      async listClients() {
        calls += 1;
        return [];
      },
    },
    { timeoutMs: -1, intervalMs: Number.NaN },
  );

  assert.equal(calls, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.error?.reason, "bad-params");
});
