// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';
import { gzipSync } from 'node:zlib';

import { Command } from 'commander';
import { registerTasmCommand } from '../src/commands/tasm.ts';
import { createProgram } from '../src/devtool.ts';
import {
  PUBLIC_TASM_PACKAGE,
  resolveTasmModule,
  type TasmPackage,
  type TasmRuntimeOptions,
} from '../src/tasm-package.ts';

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

function tarEntry(name: string, content: string, type = '0'): Buffer {
  const body = Buffer.from(content);
  const header = Buffer.alloc(512);
  header.write(name);
  header.write(body.length.toString(8).padStart(11, '0'), 124);
  header.write(type, 156);
  header.write('ustar', 257);
  header.fill(32, 148, 156);
  const checksum = header.reduce((sum, value) => sum + value, 0);
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148);
  return Buffer.concat([
    header,
    body,
    Buffer.alloc((512 - body.length % 512) % 512),
  ]);
}

function archiveFor(
  pkg: TasmPackage,
  source = codec,
  extra: Buffer = Buffer.alloc(0),
): Buffer {
  return gzipSync(Buffer.concat([
    tarEntry('package/package.json', JSON.stringify(pkg)),
    tarEntry('package/lepus.js', source),
    extra,
    Buffer.alloc(1024),
  ]));
}

function integrity(archive: Buffer): string {
  return `sha512-${createHash('sha512').update(archive).digest('base64')}`;
}

async function fixture(t: TestContext): Promise<{
  root: string;
  pkg: TasmPackage;
  archive: Buffer;
  runtime: TasmRuntimeOptions;
  requests: string[];
}> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-tasm-test-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const pkg = { ...PUBLIC_TASM_PACKAGE };
  const archive = archiveFor(pkg);
  pkg.integrity = integrity(archive);
  const requests: string[] = [];
  return {
    root,
    pkg,
    archive,
    requests,
    runtime: {
      package: pkg,
      env: { AGENT_LYNX_TASM_CACHE_DIR: root },
      fetchImpl: async url => {
        requests.push(String(url));
        return new Response(new Uint8Array(archive));
      },
    },
  };
}

test('downloads the exact package once, then verifies and reuses it offline', async t => {
  const f = await fixture(t);
  const first = await resolveTasmModule({
    ...f.runtime,
    env: { AGENT_LYNX_TASM_CACHE_DIR: path.relative(process.cwd(), f.root) },
  });
  assert.equal(path.isAbsolute(first.file), true);
  assert.equal(await fs.readFile(first.file, 'utf8'), codec);
  assert.deepEqual(f.requests, [
    'https://registry.npmjs.org/@lynx-js/tasm/-/tasm-0.0.53.tgz',
  ]);
  const offline = {
    ...f.runtime,
    env: { ...f.runtime.env, CODEX_SANDBOX_NETWORK_DISABLED: '1' },
  };
  assert.deepEqual(await resolveTasmModule(offline), first);
  // An altered extracted module is repaired from the verified archive before use.
  await fs.writeFile(first.file, 'throw Error("altered")');
  await resolveTasmModule(offline);
  assert.equal(await fs.readFile(first.file, 'utf8'), codec);
  assert.equal(f.requests.length, 1);
});

test('concurrent cache population publishes complete files and cleans temporary files', async t => {
  const f = await fixture(t);
  const results = await Promise.all(
    Array.from({ length: 8 }, () => resolveTasmModule(f.runtime)),
  );
  assert.equal(new Set(results.map(result => result.file)).size, 1);
  assert.deepEqual(
    (await fs.readdir(path.dirname(results[0]!.file))).sort(),
    [path.basename(results[0]!.file), 'package.tgz'].sort(),
  );
  assert.equal(await fs.readFile(results[0]!.file, 'utf8'), codec);
});

test('download integrity failures cannot populate the cache and a retry succeeds', async t => {
  const f = await fixture(t);
  await assert.rejects(
    resolveTasmModule({
      ...f.runtime,
      fetchImpl: async () => new Response('corrupt'),
    }),
    /integrity mismatch/,
  );
  assert.deepEqual(await fs.readdir(f.root), []);
  const result = await resolveTasmModule(f.runtime);
  await fs.writeFile(
    path.join(path.dirname(result.file), 'package.tgz'),
    'corrupt',
  );
  await resolveTasmModule(f.runtime);
  assert.equal(f.requests.length, 2);
});

test('wrong package identity and symlink/duplicate codec entries are rejected', async t => {
  const f = await fixture(t);
  for (
    const archive of [
      archiveFor({ ...f.pkg, name: '@other/tasm' }),
      archiveFor(
        f.pkg,
        codec,
        tarEntry('package/lepus.js', '/tmp/foreign', '2'),
      ),
      archiveFor(f.pkg, codec, tarEntry('package/lepus.js', codec)),
    ]
  ) {
    await assert.rejects(
      resolveTasmModule({
        ...f.runtime,
        package: { ...f.pkg, integrity: integrity(archive) },
        fetchImpl: async () => new Response(new Uint8Array(archive)),
      }),
      /Expected|Invalid or duplicate/,
    );
  }
  assert.deepEqual(await fs.readdir(f.root), []);
});

test('exact alternate versions cache metadata and stay in the configured package and registry', async t => {
  const f = await fixture(t);
  const pkg = { ...f.pkg, version: '0.0.52' };
  const archive = archiveFor(pkg);
  const requests: string[] = [];
  const runtime = {
    ...f.runtime,
    fetchImpl: (async (url: string | URL | Request) => {
      requests.push(String(url));
      return String(url).endsWith('.tgz')
        ? new Response(new Uint8Array(archive))
        : Response.json({
          name: pkg.name,
          version: pkg.version,
          dist: { integrity: integrity(archive) },
        });
    }) as typeof fetch,
  };
  const result = await resolveTasmModule(runtime, pkg.version);
  assert.equal(result.package.version, pkg.version);
  await resolveTasmModule({
    ...runtime,
    env: { ...runtime.env, CODEX_SANDBOX_NETWORK_DISABLED: '1' },
  }, pkg.version);
  assert.deepEqual(requests, [
    'https://registry.npmjs.org/@lynx-js/tasm/0.0.52',
    'https://registry.npmjs.org/@lynx-js/tasm/-/tasm-0.0.52.tgz',
  ]);
  for (
    const version of [
      'latest',
      '^0.0.52',
      '../escape',
      'https://example.test/a.tgz',
    ]
  ) {
    await assert.rejects(resolveTasmModule(runtime, version), /exact version/);
  }
});

test('unavailable network, HTTP failures and mismatched registry metadata fail without execution', async t => {
  const f = await fixture(t);
  await assert.rejects(
    resolveTasmModule({
      ...f.runtime,
      env: { ...f.runtime.env, CODEX_SANDBOX_NETWORK_DISABLED: '1' },
    }),
    /not cached and network access is disabled/,
  );
  await assert.rejects(
    resolveTasmModule({
      ...f.runtime,
      fetchImpl: async () => new Response(null, { status: 404 }),
    }),
    /HTTP 404/,
  );
  await assert.rejects(
    resolveTasmModule({
      ...f.runtime,
      fetchImpl: async () =>
        Response.json({ name: '@wrong/tasm', version: '0.0.52' }),
    }, '0.0.52'),
    /Invalid registry metadata/,
  );
  assert.equal(f.requests.length, 0);
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
  assert.equal(f.requests.length, 1);
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
