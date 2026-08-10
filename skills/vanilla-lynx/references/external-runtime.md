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

The background thread can start loading directly:

```js
loadUtils(function(utils) {
  runBackgroundTask(utils.add(1, 2));
});
```

If the result affects UI, send a serializable result to `main-thread.ts`; see
[`event.md`](event.md).
