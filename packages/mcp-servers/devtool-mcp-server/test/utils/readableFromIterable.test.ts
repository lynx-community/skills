// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readableFromIterable } from '../../src/utils/readableFromIterable.ts';

test('readableFromIterable emits a finite iterable and closes normally', async () => {
  let returnCount = 0;
  const iterable: Iterable<number> = {
    *[Symbol.iterator]() {
      try {
        yield 1;
        yield 2;
        yield 3;
      } finally {
        returnCount++;
      }
    },
  };

  const values: number[] = [];
  for await (const value of readableFromIterable(iterable)) {
    values.push(value);
  }

  assert.deepEqual(values, [1, 2, 3]);
  assert.equal(returnCount, 1);
});

test('readableFromIterable returns its iterator once with the cancellation reason', async () => {
  const cancelReason = new Error('consumer stopped');
  const returnedReasons: unknown[] = [];
  let nextCount = 0;
  const iterable: Iterable<number> = {
    [Symbol.iterator]() {
      return {
        next() {
          return { done: false, value: ++nextCount };
        },
        return(reason?: unknown) {
          returnedReasons.push(reason);
          return { done: true, value: undefined };
        },
      };
    },
  };
  const reader = readableFromIterable(iterable).getReader();

  assert.deepEqual(await reader.read(), { done: false, value: 1 });
  await reader.cancel(cancelReason);
  await reader.cancel(new Error('ignored second cancellation'));

  assert.deepEqual(returnedReasons, [cancelReason]);
});

test('readableFromIterable surfaces iterator return failures from cancellation', async () => {
  const returnError = new Error('iterator cleanup failed');
  const iterable: Iterable<number> = {
    [Symbol.iterator]() {
      return {
        next: () => ({ done: false, value: 1 }),
        return() {
          throw returnError;
        },
      };
    },
  };
  const reader = readableFromIterable(iterable).getReader();

  await reader.read();
  await assert.rejects(reader.cancel(), returnError);
});
