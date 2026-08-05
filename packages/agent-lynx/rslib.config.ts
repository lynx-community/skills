// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path';
import { defineConfig } from '@rslib/core';
import { CopyRspackPlugin } from '@rspack/core';

const buildTime = new Date();
const formattedBuildTime = `${buildTime.getFullYear()}-${String(buildTime.getMonth() + 1).padStart(2, '0')}-${String(
  buildTime.getDate(),
).padStart(
  2,
  '0',
)} ${String(buildTime.getHours()).padStart(2, '0')}:${String(buildTime.getMinutes()).padStart(2, '0')}`;

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
      connector: './src/connector.ts',
      'daemon-entry':
        './node_modules/@lynx-js/devtool-connector/src/daemon/entry.ts',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.BUILD_TIME': JSON.stringify(formattedBuildTime),
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: false,
      output: {
        filename: {
          js: '[name].mjs',
        },
        distPath: './scripts',
      },
      autoExtension: false,
    },
  ],
  tools: {
    rspack: {
      output: {
        library: {
          type: 'modern-module',
          preserveModules: path.resolve(import.meta.dirname, 'src/commands'),
        },
      },
      plugins: [
        new CopyRspackPlugin({
          patterns: [
            {
              from: './node_modules/@lynx-js/devtool-connector/public',
              to: path.resolve(import.meta.dirname, 'public'),
            },
          ],
        }),
      ],
    },
  },
});
