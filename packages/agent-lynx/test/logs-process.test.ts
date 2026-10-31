// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test, type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

function startWatcher(t: TestContext, mode = 'silent') {
  const child = spawn(process.execPath, [
    fileURLToPath(new URL('./fixtures/logs-process.ts', import.meta.url)),
    mode,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = once(child, 'exit');
  t.after(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
    child.stdout.destroy();
  });
  let diagnostics = '';
  const ready = Promise.withResolvers<void>();
  const blocked = Promise.withResolvers<void>();
  child.stderr.on('data', (value: Buffer) => {
    diagnostics += value.toString();
    if (diagnostics.includes('Listening for HSR events')) ready.resolve();
    if (diagnostics.includes('Output blocked.')) blocked.resolve();
  });
  return {
    child,
    exited,
    ready: ready.promise,
    blocked: blocked.promise,
    get diagnostics() {
      return diagnostics;
    },
  };
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`logs process exits cleanly on real ${signal} while no events arrive`, {
    timeout: 5000,
  }, async (t) => {
    const watcher = startWatcher(t);
    await watcher.ready;
    watcher.child.kill(signal);
    const [code, exitSignal] = await watcher.exited;
    assert.equal(code, 0, watcher.diagnostics);
    assert.equal(exitSignal, null);
    assert.match(watcher.diagnostics, /Subscription disposed/);
  });
  test(
    `logs process cancels a blocked output pipe on ${signal} without waiting for its consumer`,
    {
      timeout: 5000,
    },
    async (t) => {
      const watcher = startWatcher(t, 'blocked');
      await watcher.blocked;
      // Leave stdout unread until the process exits: rejection of a write
      // promise alone must not leave the pending OS write keeping it alive.
      watcher.child.kill(signal);
      const [code, exitSignal] = await watcher.exited;
      watcher.child.stdout.destroy();
      assert.equal(code, 0, watcher.diagnostics);
      assert.equal(exitSignal, null);
      assert.match(watcher.diagnostics, /Subscription disposed/);
      assert.doesNotMatch(watcher.diagnostics, /Unhandled|EPIPE/);
    },
  );
}

test(
  'logs process tolerates a closed downstream pipe without an unhandled EPIPE',
  { timeout: 5000 },
  async (t) => {
    const watcher = startWatcher(t, 'events');
    await watcher.ready;
    await once(watcher.child.stdout, 'data');
    watcher.child.stdout.destroy();
    const [code, signal] = await watcher.exited;
    assert.equal(code, 0, watcher.diagnostics);
    assert.equal(signal, null);
    assert.match(watcher.diagnostics, /Subscription disposed/);
    assert.doesNotMatch(watcher.diagnostics, /Unhandled|EPIPE/);
  },
);
