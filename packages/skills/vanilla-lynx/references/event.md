# Runtime Communication API Reference

Use this reference to choose the correct vanilla Lynx event API surface.

## Event API Surfaces

| API surface             | Runtime side                | Use for                                                               |
| ----------------------- | --------------------------- | --------------------------------------------------------------------- |
| `lynx.getEngine()`      | main and background scripts | Get the Lynx engine environment                                       |
| `lynx.getCoreContext()` | background script           | Get the main-thread environment from the background thread            |
| `lynx.getJSContext()`   | main-thread script          | Get the background-thread JavaScript environment from the main thread |

After getting one of these environments, use the same EventTarget-style methods:

```javascript
const target = lynx.getJSContext();

function handleEvent(event) {
  const data = event.data;
}

target.addEventListener("EventName", handleEvent);

target.dispatchEvent({
  type: "EventName",
  data: { key: "value" },
});

target.removeEventListener("EventName", handleEvent);
```

Choose `target` from the runtime boundary:

- Use `lynx.getEngine()` when the target is the engine environment.
- Use `lynx.getCoreContext()` in `background.ts` when the target is the main-thread environment.
- Use `lynx.getJSContext()` in `main-thread.ts` when the target is the background-thread environment.

## Event Names

`__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` are engine-defined lifecycle event names. Use them exactly as provided by Lynx; they are not app-defined names and do not support customization.

```javascript
const renderPageEventName = "__RenderPage";
const updatePageEventName = "__UpdatePage";
const destroyLifetimeEventName = "__DestroyLifetime";
```

The other names below are app-level communication event names used by the examples. Real apps can rename or replace them to match the app protocol, as long as both `main-thread.ts` and `background.ts` use the same names.

```javascript
const updateDataFromMainThreadEventName = "UpdateDataFromMainThread";
const updateDataFromBackgroundEventName = "UpdateDataFromBackground";
const dispatchEventToBackgroundEventName = "DispatchEventToBackground";
```

Use the data events in separate directions:

- `UpdateDataFromMainThread`: main thread dispatches processed Engine render/update data to the background environment. Background treats it as input for background-owned state.
- `UpdateDataFromBackground`: background dispatches a patch back to the main-thread environment. Main thread treats it as a background-driven UI update, mutates Element PAPI nodes as needed, and flushes.
- `DispatchEventToBackground`: main thread dispatches app-level UI tasks to the background environment.

## `lynx.getEngine()`

Use `lynx.getEngine()` in both main-thread and background scripts when code needs the Lynx engine environment. Main-thread code commonly listens to engine lifecycle events:

- `__RenderPage`: initial page render data from the engine.
- `__UpdatePage`: later page update data from the engine.
- `__DestroyLifetime`: LynxView destroy lifecycle.

```javascript
const engine = lynx.getEngine();

function onRenderPage(event) {
  const [data] = event.data;
  renderPage(processData(data));
}

function onUpdatePage(event) {
  const [data] = event.data;
  updatePage(processData(data));
}

function cleanup() {
  engine.removeEventListener(renderPageEventName, onRenderPage);
  engine.removeEventListener(updatePageEventName, onUpdatePage);
  engine.removeEventListener(destroyLifetimeEventName, cleanup);
}

engine.addEventListener(renderPageEventName, onRenderPage);
engine.addEventListener(updatePageEventName, onUpdatePage);
engine.addEventListener(destroyLifetimeEventName, cleanup);
```

When the app has a background thread, the main thread should access the background environment through `lynx.getJSContext()`.

## `lynx.getCoreContext()`

Use `lynx.getCoreContext()` in `background.ts` to get the main-thread environment.

Background listens through the main-thread environment for data, UI tasks, and destroy:

```javascript
const mainThread = lynx.getCoreContext();

function onUpdateDataFromMainThread(event) {
  updateDataFromMainThread(event.data);
}

function onDispatchEventToBackground(event) {
  const payload = event.data;
  if (!payload || typeof payload.handlerName !== "string") return;
  handleEvent(payload.handlerName, payload.data);
}

function cleanupBackground() {
  mainThread.removeEventListener(
    updateDataFromMainThreadEventName,
    onUpdateDataFromMainThread,
  );
  mainThread.removeEventListener(
    dispatchEventToBackgroundEventName,
    onDispatchEventToBackground,
  );
  mainThread.removeEventListener(destroyLifetimeEventName, cleanupBackground);
}

mainThread.addEventListener(
  updateDataFromMainThreadEventName,
  onUpdateDataFromMainThread,
);
mainThread.addEventListener(
  dispatchEventToBackgroundEventName,
  onDispatchEventToBackground,
);
mainThread.addEventListener(destroyLifetimeEventName, cleanupBackground);
```

Background dispatches background-driven updates back to the main-thread environment through `lynx.getCoreContext()`:

```javascript
mainThread.dispatchEvent({
  type: updateDataFromBackgroundEventName,
  data: patch,
});
```

## `lynx.getJSContext()`

Use `lynx.getJSContext()` in `main-thread.ts` to get the background-thread JavaScript environment.

```javascript
const background = lynx.getJSContext();

background.dispatchEvent({
  type: updateDataFromMainThreadEventName,
  data: processedData,
});

background.dispatchEvent({
  type: dispatchEventToBackgroundEventName,
  data: { handlerName: "addTodo", data: undefined },
});

background.dispatchEvent({
  type: destroyLifetimeEventName,
  data: undefined,
});

function onUpdateDataFromBackground(event) {
  updatePage(event.data ?? {});
}

background.addEventListener(
  updateDataFromBackgroundEventName,
  onUpdateDataFromBackground,
);

function cleanupBackgroundPatchListener() {
  background.removeEventListener(
    updateDataFromBackgroundEventName,
    onUpdateDataFromBackground,
  );
}
```

## Common Flow

1. Main thread uses `lynx.getEngine().addEventListener(...)` for `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime`.
2. Main thread uses `lynx.getJSContext()` to get the background-thread environment, then dispatches processed data, UI tasks, and destroy lifecycle through it.
3. Background uses `lynx.getCoreContext()` to get the main-thread environment, listens for forwarded data, UI tasks, and destroy lifecycle, then dispatches patches back through it.
4. Main thread receives messages from the background environment and performs the needed UI updates.
