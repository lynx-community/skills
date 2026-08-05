// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path';
import { defineConfig } from '@rslib/core';

const buildTime = new Date();
const formattedBuildTime = `${buildTime.getFullYear()}-${String(
  buildTime.getMonth() + 1,
).padStart(2, '0')}-${String(buildTime.getDate()).padStart(2, '0')} ${String(
  buildTime.getHours(),
).padStart(2, '0')}:${String(buildTime.getMinutes()).padStart(2, '0')}`;

export default defineConfig({
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.BUILD_TIME': JSON.stringify(formattedBuildTime),
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          connector: './src/connector.ts',
        },
        tsconfigPath: './tsconfig.connector.json',
      },
      dts: {
        bundle: {
          bundledPackages: [],
        },
        distPath: './dist',
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        distPath: './dist',
      },
      // Keep @lynx-js/devtool-connector as the package's real runtime dependency.
      autoExternal: true,
      autoExtension: false,
    },
    {
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      dts: false,
      output: {
        filename: {
          js: '[name].mjs',
        },
        distPath: './dist',
      },
      // Keep @lynx-js/devtool-connector as the package's real runtime dependency.
      autoExternal: true,
      autoExtension: false,
      tools: {
        rspack: {
          output: {
            library: {
              type: 'modern-module',
              // See: https://v2.rspack.rs/config/output#outputlibrarypreservemodules
              preserveModules: path.resolve(import.meta.dirname, 'src'),
            },
          },
        },
      },
    },
  ],
});
