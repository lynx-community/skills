// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtempDisposable,
  readdir,
  readFile,
  symlink,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { listDocs } from '../dist/src/docs.js';

const exec = promisify(execFile);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const options = { timeout: 30_000 };

async function checkMetadata(directory, entry) {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
  );
  const version = await exec(process.execPath, [entry, '--version'], {
    cwd: directory,
  });
  assert.equal(version.stdout.trim(), manifest.version);
  assert.equal(version.stderr, '');
  const help = await exec(process.execPath, [entry, '--help'], {
    cwd: directory,
  });
  assert.match(help.stdout, /@lynx-js\/docs-mcp-server/u);
  assert.match(help.stdout, /--base-url/u);
  assert.equal(help.stderr, '');
}

test(
  'source, built, and packed CLIs load their own metadata outside the workspace',
  options,
  async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), 'oss-docs-mcp-test-'),
    );
    const directory = temporaryDirectory.path;
    await checkMetadata(directory, join(packageRoot, 'main.ts'));
    await checkMetadata(directory, join(packageRoot, 'dist/main.js'));
    const pnpm = process.env.npm_execpath;
    assert.ok(pnpm, 'Run this test through pnpm test');
    const [command, ...args] = /\.[cm]?js$/u.test(pnpm)
      ? [process.execPath, pnpm]
      : [pnpm];
    await exec(command, [...args, 'pack', '--pack-destination', directory], {
      cwd: packageRoot,
      timeout: 15_000,
    });
    const archives = (await readdir(directory)).filter(name =>
      name.endsWith('.tgz')
    );
    assert.equal(archives.length, 1);
    await exec('tar', ['-xzf', join(directory, archives[0]), '-C', directory]);
    const packed = join(directory, 'package');
    const manifest = JSON.parse(
      await readFile(join(packed, 'package.json'), 'utf8'),
    );
    const entry = typeof manifest.bin === 'string'
      ? manifest.bin
      : manifest.bin['docs-mcp-server'];
    assert.equal(entry, './dist/main.js');
    await mkdir(join(packed, 'node_modules'));
    for (const name of Object.keys(manifest.dependencies)) {
      const destination = join(packed, 'node_modules', name);
      await mkdir(dirname(destination), { recursive: true });
      await symlink(
        join(packageRoot, 'node_modules', name),
        destination,
        'junction',
      );
    }
    await checkMetadata(directory, join(packed, entry));
    await checkApiCatalog(join(packed, entry));
  },
);

async function checkApiCatalog(entry) {
  await using cleanup = new AsyncDisposableStack();
  const requests = [];
  const routes = new Map();
  const server = createServer((request, response) => {
    requests.push(request.url);
    const body = routes.get(request.url);
    response.writeHead(body === undefined ? 404 : 200, {
      'content-type': 'text/markdown',
    });
    response.end(body ?? 'Not found');
  });
  cleanup.defer(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/3.6/zh`;
  const link = (name, path) => `[${name}](${base}/${path})`;
  const root = [
    link('Guide', 'guide.md'),
    link('Shared before API', 'api/shared.md'),
    link('API index', 'api/llms.txt'),
    link('Shared after API', 'after.md'),
    link('Only linked by root', 'api/root-only.md'),
    link('Other index', 'other/llms.txt'),
  ].join('\n');
  const api = [
    link('Shared', 'api/shared.md'),
    link('Also shared', 'after.md'),
    link('Nested API index', 'nested/llms.txt'),
    link('Missing', 'api/missing.md'),
    link('Back to root', 'llms.txt'),
    '[External](https://outside.invalid/page.md)',
  ].join('\n');
  const nested = [
    link('Cycle', 'api/llms.txt'),
    // Index membership, not a path prefix, defines what stays out of the list.
    '[Scoped API](https://lynxjs.org/3.6/zh/lynxtron/@scope/Page.md)',
  ].join('\n');
  for (const [path, body] of [
    ['llms.txt', root],
    ['api/llms.txt', api],
    ['nested/llms.txt', nested],
    ['other/llms.txt', link('Other page', 'other/page.md')],
    ['guide.md', '# Guide'],
    ['api/shared.md', '# Shared'],
    ['after.md', '# Shared after API'],
    ['lynxtron/@scope/Page.md', '# Scoped API'],
  ]) routes.set('/3.6/zh/' + path, body);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry, '--base-url', base],
    env: { PATH: process.env.PATH ?? '', NO_PROXY: '127.0.0.1' },
    stderr: 'pipe',
  });
  let diagnostics = '';
  transport.stderr.on('data', chunk => diagnostics += String(chunk));
  const client = new Client({ name: 'api-catalog-test', version: '1.0.0' });
  cleanup.defer(() => transport.close());
  cleanup.defer(() => client.close());
  await client.connect(transport, { timeout: 5000 });
  const listed = (await client.listResources()).resources.map(r => r.uri)
    .sort();
  assert.deepEqual(listed, [
    'lynx-docs://api/llms.txt',
    'lynx-docs://api/root-only.md',
    'lynx-docs://guide.md',
    'lynx-docs://llms.txt',
    'lynx-docs://other/llms.txt',
    'lynx-docs://other/page.md',
  ]);
  assert.match(
    client.getInstructions(),
    /API pages are omitted from resources\/list/u,
  );
  assert.deepEqual((await client.listTools()).tools, []);
  assert.deepEqual(
    (await client.listResourceTemplates()).resourceTemplates.map(r =>
      r.uriTemplate
    ),
    ['lynx-docs://{+path}'],
  );
  assert.deepEqual(requests, [
    '/3.6/zh/llms.txt',
    '/3.6/zh/api/llms.txt',
    '/3.6/zh/nested/llms.txt',
    '/3.6/zh/other/llms.txt',
  ]);
  const initialRequests = [...requests];
  routes.set('/3.6/zh/api/llms.txt', 'Changed index');
  for (const [path, body] of [
    ['llms.txt', root],
    ['api/llms.txt', api],
    ['nested/llms.txt', nested],
  ]) {
    assert.deepEqual(
      (await client.readResource({ uri: 'lynx-docs://' + path })).contents,
      [
        { uri: 'lynx-docs://' + path, text: body, mimeType: 'text/markdown' },
      ],
    );
  }
  assert.deepEqual(
    requests,
    initialRequests,
    'Index reads use the cached source unchanged',
  );
  await Promise.all([
    ['api/shared.md', '# Shared'],
    ['after.md', '# Shared after API'],
    ['lynxtron/@scope/Page.md', '# Scoped API'],
    ['guide.md', '# Guide'],
  ].map(async ([path, body]) => {
    assert.deepEqual(
      (await client.readResource({ uri: 'lynx-docs://' + path })).contents,
      [
        { uri: 'lynx-docs://' + path, text: body, mimeType: 'text/markdown' },
      ],
    );
  }));
  routes.set('/3.6/zh/api/shared.md', '# Updated');
  assert.equal(
    (await client.readResource({ uri: 'lynx-docs://api/shared.md' }))
      .contents[0].text,
    '# Updated',
  );
  await assert.rejects(
    client.readResource({ uri: 'lynx-docs://api/missing.md' }),
    /404/u,
  );
  const beforeInvalidReads = [...requests];
  for (const uri of [
    'lynx-docs://api/not-indexed.md',
    'lynx-docs://api/../secret.md',
    'lynx-docs://api/shared.md?other=1',
    'https://outside.invalid/page.md',
  ]) {
    await assert.rejects(client.readResource({ uri }), /Resource.*not found/iu);
  }
  assert.deepEqual(
    requests,
    beforeInvalidReads,
    'Unindexed requests never trigger HTTP',
  );
  assert.deepEqual(
    (await client.listResources()).resources.map(r => r.uri).sort(),
    listed,
  );

  routes.set('/3.6/zh/api/llms.txt', api);
  const fullList = await listDocs({ baseUrl: base });
  assert.equal(fullList.count, 11, 'The shared CLI listing remains complete');
  assert.ok(
    fullList.items.some(item =>
      item.uri === 'lynx-docs://lynxtron/@scope/Page.md'
    ),
  );
  assert.ok(
    fullList.items.every(item =>
      !('sourceIndexes' in item) && !('cachedContent' in item)
    ),
  );
  await client.close();
  await transport.close();
  assert.equal(transport.pid, null);
  assert.equal(diagnostics, '');
}

test(
  'API index stays listed while its pages remain readable but unlisted',
  options,
  async () => {
    await checkApiCatalog(join(packageRoot, 'dist/main.js'));
  },
);

test(
  'native fetch serves documentation and obug diagnostics stay on stderr',
  options,
  async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), 'oss-docs-mcp-test-'),
    );
    const directory = temporaryDirectory.path;
    await using cleanup = new AsyncDisposableStack();
    const requests = [];
    let origin;
    const server = createServer((request, response) => {
      requests.push(request.url);
      if (request.url === '/next/llms.txt') {
        const longSummary = 'S'.repeat(320);
        response.end(
          `* [Page](${origin}/next/page.md): ${longSummary}\n* [Extensionless](${origin}/next/guide/typescript)\n* [Broken index](${origin}/next/broken/llms.txt)\n`,
        );
      } else if (request.url === '/next/page.md') {
        response.end('# Native fetch documentation');
      } else if (request.url === '/next/guide/typescript') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><html><body>SPA</body></html>');
      } else if (request.url === '/next/guide/typescript.md') {
        response.writeHead(200, {
          'content-type': 'text/markdown; charset=utf-8',
        });
        response.end('# TypeScript Guide');
      } else {
        response.writeHead(503);
        response.end('Unavailable');
      }
    });
    cleanup.defer(async () => {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address === 'object');
    origin = `http://127.0.0.1:${address.port}`;
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        join(packageRoot, 'dist/main.js'),
        '--base-url',
        `${origin}/next/`,
      ],
      cwd: directory,
      env: {
        PATH: process.env.PATH ?? '',
        DEBUG: 'lynx-docs-mcp',
        NO_PROXY: '127.0.0.1',
      },
      stderr: 'pipe',
    });
    let diagnostics = '';
    transport.stderr.on('data', chunk => {
      diagnostics += String(chunk);
    });
    const client = new Client({ name: 'native-docs-test', version: '1.0.0' });
    cleanup.defer(() => transport.close());
    cleanup.defer(() => client.close());
    await client.connect(transport, { timeout: 5000 });
    const resources = (await client.listResources()).resources;
    assert.deepEqual(resources.map(resource => resource.uri).sort(), [
      'lynx-docs://guide/typescript',
      'lynx-docs://llms.txt',
      'lynx-docs://page.md',
    ]);
    const pageMeta = resources.find(resource =>
      resource.uri === 'lynx-docs://page.md'
    );
    assert.ok(pageMeta?.description && pageMeta.description.length <= 200);
    assert.ok(pageMeta.description.endsWith('…'));
    assert.deepEqual((await client.listTools()).tools, []);
    const page = await client.readResource({ uri: 'lynx-docs://page.md' });
    assert.equal(page.contents[0].text, '# Native fetch documentation');
    const tsGuide = await client.readResource({
      uri: 'lynx-docs://guide/typescript',
    });
    assert.equal(tsGuide.contents[0].text, '# TypeScript Guide');
    assert.deepEqual(requests, [
      '/next/llms.txt',
      '/next/broken/llms.txt',
      '/next/page.md',
      '/next/guide/typescript',
      '/next/guide/typescript.md',
    ]);
    assert.match(diagnostics, /lynx-docs-mcp/u);
    assert.match(diagnostics, /Failed to fetch nested index.*503/u);
  },
);
