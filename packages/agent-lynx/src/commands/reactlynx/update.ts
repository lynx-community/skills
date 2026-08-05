// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  buildReactLynxUpdatePath,
  type ReactLynxComponentData,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runReactLynxCommand } from '../result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  SESSION_OPTION,
} from '../utils.ts';
import { formatInspectResult } from './inspect.ts';

export { buildReactLynxUpdatePath as buildUpdatePath };

export type UpdateKind = 'update-prop' | 'update-state' | 'update-context';

interface UpdateOptions {
  client?: string;
  session?: string;
  showShells?: boolean;
  refresh?: boolean;
  raw?: boolean;
  json?: boolean;
}

type UpdateAction =
  | 'reactlynx-update-prop'
  | 'reactlynx-update-state'
  | 'reactlynx-update-context';

export function parseUpdateValue(
  input: string,
  options: { raw: boolean },
): unknown {
  if (options.raw) return input;
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(
      '<value> must be valid JSON; pass --raw to send the input verbatim as a string. Underlying error: ' +
        (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }
}

export function registerUpdateCommands(
  reactlynx: Command,
  context: Context,
): void {
  registerOneUpdate(reactlynx, context, {
    name: 'update-prop',
    action: 'reactlynx-update-prop',
    description:
      'Set a prop on one ReactLynx component (forceUpdate is called for you)',
  });
  registerOneUpdate(reactlynx, context, {
    name: 'update-state',
    action: 'reactlynx-update-state',
    description:
      'Set a state field on one class component (forceUpdate is called for you)',
  });
  registerOneUpdate(reactlynx, context, {
    name: 'update-context',
    action: 'reactlynx-update-context',
    description: 'Set a context value on one component (best-effort)',
  });
}

function registerOneUpdate(
  reactlynx: Command,
  context: Context,
  spec: { name: UpdateKind; action: UpdateAction; description: string },
): void {
  const command = reactlynx
    .command(spec.name + ' <ref> <path> <value>')
    .description(spec.description)
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--show-shells',
      'Resolve @cN against the cached label view that includes synthetic wrappers',
      false,
    )
    .option(
      '--refresh',
      'Refresh the component tree before resolving @cN',
      false,
    )
    .option(
      '--raw',
      'Send <value> verbatim as a string instead of parsing it as JSON',
      false,
    )
    .option('--json', 'Print the post-update InspectData as JSON', false);

  command.action(
    async (
      ref: string,
      path: string,
      rawValue: string,
      options: UpdateOptions,
    ) => {
      const value = parseUpdateValue(rawValue, { raw: options.raw ?? false });
      await runReactLynxCommand<ReactLynxComponentData>(
        spec.action,
        command,
        options,
        () =>
          getCommandClient(context).execute(spec.action, {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            ref,
            path,
            value,
            showShells: options.showShells ?? false,
            refresh: options.refresh ?? false,
          }),
        (data) => formatInspectResult(data.component, ref),
        (data) => data.component,
      );
    },
  );
}
