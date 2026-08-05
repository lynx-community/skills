// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type CommandData,
  deserializeRendererState,
  formatReactLynxTree,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runReactLynxCommand } from '../result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  SESSION_OPTION,
} from '../utils.ts';

type TreeResult = CommandData<'reactlynx-tree'>;

interface TreeOptions {
  client?: string;
  session?: string;
  depth?: number;
  showShells?: boolean;
  json?: boolean;
}

export function registerTreeCommand(
  reactlynx: Command,
  context: Context,
): void {
  const command = reactlynx
    .command('tree')
    .description(
      'Refresh and print the ReactLynx component tree with daemon-cached @cN labels.',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--depth <n>',
      'Maximum tree depth to print (default: unbounded)',
      (value) => {
        const depth = Number.parseInt(value, 10);
        if (!Number.isFinite(depth) || depth < 1) {
          throw new Error(
            '--depth must be a positive integer (got ' + value + ')',
          );
        }
        return depth;
      },
    )
    .option(
      '--show-shells',
      'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts',
      false,
    )
    .option(
      '--json',
      'Emit a JSON object { labels, roots, nodes } instead of ASCII',
      false,
    );

  command.action(async (options: TreeOptions) => {
    await runReactLynxCommand<TreeResult>(
      'reactlynx-tree',
      command,
      options,
      () =>
        getCommandClient(context).execute('reactlynx-tree', {
          ...(options.client ? { clientId: options.client } : {}),
          ...(options.session ? { sessionId: Number(options.session) } : {}),
          ...(options.depth === undefined ? {} : { depth: options.depth }),
          showShells: options.showShells ?? false,
        }),
      (data) =>
        formatReactLynxTree(
          deserializeRendererState({ roots: data.roots, nodes: data.nodes }),
          {
            ...(options.depth === undefined ? {} : { maxDepth: options.depth }),
            hideShells: !options.showShells,
          },
        ).text,
      (data) => ({
        labels: data.labels,
        roots: data.roots,
        nodes: data.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.name,
          key: node.key,
          parent: node.parent,
          children: node.children,
        })),
      }),
    );
  });
}
