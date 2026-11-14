# Build a background-thread external bundle

Use rslib to package plain TypeScript or JavaScript logic into a standalone `.lynx.bundle` for the
background thread. External modules must use plain TypeScript or JavaScript and must not use
ReactLynx, JSX, or ReactLynx transforms.

Keep Element PAPI, UI code, and CSS out of this bundle. Load the result from background-thread source with the
paired `fetchBundle` and `loadScript` flow in
[`external-runtime.md`](external-runtime.md).

## Plain TypeScript/JavaScript module

External modules use plain TypeScript or JavaScript and must not import ReactLynx, use JSX, or enable
ReactLynx transforms:

```ts
// src/utils/index.ts
export function add(left: number, right: number): number {
  return left + right;
}
```

## Rslib config

Register `pluginLynx()` from `@lynx-js/rsbuild-plugin` (without `pluginReactLynx()` or any ReactLynx
transform) and target `LAYERS.BACKGROUND` from `@lynx-js/lynx-bundle-rslib-config`:

```js
// utils.rslib.config.js
import {
  defineExternalBundleRslibConfig,
  LAYERS,
} from "@lynx-js/lynx-bundle-rslib-config";
import { pluginLynx } from "@lynx-js/rsbuild-plugin";

export default defineExternalBundleRslibConfig({
  id: "utils",
  source: {
    entry: {
      utils: {
        import: "./src/utils/index.ts",
        layer: LAYERS.BACKGROUND,
      },
    },
  },
  plugins: [pluginLynx()],
  output: {
    distPath: {
      root: "dist-external-bundle",
    },
  },
});
```

`defineExternalBundleRslibConfig` requires `pluginLynx()` (or a DSL plugin that registers it) so the
Lynx template encoder and build config are exposed. Setting `layer: LAYERS.BACKGROUND` keeps the
producer background-only and prevents main-thread chunk generation.

The `source.entry` key is the first `loadScript` argument; the `utils` entry requires
`loadScript('utils', ...)`.

## Build script

```json
{
  "scripts": {
    "build:bundle:utils": "rslib build --config utils.rslib.config.js"
  }
}
```

## Example Usage

For a published reference implementation of this background-only setup, see the `utils` producer in
[`@lynx-example/external-bundle`](https://www.npmjs.com/package/@lynx-example/external-bundle).
