# Build an external bundle with rslib

An external bundle is a package built into its own Lynx bundle file, separate from the card that uses
it. Use it for background-thread code: a utility library, an SDK wrapper, business logic, config, a
feature that most sessions never touch.

Loading the bundle is a separate job. See [`external-bundle-runtime.md`](external-bundle-runtime.md).
The two sides share exactly one thing: the section name. This side picks it.

## Config

```ts
// rslib.config.ts
import { defineExternalBundleRslibConfig } from '@lynx-js/lynx-bundle-rslib-config';

// A DSL plugin normally supplies the layer names. Vanilla projects have no DSL
// plugin, so declare them here. Both names must be present or the build hangs.
const pluginLayers = () => ({
  name: 'vanilla:layers',
  setup(api) {
    api.expose(Symbol.for('LAYERS'), {
      BACKGROUND: 'lynx:background',
      MAIN_THREAD: 'lynx:main-thread',
    });
  },
});

export default defineExternalBundleRslibConfig({
  id: 'utils-lib',
  source: {
    entry: {
      utils: { import: './src/index.ts', layer: 'lynx:background' },
    },
  },
  plugins: [pluginLayers()],
  output: {
    distPath: { root: './dist-external-bundle' },
  },
}, {
  target: 'tasm',
});
```

Miss the `LAYERS` and the build fails with `lynx-bundle-rslib-config requires exposed LAYERS`. ReactLynx
projects get it from `pluginReactLynx()` and can drop the shim. Vanilla projects need no React package
at all.

Always pin `layer` on the entry. Without it, rslib compiles the entry once for every layer the plugin
declared, and the bundle ships sections nobody loads.

## Build once per target

`target: 'tasm'` produces `<id>.lynx.bundle` for the native engine. `target: 'web'` produces
`<id>.web.bundle` for `@lynx-js/web-core`.

The two files use different encode formats. They are not the same bytes under two names, so you cannot
serve one file to both platforms. This holds even when the bundle contains nothing but plain JS.

Build both, into separate directories:

```jsonc
// package.json
"scripts": {
  "build:lynx": "rslib build --config ./rslib.config.ts",
  "build:web": "EXTERNAL_BUNDLE_TARGET=web rslib build --config ./rslib.config.ts"
}
```

Read `process.env.EXTERNAL_BUNDLE_TARGET` in the config to pick `target` and a matching `distPath`.

## Section names

The runtime side has to spell these exactly right:

| Thing | Rule | Example |
| --- | --- | --- |
| Output file | `<id>.lynx.bundle`, or `<id>.web.bundle` for the web target | `utils-lib.lynx.bundle` |
| Section | the entry key, verbatim | `utils` |

Layer strings are not fixed constants. They are whatever your plugin declared, so `'lynx:background'`
here and `'react:background'` in a ReactLynx project. Copying a layer value from another project
usually gets you a string that does not match.

A `layer` that does not match is ignored silently. You get the unpinned behavior and no warning. When a
bundle ships more sections than you expected, check this string first.

Keep CSS out of the bundle. Style handling differs per platform, so a bundle that ships its own
stylesheet behaves differently on native and web. Put the stylesheet in the card that renders.

## Check the output

Read the section names back instead of assuming them:

```bash
DEBUG=rspeedy rslib build
node -e "console.log(Object.keys(require('./dist-external-bundle/tasm.json').customSections))"
# [ 'utils' ]
```

`DEBUG=rspeedy` is what keeps the intermediate chunks and writes `tasm.json`. A normal build deletes
them after encoding and leaves only the `.bundle`.

Web bundles look different inside. The encoder puts the chunk in `Manifest` under a `/` prefix and
leaves `CustomSections` empty. The name you pass to `lynx.loadScript` is still the entry key. Only the
container changed.

`NODE_ENV=development` skips minification, which helps while you are debugging a bundle by hand.

## Keeping a dependency out

By default rslib inlines everything the entry imports. Declare a dependency external to leave it out,
either because the host already has it or because two bundles need to share one instance:

```ts
output: {
  externals: {
    'shared-lib': 'SharedLib',                  // whole namespace
    'shared-lib/utils': ['SharedLib', 'Utils'], // a subpath of it
  },
}
```

Each request becomes a property read on `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]`. The second line
above compiles to `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')].SharedLib.Utils`. Use
`output.globalObject: 'globalThis'` to mount on `globalThis` instead, which is what you want when cards
share a JS context.

Anything you externalize becomes the loader's responsibility. It has to be mounted under that exact name
before the section runs, or evaluation throws. See
[mount externals first](external-bundle-runtime.md#mount-externals-first).

## Checklist

- A plugin exposes `LAYERS`, and the entry pins `layer` to the background name it declared
- Built once per platform you ship to
- Section names read back from `tasm.json`, then handed to whoever writes the loader
- No CSS in the bundle
