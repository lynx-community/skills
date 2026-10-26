// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import http from "node:http";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { ClientId } from "../src/client-id.ts";
import { HttpCommandClient } from "../src/command/client.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import type { App, Connection, Device, Transport, TransportConnectOptions } from "../src/transport/transport.ts";

class BlockedListDevicesTransport implements Transport {
  readonly listDevicesStarted = Promise.withResolvers<void>();
  readonly #listDevices = Promise.withResolvers<Device[]>();

  async close(): Promise<void> {
    this.#listDevices.resolve([]);
  }

  async listDevices(): Promise<Device[]> {
    this.listDevicesStarted.resolve();
    return await this.#listDevices.promise;
  }

  async listAvailableApps(_deviceId: string): Promise<App[]> {
    return [];
  }

  async openApp(_deviceId: string, _packageName: string): Promise<void> {}

  async connect<TInput = unknown, TOutput = unknown>(
    _options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    throw new Error("Unexpected device connection in blocked listDevices test");
  }
}

test("daemon serves unary commands and SSE actions on the WebSocket port", async (t) => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const listClientsResponse = await fetch(`http://127.0.0.1:${port}/command/list-clients`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const listClients = await listClientsResponse.json() as {
    ok: boolean;
    action: string;
    error?: { reason?: string };
  };
  assert.equal(listClientsResponse.status, 200);
  assert.deepEqual(
    { ok: listClients.ok, action: listClients.action, reason: listClients.error?.reason },
    { ok: false, action: "list-clients", reason: "no-clients" },
  );

  for (const action of ["list-sessions", "open", "snapshot", "screenshot", "reactlynx-tree"]) {
    const unaryResponse = await fetch(`http://127.0.0.1:${port}/command/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const unary = await unaryResponse.json() as { ok: boolean; action: string; error?: { reason?: string } };
    assert.equal(unaryResponse.status, 200);
    assert.deepEqual(
      { ok: unary.ok, action: unary.action, reason: unary.error?.reason },
      { ok: false, action, reason: "target-not-found" },
    );
  }

  const streamResponse = await fetch(`http://127.0.0.1:${port}/command/wait?text=Ready`, {
    headers: { accept: "text/event-stream" },
  });
  assert.equal(streamResponse.status, 200);
  assert.match(streamResponse.headers.get("content-type") ?? "", /^text\/event-stream/);
  assert.match(await streamResponse.text(), /"reason":"target-not-found"/);

  const waitForClientResponse = await fetch(`http://127.0.0.1:${port}/command/wait-for-client`, {
    method: "POST",
    headers: { accept: "text/event-stream", "content-type": "application/json" },
    body: JSON.stringify({ timeoutMs: 0, intervalMs: 0 }),
  });
  assert.equal(waitForClientResponse.status, 200);
  assert.match(waitForClientResponse.headers.get("content-type") ?? "", /^text\/event-stream/);
  const waitForClientEvents = await waitForClientResponse.text();
  assert.match(waitForClientEvents, /"action":"wait-for-client"/);
  assert.match(waitForClientEvents, /"reason":"timeout"/);
});

test("daemon rejects unknown actions and malformed SSE bodies without crashing", async (t) => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const unknown = await fetch(`http://127.0.0.1:${port}/command/not-supported`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal((await unknown.json() as { error?: { reason?: string } }).error?.reason, "unknown-action");

  const malformed = await fetch(`http://127.0.0.1:${port}/command/wait`, {
    method: "POST",
    headers: { accept: "text/event-stream", "content-type": "application/json" },
    body: "{",
  });
  assert.match(malformed.headers.get("content-type") ?? "", /^text\/event-stream/);
  assert.match(await malformed.text(), /"reason":"bad-params"/);
});

test("daemon rejects cross-origin and non-JSON command requests", async (t) => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const crossOrigin = await fetch(`http://127.0.0.1:${port}/command/tap`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example" },
    body: "{}",
  });
  assert.equal(crossOrigin.status, 403);

  const simplePost = await fetch(`http://127.0.0.1:${port}/command/tap`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  });
  assert.equal(simplePost.status, 415);

  const crossOriginStream = await fetch(`http://127.0.0.1:${port}/command/wait?text=Ready`, {
    headers: { accept: "text/event-stream", origin: "https://attacker.example" },
  });
  assert.equal(crossOriginStream.status, 403);
});

test("an in-flight chunked command body keeps the shared daemon alive", async (t) => {
  let idleCalls = 0;
  const daemon = new DevtoolDaemon([], {
    idleTimeoutMs: 30,
    onIdle: () => {
      idleCalls += 1;
    },
  });
  const port = await daemon.start(0);
  t.after(() => daemon.close());

  const request = http.request({
    host: "127.0.0.1",
    port,
    path: "/command/snapshot",
    method: "POST",
    headers: { "content-type": "application/json", "transfer-encoding": "chunked" },
  });
  request.on("error", () => {});
  request.write("{");

  await delay(80);
  assert.equal(idleCalls, 0);

  request.destroy();
  await delay(80);
  assert.equal(idleCalls, 1);
});

test("daemon shutdown aborts an incomplete chunked SSE body", async () => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  const request = http.request({
    host: "127.0.0.1",
    port,
    path: "/command/wait",
    method: "POST",
    headers: {
      accept: "text/event-stream",
      "content-type": "application/json",
      "transfer-encoding": "chunked",
    },
  });
  request.on("error", () => {});
  request.write("{");
  await delay(20);

  const closed = await Promise.race([
    daemon.close().then(() => true),
    delay(1_000, false),
  ]);
  request.destroy();
  assert.equal(closed, true, "an incomplete SSE body must not hold daemon shutdown open");
});

test("daemon shutdown closes an aborted unary command response", async (t) => {
  const transport = new BlockedListDevicesTransport();
  const daemon = new DevtoolDaemon([transport]);
  const port = await daemon.start(0);
  let closing: Promise<void> | undefined;
  t.after(async () => {
    await (closing ?? daemon.close());
  });

  const command = new HttpCommandClient({ port, ensureDaemon: false }).executeRaw("snapshot", {
    clientId: ClientId.serialize("blocked-device", 8901),
    sessionId: 1,
  }, { timeoutMs: 2_000 });

  try {
    let startupTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        transport.listDevicesStarted.promise,
        new Promise<never>((_resolve, reject) => {
          startupTimeout = setTimeout(
            () => reject(new Error("snapshot did not reach the blocked daemon listDevices call")),
            1_000,
          );
        }),
      ]);
    } finally {
      if (startupTimeout) clearTimeout(startupTimeout);
    }
    closing = daemon.close();

    const result = await command;
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.reason, "daemon-unavailable");
  } finally {
    closing ??= daemon.close();
    await Promise.allSettled([command, closing]);
  }
});
