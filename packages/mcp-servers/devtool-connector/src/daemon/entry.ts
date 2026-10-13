// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { AndroidTransport } from "../transport/android.ts";
import { DesktopTransport } from "../transport/desktop.ts";
import { HDTTransport } from "../transport/hdt.ts";
import { iOSTransport } from "../transport/ios.ts";
import { DEFAULT_DAEMON_PORT } from "./manager.ts";
import { DevtoolDaemon } from "./server.ts";

const DEBUG_ROUTER_DIR = path.join(os.homedir(), ".DebugRouterConnector");
const PIDFILE = path.join(DEBUG_ROUTER_DIR, "daemon.pid");

const { values } = parseArgs({
  options: {
    port: { type: "string", default: String(DEFAULT_DAEMON_PORT) },
  },
  strict: true,
});

const port = Number.parseInt(values.port ?? String(DEFAULT_DAEMON_PORT), 10);

const daemon = new DevtoolDaemon(
  [
    new AndroidTransport(),
    new iOSTransport(),
    new DesktopTransport(),
    ...HDTTransport.createTransports(),
  ],
  {
    onIdle: () => {
      void daemon.close().then(() => {
        process.exit(0);
      });
    },
    onShutdown: () => {
      process.exit(0);
    },
  },
);

await daemon.start(port);
if (process.connected) process.send?.({ type: "daemon-candidate-ready" }, () => undefined);

// Only the process that actually won the port writes daemon.pid. Writing this
// in DaemonManager before listen() lets a losing spawn race overwrite the
// winner's identity with a PID that has already exited.
try {
  await fs.mkdir(DEBUG_ROUTER_DIR, { recursive: true });
  await fs.writeFile(PIDFILE, String(process.pid), "utf8");
} catch {
  // The pidfile is diagnostic only; daemon availability must not depend on it.
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  void daemon.close().then(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  void daemon.close().then(() => {
    process.exit(0);
  });
});
