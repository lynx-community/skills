// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { createDebug } from "obug";
import { DAEMON_WS_PATH, DEFAULT_DAEMON_PORT } from "./protocol.ts";

export { DEFAULT_DAEMON_PORT } from "./protocol.ts";

const debug = createDebug("devtool-mcp-server:daemon:manager");

const DEBUG_ROUTER_DIR = path.join(os.homedir(), ".DebugRouterConnector");
const PIDFILE = path.join(DEBUG_ROUTER_DIR, "daemon.pid");
const LOG = path.join(DEBUG_ROUTER_DIR, "daemon.log");
const ERR = path.join(DEBUG_ROUTER_DIR, "daemon.err");

export function resolveDaemonEntryPath(moduleUrl: string = import.meta.url): string {
  return createRequire(moduleUrl).resolve("#daemon-entry");
}

/**
 * Manages the daemon process lifecycle.
 *
 * - `ensureRunning()`: checks if the daemon is alive, spawns it if not
 * - `spawn()`: forks a detached daemon process
 * - `kill()`: sends SIGTERM to the daemon
 */
export class DaemonManager {
  static async ensureRunning(port: number = DEFAULT_DAEMON_PORT): Promise<string> {
    const url = `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`;

    // 1. Quick probe — if the daemon is already running, we're done
    if (await this.#isAlive(port)) {
      debug("daemon already running on port %d", port);
      return url;
    }

    // 2. Spawn a new daemon
    debug("daemon not running, spawning...");
    await this.#spawn(port);

    // 3. Wait for it to become ready
    await this.#waitReady(port, 5_000);
    debug("daemon is ready on port %d", port);

    return url;
  }

  static async kill(): Promise<void> {
    try {
      const pidStr = await fs.readFile(PIDFILE, "utf-8");
      const pid = Number.parseInt(pidStr.trim(), 10);
      if (!Number.isNaN(pid)) {
        debug("killing daemon pid %d", pid);
        process.kill(pid, "SIGTERM");
      }
    } catch {
      debug("no pidfile found or cannot read it");
    }
  }

  static async #isAlive(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.setTimeout(1_000, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  static async #spawn(port: number): Promise<void> {
    await fs.mkdir(DEBUG_ROUTER_DIR, { recursive: true });

    const entryPath = resolveDaemonEntryPath();

    const out = openSync(LOG, "w");
    const err = openSync(ERR, "w");

    const child = spawn(process.execPath, [entryPath, "--port", String(port)], {
      detached: true,
      stdio: ["ignore", out, err],
      env: {
        ...process.env,
        // Propagate debug namespace if set
        DEBUG: process.env["DEBUG"] ?? "",
      },
    });

    closeSync(out);
    closeSync(err);

    child.unref();

    // Write pidfile
    if (child.pid !== undefined) {
      await fs.writeFile(PIDFILE, String(child.pid), "utf-8");
      debug("spawned daemon with pid %d", child.pid);
    }
  }

  static async #waitReady(port: number, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (await this.#isAlive(port)) {
        return;
      }
      await sleep(200);
    }

    throw new Error(`Daemon failed to start within ${timeoutMs}ms on port ${port}`);
  }
}
