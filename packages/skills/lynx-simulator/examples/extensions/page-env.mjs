// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export default () => ({
  templateData: { title: "Extension preview" },
  globalProps: { appTheme: "light" },
  context: { greeting: "Hello from this page" },
  // Used only by extensions that implement createContext and consume this key.
  nativeData: { badge: { label: "Preview", color: "#3366ff" } },
  jsb: async (name, params, { next }) => {
    if (name === "demo.fixture") return { code: 1, data: { value: "page-local mock" } };
    // All other calls, including demo.greet/demo.increment, reach package handlers.
    return next();
  },
});
