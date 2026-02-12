// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: { trace_processor_api: './src/scripts/trace_processor_api.js' },
  },
  output: {
    target: 'node',
    distPath: { root: 'scripts' },
    filename: { js: '[name].mjs' },
    assetPrefix: './',
    minify: false,
  },
  tools: {
    rspack: {
      experiments: {
        outputModule: true,
      },
      output: {
        module: true,
        chunkFormat: 'module',
        library: { type: 'module' },
      },
    },
  },
});
