// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  DEFAULT_DOCS_TIMEOUT_SECONDS,
  DEFAULT_MIRROR_HOSTS,
  type DocResourceItem,
  DOCS_URI_PREFIX,
  type DocsFetch,
  type ExtractedMarkdownLink,
  extractMarkdownLinks,
  getDoc as getCoreDoc,
  type GetDocOptions,
  type GetDocResult,
  listDocs,
  type ListDocsOptions,
  type ListDocsResult,
  normalizeDocsBaseUrl,
  PUBLIC_DOCS_BASE_URL,
} from '@lynx-js/docs-mcp-server/_internal/docs';
import { type Command, InvalidArgumentError } from 'commander';
import { replaceCliPlaceholder } from '../cli-invocation.ts';

export {
  type DocResourceItem,
  DOCS_URI_PREFIX,
  type DocsFetch,
  type ExtractedMarkdownLink,
  extractMarkdownLinks,
  type GetDocOptions,
  type GetDocResult,
  listDocs,
  type ListDocsOptions,
  type ListDocsResult,
  normalizeDocsBaseUrl,
  PUBLIC_DOCS_BASE_URL,
};

const DEFAULT_CLI_DOC_HINT =
  "Run 'agent-lynx docs get llms.txt' for the documentation entrypoint or 'agent-lynx docs list --filter <keyword>' to locate exact mirrored paths.";

export async function getDoc(
  target: string,
  options: GetDocOptions = {},
): Promise<GetDocResult> {
  return await getCoreDoc(target, {
    hint: DEFAULT_CLI_DOC_HINT,
    ...options,
  });
}

export interface RegisterDocsCommandOptions {
  afterHelp?: string;
  defaultBaseUrl?: string;
  description?: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: DocsFetch;
  getDescription?: string;
  listDescription?: string;
  mirrorHosts?: readonly string[];
  targetArgumentDescription?: string;
  writeOut?: (value: string) => void;
}

interface DocsListCommandOptions {
  baseUrl: string;
  filter?: string;
  json: boolean;
  limit?: number;
  nested: boolean;
  prefix?: string;
  timeout: number;
}

interface DocsGetCommandOptions {
  baseUrl: string;
  json: boolean;
  output?: string;
  timeout: number;
}

function parseTimeoutSeconds(value: string): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new InvalidArgumentError(
      'Invalid --timeout value: ' + value
        + '. Use a positive number of seconds.',
    );
  }
  return seconds;
}

function parsePositiveInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(
      'Invalid --limit value: ' + value + '. Use a positive integer.',
    );
  }
  return parsed;
}

function renderDocsListText(result: ListDocsResult): string {
  const header = 'Mirrored Lynx documentation from '
    + result.baseUrl
    + ' (showing '
    + String(result.count)
    + ' of '
    + String(result.total)
    + '):';
  if (result.items.length === 0) {
    return header + '\nNo matching documentation pages found.\n';
  }
  const lines = result.items.map(item => {
    if (!item.description) return '  ' + item.path + '  ' + item.title;
    const collapsed = item.description.replace(/\s+/gu, ' ').trim();
    const codePoints = Array.from(collapsed);
    const preview = codePoints.length > 160
      ? codePoints.slice(0, 159).join('').trimEnd() + '…'
      : collapsed;
    return '  ' + item.path + '  ' + item.title + ' — ' + preview;
  });
  return header + '\n' + lines.join('\n') + '\n';
}

const DEFAULT_PUBLIC_AFTER_HELP = [
  '',
  'Positioning:',
  "  'agent-lynx docs' is a strict mirror of https://lynxjs.org (guides,",
  '  mental-model entrypoints, and API references), suited for directly looking up',
  '  and reading canonical Lynx documentation.',
  '',
  'Examples:',
  '  $ agent-lynx docs get llms.txt',
  '  $ agent-lynx docs list --prefix guide/',
  '  $ agent-lynx docs list --filter scroll-view',
  '  $ agent-lynx docs get guide/ui/elements-components.md',
  '  $ agent-lynx docs get https://lynxjs.org/next/react/introduction.html',
  '',
].join('\n');

export function registerDocsCommand(
  program: Command,
  options: RegisterDocsCommandOptions = {},
): void {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const writeOut = options.writeOut ?? (value => process.stdout.write(value));
  const mirrorHosts = options.mirrorHosts ?? DEFAULT_MIRROR_HOSTS;
  const defaultBaseUrl = env['LYNX_DOCS_BASE_URL']?.trim()
    || options.defaultBaseUrl
    || PUBLIC_DOCS_BASE_URL;
  const afterHelp = options.afterHelp ?? DEFAULT_PUBLIC_AFTER_HELP;

  const docs = program
    .command('docs')
    .description(
      options.description
        ?? 'Browse and read official Lynx documentation strictly mirrored from lynxjs.org',
    )
    .addHelpText(
      'after',
      () => replaceCliPlaceholder(afterHelp, program.name() || 'agent-lynx'),
    );

  docs
    .command('list')
    .description(
      options.listDescription
        ?? 'List mirrored documentation pages indexed by llms.txt on lynxjs.org',
    )
    .option(
      '--base-url <url>',
      'Lynx docs mirror base URL (default: $LYNX_DOCS_BASE_URL)',
      defaultBaseUrl,
    )
    .option(
      '--prefix <prefix>',
      'Restrict to doc paths starting with a prefix (e.g. guide/, react/, api/)',
    )
    .option(
      '--filter <keyword>',
      'Case-insensitive substring filter on path, title, or summary',
    )
    .option(
      '--no-nested',
      'Only read root llms.txt without crawling nested indexes such as api/llms.txt',
    )
    .option(
      '--limit <count>',
      'Maximum number of entries to return',
      parsePositiveInt,
    )
    .option(
      '--timeout <seconds>',
      'HTTP request timeout in seconds',
      parseTimeoutSeconds,
      DEFAULT_DOCS_TIMEOUT_SECONDS,
    )
    .option('-j, --json', 'Output machine-readable JSON', false)
    .action(
      async (commandOptions: DocsListCommandOptions, command: Command) => {
        const result = await listDocs({
          baseUrl: commandOptions.baseUrl,
          fetchImpl,
          mirrorHosts,
          nested: commandOptions.nested,
          timeoutMs: commandOptions.timeout * 1_000,
          ...(commandOptions.prefix === undefined
            ? {}
            : { prefix: commandOptions.prefix }),
          ...(commandOptions.filter === undefined
            ? {}
            : { filter: commandOptions.filter }),
          ...(commandOptions.limit === undefined
            ? {}
            : { limit: commandOptions.limit }),
        });
        const json = command.opts<DocsListCommandOptions>().json;
        if (json) {
          writeOut(JSON.stringify(result, null, 2) + '\n');
        } else {
          writeOut(renderDocsListText(result));
        }
      },
    );

  docs
    .command('get')
    .alias('read')
    .description(
      options.getDescription
        ?? 'Read a Markdown document or llms.txt index mirrored from lynxjs.org',
    )
    .argument(
      '<path-or-url>',
      options.targetArgumentDescription
        ?? 'Doc path (e.g. llms.txt, guide/ui/styling.md), lynx-docs:// URI, or lynxjs.org URL',
    )
    .option(
      '--base-url <url>',
      'Lynx docs mirror base URL (default: $LYNX_DOCS_BASE_URL)',
      defaultBaseUrl,
    )
    .option(
      '-o, --output <path>',
      'Write the fetched Markdown document to a local file',
    )
    .option(
      '--timeout <seconds>',
      'HTTP request timeout in seconds',
      parseTimeoutSeconds,
      DEFAULT_DOCS_TIMEOUT_SECONDS,
    )
    .option('-j, --json', 'Output machine-readable JSON', false)
    .action(
      async (
        target: string,
        commandOptions: DocsGetCommandOptions,
        command: Command,
      ) => {
        const explicitBaseUrl =
          command.getOptionValueSource('baseUrl') === 'cli';
        const result = await getDoc(target, {
          baseUrl: commandOptions.baseUrl,
          explicitBaseUrl,
          fetchImpl,
          mirrorHosts,
          timeoutMs: commandOptions.timeout * 1_000,
          ...(commandOptions.output === undefined
            ? {}
            : { outputPath: commandOptions.output }),
        });
        const json = command.opts<DocsGetCommandOptions>().json;
        if (json) {
          writeOut(JSON.stringify(result, null, 2) + '\n');
        } else if (result.outputPath !== undefined) {
          writeOut(
            'Saved '
              + result.uri
              + ' ('
              + result.url
              + ') to '
              + result.outputPath
              + '\n',
          );
        } else {
          writeOut(
            result.content.endsWith('\n')
              ? result.content
              : result.content + '\n',
          );
        }
      },
    );
}
