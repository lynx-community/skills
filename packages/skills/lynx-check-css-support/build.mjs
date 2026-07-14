// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve('@lynx-js/css-defines/package.json');
const packageRoot = dirname(packageJsonPath);
const targetRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'scripts/css-defines',
);

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });
await Promise.all([
  copyFile(packageJsonPath, resolve(targetRoot, 'package.json')),
  cp(resolve(packageRoot, 'css_defines'), resolve(targetRoot, 'css_defines'), {
    recursive: true,
  }),
]);
