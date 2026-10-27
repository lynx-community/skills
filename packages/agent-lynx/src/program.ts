// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { AdbServerNodeJsTcpConnector } from '@yume-chan/adb-server-node-tcp';
import { Command, type ParseOptions } from 'commander';
import type { SocketConnectOpts } from 'node:net';
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
): SocketConnectOpts {
  const socket = env['ADB_SERVER_SOCKET'];
  if (socket !== undefined) {
    if (!socket.trim()) throw new Error('ADB_SERVER_SOCKET must not be empty.');
    return new AdbServerNodeJsTcpConnector(socket).spec;
  }
  const nativePort = env['ANDROID_ADB_SERVER_PORT'];
  const portText = (nativePort ?? env['ADB_SERVER_PORT']) || '5037';
  const port = /^\d+$/u.test(portText) ? Number(portText) : Number.NaN;
  const validPort = Number.isInteger(port) && port > 0 && port <= 65535;
  if (nativePort !== undefined && !validPort) {
    throw new Error(
      `Invalid ANDROID_ADB_SERVER_PORT: ${nativePort}. Use an integer from 1 to 65535.`,
    );
  }
  return {
    host: env['ANDROID_ADB_SERVER_ADDRESS'] ?? env['ADB_SERVER_HOST']
      ?? '127.0.0.1',
    port: validPort ? port : 5037,
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
