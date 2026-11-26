// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint({ throwOn: 'suggestion' })],
  syntax: 'es2022',
  lib: [
    {
      source: {
        entry: {
          index: './src/index.ts',
          'schema/index': './src/schema/index.ts',
          'tools/index': './src/tools/index.ts',
          'utils/index': './src/utils/index.ts',
        },
      },
      dts: { bundle: { bundledPackages: [] } },
    },
    {
      source: { entry: { main: './src/main.ts' } },
      dts: false,
      output: { autoExternal: { peerDependencies: false } },
    },
  ],
});
