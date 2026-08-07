# External Bundles, Part 1: Building One with rslib

Use this reference to ship any package as a standalone Lynx bundle: a utility library, an SDK wrapper,
business logic, config, a rarely-used feature. Nothing about it is specific to any one package.

External bundles carry background-thread code, and the entry is pinned to the background layer so that
is all the bundle contains.

Loading the result at runtime is a separate workflow with its own failure modes — see
[`external-bundle-runtime.md`](external-bundle-runtime.md). The two halves meet at one interface: the
**section name**, which this side decides.

## The config

```ts
// rslib.config.ts
import { defineExternalBundleRslibConfig } from '@lynx-js/lynx-bundle-rslib-config';

// The config needs the layer names, which a DSL plugin normally exposes. A
// vanilla project has no DSL plugin, so declare them directly — this is the
// whole dependency, and it pulls in no framework. Both names are required for
// the config to resolve (dropping either one hangs the build); the entry below
// pins the one this bundle is built for.
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

Without an exposed `LAYERS` the config throws `lynx-bundle-rslib-config requires exposed LAYERS`. In a
ReactLynx project `pluginReactLynx()` already provides it, so use that instead of the shim above — but
it is not a requirement, and a vanilla bundle needs no React package installed at all.

The `layer` on the entry is what keeps the bundle to one section. Leave it out and the entry is compiled
for every layer the plugin declared, so the bundle ships extra sections nobody loads.

## One bundle per target

`target: 'tasm'` emits `<id>.lynx.bundle` for the native engine; `target: 'web'` emits `<id>.web.bundle`
for `@lynx-js/web-core`. These are **different encode formats, not the same bytes under two names**, so a
project that runs on both platforms builds twice and serves the matching file. This holds even for a
bundle carrying nothing but plain JS — the container format differs, not just the payload.

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
| Section | the entry key, verbatim | `utils` |

The layer strings are not magic constants — they are whatever the exposing plugin declared
(`'lynx:background'` for the shim above, `'react:background'` in a ReactLynx project), so a value copied
from another project's config will not match. And a value that does not match is *silently ignored*: you
get the unpinned behavior back rather than an error. If a bundle ships more sections than you expect,
check this string first.

Keep styles out of an external bundle. A bundle that depends on shipping its own CSS behaves differently
per platform; put the stylesheet in the card that renders instead.

## Verify what you actually produced

Section names are the contract, and enough of the above is config-dependent that you should read them
back rather than assume:

```bash
DEBUG=rspeedy rslib build            # keeps the intermediate chunks and writes dist/tasm.json
node -e "console.log(Object.keys(require('./dist-external-bundle/tasm.json').customSections))"
# [ 'utils' ]
```

Without `DEBUG`, the plugin deletes the per-chunk assets after encoding and only the `.bundle` remains.

For `target: 'web'` the emitted binary does not carry the section as a custom section at all — the
encoder routes the chunk into `Manifest` under a `/` prefix, leaving `CustomSections` empty. The name you
pass to `lynx.loadScript` is still the entry key; only the container inside the file differs.

`NODE_ENV=development` builds unminified, which is what you want while debugging a bundle you are loading
by hand.

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

- A plugin exposing `LAYERS` is present, and the entry pins `layer` to the background name it declared —
  a mismatch is silently ignored rather than reported
- Built once per platform you ship to; `.lynx.bundle` and `.web.bundle` are not interchangeable
- Section name read back from `tasm.json` rather than assumed, and handed to whoever writes the loader
- No CSS in the bundle
