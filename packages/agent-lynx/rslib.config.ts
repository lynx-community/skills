// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core';
import path from 'node:path';

export default defineConfig({
  autoExtension: false,
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
  syntax: 'es2022',
  output: {
    autoExternal: true,
    filename: {
      js: '[name].mjs',
    },
    distPath: './dist',
  },
  lib: [
    {
      source: {
        entry: {
          connector: './src/connector.ts',
          cli: './src/cli.ts',
        },
        tsconfigPath: './tsconfig.connector.json',
      },
      dts: {
        bundle: {
          bundledPackages: ['commander'],
        },
      },
    },
    {
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      tools: {
        rspack: {
          output: {
            // preserveModules needs a string filename to retain .mjs in multi-lib builds.
            filename: '[name].mjs',
            library: {
              type: 'modern-module',
              // See: https://v2.rspack.rs/config/output#outputlibrarypreservemodules
              // eslint-disable-next-line n/no-unsupported-features/node-builtins
              preserveModules: path.resolve(import.meta.dirname, 'src'),
            },
          },
        },
      },
    },
  ],
});
