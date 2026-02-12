// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from 'eslint/config';
import gitignore from 'eslint-config-flat-gitignore';
import headers from 'eslint-plugin-headers';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      // dependencies
      '**/node_modules/**',
      '.pnpm-store/**',

      // Outputs
      '**/.rslib/**',
      '**/.turbo/**',
      '**/coverage/**',
      'output/**',
      'target/**',
      '**/test/js',
      '**/dist/**',
      '**/lib/**',
      '.changeset/*',
      '**/CHANGELOG.md',
      '**/etc/*.md',

      // Test snapshots
      '**/expected/**',
      '**/rspack-expected/**',
      '**/__swc_snapshots__/**',
      '**/__snapshots__/**',

      // Configs
      'eslint.config.js',

      // auto-generated files
      // "skills/**",
      // "plugins/**",
      // "packages/skills/*/scripts/**",
      // "packages/plugins/*/skills/**",
      'packages/tools/perfetto-trace-processor/vendor/**',
    ],
  },
  gitignore(),
  tseslint.configs.recommended,
  {
    plugins: {
      headers,
    },
    ignores: ['**/*.md/*'],
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
          variables: {
            authors: 'The Lynx Authors',
          },
          patterns: {
            year: {
              pattern: '\\d{4}',
              defaultValue: new Date().getFullYear().toString(),
            },
            license: {
              pattern: ['Apache License Version 2.0', 'MIT license'].join('|'),
              defaultValue: 'Apache License Version 2.0',
            },
          },
        },
      ],
    },
  },
);
