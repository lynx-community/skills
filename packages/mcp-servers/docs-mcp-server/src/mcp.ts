// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readFile } from 'node:fs/promises';
import { findPackageJSON } from 'node:module';

import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  ErrorCode,
  McpError,
  type ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';

import {
  crawlDocs,
  type CrawledDocResource,
  DEFAULT_DOCS_TIMEOUT_MS,
  DEFAULT_MIRROR_HOSTS,
  type DocsFetch,
  fetchCrawledDocText,
  PUBLIC_DOCS_BASE_URL,
  ROOT_DOC_PATH,
  ROOT_DOC_URI,
} from './docs.ts';

export const MCP_SERVER_NAME = 'lynx-docs';
const API_INDEX_PATH = 'api/llms.txt';
const MAX_MCP_RESOURCE_DESCRIPTION_CHARS = 200;

export type ResourceTextReader = (
  uri: string,
  getText: () => string | Promise<string>,
) => string | Promise<string>;

export interface CreateDocsMcpServerOptions {
  baseUrl?: string;
  fetchImpl?: DocsFetch;
  mirrorHosts?: readonly string[];
  readResourceText?: ResourceTextReader;
  timeoutMs?: number;
  version: string;
}

export interface StartDocsMcpServerOptions extends CreateDocsMcpServerOptions {
  onServerStarted?: () => void | Promise<void>;
  transport?: Transport;
}

export interface RunDocsMcpCliOptions {
  argv?: readonly string[];
  defaultBaseUrl?: string;
  fetchImpl?: DocsFetch;
  importMetaUrl: string;
  mirrorHosts?: readonly string[];
  onServerStarted?: () => void | Promise<void>;
  readResourceText?: ResourceTextReader;
  timeoutMs?: number;
}

interface DocsPackageMetadata {
  description: string;
  name: string;
  version: string;
}

function registerCodexCompatibilityHandlers(mcpServer: McpServer): void {
  // Codex expects tool discovery to exist during startup. Register one disabled
  // placeholder so the SDK exposes tools/list while keeping the catalog empty.
  const dummyTool = mcpServer.registerTool(
    'dummyTool',
    {
      description: 'Internal compatibility shim for Codex MCP startup.',
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: 'This compatibility shim should never be called.',
        },
      ],
    }),
  );

  dummyTool.disable();
}

export function buildDocsMcpInstructions(
  serverName = MCP_SERVER_NAME,
  rootUri = ROOT_DOC_URI,
): string {
  // NOTE: This instruction for now is not supported by Codex's MCP support,
  // see https://github.com/openai/codex/issues/6148
  return [
    '<user_instructions>',
    'For any questions or requirements regarding Lynx:',
    '',
    '1. Use the "List Resources Tool" to list all Resources provided in MCP "'
    + serverName + '".',
    '2. First read MCP Resources "' + rootUri
    + '" (**REQUIRED**), this document is an ENTRYPOINT of all Lynx Docs.',
    '3. After reading "' + rootUri
    + '", use the "Read MCP Resources Tool" to retrieve docs you need based on the user\'s questions or requirements, please read them proactively.',
    '4. API pages are omitted from resources/list. Read "lynx-docs://api/llms.txt" to find them, then use resources/read with "lynx-docs://<path relative to the documentation base URL>" (for example "lynx-docs://api/elements/built-in/view.md").',
    '5. If available, prioritize obtaining Lynx-related information through MCP Resources tools over external web searches.',
    '',
    '</user_instructions>',
    '',
  ].join('\n');
}

const defaultReadResourceText: ResourceTextReader = async (_uri, getText) =>
  await getText();

function formatMcpResourceDescription(
  description: string | undefined,
  fallbackTitle: string,
): string {
  const raw = description ?? fallbackTitle;
  const codePoints = Array.from(raw);
  if (codePoints.length <= MAX_MCP_RESOURCE_DESCRIPTION_CHARS) return raw;
  return (
    codePoints
      .slice(0, MAX_MCP_RESOURCE_DESCRIPTION_CHARS - 1)
      .join('')
      .trimEnd() + '…'
  );
}

function getUnlistedApiResources(
  items: CrawledDocResource[],
): Map<string, CrawledDocResource> {
  const children = new Map<string, CrawledDocResource[]>();
  for (const item of items) {
    for (const index of item.sourceIndexes) {
      const entries = children.get(index) ?? [];
      entries.push(item);
      children.set(index, entries);
    }
  }

  // Follow index membership, not the api/ prefix: the API index also covers
  // other paths, and a page may already have been linked by the root index.
  const unlisted = new Map<string, CrawledDocResource>();
  const pending = [API_INDEX_PATH];
  const visited = new Set<string>([ROOT_DOC_PATH]);
  for (const index of pending) {
    if (visited.has(index)) continue;
    visited.add(index);
    for (const item of children.get(index) ?? []) {
      if (item.path === ROOT_DOC_PATH || item.path === API_INDEX_PATH) continue;
      unlisted.set(item.uri, item);
      if (children.has(item.path)) pending.push(item.path);
    }
  }
  return unlisted;
}

export async function createDocsMcpServer(
  options: CreateDocsMcpServerOptions,
): Promise<McpServer> {
  const {
    baseUrl = PUBLIC_DOCS_BASE_URL,
    fetchImpl = fetch,
    mirrorHosts = DEFAULT_MIRROR_HOSTS,
    readResourceText = defaultReadResourceText,
    timeoutMs = DEFAULT_DOCS_TIMEOUT_MS,
    version,
  } = options;

  const crawled = await crawlDocs({
    baseUrl,
    fetchImpl,
    mirrorHosts,
    nested: true,
    timeoutMs,
  });

  const mcpServer = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version,
    },
    {
      instructions: buildDocsMcpInstructions(),
    },
  );

  const readItem = async (
    item: CrawledDocResource,
  ): Promise<ReadResourceResult> => {
    const text = await readResourceText(
      item.uri,
      () =>
        item.cachedContent
          ?? fetchCrawledDocText(item.url, { fetchImpl, timeoutMs }),
    );
    return { contents: [{ uri: item.uri, text, mimeType: 'text/markdown' }] };
  };

  const unlisted = getUnlistedApiResources(crawled.items);
  for (const item of crawled.items) {
    if (unlisted.has(item.uri)) continue;
    mcpServer.registerResource(
      item.title,
      item.uri,
      {
        title: item.title,
        description: formatMcpResourceDescription(item.description, item.title),
        mimeType: 'text/markdown',
      },
      () => readItem(item),
    );
  }

  if (unlisted.size > 0) {
    mcpServer.registerResource(
      'lynx-api-documentation',
      new ResourceTemplate('lynx-docs://{+path}', { list: undefined }),
      {
        title: 'API documentation indexed by api/llms.txt',
        description:
          'Read lynx-docs://api/llms.txt for document paths omitted from resources/list.',
        mimeType: 'text/markdown',
      },
      async uri => {
        // A template makes indexed pages readable without enumerating them.
        // Never fetch arbitrary URLs or paths supplied by the client.
        const item = unlisted.get(uri.href);
        if (!item) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Resource ${uri.href} not found`,
          );
        }
        return await readItem(item);
      },
    );
  }

  registerCodexCompatibilityHandlers(mcpServer);
  return mcpServer;
}

export async function startDocsMcpServer(
  options: StartDocsMcpServerOptions,
): Promise<McpServer> {
  const { onServerStarted, transport, ...serverOptions } = options;
  const mcpServer = await createDocsMcpServer(serverOptions);
  await mcpServer.connect(transport ?? new StdioServerTransport());
  await onServerStarted?.();
  return mcpServer;
}

async function loadDocsPackageMetadata(
  importMetaUrl: string,
): Promise<DocsPackageMetadata> {
  const pkgPath = findPackageJSON(importMetaUrl);
  if (!pkgPath) {
    throw new Error('Failed to locate package.json from ' + importMetaUrl);
  }
  return JSON.parse(await readFile(pkgPath, 'utf-8')) as DocsPackageMetadata;
}

export async function runDocsMcpCli(
  options: RunDocsMcpCliOptions,
): Promise<void> {
  const pkg = await loadDocsPackageMetadata(options.importMetaUrl);
  const defaultBaseUrl = options.defaultBaseUrl ?? (PUBLIC_DOCS_BASE_URL + '/');
  const program = new Command();

  const afterHelp = [
    '',
    'Usage as a MCP Server:',
    '  {',
    '    "mcpServers": {',
    '      "' + MCP_SERVER_NAME + '": {',
    '        "command": "npx",',
    '        "args": ["-y", "' + pkg.name + '"]',
    '      }',
    '    }',
    '  }',
    '',
  ].join('\n');

  program
    .name('npx -y ' + pkg.name)
    .description(pkg.description)
    .option(
      '--base-url <url>',
      'Base URL for fetching Lynx docs. Set if you want versioned docs.',
      defaultBaseUrl,
    )
    .version(pkg.version)
    .addHelpText('after', afterHelp)
    .action(async (cliOptions: { baseUrl: string; }) => {
      await startDocsMcpServer({
        baseUrl: cliOptions.baseUrl.replace(/\/+$/u, ''),
        version: pkg.version,
        ...(options.fetchImpl === undefined
          ? {}
          : { fetchImpl: options.fetchImpl }),
        ...(options.mirrorHosts === undefined
          ? {}
          : { mirrorHosts: options.mirrorHosts }),
        ...(options.readResourceText === undefined
          ? {}
          : { readResourceText: options.readResourceText }),
        ...(options.onServerStarted === undefined
          ? {}
          : { onServerStarted: options.onServerStarted }),
        ...(options.timeoutMs === undefined
          ? {}
          : { timeoutMs: options.timeoutMs }),
      });
    });

  await program.parseAsync([...(options.argv ?? process.argv)]);
}
