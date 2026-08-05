// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  buildRegexMatcher,
  buildSubstringMatcher,
  type CommandData,
  findReactLynxComponents,
  type ReactLynxFindMatch,
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

export {
  buildRegexMatcher,
  buildSubstringMatcher,
  findReactLynxComponents as findComponents,
};
export type FindMatch = ReactLynxFindMatch;

type FindResult = CommandData<'reactlynx-find'>;

interface FindOptions {
  client?: string;
  session?: string;
  regex?: boolean;
  showShells?: boolean;
  refresh?: boolean;
  json?: boolean;
  limit?: number;
}

export function registerFindCommand(
  reactlynx: Command,
  context: Context,
): void {
  const command = reactlynx
    .command('find <pattern>')
    .description(
      'Find components by display name in the daemon-cached tree. ' +
        'Use --regex for a JavaScript regular expression.',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--regex',
      'Treat <pattern> as a JavaScript regular expression',
      false,
    )
    .option(
      '--show-shells',
      'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts',
      false,
    )
    .option('--refresh', 'Refresh the component tree before searching', false)
    .option(
      '--limit <n>',
      'Maximum number of matches to print (default: 50)',
      (value) => {
        const limit = Number.parseInt(value, 10);
        if (!Number.isFinite(limit) || limit < 1) {
          throw new Error(
            '--limit must be a positive integer (got ' + value + ')',
          );
        }
        return limit;
      },
      50,
    )
    .option(
      '--json',
      'Emit a JSON array [{ label, id, name, type, key, ancestors: [{label, name}] }]',
      false,
    );

  command.action(async (pattern: string, options: FindOptions) => {
    await runReactLynxCommand<FindResult>(
      'reactlynx-find',
      command,
      options,
      () =>
        getCommandClient(context).execute('reactlynx-find', {
          ...(options.client ? { clientId: options.client } : {}),
          ...(options.session ? { sessionId: Number(options.session) } : {}),
          pattern,
          regex: options.regex ?? false,
          showShells: options.showShells ?? false,
          limit: options.limit ?? 50,
          refresh: options.refresh ?? false,
        }),
      (data) => formatMatches(data.matches),
      (data) => data.matches,
    );
  });
}

export function formatMatches(matches: ReactLynxFindMatch[]): string {
  const lines: string[] = [];
  for (const match of matches) {
    let header = match.label + ' [' + typeTag(match.type) + '] ' + match.name;
    if (match.key) header += ' key=' + match.key;
    lines.push(header);
    if (match.ancestors.length > 0) {
      lines.push(
        '  in ' +
          match.ancestors
            .map((ancestor) => ancestor.label + ' ' + ancestor.name)
            .join(' > '),
      );
    }
  }
  return lines.join('\n');
}
