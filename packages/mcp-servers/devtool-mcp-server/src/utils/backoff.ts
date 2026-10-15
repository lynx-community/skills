// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface ExpBackoffOptions {
  retries?: number;
  min?: number;
  max?: number;
  jitter?: boolean;
  factor?: number;
}
export class AbortRetryError extends Error {
  constructor(message = 'Abort retries') {
    super(message);
    this.name = 'AbortRetryError';
  }
}

export async function expBackoff<T>(
  fn: () => Promise<T>,
  {
    retries = 5,
    min = 100,
    max = 5000,
    jitter = true,
    factor = 2,
  }: ExpBackoffOptions = {},
): Promise<T> {
  let delay = min;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof AbortRetryError) throw err;
      if (i === retries - 1) throw err;

      let wait = delay;
      if (jitter) {
        // 50% ~ 100% 之间的随机抖动
        wait = wait * (0.5 + Math.random() * 0.5);
      }

      await new Promise(resolve => setTimeout(resolve, wait));
      delay = Math.min(delay * factor, max);
    }
  }

  // 理论上不会走到这里
  throw new Error('expBackoff reached unreachable code');
}
