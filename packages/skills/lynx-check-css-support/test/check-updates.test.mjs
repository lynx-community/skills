// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import cssDefinesPackage from '@lynx-js/css-defines/package.json' with {
  type: 'json',
};

const { version: bundledVersion } = cssDefinesPackage;
const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(
  new URL('../scripts/query-css-compat.mjs', import.meta.url),
);

const [major, minor = 0, patch = 0] = bundledVersion.split('.').map(Number);
const newerVersion = [major, minor, patch + 1].join('.');
const olderVersion = patch > 0
  ? [major, minor, patch - 1].join('.')
  : minor > 0
  ? [major, minor - 1, 0].join('.')
  : major > 0
  ? [major - 1, 0, 0].join('.')
  : null;

async function runWithPreload(t, preloadSource, ...args) {
  const root = await mkdtemp(join(tmpdir(), 'lynx-css-update-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const preloadPath = join(root, 'mock-fetch.mjs');
  await writeFile(preloadPath, preloadSource);
  return execFileAsync(process.execPath, [cliPath, ...args], {
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
    `globalThis.fetch = async () => new Response(${
      JSON.stringify(fetchBody)
    }, { headers: { 'content-type': 'application/json' } });\n`,
    ...args,
  );
}

test('reports a newer dataset version without exposing registry metadata', async (t) => {
  // Given: the registry reports a newer numeric version plus untrusted text.
  const metadata = JSON.stringify({
    version: newerVersion,
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
    bundled_version: bundledVersion,
    latest_version: newerVersion,
    update_available: true,
  });
  assert.doesNotMatch(stdout, /untrusted registry narrative/);
});

test('reports when the bundled dataset is current', async (t) => {
  // Given: the registry version matches the bundled dataset.
  const metadata = JSON.stringify({ version: bundledVersion });

  // When: the standalone update check uses human-readable output.
  const { stdout, stderr } = await runWithFetch(t, metadata, '--check-updates');

  // Then: the CLI reports that no skill release update is needed.
  assert.equal(stderr, '');
  assert.equal(stdout, `Up to date: @lynx-js/css-defines@${bundledVersion}\n`);
});

test('reports when the registry version is older than the bundle', async (t) => {
  // Given: the registry reports a numeric version older than the bundle.
  assert.notEqual(olderVersion, null, 'No numeric version is older than 0.0.0');
  const metadata = JSON.stringify({ version: olderVersion });

  // When: the standalone update check uses human-readable output.
  const { stdout, stderr } = await runWithFetch(t, metadata, '--check-updates');

  // Then: the distinct no-update branch reports both versions.
  assert.equal(stderr, '');
  assert.equal(
    stdout,
    `No update available: bundled=${bundledVersion}; registry=${olderVersion}\n`,
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
    version: bundledVersion,
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
  const metadata = JSON.stringify({ version: bundledVersion });

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
  const metadata = JSON.stringify({ version: bundledVersion });
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
    execFileAsync(process.execPath, [cliPath], { encoding: 'utf8' }),
    (error) => {
      assert(error instanceof Error);

      // Then: the original required-property contract remains visible.
      assert.equal(error.code, 1);
      assert.match(error.stderr, /missing required argument 'property'/);
      return true;
    },
  );
});

test('rejects HTTP failures even when the response contains a valid version', async t => {
  await assert.rejects(
    runWithPreload(
      t,
      `globalThis.fetch = async () => new Response('{"version":"0.0.17"}', { status: 503 });`,
      '--check-updates',
    ),
    error => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /Unable to check for css-defines updates/);
      return true;
    },
  );
});

test('bounds streamed bytes and cancels oversized response bodies', async t => {
  const preload = `
    import assert from 'node:assert/strict';
    let canceled = false;
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.redirect, 'error');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.cache, 'no-store');
      return new Response(new ReadableStream({
        pull(controller) { controller.enqueue(new Uint8Array(32 * 1024)); },
        cancel() { canceled = true; },
      }));
    };
    process.on('exit', () => assert.equal(canceled, true));
  `;
  await assert.rejects(runWithPreload(t, preload, '--check-updates'), error => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Unable to check for css-defines updates/);
    assert.doesNotMatch(error.stderr, /AssertionError/);
    return true;
  });
});

test('accepts the exact response size boundary and decodes split UTF-8 sequences', async t => {
  const preload = `
    const text = JSON.stringify({ version: '0.0.17', padding: 'é' });
    const encoded = new TextEncoder().encode(text);
    const bytes = new Uint8Array(64 * 1024).fill(32);
    bytes.set(encoded);
    const split = encoded.indexOf(195) + 1;
    globalThis.fetch = async () => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    }));
  `;
  const { stdout, stderr } = await runWithPreload(
    t,
    preload,
    '--check-updates',
    '--json',
  );
  assert.equal(stderr, '');
  assert.equal(JSON.parse(stdout).latest_version, '0.0.17');
});

test(
  'aborts requests at the five-second deadline',
  { timeout: 10_000 },
  async t => {
    const preload = `
    import assert from 'node:assert/strict';
    let aborted = false;
    const keepAlive = setTimeout(() => {}, 9000);
    globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        aborted = true;
        clearTimeout(keepAlive);
        reject(signal.reason);
      }, { once: true });
    });
    process.on('exit', () => assert.equal(aborted, true));
  `;
    const start = Date.now();
    await assert.rejects(
      runWithPreload(t, preload, '--check-updates'),
      error => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Unable to check for css-defines updates/);
        assert.doesNotMatch(error.stderr, /AssertionError/);
        return true;
      },
    );
    assert(Date.now() - start >= 5000);
  },
);

test('rejects redirects without contacting their target', async t => {
  const preload = `
    import assert from 'node:assert/strict';
    import { createServer } from 'node:http';
    let targetRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === '/redirect') {
        response.writeHead(302, { location: '/target' });
        response.end();
      } else {
        targetRequests += 1;
        response.end('{"version":"0.0.17"}');
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const nativeFetch = globalThis.fetch;
    globalThis.fetch = async (_url, options) => {
      try {
        return await nativeFetch('http://127.0.0.1:' + server.address().port + '/redirect', options);
      } finally {
        server.closeAllConnections();
        server.close();
      }
    };
    process.on('exit', () => assert.equal(targetRequests, 0));
  `;
  await assert.rejects(runWithPreload(t, preload, '--check-updates'), error => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Unable to check for css-defines updates/);
    assert.doesNotMatch(error.stderr, /AssertionError/);
    return true;
  });
});

test('keeps the deadline active while reading the response body', async t => {
  const preload = `
    import assert from 'node:assert/strict';
    const originalTimeout = globalThis.setTimeout;
    let deadlineInstalled = false;
    globalThis.setTimeout = (callback, delay, ...args) => {
      if (delay === 5000) {
        deadlineInstalled = true;
        return originalTimeout(callback, 20, ...args);
      }
      return originalTimeout(callback, delay, ...args);
    };
    let aborted = false;
    const keepAlive = originalTimeout(() => {}, 1000);
    globalThis.fetch = async (_url, { signal }) => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"version":'));
        signal.addEventListener('abort', () => {
          aborted = true;
          clearTimeout(keepAlive);
          controller.error(signal.reason);
        }, { once: true });
      },
    }));
    process.on('exit', () => {
      assert.equal(deadlineInstalled, true);
      assert.equal(aborted, true);
    });
  `;
  await assert.rejects(runWithPreload(t, preload, '--check-updates'), error => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Unable to check for css-defines updates/);
    assert.doesNotMatch(error.stderr, /AssertionError/);
    return true;
  });
});
