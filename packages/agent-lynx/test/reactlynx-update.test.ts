// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUpdatePath,
  parseUpdateValue,
} from '../src/commands/reactlynx/update.ts';

// ── parseUpdateValue ───────────────────────────────────────────────────────

test('parseUpdateValue: JSON scalars round-trip', () => {
  assert.equal(parseUpdateValue('42', { raw: false }), 42);
  assert.equal(parseUpdateValue('3.14', { raw: false }), 3.14);
  assert.equal(parseUpdateValue('true', { raw: false }), true);
  assert.equal(parseUpdateValue('false', { raw: false }), false);
  assert.equal(parseUpdateValue('null', { raw: false }), null);
  assert.equal(parseUpdateValue('"hello"', { raw: false }), 'hello');
});

test('parseUpdateValue: arrays and objects parse as plain JSON', () => {
  assert.deepStrictEqual(
    parseUpdateValue('[1,2,3]', { raw: false }),
    [1, 2, 3],
  );
  assert.deepStrictEqual(
    parseUpdateValue('{"a":1,"b":"two"}', { raw: false }),
    {
      a: 1,
      b: 'two',
    },
  );
});

test('parseUpdateValue: --raw bypasses JSON.parse and forwards the string', () => {
  // No quotes -> with `raw`, treated as a plain string. Without `raw`,
  // JSON.parse would throw because `hello` is not valid JSON.
  assert.equal(parseUpdateValue('hello', { raw: true }), 'hello');
  // Numbers and JSON-looking input are also forwarded verbatim under `--raw`.
  assert.equal(parseUpdateValue('42', { raw: true }), '42');
  assert.equal(parseUpdateValue('[1,2]', { raw: true }), '[1,2]');
});

test('parseUpdateValue: rejects invalid JSON with a hint about --raw', () => {
  assert.throws(
    () => parseUpdateValue('hello', { raw: false }),
    /<value> must be valid JSON.*--raw to send the input verbatim as a string/s,
  );
});

// ── buildUpdatePath ────────────────────────────────────────────────────────

test('buildUpdatePath: prepends the `root` sentinel that the App will drop', () => {
  // The App-side handler calls `path.split('.').slice(1)`, so the first
  // segment is always discarded. Match the panel's convention: "root".
  assert.equal(buildUpdatePath('count'), 'root.count');
  assert.equal(buildUpdatePath('user.name'), 'root.user.name');
  assert.equal(buildUpdatePath('items.0.title'), 'root.items.0.title');
});

test('buildUpdatePath: rejects empty paths and paths with empty segments', () => {
  assert.throws(() => buildUpdatePath(''), /must not be empty/);
  assert.throws(() => buildUpdatePath('a..b'), /empty segment/);
  assert.throws(() => buildUpdatePath('.a'), /empty segment/);
  assert.throws(() => buildUpdatePath('a.'), /empty segment/);
});
