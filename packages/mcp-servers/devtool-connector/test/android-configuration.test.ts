// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { AdbSync, LinuxFileType } from "@yume-chan/adb";
import { AdbServerNodeJsTcpConnector } from "@yume-chan/adb-server-node-tcp";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createDaemonProcessEnvironment } from "../src/daemon/manager.ts";
import { ANDROID_APP_ICON_HELPER_JAR } from "../src/transport/android-app-icon-helper.ts";
import { AndroidTransport } from "../src/transport/android.ts";

const ADB_ENV = ["ADB_SERVER_SOCKET", "ANDROID_ADB_SERVER_ADDRESS", "ANDROID_ADB_SERVER_PORT"] as const;

class InspectableAndroidTransport extends AndroidTransport {
  get socketSpec() {
    const connector = this.client.connector;
    assert.ok(connector instanceof AdbServerNodeJsTcpConnector);
    return connector.spec;
  }
}

function useAdbEnvironment(t: { after: (hook: () => void) => void }): void {
  const original = Object.fromEntries(ADB_ENV.map(name => [name, process.env[name]]));
  t.after(() => {
    for (const name of ADB_ENV) {
      const value = original[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  for (const name of ADB_ENV) delete process.env[name];
}

describe("Android ADB server configuration", () => {
  test("reads the standard ADB environment with an IPv4 loopback default host", (t) => {
    useAdbEnvironment(t);
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "127.0.0.1", port: 5037 });

    // The port comes from upstream, so it is validated instead of ignored.
    process.env["ANDROID_ADB_SERVER_PORT"] = "5038";
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "127.0.0.1", port: 5038 });
    for (const port of ["0", "-1", "65536", "5037junk", "1.5", " 5037 "]) {
      process.env["ANDROID_ADB_SERVER_PORT"] = port;
      assert.throws(() => new InspectableAndroidTransport(), /ANDROID_ADB_SERVER_PORT/);
    }
    delete process.env["ANDROID_ADB_SERVER_PORT"];

    process.env["ANDROID_ADB_SERVER_ADDRESS"] = "10.0.0.1";
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "10.0.0.1", port: 5037 });

    // A socket spec takes precedence over the address and port.
    process.env["ANDROID_ADB_SERVER_PORT"] = "5038";
    process.env["ADB_SERVER_SOCKET"] = "tcp:[::1]:5040";
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "::1", port: 5040 });
    process.env["ADB_SERVER_SOCKET"] = "tcp:5041";
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "localhost", port: 5041 });
    process.env["ADB_SERVER_SOCKET"] = "tcp:adb.example";
    assert.deepEqual(new InspectableAndroidTransport().socketSpec, { host: "adb.example", port: 5037 });
    process.env["ADB_SERVER_SOCKET"] = "tcp:";
    assert.throws(() => new InspectableAndroidTransport());

    if (process.platform !== "win32") {
      process.env["ADB_SERVER_SOCKET"] = "localfilesystem:/tmp/adb.sock";
      assert.deepEqual(new InspectableAndroidTransport().socketSpec, { path: "/tmp/adb.sock" });
    }

    // Explicit socket options bypass the environment.
    assert.deepEqual(new InspectableAndroidTransport({ host: "127.0.0.1", port: 5042 }).socketSpec, {
      host: "127.0.0.1",
      port: 5042,
    });
    if (process.platform !== "win32") {
      assert.deepEqual(new InspectableAndroidTransport({ path: "\0adb" }).socketSpec, { path: "\0adb" });
    }
  });

  test("daemon children cannot inherit direct ADB configuration", () => {
    const env = {
      ADB_SERVER_SOCKET: "tcp:adb.example:5038",
      ANDROID_ADB_SERVER_ADDRESS: "adb.example",
      ANDROID_ADB_SERVER_PORT: "5038",
      PATH: "/usr/bin",
    };
    assert.deepEqual(createDaemonProcessEnvironment(env), { PATH: "/usr/bin", DEBUG: "" });
    assert.equal(env.ADB_SERVER_SOCKET, "tcp:adb.example:5038");
  });

  test("getAppIcon pushes helper JAR uncompressed and skips upload when remote size matches", async () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    const writes: Array<{ path: string; compression: unknown }> = [];
    let remoteSize: bigint | undefined;

    const createTransport = () => {
      const transport = new AndroidTransport();
      const adb = {
        subprocess: {
          noneProtocol: {
            spawn() {
              return {
                wait: () => Promise.resolve(png),
              };
            },
          },
        },
        sync: {
          async lstat() {
            if (remoteSize === undefined) throw new Error("ENOENT");
            return { type: LinuxFileType.File, size: remoteSize };
          },
          async write({ path, compression }: { path: string; compression?: unknown }) {
            writes.push({ path, compression });
            remoteSize = BigInt(ANDROID_APP_ICON_HELPER_JAR.byteLength);
          },
        },
        async close() {},
      };
      Object.defineProperty(transport, "client", {
        value: { createAdb: async () => adb },
      });
      return transport;
    };

    await createTransport().getAppIcon("device", "com.example.app");
    await createTransport().getAppIcon("device", "com.example.app");
    assert.deepEqual(writes, [
      {
        path: "/data/local/tmp/lynx-connector-app-icon-v1.jar",
        compression: AdbSync.Compression.Format.None,
      },
    ]);
  });
});
