import { defineConfig } from "@rslib/core";
import { pluginPublint } from "rsbuild-plugin-publint";

export default defineConfig({
  plugins: [
    pluginPublint({ throwOn: "suggestion" }),
  ],
  lib: [
    {
      format: "esm",
      syntax: "es2022",
      source: {
        entry: {
          connector: "./src/connector.ts",
          index: "./src/index.ts",
        },
      },
      dts: {
        bundle: {
          bundledPackages: [],
        },
      },
    },
    {
      format: "esm",
      syntax: "es2022",
      dts: false,
      source: {
        entry: {
          main: "./src/main.ts",
        },
      },
      autoExternal: {
        // Bundle @modelcontextprotocol/sdk in CLI.
        peerDependencies: false,
      },
    },
  ],
});
