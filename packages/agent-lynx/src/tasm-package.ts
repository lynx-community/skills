// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { installRuntimePackages } from '@lynx-js/runtime-package-installer';
import { createRequire } from 'node:module';
import path from 'node:path';
import { runtimeCacheDirectory } from './runtime-cache.ts';

export interface TasmPackage {
  name: string;
  version: string;
  registry?: string;
}

export const PUBLIC_TASM_PACKAGE: Readonly<TasmPackage> = {
  name: '@lynx-js/tasm',
  version: '0.0.53',
};

export interface TasmRuntimeOptions {
  package?: Readonly<TasmPackage>;
  env?: NodeJS.ProcessEnv;
}

export function validateTasmVersion(version: string): string {
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-zA-Z]+(?:[.-][\da-zA-Z]+)*)?$/u
      .test(version)
  ) {
    throw new Error(
      'TASM codec version must be an exact version, such as 0.0.53; tags, ranges and URLs are not supported.',
    );
  }
  return version;
}

export async function resolveTasmModule(
  options: TasmRuntimeOptions = {},
  requestedVersion?: string,
): Promise<{ file: string; package: Readonly<TasmPackage>; }> {
  const defaults = options.package ?? PUBLIC_TASM_PACKAGE;
  const version = validateTasmVersion(requestedVersion ?? defaults.version);
  const pkg = { ...defaults, version };
  const env = options.env ?? process.env;
  const directory = await installRuntimePackages(
    { [pkg.name]: version },
    {
      cacheDir: path.join(runtimeCacheDirectory(env), 'npm'),
      ...(pkg.registry ? { registry: pkg.registry } : {}),
      env,
    },
  );
  const require = createRequire(path.join(directory, 'package.json'));
  return { file: require.resolve(`${pkg.name}/lepus.js`), package: pkg };
}
