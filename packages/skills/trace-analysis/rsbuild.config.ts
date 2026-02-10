import { defineConfig } from "@rsbuild/core";

export default defineConfig({
  source: {
    entry: { trace_processor_api: "./src/scripts/trace_processor_api.js" },
  },
  output: {
    target: "node",
    distPath: { root: "scripts" },
    filename: { js: "[name].mjs" },
    assetPrefix: "./",
    minify: false,
  },
  tools: {
    rspack: {
      experiments: {
        outputModule: true,
      },
      output: {
        module: true,
        chunkFormat: "module",
        library: { type: "module" },
      },
    },
  },
});
