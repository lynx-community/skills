# Runtime Communication API Reference

Use this reference to choose the correct vanilla Lynx event target and event names. Read [`main-thread.md`](main-thread.md) and [`background.md`](background.md) for complete implementations.

## Choose an Event Target

| API surface             | Runtime side                | Use for                                                               |
| ----------------------- | --------------------------- | --------------------------------------------------------------------- |
| `lynx.getEngine()`      | main and background scripts | Get the Lynx engine environment                                       |
| `lynx.getCoreContext()` | background script           | Get the main-thread environment from the background thread            |
| `lynx.getJSContext()`   | main-thread script          | Get the background-thread JavaScript environment from the main thread |

Each target exposes the same EventTarget-style methods:

```javascript
const target = lynx.getJSContext();

function handleEvent(event) {
  updatePage(event.data);
}

target.addEventListener("EventName", handleEvent);
target.dispatchEvent({
  type: "EventName",
  data: { key: "value" },
});
target.removeEventListener("EventName", handleEvent);
```

- Add and remove a listener on the same target with the same event name and handler reference.
- Remove every listener during `__DestroyLifetime`.
- Keep dispatched payloads small and serializable; do not send functions or Element PAPI node handles.

## Lifecycle Event Names

The following names are engine-defined and must not be customized:

| Event | Meaning | Main-thread responsibility |
| --- | --- | --- |
| `__RenderPage` | Initial render payload | Process the payload and create the Element PAPI tree |
| `__UpdatePage` | Later update payload | Apply the update and call `__FlushElementTree()` |
| `__DestroyLifetime` | LynxView teardown | Remove listeners and forward destroy to the background when present |

## App Event Names

The examples use these app-defined names. An app may rename them, but both runtime sides must use the same protocol.

| Event | Direction | Purpose |
| --- | --- | --- |
| `UpdateDataFromMainThread` | Main → background | Forward processed Engine render or update data |
| `DispatchEventToBackground` | Main → background | Request heavier app-level work from a UI event |
| `UpdateDataFromBackground` | Background → main | Return a serializable state patch for a main-thread UI update |

The main thread owns every Element PAPI mutation and UI flush. The background thread owns heavier work and sends patches instead of mutating UI.

## Implementation Routing

| Task | Read |
| --- | --- |
| Bind Element PAPI node events | [`main-thread.md#bind-element-events`](main-thread.md#bind-element-events) |
| Handle Engine render, update, and destroy | [`main-thread.md#engine-driven-render-and-update`](main-thread.md#engine-driven-render-and-update) |
| Dispatch background tasks, data, and destroy or apply returned patches | [`main-thread.md#background-driven-update`](main-thread.md#background-driven-update) |
| Receive main-thread messages, run heavier work, and return patches | [`background.md`](background.md) |
