// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type CommandData,
  parseReactLynxComponentRef,
  type ReactLynxInspectResult,
  typeTag,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runReactLynxCommand } from '../result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  SESSION_OPTION,
} from '../utils.ts';

export { parseReactLynxComponentRef as parseComponentRef };
export type InspectResult = ReactLynxInspectResult;

type ComponentResult = CommandData<'reactlynx-component'>;

interface ComponentOptions {
  client?: string;
  session?: string;
  json?: boolean;
  showShells?: boolean;
  refresh?: boolean;
}

export function formatInspectResult(
  data: ReactLynxInspectResult,
  ref: string,
): string {
  const lines: string[] = [];
  const headerKey = data.key ? ' key=' + data.key : '';
  lines.push(
    ref +
      ' (id=' +
      data.id +
      ') [' +
      typeTag(data.type) +
      '] ' +
      data.name +
      headerKey,
  );
  if (data.__source) {
    lines.push(
      '  source: ' +
        data.__source.fileName +
        ':' +
        data.__source.lineNumber +
        ':' +
        data.__source.columnNumber,
    );
  }
  if (data.suspended) lines.push('  suspended: true');

  appendSection(lines, 'props', data.props);
  appendSection(lines, 'state', data.state);
  appendSection(lines, 'hooks', data.hooks);
  appendSection(lines, 'context', data.context);
  appendSection(lines, 'signals', data.signals);
  return lines.join('\n');
}

function appendSection(lines: string[], label: string, value: unknown): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value) && value.length === 0) return;
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  )
    return;
  lines.push('  ' + label + ':');
  lines.push(
    JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n'),
  );
}

export function registerComponentCommand(
  reactlynx: Command,
  context: Context,
): void {
  const command = reactlynx
    .command('component <ref>')
    .description(
      'Inspect props/state/hooks/context for @cN from the daemon-cached tree or a numeric vnode id.',
    )
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
    .option('--json', 'Print the raw InspectData payload as JSON', false);

  command.action(async (ref: string, options: ComponentOptions) => {
    await runReactLynxCommand<ComponentResult>(
      'reactlynx-component',
      command,
      options,
      () =>
        getCommandClient(context).execute('reactlynx-component', {
          ...(options.client ? { clientId: options.client } : {}),
          ...(options.session ? { sessionId: Number(options.session) } : {}),
          ref,
          showShells: options.showShells ?? false,
          refresh: options.refresh ?? false,
        }),
      (data) => formatInspectResult(data.component, ref),
      (data) => data.component,
    );
  });
}
