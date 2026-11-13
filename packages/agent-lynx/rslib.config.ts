// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core';
import { createRequire } from 'node:module';
import path from 'node:path';
import packageJson from './package.json' with { type: 'json' };

const SKILL_PACKAGE_PATTERN = /^@[^/]+\/skill-([^/]+)$/u;
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const packageRequire = createRequire(import.meta.url);
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const skillsOutputRoot = path.resolve(import.meta.dirname, 'skills');

const skillCopies = Object.keys(packageJson.devDependencies)
  .filter((name) => SKILL_PACKAGE_PATTERN.test(name))
  .sort()
  .map((packageName) => {
    const skillName = SKILL_PACKAGE_PATTERN.exec(packageName)![1]!;
    return {
      context: path.dirname(
        packageRequire.resolve(`${packageName}/package.json`),
      ),
      from: '{SKILL.md,{scripts,references,assets,examples}/**/*}',
      to: path.join(skillsOutputRoot, skillName),
      info: { minimized: true },
    };
  });

export default defineConfig({
  exports: {
    source: true,
    include: ['connector', 'cli'],
    custom: {
      './bin': './dist/index.mjs',
      './package.json': './package.json',
    },
  },
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
      output: {
        copy: skillCopies,
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
