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

const DAEMON_ONLY_LEAF_COMMANDS = new Set([
  'snapshot',
  'screenshot',
  'tap',
  'long-press',
  'fill',
  'clear',
  'scroll',
  'wait',
]);

export function isDaemonOnlyAction(command: Command): boolean {
  if (DAEMON_ONLY_LEAF_COMMANDS.has(command.name())) return true;
  if (
    isCommandAction(command, 'get') || isCommandAction(command, 'reactlynx')
  ) {
    return true;
  }
  if (command.name() === 'get-source-info') {
    const target = command.processedArgs[0] ?? command.args[0];
    return typeof target === 'string' && target.trim().startsWith('@');
  }
  return false;
}

export function handleCliError(
  error: unknown,
  env: NodeJS.ProcessEnv = process.env,
  stderr: { write(chunk: string): unknown; } = process.stderr,
): void {
  if (
    typeof error === 'object'
    && error !== null
    && 'exitCode' in error
    && typeof (error as { exitCode?: unknown; }).exitCode === 'number'
  ) {
    const exitCode = (error as { exitCode: number; }).exitCode;
    if (exitCode === 0) return;
    process.exitCode = exitCode;
  } else if (!process.exitCode || process.exitCode === 0) {
    process.exitCode = 1;
  }

  if (env['DEBUG']?.trim()) {
    const detail = error instanceof Error
      ? (error.stack ?? `${error.name}: ${error.message}`)
      : String(error);
    stderr.write(`${detail}\n`);
    return;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const formatted = rawMessage.startsWith('Error:')
    ? rawMessage
    : `Error: ${rawMessage}`;
  stderr.write(`${formatted}\n`);
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
