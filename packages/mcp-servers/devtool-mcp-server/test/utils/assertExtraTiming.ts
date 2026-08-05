// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';

const extraTimingKeys = [
  'prepare_template_start',
  'prepare_template_end',
  'container_init_start',
  'container_init_end',
  'open_time',
] as const;

export function assertExtraTiming(value: unknown): void {
  assert.ok(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    'Should include extra_timing object',
  );
  const extraTiming = value as Record<string, unknown>;
  for (const key of extraTimingKeys) {
    if (Object.hasOwn(extraTiming, key)) {
      assert.ok(
        typeof extraTiming[key] === 'number' &&
          Number.isFinite(extraTiming[key]),
        `extra_timing.${key} should be a finite number when present`,
      );
    }
  }
}
