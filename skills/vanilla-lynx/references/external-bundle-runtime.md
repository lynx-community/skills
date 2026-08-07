# Load an external bundle at runtime

Load an already-built external bundle with `lynx.fetchBundle` and `lynx.loadScript`, instead of letting
a bundler plugin generate the loading code. Building the bundle is a separate job, and it decides the
section names used here. See [`external-bundle-build.md`](external-bundle-build.md).

Fetch the bundle in `background.ts` and use its exports there.

Write the loading yourself when you control the timing: loading behind a user action or an experiment
flag, resolving the URL at runtime, or running in a host that Rspeedy did not build. `lynx.loadScript`
hands back the section's `module.exports` and nothing else.

## Platform differences

`lynx.fetchBundle(url, {})` downloads and decodes a bundle. `lynx.loadScript(section, { bundleName })`
evaluates one section from a bundle you already fetched. Both need LynxSDK 3.5 or later, which is why
the encoder stamps `targetSdkVersion: '3.5'`.

| | Native (`.lynx.bundle`) | Web (`.web.bundle`) |
| --- | --- | --- |
| `fetchBundle` returns | a `ResponseHandler`, not a Promise | a real `Promise` |
| Synchronous path | `handler.wait(timeoutInSeconds)` | none, async only |
| Async path | `handler.then(callback)`, one callback, no chaining, no rejection | standard `.then` |
| Response shape | `{ url, code, error_msg }` | `{ url, code, errorMsg }` |
| Success | `code === 0` | `code === 0` |
| Timeout | `code === -2`, worth retrying | n/a |

Native `then` is not a thenable. Wrap it once and write everything else against a real Promise. This
wrapper works on both platforms:

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

Pass `response.url` as `bundleName`, not the URL string you started with. The runtime caches decoded
bundles under the URL it resolved, and a redirect or a normalized path makes those two differ.

Use an absolute URL. A root-relative `/utils-lib.lynx.bundle` fails on device with a file-not-found
error. A dev server that serves external bundles needs `assetPrefix` set to a LAN address rather than
`localhost`.

## Loading it in `background.ts`

```js
// The section name is the rslib entry key from the build config.
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

`fetchBundle` is async on every platform, so the exports are never available synchronously. Anything
that needs them runs inside the callback, or behind a promise you pass around.

## Mount externals first

A bundle built with `externals` reads them the moment `loadScript` evaluates it. If the mount point is
empty, evaluation throws a `TypeError` from inside the bundle, something like
`Cannot read properties of undefined (reading 'Utils')`. The bundle looks corrupt. It is not. Nothing
had filled in `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` yet.

Load such a bundle in two stages. Get the dependency, mount it, then load the consumer:

```js
const EXTERNAL_GLOBAL = Symbol.for('__LYNX_EXTERNAL_GLOBAL__');

async function loadFeature() {
  const mount = lynx[EXTERNAL_GLOBAL] ??= {};

  // 1. what the feature bundle expects, under the name it compiled against
  mount.SharedLib = await loadSection(`${CDN}/shared-lib.lynx.bundle`, 'shared');

  // 2. the bundle compiled against it
  return loadSection(`${CDN}/feature.lynx.bundle`, 'feature');
}
```

The mount name is the first element of the external's library name in the build config, and it has to
match exactly. The dependency does not have to come from another bundle. Anything already in scope can
be assigned there. Keep one instance per JS context: two copies of a stateful library means two separate
sets of state, and those bugs are hard to trace back to this code.

## A wrong section name fails badly

`loadScript` does not report an unknown section. The chunk loader treats the name as a relative URL and
fetches it, so a dev server's SPA fallback returns an HTML page with a 200. Evaluating that gives you
`SyntaxError: Unexpected token '<'`.

Wrap `loadScript` in `try`/`catch`. When the error is about parsing rather than loading, check the
section name before you suspect the bundle. Reading the name back from the build's `tasm.json` settles
it quickly.

## Retries and timeouts

Native `wait(timeout)` takes **seconds**. A timeout comes back as `code === -2` rather than throwing.
Handlers are single use, so retry by calling `lynx.fetchBundle` again:

```js
function fetchWithRetry(url, retries) {
  let response = lynx.fetchBundle(url, {}).wait(2);
  while (response.code === -2 && retries-- > 0) {
    response = lynx.fetchBundle(url, {}).wait(2);
  }
  return response;
}
```

Web has no synchronous path. Code that runs on both platforms uses the async wrapper above and treats
`wait` as a native-only optimization.

## Checklist

- Fetching and `loadScript` live in `background.ts`
- Section name matches the rslib entry key from the build config
- `code === 0` checked before `loadScript`, and `loadScript` wrapped in `try`/`catch`
- `bundleName` is `response.url`, and the URL is absolute
- Externals mounted on `lynx[Symbol.for('__LYNX_EXTERNAL_GLOBAL__')]` before `loadScript`, under the
  name the build compiled against
- Everything that uses the exports runs inside the async callback
- Native `wait` timeouts are in seconds; web is async only
