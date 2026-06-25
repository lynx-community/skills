// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint({ throwOn: 'suggestion' })],
  source: {
    entry: {
      'daemon/entry': './src/daemon/entry.ts',
      'daemon/index': './src/daemon/index.ts',
      index: './src/index.ts',
      'transport/index': './src/transport/index.ts',
      'streams/index': './src/streams/index.ts',
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: {
        bundle: false,
      },
    },
  ],
});
