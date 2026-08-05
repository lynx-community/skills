// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TarballCache } from '../src/daemon/tarball-cache.ts';

test('TarballCache propagates download failures to waiters', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('tarball download interrupted');
  });

  const cache = new TarballCache();
  cache.start('https://example.com/devtool.tar.gz');

  await assert.rejects(
    cache.waitFor('inspector.html'),
    /tarball download interrupted/,
  );
  assert.equal(cache.isDone, true);
});

test('TarballCache propagates a rejected tarball response to waiters', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 503 }),
  );

  const cache = new TarballCache();
  cache.start('https://example.com/devtool.tar.gz');

  await assert.rejects(
    cache.waitFor('inspector.html'),
    /Failed to fetch tarball: 503/,
  );
  assert.equal(cache.isDone, true);
});

test('TarballCache resolves null for absent files once loading finished', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 503 }),
  );

  const cache = new TarballCache();
  cache.start('https://example.com/devtool.tar.gz');
  await assert.rejects(cache.waitFor('inspector.html'));

  assert.equal(cache.get('inspector.html'), undefined);
});
