// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { TransformStream } from 'node:stream/web';
import type { Response, Session } from '../types.ts';
import { isListSessionResponse } from '../types.ts';

export class FilterTransformStream<T, P extends T> extends TransformStream<
  T,
  P
> {
  constructor(filter: (chunk: T) => chunk is P) {
    super({
      transform(chunk, controller) {
        if (filter(chunk)) {
          controller.enqueue(chunk);
        }
      },
    });
  }
}

export class InspectStream<T> extends TransformStream<T, T> {
  constructor(callback: (message: T) => void) {
    super({
      transform(chunk, controller) {
        callback(chunk);
        controller.enqueue(chunk);
      },
    });
  }
}

/**
 * Monitors the stream for `SessionList` updates and terminates it when the
 * watched session disappears from the list. This allows CDP stream consumers
 * (e.g. `get-console --watch`) to exit cleanly when a page is closed, even
 * though the underlying transport connection remains open (shared with other
 * sessions on the same device:port).
 */
export class SessionGuardTransformStream extends TransformStream<
  Response,
  Response
> {
  constructor(sessionId: number) {
    super({
      transform(chunk, controller) {
        if (isListSessionResponse(chunk)) {
          const sessions = chunk.data.data as Session[];
          if (!Array.isArray(sessions)) {
            controller.enqueue(chunk);
            return;
          }
          if (!sessions.some((s) => s?.session_id === sessionId)) {
            controller.terminate();
            return;
          }
        }
        controller.enqueue(chunk);
      },
    });
  }
}
