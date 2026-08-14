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

Always identify a context by both its runtime script and getter. The getter name alone does not
determine whether the context is local or cross-thread: main-thread `getCoreContext()` and
background-thread `getJSContext()` are local only, while main-thread `getJSContext()` and
background-thread `getCoreContext()` are the paired cross-thread endpoints.

Use `lynx.getEngine()` only for engine-defined lifecycle events. Never use it for app-defined
thread-local or cross-thread events. For those events, store the appropriate context from the table
and reuse that same object for `dispatchEvent`, `addEventListener`, and `removeEventListener`.

## Cross-Thread Events

The context endpoints are paired across threads. An event dispatched through one endpoint is received through the other endpoint:

| Direction         | Dispatch from sender                     | Listen and clean up in receiver          |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| Main → Background | `main-thread.ts`: `lynx.getJSContext()`  | `background.ts`: `lynx.getCoreContext()` |
| Background → Main | `background.ts`: `lynx.getCoreContext()` | `main-thread.ts`: `lynx.getJSContext()`  |

The same stored cross-thread bridge in each script handles both directions. When answering, show
both runnable dispatch paths and both matching listener paths; a direction table or commented-out
dispatch is not sufficient.

```javascript
// main-thread.ts
const destroyLifetimeEventName = "__DestroyLifetime";
const eventToBackgroundName = "EventToBackground";
const eventToMainName = "EventToMain";

const engine = lynx.getEngine();
const backgroundThreadBridge = lynx.getJSContext();

function dispatchEventToBackground(serializableData) {
  backgroundThreadBridge.dispatchEvent({
    type: eventToBackgroundName,
    data: serializableData,
  });
}

function handleEventFromBackground(event) {
  applyBackgroundPatch(event.data);
}

function handleDestroyLifetime() {
  backgroundThreadBridge.dispatchEvent({ type: destroyLifetimeEventName });
  backgroundThreadBridge.removeEventListener(
    eventToMainName,
    handleEventFromBackground,
  );
  engine.removeEventListener(destroyLifetimeEventName, handleDestroyLifetime);
}

backgroundThreadBridge.addEventListener(
  eventToMainName,
  handleEventFromBackground,
);
engine.addEventListener(destroyLifetimeEventName, handleDestroyLifetime);

dispatchEventToBackground({ task: "computeSummary", values: [1, 2, 3] });
```

```javascript
// background.ts
const destroyLifetimeEventName = "__DestroyLifetime";
const eventToBackgroundName = "EventToBackground";
const eventToMainName = "EventToMain";

const mainThreadBridge = lynx.getCoreContext();

function handleEventFromMain(event) {
  const result = runBackgroundTask(event.data);
  dispatchEventToMain({ result });
}

function dispatchEventToMain(serializableData) {
  mainThreadBridge.dispatchEvent({
    type: eventToMainName,
    data: serializableData,
  });
}

function handleDestroyLifetime() {
  mainThreadBridge.removeEventListener(
    eventToBackgroundName,
    handleEventFromMain,
  );
  mainThreadBridge.removeEventListener(
    destroyLifetimeEventName,
    handleDestroyLifetime,
  );
}

mainThreadBridge.addEventListener(eventToBackgroundName, handleEventFromMain);
mainThreadBridge.addEventListener(
  destroyLifetimeEventName,
  handleDestroyLifetime,
);
```

- Store one cross-thread bridge per script and reuse it for both dispatching and listener
  management: main-thread `backgroundThreadBridge` comes from `lynx.getJSContext()`, while
  background-thread `mainThreadBridge` comes from `lynx.getCoreContext()`.
- Pair `main-thread.ts`'s `lynx.getJSContext()` endpoint with `background.ts`'s `lynx.getCoreContext()` endpoint.
- Never register a long-lived or cross-thread listener with an inline callback; it cannot be removed with the same handler reference.
- Add and remove a listener with the same event name and handler reference.
- Bind cleanup to `__DestroyLifetime`: the main thread listens through `lynx.getEngine()`, forwards
  destroy to the background endpoint, and removes its listeners; the background removes its
  listeners when that forwarded event arrives. Do not present an unregistered `cleanup()` function
  as completed teardown.
- Explicitly state that every cross-thread payload must be small and serializable. Use
  JSON-compatible primitives, arrays, and plain objects; never send functions or Element PAPI node
  handles.

## Thread-Local Events

Each thread can also close an event loop locally. Register, dispatch, and remove the listener on the same local context. These events stay in the current thread and must not be used for cross-thread communication.

Do not use `lynx.getEngine()` for either local event loop. On the main thread, reuse one
`lynx.getCoreContext()` result for all three event operations:

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

On the background thread, reuse one `lynx.getJSContext()` result for all three event operations:

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

Lifecycle handlers may use the event payload when the page depends on engine-provided data, but
they may ignore it when the implementation does not need that data. An empty `__UpdatePage`
placeholder is acceptable when engine-driven updates are intentionally unused.

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
