// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  iOSTransport,
} from "@lynx-js/devtool-connector/transport";
import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { registerAppCommand } from "./commands/app.ts";
import { registerCdpCommand } from "./commands/cdp.ts";
import { registerGetConsoleCommand } from "./commands/get-console.ts";
import { registerGetSourcesCommand } from "./commands/get-sources.ts";
import { registerGlobalSwitchCommand } from "./commands/global-switch.ts";
import { registerInspectCommand } from "./commands/inspect.ts";
import { registerListClientsCommand } from "./commands/list-clients.ts";
import { registerListSessionsCommand } from "./commands/list-sessions.ts";
import { registerOpenCommand } from "./commands/open.ts";
import { registerReactLynxCommand } from "./commands/reactlynx/index.ts";
import { registerEndCommand } from "./commands/recorder-end.ts";
import { registerStartCommand } from "./commands/recorder-start.ts";
import { registerTakeHeapSnapshotCommand } from "./commands/take-heap-snapshot.ts";
import { registerTakeScreenshotCommand } from "./commands/take-screenshot.ts";
import type { Context } from "./commands/utils.ts";

function getAndroidTransportSpec(env: NodeJS.ProcessEnv): { host: string; port: number } {
  const port = Number.parseInt(env["ADB_SERVER_PORT"] ?? "5037", 10);

  return {
    host: env["ADB_SERVER_HOST"] ?? "127.0.0.1",
    port: Number.isInteger(port) && port > 0 ? port : 5037,
  };
}

export function createProgram(options: { env?: NodeJS.ProcessEnv } = {}): Command {
  const env = options.env ?? process.env;
  const program = new Command();
  const context: Context = {
    transports: [
      new AndroidTransport(getAndroidTransportSpec(env)),
      new DesktopTransport(),
      new iOSTransport(),
    ],
  };

  program
    .name("lynx-devtool")
    .description("CLI to interact with Lynx DevTool Connector")
    .version(pkg.version)
    .option(
      "--no-daemon",
      "Run in non-daemon mode, which will not start the background service",
    )
    .hook("preAction", async (thisCommand) => {
      const rootOptions = thisCommand.opts<{ daemon?: boolean }>();
      if (rootOptions.daemon) {
        context.transports.push(new DaemonTransport());
      }
    })
    .hook("postAction", async () => {
      await Promise.allSettled(context.transports.map(t => t.close()));
    });

  registerListClientsCommand(program, context);
  registerListSessionsCommand(program, context);
  registerCdpCommand(program, context);
  registerAppCommand(program, context);
  registerOpenCommand(program, context);
  registerInspectCommand(program, context);
  registerGetConsoleCommand(program, context);
  registerGetSourcesCommand(program, context);
  registerTakeScreenshotCommand(program, context);
  registerTakeHeapSnapshotCommand(program, context);
  registerGlobalSwitchCommand(program, context);

  const record = program.command("recorder");
  registerStartCommand(record, context);
  registerEndCommand(record, context);

  registerReactLynxCommand(program, context);

  return program;
}
