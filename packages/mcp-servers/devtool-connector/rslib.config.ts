// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineConfig } from "@rslib/core";
import { pluginPublint } from "rsbuild-plugin-publint";

export default defineConfig({
  plugins: [
    pluginPublint({ throwOn: "suggestion" }),
  ],
  source: {
    entry: {
      "daemon/entry": "./src/daemon/entry.ts",
      "daemon/index": "./src/daemon/index.ts",
      index: "./src/index.ts",
      main: "./src/main.ts",
      "transport/index": "./src/transport/index.ts",
      "streams/index": "./src/streams/index.ts",
      "command/index": "./src/command/index.ts",
    },
  },
  dts: true,
  syntax: "es2022",
  output: {
    externals: [
      {
        bufferutil: "commonjs bufferutil",
        "utf-8-validate": "commonjs utf-8-validate",
      },
    ],
  },
});
