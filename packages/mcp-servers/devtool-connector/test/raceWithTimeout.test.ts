// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { createHook } from "node:async_hooks";
import { describe, test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { raceWithTimeout } from "./raceWithTimeout.ts";

async function captureTimeoutLifecycle<T>(run: () => Promise<T>): Promise<{
  destroyedTimeouts: Set<number>;
  initializedTimeouts: Set<number>;
  result: T;
}> {
  const initializedTimeouts = new Set<number>();
  const destroyedTimeouts = new Set<number>();
  const hook = createHook({
    init(asyncId, type) {
      if (type === "Timeout") initializedTimeouts.add(asyncId);
    },
    destroy(asyncId) {
      if (initializedTimeouts.has(asyncId)) destroyedTimeouts.add(asyncId);
    },
  });
  hook.enable();

  try {
    const result = await run();
    await setImmediate();
    return { destroyedTimeouts, initializedTimeouts, result };
  } finally {
    hook.disable();
  }
}

function assertTimersDestroyed(
  initializedTimeouts: Set<number>,
  destroyedTimeouts: Set<number>,
): void {
  assert.equal(initializedTimeouts.size, 1, "the helper should allocate one timeout resource");
  assert.deepStrictEqual(
    destroyedTimeouts,
    initializedTimeouts,
    "the timeout resource should be destroyed, not merely unrefed",
  );
}

describe("raceWithTimeout", () => {
  test("cancels and awaits the timer when the operation resolves", async () => {
    const { destroyedTimeouts, initializedTimeouts, result } = await captureTimeoutLifecycle(() =>
      raceWithTimeout(Promise.resolve("done"), 10_000, "timeout" as const)
    );

    assert.equal(result, "done");
    assertTimersDestroyed(initializedTimeouts, destroyedTimeouts);
  });

  test("cancels and awaits the timer when the operation rejects", async () => {
    const operationError = new Error("operation failed");
    const { destroyedTimeouts, initializedTimeouts, result } = await captureTimeoutLifecycle(() =>
      raceWithTimeout(Promise.reject(operationError), 10_000, "timeout" as const).then(
        () => new Error("operation unexpectedly succeeded"),
        (error: unknown) => error,
      )
    );

    assert.strictEqual(result, operationError);
    assertTimersDestroyed(initializedTimeouts, destroyedTimeouts);
  });

  test("returns the timeout sentinel and destroys the elapsed timer", async () => {
    const operation = new Promise<never>(() => {});
    const { destroyedTimeouts, initializedTimeouts, result } = await captureTimeoutLifecycle(() =>
      raceWithTimeout(operation, 0, "timeout" as const)
    );

    assert.equal(result, "timeout");
    assertTimersDestroyed(initializedTimeouts, destroyedTimeouts);
  });

  test("propagates caller abort and destroys the timer", async () => {
    const controller = new AbortController();
    const abortReason = new Error("caller aborted");
    const operation = new Promise<never>(() => {});
    const { destroyedTimeouts, initializedTimeouts, result } = await captureTimeoutLifecycle(() => {
      const raced = raceWithTimeout(operation, 10_000, "timeout" as const, {
        signal: controller.signal,
      });
      controller.abort(abortReason);
      return raced.then(
        () => new Error("operation unexpectedly succeeded"),
        (error: unknown) => error,
      );
    });

    assert.ok(result instanceof Error);
    assert.equal(result.name, "AbortError");
    assert.strictEqual(result.cause, abortReason);
    assertTimersDestroyed(initializedTimeouts, destroyedTimeouts);
  });
});
