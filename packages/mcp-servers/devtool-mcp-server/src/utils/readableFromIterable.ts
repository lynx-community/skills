// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';

/**
 * Create a pull-based Web ReadableStream from a finite synchronous iterable.
 *
 * This is the Node 18-compatible subset of `ReadableStream.from()`. Canceling
 * the stream closes the iterator exactly once and forwards the cancel reason.
 */
export function readableFromIterable<T>(
  iterable: Iterable<T>,
): ReadableStream<T> {
  const iterator = iterable[Symbol.iterator]();
  let finished = false;

  function closeIterator(reason?: unknown): void {
    if (finished) return;
    finished = true;
    iterator.return?.(reason);
  }

  return new ReadableStream<T>({
    pull(controller) {
      if (finished) return;

      try {
        const result = iterator.next();
        if (result.done) {
          finished = true;
          controller.close();
          return;
        }

        controller.enqueue(result.value);
      } catch (error) {
        try {
          closeIterator();
        } catch {
          // Preserve the original iterator/controller failure.
        }
        controller.error(error);
      }
    },
    cancel(reason) {
      closeIterator(reason);
    },
  });
}
