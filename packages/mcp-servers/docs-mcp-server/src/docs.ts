// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  Link,
  ListItem,
  Node,
  Paragraph,
  PhrasingContent,
  Root,
} from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createDebug } from 'obug';

const debug = createDebug('lynx-docs-mcp');

export const PUBLIC_DOCS_BASE_URL = 'https://lynxjs.org/next';
export const DOCS_URI_PREFIX = 'lynx-docs://';
export const ROOT_DOC_PATH = 'llms.txt';
export const ROOT_DOC_URI = 'lynx-docs://llms.txt';
export const ROOT_DOC_TITLE = 'Read This Before Building with Lynx';
export const ROOT_DOC_DESCRIPTION =
  'Before building with Lynx, be sure to read this document to understand important information and best practices.';
export const DEFAULT_DOCS_TIMEOUT_SECONDS = 30;
export const DEFAULT_DOCS_TIMEOUT_MS = DEFAULT_DOCS_TIMEOUT_SECONDS * 1_000;
export const DEFAULT_MIRROR_HOSTS: readonly string[] = ['lynxjs.org'];

const SKIPPED_ASSET_EXTENSIONS = new Set([
  '.apk',
  '.gif',
  '.hap',
  '.ico',
  '.ipa',
  '.jpeg',
  '.jpg',
  '.mp4',
  '.pdf',
  '.png',
  '.svg',
  '.tgz',
  '.webm',
  '.webp',
  '.zip',
]);

export type DocsFetch = (url: URL, init: RequestInit) => Promise<Response>;

export interface DocResourceItem {
  uri: string;
  path: string;
  title: string;
  description?: string;
  url: string;
}

export interface CrawledDocResource extends DocResourceItem {
  cachedContent?: string;
  /** Direct index referrers, including links to already discovered resources. */
  sourceIndexes: string[];
}

export interface ExtractedMarkdownLink {
  summary?: string;
  title: string;
  url: string;
}

export interface CrawlDocsOptions {
  baseUrl?: string;
  fetchImpl?: DocsFetch;
  mirrorHosts?: readonly string[];
  nested?: boolean;
  timeoutMs?: number;
}

export interface CrawlDocsResult {
  baseUrl: string;
  items: CrawledDocResource[];
}

export interface ListDocsOptions extends CrawlDocsOptions {
  filter?: string;
  limit?: number;
  prefix?: string;
}

export interface ListDocsResult {
  baseUrl: string;
  total: number;
  count: number;
  items: DocResourceItem[];
}

export interface GetDocOptions {
  baseUrl?: string;
  explicitBaseUrl?: boolean;
  fetchImpl?: DocsFetch;
  hint?: string;
  mirrorHosts?: readonly string[];
  outputPath?: string;
  timeoutMs?: number;
}

export interface GetDocResult {
  uri: string;
  path: string;
  url: string;
  contentType: string;
  content: string;
  outputPath?: string;
}

export function normalizeDocsBaseUrl(baseUrl: string): URL {
  const trimmed = baseUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid Lynx docs base URL: ' + baseUrl);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Lynx docs base URL must use HTTP or HTTPS: ' + baseUrl);
  }
  parsed.search = '';
  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/u, '') || '/';
  return parsed;
}

export function formatDocsBaseUrl(url: URL): string {
  const serialized = url.toString();
  return url.pathname === '/' ? serialized.replace(/\/+$/u, '') : serialized;
}

function isHtmlFallbackResponse(response: Response, body: string): boolean {
  const contentType = (response.headers.get('content-type') ?? '')
    .toLowerCase();
  if (contentType.includes('text/html')) return true;
  return /^\s*<!doctype\s+html\b/iu.test(body);
}

export async function fetchDocsResourceText(
  url: URL,
  options: {
    fetchImpl?: DocsFetch;
    timeoutMs?: number;
  } = {},
): Promise<{ contentType: string; text: string; }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_DOCS_TIMEOUT_MS;
  const response = await fetchImpl(url, {
    headers: { Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      (
        'Failed to fetch resource '
        + url.toString()
        + ': '
        + String(response.status)
        + ' '
        + response.statusText
      ).trim(),
    );
  }
  if (isHtmlFallbackResponse(response, text)) {
    throw new Error(
      'Document not found on Lynx docs mirror ('
        + url.toString()
        + ' returned HTML fallback instead of Markdown/text).',
    );
  }
  const rawContentType = response.headers.get('content-type')
    ?? 'text/markdown';
  const contentType = rawContentType.split(';')[0]?.trim() || 'text/markdown';
  return { contentType, text };
}

export async function fetchCrawledDocText(
  rawUrl: string,
  options: {
    fetchImpl?: DocsFetch;
    timeoutMs?: number;
  } = {},
): Promise<string> {
  const targetUrl = new URL(rawUrl);
  const lowerPath = targetUrl.pathname.toLowerCase();
  if (lowerPath.endsWith('.md') || lowerPath.endsWith('.txt')) {
    const fetched = await fetchDocsResourceText(targetUrl, options);
    return fetched.text;
  }

  const candidateUrls: URL[] = [];
  const pushCandidate = (pathname: string): void => {
    const candidate = new URL(targetUrl.toString());
    candidate.pathname = pathname;
    if (
      !candidateUrls.some(existing =>
        existing.toString() === candidate.toString()
      )
    ) {
      candidateUrls.push(candidate);
    }
  };

  const trimmedPathname = targetUrl.pathname.replace(/\/+$/u, '');
  if (lowerPath.endsWith('.html')) {
    const stem = trimmedPathname.slice(0, -'.html'.length);
    pushCandidate(stem + '.md');
    pushCandidate(stem + '/index.md');
  } else {
    pushCandidate(targetUrl.pathname);
    if (trimmedPathname) {
      pushCandidate(trimmedPathname + '.md');
      pushCandidate(trimmedPathname + '/index.md');
    }
  }

  let firstError: unknown;
  for (const candidateUrl of candidateUrls) {
    try {
      const fetched = await fetchDocsResourceText(candidateUrl, options);
      return fetched.text;
    } catch (error) {
      if (firstError === undefined) firstError = error;
    }
  }
  throw firstError instanceof Error
    ? firstError
    : new Error(String(firstError));
}

function renderLinkTitle(link: Link): string {
  // Convert the link's phrasing children back to Markdown so nested inline
  // formatting (e.g. [**Getting started**](...)) is preserved accurately.
  const root: Root = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: link.children,
      },
    ],
  };
  return toMarkdown(root).trim();
}

function extractListItemSummary(
  paragraph: Paragraph,
  link: Link,
): string | undefined {
  if (paragraph.children[0] !== link || paragraph.children.length < 2) {
    return undefined;
  }
  const linkEndLine = link.position?.end.line;
  const second = paragraph.children[1];
  if (!second || second.type !== 'text') {
    return undefined;
  }
  if (
    linkEndLine !== undefined
    && second.position !== undefined
    && second.position.start.line > linkEndLine
  ) {
    return undefined;
  }
  const colonMatch = /^\s*:\s*([^\r\n]*)/u.exec(second.value);
  if (!colonMatch) {
    return undefined;
  }
  const strippedFirst = colonMatch[1] ?? '';
  const secondHasNewline = /[\r\n]/u.test(second.value);
  const remainingChildren: PhrasingContent[] = [
    ...(strippedFirst ? [{ type: 'text' as const, value: strippedFirst }] : []),
  ];
  if (!secondHasNewline) {
    for (const sibling of paragraph.children.slice(2)) {
      if (
        linkEndLine !== undefined
        && sibling.position !== undefined
        && sibling.position.start.line > linkEndLine
      ) {
        break;
      }
      if (sibling.type === 'text' && /[\r\n]/u.test(sibling.value)) {
        const beforeBreak = sibling.value.split(/\r?\n/u)[0] ?? '';
        if (beforeBreak) {
          remainingChildren.push({ type: 'text', value: beforeBreak });
        }
        break;
      }
      remainingChildren.push(sibling);
    }
  }
  if (remainingChildren.length === 0) {
    return undefined;
  }
  const summaryRoot: Root = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: remainingChildren,
      },
    ],
  };
  const rendered = toMarkdown(summaryRoot).replace(/\s+/gu, ' ').trim();
  return rendered || undefined;
}

export function extractMarkdownLinks(
  markdown: string,
): ExtractedMarkdownLink[] {
  const tree = fromMarkdown(markdown);
  const links: ExtractedMarkdownLink[] = [];

  const visit = (node: Node, parent?: Node, grandparent?: Node): void => {
    if (node.type === 'link') {
      const link = node as Link;
      const title = renderLinkTitle(link);
      const isLeadingListItemParagraph = parent?.type === 'paragraph'
        && grandparent?.type === 'listItem'
        && (grandparent as ListItem).children[0] === parent;
      const summary = isLeadingListItemParagraph
        ? extractListItemSummary(parent as Paragraph, link)
        : undefined;
      links.push({
        title,
        url: link.url,
        ...(summary ? { summary } : {}),
      });
      return;
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children as Node[]) {
        visit(child, node, parent);
      }
    }
  };

  visit(tree);
  return links;
}

function stripDocsBasePrefix(pathname: string, basePathname: string): string {
  const normalizedBase = basePathname.replace(/^\/+|\/+$/gu, '');
  const normalizedPath = pathname.replace(/^\/+|\/+$/gu, '');
  if (normalizedBase && normalizedPath.startsWith(normalizedBase + '/')) {
    return normalizedPath.slice(normalizedBase.length + 1);
  }
  return pathname
    .replace(/^\/(?:next|\d+(?:\.\d+)*)?\/?/u, '')
    .replace(/^\/+|\/+$/gu, '');
}

function hasSkippedAssetExtension(docPath: string): boolean {
  const ext = path.posix.extname(docPath).toLowerCase();
  return SKIPPED_ASSET_EXTENSIONS.has(ext);
}

function toMirrorUrl(
  linkUrl: URL,
  base: URL,
  mirrorHostSet: ReadonlySet<string>,
): URL {
  const mirrored = new URL(linkUrl.toString());
  mirrored.search = '';
  mirrored.hash = '';
  if (
    mirrored.hostname !== base.hostname && mirrorHostSet.has(mirrored.hostname)
  ) {
    mirrored.protocol = base.protocol;
    mirrored.host = base.host;
  }
  return mirrored;
}

async function crawlDocsIndex(
  base: URL,
  markdown: string,
  indexPath: string,
  options: {
    fetchImpl: DocsFetch;
    mirrorHostSet: ReadonlySet<string>;
    nested: boolean;
    registered: Map<string, CrawledDocResource>;
    timeoutMs: number;
    visitedIndexes: Set<string>;
  },
): Promise<void> {
  const {
    fetchImpl,
    mirrorHostSet,
    nested,
    registered,
    timeoutMs,
    visitedIndexes,
  } = options;
  const perFileLinks = new Map<
    string,
    { link: ExtractedMarkdownLink; mirrorUrl: URL; }
  >();

  for (const link of extractMarkdownLinks(markdown)) {
    if (!link.title) continue;
    let parsed: URL;
    try {
      parsed = new URL(link.url);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
    if (
      parsed.hostname !== base.hostname && !mirrorHostSet.has(parsed.hostname)
    ) {
      continue;
    }

    const strippedPath = stripDocsBasePrefix(parsed.pathname, base.pathname);
    if (!strippedPath || hasSkippedAssetExtension(strippedPath)) continue;
    perFileLinks.set(strippedPath, {
      link,
      mirrorUrl: toMirrorUrl(parsed, base, mirrorHostSet),
    });
  }

  for (const [strippedPath, { link, mirrorUrl }] of perFileLinks) {
    const uri = DOCS_URI_PREFIX + strippedPath;
    const baseItem: CrawledDocResource = {
      uri,
      path: strippedPath,
      title: link.title,
      ...(link.summary ? { description: link.summary } : {}),
      url: mirrorUrl.toString(),
      sourceIndexes: [indexPath],
    };

    const existing = registered.get(strippedPath);
    if (existing && !existing.sourceIndexes.includes(indexPath)) {
      existing.sourceIndexes.push(indexPath);
    }

    if (strippedPath.endsWith('llms.txt')) {
      if (!nested) {
        if (!registered.has(strippedPath)) {
          registered.set(strippedPath, baseItem);
        }
        continue;
      }
      if (visitedIndexes.has(strippedPath)) continue;

      debug('Recursively fetching index: %s', mirrorUrl.toString());
      try {
        const nestedIndex = await fetchDocsResourceText(mirrorUrl, {
          fetchImpl,
          timeoutMs,
        });
        visitedIndexes.add(strippedPath);
        if (!registered.has(strippedPath)) {
          registered.set(strippedPath, {
            ...baseItem,
            cachedContent: nestedIndex.text,
          });
        }
        await crawlDocsIndex(base, nestedIndex.text, strippedPath, options);
      } catch (error) {
        debug(
          'Failed to fetch nested index %s: %s',
          mirrorUrl.toString(),
          error instanceof Error ? error.message : String(error),
        );
      }
      continue;
    }

    if (!registered.has(strippedPath)) {
      debug(
        'Registering resource: %s from [%s](%s)',
        uri,
        link.title,
        mirrorUrl.toString(),
      );
      registered.set(strippedPath, baseItem);
    }
  }
}

export async function crawlDocs(
  options: CrawlDocsOptions = {},
): Promise<CrawlDocsResult> {
  const {
    baseUrl = PUBLIC_DOCS_BASE_URL,
    fetchImpl = fetch,
    mirrorHosts = DEFAULT_MIRROR_HOSTS,
    nested = true,
    timeoutMs = DEFAULT_DOCS_TIMEOUT_MS,
  } = options;
  const base = normalizeDocsBaseUrl(baseUrl);
  const formattedBase = formatDocsBaseUrl(base);
  const rootUrl = new URL(formattedBase + '/' + ROOT_DOC_PATH);
  const rootDoc = await fetchDocsResourceText(rootUrl, {
    fetchImpl,
    timeoutMs,
  });

  const registered = new Map<string, CrawledDocResource>();
  registered.set(ROOT_DOC_PATH, {
    uri: ROOT_DOC_URI,
    path: ROOT_DOC_PATH,
    title: ROOT_DOC_TITLE,
    description: ROOT_DOC_DESCRIPTION,
    url: rootUrl.toString(),
    cachedContent: rootDoc.text,
    sourceIndexes: [],
  });

  const visitedIndexes = new Set<string>([ROOT_DOC_PATH]);
  await crawlDocsIndex(base, rootDoc.text, ROOT_DOC_PATH, {
    fetchImpl,
    mirrorHostSet: new Set(mirrorHosts),
    nested,
    registered,
    timeoutMs,
    visitedIndexes,
  });

  return {
    baseUrl: formattedBase,
    items: [...registered.values()],
  };
}

function normalizePrefixFilter(prefix: string): string {
  let normalized = prefix.trim();
  if (normalized.startsWith(DOCS_URI_PREFIX)) {
    normalized = normalized.slice(DOCS_URI_PREFIX.length);
  }
  return normalized.replace(/^\/+/, '');
}

function stripCachedContent(item: CrawledDocResource): DocResourceItem {
  return {
    uri: item.uri,
    path: item.path,
    title: item.title,
    ...(item.description === undefined
      ? {}
      : { description: item.description }),
    url: item.url,
  };
}

export async function listDocs(
  options: ListDocsOptions = {},
): Promise<ListDocsResult> {
  const { filter, limit, prefix, ...crawlOptions } = options;
  const crawled = await crawlDocs(crawlOptions);

  let matched = crawled.items.map(stripCachedContent);
  if (prefix !== undefined && prefix.trim().length > 0) {
    const normalizedPrefix = normalizePrefixFilter(prefix);
    matched = matched.filter(item => item.path.startsWith(normalizedPrefix));
  }
  if (filter !== undefined && filter.trim().length > 0) {
    const needle = filter.trim().toLowerCase();
    matched = matched.filter(
      item =>
        item.path.toLowerCase().includes(needle)
        || item.uri.toLowerCase().includes(needle)
        || item.title.toLowerCase().includes(needle)
        || (item.description?.toLowerCase().includes(needle) ?? false),
    );
  }

  const total = matched.length;
  const items = limit === undefined ? matched : matched.slice(0, limit);
  return {
    baseUrl: crawled.baseUrl,
    total,
    count: items.length,
    items,
  };
}

function assertSafeRelativeDocPath(
  docPath: string,
  originalTarget: string,
): void {
  const segments = docPath.split('/');
  if (segments.some(segment => segment === '..')) {
    throw new Error(
      'Invalid documentation path "'
        + originalTarget
        + '": parent path traversal is not allowed.',
    );
  }
}

interface CandidateDocTarget {
  docPath: string;
  url: URL;
}

function buildDocCandidates(
  rawTarget: string,
  base: URL,
  explicitBaseUrl: boolean,
  mirrorHostSet: ReadonlySet<string>,
): CandidateDocTarget[] {
  const trimmed = rawTarget.trim();
  if (!trimmed) {
    throw new Error('Documentation path or URL must not be empty.');
  }

  const formattedBase = formatDocsBaseUrl(base);
  const basePathPrefix = base.pathname.replace(/^\/+|\/+$/gu, '');

  let effectiveBase = formattedBase;
  let relativeInput: string;
  let hadTrailingSlash: boolean;

  if (trimmed.startsWith(DOCS_URI_PREFIX)) {
    const withoutScheme = trimmed
      .slice(DOCS_URI_PREFIX.length)
      .split(/[?#]/u)[0] ?? '';
    hadTrailingSlash = withoutScheme.endsWith('/');
    relativeInput = withoutScheme.replace(/^\/+|\/+$/gu, '');
  } else if (/^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(trimmed)) {
    let targetUrl: URL;
    try {
      targetUrl = new URL(trimmed);
    } catch {
      throw new Error('Invalid documentation URL: ' + rawTarget);
    }
    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      throw new Error(
        'Unsupported documentation URL scheme in "'
          + rawTarget
          + '". Use lynx-docs:// or HTTP(S).',
      );
    }
    if (
      targetUrl.hostname !== base.hostname
      && !mirrorHostSet.has(targetUrl.hostname)
    ) {
      throw new Error(
        'Unsupported documentation host "'
          + targetUrl.hostname
          + '". Use a path relative to '
          + formattedBase
          + ' or a URL on '
          + base.hostname
          + '.',
      );
    }
    hadTrailingSlash = targetUrl.pathname.endsWith('/');
    if (explicitBaseUrl) {
      relativeInput = stripDocsBasePrefix(targetUrl.pathname, base.pathname);
    } else {
      const versionMatch = /^\/(next|\d+(?:\.\d+)*)(?:\/(.*))?$/u.exec(
        targetUrl.pathname,
      );
      if (versionMatch) {
        effectiveBase = base.origin + '/' + versionMatch[1];
        relativeInput = (versionMatch[2] ?? '').replace(/^\/+|\/+$/gu, '');
      } else if (
        basePathPrefix
        && targetUrl.pathname.replace(/^\/+/, '').startsWith(
          basePathPrefix + '/',
        )
      ) {
        relativeInput = stripDocsBasePrefix(targetUrl.pathname, base.pathname);
      } else {
        effectiveBase = base.origin;
        relativeInput = targetUrl.pathname.replace(/^\/+|\/+$/gu, '');
      }
    }
  } else {
    const withoutQueryOrHash = trimmed.split(/[?#]/u)[0] ?? '';
    hadTrailingSlash = withoutQueryOrHash.endsWith('/');
    let cleaned = withoutQueryOrHash.replace(/^\/+|\/+$/gu, '');
    if (basePathPrefix && cleaned.startsWith(basePathPrefix + '/')) {
      cleaned = cleaned.slice(basePathPrefix.length + 1);
    }
    relativeInput = cleaned;
  }

  if (!relativeInput) {
    return [
      {
        docPath: ROOT_DOC_PATH,
        url: new URL(effectiveBase + '/' + ROOT_DOC_PATH),
      },
    ];
  }

  assertSafeRelativeDocPath(relativeInput, rawTarget);

  const candidatePaths: string[] = [];
  const addCandidate = (candidatePath: string): void => {
    const normalized = candidatePath.replace(/^\/+|\/+$/gu, '');
    if (!normalized) return;
    if (!candidatePaths.includes(normalized)) candidatePaths.push(normalized);
  };

  const lower = relativeInput.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.txt')) {
    addCandidate(relativeInput);
  } else if (lower.endsWith('.html')) {
    const stem = relativeInput.slice(0, -'.html'.length);
    addCandidate(stem + '.md');
    addCandidate(stem + '/index.md');
  } else if (hadTrailingSlash) {
    addCandidate(relativeInput + '/index.md');
    addCandidate(relativeInput + '.md');
  } else {
    addCandidate(relativeInput + '.md');
    addCandidate(relativeInput + '/index.md');
  }

  return candidatePaths.map(docPath => ({
    docPath,
    url: new URL(effectiveBase + '/' + docPath),
  }));
}

export async function getDoc(
  target: string,
  options: GetDocOptions = {},
): Promise<GetDocResult> {
  const {
    baseUrl = PUBLIC_DOCS_BASE_URL,
    explicitBaseUrl = false,
    fetchImpl = fetch,
    hint,
    mirrorHosts = DEFAULT_MIRROR_HOSTS,
    outputPath,
    timeoutMs = DEFAULT_DOCS_TIMEOUT_MS,
  } = options;
  const base = normalizeDocsBaseUrl(baseUrl);
  const candidates = buildDocCandidates(
    target,
    base,
    explicitBaseUrl,
    new Set(mirrorHosts),
  );
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const fetched = await fetchDocsResourceText(candidate.url, {
        fetchImpl,
        timeoutMs,
      });
      let resolvedOutputPath: string | undefined;
      if (outputPath !== undefined) {
        const trimmedOutput = outputPath.trim();
        if (!trimmedOutput) {
          throw new Error('--output path must not be empty.');
        }
        resolvedOutputPath = path.resolve(trimmedOutput);
        await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
        await fs.writeFile(resolvedOutputPath, fetched.text, 'utf8');
      }
      return {
        uri: DOCS_URI_PREFIX + candidate.docPath,
        path: candidate.docPath,
        url: candidate.url.toString(),
        contentType: fetched.contentType,
        content: fetched.text,
        ...(resolvedOutputPath === undefined
          ? {}
          : { outputPath: resolvedOutputPath }),
      };
    } catch (error) {
      if (
        error instanceof Error
        && error.message === '--output path must not be empty.'
      ) {
        throw error;
      }
      lastError = error;
    }
  }

  const triedUrls = candidates
    .map(candidate => candidate.url.toString())
    .join(', ');
  const reason = lastError instanceof Error
    ? lastError.message
    : String(lastError);
  const lines = [reason, 'Tried: ' + triedUrls];
  if (hint) lines.push('Hint: ' + hint);
  throw new Error(lines.join('\n'), { cause: lastError });
}
