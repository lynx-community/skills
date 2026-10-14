// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig, globalIgnores, globals, js, ts } from '@rslint/core';
import headers from 'eslint-plugin-headers';

export default defineConfig([
  globalIgnores([
    '.pnpm-store/**',
    '**/.rslib/**',
    '**/coverage/**',
    'output/**',
    'target/**',
    '**/test/js/**',
    '**/lib/**',
    '**/expected/**',
    '**/rspack-expected/**',
    '**/__swc_snapshots__/**',
    '**/__snapshots__/**',
    'packages/tools/perfetto-trace-processor/vendor/**',
  ]),
  js.configs.recommended,
  ts.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    plugins: { headers },
    rules: {
      'headers/header-format': [
        'error',
        {
          source: 'string',
          style: 'line',
          content: [
            'Copyright (year) {authors}. All rights reserved.',
            'Licensed under the (license) that can be found in the',
            'LICENSE file in the root directory of this source tree.',
          ].join('\n'),
          variables: { authors: 'The Lynx Authors' },
          patterns: {
            year: {
              pattern: '\\d{4}',
              defaultValue: new Date().getFullYear().toString(),
            },
            license: {
              pattern: 'Apache License Version 2.0|MIT license',
              defaultValue: 'Apache License Version 2.0',
            },
          },
        },
      ],
    },
  },
]);
