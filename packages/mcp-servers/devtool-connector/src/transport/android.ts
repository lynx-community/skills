// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type Adb, AdbServerClient, escapeArg } from "@yume-chan/adb";
import { AdbServerNodeJsTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { ReadableStream } from "@yume-chan/stream-extra";
import type { SocketConnectOpts } from "node:net";
import { createDebug } from "obug";
export type * from "./adb-shell-types.ts";
import { ANDROID_APP_ICON_HELPER_JAR } from "./android-app-icon-helper.ts";
import { connectWithPeertalk } from "./base.ts";
import {
  type App,
  type Connection,
  type Device,
  type OpenAppOptions,
  requireNumericPort,
  type Transport,
  type TransportConnectOptions,
} from "./transport.ts";

const debug = createDebug("devtool-mcp-server:connector:android");
const APP_ICON_HELPER_REMOTE_PATH = "/data/local/tmp/lynx-connector-app-icon-v1.jar";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function createQueryLauncherActivitiesCommandArgs(packageName: string): string[] {
  return [
    "cmd",
    "package",
    "query-activities",
    "--components",
    "-a",
    "android.intent.action.MAIN",
    "-c",
    "android.intent.category.LAUNCHER",
    "-p",
    packageName,
  ];
}

function parseLauncherActivityComponents(output: string): string[] {
  return output
    .split("\n")
    .map(line => line.trim())
    .filter((line) => {
      const separatorIndex = line.indexOf("/");
      return !/\s/u.test(line)
        && separatorIndex > 0
        && separatorIndex === line.lastIndexOf("/")
        && separatorIndex < line.length - 1;
    });
}

function createOpenAppCommandArgs(componentName: string): string[] {
  return [
    "am",
    "start",
    "-W",
    "-S",
    "-a",
    "android.intent.action.MAIN",
    "-c",
    "android.intent.category.LAUNCHER",
    "-n",
    componentName,
  ];
}

function createOpenSchemaCommandArgs(packageName: string, schema: string): string[] {
  return [
    "am",
    "start",
    "-W",
    "-S",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    schema,
    "-p",
    packageName,
  ];
}

async function spawnWaitText(
  adb: Adb,
  command: string | readonly string[],
  signal?: AbortSignal,
): Promise<string> {
  const adbCommand = typeof command === "string" ? command : command.map(escapeArg).join(" ");
  const output = await adb.subprocess.noneProtocol.spawn(adbCommand, signal).wait().toString();
  signal?.throwIfAborted();
  return output;
}

export interface AppIcon {
  readonly data: Uint8Array;
  readonly mimeType: "image/png";
}

export class AndroidTransport implements Transport {
  protected readonly client: AdbServerClient;
  readonly #appIconHelperDeployments = new Map<string, Promise<void>>();

  constructor(spec: SocketConnectOpts = { port: 5037 }) {
    const resolvedSpec: SocketConnectOpts = "port" in spec
      ? { ...spec, host: spec.host ?? "127.0.0.1" }
      : spec;
    // Narrow Node's socket option union so TypeScript can select the matching
    // TCP or IPC overload added by @yume-chan/adb-server-node-tcp v3.
    const connector = "path" in resolvedSpec
      ? new AdbServerNodeJsTcpConnector(resolvedSpec)
      : new AdbServerNodeJsTcpConnector(resolvedSpec);
    this.client = new AdbServerClient(connector);
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    return connectWithPeertalk<TInput, TOutput>(opts => this.#connectRaw(opts), options);
  }

  async #createAdb(deviceId: string, signal?: AbortSignal): Promise<Adb & AsyncDisposable> {
    const connector = this.client.connector;
    const client = signal
      ? new AdbServerClient({
        connect: options =>
          connector.connect({
            ...options,
            signal: options?.signal ? AbortSignal.any([options.signal, signal]) : signal,
          }),
        addReverseTunnel: connector.addReverseTunnel.bind(connector),
        removeReverseTunnel: connector.removeReverseTunnel.bind(connector),
        clearReverseTunnels: connector.clearReverseTunnels.bind(connector),
      })
      : this.client;
    let adb: Adb;
    try {
      adb = await client.createAdb({ serial: deviceId });
    } catch (error) {
      signal?.throwIfAborted();
      throw error;
    }
    return Object.assign(adb, {
      async [Symbol.asyncDispose]() {
        await adb.close();
      },
    });
  }

  async close(): Promise<void> {
    // noop
    debug("Android transport closed");
    return;
  }

  async #connectRaw(
    { deviceId, port, signal }: TransportConnectOptions,
  ): Promise<Connection> {
    const numericPort = requireNumericPort(port);
    debug(`connect: create connection to deviceId: ${deviceId}, port: ${numericPort}`);

    signal?.throwIfAborted();

    const service = `tcp:${numericPort}`;
    const closeController = new AbortController();
    const socketSignal = signal
      ? AbortSignal.any([signal, closeController.signal])
      : closeController.signal;

    let socket: Awaited<ReturnType<AdbServerClient["createDeviceConnection"]>>;
    try {
      socket = await this.client.createDeviceConnection(
        { serial: deviceId },
        service,
        { signal: socketSignal },
      );
    } catch (err) {
      debug(`connect: create socket to ${service} failed with err: %o`, err);
      throw err;
    }

    const socketClosed = Promise.resolve(socket.closed);
    let socketClosedSettled = false;
    void socketClosed.then(
      () => {
        socketClosedSettled = true;
      },
      () => {
        socketClosedSettled = true;
      },
    );
    let closePromise: Promise<void> | undefined;
    const closeSocket = (): Promise<void> => {
      if (!closePromise) {
        let closeResult: Promise<void>;
        try {
          closeResult = Promise.resolve(socket.close());
        } catch (err) {
          closeResult = Promise.reject(err);
        }
        // ADB's close() only sends FIN. If the peer stays half-open, abort the
        // socket on the next turn and still wait for its physical close before
        // completing disposal.
        const hardCloseCheck = new Promise<void>(resolve => {
          setImmediate(() => {
            if (!socketClosedSettled) {
              debug(`connect: force close socket ${service} after graceful close stalled`);
              closeController.abort();
            }
            resolve();
          });
        });
        closePromise = Promise.allSettled([closeResult, socketClosed, hardCloseCheck]).then(
          ([closeResultOutcome, socketClosedOutcome]) => {
            if (closeResultOutcome.status === "rejected") {
              throw closeResultOutcome.reason;
            }
            if (socketClosedOutcome.status === "rejected") {
              throw socketClosedOutcome.reason;
            }
          },
        );
      }
      return closePromise;
    };

    if (signal?.aborted) {
      try {
        await closeSocket();
      } catch (err) {
        debug(`connect: close canceled socket ${service} err: %o`, err);
      }
      signal.throwIfAborted();
    }

    const abortHandler = () => {
      void closeSocket().catch((err: unknown) => {
        debug(`connect: socket ${service} close on abort err: %o`, err);
      });
    };
    signal?.addEventListener("abort", abortHandler, { once: true });

    void socketClosed.catch((err: unknown) => {
      debug(`connect: socket ${service} closed with err: %o`, err);
    });

    return {
      readable: socket.readable as never,
      writable: socket.writable as never,
      async [Symbol.asyncDispose]() {
        signal?.removeEventListener("abort", abortHandler);
        debug(`connect: close connection to deviceId: ${deviceId}, port: ${numericPort}`);
        await closeSocket();
      },
    };
  }

  async listDevices(): Promise<Device[]> {
    const devices = await this.client.getDevices();

    debug("listDevices: devices %o", devices);

    return devices.map(({ serial }) => ({
      os: "Android",
      id: serial,
    }));
  }

  protected getKnownApp(_packageName: string): { name?: string; activityName?: string } | undefined {
    void _packageName;
    return undefined;
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    await using adb = await this.#createAdb(deviceId);
    const output = await spawnWaitText(adb, [
      // adb shell pm list packages
      "pm",
      "list",
      "packages",
      "-3", // third-party apps only
    ]);
    const packages = output
      .split("\n")
      .map((line) => line.replace("package:", "").trim())
      .filter((i) => i !== "");
    debug(`listAvailableApps all packages: %o`, packages);

    return packages.map((packageName) => ({
      packageName,
      name: this.getKnownApp(packageName)?.name ?? packageName,
    }));
  }

  async getAppIcon(deviceId: string, packageName: string): Promise<AppIcon> {
    if (!/^[A-Za-z][\w.]*$/u.test(packageName)) {
      throw new TypeError(`Invalid Android package name: ${packageName}`);
    }

    await using adb = await this.#createAdb(deviceId);
    await this.#ensureAppIconHelper(adb, deviceId);
    const data = await adb.subprocess.noneProtocol.spawn([
      `CLASSPATH=${APP_ICON_HELPER_REMOTE_PATH}`,
      "app_process",
      "/system/bin",
      "org.lynx.connector.AppIconRenderer",
      packageName,
    ]).wait();
    if (PNG_SIGNATURE.some((byte, index) => data[index] !== byte)) {
      throw new Error(`Device returned an invalid App icon for package ${packageName}`);
    }
    return { data, mimeType: "image/png" };
  }

  async #ensureAppIconHelper(adb: Adb, deviceId: string): Promise<void> {
    let deployment = this.#appIconHelperDeployments.get(deviceId);
    if (!deployment) {
      deployment = adb.sync.write({
        path: APP_ICON_HELPER_REMOTE_PATH,
        permission: 0o644,
        readable: new ReadableStream({
          start(controller) {
            controller.enqueue(ANDROID_APP_ICON_HELPER_JAR);
            controller.close();
          },
        }),
      }).then(() => undefined);
      this.#appIconHelperDeployments.set(deviceId, deployment);
    }
    try {
      await deployment;
    } catch (error) {
      this.#appIconHelperDeployments.delete(deviceId);
      throw error;
    }
  }

  async openApp(
    deviceId: string,
    packageName: string,
    { schema, signal, withDataCleared }: OpenAppOptions = {},
  ): Promise<void | string> {
    signal?.throwIfAborted();
    await using adb = await this.#createAdb(deviceId, signal);
    signal?.throwIfAborted();

    const pmOutput = await spawnWaitText(adb, [
      "pm",
      "list",
      "packages",
      packageName,
    ], signal);
    const installed = pmOutput
      .split("\n")
      .some((line) => line.trim() === `package:${packageName}`);
    if (!installed) {
      throw new Error(`package ${packageName} not found`);
    }

    if (withDataCleared) {
      const output = await spawnWaitText(adb, [
        // adb shell pm clear <package_name>
        "pm",
        "clear",
        packageName,
      ], signal);
      debug(`openApp clear data output ${output}`);
    }

    if (schema !== undefined) {
      const output = await spawnWaitText(
        adb,
        createOpenSchemaCommandArgs(packageName, schema),
        signal,
      );
      debug(`openApp VIEW output ${output}`);
      if (
        !/^Status: ok\r?$/mu.test(output)
        || output.includes("Error: Activity not started")
        || output.includes("unable to resolve Intent")
        || /Error type \d+/u.test(output)
      ) {
        throw new Error(`Failed to open app ${packageName} with schema ${schema}: ${output.trim()}`);
      }
      return output;
    }

    const knownActivity = this.getKnownApp(packageName)?.activityName;
    let componentName = knownActivity ? `${packageName}/${knownActivity}` : undefined;
    if (!componentName) {
      const queryOutput = await spawnWaitText(
        adb,
        createQueryLauncherActivitiesCommandArgs(packageName),
        signal,
      );
      debug(`openApp launcher activities output ${queryOutput}`);
      [componentName] = parseLauncherActivityComponents(queryOutput);
    }
    if (!componentName) {
      throw new Error(`No launchable activity found for package ${packageName}.`);
    }

    const output = await spawnWaitText(adb, createOpenAppCommandArgs(componentName), signal);
    debug(`openApp LAUNCHER output ${output}`);
    if (
      output.includes("Error: Activity not started")
      || output.includes("unable to resolve Intent")
      || /Error type \d+/u.test(output)
    ) {
      throw new Error(`Failed to open app ${packageName}: ${output.trim()}`);
    }
  }
}
