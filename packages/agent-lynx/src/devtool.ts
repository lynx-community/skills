// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import {
  HttpCommandClient,
  InProcessCommandClient,
} from '@lynx-js/devtool-connector/command';
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  HDTTransport,
  iOSTransport,
  type Transport,
} from '@lynx-js/devtool-connector/transport';
import type { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import {
  applyHostJsonPreference,
  resolveCliPlaceholder,
} from './cli-invocation.ts';
import {
  type Context,
  registerAppCommand,
  registerCdpCommand,
  registerDaemonCommand,
  type RegisterDaemonCommandOptions,
  registerEndCommand,
  registerEvaluateCommand,
  registerFillCommand,
  registerGetCommand,
  registerGetConsoleCommand,
  registerGetSourceInfoCommand,
  registerGetSourcesCommand,
  registerGlobalSwitchCommand,
  registerInspectCommand,
  registerListClientsCommand,
  registerListSessionsCommand,
  registerLogsCommand,
  registerOpenCommand,
  registerReactLynxCommand,
  registerScreenshotCommand,
  registerScrollCommand,
  registerSkillsCommand,
  type RegisterSkillsCommandOptions,
  registerSnapshotCommand,
  registerStartCommand,
  registerTakeContentScreenshotCommand,
  registerTakeHeapSnapshotCommand,
  registerTakeScreenshotCommand,
  registerTapCommand,
  registerTraceCommand,
  registerWaitCommand,
  registerWaitForClientCommand,
} from './commands/index.ts';
import {
  createRootCommand,
  getAndroidTransportSpec,
  getTelemetryCommandNames,
  isCommandAction,
  isOfflineTraceAction,
} from './program.ts';
import { type CliTelemetry, logMonitor, MonitorCode } from './telemetry.ts';

export { getAndroidTransportSpec, getTelemetryCommandNames };

export interface CreateProgramOptions {
  cliPlaceholder?: string;
  daemonCommand?: RegisterDaemonCommandOptions;
  env?: NodeJS.ProcessEnv;
  skills?: RegisterSkillsCommandOptions;
  telemetry?: CliTelemetry;
}

function createDirectTransports(env: NodeJS.ProcessEnv): Transport[] {
  return [
    ...HDTTransport.createTransports(),
    new AndroidTransport(getAndroidTransportSpec(env)),
    new iOSTransport(),
    new DesktopTransport(),
  ];
}

export function createProgram(options: CreateProgramOptions = {}): Command {
  const env = options.env ?? process.env;
  const context: Context = {
    cliPlaceholder: resolveCliPlaceholder(options.cliPlaceholder, env),
    commandClient: new HttpCommandClient(),
    transports: [],
  };
  const program = createRootCommand(context, options.telemetry);
  const start = Date.now();

  program
    .name(context.cliPlaceholder!)
    .description(
      'Agent-friendly CLI for inspecting and operating Lynx applications',
    )
    .optionsGroup('Global Options:')
    .version(pkg.version)
    .option(
      '-j, --json',
      'Enable JSON for commands that declare a machine-readable JSON mode',
      false,
    )
    .option(
      '--no-daemon',
      'Bypass the shared daemon and use direct device transports for this invocation',
    )
    .helpOption('-h, --help', 'display help for command')
    .addHelpText(
      'before',
      `Agent instruction:
  If your environment has no other suitable skill for the task, first try:
    $ ${context.cliPlaceholder} skills list
    $ ${context.cliPlaceholder} skills get <name>
`,
    )
    .addHelpText(
      'after',
      `
Environment variables:
  AGENT_LYNX_INVOKED_AS           User-facing command supplied by a process host.
  AGENT_LYNX_CLI_PLACEHOLDER      Fallback command shown in help and recovery hints.
  AGENT_LYNX_FORCE_JSON           Set to 1 or true to enable local --json options.
  AGENT_LYNX_DISABLE_UPDATE_NOTICE
                                  Set to 1 to disable new-version notices.
  ADB_SERVER_HOST                 Direct-mode Android ADB server host
                                  (default: 127.0.0.1; requires --no-daemon).
  ADB_SERVER_PORT                 Direct-mode Android ADB server port
                                  (default: 5037; requires --no-daemon).
  DEBUG                           Diagnostic log namespaces on stderr.
  CODEX_SANDBOX_NETWORK_DISABLED  When set to 1, device commands stop with a
                                  network-permission error.

Examples:
  $ ${context.cliPlaceholder} list-clients
  $ ${context.cliPlaceholder} open <url>
  $ ${context.cliPlaceholder} list-sessions`,
    )
    .hook('preAction', (thisCommand, actionCommand) => {
      applyHostJsonPreference(actionCommand, env);
      if (
        isCommandAction(actionCommand, 'skills')
        || isCommandAction(actionCommand, 'daemon')
        || isOfflineTraceAction(actionCommand)
      ) return;

      if (process.env['CODEX_SANDBOX_NETWORK_DISABLED'] === '1') {
        throw new Error(
          '[CODEX_SANDBOX_NETWORK_DISABLED] Network access is disabled by the Codex sandbox. '
            + 'Lynx DevTool CLI needs local/private network access to discover and talk to devices. '
            + 'Retry with network access and without CODEX_SANDBOX_NETWORK_DISABLED=1.',
        );
      }
      if (thisCommand.opts<{ daemon?: boolean; }>().daemon !== false) {
        const ignored = ['ADB_SERVER_HOST', 'ADB_SERVER_PORT'].filter(name =>
          env[name] !== undefined
        );
        if (ignored.length) {
          process.stderr.write(
            `Warning: ${ignored.join(', ')} ${
              ignored.length === 1 ? 'is' : 'are'
            } ignored in daemon mode. Pass --no-daemon to apply direct transport configuration.\n`,
          );
        }
        context.commandClient = new HttpCommandClient();
        context.transports.push(new DaemonTransport());
      } else {
        const transports = createDirectTransports(env);
        context.transports.push(...transports);
        context.commandClient = new InProcessCommandClient(
          new Connector(transports),
        );
      }
      const names = getTelemetryCommandNames(actionCommand);
      logMonitor(MonitorCode.START_CLI, {
        d1: names.command,
        d2: actionCommand.getOptionValue('client') ?? '',
        d3: actionCommand.getOptionValue('session') ?? '',
        d4: thisCommand.getOptionValue('daemon') !== false
          ? 'daemon'
          : 'no-daemon',
        d5: names.subcommand,
      });
    })
    .hook('postAction', (_thisCommand, actionCommand) => {
      if (
        isCommandAction(actionCommand, 'skills')
        || isCommandAction(actionCommand, 'daemon')
        || isOfflineTraceAction(actionCommand)
      ) return;
      logMonitor(MonitorCode.END_CLI, { m1: Date.now() - start });
    });

  program.commandsGroup('Agent Skills:');
  registerSkillsCommand(program, options.skills);
  program.helpCommand('help [command]', 'display help for command');
  program.commandsGroup('Commands:');
  registerListClientsCommand(program, context);
  registerWaitForClientCommand(program, context);
  registerListSessionsCommand(program, context);
  registerOpenCommand(program, context);
  registerSnapshotCommand(program, context);
  registerScreenshotCommand(program, context);
  registerTapCommand(program, context);
  registerFillCommand(program, context);
  registerScrollCommand(program, context);
  registerWaitCommand(program, context);
  registerGetCommand(program, context);
  registerGetSourceInfoCommand(program, context);
  registerGetConsoleCommand(program, context);
  registerLogsCommand(program, context);
  registerEvaluateCommand(program, context);
  registerInspectCommand(program, context);
  registerGlobalSwitchCommand(program, context);
  registerReactLynxCommand(program, context);
  registerAppCommand(program, context);
  registerCdpCommand(program, context);
  registerGetSourcesCommand(program, context);
  registerTakeScreenshotCommand(program, context);
  registerTakeContentScreenshotCommand(program, context);
  registerTakeHeapSnapshotCommand(program, context);
  registerTraceCommand(program, context);
  const record = program.command('recorder')
    .description(
      'Record Lynx page interactions via TestBench and export replay files',
    );
  registerStartCommand(record, context);
  registerEndCommand(record, context);
  program.commandsGroup('Local Daemon:');
  registerDaemonCommand(program, options.daemonCommand);
  return program;
}
