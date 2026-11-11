// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type Adb, type AdbServerClient, escapeArg } from "@yume-chan/adb";
import { AdbServerNodeJsClient } from "@yume-chan/adb-server-node-tcp";
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
const SOCKET_GRACEFUL_CLOSE_TIMEOUT_MS = 100;
const WAIT_FOR_DEVICE_TIMEOUT_MS = 3_000;

function spawnWaitText(adb: Adb, command: string | readonly string[]): Promise<string> {
  return adb.subprocess.noneProtocol.spawn(command).wait().toString();
}

export interface AppIcon {
  readonly data: Uint8Array;
  readonly mimeType: "image/png";
}

export class AndroidTransport implements Transport {
  readonly id = "android";
  protected readonly client: AdbServerClient;
  readonly #appIconHelperDeployments = new Map<string, Promise<void>>();

  constructor(spec?: SocketConnectOpts) {
    // ADB's server always listens on IPv4 loopback, while `localhost` can
    // resolve to ::1 first on IPv6-only hosts, so the default host is explicit.
    const defaultHost = process.env["ANDROID_ADB_SERVER_ADDRESS"] ?? "127.0.0.1";
    this.client = !spec
      ? process.env["ADB_SERVER_SOCKET"]
        ? new AdbServerNodeJsClient()
        : new AdbServerNodeJsClient({ host: defaultHost })
      : "path" in spec
      ? new AdbServerNodeJsClient(spec)
      : new AdbServerNodeJsClient({ ...spec, host: spec.host ?? "127.0.0.1" });
  }

  async connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>> {
    return connectWithPeertalk<TInput, TOutput>(opts => this.#connectRaw(opts), options);
  }

  async close(): Promise<void> {
    debug("Android transport closed");
  }

  async #waitForDevice(deviceId: string, signal?: AbortSignal): Promise<void> {
    const timeoutSignal = AbortSignal.timeout(WAIT_FOR_DEVICE_TIMEOUT_MS);
    const waitSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
    try {
      await this.client.waitFor({ serial: deviceId }, "device", { signal: waitSignal });
    } catch (err) {
      if (!timeoutSignal.aborted || signal?.aborted) throw err;
    }
  }

  async #withAdb<T>(deviceId: string, signal: AbortSignal | undefined, fn: (adb: Adb) => Promise<T>): Promise<T> {
    await this.#waitForDevice(deviceId, signal);
    const adb = await this.client.createAdb({ serial: deviceId });
    try {
      return await fn(adb);
    } finally {
      await adb.close();
    }
  }

  async #connectRaw({ deviceId, port, signal }: TransportConnectOptions): Promise<Connection> {
    const numericPort = requireNumericPort(port);
    debug(`connect: create connection to deviceId: ${deviceId}, port: ${numericPort}`);
    signal?.throwIfAborted();

    const service = `tcp:${numericPort}`;
    const closeController = new AbortController();
    const socketSignal = signal ? AbortSignal.any([signal, closeController.signal]) : closeController.signal;

    await this.#waitForDevice(deviceId, socketSignal);
    const socket = await this.client.createDeviceConnection(
      { serial: deviceId },
      service,
      { signal: socketSignal },
    );

    const socketClosed = Promise.resolve(socket.closed).catch(() => {});
    let closePromise: Promise<void> | undefined;
    const closeSocket = (): Promise<void> =>
      closePromise ??= (async () => {
        await socket.close();
        const timer = setTimeout(() => closeController.abort(), SOCKET_GRACEFUL_CLOSE_TIMEOUT_MS);
        timer.unref?.();
        try {
          await socketClosed;
        } finally {
          clearTimeout(timer);
        }
      })();

    if (signal?.aborted) {
      await closeSocket().catch(() => {});
      signal.throwIfAborted();
    }

    const abortHandler = () => void closeSocket().catch(() => {});
    signal?.addEventListener("abort", abortHandler, { once: true });

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
    return devices.map(({ serial }) => ({ os: "Android", id: serial }));
  }

  protected getKnownApp(_packageName: string): { name?: string; activityName?: string } | undefined {
    void _packageName;
    return undefined;
  }

  async listAvailableApps(deviceId: string): Promise<App[]> {
    return this.#withAdb(deviceId, undefined, async (adb) => {
      const output = await spawnWaitText(adb, ["pm", "list", "packages", "-3"]);
      return output
        .split("\n")
        .map(line => line.replace("package:", "").trim())
        .filter(Boolean)
        .map(packageName => ({
          packageName,
          name: this.getKnownApp(packageName)?.name ?? packageName,
        }));
    });
  }

  async getAppIcon(deviceId: string, packageName: string): Promise<AppIcon> {
    if (!/^[A-Za-z][\w.]*$/u.test(packageName)) {
      throw new TypeError(`Invalid Android package name: ${packageName}`);
    }

    return this.#withAdb(deviceId, undefined, async (adb) => {
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
    });
  }

  async openApp(
    deviceId: string,
    packageName: string,
    { withDataCleared, schema, restart = true, signal }: OpenAppOptions = {},
  ): Promise<void> {
    await this.#withAdb(deviceId, signal, async (adb) => {
      const pmOutput = await spawnWaitText(adb, ["pm", "list", "packages", packageName]);
      if (!pmOutput.split("\n").some(line => line.trim() === `package:${packageName}`)) {
        throw new Error(`package ${packageName} not found`);
      }

      if (withDataCleared) {
        await spawnWaitText(adb, ["pm", "clear", packageName]);
      }

      let command: string[];
      if (schema) {
        command = [
          "am",
          "start",
          "-W",
          ...(restart ? ["-S"] : []),
          "-a",
          "android.intent.action.VIEW",
          "-d",
          escapeArg(schema),
          "-p",
          packageName,
        ];
      } else {
        const knownActivity = this.getKnownApp(packageName)?.activityName;
        let componentName = knownActivity ? `${packageName}/${knownActivity}` : undefined;
        if (!componentName) {
          const queryOutput = await spawnWaitText(adb, [
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
          ]);
          [componentName] = queryOutput
            .split("\n")
            .map(line => line.trim())
            .filter(line => !/\s/u.test(line) && /^[^/]+\/[^/]+$/u.test(line));
        }
        if (!componentName) {
          throw new Error(`No launchable activity found for package ${packageName}.`);
        }
        command = [
          "am",
          "start",
          "-W",
          ...(restart ? ["-S"] : []),
          "-a",
          "android.intent.action.MAIN",
          "-c",
          "android.intent.category.LAUNCHER",
          "-n",
          componentName,
        ];
      }

      const output = await spawnWaitText(adb, command);
      if (
        output.includes("Error:")
        || output.includes("Security exception:")
        || output.includes("Permission Denial:")
        || output.includes("unable to resolve Intent")
        || /\b[A-Za-z0-9_$.]*Exception:/u.test(output)
        || /Error type \d+/u.test(output)
      ) {
        throw new Error(`Failed to open app ${packageName}: ${output.trim()}`);
      }
    });
  }
}
