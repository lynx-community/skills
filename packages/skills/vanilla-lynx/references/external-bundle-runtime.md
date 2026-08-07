# External Bundles, Part 2: Loading One at Runtime

Use this reference to load an already-built external bundle from your own code, with the raw runtime
APIs — `lynx.fetchBundle` plus `lynx.loadScript` — instead of letting a bundler plugin generate the
loading code. Building the bundle is a separate workflow: see
[`external-bundle-build.md`](external-bundle-build.md), which also decides the section names used here.

External bundles are for background-thread code: utilities, SDK wrappers, business logic, config. Fetch
them from `background.ts` and use the exports there.

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

## Loading it in `background.ts`

```js
// The section name is the rslib entry key, decided by the build config.
lynx.fetchBundle(BUNDLE_URL, {}).then(function(response) {
  if (response.code !== 0) {
    lynx.reportError(new Error('fetchBundle failed: ' + response.code));
    return;
  }
  let utils;
  try {
    utils = lynx.loadScript('utils', { bundleName: response.url });
  } catch (error) {
    lynx.reportError(error);
    return;
  }
  handleBadge(utils.getBadge());
});
```

Nothing from the bundle is available synchronously — `fetchBundle` is asynchronous on every platform, so
whatever depends on the exports has to run inside the callback or behind a promise you hand around.

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
exactly. The dependency does not have to come from another bundle — anything already in scope can be
assigned there — but keep exactly one instance per JS context. Two copies of a library that holds state
means two independent sets of that state, and the resulting bugs do not point back here.

## A wrong section name does not say so

`loadScript` with an unknown section does not throw a "not found" error. The chunk loader treats the
unknown name as a *relative URL* and fetches it, so a dev server's SPA fallback hands back an HTML page
with a 200 and you get a `SyntaxError: Unexpected token '<'` from evaluating it.

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

- Fetching and `loadScript` live in `background.ts`
- Section name matches the rslib entry key from the build config
- `code === 0` checked before `loadScript`, and `loadScript` wrapped in `try`/`catch`
- `bundleName` is `response.url`, and the URL is absolute
- Externals mounted on `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` before `loadScript`, under the
  exact name the build compiled against
- Everything that consumes the exports runs inside the async callback
- Native: `wait` timeout is in seconds; web: async only, no `.wait()`
