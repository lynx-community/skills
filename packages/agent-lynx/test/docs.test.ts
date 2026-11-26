// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { DaemonTransport } from '@lynx-js/devtool-connector/transport';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  extractMarkdownLinks,
  PUBLIC_DOCS_BASE_URL,
} from '../src/commands/docs.ts';
import { createProgram } from '../src/devtool.ts';

test('public docs help uses lynxjs.org and does not expose knowledge-base', () => {
  const program = createProgram({ cliPlaceholder: 'custom-lynx', env: {} });
  assert.equal(
    program.commands.some(command => command.name() === 'knowledge-base'),
    false,
  );
  let rootHelp = '';
  program.configureOutput({ writeOut: value => (rootHelp += value) });
  program.outputHelp();
  assert.match(rootHelp, /Documentation:/u);
  assert.match(
    rootHelp,
    /docs\s+Browse and read official Lynx\s+documentation strictly mirrored from\s+lynxjs\.org/u,
  );
  assert.match(rootHelp, /LYNX_DOCS_BASE_URL/u);
  assert.doesNotMatch(rootHelp, /knowledge-base|lynxbase/iu);

  const docs = program.commands.find(command => command.name() === 'docs');
  assert.ok(docs);
  let help = '';
  docs.configureOutput({ writeOut: value => (help += value) });
  docs.outputHelp();
  assert.match(help, /Usage: custom-lynx docs/u);
  assert.match(help, /strict mirror of https:\/\/lynxjs\.org/u);
  assert.match(help, /\$ custom-lynx docs get llms\.txt/u);
  assert.doesNotMatch(help, /knowledge-base|lynxbase/iu);
});

test('extractMarkdownLinks ignores fenced blocks, inline code spans, and image links', () => {
  const markdown = [
    '# Heading',
    '* [**Elements**](https://lynxjs.org/next/guide/ui/elements.md): Core native element tags.',
    'Inline code `[ignored](https://lynxjs.org/next/ignored.md)` and ![diagram](https://lynxjs.org/next/diagram.png).',
    '```md',
    '[fenced](https://lynxjs.org/next/fenced.md)',
    '```',
  ].join('\n');

  assert.deepEqual(extractMarkdownLinks(markdown), [
    {
      title: '**Elements**',
      url: 'https://lynxjs.org/next/guide/ui/elements.md',
      summary: 'Core native element tags.',
    },
  ]);
});

test('docs list crawls nested llms.txt, breaks cycles, filters entries, and skips daemon transport', async t => {
  let daemonClosed = 0;
  t.mock.method(DaemonTransport.prototype, 'close', async () => {
    daemonClosed += 1;
  });

  const requests: string[] = [];
  const pages = new Map<string, { body: string; contentType?: string; }>([
    [
      'https://lynxjs.org/next/llms.txt',
      {
        body: [
          '# Root',
          '* [**Composing Elements**](https://lynxjs.org/next/guide/ui/elements-components.md): Map tags to native views.',
          '* [Versioned](https://lynxjs.org/3.8/guide/legacy.md)',
          '* [API Index](https://lynxjs.org/next/api/llms.txt)',
          '* [Broken Index](https://lynxjs.org/next/broken/llms.txt)',
          '* [External](https://example.com/outside.md)',
        ].join('\n'),
        contentType: 'text/plain; charset=utf-8',
      },
    ],
    [
      'https://lynxjs.org/next/api/llms.txt',
      {
        body: [
          '* [Back to Root](https://lynxjs.org/next/llms.txt)',
          '* [scroll-view](https://lynxjs.org/next/api/elements/built-in/scroll-view.md): Scrollable container.',
        ].join('\n'),
        contentType: 'text/plain; charset=utf-8',
      },
    ],
    [
      'https://lynxjs.org/next/broken/llms.txt',
      {
        body: '<!doctype html><html><body>SPA</body></html>',
        contentType: 'text/html; charset=utf-8',
      },
    ],
  ]);

  const fetchImpl = async (url: URL): Promise<Response> => {
    requests.push(url.toString());
    const hit = pages.get(url.toString());
    if (!hit) return new Response('Not Found', { status: 404 });
    return new Response(hit.body, {
      status: 200,
      headers: {
        'content-type': hit.contentType ?? 'text/markdown; charset=utf-8',
      },
    });
  };

  const out: string[] = [];
  await createProgram({
    env: {},
    docs: { fetchImpl, writeOut: value => out.push(value) },
  }).parseAsync(['node', 'agent-lynx', '--json', 'docs', 'list']);

  assert.equal(daemonClosed, 0);
  const parsed = JSON.parse(out.join('')) as {
    baseUrl: string;
    total: number;
    items: Array<{ uri: string; }>;
  };
  assert.equal(parsed.baseUrl, PUBLIC_DOCS_BASE_URL);
  assert.deepEqual(parsed.items.map(item => item.uri), [
    'lynx-docs://llms.txt',
    'lynx-docs://guide/ui/elements-components.md',
    'lynx-docs://guide/legacy.md',
    'lynx-docs://api/llms.txt',
    'lynx-docs://api/elements/built-in/scroll-view.md',
  ]);
});

test('docs get resolves directory index.md fallbacks, .html URLs, --output, and rejects HTML fallbacks', async t => {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-oss-docs-'),
  );
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const pages = new Map<string, { body: string; contentType: string; }>([
    [
      'https://lynxjs.org/next/guide/ui/layout/index.md',
      { body: '# Layout\n', contentType: 'text/markdown; charset=utf-8' },
    ],
    [
      'https://lynxjs.org/3.8/react/introduction.md',
      { body: '# ReactLynx 3.8', contentType: 'text/markdown; charset=utf-8' },
    ],
  ]);
  const fetchImpl = async (url: URL): Promise<Response> => {
    const hit = pages.get(url.toString());
    if (!hit) {
      return new Response('<!doctype html><html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
    return new Response(hit.body, {
      status: 200,
      headers: { 'content-type': hit.contentType },
    });
  };

  const outFile = path.join(tempDir, 'layout.md');
  const out: string[] = [];
  await createProgram({
    env: {},
    docs: { fetchImpl, writeOut: value => out.push(value) },
  }).parseAsync([
    'node',
    'agent-lynx',
    'docs',
    'get',
    'guide/ui/layout',
    '-o',
    outFile,
  ]);
  assert.equal(await fs.readFile(outFile, 'utf8'), '# Layout\n');

  out.length = 0;
  await createProgram({
    env: { AGENT_LYNX_FORCE_JSON: '1' },
    docs: { fetchImpl, writeOut: value => out.push(value) },
  }).parseAsync([
    'node',
    'agent-lynx',
    'docs',
    'read',
    'https://lynxjs.org/3.8/react/introduction.html#hooks',
  ]);
  const parsed = JSON.parse(out.join('')) as { url: string; content: string; };
  assert.equal(parsed.url, 'https://lynxjs.org/3.8/react/introduction.md');
  assert.equal(parsed.content, '# ReactLynx 3.8');

  await assert.rejects(
    createProgram({
      cliPlaceholder: 'custom-lynx',
      env: {},
      docs: { fetchImpl },
    }).parseAsync(['node', 'agent-lynx', 'docs', 'get', 'guide/missing.md']),
    /custom-lynx docs get llms\.txt/u,
  );
});
