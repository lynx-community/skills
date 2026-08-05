// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDebug } from 'obug';
import { gt, valid } from 'semver';
import {
  DAEMON_COMMAND_PROTOCOL_VERSION,
  DAEMON_LIFECYCLE_PROTOCOL_VERSION,
  DAEMON_PRODUCT,
  DAEMON_SHUTDOWN_PATH,
  DAEMON_VERSION_PATH,
  DAEMON_WS_PATH,
  type DaemonMetadata,
  type DaemonShutdownRequest,
  DEFAULT_DAEMON_PORT,
} from './protocol.ts';
import { CONNECTOR_VERSION } from './version.ts';

export { DEFAULT_DAEMON_PORT } from './protocol.ts';

const debug = createDebug('devtool-mcp-server:daemon:manager');

const DEBUG_ROUTER_DIR = path.join(os.homedir(), '.DebugRouterConnector');
const LOG = path.join(DEBUG_ROUTER_DIR, 'daemon.log');
const ERR = path.join(DEBUG_ROUTER_DIR, 'daemon.err');
const MAX_LIFECYCLE_TRANSITIONS = 8;
const DIRECT_TRANSPORT_ENVIRONMENT_VARIABLES = [
  'ADB_SERVER_HOST',
  'ADB_SERVER_PORT',
] as const;

export function createDaemonProcessEnvironment(
  env: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const daemonEnvironment: NodeJS.ProcessEnv = {
    ...env,
    DEBUG: env['DEBUG'] ?? '',
  };
  for (const name of DIRECT_TRANSPORT_ENVIRONMENT_VARIABLES) {
    delete daemonEnvironment[name];
  }
  return daemonEnvironment;
}

interface ObservedDaemonMetadata {
  version: string;
  commandProtocol?: number;
  instanceId?: string;
  lifecycleProtocol?: number;
  product?: string;
  startedAt?: number;
}

type DaemonProbe =
  | { kind: 'absent' }
  | { kind: 'unknown' }
  | { kind: 'daemon'; metadata: ObservedDaemonMetadata };

type ShutdownResult = 'accepted' | 'conflict' | 'refused';

export class DaemonLifecycleError extends Error {
  readonly code = 'ERR_DAEMON_LIFECYCLE';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DaemonLifecycleError';
  }
}

export function isDaemonLifecycleError(error: unknown): boolean {
  if (error instanceof DaemonLifecycleError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_DAEMON_LIFECYCLE'
  );
}

export function resolveDaemonEntryPath(
  moduleUrl: string = import.meta.url,
): string {
  return createRequire(moduleUrl).resolve('#daemon-entry');
}

/** Manages the single connector daemon bound to a loopback port. */
export class DaemonManager {
  static #ensureTasks = new Map<number, Promise<string>>();

  static ensureRunning(
    port: number = DEFAULT_DAEMON_PORT,
    options: { commandProtocol?: boolean } = {},
  ): Promise<string> {
    // Callers can ask for the command protocol explicitly, but no negotiation
    // is needed: #isCompatible only accepts a daemon already reporting
    // DAEMON_COMMAND_PROTOCOL_VERSION, so every daemon returned from here
    // serves HTTP commands.
    debug(
      'ensuring daemon on port %d (commandProtocol requested: %o)',
      port,
      options.commandProtocol ?? false,
    );

    const existing = DaemonManager.#ensureTasks.get(port);
    if (existing) return existing;

    const task = DaemonManager.#ensureCompatibleDaemon(port);
    DaemonManager.#ensureTasks.set(port, task);
    return task.finally(() => {
      if (DaemonManager.#ensureTasks.get(port) === task)
        DaemonManager.#ensureTasks.delete(port);
    });
  }

  static async kill(port: number = DEFAULT_DAEMON_PORT): Promise<void> {
    const probe = await DaemonManager.#probe(port);
    if (probe.kind !== 'daemon') {
      throw new Error(
        `Refusing to stop the unknown process listening on port ${port}.`,
      );
    }

    const result = await DaemonManager.#requestShutdown(port, probe.metadata);
    if (result === 'conflict') {
      throw new DaemonLifecycleError(
        `Connector daemon on port ${port} changed before it could be stopped. Retry against the current instance.`,
      );
    }
    if (result !== 'accepted') {
      throw new Error(
        `Connector daemon on port ${port} refused the shutdown request.`,
      );
    }
    if (
      !(await DaemonManager.#waitForInstanceChange(port, probe.metadata, 3_000))
    ) {
      throw new DaemonLifecycleError(
        `Connector daemon ${DaemonManager.#describe(probe.metadata)} did not stop within 3000ms.`,
      );
    }
  }

  static async #ensureCompatibleDaemon(port: number): Promise<string> {
    const url = `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`;

    for (
      let transition = 0;
      transition < MAX_LIFECYCLE_TRANSITIONS;
      transition += 1
    ) {
      const probe = await DaemonManager.#probe(port);
      if (probe.kind === 'unknown') {
        throw new DaemonLifecycleError(
          `Port ${port} is occupied by an unknown process. Stop it or choose another port, then retry.`,
        );
      }

      if (probe.kind === 'absent') {
        debug('daemon not running on port %d, spawning', port);
        await DaemonManager.#spawn(port);
        const started = await DaemonManager.#waitReady(port, 5_000);
        if (
          started.kind === 'daemon' &&
          DaemonManager.#isCompatible(started.metadata)
        ) {
          debug('daemon is ready on port %d: %O', port, started.metadata);
          return url;
        }
        if (started.kind === 'unknown') {
          throw new DaemonLifecycleError(
            `Port ${port} was claimed by an unknown process while the connector daemon was starting.`,
          );
        }
        if (started.kind === 'absent') {
          throw new DaemonLifecycleError(
            `Daemon failed to start within 5000ms on port ${port}.`,
          );
        }
        // Another connector daemon won the bind race. Re-evaluate it below.
        continue;
      }

      if (DaemonManager.#isCompatible(probe.metadata)) {
        debug(
          'compatible daemon already running on port %d: %O',
          port,
          probe.metadata,
        );
        return url;
      }

      DaemonManager.#assertSafeUpgrade(probe.metadata, port);
      debug(
        'stopping incompatible daemon on port %d: %O',
        port,
        probe.metadata,
      );
      const shutdown = await DaemonManager.#requestShutdown(
        port,
        probe.metadata,
      );
      if (shutdown === 'conflict') {
        debug(
          'daemon changed before shutdown on port %d; probing the winner',
          port,
        );
        continue;
      }
      if (shutdown !== 'accepted') {
        // Another process may have sent the winning shutdown request between
        // our probe and POST. A reset/refusal is therefore only fatal if the
        // exact generation we observed remains in place.
        if (
          await DaemonManager.#waitForInstanceChange(
            port,
            probe.metadata,
            3_000,
          )
        ) {
          debug(
            'daemon changed after a competing shutdown on port %d; probing the winner',
            port,
          );
          continue;
        }
        throw new DaemonLifecycleError(
          `Connector daemon ${DaemonManager.#describe(probe.metadata)} on port ${port} refused a safe restart.`,
        );
      }
      if (
        !(await DaemonManager.#waitForInstanceChange(
          port,
          probe.metadata,
          3_000,
        ))
      ) {
        throw new DaemonLifecycleError(
          `Connector daemon ${DaemonManager.#describe(probe.metadata)} on port ${port} did not stop within 3000ms.`,
        );
      }
    }

    throw new DaemonLifecycleError(
      `Connector daemon on port ${port} changed too many times while selecting a compatible instance.`,
    );
  }

  static #isCompatible(
    metadata: ObservedDaemonMetadata,
  ): metadata is DaemonMetadata {
    return (
      metadata.product === DAEMON_PRODUCT &&
      metadata.version === CONNECTOR_VERSION &&
      metadata.lifecycleProtocol === DAEMON_LIFECYCLE_PROTOCOL_VERSION &&
      metadata.commandProtocol === DAEMON_COMMAND_PROTOCOL_VERSION &&
      typeof metadata.instanceId === 'string' &&
      metadata.instanceId !== ''
    );
  }

  static #assertSafeUpgrade(
    metadata: ObservedDaemonMetadata,
    port: number,
  ): void {
    if (metadata.product !== undefined && metadata.product !== DAEMON_PRODUCT) {
      throw new DaemonLifecycleError(
        `Port ${port} reports daemon product ${JSON.stringify(
          metadata.product,
        )} instead of ${DAEMON_PRODUCT}. Refusing to replace it.`,
      );
    }
    // A same-version daemon can still be incompatible when its lifecycle or
    // command protocol differs. Replacing our own version is safe; the
    // protocol mismatch was already established by #isCompatible.
    if (metadata.version === CONNECTOR_VERSION) return;

    const runningVersion = valid(metadata.version);
    const callerVersion = valid(CONNECTOR_VERSION);
    if (!runningVersion || !callerVersion) {
      throw new DaemonLifecycleError(
        `Cannot safely compare connector daemon version ${JSON.stringify(
          metadata.version,
        )} with caller version ${JSON.stringify(
          CONNECTOR_VERSION,
        )} on port ${port}.`,
      );
    }
    if (gt(runningVersion, callerVersion)) {
      throw new DaemonLifecycleError(
        `Connector daemon ${runningVersion} on port ${port} is newer than caller ${callerVersion}. Upgrade the caller instead of downgrading the daemon.`,
      );
    }
  }

  static async #probe(port: number): Promise<DaemonProbe> {
    const firstMetadata = await DaemonManager.#getMetadata(port);
    if (firstMetadata) return { kind: 'daemon', metadata: firstMetadata };
    if (!(await DaemonManager.#isAlive(port))) return { kind: 'absent' };

    // The listener can change generations between the metadata request and
    // TCP probe. Re-read metadata before classifying it as an unknown process,
    // otherwise an old daemon closing followed by a new daemon listening is
    // misidentified from two observations of two different processes.
    const secondMetadata = await DaemonManager.#getMetadata(port);
    if (secondMetadata) return { kind: 'daemon', metadata: secondMetadata };
    return (await DaemonManager.#isAlive(port))
      ? { kind: 'unknown' }
      : { kind: 'absent' };
  }

  static async #isAlive(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.setTimeout(1_000, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  static #getMetadata(port: number): Promise<ObservedDaemonMetadata | null> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: ObservedDaemonMetadata | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const request = http.get(
        {
          headers: { connection: 'close' },
          host: '127.0.0.1',
          path: DAEMON_VERSION_PATH,
          port,
          timeout: 1_000,
        },
        (response) => {
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => {
            if (body.length < 16_384) body += chunk;
          });
          response.on('aborted', () => finish(null));
          response.on('error', () => finish(null));
          response.on('end', () => {
            if (response.statusCode !== 200) {
              finish(null);
              return;
            }
            try {
              finish(DaemonManager.#parseMetadata(JSON.parse(body)));
            } catch {
              finish(null);
            }
          });
        },
      );
      request.on('timeout', () => {
        finish(null);
        request.destroy();
      });
      request.on('error', () => finish(null));
    });
  }

  static #parseMetadata(value: unknown): ObservedDaemonMetadata | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }
    const record = value as Record<string, unknown>;
    if (typeof record['version'] !== 'string' || record['version'] === '') {
      return null;
    }

    const metadata: ObservedDaemonMetadata = { version: record['version'] };
    if (typeof record['product'] === 'string') {
      metadata.product = record['product'];
    }
    if (typeof record['lifecycleProtocol'] === 'number') {
      metadata.lifecycleProtocol = record['lifecycleProtocol'];
    }
    if (typeof record['commandProtocol'] === 'number') {
      metadata.commandProtocol = record['commandProtocol'];
    }
    if (typeof record['instanceId'] === 'string') {
      metadata.instanceId = record['instanceId'];
    }
    if (typeof record['startedAt'] === 'number') {
      metadata.startedAt = record['startedAt'];
    }
    return metadata;
  }

  static #requestShutdown(
    port: number,
    metadata: ObservedDaemonMetadata,
  ): Promise<ShutdownResult> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: ShutdownResult) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      const shutdownRequest: DaemonShutdownRequest | undefined =
        metadata.instanceId === undefined
          ? undefined
          : { expectedInstanceId: metadata.instanceId };
      const body =
        shutdownRequest === undefined
          ? undefined
          : JSON.stringify(shutdownRequest);
      const request = http.request(
        {
          headers:
            body === undefined
              ? { connection: 'close' }
              : {
                  connection: 'close',
                  'content-length': Buffer.byteLength(body),
                  'content-type': 'application/json',
                },
          host: '127.0.0.1',
          method: 'POST',
          path: DAEMON_SHUTDOWN_PATH,
          port,
          timeout: 1_000,
        },
        (response) => {
          response.resume();
          response.on('aborted', () => finish('refused'));
          response.on('error', () => finish('refused'));
          response.on('end', () => {
            if (response.statusCode === 202) finish('accepted');
            else if (response.statusCode === 409) finish('conflict');
            else finish('refused');
          });
        },
      );
      request.on('timeout', () => {
        finish('refused');
        request.destroy();
      });
      request.on('error', () => finish('refused'));
      request.end(body);
    });
  }

  static async #waitForInstanceChange(
    port: number,
    previous: ObservedDaemonMetadata,
    timeoutMs: number,
  ): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const current = await DaemonManager.#probe(port);
      if (current.kind === 'absent') return true;
      if (
        current.kind === 'daemon' &&
        !DaemonManager.#isSameInstance(previous, current.metadata)
      ) {
        return true;
      }
      await sleep(100);
    }
    return false;
  }

  static #isSameInstance(
    left: ObservedDaemonMetadata,
    right: ObservedDaemonMetadata,
  ): boolean {
    if (left.instanceId !== undefined) {
      return left.instanceId === right.instanceId;
    }
    return (
      right.instanceId === undefined &&
      left.product === right.product &&
      left.version === right.version
    );
  }

  static async #spawn(port: number): Promise<void> {
    await fs.mkdir(DEBUG_ROUTER_DIR, { recursive: true });
    const entryPath = resolveDaemonEntryPath();
    const out = openSync(LOG, 'w');
    const err = openSync(ERR, 'w');

    const child = spawn(process.execPath, [entryPath, '--port', String(port)], {
      detached: true,
      stdio: ['ignore', out, err],
      env: createDaemonProcessEnvironment(process.env),
    });

    closeSync(out);
    closeSync(err);
    child.unref();
    debug('spawned daemon candidate with pid %d', child.pid);
  }

  static async #waitReady(
    port: number,
    timeoutMs: number,
  ): Promise<DaemonProbe> {
    const deadline = Date.now() + timeoutMs;
    let lastProbe: DaemonProbe = { kind: 'absent' };
    while (Date.now() < deadline) {
      lastProbe = await DaemonManager.#probe(port);
      if (lastProbe.kind === 'daemon') return lastProbe;
      // A spawn race can expose a short TCP-only interval while a winning
      // process is becoming observable. Only report unknown after it remains
      // unidentified for the full readiness window.
      await sleep(100);
    }
    return lastProbe;
  }

  static #describe(metadata: ObservedDaemonMetadata): string {
    const instance = metadata.instanceId
      ? ` instance ${metadata.instanceId}`
      : ' legacy instance';
    return `${metadata.version}${instance}`;
  }
}
