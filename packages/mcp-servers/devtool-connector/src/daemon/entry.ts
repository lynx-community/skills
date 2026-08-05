// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Daemon process entry point.
 *
 * Spawned by DaemonManager as a detached child process.
 * Usage: node daemon/entry.ts --port 21783
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { AndroidTransport } from '../transport/android.ts';
import { DesktopTransport } from '../transport/desktop.ts';
import { iOSTransport } from '../transport/ios.ts';
import { DEFAULT_DAEMON_PORT } from './manager.ts';
import { DevtoolDaemon } from './server.ts';

const DEBUG_ROUTER_DIR = path.join(os.homedir(), '.DebugRouterConnector');
const PIDFILE = path.join(DEBUG_ROUTER_DIR, 'daemon.pid');

function getAndroidTransportSpec(env: NodeJS.ProcessEnv): {
  host: string;
  port: number;
} {
  const port = Number.parseInt(env['ADB_SERVER_PORT'] ?? '5037', 10);

  return {
    host: env['ADB_SERVER_HOST'] ?? '127.0.0.1',
    port: Number.isInteger(port) && port > 0 ? port : 5037,
  };
}

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: String(DEFAULT_DAEMON_PORT) },
  },
  strict: true,
});

const port = Number.parseInt(values.port ?? String(DEFAULT_DAEMON_PORT), 10);

const daemon = new DevtoolDaemon(
  [
    new AndroidTransport(getAndroidTransportSpec(process.env)),
    new iOSTransport(),
    new DesktopTransport(),
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

// Only the process that actually won the port writes daemon.pid. Writing this
// in DaemonManager before listen() lets a losing spawn race overwrite the
// winner's identity with a PID that has already exited.
try {
  await fs.mkdir(DEBUG_ROUTER_DIR, { recursive: true });
  await fs.writeFile(PIDFILE, String(process.pid), 'utf8');
} catch {
  // The pidfile is diagnostic only; daemon availability must not depend on it.
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  void daemon.close().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  void daemon.close().then(() => {
    process.exit(0);
  });
});
