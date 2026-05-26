# Double-Thread Data Sync Reference

Use this reference when a FiberElement app needs first-screen data, background-side async updates, or event-driven updates. Keep the main thread deterministic: it renders payloads, updates Element PAPI nodes, and flushes. Keep data loading, native updates, timers, and event handling in the background thread.

## Thread Boundaries

main-thread

- Receives first-screen data through `processData(data)`.
- Receives background patches through `updatePage(patch)`.
- Owns UI tree creation and all Element PAPI mutations.
- Treats incoming data as render input only; it does not perform async work or call native background APIs directly.

background

- `lynxCoreInject.tt` is the background-thread bridge for card data and event dispatch.
- Reads native data from `lynxCoreInject.tt._params.initData` and `lynxCoreInject.tt._params.updateData`.
- Intercepts events through `lynxCoreInject.tt.publishEvent(handlerName, data)`.
- Use `lynx.getNativeApp().callLepusMethod(...)` to send patches to the main thread.
- Never touches Element PAPI APIs.

## Background Skeleton

```javascript
const previousPublishEvent = lynxCoreInject.tt.publishEvent;

let state = {
  ...(lynxCoreInject.tt._params?.initData ?? {}),
  ...(lynxCoreInject.tt._params?.updateData ?? {}),
};

lynxCoreInject.tt.publishEvent = (handlerName, data) => {
  if (handlerName === "increment") {
    state = {
      ...state,
      count: Number(state["count"] ?? 0) + 1,
    };

    lynx.getNativeApp().callLepusMethod("updatePage", {
      count: state["count"],
    });
    return;
  }

  previousPublishEvent?.call(lynxCoreInject.tt, handlerName, data);
};
```

This shows the raw flow: the background thread reads `_params`, handles events through `publishEvent`, updates its own state, and sends patches to the main thread with `callLepusMethod("updatePage", patch)`.

## Main Thread Contract

```javascript
let currentState = undefined;

function processData(data) {
  currentState = data;
  return currentState;
}

function renderPage(data) {
  const button = __CreateView(pageId);
  __SetClasses(button, "button");
  __AddEvent(button, "bindEvent", "tap", "increment");
  __AppendElement(page, button);
}

function updatePage(patch) {
  // 1. merge state
  currentState = {
    ...(currentState ?? {}),
    ...patch,
  };

  // 2. render according to the patch
  // ...

  // 3. trigger ui update
  __FlushElementTree();
}

Object.assign(globalThis, { processData, renderPage, updatePage });
```

The main thread receives the first render through `processData(data)`, renders the initial tree and binds events inside `renderPage(data)`, merges background patches inside `updatePage(patch)`, rerenders with the merged state, and flushes the Element tree.

## Flow

- Startup
  - Background reads `lynxCoreInject.tt._params.initData` and `lynxCoreInject.tt._params.updateData`.
  - Main thread receives first-screen data through `processData(data)` and renders it.
- Event Sync
  - Native dispatches an event into `lynxCoreInject.tt.publishEvent(handlerName, data)`.
  - Background handles the event, updates its own state, and calls `lynx.getNativeApp().callLepusMethod("updatePage", patch)`.
  - Main thread receives `updatePage(patch)`, merges the patch, rerenders, and flushes the Element tree.
