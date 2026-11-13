// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';

import { Command } from 'commander';
import {
  registerTraceQueryCommands,
  runTraceQuery,
} from '../src/commands/trace-query.ts';
async function fixture(t: TestContext) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-processor cache-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return {
    root,
    env: {
      ...process.env,
      AGENT_LYNX_CACHE_DIR: root,
      CODEX_SANDBOX_NETWORK_DISABLED: '0',
    },
  };
}

test('help and invalid input do not populate the cache; offline analysis reports the processor phase', async t => {
  const { root, env } = await fixture(t);
  for (
    const key of [
      'AGENT_LYNX_CACHE_DIR',
      'CODEX_SANDBOX_NETWORK_DISABLED',
    ]
  ) {
    const original = process.env[key];
    t.after(() => {
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    });
  }
  process.env['AGENT_LYNX_CACHE_DIR'] = env.AGENT_LYNX_CACHE_DIR;
  process.env['CODEX_SANDBOX_NETWORK_DISABLED'] = '1';
  for (const name of ['query', 'event-summary']) {
    let output = '';
    const program = new Command().exitOverride().configureOutput({
      writeOut: value => {
        output += value;
      },
    });
    registerTraceQueryCommands(program.command('trace'));
    await assert.rejects(
      program.parseAsync(['trace', name, '--help'], { from: 'user' }),
      { code: 'commander.helpDisplayed' },
    );
    assert.match(output, /Downloaded with npm on first analysis/);
  }
  assert.deepEqual(await fs.readdir(root), []);
  await assert.rejects(
    runTraceQuery(path.join(root, 'missing.json'), 'SELECT 1'),
    { code: 'ENOENT' },
  );
  assert.deepEqual(await fs.readdir(root), []);
  const trace = path.join(root, 'trace.json');
  await fs.writeFile(trace, '{"traceEvents":[]}');
  const result = await runTraceQuery(trace, 'SELECT 1');
  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.parseSucceeded, false);
  assert.equal(result.error.phase, 'processor');
  assert.match(result.error.message, /not cached/);
  assert.deepEqual(await fs.readdir(root), ['trace.json']);
});
