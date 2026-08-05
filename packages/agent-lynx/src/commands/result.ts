// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type CommandResult,
  fail,
  ok,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';

export { fail, ok };

export function renderJson(result: CommandResult): string {
  return JSON.stringify(result, null, 2);
}

/** Keep rendering at the CLI edge; ActionCore owns execution and result shape. */
export async function runCommand<T>(
  action: string,
  options: { json?: boolean },
  handler: () => Promise<CommandResult<T>>,
  renderText: (data: T) => string,
  renderJsonData?: (data: T) => unknown,
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
        nextActions: ['agent-lynx list-clients', 'agent-lynx list-sessions'],
      },
    );
  }

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
  const options = command.optsWithGlobals<{ daemon?: boolean }>();
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
  options: { json?: boolean },
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
      ) ?? (await handler()),
    renderText,
  );
}

/** Run a ReactLynx ActionCore command while preserving its historical raw JSON success shape. */
export async function runReactLynxCommand<T>(
  action: string,
  command: Command,
  options: { json?: boolean },
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
      ) ?? (await handler()),
    renderText,
    renderJsonData,
  );
}
