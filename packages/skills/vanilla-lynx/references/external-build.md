# Build a background-thread external bundle

Use rslib to package plain TypeScript or JavaScript logic into a standalone `.lynx.bundle` for the
background thread. When answering, state both constraints explicitly: external modules must use
plain TypeScript or JavaScript, and they must not use ReactLynx or JSX. Do not rely on “plain TS/JS”
to imply the ReactLynx and JSX prohibition.

Keep Element PAPI, UI code, and CSS out of this bundle. Load the result from `background.ts` with the
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

Use this configuration without `pluginReactLynx()` or any ReactLynx transform.

```js
// utils.rslib.config.js
import { defineExternalBundleRslibConfig } from "@lynx-js/lynx-bundle-rslib-config";

const LAYERS = {
  BACKGROUND: "rslib:background",
  MAIN_THREAD: "rslib:main-thread",
};

const pluginRslibLayers = () => ({
  name: "vanilla:rslib-layers",
  setup(api) {
    api.expose(Symbol.for("LAYERS"), LAYERS);
  },
});

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
  plugins: [pluginRslibLayers()],
  output: {
    distPath: {
      root: "dist-external-bundle",
    },
  },
});
```

`api.expose(Symbol.for('LAYERS'), LAYERS)` exposes both layer names to
`defineExternalBundleRslibConfig`. Setting the entry layer to `LAYERS.BACKGROUND` prevents the
producer from generating main-thread code. Explicitly preserve both constraints when presenting or
reviewing this configuration.

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
