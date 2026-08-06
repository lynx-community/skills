# External Bundles: Build with rslib, Load with `lynx.fetchBundle`

Use this reference to ship a package as a standalone Lynx bundle and load it at runtime with the raw
runtime APIs — `lynx.fetchBundle` plus `lynx.loadScript` — instead of letting a bundler plugin generate
the loading code for you.

Two halves, and they have to agree on names:

1. **Producer**: `rslib` + `@lynx-js/lynx-bundle-rslib-config` encodes your entries into custom sections
   inside one `.lynx.bundle` (native) or `.web.bundle` (web) file.
2. **Consumer**: your app fetches that file by URL, then evaluates a named section and gets back its
   `module.exports`.

`@lynx-js/react-umd` is the canonical producer: it wraps the whole ReactLynx runtime into
`react-prod.lynx.bundle` so apps and component bundles can share a single runtime copy instead of
each inlining their own.

## Choose hand-written loading or the plugin

Hand-write `fetchBundle` when you own the ordering:

- background-thread-only libraries — utilities, SDK wrappers, business logic, config
- on-demand loading, where the bundle is fetched only after a user action or an experiment flag
- hosts that are not built by Rspeedy, or that must resolve the URL themselves at runtime

Prefer `pluginExternalBundle` from `@lynx-js/external-bundle-rsbuild-plugin` when the bundle exports
**ReactLynx components used in JSX**. Those need their main-thread section evaluated before the first
render that touches them, and the plugin emits its loading code into the chunk's *runtime* init, which
runs before any of your module code. Reproducing that ordering by hand is possible but easy to get
subtly wrong, and there is no synchronous escape hatch on web.

## Producer: build the external bundle

```ts
// rslib.config.ts
import { defineExternalBundleRslibConfig } from '@lynx-js/lynx-bundle-rslib-config';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';

export default defineExternalBundleRslibConfig({
  id: 'utils-lib',
  source: {
    entry: {
      utils: './src/index.ts',
    },
  },
  plugins: [pluginReactLynx()],
  output: {
    distPath: { root: './dist-external-bundle' },
  },
}, {
  target: 'tasm', // 'web' emits a `.web.bundle` for @lynx-js/web-core
});
```

`pluginReactLynx()` is required even for a plain TypeScript library with no JSX. The config reads the
thread layer names the DSL plugin exposes, and throws `lynx-bundle-rslib-config requires exposed LAYERS`
without one.

### The naming contract

This is the part both halves must agree on, so read it as the interface:

| Thing | Rule | Example |
| --- | --- | --- |
| Output file | `<id>.lynx.bundle`, or `<id>.web.bundle` for `target: 'web'` | `utils-lib.lynx.bundle` |
| Background section | the entry key, verbatim | `utils` |
| Main-thread section | the entry key plus `__main-thread` | `utils__main-thread` |
| CSS section | the entry key plus `:CSS` | `utils:CSS` |

An entry with no `layer` is compiled twice, once per thread, which is why both sections appear. To emit
only one, set the layer explicitly — and use the real layer strings, `'react:background'` and
`'react:main-thread'`:

```ts
source: {
  entry: {
    utils: { import: './src/index.ts', layer: 'react:background' },
  },
}
```

An unrecognized layer value such as `'background'` is silently ignored and you get both sections back,
so if a "background-only" bundle still ships a `__main-thread` section, check this string first. Note
also that an entry pinned to `'react:main-thread'` keeps its own name — it does *not* gain the
`__main-thread` suffix, since with an explicit layer you are naming the section yourself.

### Verify what you actually produced

Section names are the contract, so confirm them rather than assuming:

```bash
DEBUG=rspeedy rslib build            # keeps the intermediate chunks and writes dist/tasm.json
node -e "console.log(Object.keys(require('./dist-external-bundle/tasm.json').customSections))"
# [ 'utils', 'utils__main-thread', 'utils:CSS' ]
```

Without `DEBUG`, the plugin deletes the per-chunk assets after encoding and only the `.bundle` remains.

`NODE_ENV=development` builds unminified and skips bytecode compilation of main-thread chunks, which is
what you want while debugging a bundle you are loading by hand.

### Depending on the host's ReactLynx

A component bundle should not inline its own copy of ReactLynx. Mark those modules external so they
resolve to a shared runtime at evaluation time:

```ts
output: {
  externalsPresets: { reactlynx: true },
}
```

The preset rewrites `@lynx-js/react`, `@lynx-js/react/jsx-runtime`, `preact` and friends into property
reads off `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')].ReactLynx`. Set
`output.globalObject: 'globalThis'` to mount on `globalThis` instead, which is what you want when the
JS context is shared across cards.

## Consumer: load it at runtime

### The runtime API contract

`lynx.fetchBundle(url, {})` downloads and decodes a bundle; `lynx.loadScript(section, { bundleName })`
evaluates one section out of an already-fetched bundle and returns its `module.exports`. Both need
LynxSDK 3.5+, which is why the encoder stamps `targetSdkVersion: '3.5'` by default.

The two platforms differ in ways that will bite you:

| | Native (`.lynx.bundle`) | Web (`.web.bundle`) |
| --- | --- | --- |
| `fetchBundle` returns | a `ResponseHandler`, not a Promise | a real `Promise` |
| Synchronous path | `handler.wait(timeoutInSeconds)` | none — async only |
| Async path | `handler.then(callback)` — one callback, no chaining, no rejection | standard `.then` |
| Response shape | `{ url, code, error_msg }` | `{ url, code, errorMsg }` |
| Success | `code === 0` | `code === 0` |
| Timeout | `code === -2`, worth retrying | — |
| Bundle CSS | you apply it (see below) | applied during `fetchBundle` |

Because native `then` is not a thenable, wrap it once and write the rest of your code against a real
Promise. This adapter works on both platforms:

```js
function fetchBundleAsPromise(url) {
  return new Promise((resolve, reject) => {
    lynx.fetchBundle(url, {}).then((response) => {
      if (response.code === 0) {
        resolve(response);
      } else {
        reject(new Error(`fetchBundle failed: ${url} code=${response.code}`));
      }
    });
  });
}

function loadSection(url, sectionName) {
  return fetchBundleAsPromise(url).then((response) =>
    lynx.loadScript(sectionName, { bundleName: response.url })
  );
}
```

Pass `response.url` as `bundleName`, not your original URL string. The runtime keys its decoded-bundle
cache by the URL it actually resolved, and a redirect or a normalized path makes the two differ.

The URL must be absolute. A root-relative `/utils-lib.lynx.bundle` fails on device with a file-not-found
error, so a dev server serving external bundles needs `assetPrefix` pointed at a LAN address rather than
`localhost`.

### Mount dependencies before you evaluate

A section built with `externalsPresets` reads its externals at *module evaluation time* — the very
moment `loadScript` runs. If the mount point is missing, evaluation throws
`Cannot read properties of undefined (reading 'ReactJSXRuntime')` from inside the bundle, which reads
like a corrupt artifact but is really an ordering bug.

So loading a ReactLynx-dependent bundle is two stages: bring up the runtime, mount it, then load the
consumer.

```js
const EXTERNAL_GLOBAL = Symbol.for('__LYNX_EXTERNAL_GLOBAL__');

async function loadComponentLib() {
  const mount = lynx[EXTERNAL_GLOBAL] ??= {};

  // 1. the shared ReactLynx runtime, from @lynx-js/react-umd
  mount.ReactLynx = await loadSection(`${CDN}/react-prod.lynx.bundle`, 'ReactLynx');

  // 2. the bundle that was compiled against it
  return loadSection(`${CDN}/comp-lib.lynx.bundle`, 'comp-lib');
}
```

`@lynx-js/react-umd` exposes `ReactLynx` (background) and `ReactLynx__main-thread`, and its subpaths —
`React`, `ReactInternal`, `ReactJSXRuntime`, `Preact`, and so on — are exactly the names
`externalsPresets: { reactlynx: true }` compiled into the consumer bundle. Use the `dev` bundle under
`NODE_ENV=development`; only that one carries the refresh runtime.

Keep one ReactLynx instance per JS context. Two copies means two sets of Preact `options` hooks and two
snapshot registries, and components render blank or lose state in ways that do not point back here.

### Main-thread sections and CSS

Main-thread code lives in its own section and must be loaded from the main thread, not the background
thread:

```js
// main thread
const mod = lynx.loadScript('utils__main-thread', { bundleName: response.url });
```

On native, the bundle's CSS is not applied for you. After loading a main-thread section, adopt its
stylesheet — this needs LynxSDK 3.7+:

```js
if (typeof __LoadStyleSheet === 'function') {
  const styleSheet = __LoadStyleSheet('utils:CSS', response.url);
  if (styleSheet !== null) {
    __AdoptStyleSheet(styleSheet);
    __FlushElementTree();
  }
}
```

On web the style section is pushed into the style engine during `fetchBundle`, so skip this entirely.

Because web `fetchBundle` has no synchronous path, a main-thread section there can only be loaded
asynchronously — one more reason to let `pluginExternalBundle` handle bundles whose components must
exist before first render.

### Retries and timeouts

Native `wait(timeout)` takes **seconds**, and a timeout surfaces as `code === -2` rather than a throw.
Retry by calling `lynx.fetchBundle` again — a handler is single-use:

```js
function fetchWithRetry(url, retries) {
  let response = lynx.fetchBundle(url, {}).wait(2);
  while (response.code === -2 && retries-- > 0) {
    response = lynx.fetchBundle(url, {}).wait(2);
  }
  return response;
}
```

## Checklist

- Section name matches the rslib entry key, with `__main-thread` / `:CSS` derived from it
- `pluginReactLynx()` present in the rslib config, even for a plain TS library
- Layer strings are `'react:background'` / `'react:main-thread'`, not `'background'` / `'main-thread'`
- Dependencies mounted on `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` before `loadScript`
- `bundleName` is `response.url`, and the URL is absolute
- Native: `code === 0` checked, `wait` timeout in seconds, CSS adopted for main-thread sections
- Web: async only, no `.wait()`, CSS already applied
