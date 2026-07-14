// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const cliPath = new URL('../scripts/query-css-compat.mjs', import.meta.url);

async function runWithPreload(t, preloadSource, ...args) {
  const root = await mkdtemp(join(tmpdir(), 'lynx-css-update-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const preloadPath = join(root, 'mock-fetch.mjs');
  await writeFile(preloadPath, preloadSource);
  return execFileAsync(process.execPath, [cliPath.pathname, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_OPTIONS: `--import=${pathToFileURL(preloadPath).href}`,
    },
  });
}

async function runWithFetch(t, fetchBody, ...args) {
  return runWithPreload(
    t,
    `globalThis.fetch = async () => new Response(${JSON.stringify(fetchBody)}, { headers: { 'content-type': 'application/json' } });\n`,
    ...args,
  );
}

test('reports a newer dataset version without exposing registry metadata', async (t) => {
  // Given: the registry reports a newer numeric version plus untrusted text.
  const metadata = JSON.stringify({
    version: '0.0.17',
    description: 'untrusted registry narrative',
  });

  // When: the standalone update check is requested as JSON.
  const { stdout, stderr } = await runWithFetch(
    t,
    metadata,
    '--check-updates',
    '--json',
  );

  // Then: only validated version data is reported and nothing is changed.
  assert.equal(stderr, '');
  assert.deepEqual(JSON.parse(stdout), {
    package: '@lynx-js/css-defines',
    bundled_version: '0.0.16',
    latest_version: '0.0.17',
    update_available: true,
  });
  assert.doesNotMatch(stdout, /untrusted registry narrative/);
});

test('reports when the bundled dataset is current', async (t) => {
  // Given: the registry version matches the bundled dataset.
  const metadata = JSON.stringify({ version: '0.0.16' });

  // When: the standalone update check uses human-readable output.
  const { stdout, stderr } = await runWithFetch(t, metadata, '--check-updates');

  // Then: the CLI reports that no skill release update is needed.
  assert.equal(stderr, '');
  assert.equal(stdout, 'Up to date: @lynx-js/css-defines@0.0.16\n');
});

test('reports when the registry version is older than the bundle', async (t) => {
  // Given: the registry reports a numeric version older than the bundle.
  const metadata = JSON.stringify({ version: '0.0.15' });

  // When: the standalone update check uses human-readable output.
  const { stdout, stderr } = await runWithFetch(t, metadata, '--check-updates');

  // Then: the distinct no-update branch reports both versions.
  assert.equal(stderr, '');
  assert.equal(
    stdout,
    'No update available: bundled=0.0.16; registry=0.0.15\n',
  );
});

test('fails closed when registry metadata has an invalid version', async (t) => {
  // Given: the registry response does not contain a numeric package version.
  const metadata = JSON.stringify({
    version: 'latest',
    description: 'must not be echoed',
  });

  // When: the update check parses that response.
  await assert.rejects(
    runWithFetch(t, metadata, '--check-updates'),
    (error) => {
      assert(error instanceof Error);

      // Then: the command fails without exposing arbitrary registry content.
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unable to check for css-defines updates/);
      assert.doesNotMatch(error.stderr, /must not be echoed/);
      return true;
    },
  );
});

test('rejects oversized registry metadata', async (t) => {
  // Given: the registry response exceeds the update check's metadata limit.
  const metadata = JSON.stringify({
    version: '0.0.17',
    padding: 'x'.repeat(65 * 1024),
  });

  // When: the update check receives that response.
  await assert.rejects(
    runWithFetch(t, metadata, '--check-updates'),
    (error) => {
      assert(error instanceof Error);

      // Then: the command fails without processing or echoing the payload.
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unable to check for css-defines updates/);
      assert.doesNotMatch(error.stderr, /xxxx/);
      return true;
    },
  );
});

test('fails closed when the registry request fails', async (t) => {
  // Given: the network boundary rejects the registry request.
  const preloadSource =
    "globalThis.fetch = async () => { throw new TypeError('network unavailable'); };\n";

  // When: the update check cannot fetch metadata.
  await assert.rejects(
    runWithPreload(t, preloadSource, '--check-updates'),
    (error) => {
      assert(error instanceof Error);

      // Then: the CLI returns its generic failure contract on stderr only.
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /Unable to check for css-defines updates/);
      assert.doesNotMatch(error.stderr, /network unavailable/);
      return true;
    },
  );
});

test('keeps the update check separate from compatibility queries', async (t) => {
  // Given: a property is supplied with the standalone update-check flag.
  const metadata = JSON.stringify({ version: '0.0.17' });

  // When: the incompatible modes are requested together.
  await assert.rejects(
    runWithFetch(t, metadata, 'display', '--check-updates'),
    (error) => {
      assert(error instanceof Error);

      // Then: Commander rejects the combination before querying either source.
      assert.equal(error.code, 1);
      assert.match(error.stderr, /cannot be combined/);
      return true;
    },
  );
});

test('rejects every compatibility filter in update-check mode', async (t) => {
  // Given: each compatibility-only filter is combined with update-check mode.
  const metadata = JSON.stringify({ version: '0.0.17' });
  const filters = [
    ['--backend', 'ios'],
    ['--feature', 'grid'],
    ['--lynx-version', '3.4'],
  ];

  // When: each incompatible filter is requested without a property.
  for (const filter of filters) {
    await assert.rejects(
      runWithFetch(t, metadata, '--check-updates', ...filter),
      (error) => {
        assert(error instanceof Error);

        // Then: Commander rejects every combination before fetching metadata.
        assert.equal(error.code, 1);
        assert.match(error.stderr, /cannot be combined/);
        return true;
      },
    );
  }
});

test('still requires a property for compatibility queries', async () => {
  // Given: neither a property nor the standalone update-check flag is supplied.
  // When: the CLI is invoked without arguments.
  await assert.rejects(
    execFileAsync(process.execPath, [cliPath.pathname], { encoding: 'utf8' }),
    (error) => {
      assert(error instanceof Error);

      // Then: the original required-property contract remains visible.
      assert.equal(error.code, 1);
      assert.match(error.stderr, /missing required argument 'property'/);
      return true;
    },
  );
});
