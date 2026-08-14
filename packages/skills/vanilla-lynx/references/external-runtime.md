# Load a background-thread external bundle

Load a bundle built by [`external-build.md`](external-build.md) from `background.ts`. Keep
`fetchBundle`, `loadScript`, and the loaded exports on the background thread.

## Background loader

```js
const BUNDLE_URL = 'https://example.com/utils.lynx.bundle';

function loadUtils(onLoaded) {
  lynx.fetchBundle(BUNDLE_URL, {}).then(function(response) {
    if (response.code !== 0) {
      lynx.reportError(new Error(`fetchBundle failed: ${response.code}`));
      return;
    }

    let utils;
    try {
      // `utils` matches the rslib entry key from external-build.md.
      utils = lynx.loadScript('utils', { bundleName: response.url });
    } catch (error) {
      lynx.reportError(error);
      return;
    }

    onLoaded(utils);
  });
}
```

Use an absolute URL. Pass `response.url` as `bundleName` because it is the URL registered by the
runtime after download and decoding. Use the loaded exports inside the callback because `fetchBundle`
is asynchronous.

The background thread can load the exports, call them only after loading completes, and send a
serializable result to the main thread:

```js
// background.ts
const mainThread = lynx.getCoreContext();

loadUtils(function(utils) {
  const total = utils.add(1, 2);
  mainThread.dispatchEvent({
    type: 'ExternalResult',
    data: { total },
  });
});
```

Receive that result through the paired main-thread bridge. Keep Element PAPI mutation and flushing
on the main thread:

```js
// main-thread.ts
const engine = lynx.getEngine();
const backgroundThread = lynx.getJSContext();

function onExternalResult(event) {
  const total = event.data?.total;
  if (typeof total !== 'number' || !resultText) return;

  __ReplaceElements(
    resultText,
    [__CreateRawText(String(total))],
    __GetChildren(resultText),
  );
  __FlushElementTree();
}

function cleanupExternalResult() {
  backgroundThread.removeEventListener('ExternalResult', onExternalResult);
  engine.removeEventListener('__DestroyLifetime', cleanupExternalResult);
}

backgroundThread.addEventListener('ExternalResult', onExternalResult);
engine.addEventListener('__DestroyLifetime', cleanupExternalResult);
```

`resultText` is an existing main-thread Element PAPI text node. Never send that node, a function, or
another runtime handle through the cross-thread event; send JSON-compatible data only.
