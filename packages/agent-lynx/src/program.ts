// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command, type ParseOptions } from 'commander';
import {
  cliPlaceholder,
  replaceCliPlaceholderInError,
} from './cli-invocation.ts';
import type { Context } from './commands/utils.ts';
import { type CliTelemetry, withTelemetry } from './telemetry.ts';

class TransportClosingCommand extends Command {
  readonly #context: Context;
  readonly #telemetry: CliTelemetry | undefined;

  constructor(context: Context, telemetry?: CliTelemetry) {
    super();
    this.#context = context;
    this.#telemetry = telemetry;
  }

  override parseAsync(
    argv?: readonly string[],
    parseOptions?: ParseOptions,
  ): Promise<this> {
    return withTelemetry(this.#telemetry, async () => {
      try {
        return await super.parseAsync(argv, parseOptions);
      } catch (error) {
        throw replaceCliPlaceholderInError(
          error,
          cliPlaceholder(this.#context),
        );
      } finally {
        await Promise.allSettled(
          this.#context.transports.map(transport =>
            Promise.resolve().then(() => transport.close())
          ),
        );
      }
    });
  }
}

/** Product entrypoints register their commands and transport defaults on this root. */
export function createRootCommand(
  context: Context,
  telemetry?: CliTelemetry,
): Command {
  return new TransportClosingCommand(context, telemetry);
}

export function getAndroidTransportSpec(
  env: NodeJS.ProcessEnv,
): { host: string; port: number; } | { path: string; } {
  const socket = env['ADB_SERVER_SOCKET'];
  if (socket !== undefined) {
    const prefix = 'localfilesystem:';
    if (!socket.startsWith(prefix) || socket.length === prefix.length) {
      throw new Error('ADB_SERVER_SOCKET must be localfilesystem:<path>.');
    }
    return { path: socket.slice(prefix.length) };
  }
  const portText = env['ADB_SERVER_PORT'] ?? '5037';
  const port = /^\d+$/u.test(portText) ? Number(portText) : Number.NaN;
  return {
    host: env['ADB_SERVER_HOST'] ?? '127.0.0.1',
    port: Number.isInteger(port) && port > 0 && port <= 65535 ? port : 5037,
  };
}

export function isCommandAction(
  command: Command,
  commandName: string,
): boolean {
  let current: Command | null = command;
  while (current) {
    if (current.name() === commandName) return true;
    current = current.parent;
  }
  return false;
}

export function isOfflineTraceAction(command: Command): boolean {
  return command.parent?.name() === 'trace'
    && (command.name() === 'query' || command.name() === 'event-summary');
}

export function getTelemetryCommandNames(
  actionCommand: Command,
): { command: string; subcommand: string; } {
  const names: string[] = [];
  let current: Command | null = actionCommand;
  while (current.parent) {
    names.unshift(current.name());
    current = current.parent;
  }
  return {
    command: names[0] ?? actionCommand.name(),
    subcommand: names.slice(1).join(' '),
  };
}
