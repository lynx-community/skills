// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type ChildProcess, execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync } from "node:fs";
import { mkdir, mkdtemp, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { ClientId } from "../client-id.ts";
import type { Connector } from "../index.ts";
import { DesktopTransport } from "./desktop.ts";
import { type Client, type Connection, type Device, Platform, type TransportConnectOptions } from "./transport.ts";

const ASSETS = path.join(
  path.dirname(createRequire(import.meta.url).resolve("@lynx-js/devtool-connector/package.json")),
  "public/simulator",
);

export interface LynxSimulatorConfig {
  registry: string;
  core: { name: string; version: string };
  lynxtron: { name: string; version: string };
  jsb?: string[];
  nativeExtensions?: (version: string) => string[];
}

type LynxSimulatorInfo = {
  clientId: string;
  pid: number | null;
  port: number;
  status: "starting" | "running" | "stopping" | "stopped" | "exited" | "failed";
  logPath: string;
  startedAt: string;
  endedAt?: string;
  expiresAt?: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  error?: string;
  stopReason?: string;
  coreVersion: string;
  lynxtronVersion: string;
  jsb: string[];
  nativeExtensions: string[];
};
type LynxSimulatorRun = {
  info: LynxSimulatorInfo;
  child: ChildProcess;
  finished: Promise<void>;
  stopping?: Promise<void>;
  ttl?: ReturnType<typeof setTimeout>;
};

function duration(ms: number): number {
  if (!Number.isSafeInteger(ms) || ms < 1 || ms > 2_147_483_647) {
    throw new Error("Duration must be an integer between 1 and 2147483647 milliseconds.");
  }
  return ms;
}

export class LynxSimulatorTransport extends DesktopTransport {
  override readonly id: Platform = Platform.Simulator;
  readonly persistent = true;
  #runs = new Map<string, LynxSimulatorRun>();
  #prepared = new Map<string, Promise<void>>();
  #lifetime = new AbortController();
  readonly #config: LynxSimulatorConfig;
  get active(): boolean {
    return [...this.#runs.values()].some(run => !run.info.endedAt);
  }
  constructor(config: LynxSimulatorConfig = {
    registry: "https://registry.npmjs.org",
    core: { name: "@lynx-js/lynx-simulator-core", version: "0.1.0-alpha.0" },
    lynxtron: { name: "@lynx-js/lynxtron", version: "0.0.31" },
  }) {
    super(false);
    this.#config = config;
  }
  override async listDevices(): Promise<Device[]> {
    return [{ id: "localhost", os: "Desktop" }];
  }
  async listClients(): Promise<Client[]> {
    return this.list().filter(info => info.status === "running").map(info => ({
      id: info.clientId,
      info: {
        App: "Lynx Simulator",
        AppVersion: info.lynxtronVersion,
        sdkVersion: info.lynxtronVersion,
        debugRouterId: info.clientId,
        debugRouterVersion: "unknown",
        deviceModel: `${os.platform()}-${os.arch()}`,
        network: "localhost",
        osType: os.platform(),
        osVersion: os.release(),
        ...info,
      },
    }));
  }
  list(): LynxSimulatorInfo[] {
    return [...this.#runs.values()].map(run => ({ ...run.info }));
  }
  #get(clientId: string): LynxSimulatorRun {
    const run = this.#runs.get(clientId);
    if (!run) throw new Error(`Unknown Lynx Simulator client: ${clientId}`);
    return run;
  }
  get(clientId: string): LynxSimulatorInfo {
    return { ...this.#get(clientId).info };
  }
  async logs(clientId: string, offset = 0): Promise<{
    content: string;
    offset: number;
    size: number;
    eof: boolean;
    finished: boolean;
  }> {
    const run = this.#get(clientId);
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid log offset.");
    const file = await open(run.info.logPath, "r");
    try {
      const { size } = await file.stat();
      if (offset > size) offset = size;
      const bytes = Buffer.alloc(Math.min(65_536, size - offset));
      const { bytesRead } = await file.read(bytes, 0, bytes.length, offset);
      return {
        content: bytes.subarray(0, bytesRead).toString("base64"),
        offset: offset + bytesRead,
        size,
        eof: offset + bytesRead >= size,
        finished: Boolean(run.info.endedAt),
      };
    } finally {
      await file.close();
    }
  }
  async wait(clientId: string, timeoutMs: number, signal?: AbortSignal): Promise<LynxSimulatorInfo> {
    const run = this.#get(clientId);
    duration(timeoutMs);
    const cancelled = new AbortController();
    try {
      await Promise.race([
        run.finished,
        delay(timeoutMs, undefined, {
          signal: AbortSignal.any([cancelled.signal, ...(signal ? [signal] : [])]),
        }),
      ]);
      return this.get(clientId);
    } finally {
      cancelled.abort();
    }
  }
  async stop(clientId: string): Promise<LynxSimulatorInfo> {
    await this.#stop(this.#get(clientId));
    return this.get(clientId);
  }
  override connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    const run = this.#runs.get(ClientId.serialize(this.id, "localhost", Number(options.port)));
    if (!run || run.info.endedAt) throw new Error("Lynx Simulator is not running.");
    return super.connect({ ...options, deviceId: "localhost" });
  }
  async #prepare(cache: string, host: string, packages: string[]): Promise<void> {
    if (existsSync(cache)) return;
    await mkdir(path.dirname(cache), { recursive: true });
    const staging = await mkdtemp(`${cache}-install-`);
    try {
      await promisify(execFile)("npm", [
        "install",
        "--prefix",
        staging,
        `--registry=${this.#config.registry}`,
        "--no-audit",
        "--no-fund",
        "--save-exact",
        "--ignore-scripts=false",
        ...(host.includes("-") ? ["--legacy-peer-deps"] : []),
        `${this.#config.core.name}@${this.#config.core.version}`,
        `${this.#config.lynxtron.name}@${host}`,
        ...packages,
      ], { timeout: 480_000, signal: this.#lifetime.signal });
      try {
        await rename(staging, cache);
      } catch (error) {
        if (!existsSync(cache)) throw error;
      }
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  async run(connector: Connector, signal?: AbortSignal, ttlMs?: number, options: {
    jsb?: unknown;
    nativeExtensions?: unknown;
    lynxtronVersion?: unknown;
  } = {}): Promise<LynxSimulatorInfo> {
    if (ttlMs !== undefined) duration(ttlMs);
    const { core, lynxtron, registry } = this.#config;
    const host = options.lynxtronVersion ?? lynxtron.version;
    if (typeof host !== "string" || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(host)) {
      throw new Error("lynxtronVersion must be an exact version.");
    }
    const jsb = withDefaults(this.#config.jsb ?? [], packageList(options.jsb, "jsb"));
    const nativeExtensions = withDefaults(
      this.#config.nativeExtensions?.(host) ?? [],
      packageList(options.nativeExtensions, "nativeExtensions"),
    );
    const cache = path.join(
      os.homedir(),
      ".cache/agent-lynx/simulator",
      createHash("sha256").update(JSON.stringify({ registry, core, host, name: lynxtron.name, jsb, nativeExtensions }))
        .digest("hex").slice(0, 24),
    );
    const packages = [
      ...jsb.map((spec, i) => `agent-lynx-jsb-${i}@npm:${spec}`),
      ...nativeExtensions.map((spec, i) => `agent-lynx-native-${i}@npm:${spec}`),
    ];
    const hook = path.join(
      ASSETS,
      `bind-${process.platform}-${process.arch}.${process.platform === "darwin" ? "dylib" : "so"}`,
    );
    if (!existsSync(hook)) throw new Error(`Lynx Simulator does not support ${process.platform}/${process.arch}.`);
    let prepared = this.#prepared.get(cache);
    if (!prepared) {
      prepared = this.#prepare(cache, host, packages).catch(error => {
        this.#prepared.delete(cache);
        throw error;
      });
      this.#prepared.set(cache, prepared);
    }
    await prepared;
    signal?.throwIfAborted();
    this.#lifetime.signal.throwIfAborted();
    const listeners: net.Server[] = [];
    let port: number, clientId: string;
    try {
      do {
        signal?.throwIfAborted();
        this.#lifetime.signal.throwIfAborted();
        const listener = net.createServer();
        await new Promise<void>((resolve, reject) => {
          listener.once("error", reject);
          listener.listen(0, "127.0.0.1", resolve);
        });
        // Keep rejected ports bound until a fresh port has been selected.
        listeners.push(listener);
        port = (listener.address() as net.AddressInfo).port;
        clientId = ClientId.serialize(this.id, "localhost", port);
      } while (this.#runs.has(clientId));
    } finally {
      await Promise.all(
        listeners.map(listener =>
          new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()))
        ),
      );
    }
    const directory = await mkdtemp(path.join(cache, "run-"));
    // Resolve with ESM import conditions from this run's isolated node_modules.
    await writeFile(path.join(directory, "packages.mjs"), "export const loadPackage = name => import(name);\n");
    const logPath = path.join(directory, "simulator.log");
    const { default: executable } = await import(
      pathToFileURL(path.join(cache, "node_modules", lynxtron.name, "lynxtron_bin.js")).href
    ) as { default: string };
    const log = openSync(logPath, "a");
    const child = spawn(executable, [path.join(ASSETS, "entry.mjs")], {
      detached: true,
      stdio: ["pipe", log, log],
      env: {
        ...process.env,
        AGENT_LYNX_SIMULATOR_ROOT: cache,
        AGENT_LYNX_SIMULATOR_CORE: core.name,
        AGENT_LYNX_SIMULATOR_PACKAGES: JSON.stringify({ jsb, nativeExtensions }),
        AGENT_LYNX_SIMULATOR_RUN: directory,
        AGENT_LYNX_SIMULATOR_PORT: String(port),
        AGENT_LYNX_SIMULATOR_BOUND: path.join(directory, "bound"),
        [process.platform === "darwin" ? "DYLD_INSERT_LIBRARIES" : "LD_PRELOAD"]: hook,
      },
    });
    closeSync(log);
    const info: LynxSimulatorInfo = {
      clientId,
      pid: child.pid ?? null,
      port,
      status: "starting",
      logPath,
      startedAt: new Date().toISOString(),
      exitCode: null,
      signal: null,
      coreVersion: core.version,
      lynxtronVersion: host,
      jsb,
      nativeExtensions,
    };
    let finish!: () => void;
    const run: LynxSimulatorRun = {
      info,
      child,
      finished: new Promise<void>(resolve => {
        finish = resolve;
      }),
    };
    this.#runs.set(clientId, run);
    const complete = (code: number | null, exitSignal: NodeJS.Signals | null, error?: Error): void => {
      if (info.endedAt) return;
      if (error) info.error = error.message;
      info.status = info.error ? "failed" : info.status === "stopping" ? "stopped" : code === 0 ? "exited" : "failed";
      Object.assign(info, { exitCode: code, signal: exitSignal, endedAt: new Date().toISOString() });
      clearTimeout(run.ttl);
      finish();
    };
    child.once("error", error => complete(null, null, error));
    child.once("exit", (code, exitSignal) => complete(code, exitSignal));
    try {
      const deadline = Date.now() + 20_000;
      while (!existsSync(path.join(directory, "ready")) || !existsSync(path.join(directory, "bound"))) {
        signal?.throwIfAborted();
        this.#lifetime.signal.throwIfAborted();
        if (info.endedAt || Date.now() > deadline) {
          throw new Error(
            `${info.error ?? "Lynx Simulator failed to start"}: ${await readFile(logPath, "utf8")} (${logPath})`,
          );
        }
        await delay(50);
      }
      await connector.sendListSessionMessage(clientId);
      signal?.throwIfAborted();
      this.#lifetime.signal.throwIfAborted();
      if (info.status !== "starting") throw new Error("Lynx Simulator stopped during startup.");
      info.status = "running";
      if (ttlMs !== undefined) {
        info.expiresAt = new Date(Date.now() + ttlMs).toISOString();
        run.ttl = setTimeout(() => {
          void this.#stop(run, "ttl").catch(console.error);
        }, ttlMs);
      }
      return this.get(clientId);
    } catch (error) {
      if (info.stopReason === undefined) {
        info.error = error instanceof Error
          ? error.message
          : String(error);
        if (info.endedAt) info.status = "failed";
      }
      await this.#stop(run, "startup-failed");
      throw error;
    }
  }
  async #stop(run: LynxSimulatorRun, reason = "requested"): Promise<void> {
    if (run.info.endedAt) return;
    await (run.stopping ??= (async () => {
      run.info.status = "stopping";
      run.info.stopReason = reason;
      run.child.stdin?.end();
      const timer = setTimeout(() => {
        try {
          if (run.child.pid) process.kill(-run.child.pid, "SIGKILL");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") console.error(error);
        }
      }, 3000);
      await run.finished.finally(() => clearTimeout(timer));
    })());
  }
  override async close(): Promise<void> {
    this.#lifetime.abort();
    await Promise.all([...this.#runs.values()].map(run => this.#stop(run, "daemon")));
  }
}

function packageList(value: unknown, name: string): string[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value)
    || !value.every((spec: unknown) =>
      typeof spec === "string" && /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*(?:@[a-zA-Z0-9*^~.><=|+ -]+)?$/.test(spec)
    )
  ) {
    throw new Error(`${name} must be an array of npm package names, optionally followed by @version.`);
  }
  return [...new Set(value as string[])];
}

function withDefaults(builtins: string[], packages: string[]): string[] {
  const name = (spec: string): string => spec.replace(/@[^@/]+$/, "");
  return [...builtins.filter(builtin => !packages.some(spec => name(spec) === name(builtin))), ...packages];
}
