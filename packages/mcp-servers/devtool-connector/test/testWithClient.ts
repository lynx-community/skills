// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test, type TestContext } from "node:test";
import { Connector } from "../src/index.ts";
import { AndroidTransport } from "../src/transport/android.ts";
import { DaemonTransport } from "../src/transport/daemon.ts";
import { DesktopTransport } from "../src/transport/desktop.ts";
import { iOSTransport } from "../src/transport/ios.ts";
import type { Client, Transport } from "../src/transport/transport.ts";

export const TEST_APP_PACKAGE_NAME = "com.lynx.uiapp";
export const TEST_PAGE_URL =
  "https://example.com/template.js";
const TEST_APP_PACKAGE_ENV = "LYNX_DEVTOOL_MCP_TESTING_APP_PACKAGE";
const TEST_PAGE_URL_ENV = "LYNX_DEVTOOL_MCP_TESTING_PAGE_URL";
const TEST_OPEN_URL_ENV = "LYNX_DEVTOOL_MCP_TESTING_OPEN_URL";

const transportsFromEnv = process.env["LYNX_DEVTOOL_MCP_TESTING_TRANSPORTS"]
  ? process.env["LYNX_DEVTOOL_MCP_TESTING_TRANSPORTS"].split(",")
  : null;

export interface TestingTarget {
  appPackageName: string;
  pageUrl: string;
  openUrl: string;
}

function readEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function resolveTestingTarget(env: NodeJS.ProcessEnv = process.env): TestingTarget {
  const pageUrl = readEnv(env, TEST_PAGE_URL_ENV) ?? TEST_PAGE_URL;

  return {
    appPackageName: readEnv(env, TEST_APP_PACKAGE_ENV) ?? TEST_APP_PACKAGE_NAME,
    pageUrl,
    openUrl: readEnv(env, TEST_OPEN_URL_ENV) ?? pageUrl,
  };
}

function isClientForTarget(client: Client, target: TestingTarget): boolean {
  return client.info.AppProcessName === target.appPackageName
    || client.info.bundleId === target.appPackageName
    || client.info.bundleName === target.appPackageName
    || client.info.App === target.appPackageName;
}

export function selectTestingClient(
  clients: Client[],
  target: TestingTarget = resolveTestingTarget(),
): Client | undefined {
  return clients.find(client => isClientForTarget(client, target));
}

function formatClient(client: Client): string {
  const info = client.info;
  return [
    `id=${client.id}`,
    `App=${info.App}`,
    info.AppProcessName ? `AppProcessName=${info.AppProcessName}` : undefined,
    info.bundleId ? `bundleId=${info.bundleId}` : undefined,
    info.bundleName ? `bundleName=${info.bundleName}` : undefined,
    info.osType ? `osType=${info.osType}` : undefined,
    info.deviceModel ? `deviceModel=${info.deviceModel}` : undefined,
  ].filter(Boolean).join(", ");
}

export function formatNoTestingClientMessage(
  name: string,
  clients: Client[],
  target: TestingTarget,
): string {
  if (clients.length === 0) {
    return `No ${name} clients found for target package ${target.appPackageName}`;
  }

  return `No ${name} clients matched target package ${target.appPackageName}. Available clients: ${
    clients.map(formatClient).join("; ")
  }`;
}

export type TestingSession = {
  session_id: number;
  type?: string;
  url?: string;
};

export async function getTestingSession(
  connector: { sendListSessionMessage(clientId: string): Promise<TestingSession[]> },
  clientId: string,
): Promise<TestingSession> {
  const sessions = await connector.sendListSessionMessage(clientId);
  const session = sessions[sessions.length - 1];
  if (!session) {
    throw new Error(
      `No sessions found for client ${clientId}. Ensure a page is opened before running tests (e.g. node skills/lynx-devtool/scripts/index.mjs open <url>)`,
    );
  }
  return session;
}

const Transports: { name: string; createTransports: () => Promise<Transport[]> | Transport[] }[] = [
  { name: "iOS", createTransports: () => [new iOSTransport()] },
  { name: "Android", createTransports: () => [new AndroidTransport()] },
  { name: "Daemon", createTransports: () => [new DaemonTransport()] },
  {
    name: "EmbeddedLynx",
    createTransports: () => [new DesktopTransport()],
  },
]
  .filter(i => !transportsFromEnv || transportsFromEnv.includes(i.name));

if (transportsFromEnv && Transports.length === 0) {
  throw new Error(
    `No transports matched LYNX_DEVTOOL_MCP_TESTING_TRANSPORTS=${process.env["LYNX_DEVTOOL_MCP_TESTING_TRANSPORTS"]}`,
  );
}

function createRunner(testFn: (name: string, fn: (t: TestContext) => Promise<void>) => Promise<void>) {
  return (
    testName: string,
    callback: (
      t: TestContext,
      connector: Connector,
      client: Client,
      target: TestingTarget,
    ) => Promise<void>,
  ): Promise<void> => {
    return describe(testName, () => {
      Transports.forEach(({ name, createTransports }) => {
        testFn(`${testName} - ${name}`, async (t: TestContext) => {
          const target = resolveTestingTarget();
          const transports = await createTransports();
          if (transports.length === 0) {
            throw new Error(`No ${name} transports available`);
          }
          const connector = new Connector(transports);

          t.after(async () => {
            await Promise.all(transports.map((transport) => transport.close()));
          });

          const clients = await connector.listClients();
          const client = selectTestingClient(clients, target);

          if (!client) {
            t.assert.fail(formatNoTestingClientMessage(name, clients, target));
          }

          await callback(t, connector, client, target);
        });
      });
    });
  };
}

export const testWithClient = Object.assign(
  createRunner(test),
  {
    only: createRunner(test.only),
    todo: createRunner(test.todo),
    skip: createRunner(test.skip),
  },
);
