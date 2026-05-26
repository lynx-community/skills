# Lynx-consumable JSON Output Reference

Use this reference for LLM to generate Lynx-consumable JSON output.

## Output Shape

A Lynx-consumable JSON output includes four parts.

```jsonc
{
  "dsl": "react_nodiff",
  "main-thread": "/* main thread code string */",
  "background": "/* background code string */",
  "style": {
    "cssMap": {
      /* css content */
    },
  },
}
```

### dsl

The DSL name used by the output, only support `react_nodiff` now.

## main-thread

Contains the main-thread JavaScript code as a string.

The generated code must be plain native JavaScript only and must not include anything that requires an additional build step.

Reference: [Main Thread Rendering](main-thread-rendering.md) for more details to generate valid main-thread code.

## background

Contains the background JavaScript code as a string.

The generated code must be plain native JavaScript only and wrapped to an intermediate function, must strictly follow the following wrapper format.

```javascript
(function () {
  "use strict";
  var g = new Function("return this;")();
  function __init_card_bundle__(lynxCoreInject) {
    g.__bundle__holder = undefined;
    var globDynamicComponentEntry = g.globDynamicComponentEntry || "__Card__";
    var tt = lynxCoreInject.tt;
    tt.define(
      "background.js",
      function (
        require,
        module,
        exports,
        Card,
        setTimeout,
        setInterval,
        clearInterval,
        clearTimeout,
        NativeModules,
        tt,
        console,
        Component,
        ReactLynx,
        nativeAppId,
        Behavior,
        LynxJSBI,
        lynx,
        window,
        document,
        frames,
        self,
        location,
        navigator,
        localStorage,
        history,
        Caches,
        screen,
        alert,
        confirm,
        prompt,
        fetch,
        XMLHttpRequest,
        __WebSocket__,
        webkit,
        Reporter,
        print,
        global,
        requestAnimationFrame,
        cancelAnimationFrame,
      ) {
        lynx = lynx || {};
        lynx.targetSdkVersion = lynx.targetSdkVersion || "3.2";
        var Promise = lynx.Promise;
        fetch = fetch || lynx.fetch;
        requestAnimationFrame =
          requestAnimationFrame || lynx.requestAnimationFrame;
        cancelAnimationFrame =
          cancelAnimationFrame || lynx.cancelAnimationFrame;

        /** background thread code generated according to user requirements */
        const params = lynxCoreInject.tt._params;
        const renderData = {
          ...(params?.initData ?? {}),
          ...(params?.updateData ?? {}),
        };
        // ...
        /** end of background thread code */
      },
    );
    return tt.require("background.js");
  }
  if (g && g.bundleSupportLoadScript) {
    var res = { init: __init_card_bundle__ };
    g.__bundle__holder = res;
    return res;
  } else {
    __init_card_bundle__({ tt: tt });
  }
})();
```

Reference: [double-thread-data-sync](double-thread-data-sync.md) for more details to generate background-thread code which can handle async events and sync patch to main-thread.

## `style`

Contains the style payload consumed by Lynx, usually in the form of a `cssMap`.

`cssMap` is a object with key as the style chunk index. Each css chunk is an array of CSS rule records. Each record typically carries:

- `type`: the style record type, should always be `StyleRule`
- `style`: the concrete CSS declarations array, each declaration has a `name` and a `value`. `name` is the CSS property name, `value` is the CSS property value. `name` and `value` should be valid CSS in Lynx.
- `selectorText`: the selector string object, with a `value` property. `value` is the selector string.

Example:

```jsonc
{
  "style": {
    "cssMap": {
      "0": [
        {
          "type": "StyleRule",
          "style": [
            {
              "name": "background-color",
              "value": "#101114",
            },
          ],
          "selectorText": {
            "value": ".page",
          },
        },
      ],
    },
  },
}
```

## Verification

Run the helper script from the directory that contains the generated JSON file:

```bash
node <path_to_the_skill>/scripts/index.mjs output.json --avd <avd-name>
```

- The script serves the current directory over HTTP.
- If no Android emulator is already running, it starts the AVD passed through `--avd`.
- It opens the JSON URL on the device and keeps the server alive for manual verification.
