// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { deflateSync } from 'node:zlib';

const execute = promisify(execFile);
const python = process.platform === 'win32' ? 'python' : 'python3';
const script = fileURLToPath(
  new URL('../scripts/fixture_tool.py', import.meta.url),
);
const fixture = `{
  "Action List": [{"Function Name": "setGlobalProps", "RecordMillisecond": 9007199254740993, "Params": {"global_props": {"theme": "dark"}}}],
  "Invoked Method Data": [{"Module Name": "DemoModule", "Method Name": "request", "Params": {"callback": ["31"]}}],
  "Callback": {"31": {"Params": {"returnValue": {"text": "Test 🧪", "list": []}}}},
  "Config": {"screenWidth": 1080, "screenHeight": 1920},
  "Component List": [{"Name": "view", "Type": 1}],
  "Scripts": {}, "SharedData": {}, "Debug Info": []
}`;

function run(...args) {
  return execute(python, [script, ...args], {
    timeout: 10_000,
    env: { ...process.env, NO_PROXY: '127.0.0.1', no_proxy: '127.0.0.1' },
  });
}

async function directory(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'recorder-fixture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('encode and decode preserve fixture data, Unicode and large integers', async t => {
  const root = await directory(t);
  const source = path.join(root, 'source.json');
  const encoded = path.join(root, 'encoded.fixture');
  const decoded = path.join(root, 'decoded.json');
  await writeFile(source, fixture);
  await run('encode', source, '-o', encoded);
  await run('decode', encoded, '-o', decoded);
  const result = await readFile(decoded, 'utf8');
  assert.deepEqual(JSON.parse(result), JSON.parse(fixture));
  assert.match(result, /"RecordMillisecond": 9007199254740993/u);
  assert.match(result, /Test 🧪/u);

  const special = '{"Action List": [], "values": [NaN, Infinity, -Infinity]}';
  await writeFile(source, special);
  await run('encode', source, '-o', encoded);
  const { stdout } = await run('decode', encoded);
  assert.match(stdout, /NaN,\s+Infinity,\s+-Infinity/u);
});

test('summary reads both a local fixture and a task-local HTTP URL', async t => {
  const root = await directory(t);
  const encoded = deflateSync(fixture).toString('base64');
  const file = path.join(root, 'recording.fixture');
  await writeFile(file, encoded);
  const server = http.createServer((_request, response) =>
    response.end(encoded)
  );
  t.after(() =>
    new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/fixture`;
  const local = await run('summary', file);
  const remote = await run('summary', url);
  assert.equal(remote.stdout, local.stdout);
  assert.match(local.stdout, /Action List: 1 entries/u);
  assert.match(local.stdout, /DemoModule: 1/u);
  assert.match(local.stdout, /Callback: 1 entries/u);
  assert.match(local.stdout, /Screen: 1080 x 1920/u);
});

test('roundtrip writes editable JSON for each supported zlib compression level', async t => {
  const root = await directory(t);
  const workdir = path.join(root, 'work');
  await mkdir(workdir);
  const file = path.join(root, 'recording.fixture');
  for (const level of [0, 1, 6, 9]) {
    await writeFile(file, deflateSync(fixture, { level }).toString('base64'));
    await run('roundtrip', file, '--workdir', workdir);
    const decoded = await readFile(path.join(workdir, 'decoded.json'), 'utf8');
    assert.deepEqual(JSON.parse(decoded), JSON.parse(fixture));
  }
});

test('invalid encoded input fails without creating an output file', async t => {
  const root = await directory(t);
  const file = path.join(root, 'invalid.fixture');
  const output = path.join(root, 'decoded.json');
  await writeFile(file, 'invalid fixture');
  await assert.rejects(run('decode', file, '-o', output), { code: 1 });
  await assert.rejects(access(output), { code: 'ENOENT' });
});

test('the public tool exposes local editing commands and rejects upload', async () => {
  const { stdout } = await run('--help');
  for (const command of ['decode', 'encode', 'summary', 'roundtrip']) {
    assert.ok(stdout.includes(command));
  }
  assert.doesNotMatch(stdout, /upload/u);
  await assert.rejects(run('upload', 'recording.fixture'), { code: 2 });
});
