// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import pkg from '../package.json' with { type: 'json' };
import {
  isNewerVersion,
  resolveUpdateNotice,
  type UpdateNotice,
  withUpdateNotice,
} from '../src/update-notice.ts';

const NOTICE: UpdateNotice = {
  current: '1.0.64',
  latest: '1.0.76',
  message: 'agent-lynx 1.0.76 available, current 1.0.64',
};
const execFileAsync = promisify(execFile);

test('compares stable and prerelease SemVer without treating any difference as an update', () => {
  assert.equal(isNewerVersion('1.0.76', '1.0.64'), true);
  assert.equal(isNewerVersion('2.0.0-beta.1', '1.9.9'), true);
  assert.equal(isNewerVersion('2.0.0', '2.0.0-beta.9'), true);
  assert.equal(isNewerVersion('2.0.0-beta.10', '2.0.0-beta.2'), true);
  assert.equal(isNewerVersion('1.0.63', '1.0.64'), false);
  assert.equal(isNewerVersion('2.0.0-beta.1', '2.0.0'), false);
  assert.equal(isNewerVersion('1.0.64+new-build', '1.0.64+old-build'), false);
  assert.equal(isNewerVersion('not-semver', '1.0.64'), false);
});

test('resolves and caches the canonical package dist-tag', async (t) => {
  const cacheRoot = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-update-notice-'),
  );
  t.after(() => rm(cacheRoot, { force: true, recursive: true }));
  const requests: string[] = [];
  const env = {
    XDG_CACHE_HOME: cacheRoot,
    AGENT_LYNX_UPDATE_REGISTRY: 'https://registry.example.test/custom/',
  };
  const fetchImpl: typeof fetch = async (input) => {
    requests.push(String(input));
    return Response.json({ latest: '1.0.76' });
  };

  assert.deepEqual(
    await resolveUpdateNotice({
      currentVersion: '1.0.64',
      env,
      fetchImpl,
      now: () => 1_000,
    }),
    NOTICE,
  );
  assert.deepEqual(
    await resolveUpdateNotice({
      currentVersion: '1.0.64',
      env,
      fetchImpl: async () => assert.fail('fresh cache must avoid the registry'),
      now: () => 2_000,
    }),
    NOTICE,
  );
  assert.deepEqual(requests, [
    'https://registry.example.test/custom/-/package/agent-lynx/dist-tags',
  ]);
  const cache = JSON.parse(
    await readFile(
      path.join(cacheRoot, 'agent-lynx', 'update-check.json'),
      'utf8',
    ),
  ) as { latest: string };
  assert.equal(cache.latest, '1.0.76');
});

test('treats an empty XDG cache directory as unset', async (t) => {
  const cacheRoot = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-update-empty-xdg-'),
  );
  t.after(() => rm(cacheRoot, { force: true, recursive: true }));

  await resolveUpdateNotice({
    currentVersion: '1.0.64',
    env: { XDG_CACHE_HOME: '', LOCALAPPDATA: cacheRoot },
    fetchImpl: async () => Response.json({ latest: '1.0.76' }),
    now: () => 1_000,
  });

  const cache = JSON.parse(
    await readFile(
      path.join(cacheRoot, 'agent-lynx', 'update-check.json'),
      'utf8',
    ),
  ) as { latest: string };
  assert.equal(cache.latest, '1.0.76');
});

test('treats empty registry environment variables as unset', async (t) => {
  const cacheRoot = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-update-empty-registry-'),
  );
  t.after(() => rm(cacheRoot, { force: true, recursive: true }));
  const requests: string[] = [];

  for (const [name, registryEnv, expectedUrl] of [
    [
      'inherited',
      {
        AGENT_LYNX_UPDATE_REGISTRY: '',
        npm_config_registry: 'https://registry.example.test/fallback/',
      },
      'https://registry.example.test/fallback/-/package/agent-lynx/dist-tags',
    ],
    [
      'default',
      {
        AGENT_LYNX_UPDATE_REGISTRY: '',
        npm_config_registry: '',
        NPM_CONFIG_REGISTRY: '',
      },
      'https://registry.npmjs.org/-/package/agent-lynx/dist-tags',
    ],
  ] as const) {
    await resolveUpdateNotice({
      currentVersion: '1.0.64',
      env: { XDG_CACHE_HOME: path.join(cacheRoot, name), ...registryEnv },
      fetchImpl: async (input) => {
        requests.push(String(input));
        return Response.json({ latest: '1.0.76' });
      },
      now: () => 1_000,
    });
    assert.equal(requests.at(-1), expectedUrl);
  }
});

test('registry failures are silent and cached briefly', async (t) => {
  const cacheRoot = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-update-failure-'),
  );
  t.after(() => rm(cacheRoot, { force: true, recursive: true }));
  let fetchCount = 0;
  const env = { XDG_CACHE_HOME: cacheRoot };
  const fetchImpl: typeof fetch = async () => {
    fetchCount += 1;
    throw new Error('offline');
  };

  assert.equal(
    await resolveUpdateNotice({
      currentVersion: '1.0.64',
      env,
      fetchImpl,
      now: () => 1_000,
    }),
    null,
  );
  assert.equal(
    await resolveUpdateNotice({
      currentVersion: '1.0.64',
      env,
      fetchImpl,
      now: () => 2_000,
    }),
    null,
  );
  assert.equal(fetchCount, 1);
});

test('an explicit or inherited offline mode disables the registry request', async () => {
  for (const env of [
    { AGENT_LYNX_DISABLE_UPDATE_NOTICE: '1' },
    { CODEX_SANDBOX_NETWORK_DISABLED: '1' },
    { npm_config_offline: 'true' },
  ]) {
    assert.equal(
      await resolveUpdateNotice({
        currentVersion: '1.0.64',
        env,
        fetchImpl: async () =>
          assert.fail('disabled checks must not access the registry'),
      }),
      null,
    );
  }
});

test('writes every update notice to stderr without changing stdout', async () => {
  assert.equal('command' in NOTICE, false);
  for (const output of [
    '{\n  "ok": true\n}\n',
    '[\n  { "id": "client" }\n]\n',
    '{"first":true}\n{"second":true}\n',
    'snapshot tree\n',
  ]) {
    const stdout = memoryWriter();
    const stderr = memoryWriter();
    await withUpdateNotice(
      {
        argv: ['snapshot', '--json'],
        resolveNotice: async () => NOTICE,
        stderr: stderr.writer,
      },
      async () => void stdout.writer.write(output),
    );
    assert.equal(stdout.read(), output);
    assert.equal(stderr.read(), `${NOTICE.message}\n`);
  }
});

test('the real CLI entry keeps command stdout unchanged and writes the notice to stderr', async (t) => {
  const cacheRoot = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-update-cli-'),
  );
  t.after(() => rm(cacheRoot, { force: true, recursive: true }));
  const cacheDirectory = path.join(cacheRoot, 'agent-lynx');
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(
    path.join(cacheDirectory, 'update-check.json'),
    JSON.stringify({
      checkedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      latest: '99.0.0',
    }),
  );

  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    ['src/index.ts', 'skills', 'list'],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      env: {
        ...process.env,
        AGENT_LYNX_DISABLE_UPDATE_NOTICE: '',
        CODEX_SANDBOX_NETWORK_DISABLED: '1',
        XDG_CACHE_HOME: cacheRoot,
      },
    },
  );

  assert.equal(stderr, `agent-lynx 99.0.0 available, current ${pkg.version}\n`);
  assert.match(stdout, /^<available_skills>/u);
  assert.match(stdout, /<name>lynx-devtool<\/name>/u);
});

test('does not buffer streaming stdout while waiting for the notice', async () => {
  const stdout = memoryWriter();
  const stderr = memoryWriter();
  const deferred = Promise.withResolvers<UpdateNotice | null>();
  const execution = withUpdateNotice(
    {
      argv: ['get-console'],
      resolveNotice: () => deferred.promise,
      stderr: stderr.writer,
    },
    async () => {
      stdout.writer.write('{"event":1}\n');
      assert.equal(stdout.read(), '{"event":1}\n');
    },
  );
  assert.equal(stdout.read(), '{"event":1}\n');
  assert.equal(stderr.read(), '');
  deferred.resolve(NOTICE);
  await execution;
  assert.equal(stderr.read(), `${NOTICE.message}\n`);
});

function memoryWriter(): {
  read(): string;
  writer: { write: (chunk: string | Uint8Array) => boolean };
} {
  const chunks: Buffer[] = [];
  return {
    read: () => Buffer.concat(chunks).toString('utf8'),
    writer: {
      write(chunk) {
        chunks.push(
          typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk),
        );
        return true;
      },
    },
  };
}
