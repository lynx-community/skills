// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { test } from "node:test";
import { WebSocket } from "ws";
import { DaemonLifecycle, DaemonManager } from "../src/daemon/manager.ts";
import { DAEMON_PRODUCT, DAEMON_VERSION_PATH, DAEMON_WS_PATH } from "../src/daemon/protocol.ts";
import { DevtoolDaemon } from "../src/daemon/server.ts";
import { CONNECTOR_VERSION } from "../src/daemon/version.ts";

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

test("public lifecycle reuses its daemon but refuses both ensure and kill for another product", async t => {
  const daemon = new DevtoolDaemon([]);
  const port = await daemon.start(0);
  t.after(() => daemon.close());
  assert.equal(await DaemonManager.ensureRunning(port), `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`);
  const other = new DaemonLifecycle({
    product: "other-connector",
    version: CONNECTOR_VERSION,
    lifecycleProtocol: 1,
    commandProtocol: 1,
  });
  await assert.rejects(other.ensureRunning(port), /Refusing to replace/);
  await assert.rejects(other.kill(port), /Refusing to stop another daemon product/);
  assert.equal((await fetch(`http://127.0.0.1:${port}${DAEMON_VERSION_PATH}`)).status, 200);
});
