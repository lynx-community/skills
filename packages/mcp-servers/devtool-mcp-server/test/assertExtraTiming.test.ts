// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test from 'node:test';
import { assertExtraTiming } from './utils/assertExtraTiming.ts';

test('extra timing requires an object and validates only present fields', () => {
  assert.throws(() => assertExtraTiming(undefined), /extra_timing object/);
  assert.doesNotThrow(() => assertExtraTiming({ container_init_start: 1 }));
  assert.throws(() => assertExtraTiming({ open_time: '1' }), /finite number/);
  assert.throws(
    () => assertExtraTiming({ prepare_template_start: Number.NaN }),
    /finite number/,
  );
  assert.throws(
    () => assertExtraTiming({ container_init_end: Number.POSITIVE_INFINITY }),
    /finite number/,
  );
});
