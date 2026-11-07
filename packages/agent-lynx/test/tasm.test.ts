// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test, type TestContext } from 'node:test';
import { promisify } from 'node:util';

import { Command } from 'commander';
import { registerTasmCommand } from '../src/commands/tasm.ts';
import { createProgram } from '../src/devtool.ts';
import { PUBLIC_TASM_PACKAGE, resolveTasmModule } from '../src/tasm-package.ts';

const codec = `module.exports = async () => {
  const memory = new Uint8Array(1024);
  let disposed = 0;
  return {
    HEAPU8: memory,
    _malloc: () => 1,
    _free: () => {},
    _encode: json => {
      const value = JSON.parse(json);
      const bytes = Buffer.from(JSON.stringify(value));
      if (disposed) throw Error('instance reused');
      return { status: value.fail ? 1 : 0, error_msg: 'invalid template',
        buffer: { size: () => bytes.length, get: i => bytes[i], delete: () => disposed++ } };
    },
    _decode: (ptr, size) => ({ status: 0, result: Buffer.from(memory.subarray(ptr, ptr + size)).toString() })
  };
};`;

const server = createServer();
const requests: string[] = [];
let fixtures: string;
let registry: string;

before(async () => {
  fixtures = await fs.mkdtemp(path.join(os.tmpdir(), 'tasm-npm-fixture-'));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  registry = `http://127.0.0.1:${address.port}`;
  const responses = new Map<string, string | Buffer>();
  for (
    const pkg of [
      {
        manifest: {
          ...PUBLIC_TASM_PACKAGE,
          dependencies: { 'tasm-test-runtime': '1.0.0' },
          scripts: { postinstall: 'node install.cjs' },
        },
        files: {
          'lepus.js': "module.exports = require('tasm-test-runtime');",
          'install.cjs':
            "require('node:fs').writeFileSync('installed', 'ready');",
        },
      },
      {
        manifest: { name: 'tasm-test-runtime', version: '1.0.0' },
        files: { 'index.js': codec },
      },
    ]
  ) {
    const source = path.join(fixtures, pkg.manifest.name);
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(
      path.join(source, 'package.json'),
      JSON.stringify(pkg.manifest),
    );
    for (const [name, content] of Object.entries(pkg.files)) {
      await fs.writeFile(path.join(source, name), content);
    }
    const { stdout } = await promisify(execFile)('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      fixtures,
    ], { cwd: source, shell: process.platform === 'win32' });
    const [{ filename }] = JSON.parse(stdout) as Array<{ filename: string; }>;
    const archivePath = `/${pkg.manifest.name}/package.tgz`;
    responses.set(
      archivePath,
      await fs.readFile(path.join(fixtures, filename!)),
    );
    responses.set(
      `/${pkg.manifest.name}`,
      JSON.stringify({
        name: pkg.manifest.name,
        'dist-tags': { latest: pkg.manifest.version },
        versions: {
          [pkg.manifest.version]: {
            ...pkg.manifest,
            dist: { tarball: `${registry}${archivePath}` },
          },
        },
      }),
    );
  }
  server.on('request', (req, res) => {
    const url = decodeURIComponent(req.url!);
    requests.push(url);
    const response = responses.get(url);
    res.writeHead(response ? 200 : 404);
    res.end(response ?? 'Not found');
  });
});
after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve())
  );
  await fs.rm(fixtures, { recursive: true, force: true });
});

async function fixture(t: TestContext) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-tasm-test-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  requests.length = 0;
  return {
    root,
    pkg: PUBLIC_TASM_PACKAGE,
    requests,
    runtime: {
      env: {
        ...process.env,
        AGENT_LYNX_CACHE_DIR: path.join(root, 'cache'),
        CODEX_SANDBOX_NETWORK_DISABLED: '0',
        npm_config_registry: registry,
        npm_config_cache: path.join(root, 'npm-cache'),
      },
    },
  };
}

test('npm installs the selected codec with dependencies and scripts, then reuses it offline', async t => {
  const f = await fixture(t);
  const runtime = {
    ...f.runtime,
    package: { ...f.pkg, version: '0.0.52' },
    env: {
      ...f.runtime.env,
      AGENT_LYNX_CACHE_DIR: path.relative(
        process.cwd(),
        f.runtime.env.AGENT_LYNX_CACHE_DIR,
      ),
    },
  };
  const first = await resolveTasmModule(runtime, f.pkg.version);
  assert.equal(path.isAbsolute(first.file), true);
  assert.equal(first.package.version, f.pkg.version);
  assert.equal(
    await fs.readFile(path.join(path.dirname(first.file), 'installed'), 'utf8'),
    'ready',
  );
  assert.ok(requests.includes('/tasm-test-runtime/package.tgz'));
  const requestCount = requests.length;
  assert.deepEqual(
    await resolveTasmModule({
      ...runtime,
      env: { ...runtime.env, PATH: '', CODEX_SANDBOX_NETWORK_DISABLED: '1' },
    }, f.pkg.version),
    first,
  );
  assert.equal(requests.length, requestCount);
});

test('invalid versions and uncached offline requests fail without installing', async t => {
  const f = await fixture(t);
  for (
    const version of [
      'latest',
      '^0.0.52',
      '../escape',
      'https://example.test/a.tgz',
    ]
  ) {
    await assert.rejects(
      resolveTasmModule(f.runtime, version),
      /exact version/,
    );
  }
  await assert.rejects(
    resolveTasmModule({
      ...f.runtime,
      env: { ...f.runtime.env, CODEX_SANDBOX_NETWORK_DISABLED: '1' },
    }),
    /not cached/,
  );
  assert.equal(requests.length, 0);
  await assert.rejects(fs.access(f.runtime.env.AGENT_LYNX_CACHE_DIR), {
    code: 'ENOENT',
  });
});

test('encode/decode use in-process codec APIs, preserve files on failure, and report identity', async t => {
  const f = await fixture(t);
  t.mock.method(console, 'error', () => {});
  let json = '';
  t.mock.method(console, 'log', (value: string) => {
    json = value;
  });
  const input = path.join(f.root, 'input.json');
  const binary = path.join(f.root, 'out.tasm');
  const output = path.join(f.root, 'out.json');
  await fs.writeFile(
    input,
    JSON.stringify({ sourceContent: { appType: 'card' } }),
  );
  const run = async (args: string[]): Promise<void> => {
    const program = new Command().option('--json', 'JSON output', false)
      .exitOverride();
    registerTasmCommand(program, f.runtime);
    await program.parseAsync(['tasm', ...args], { from: 'user' });
  };
  await run(['encode', '-i', input, '-o', binary, '--json']);
  assert.deepEqual(JSON.parse(json), {
    operation: 'encode',
    output: binary,
    package: f.pkg.name,
    version: f.pkg.version,
  });
  await run(['decode', '-i', binary, '-o', output]);
  assert.deepEqual(
    JSON.parse(await fs.readFile(output, 'utf8')),
    JSON.parse(await fs.readFile(input, 'utf8')),
  );
  await fs.writeFile(input, '{"fail":true}');
  const original = await fs.readFile(binary);
  await assert.rejects(
    run(['encode', '-i', input, '-o', binary]),
    /TASM encode failed \(@lynx-js\/tasm@0.0.53\): invalid template/,
  );
  assert.deepEqual(await fs.readFile(binary), original);
  await fs.writeFile(input, 'not json');
  await assert.rejects(run(['encode', '-i', input, '-o', binary]), SyntaxError);
  await fs.writeFile(input, '[]');
  await assert.rejects(
    run(['encode', '-i', input, '-o', binary]),
    /template JSON object/,
  );
});

test('root and nested help identify providers without downloads, including hosted invocation', async t => {
  const f = await fixture(t);
  const program = createProgram({
    cliPlaceholder: 'host lynx',
    env: { CODEX_SANDBOX_NETWORK_DISABLED: '1' },
  });
  const rootHelp = program.helpInformation();
  assert.doesNotMatch(program.description(), /powered by/i);
  assert.match(
    rootHelp,
    /tasm \[options\]\s+Encode\/decode templates \(powered by\s+@lynx-js\/tasm@0.0.53/,
  );
  const tasm = program.commands.find(command => command.name() === 'tasm')!;
  let help = '';
  tasm.configureOutput({
    writeOut: value => {
      help += value;
    },
  });
  tasm.outputHelp();
  assert.match(help, /Usage: host lynx tasm/);
  assert.match(help, /Powered by @lynx-js\/tasm@0.0.53/);
  let called = false;
  tasm.commands[0]!.action(() => {
    called = true;
  });
  await program.parseAsync(['tasm', 'encode', '-i', 'unused', '-o', 'unused'], {
    from: 'user',
  });
  assert.equal(called, true);
  const offlineProgram = new Command().configureOutput({ writeOut: () => {} });
  registerTasmCommand(offlineProgram, f.runtime);
  offlineProgram.commands[0]!.outputHelp();
  assert.equal(f.requests.length, 0);
});
