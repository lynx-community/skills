// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptsRoot = new URL('../scripts', import.meta.url);

test('rejects unreviewed fields in bundled definitions', async (t) => {
  // Given: a future package adds a field that this release does not understand.
  const root = await mkdtemp(join(tmpdir(), 'lynx-css-schema-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const copiedScripts = join(root, 'scripts');
  await cp(scriptsRoot, copiedScripts, { recursive: true });
  const definitionPath = join(
    copiedScripts,
    'css-defines',
    'css_defines',
    '24-display.json',
  );
  const definition = JSON.parse(await readFile(definitionPath, 'utf8'));
  definition.future_field = 'must be reviewed before use';
  await writeFile(definitionPath, `${JSON.stringify(definition)}\n`);

  // When: the modified definition is queried through the copied CLI.
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [join(copiedScripts, 'query-css-compat.mjs'), 'display', '--json'],
      { encoding: 'utf8' },
    ),
    (error) => {
      assert(error instanceof Error);

      // Then: schema drift fails closed instead of being stripped silently.
      assert.equal(error.code, 2);
      assert.match(error.stderr, /future_field/);
      return true;
    },
  );
});
