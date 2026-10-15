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
  async t => {
    const cleanup = new AsyncDisposableStack();
    t.after(() => cleanup.disposeAsync());
    const { path: directory } = cleanup.use(
      await mkdtempDisposable(join(tmpdir(), 'oss-docs-mcp-test-')),
    );
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
  },
);

test(
  'native fetch serves documentation and obug diagnostics stay on stderr',
  options,
  async t => {
    const cleanup = new AsyncDisposableStack();
    t.after(() => cleanup.disposeAsync());
    const { path: directory } = cleanup.use(
      await mkdtempDisposable(join(tmpdir(), 'oss-docs-mcp-test-')),
    );
    const requests = [];
    let origin;
    const server = createServer((request, response) => {
      requests.push(request.url);
      if (request.url === '/next/llms.txt') {
        response.end(
          `[Page](${origin}/next/page.md)\n[Broken index](${origin}/next/broken/llms.txt)\n`,
        );
      } else if (request.url === '/next/page.md') {
        response.end('# Native fetch documentation');
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
      'lynx-docs://llms.txt',
      'lynx-docs://page.md',
    ]);
    assert.deepEqual((await client.listTools()).tools, []);
    const page = await client.readResource({ uri: 'lynx-docs://page.md' });
    assert.equal(page.contents[0].text, '# Native fetch documentation');
    assert.deepEqual(requests, [
      '/next/llms.txt',
      '/next/broken/llms.txt',
      '/next/page.md',
    ]);
    assert.match(diagnostics, /lynx-docs-mcp/u);
    assert.match(diagnostics, /Failed to fetch nested index.*503/u);
  },
);
