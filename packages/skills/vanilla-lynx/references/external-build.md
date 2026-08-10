# Build a background-thread external bundle

Use rslib to package plain TypeScript or JavaScript logic into a standalone `.lynx.bundle` for the
background thread.

Keep Element PAPI, UI code, and CSS out of this bundle. Load the result from `background.ts` with the
paired `fetchBundle` and `loadScript` flow in
[`external-runtime.md`](external-runtime.md).

## Rslib config

```js
// utils.rslib.config.js
import { defineExternalBundleRslibConfig } from '@lynx-js/lynx-bundle-rslib-config';

const LAYERS = {
  BACKGROUND: 'rslib:background',
  MAIN_THREAD: 'rslib:main-thread',
};

const pluginRslibLayers = () => ({
  name: 'vanilla:rslib-layers',
  setup(api) {
    api.expose(Symbol.for('LAYERS'), LAYERS);
  },
});

export default defineExternalBundleRslibConfig({
  id: 'utils',
  source: {
    entry: {
      utils: {
        import: './src/utils/index.ts',
        layer: LAYERS.BACKGROUND,
      },
    },
  },
  plugins: [pluginRslibLayers()],
  output: {
    distPath: {
      root: 'dist-external-bundle',
    },
  },
});
```

The explicit background layer prevents the producer from generating main-thread code. Expose both
layer names for `defineExternalBundleRslibConfig`, but do not add `pluginReactLynx()` when the source
is plain TypeScript or JavaScript without ReactLynx transforms.

`id: 'utils'` produces `dist-external-bundle/utils.lynx.bundle`. The `utils` entry key is also the
first argument passed to `loadScript` at runtime.

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
