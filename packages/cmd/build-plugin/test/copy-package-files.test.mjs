// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { copyPackageFiles, exportPlugin } from '../src/lib.ts';

const tempDirs = [];

async function makePackage(files, name = 'test-package') {
  const dir = await mkdtemp(join(tmpdir(), 'build-plugin-copy-'));
  tempDirs.push(dir);

  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '1.0.0',
        files,
      },
      null,
      2,
    ),
  );
  await writeFile(join(dir, 'SKILL.md'), '# Test Skill\n');

  const target = join(dir, 'out');
  await mkdir(target);
  return { source: dir, target };
}

after(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

test('copies package.json when package files explicitly include it', async () => {
  const { source, target } = await makePackage(['package.json', 'SKILL.md']);

  await copyPackageFiles(source, target, true);

  assert.equal(existsSync(join(target, 'SKILL.md')), true);
  assert.equal(existsSync(join(target, 'package.json')), true);
});

test('skips package.json when package files do not explicitly include it', async () => {
  const { source, target } = await makePackage(['SKILL.md']);

  await copyPackageFiles(source, target, true);

  assert.equal(existsSync(join(target, 'SKILL.md')), true);
  assert.equal(existsSync(join(target, 'package.json')), false);
});

test('excludes root README.md and CHANGELOG.md when exporting payloads', async () => {
  const { source, target } = await makePackage(['SKILL.md', 'CHANGELOG.md']);
  await writeFile(join(source, 'README.md'), '# Readme\n');
  await writeFile(join(source, 'CHANGELOG.md'), '# Changelog\n');

  await copyPackageFiles(source, target, true);

  assert.equal(existsSync(join(target, 'SKILL.md')), true);
  assert.equal(existsSync(join(target, 'README.md')), false);
  assert.equal(existsSync(join(target, 'CHANGELOG.md')), false);
});

test('excludes evals and stale files when exporting a skill package', async () => {
  const { source, target } = await makePackage(
    ['SKILL.md', 'CHANGELOG.md', 'evals', 'references'],
    '@lynx-js/skill-example',
  );
  await mkdir(join(source, 'evals'), { recursive: true });
  await mkdir(join(source, 'references'), { recursive: true });
  await mkdir(join(target, 'evals'), { recursive: true });
  await writeFile(join(source, 'CHANGELOG.md'), '# Changelog\n');
  await writeFile(join(source, 'evals', 'evals.json'), '{}\n');
  await writeFile(join(source, 'references', 'guide.md'), '# Guide\n');
  await writeFile(join(target, 'evals', 'stale.json'), '{}\n');

  await exportPlugin(source, target);

  assert.equal(existsSync(join(target, 'SKILL.md')), true);
  assert.equal(existsSync(join(target, 'references', 'guide.md')), true);
  assert.equal(existsSync(join(target, 'CHANGELOG.md')), false);
  assert.equal(existsSync(join(target, 'evals')), false);
});
