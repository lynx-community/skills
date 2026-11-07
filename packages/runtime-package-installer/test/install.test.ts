// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test, type TestContext } from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { installRuntimePackages } from '../src/index.ts';

let fixtures: string;
let registry: string;
const server = createServer();
const packages = { 'runtime-fixture': '1.0.0' };

before(async () => {
  fixtures = await mkdtemp(
    path.join(os.tmpdir(), 'runtime-installer-fixture-'),
  );
  const source = path.join(fixtures, 'source');
  await mkdir(source);
  const manifest = {
    name: 'runtime-fixture',
    version: '1.0.0',
    type: 'module',
    exports: './entry.mjs',
    scripts: { postinstall: 'node install.cjs' },
  };
  await writeFile(path.join(source, 'package.json'), JSON.stringify(manifest));
  await writeFile(path.join(source, 'entry.mjs'), 'export default 42;');
  await writeFile(
    path.join(source, 'install.cjs'),
    String.raw`
    if (process.env.FAIL_INSTALL === '1') throw new Error('fixture failure');
    require('node:fs').appendFileSync(process.env.INSTALL_LOG, 'installed\n');
  `,
  );
  await promisify(execFile)('npm', [
    'pack',
    '--ignore-scripts',
    '--pack-destination',
    fixtures,
  ], {
    cwd: source,
    shell: process.platform === 'win32',
  });
  const archive = await readFile(
    path.join(fixtures, 'runtime-fixture-1.0.0.tgz'),
  );
  server.on('request', (req, res) => {
    if (req.url === '/package.tgz') return void res.end(archive);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      name: manifest.name,
      'dist-tags': { latest: manifest.version },
      versions: {
        [manifest.version]: {
          ...manifest,
          dist: { tarball: `${registry}/package.tgz` },
        },
      },
    }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  registry = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve())
  );
  await rm(fixtures, { recursive: true, force: true });
});

async function options(t: TestContext) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'runtime-installer cache-'),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  return {
    cacheDir: path.join(root, 'packages'),
    env: {
      ...process.env,
      CODEX_SANDBOX_NETWORK_DISABLED: '0',
      npm_config_registry: registry,
      npm_config_cache: path.join(root, 'npm'),
      INSTALL_LOG: path.join(root, 'installs.log'),
    },
  };
}

test('concurrent requests install once and reuse the completed cache offline', async t => {
  const config = await options(t);
  const directories = await Promise.all(
    [1, 2, 3].map(() => installRuntimePackages(packages, config)),
  );
  assert.equal(new Set(directories).size, 1);
  const directory = directories[0]!;
  const entry = pathToFileURL(
    path.join(directory, 'node_modules/runtime-fixture/entry.mjs'),
  ).href;
  assert.equal((await import(entry)).default, 42);
  assert.equal(await readFile(config.env.INSTALL_LOG, 'utf8'), 'installed\n');
  assert.equal(
    await installRuntimePackages(packages, {
      ...config,
      env: { ...config.env, PATH: '', CODEX_SANDBOX_NETWORK_DISABLED: '1' },
    }),
    directory,
  );
  assert.deepEqual(await readdir(config.cacheDir), [path.basename(directory)]);
});

test('failed installs leave no published cache, retry succeeds, and incomplete caches are repaired', async t => {
  const config = { ...await options(t), registry };
  // An explicit registry wins over npm's environment configuration.
  config.env.npm_config_registry = 'http://127.0.0.1:9';
  await assert.rejects(
    installRuntimePackages(packages, {
      ...config,
      env: { ...config.env, FAIL_INSTALL: '1' },
    }),
    /fixture failure/,
  );
  assert.deepEqual(await readdir(config.cacheDir), []);
  const directory = await installRuntimePackages(packages, config);
  await rm(path.join(directory, 'node_modules/runtime-fixture'), {
    recursive: true,
  });
  assert.equal(await installRuntimePackages(packages, config), directory);
  assert.equal(
    await readFile(config.env.INSTALL_LOG, 'utf8'),
    'installed\ninstalled\n',
  );
});
