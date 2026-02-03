import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  },
  lib: [
    {
      format: "esm",
      syntax: "es2022",
      dts: false,
      source: {
        entry: {
          main: "./src/main.ts",
        },
      },
    },
  ],
});
