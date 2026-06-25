// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { copyPackageFiles } from '../src/lib.ts';

const tempDirs = [];

async function makePackage(files) {
  const dir = await mkdtemp(join(tmpdir(), 'build-plugin-copy-'));
  tempDirs.push(dir);

  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-package',
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
