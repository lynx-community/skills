// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(fileURLToPath(import.meta.url));
const localRequire = createRequire(import.meta.url);

function readPackageFile(
  req: NodeModule['require'],
  specifier: string,
  relativeFile: string,
): string {
  const pkgJsonPath = req.resolve(`${specifier}/package.json`);
  return readFileSync(resolve(dirname(pkgJsonPath), relativeFile), 'utf8')
    .trim();
}

function buildBundledLicenseHeader(): string {
  const acornLicense = readPackageFile(localRequire, 'acorn', 'LICENSE');
  const eslintScopePkgPath = localRequire.resolve('eslint-scope/package.json');
  const eslintScopeRequire = createRequire(eslintScopePkgPath);
  const eslintScopeLicense = readFileSync(
    resolve(dirname(eslintScopePkgPath), 'LICENSE'),
    'utf8',
  ).trim();
  const estraverseLicense = readPackageFile(
    eslintScopeRequire,
    'estraverse',
    'LICENSE.BSD',
  );

  return [
    '// Copyright 2026 The Lynx Authors. All rights reserved.',
    '// Licensed under the Apache License Version 2.0 that can be found in the',
    '// LICENSE file in the root directory of this source tree.',
    '',
    '/*!',
    ' * Bundled third-party software notices:',
    ' *',
    ' * --- acorn (MIT) ---',
    ...acornLicense.split('\n').map((line) => (line ? ` * ${line}` : ' *')),
    ' *',
    ' * --- eslint-scope (BSD-2-Clause) ---',
    ...eslintScopeLicense
      .split('\n')
      .map((line) => (line ? ` * ${line}` : ' *')),
    ' *',
    ' * --- estraverse & esrecurse (BSD-2-Clause) ---',
    ' * Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>',
    ' * Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>',
    ' *',
    ...estraverseLicense
      .split('\n')
      .map((line) => (line ? ` * ${line}` : ' *')),
    ' */',
  ].join('\n');
}

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: false,
      source: {
        entry: {
          'check-lynxml': './src/check-lynxml.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        distPath: './scripts',
      },
      autoExtension: false,
    },
  ],
  output: {
    target: 'node',
  },
  plugins: [
    {
      name: 'embed-third-party-licenses',
      setup(api) {
        api.onAfterBuild(() => {
          const outFile = resolve(packageDir, 'scripts/check-lynxml.mjs');
          const content = readFileSync(outFile, 'utf8');
          const header = buildBundledLicenseHeader();
          const shebang = '#!/usr/bin/env node\n';
          const updated = content.startsWith(shebang)
            ? `${shebang}${header}\n${content.slice(shebang.length)}`
            : `${shebang}${header}\n${content}`;
          writeFileSync(outFile, updated, 'utf8');
        });
      },
    },
  ],
});
