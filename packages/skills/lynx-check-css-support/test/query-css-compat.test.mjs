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

async function query(...args) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [cliPath, ...args, '--json'],
    { encoding: 'utf8' },
  );
  return JSON.parse(stdout);
}

test('reports a feature as requiring a newer Lynx version', async () => {
  // Given: display.grid was added to Android in Lynx 2.1.
  // When: compatibility is queried for Android on Lynx 2.0.
  const result = await query(
    'display',
    '--feature',
    'grid',
    '--backend',
    'android',
    '--lynx-version',
    '2.0',
  );

  // Then: the result preserves the introduction version and rejects 2.0.
  assert.deepEqual(result.package, {
    name: '@lynx-js/css-defines',
    version: '0.0.16',
    source: 'bundled',
  });
  assert.equal(result.property.name, 'display');
  assert.equal(result.feature, 'grid');
  assert.deepEqual(result.compatibility, [
    {
      backend: 'android',
      version_added: '2.1',
      availability: 'requires-newer-version',
    },
  ]);
});

test('reports a feature as available at its introduction version', async () => {
  // Given: display.grid was added to Android in Lynx 2.1.
  // When: compatibility is queried for Android on Lynx 2.1.
  const result = await query(
    'display',
    '--feature',
    'grid',
    '--backend',
    'android',
    '--lynx-version',
    '2.1',
  );

  // Then: the feature is available.
  assert.equal(result.compatibility[0].availability, 'available');
});

test('returns definition data when compat_data is null', async () => {
  // Given: the content definition has no compatibility data.
  // When: the property is queried.
  const result = await query('content');

  // Then: definition data remains available and compatibility is explicit.
  assert.equal(result.property.name, 'content');
  assert.equal(result.property.type, 'string');
  assert.equal(result.compatibility, null);
});

test('rejects a feature query when compat_data is null', async () => {
  // Given: the content definition has no compatibility data.
  // When: a nested feature is requested for that property.
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [cliPath, 'content', '--feature', 'definitely-not-real'],
      { encoding: 'utf8' },
    ),
    (error) => {
      assert(error instanceof Error);

      // Then: the CLI rejects the unverified feature instead of answering for content.
      assert.equal(error.code, 2);
      assert.match(
        error.stderr,
        /Unknown feature content\.definitely-not-real/,
      );
      return true;
    },
  );
});

test('rejects an unknown CSS property', async () => {
  // Given: a property absent from css-defines.
  // When: it is queried through the CLI.
  try {
    await execFileAsync(
      process.execPath,
      [cliPath, 'definitely-not-a-property'],
      { encoding: 'utf8' },
    );
    assert.fail('Expected the CLI to reject an unknown property');
  } catch (error) {
    assert(error instanceof Error);

    // Then: the CLI exits non-zero with an actionable error.
    assert.equal(error.code, 2);
    assert.match(error.stderr, /Unknown CSS property/);
  }
});

test('rejects inherited object properties as backend names', async () => {
  // Given: constructor exists on Object.prototype but is not a backend.
  // When: it is passed through the backend option.
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [cliPath, 'display', '--backend', 'constructor'],
      { encoding: 'utf8' },
    ),
    (error) => {
      assert(error instanceof Error);
      assert.equal(error.code, 2);
      assert.match(error.stderr, /Unknown backend/);
      return true;
    },
  );
});

test('preserves conditional support descriptors', async () => {
  // Given: a feature is gated by targetSdkVersion rather than a plain Lynx version.
  // When: compatibility is queried with a numeric Lynx target.
  const result = await query(
    'grid-template-columns',
    '--feature',
    'max-content',
    '--backend',
    'android',
    '--lynx-version',
    '3.1',
  );

  // Then: the condition is preserved instead of being misclassified by numeric comparison.
  assert.equal(result.compatibility[0].version_added, 'targetSdkVersion 3.1');
  assert.equal(result.compatibility[0].availability, 'conditional');
});

test('accepts optional feature metadata and array notes', async () => {
  // Given: cursor features omit status and grid-column support uses note arrays.
  // When: both definitions are queried.
  const cursor = await query('cursor', '--backend', 'clay_macos');
  const gridColumn = await query('grid-column', '--backend', 'android');

  // Then: both published shapes are returned without schema loss.
  assert.equal(cursor.compatibility[0].availability, 'available');
  assert.equal(gridColumn.compatibility[0].notes.length, 3);
  assert.match(
    gridColumn.compatibility[0].notes[0],
    /enableGridPlacementShorthands/,
  );
});

test('queries Lynx properties whose names start with a hyphen', async () => {
  // Given: -x-auto-font-size is a published Lynx CSS property.
  // When: it is passed in the normal positional property slot.
  const result = await query('-x-auto-font-size', '--backend', 'android');

  // Then: Commander does not reinterpret the property as an option.
  assert.equal(result.property.name, '-x-auto-font-size');
});

test('keeps command options distinct from leading-hyphen properties', async () => {
  // Given: a regular option appears before the positional property.
  // When: the command is invoked in Commander-supported option-first order.
  const result = await query('--backend', 'android', '-x-auto-font-size');

  // Then: the option and property are both interpreted correctly.
  assert.equal(result.property.name, '-x-auto-font-size');
  assert.equal(result.compatibility[0].backend, 'android');
});

test('keeps leading-hyphen option values distinct from properties', async () => {
  // Given: a feature-like option value starts with a hyphen.
  // When: it is passed after the regular display property.
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [cliPath, 'display', '--feature', '-not-a-feature'],
      { encoding: 'utf8' },
    ),
    (error) => {
      assert(error instanceof Error);

      // Then: the option value remains attached to display.
      assert.equal(error.code, 2);
      assert.match(error.stderr, /Unknown feature display\.-not-a-feature/);
      return true;
    },
  );
});

test('prints help without interpreting it as a CSS property', async () => {
  // Given: the standard help option.
  // When: help is requested without a property.
  const { stdout } = await execFileAsync(
    process.execPath,
    [cliPath, '--help'],
    { encoding: 'utf8' },
  );

  // Then: Commander prints usage and exits successfully.
  assert.match(stdout, /Usage: query-css-compat/);
});

test("preserves Commander's short help option", async () => {
  // Given: Commander also exposes the short help form.
  // When: -h is passed without a property.
  const { stdout } = await execFileAsync(process.execPath, [cliPath, '-h'], {
    encoding: 'utf8',
  });

  // Then: it prints usage instead of becoming a CSS property.
  assert.match(stdout, /Usage: query-css-compat/);
});

test('uses published names for all exceptional leading-hyphen files', async () => {
  // Given: four package filenames omit one hyphen from their definition name.
  const properties = [
    '-x-caret-gradient',
    '-x-caret-width',
    '-x-caret-height',
    '-x-caret-radius',
  ];

  // When: each published definition name is queried.
  for (const property of properties) {
    const result = await query(property);

    // Then: lookup verifies the JSON name rather than exposing the filename quirk.
    assert.equal(result.property.name, property);
  }
});

test('rejects a filename-derived name that is not a published property', async () => {
  // Given: x-caret-gradient appears only as a filename suffix.
  // When: the missing-hyphen spelling is queried.
  await assert.rejects(
    execFileAsync(process.execPath, [cliPath, 'x-caret-gradient'], {
      encoding: 'utf8',
    }),
    (error) => {
      assert(error instanceof Error);
      assert.equal(error.code, 2);
      assert.match(error.stderr, /Unknown CSS property/);
      return true;
    },
  );
});

test('accepts either published spec_url representation', async () => {
  // Given: text-decoration-thickness publishes spec_url as a string.
  // When: its compatibility is queried.
  const result = await query(
    'text-decoration-thickness',
    '--backend',
    'android',
  );

  // Then: the definition parses just like definitions with spec_url arrays.
  assert.equal(result.compatibility[0].availability, 'available');
});

test('queries case-sensitive and function-like compat feature keys', async () => {
  // Given: published compat_data uses keys such as circle(), Flex, and rotateX.
  // When: those keys are queried verbatim.
  const circle = await query('clip-path', '--feature', 'circle()');
  const flex = await query('gap', '--feature', 'Flex');
  const rotateX = await query('transform', '--feature', 'rotateX');

  // Then: each package-native key resolves without normalization.
  assert.equal(circle.feature, 'circle()');
  assert.equal(flex.feature, 'Flex');
  assert.equal(rotateX.feature, 'rotateX');
});

test('preserves nested compatibility feature data', async () => {
  // Given: linear-direction publishes nested compatibility feature entries.
  // When: its definition is queried.
  const result = await query('linear-direction');

  // Then: recursive data is preserved rather than stripped by validation.
  assert.ok(
    result.property.compat_data['linear-direction'].support_linear_direction
      .nested_value_1.__compat,
  );
});
