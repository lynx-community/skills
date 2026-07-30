// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

test('builds the public Lynx API documentation skill', async () => {
  await execFileAsync(process.execPath, [resolve(packageRoot, 'build.mjs')], {
    cwd: packageRoot,
  });

  const skill = await readFile(resolve(packageRoot, 'SKILL.md'), 'utf8');
  assert.match(skill, /^---\nname: lynx-api-docs\n/m);
  assert.match(skill, /elements\/<element-name>\.md/);

  const elementDocs = await readFile(
    resolve(packageRoot, 'elements', 'scroll-view.md'),
    'utf8',
  );
  assert.match(elementDocs, /scroll-view/);

  const stalePath = resolve(packageRoot, 'elements', 'stale.md');
  await writeFile(stalePath, 'stale');

  try {
    await execFileAsync(process.execPath, [resolve(packageRoot, 'build.mjs')], {
      cwd: packageRoot,
    });
    await assert.rejects(access(stalePath), { code: 'ENOENT' });
  } finally {
    await rm(stalePath, { force: true });
  }
});

test('is not publishable as a standalone package', async () => {
  const packageManifest = JSON.parse(
    await readFile(resolve(packageRoot, 'package.json'), 'utf8'),
  );
  assert.equal(packageManifest.private, true);
});
