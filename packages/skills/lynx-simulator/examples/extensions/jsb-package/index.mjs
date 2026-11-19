// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function createJSBHandlers({ xbridge }) {
  // One factory per host; key mutable state by the calling window.
  const counters = new Map();
  xbridge.event.host.addWindowCloseListener(windowId => counters.delete(windowId));
  return [
    {
      name: "demo.greet",
      handler(params, { window, context }) {
        // This example's protocol uses direct params, not params.data.
        if (typeof params?.name !== "string") return { code: -3, msg: "name must be a string" };
        return {
          code: 1,
          data: { message: `${context?.greeting ?? "Hello"}, ${params.name}`, windowId: window.id },
        };
      },
    },
    {
      name: "demo.increment",
      handler(_params, { window }) {
        const count = (counters.get(window.id) ?? 0) + 1;
        counters.set(window.id, count);
        return { code: 1, data: { count } };
      },
    },
  ];
}
