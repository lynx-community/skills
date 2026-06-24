// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Daemon process entry point.
 *
 * Spawned by DaemonManager as a detached child process.
 * Usage: node daemon/entry.ts --port 21783
 */
import { parseArgs } from 'node:util';
import { AndroidTransport } from '../transport/android.ts';
import { DesktopTransport } from '../transport/desktop.ts';
import { iOSTransport } from '../transport/ios.ts';
import { DEFAULT_DAEMON_PORT } from './manager.ts';
import { DevtoolDaemon } from './server.ts';

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
