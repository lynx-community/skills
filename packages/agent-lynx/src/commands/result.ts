// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type CommandResult,
  fail,
  ok,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import {
  DEFAULT_CLI_PLACEHOLDER,
  replaceCliPlaceholder,
} from '../cli-invocation.ts';

export { fail, ok };

export function renderJson(result: CommandResult): string {
  return JSON.stringify(result, null, 2);
}

function rootCommandName(command: Command): string {
  let root = command;
  while (root.parent) root = root.parent;
  return root.name() || DEFAULT_CLI_PLACEHOLDER;
}

function replaceNextActions(value: unknown, cliPlaceholder: string): unknown {
  if (!Array.isArray(value)) return value;
  return value.map(action =>
    typeof action === 'string'
      ? replaceCliPlaceholder(action, cliPlaceholder)
      : action
  );
}

function replaceSnapshotError(value: unknown, cliPlaceholder: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value;
  }
  const error = value as Record<string, unknown>;
  return {
    ...error,
    ...(typeof error['message'] === 'string'
      ? { message: replaceCliPlaceholder(error['message'], cliPlaceholder) }
      : {}),
    ...(error['nextActions'] === undefined
      ? {}
      : {
        nextActions: replaceNextActions(error['nextActions'], cliPlaceholder),
      }),
  };
}

function replaceCommandResultPlaceholders<T>(
  result: CommandResult<T>,
  cliPlaceholder: string,
): CommandResult<T> {
  if (!result.ok) {
    return {
      ...result,
      error: {
        ...result.error,
        message: replaceCliPlaceholder(result.error.message, cliPlaceholder),
        nextActions: result.error.nextActions.map(action =>
          replaceCliPlaceholder(action, cliPlaceholder)
        ),
      },
    };
  }
  if (
    typeof result.data !== 'object' || result.data === null
    || Array.isArray(result.data)
  ) return result;
  const data = result.data as Record<string, unknown>;
  if (data['snapshotError'] === undefined) return result;
  return {
    ...result,
    data: {
      ...data,
      snapshotError: replaceSnapshotError(
        data['snapshotError'],
        cliPlaceholder,
      ),
    } as T,
  };
}

/** Keep rendering at the CLI edge; ActionCore owns execution and result shape. */
export async function runCommand<T>(
  action: string,
  options: { json?: boolean; },
  handler: () => Promise<CommandResult<T>>,
  renderText: (data: T) => string,
  renderJsonData?: (data: T) => unknown,
  cliPlaceholder = DEFAULT_CLI_PLACEHOLDER,
): Promise<void> {
  let result: CommandResult<T>;
  try {
    result = await handler();
  } catch (error) {
    result = fail(
      action,
      error instanceof Error ? error.message : String(error),
      {
        cause: error,
        recoverable: true,
        nextActions: [
          `${cliPlaceholder} list-clients`,
          `${cliPlaceholder} list-sessions`,
        ],
      },
    );
  }

  result = replaceCommandResultPlaceholders(result, cliPlaceholder);

  if (options.json) {
    console.log(
      result.ok && renderJsonData
        ? JSON.stringify(renderJsonData(result.data), null, 2)
        : renderJson(result),
    );
  } else if (result.ok) {
    console.log(renderText(result.data));
  } else {
    console.error(result.error.message);
    if (result.error.nextActions.length > 0) {
      console.error('\nNext steps:');
      for (const next of result.error.nextActions) console.error(`  - ${next}`);
    }
  }

  if (!result.ok) process.exitCode = 1;
}

function validateDaemonInvocation(
  action: string,
  command: Command,
  noDaemonMessage: string,
): CommandResult<never> | null {
  const options = command.optsWithGlobals<{ daemon?: boolean; }>();
  if (options.daemon === false) {
    return fail(
      action,
      `--no-daemon cannot be used with ${command.name()}. ${noDaemonMessage}`,
      {
        reason: 'unsupported-option',
        recoverable: true,
        nextActions: ['Remove --no-daemon and retry.'],
      },
    );
  }

  return null;
}

/** Render daemon-only option failures through the same text/JSON envelope as ActionCore. */
export async function runSnapshotCommand<T>(
  action: string,
  command: Command,
  options: { json?: boolean; },
  handler: () => Promise<CommandResult<T>>,
  renderText: (data: T) => string,
): Promise<void> {
  await runCommand(
    action,
    options,
    async () =>
      validateDaemonInvocation(
        action,
        command,
        'Snapshot refs are cached by the daemon across CLI invocations.',
      ) ?? await handler(),
    renderText,
    undefined,
    rootCommandName(command),
  );
}

/** Run a ReactLynx ActionCore command while preserving its historical raw JSON success shape. */
export async function runReactLynxCommand<T>(
  action: string,
  command: Command,
  options: { json?: boolean; },
  handler: () => Promise<CommandResult<T>>,
  renderText: (data: T) => string,
  renderJsonData: (data: T) => unknown,
): Promise<void> {
  await runCommand(
    action,
    options,
    async () =>
      validateDaemonInvocation(
        action,
        command,
        'ReactLynx component refs are cached by the daemon across CLI invocations.',
      ) ?? await handler(),
    renderText,
    renderJsonData,
    rootCommandName(command),
  );
}
