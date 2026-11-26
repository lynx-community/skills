// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { mkdtempDisposable, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  extractMarkdownLinks,
  getDoc,
  listDocs,
  PUBLIC_DOCS_BASE_URL,
} from '../dist/src/docs.js';

test('extractMarkdownLinks uses CommonMark mdast parsing for comments, code, escapes, and summaries', () => {
  const markdown = [
    '# Docs',
    '* [**Elements**](https://lynxjs.org/next/guide/ui/elements.md): Native element tags.',
    '* [Variable: A2UI\\_PROTOCOL\\_VERSION](https://lynxjs.org/next/api/version.md)',
    '<!-- [commented](https://lynxjs.org/next/commented.md) -->',
    'Inline `[ignored](https://lynxjs.org/next/ignored.md)` and ![img](https://lynxjs.org/next/img.png).',
    '```md',
    '[fenced](https://lynxjs.org/next/fenced.md)',
    '```',
  ].join('\n');

  assert.deepEqual(extractMarkdownLinks(markdown), [
    {
      title: '**Elements**',
      url: 'https://lynxjs.org/next/guide/ui/elements.md',
      summary: 'Native element tags.',
    },
    {
      title: 'Variable: A2UI_PROTOCOL_VERSION',
      url: 'https://lynxjs.org/next/api/version.md',
    },
  ]);
});

test('listDocs and getDoc share mirror normalization, SPA fallback rejection, and file output', async () => {
  await using temporaryDirectory = await mkdtempDisposable(
    join(tmpdir(), 'oss-docs-core-test-'),
  );
  const pages = new Map([
    [
      'https://mirror.example.com/next/llms.txt',
      {
        body: [
          '* [Elements](https://lynxjs.org/next/guide/ui/elements.md): Core UI tags.',
          '* [API Index](https://mirror.example.com/next/api/llms.txt)',
          '* [Asset](https://mirror.example.com/next/logo.png)',
        ].join('\n'),
        contentType: 'text/plain; charset=utf-8',
      },
    ],
    [
      'https://mirror.example.com/next/api/llms.txt',
      {
        body:
          '* [scroll-view](https://mirror.example.com/next/api/scroll-view.md)\n',
        contentType: 'text/plain; charset=utf-8',
      },
    ],
    [
      'https://mirror.example.com/next/guide/ui/layout/index.md',
      {
        body: '# Layout\n',
        contentType: 'text/markdown; charset=utf-8',
      },
    ],
  ]);

  const fetchImpl = async url => {
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

  assert.equal(PUBLIC_DOCS_BASE_URL, 'https://lynxjs.org/next');
  const listed = await listDocs({
    baseUrl: 'https://mirror.example.com/next/',
    fetchImpl,
  });
  assert.deepEqual(listed.items.map(item => item.uri), [
    'lynx-docs://llms.txt',
    'lynx-docs://guide/ui/elements.md',
    'lynx-docs://api/llms.txt',
    'lynx-docs://api/scroll-view.md',
  ]);
  assert.equal(
    listed.items.find(item => item.path === 'guide/ui/elements.md')?.url,
    'https://mirror.example.com/next/guide/ui/elements.md',
  );

  const outputPath = join(temporaryDirectory.path, 'layout.md');
  const fetched = await getDoc('guide/ui/layout', {
    baseUrl: 'https://mirror.example.com/next',
    fetchImpl,
    outputPath,
  });
  assert.equal(fetched.uri, 'lynx-docs://guide/ui/layout/index.md');
  assert.equal(await readFile(outputPath, 'utf8'), '# Layout\n');

  await assert.rejects(
    getDoc('../outside.md', { fetchImpl }),
    /parent path traversal is not allowed/u,
  );
});
