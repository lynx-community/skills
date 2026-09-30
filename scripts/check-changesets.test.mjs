// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const checker = fileURLToPath(
  new URL('./check-changesets.mjs', import.meta.url),
);

async function fixture(t, record) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'oss-changesets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, '.changeset'));
  await mkdir(path.join(directory, 'packages/public'), { recursive: true });
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      private: true,
      name: 'metadata-fixture',
      version: '1.0.0',
    }),
  );
  await writeFile(
    path.join(directory, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*\n',
  );
  await writeFile(
    path.join(directory, 'packages/public/package.json'),
    JSON.stringify({ name: '@fixture/public', version: '1.0.0' }),
  );
  await writeFile(
    path.join(directory, '.changeset/config.json'),
    JSON.stringify({
      changelog: false,
      commit: false,
      fixed: [],
      linked: [],
      access: 'public',
      baseBranch: 'main',
      updateInternalDependencies: 'patch',
      ignore: [],
    }),
  );
  if (record !== undefined) {
    await writeFile(path.join(directory, '.changeset/existing.md'), record);
  }
  return directory;
}

test('validates existing metadata without a Git repository or local main', async (t) => {
  const directory = await fixture(
    t,
    '---\n"@fixture/public": patch\n---\nExisting release intent.\n',
  );
  const result = await exec(process.execPath, [checker], { cwd: directory });
  assert.match(
    result.stdout,
    /Validated 1 changesets; 1 pending package releases/,
  );
});

test('accepts synchronized source without a duplicate OSS release record', async (t) => {
  const directory = await fixture(t);
  await writeFile(
    path.join(directory, 'packages/public/index.js'),
    'export const synchronized = true;\n',
  );
  const result = await exec(process.execPath, [checker], { cwd: directory });
  assert.match(
    result.stdout,
    /Validated 0 changesets; 0 pending package releases/,
  );
});

test('rejects a changeset for an unknown package', async (t) => {
  const directory = await fixture(
    t,
    '---\n"@fixture/missing": patch\n---\nInvalid release intent.\n',
  );
  await assert.rejects(exec(process.execPath, [checker], { cwd: directory }), {
    code: 1,
    stderr: /@fixture\/missing/,
  });
});

test('rejects malformed changeset metadata', async (t) => {
  const directory = await fixture(
    t,
    '---\n"@fixture/public": [\n---\nBroken YAML.\n',
  );
  await assert.rejects(exec(process.execPath, [checker], { cwd: directory }), {
    code: 1,
  });
});
