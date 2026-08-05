// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { setTimeout as delay } from 'node:timers/promises';

/** Race an operation against a deadline and always cancel the losing timer. */
export async function raceWithTimeout<T, TimeoutValue>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  timeoutValue: TimeoutValue,
  options?: { signal?: AbortSignal },
): Promise<T | TimeoutValue> {
  const controller = new AbortController();
  const signal = options?.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  const timeout = delay(timeoutMs, timeoutValue, { signal });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    controller.abort();
    await timeout.catch(() => {});
  }
}
