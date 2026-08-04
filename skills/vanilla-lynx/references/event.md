# Runtime Communication API Reference

Use this reference to choose the correct vanilla Lynx event target and event names. Read [`main-thread.md`](main-thread.md) and [`background.md`](background.md) for complete implementations.

## Choose an Context Target

| API surface             | Runtime side                | Use for                                          |
| ----------------------- | --------------------------- | ------------------------------------------------ |
| `lynx.getEngine()`      | main and background scripts | Get the Lynx engine environment                  |
| `lynx.getCoreContext()` | main and background scripts | Get the main-thread environment                  |
| `lynx.getJSContext()`   | main and background scripts | Get the background-thread JavaScript environment |

Choose the API for the environment you want to target, not for the runtime side making the call. Both main-thread and background scripts can use all three APIs.

## Recommended Cross-Thread Event Ownership

Each target exposes the same EventTarget-style methods. For one event flow, `dispatchEvent`, `addEventListener`, and `removeEventListener` must all address the same target environment. Each script obtains that environment with the same API, and it is recommended that listeners be registered and removed by the thread that owns the target:

| Direction         | Sending thread     | Target thread                        | Event target            |
| ----------------- | ------------------ | ------------------------------------ | ----------------------- |
| Main → Background | Dispatch the event | Add, handle, and remove the listener | `lynx.getJSContext()`   |
| Background → Main | Dispatch the event | Add, handle, and remove the listener | `lynx.getCoreContext()` |

Prefer not to add an event listener through another thread's environment:

- A main-thread script should avoid calling `addEventListener` or `removeEventListener` through `lynx.getJSContext()`.
- A background script should avoid calling `addEventListener` or `removeEventListener` through `lynx.getCoreContext()`.

Prefer keeping listener ownership in the thread that handles the event. In this pattern, the sending thread obtains the other thread's target to call `dispatchEvent`, while the receiving thread registers and removes the listener. An event dispatched on one target is not delivered to a listener registered on another target, even when the event names match.

For a Main → Background event, split the implementation across the two entries while using `lynx.getJSContext()` on both sides:

```javascript
// main-thread.ts
const backgroundThread = lynx.getJSContext();

function dispatchEventToBackground(data) {
  backgroundThread.dispatchEvent({
    type: "EventName",
    data,
  });
}
```

```javascript
// background.ts
const backgroundThread = lynx.getJSContext();

function handleEvent(event) {
  runBackgroundTask(event.data);
}

backgroundThread.addEventListener("EventName", handleEvent);

function cleanup() {
  backgroundThread.removeEventListener("EventName", handleEvent);
}
```

- Use the same target environment for dispatching, adding the listener, and removing the listener.
- Prefer dispatching in the sending thread and adding or removing the listener in the target thread.
- Add and remove a listener with the same event name and handler reference.
- Remove every listener during `__DestroyLifetime`.
- Keep dispatched payloads small and serializable; do not send functions or Element PAPI node handles.

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
