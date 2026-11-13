// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

import { lock } from 'proper-lockfile';
import { valid } from 'semver';

export interface RuntimePackageOptions {
  /** Caller-owned cache root. Complete installations are immutable children. */
  cacheDir: string;
  /** Omit to use npm's default configuration. */
  registry?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
  timeout?: number;
}

const execFileAsync = promisify(execFile);

async function isInstalled(
  directory: string,
  packages: Array<[string, string]>,
): Promise<boolean> {
  try {
    return (await Promise.all(packages.map(async ([name, version]) => {
      const manifest = JSON.parse(
        await readFile(
          path.join(directory, 'node_modules', name, 'package.json'),
          'utf8',
        ),
      );
      return manifest?.name === name && manifest.version === version;
    }))).every(Boolean);
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === 'ENOENT'
      || error instanceof SyntaxError
    ) return false;
    throw error;
  }
}

/** Install exact versions (including any peers) and return their npm project directory. */
export async function installRuntimePackages(
  dependencies: Record<string, string>,
  options: RuntimePackageOptions,
): Promise<string> {
  const packages = Object.entries(dependencies).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  if (
    !packages.length
    || packages.some(([, version]) => valid(version) !== version)
  ) {
    throw new Error('Runtime packages require exact versions.');
  }
  const key = createHash('sha256').update(JSON.stringify({
    packages,
    registry: options.registry ?? null,
    platform: process.platform,
    arch: process.arch,
    abi: process.versions.modules,
  })).digest('hex');
  const directory = path.resolve(options.cacheDir, key);
  options.signal?.throwIfAborted();
  if (await isInstalled(directory, packages)) return directory;

  const env = options.env ?? process.env;
  if (env['CODEX_SANDBOX_NETWORK_DISABLED'] === '1') {
    throw new Error(
      `Runtime packages are not cached. Run once with network access to populate ${directory}.`,
    );
  }
  const timeout = options.timeout ?? 120_000;
  const deadline = Date.now() + timeout;
  await mkdir(path.dirname(directory), { recursive: true });
  let release: () => Promise<void>;
  while (true) {
    options.signal?.throwIfAborted();
    try {
      release = await lock(directory, { realpath: false });
      break;
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'ELOCKED'
        || Date.now() >= deadline
      ) throw error;
      await delay(100, undefined, { signal: options.signal });
    }
  }
  let staging: string | undefined;
  try {
    if (await isInstalled(directory, packages)) return directory;
    // Only publish after npm finishes. A crashed install cannot become a cache
    // hit, and any surviving child can only write into its own temporary tree.
    staging = await mkdtemp(`${directory}.tmp-`);
    await writeFile(
      path.join(staging, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: Object.fromEntries(packages),
      }),
    );
    process.stderr.write(
      `Installing runtime packages: ${
        packages.map(([name, version]) => `${name}@${version}`).join(', ')
      }...\n`,
    );
    await execFileAsync('npm', [
      'install',
      '--prefix=.',
      '--global=false',
      '--workspaces=false',
      '--no-audit',
      '--no-fund',
      '--ignore-scripts=false',
      '--progress=false',
      '--fetch-retries=1',
      ...(options.registry ? [`--registry=${options.registry}`] : []),
    ], {
      cwd: staging,
      env,
      timeout,
      ...(options.signal ? { signal: options.signal } : {}),
      shell: process.platform === 'win32',
      windowsHide: true,
    });
    if (!await isInstalled(staging, packages)) {
      throw new Error('npm did not install the requested runtime packages.');
    }
    await rm(directory, { recursive: true, force: true });
    await rename(staging, directory);
    return directory;
  } finally {
    try {
      if (staging) await rm(staging, { recursive: true, force: true });
    } finally {
      await release();
    }
  }
}
