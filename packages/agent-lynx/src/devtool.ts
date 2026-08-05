// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { HttpCommandClient } from '@lynx-js/devtool-connector/command';
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  iOSTransport,
  type Transport,
} from '@lynx-js/devtool-connector/transport';
import { Command, type ParseOptions } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { registerAppCommand } from './commands/app.ts';
import { registerCdpCommand } from './commands/cdp.ts';
import { CLI_PLACEHOLDER } from './commands/cli.ts';
import { registerEvaluateCommand } from './commands/evaluate.ts';
import { registerFillCommand } from './commands/fill.ts';
import { registerGetCommand } from './commands/get.ts';
import { registerGetConsoleCommand } from './commands/get-console.ts';
import { registerGetSourcesCommand } from './commands/get-sources.ts';
import { registerGlobalSwitchCommand } from './commands/global-switch.ts';
import { registerInspectCommand } from './commands/inspect.ts';
import { registerListClientsCommand } from './commands/list-clients.ts';
import { registerListSessionsCommand } from './commands/list-sessions.ts';
import { registerOpenCommand } from './commands/open.ts';
import { registerReactLynxCommand } from './commands/reactlynx/index.ts';
import { registerEndCommand } from './commands/recorder-end.ts';
import { registerStartCommand } from './commands/recorder-start.ts';
import { registerScreenshotCommand } from './commands/screenshot.ts';
import { registerScrollCommand } from './commands/scroll.ts';
import { registerSkillsCommand } from './commands/skills.ts';
import { registerSnapshotCommand } from './commands/snapshot.ts';
import { registerTakeContentScreenshotCommand } from './commands/take-content-screenshot.ts';
import { registerTakeHeapSnapshotCommand } from './commands/take-heap-snapshot.ts';
import { registerTakeScreenshotCommand } from './commands/take-screenshot.ts';
import { registerTapCommand } from './commands/tap.ts';
import { registerTraceCommand } from './commands/trace.ts';
import type { Context } from './commands/utils.ts';
import { registerWaitCommand } from './commands/wait.ts';
import { registerWaitForClientCommand } from './commands/wait-for-client.ts';

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

interface RootOptions {
  daemon?: boolean;
}

const DIRECT_TRANSPORT_ENVIRONMENT_VARIABLES = [
  'ADB_SERVER_HOST',
  'ADB_SERVER_PORT',
] as const;

function createDirectTransports(env: NodeJS.ProcessEnv): Transport[] {
  return [
    new AndroidTransport(getAndroidTransportSpec(env)),
    new iOSTransport(),
    new DesktopTransport(),
  ];
}

function warnIgnoredDirectTransportEnvironment(env: NodeJS.ProcessEnv): void {
  const ignored = DIRECT_TRANSPORT_ENVIRONMENT_VARIABLES.filter(
    (name) => env[name] !== undefined,
  );
  if (ignored.length === 0) return;

  process.stderr.write(
    `Warning: ${ignored.join(', ')} ${
      ignored.length === 1 ? 'is' : 'are'
    } ignored in daemon mode. Pass --no-daemon to apply direct transport configuration.\n`,
  );
}

class TransportClosingCommand extends Command {
  readonly #context: Context;

  constructor(context: Context) {
    super();
    this.#context = context;
  }

  override async parseAsync(
    argv?: readonly string[],
    parseOptions?: ParseOptions,
  ): Promise<this> {
    try {
      return await super.parseAsync(argv, parseOptions);
    } finally {
      await Promise.allSettled(
        this.#context.transports.map((transport) =>
          Promise.resolve().then(() => transport.close()),
        ),
      );
    }
  }
}

function isCommandAction(command: Command, commandName: string): boolean {
  let current: Command | null = command;
  while (current) {
    if (current.name() === commandName) return true;
    current = current.parent;
  }
  return false;
}

function isSkillsAction(command: Command): boolean {
  return isCommandAction(command, 'skills');
}

function isOfflineTraceAction(command: Command): boolean {
  return (
    command.parent?.name() === 'trace' &&
    (command.name() === 'query' || command.name() === 'event-summary')
  );
}

export function createProgram(
  options: { env?: NodeJS.ProcessEnv } = {},
): Command {
  const env = options.env ?? process.env;
  const context: Context = {
    commandClient: new HttpCommandClient(),
    transports: [],
  };
  const program = new TransportClosingCommand(context);

  program
    .name('agent-lynx')
    .description(
      'Agent-friendly CLI for inspecting and operating Lynx applications',
    )
    .version(pkg.version)
    .option(
      '--no-daemon',
      'Bypass the shared daemon and use direct device transports for this invocation',
    )
    .addHelpText(
      'before',
      `Agent instruction:
  If your environment has no other suitable skill for the task, first try:
    $ ${CLI_PLACEHOLDER} skills list
    $ ${CLI_PLACEHOLDER} skills get <name>
`,
    )
    .addHelpText(
      'after',
      `
Environment variables:
  AGENT_LYNX_DISABLE_UPDATE_NOTICE
                                  Set to 1 to disable best-effort new-version
                                  notices.
  ADB_SERVER_HOST                 Direct-mode Android ADB server host
                                  (default: 127.0.0.1; requires --no-daemon).
  ADB_SERVER_PORT                 Direct-mode Android ADB server port
                                  (default: 5037; requires --no-daemon).
  DEBUG                           Comma-separated obug namespaces for diagnostic
                                  logs on stderr. Useful selectors include
                                  devtool-mcp-server:connector*,
                                  devtool-mcp-server:daemon:*, and
                                  devtool-mcp-server:reactlynx.
  CODEX_SANDBOX_NETWORK_DISABLED  When set to 1, device commands stop with a
                                  network-permission error.

Examples:
  $ ${CLI_PLACEHOLDER} list-clients
  $ ${CLI_PLACEHOLDER} open <url>
  $ ${CLI_PLACEHOLDER} list-sessions`,
    )
    .hook('preAction', async (thisCommand, actionCommand) => {
      const rootOptions = thisCommand.opts<RootOptions>();

      if (isSkillsAction(actionCommand) || isOfflineTraceAction(actionCommand))
        return;

      if (process.env['CODEX_SANDBOX_NETWORK_DISABLED'] === '1') {
        throw new Error(
          `[CODEX_SANDBOX_NETWORK_DISABLED] Network access is disabled by the Codex sandbox. Lynx DevTool CLI needs local/private network access to discover and talk to devices.

Retry outside the network-disabled sandbox. For Codex agents, request permission to rerun the command outside the sandbox, then make sure the rerun does not inherit \`CODEX_SANDBOX_NETWORK_DISABLED=1\`. For example, an escalated shell may need:

\`\`\`bash
env -u CODEX_SANDBOX_NETWORK_DISABLED <original command>
\`\`\`

You can also enable network access for this project in \`.codex/config.toml\`:

\`\`\`toml
default_permissions = "lynx-devtool"

[permissions.lynx-devtool]
extends = ":workspace"

[permissions.lynx-devtool.network]
enabled = true
allow_local_binding = true
\`\`\`

Restart the Codex session after changing permissions.`,
        );
      }

      // These modes are mutually exclusive: a daemon-owned DebugRouter
      // connection must never be accompanied by an ad-hoc direct connection.
      if (rootOptions.daemon !== false) {
        warnIgnoredDirectTransportEnvironment(env);
        context.transports.push(new DaemonTransport());
      } else {
        context.transports.push(...createDirectTransports(env));
      }
    });

  // Skill discovery is the CLI's fallback instruction surface for agents, so
  // give it the first dedicated top-level help section.
  program.commandsGroup('Agent Skills:');
  registerSkillsCommand(program);
  program.commandsGroup('Commands:');
  registerListClientsCommand(program, context);
  registerWaitForClientCommand(program, context);
  registerListSessionsCommand(program, context);
  registerCdpCommand(program, context);
  registerEvaluateCommand(program, context);
  registerAppCommand(program, context);
  registerOpenCommand(program, context);
  registerInspectCommand(program, context);
  registerGetConsoleCommand(program, context);
  registerGetSourcesCommand(program, context);
  registerTakeScreenshotCommand(program, context);
  registerTakeContentScreenshotCommand(program, context);
  registerTakeHeapSnapshotCommand(program, context);
  registerTraceCommand(program, context);

  // Recording subcommands
  const record = program
    .command('recorder')
    .description(
      'Record Lynx page interactions via TestBench and export replay files',
    );
  registerStartCommand(record, context);
  registerEndCommand(record, context);

  registerGlobalSwitchCommand(program, context);
  registerReactLynxCommand(program, context);

  // Phase one agent workflow: compact snapshots, persistent refs and ref actions.
  registerSnapshotCommand(program, context);
  registerScreenshotCommand(program, context);
  registerTapCommand(program, context);
  registerFillCommand(program, context);
  registerScrollCommand(program, context);
  registerWaitCommand(program, context);
  registerGetCommand(program, context);

  return program;
}
