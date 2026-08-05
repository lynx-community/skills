// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert';
import { createHook } from 'node:async_hooks';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { raceWithTimeout } from '../src/utils/raceWithTimeout.ts';

test('raceWithTimeout destroys the losing timer instead of only unrefing it', async () => {
  const liveTimeouts = new Set<number>();
  const hook = createHook({
    init(asyncId, type) {
      if (type === 'Timeout') {
        liveTimeouts.add(asyncId);
      }
    },
    destroy(asyncId) {
      liveTimeouts.delete(asyncId);
    },
  });
  hook.enable();

  try {
    assert.equal(
      await raceWithTimeout(
        Promise.resolve('done'),
        10_000,
        'timeout' as const,
      ),
      'done',
    );
    await setImmediate();
    assert.deepEqual(liveTimeouts, new Set());
  } finally {
    hook.disable();
  }
});
