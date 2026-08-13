# Build a background-thread external bundle

Use rslib to package plain TypeScript or JavaScript logic into a standalone `.lynx.bundle` for the
background thread. Never use ReactLynx or JSX in an external module.

Keep Element PAPI, UI code, and CSS out of this bundle. Load the result from `background.ts` with the
paired `fetchBundle` and `loadScript` flow in
[`external-runtime.md`](external-runtime.md).

## Rslib config

Use this configuration without `pluginReactLynx()` or any ReactLynx transform.

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

`api.expose(Symbol.for('LAYERS'), LAYERS)` exposes both layer names to
`defineExternalBundleRslibConfig`. Setting the entry layer to `LAYERS.BACKGROUND` prevents the
producer from generating main-thread code. Explicitly preserve both constraints when presenting or
reviewing this configuration.

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
