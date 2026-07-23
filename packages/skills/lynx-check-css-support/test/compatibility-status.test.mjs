// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(
  new URL('../scripts/query-css-compat.mjs', import.meta.url),
);
const deprecatedProperty = 'linear-direction';
const deprecatedFeature = 'support_linear_orientation';

test('returns the selected compatibility status in JSON', async () => {
  // Given: the published base compatibility entry is deprecated.
  // When: the property is queried as JSON.
  const { stdout } = await execFileAsync(
    process.execPath,
    [cliPath, deprecatedProperty, '--feature', deprecatedFeature, '--json'],
    { encoding: 'utf8' },
  );
  const result = JSON.parse(stdout);

  // Then: consumers can report the selected entry's status directly.
  assert.deepEqual(result.status, {
    deprecated: true,
    experimental: false,
  });
});

test('prints a deprecated warning in human-readable output', async () => {
  // Given: the published base compatibility entry is deprecated.
  // When: the property is queried in the default human-readable format.
  const { stdout } = await execFileAsync(
    process.execPath,
    [cliPath, deprecatedProperty, '--feature', deprecatedFeature],
    { encoding: 'utf8' },
  );

  // Then: the warning is visible without requiring a second JSON query.
  assert.match(stdout, /^Status: deprecated$/m);
});
