// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: false,
      source: {
        entry: {
          'query-css-compat': './src/query-css-compat.ts',
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
});
