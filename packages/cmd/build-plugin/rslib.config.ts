// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: false,
      source: {
        entry: {
          main: './src/main.ts',
        },
      },
    },
  ],
});
