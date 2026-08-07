# External Bundles, Part 1: Building One with rslib

Use this reference to ship any package as a standalone Lynx bundle: a utility library, an SDK wrapper,
business logic, config, a rarely-used feature. Nothing about it is specific to any one package.

Loading the result at runtime is a separate workflow with its own failure modes — see
[`external-bundle-runtime.md`](external-bundle-runtime.md). The two halves meet at one interface: the
**section name**, which this side decides.

> **Background thread only, for now.** External bundles are currently exposed for background-thread use.
> The build does emit a main-thread section, but do not design around loading it — main-thread exposure
> is not offered yet. Everything below assumes background-thread consumers.

## The config

```ts
// rslib.config.ts
import { defineExternalBundleRslibConfig } from '@lynx-js/lynx-bundle-rslib-config';

// The config needs the two thread layer names, which a DSL plugin normally
// exposes. A vanilla project has no DSL plugin, so declare them directly —
// this is the whole dependency, and it pulls in no framework.
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
      // Pin the layer so only the background section is built. An entry with no
      // `layer` is compiled once per thread and ships a main-thread section you
      // are not going to load.
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

Without an exposed `LAYERS` the config throws `lynx-bundle-rslib-config requires exposed LAYERS`. In a
ReactLynx project `pluginReactLynx()` already provides it, so use that instead of the shim above — but
it is not a requirement, and a vanilla bundle needs no React package installed at all.

## One bundle per target

`target: 'tasm'` emits `<id>.lynx.bundle` for the native engine; `target: 'web'` emits `<id>.web.bundle`
for `@lynx-js/web-core`. These are **different encode formats, not the same bytes under two names**, so a
project that runs on both platforms builds twice and serves the matching file. This holds even for a
background-only bundle carrying nothing but plain JS — the container format differs, not just the payload.

```jsonc
// package.json
"scripts": {
  "build:lynx": "rslib build --config ./rslib.config.ts",
  "build:web": "EXTERNAL_BUNDLE_TARGET=web rslib build --config ./rslib.config.ts"
}
```

…with the config reading `process.env.EXTERNAL_BUNDLE_TARGET` to pick `target` and a per-target
`distPath`, so one build never overwrites the other.

## The naming contract

This is what the runtime side has to match, so treat it as the published interface:

| Thing | Rule | Example |
| --- | --- | --- |
| Output file | `<id>.lynx.bundle`, or `<id>.web.bundle` for `target: 'web'` | `utils-lib.lynx.bundle` |
| Background section | the entry key, verbatim | `utils` |
| CSS section | a JS section name plus `:CSS` | `utils:CSS` |

An entry with no `layer` is compiled twice, once per thread, and additionally emits `utils__main-thread`
(plus possibly `utils__main-thread:CSS`). Pinning the layer as shown above avoids shipping a section
nobody loads.

The layer strings are not magic constants — they are whatever the exposing plugin declared
(`'lynx:background'` for the shim above, `'react:background'` in a ReactLynx project), so a value copied
from another project's config will not match. And a value that does not match is *silently ignored*: you
get both sections back rather than an error. If a "background-only" bundle still ships a `__main-thread`
section, check this string first.

Styles are worth leaving out of a background-only bundle for now. On web the bundle's CSS section is
installed during `fetchBundle`, but on native adopting it requires main-thread APIs that are not part of
the exposed surface yet, so a bundle that depends on its own CSS will behave differently per platform.

## Verify what you actually produced

Section names are the contract, and enough of the above is config-dependent that you should read them
back rather than assume:

```bash
DEBUG=rspeedy rslib build            # keeps the intermediate chunks and writes dist/tasm.json
node -e "console.log(Object.keys(require('./dist-external-bundle/tasm.json').customSections))"
# [ 'utils' ]
```

Without `DEBUG`, the plugin deletes the per-chunk assets after encoding and only the `.bundle` remains.

For `target: 'web'` the emitted binary does not carry these as custom sections at all — the encoder
routes the background chunk into `Manifest` under a `/` prefix, main-thread chunks into `LepusCode`, and
folds CSS into `StyleInfo`, leaving `CustomSections` empty. The name you pass to `lynx.loadScript` is
still the entry key; only the container inside the file differs.

`NODE_ENV=development` builds unminified and skips bytecode compilation, which is what you want while
debugging a bundle you are loading by hand.

## Leaving dependencies out of the bundle

By default everything the entry imports is inlined. To keep a dependency out — because the host already
has it, or because two bundles must share one instance of it — declare it external:

```ts
output: {
  externals: {
    'shared-lib': 'SharedLib',                  // whole namespace
    'shared-lib/utils': ['SharedLib', 'Utils'], // a subpath of it
  },
}
```

Each request is rewritten into a property read off `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]`, so
`'shared-lib/utils'` above compiles to `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')].SharedLib.Utils`.
Set `output.globalObject: 'globalThis'` to mount on `globalThis` instead, which is what you want when the
JS context is shared across cards.

Whatever you externalize becomes the consumer's problem: it must be mounted under that exact name before
the section is evaluated, or evaluation throws. That ordering rule lives in
[`external-bundle-runtime.md`](external-bundle-runtime.md#mount-externals-before-you-evaluate).

## Checklist

- A plugin exposing `LAYERS` is present, and the entry's `layer` matches a name it declared — a mismatch
  is silently ignored rather than reported
- Built once per platform you ship to; `.lynx.bundle` and `.web.bundle` are not interchangeable
- Section names read back from `tasm.json` rather than assumed, and handed to whoever writes the loader
- No CSS in a background-only bundle for now
