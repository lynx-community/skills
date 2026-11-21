// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { WebSocket } from "ws";
import { callRawCommand } from "../src/command/client.ts";
import { DaemonLifecycle, DaemonManager } from "../src/daemon/manager.ts";
import {
  DAEMON_COMMAND_PROTOCOL_VERSION,
  DAEMON_PRODUCT,
  DAEMON_VERSION_PATH,
  DAEMON_WS_PATH,
} from "../src/daemon/protocol.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import { CONNECTOR_VERSION } from "../src/daemon/version.ts";
import { LynxSimulatorTransport } from "../src/transport/simulator.ts";

for (const origin of ["https://example.org", "null", "http://localhost:3000"]) {
  test(`public version discovery allows ${origin}, without opening control endpoints`, async t => {
    const daemon = new DevtoolDaemon([]);
    const port = await daemon.start(0);
    t.after(() => daemon.close());
    const base = `http://127.0.0.1:${port}`;
    const response = await fetch(base + DAEMON_VERSION_PATH, { headers: { origin } });
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    const metadata = await response.json();
    assert.equal(metadata.product, DAEMON_PRODUCT);
    assert.equal(metadata.version, CONNECTOR_VERSION);
    assert.equal(metadata.browserPreviewProtocol, undefined);
    const options = await fetch(base + DAEMON_VERSION_PATH, { method: "OPTIONS", headers: { origin } });
    assert.equal(options.status, 204);
    assert.equal(options.headers.get("access-control-allow-origin"), "*");
    assert.equal(options.headers.get("access-control-allow-methods"), "GET");
    const command = await fetch(base + "/command/list-clients", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(command.status, 403);
    assert.equal(command.headers.get("access-control-allow-origin"), null);
    const shutdown = await fetch(base + DAEMON_WS_PATH + "/shutdown", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ expectedInstanceId: metadata.instanceId }),
    });
    assert.equal(shutdown.status, 403);
    const socket = new WebSocket(`ws://127.0.0.1:${port}${DAEMON_WS_PATH}`, { origin });
    t.after(() => socket.terminate());
    await assert.rejects(
      new Promise<void>((resolve, reject) => {
        socket.once("open", resolve);
        socket.once("error", reject);
      }),
    );
  });
}

test("starting Simulator requires the credential from the daemon that won the port", async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "simulator-authorization-"));
  t.mock.method(os, "homedir", () => directory);
  const simulator = new LynxSimulatorTransport();
  const run = t.mock.method(simulator, "run", async () => {
    throw new Error("Simulator test handler reached.");
  });
  const daemon = new DevtoolDaemon([simulator]);
  const contender = new DevtoolDaemon([new LynxSimulatorTransport()]);
  t.after(async () => {
    await Promise.all([daemon.close(), contender.close()]);
    await rm(directory, { recursive: true, force: true });
  });
  const port = await daemon.start(0);
  await assert.rejects(contender.start(port), { code: "EADDRINUSE" });

  const credentialFile = path.join(directory, ".DebugRouterConnector", `simulator-run-${port}.token`);
  if (process.getuid) assert.equal((await stat(credentialFile)).mode & 0o777, 0o600);
  for (const authorization of [undefined, `Bearer ${"0".repeat(64)}`]) {
    const response = await fetch(`http://127.0.0.1:${port}/command/simulator-run`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) },
      body: "{}",
    });
    assert.equal(response.status, 403);
    await response.text();
  }
  assert.equal(run.mock.callCount(), 0);

  const result = await callRawCommand("simulator-run", {}, { port, ensureDaemon: false });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /Simulator test handler reached/);
  assert.equal(run.mock.callCount(), 1);

  await daemon.close();
  await assert.rejects(stat(credentialFile), { code: "ENOENT" });
});

test("public lifecycle reuses its daemon but refuses both ensure and kill for another product", async t => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());
  assert.equal(await DaemonManager.ensureRunning(port), `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`);
  const other = new DaemonLifecycle({
    product: "other-connector",
    version: CONNECTOR_VERSION,
    lifecycleProtocol: 1,
    commandProtocol: DAEMON_COMMAND_PROTOCOL_VERSION,
  });
  await assert.rejects(other.ensureRunning(port), /Refusing to replace/);
  await assert.rejects(other.kill(port), /Refusing to stop another daemon product/);
  assert.equal((await fetch(`http://127.0.0.1:${port}${DAEMON_VERSION_PATH}`)).status, 200);
});
