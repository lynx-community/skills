# Runtime Communication API Reference

Use this reference to choose the correct Vanilla Lynx event target and event names. Read [`main-thread.md`](main-thread.md) and [`background.md`](background.md) for complete implementations.

## Table of Contents

- [Choose a Context](#choose-a-context)
- [Cross-Thread Events](#cross-thread-events)
- [Thread-Local Events](#thread-local-events)
- [Lifecycle Event Names](#lifecycle-event-names)
- [App Event Names](#app-event-names)
- [Implementation Routing](#implementation-routing)

## Choose a Context

The behavior of a context getter depends on the thread that calls it:

| Runtime script   | Context getter          | Event behavior                                |
| ---------------- | ----------------------- | --------------------------------------------- |
| `main-thread.ts` | `lynx.getCoreContext()` | Main-thread local event loop                  |
| `main-thread.ts` | `lynx.getJSContext()`   | Cross-thread endpoint connected to background |
| `background.ts`  | `lynx.getJSContext()`   | Background-thread local event loop            |
| `background.ts`  | `lynx.getCoreContext()` | Cross-thread endpoint connected to main       |

Use `lynx.getEngine()` in either script for Engine lifecycle events. Every returned context exposes `dispatchEvent`, `addEventListener`, and `removeEventListener`.

## Cross-Thread Events

The context endpoints are paired across threads. An event dispatched through one endpoint is received through the other endpoint:

| Direction         | Dispatch from sender                     | Listen and clean up in receiver          |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| Main → Background | `main-thread.ts`: `lynx.getJSContext()`  | `background.ts`: `lynx.getCoreContext()` |
| Background → Main | `background.ts`: `lynx.getCoreContext()` | `main-thread.ts`: `lynx.getJSContext()`  |

The same cross-thread context in each script can handle both event directions:

```javascript
// main-thread.ts
const backgroundThread = lynx.getJSContext();

function dispatchEventToBackground(data) {
  backgroundThread.dispatchEvent({
    type: "EventToBackground",
    data,
  });
}

function handleBackgroundEvent(event) {
  applyBackgroundPatch(event.data);
}

backgroundThread.addEventListener("EventToMain", handleBackgroundEvent);

function cleanup() {
  backgroundThread.removeEventListener("EventToMain", handleBackgroundEvent);
}
```

```javascript
// background.ts
const mainThread = lynx.getCoreContext();

function handleMainEvent(event) {
  runBackgroundTask(event.data);
}

mainThread.addEventListener("EventToBackground", handleMainEvent);

function dispatchEventToMain(data) {
  mainThread.dispatchEvent({
    type: "EventToMain",
    data,
  });
}

function cleanup() {
  mainThread.removeEventListener("EventToBackground", handleMainEvent);
}
```

- Reuse the cross-thread context returned in each script for dispatching and listener management.
- Pair `main-thread.ts`'s `lynx.getJSContext()` endpoint with `background.ts`'s `lynx.getCoreContext()` endpoint.
- Never register a long-lived or cross-thread listener with an inline callback; it cannot be removed with the same handler reference.
- Add and remove a listener with the same event name and handler reference.
- Remove every listener during `__DestroyLifetime`.
- Keep dispatched payloads small and serializable; do not send functions or Element PAPI node handles.

## Thread-Local Events

Each thread can also close an event loop locally. Register, dispatch, and remove the listener on the same local context. These events stay in the current thread and must not be used for cross-thread communication.

Main-thread local event:

```javascript
// main-thread.ts
const localContext = lynx.getCoreContext();

function handleLocalEvent(event) {
  updateMainThreadState(event.data);
}

localContext.addEventListener("MainThreadLocalEvent", handleLocalEvent);
localContext.dispatchEvent({
  type: "MainThreadLocalEvent",
  data: { value: 1 },
});
localContext.removeEventListener("MainThreadLocalEvent", handleLocalEvent);
```

Background-thread local event:

```javascript
// background.ts
const localContext = lynx.getJSContext();

function handleLocalEvent(event) {
  updateBackgroundState(event.data);
}

localContext.addEventListener("BackgroundLocalEvent", handleLocalEvent);
localContext.dispatchEvent({
  type: "BackgroundLocalEvent",
  data: { value: 1 },
});
localContext.removeEventListener("BackgroundLocalEvent", handleLocalEvent);
```

In particular, `lynx.getCoreContext()` in `main-thread.ts` is a self-loop and does not reach `background.ts`. Use the paired cross-thread contexts when the receiver is on the other thread.

## Lifecycle Event Names

The following names are engine-defined and must not be customized:

| Event               | Meaning                | Main-thread responsibility                                          |
| ------------------- | ---------------------- | ------------------------------------------------------------------- |
| `__RenderPage`      | Initial render payload | Process the payload and create the Element PAPI tree                |
| `__UpdatePage`      | Later update payload   | Apply the update and call `__FlushElementTree()`                    |
| `__DestroyLifetime` | LynxView teardown      | Remove listeners and forward destroy to the background when present |

## App Event Names

The examples use these app-defined names. An app may rename them, but both runtime sides must use the same protocol.

| Event                       | Direction         | Purpose                                                       |
| --------------------------- | ----------------- | ------------------------------------------------------------- |
| `UpdateDataFromMainThread`  | Main → background | Forward processed Engine render or update data                |
| `DispatchEventToBackground` | Main → background | Request heavier app-level work from a UI event                |
| `PatchFromBackground`       | Background → main | Return a serializable state patch for a main-thread UI update |

The main thread owns every Element PAPI mutation and UI flush. The background thread owns heavier work and sends patches instead of mutating UI.

## Implementation Routing

| Task                                                                   | Read                                                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Bind Element PAPI node events                                          | [`main-thread.md#bind-element-events`](main-thread.md#bind-element-events)                         |
| Handle Engine render, update, and destroy                              | [`main-thread.md#engine-driven-render-and-update`](main-thread.md#engine-driven-render-and-update) |
| Dispatch background tasks, data, and destroy or apply returned patches | [`main-thread.md#background-driven-update`](main-thread.md#background-driven-update)               |
| Receive main-thread messages, run heavier work, and return patches     | [`background.md`](background.md)                                                                   |
