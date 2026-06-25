// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveDaemonEntryPath } from '../src/daemon/manager.ts';

test('resolveDaemonEntryPath resolves the source daemon entry from this package', () => {
  assert.equal(resolveDaemonEntryPath(), path.resolve('src/daemon/entry.ts'));
});

test('resolveDaemonEntryPath respects package imports in a built package', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'daemon-manager-'));
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  await fs.mkdir(path.join(tempDir, 'dist', 'daemon'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src', 'daemon'), { recursive: true });
  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify({
      type: 'module',
      imports: { '#daemon-entry': './dist/daemon/entry.js' },
    }),
  );
  await fs.writeFile(
    path.join(tempDir, 'dist', 'daemon', 'entry.js'),
    'export {};\n',
  );
  await fs.writeFile(
    path.join(tempDir, 'src', 'daemon', 'manager.js'),
    'export {};\n',
  );
  const expectedEntryPath = await fs.realpath(
    path.join(tempDir, 'dist', 'daemon', 'entry.js'),
  );

  assert.equal(
    resolveDaemonEntryPath(
      pathToFileURL(path.join(tempDir, 'src', 'daemon', 'manager.js')).href,
    ),
    expectedEntryPath,
  );
});
