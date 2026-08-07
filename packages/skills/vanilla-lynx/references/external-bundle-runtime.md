# External Bundles, Part 2: Loading One at Runtime

Use this reference to load an already-built external bundle from your own code, with the raw runtime
APIs — `lynx.fetchBundle` plus `lynx.loadScript` — instead of letting a bundler plugin generate the
loading code. Building the bundle is a separate workflow: see
[`external-bundle-build.md`](external-bundle-build.md), which also decides the section names used here.

> **Background thread only, for now.** Load external bundles from the background thread. Main-thread
> loading is not part of the exposed surface yet — do not design around it, and do not reach for a
> bundle to supply anything the main thread needs during render.

Hand-writing the loading is the right call when you own the ordering: on-demand loading behind a user
action or an experiment flag, a URL your code resolves at runtime, or a host that is not built by
Rspeedy. What you get back from `lynx.loadScript` is the section's `module.exports`, nothing more
magical than that.

## The runtime API contract

`lynx.fetchBundle(url, {})` downloads and decodes a bundle; `lynx.loadScript(section, { bundleName })`
evaluates one section out of an already-fetched bundle. Both need LynxSDK 3.5+, which is why the encoder
stamps `targetSdkVersion: '3.5'` by default.

The two platforms differ in ways that will bite you:

| | Native (`.lynx.bundle`) | Web (`.web.bundle`) |
| --- | --- | --- |
| `fetchBundle` returns | a `ResponseHandler`, not a Promise | a real `Promise` |
| Synchronous path | `handler.wait(timeoutInSeconds)` | none — async only |
| Async path | `handler.then(callback)` — one callback, no chaining, no rejection | standard `.then` |
| Response shape | `{ url, code, error_msg }` | `{ url, code, errorMsg }` |
| Success | `code === 0` | `code === 0` |
| Timeout | `code === -2`, worth retrying | — |

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

## Wiring it into a vanilla card

The background thread loads and computes; the main thread renders what comes back over the cross-thread
context. This keeps the bundle entirely on the background side, which is where it is supported.

```js
// background.js
lynx.fetchBundle(BUNDLE_URL, {}).then(function(response) {
  if (response.code !== 0) {
    return;
  }
  let utils;
  try {
    // The section name is the rslib entry key, decided by the build config.
    utils = lynx.loadScript('utils', { bundleName: response.url });
  } catch (error) {
    lynx.reportError(error);
    return;
  }
  lynx.getCoreContext().dispatchEvent({
    type: 'app:badge-ready',
    data: { text: utils.getBadge() },
  });
});
```

```js
// main-thread.js
globalThis.renderPage = function renderPage() {
  const page = __CreatePage('card', 0);
  const root = __CreateView(0);
  __AppendElement(page, root);

  const target = __CreateText(0);
  __SetID(target, 'target');
  __AppendElement(root, target);

  lynx.getJSContext().addEventListener('app:badge-ready', function(event) {
    __AppendElement(target, __CreateRawText(String(event.data.text)));
    // The tree changed after the first frame, so commit it again.
    __FlushElementTree();
  });
};
```

Two things this shape encodes. Nothing from the bundle can be on the first frame, because `fetchBundle`
is asynchronous on every platform — render without it, then fill in. And the second
`__FlushElementTree()` is not optional: skip it and the elements you appended never reach the screen,
with no error to tell you.

## Mount externals before you evaluate

A bundle built with `externals` reads them at *module evaluation time* — the very moment `loadScript`
runs. If the mount point is missing, evaluation throws a `TypeError` from inside the bundle, along the
lines of `Cannot read properties of undefined (reading 'Utils')`. That reads like a corrupt artifact but
is really an ordering bug: nothing had populated `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` yet.

So a bundle with externals loads in two stages — provide the dependency, mount it, then load the
consumer:

```js
const EXTERNAL_GLOBAL = Symbol.for('__LYNX_EXTERNAL_GLOBAL__');

async function loadFeature() {
  const mount = lynx[EXTERNAL_GLOBAL] ??= {};

  // 1. whatever the feature bundle expects to find, under the name it compiled against
  mount.SharedLib = await loadSection(`${CDN}/shared-lib.lynx.bundle`, 'shared');

  // 2. the bundle that was compiled against it
  return loadSection(`${CDN}/feature.lynx.bundle`, 'feature');
}
```

The mount name is the first element of the external's library name, so it has to match the build config
exactly. The dependency does not have to come from another bundle — anything already in the host can be
assigned there — but keep exactly one instance per JS context. Two copies of a library that holds state
means two independent sets of that state, and the resulting bugs do not point back here.

## A wrong section name does not say so

On the background thread, `loadScript` with an unknown section does not throw a "not found" error. The
chunk loader treats the unknown name as a *relative URL* and fetches it, so a dev server's SPA fallback
hands back an HTML page with a 200 and you get a `SyntaxError: Unexpected token '<'` from evaluating it.

So wrap `loadScript` in `try`/`catch`, and when the error mentions parsing rather than loading, suspect
the section name before you suspect the bundle. Reading the name back from the build output
(`tasm.json`) is the fast way to settle it.

## Retries and timeouts

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

There is no synchronous path on web, so code that must run on both platforms uses the async adapter
above and treats `wait` as a native-only optimization.

## Checklist

- Loading happens on the background thread
- Section name matches the rslib entry key from the build config
- `code === 0` checked before `loadScript`, and `loadScript` wrapped in `try`/`catch`
- `bundleName` is `response.url`, and the URL is absolute
- Externals mounted on `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` before `loadScript`, under the
  exact name the build compiled against
- Results reach the UI over `lynx.getCoreContext()` / `lynx.getJSContext()`, and the main thread flushes
  the element tree again after applying them
- Native: `wait` timeout is in seconds; web: async only, no `.wait()`
