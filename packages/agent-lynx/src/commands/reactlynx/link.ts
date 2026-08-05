// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { type CommandData, typeTag } from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runSnapshotCommand } from '../result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
} from '../utils.ts';

const ACTION = 'reactlynx-link';
type LinkResult = CommandData<typeof ACTION>;

interface LinkOptions {
  client?: string;
  session?: string;
  json?: boolean;
  showShells?: boolean;
  refresh?: boolean;
}

export function renderLink(data: LinkResult): string {
  const elementText = data.element.text
    ? ` ${JSON.stringify(data.element.text)}`
    : '';
  const element = `${data.element.ref} [${data.element.tag}]${elementText}`;
  const componentLabel = data.component.ref ?? '(unlabelled component)';
  const component =
    `${componentLabel} [${typeTag(data.component.type)}] ${data.component.name} ` +
    `(id=${data.component.id})`;
  return data.direction === 'element-to-component'
    ? `${element} -> ${component}`
    : `${component} -> ${element}`;
}

export function registerLinkCommand(
  reactlynx: Command,
  context: Context,
): void {
  const command = reactlynx
    .command('link <ref>')
    .description(
      'Link one DOM Snapshot @eN ref with its ReactLynx @cN component, in either direction.',
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
      'Refresh the component tree before resolving the relationship',
      false,
    )
    .option(...JSON_OPTION);

  command.action(async (ref: string, options: LinkOptions) => {
    await runSnapshotCommand<LinkResult>(
      ACTION,
      command,
      options,
      () =>
        getCommandClient(context).execute(ACTION, {
          ...(options.client ? { clientId: options.client } : {}),
          ...(options.session ? { sessionId: Number(options.session) } : {}),
          ref,
          showShells: options.showShells ?? false,
          refresh: options.refresh ?? false,
        }),
      renderLink,
    );
  });
}
