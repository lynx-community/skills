# Main Thread Rendering Reference

Use this reference when writing a `main-thread.ts` entry. The main-thread script owns Element PAPI tree creation, node mutation, lifecycle rendering, and UI flushes.

Read `event.md` for `lynx.getEngine()` and event environment APIs. If the page needs a background thread, read [`background.md`](background.md).

## Responsibilities

- Create the page root and child nodes with Element PAPI APIs.
- Apply classes, attributes, inline styles, datasets, and child relationships.
- Bind lightweight node events on the main thread and remove those listeners during cleanup.
- Render initial data from `__RenderPage`.
- Apply later engine data to the UI tree.
- Rely on the SDK default flush for initial `renderPage`; call `__FlushElementTree()` after later UI mutations.
- For background-thread workflows, heavy business logic, timers, async requests, or native calls, read [`background.md`](background.md).

## Element PAPI Surface

All Element PAPI APIs available on the main thread can be found in [`@lynx-js/type-element-api`](https://www.npmjs.com/package/@lynx-js/type-element-api).

Recommended APIs:

- `__CreatePage`: create the page root.
- `__GetElementUniqueID`: get the root element id for child creation.
- `__CreateView`: create a container node.
- `__CreateText`: create a text node.
- `__CreateRawText`: create text content for a text node.
- `__CreateImage`: create an image node.
- `__SetClasses` and `__AddClass`: apply styling classes.
- `__SetID`: set a stable element id.
- `__SetInlineStyles`: set inline styles on a node.
- `__SetAttribute`: set node attributes.
- `__SetDataset` and `__AddDataset`: store metadata for events or lookup.
- `__AppendElement`: attach a child node.
- `__ReplaceElements`: replace child ranges during updates.
- `__GetChildren`: inspect current child nodes before replacement or cleanup.
- `__AddEventListener`: bind UI events to Element PAPI nodes on the main thread.
- `__RemoveEventListener`: remove node event listeners during cleanup.
- `__ElementIsEqual`: compare Element PAPI node references when cleaning listener registries.

Do not use these APIs in main-thread examples or apps:

- `__CreateFor`
- `__CreateIf`
- `__UpdateIfNodeIndex`
- `__UpdateForChildCount`
- `__SetLepusInitData`
- `__CreateStyleObject`
- `__SetStyleObject`
- `__UpdateStyleObject`
- `__AddEvent`

Do not use `__AddEvent` to bind UI events. Use `__AddEventListener` and remove the listener with the matching `__RemoveEventListener` call.

## Build the Tree

Create the page root once, then create and append child nodes. Keep node references that need later updates in module scope.

```javascript
const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

const container = __CreateView(pageId);
__SetClasses(container, "container");
__AppendElement(page, container);

const title = __CreateText(pageId);
__SetClasses(title, "title");
__AppendElement(title, __CreateRawText("Hello Lynx!"));
__AppendElement(container, title);

const actionArea = __CreateView(pageId);
__SetClasses(actionArea, "button button-primary");
__SetInlineStyles(actionArea, "width: 100%; height: 48px;");
__SetID(actionArea, "submit-button");
__SetAttribute(actionArea, "aria-label", "Submit form");
__SetDataset(actionArea, { action: "submit" });
__AppendElement(container, actionArea);

const image = __CreateImage(pageId);
__SetClasses(image, "hero-image");
__SetAttribute(image, "src", "https://example.com/image.png");
__AppendElement(container, image);
```

## Bind Element Events

Bind Element PAPI node events directly on the main thread. Keep the handler lightweight when the event only mutates UI state. If the event needs heavier business logic, async work, timers, or native calls, bind the UI event on the main thread and dispatch a serializable task to the background thread.

Track every listener you add so node replacement and `__DestroyLifetime` cleanup can remove the listener with the same node, event name, handler, and options object. The `bindBackgroundEvent` helper uses the `dispatchTaskToBackground` function shown in [Background-Driven Update](#background-driven-update).

```javascript
const elementEventListeners = [];

function bindMainThreadEvent(node, name, handler, eventOptions = {}) {
  __AddEventListener(node, name, handler, eventOptions);
  elementEventListeners.push({ node, name, handler, eventOptions });
}

function bindBackgroundEvent(node, name, handlerName, data) {
  bindMainThreadEvent(node, name, () => {
    dispatchTaskToBackground(handlerName, data);
  });
}

function clearNodeEvents(element) {
  for (const child of __GetChildren(element)) {
    clearNodeEvents(child);
  }

  for (let index = elementEventListeners.length - 1; index >= 0; index -= 1) {
    const listener = elementEventListeners[index];
    if (!__ElementIsEqual(listener.node, element)) continue;

    elementEventListeners.splice(index, 1);
    __RemoveEventListener(
      listener.node,
      listener.name,
      listener.handler,
      listener.eventOptions,
    );
  }
}

function clearNodesEvents(elements) {
  for (const element of elements) {
    clearNodeEvents(element);
  }
}

function clearAllEvents() {
  const currentListeners = elementEventListeners.splice(0);
  for (const { node, name, handler, eventOptions } of currentListeners) {
    __RemoveEventListener(node, name, handler, eventOptions);
  }
}
```

Use the helpers when creating tappable or interactive nodes:

```javascript
bindMainThreadEvent(actionArea, "tap", () => {
  updatePage({ value: "Submitted" });
});

bindBackgroundEvent(actionArea, "longpress", "computeSummary", [
  { value: 3 },
  { value: 4 },
]);
```

## Render and Update Drivers

Main-thread UI updates are driven by Engine lifecycle events. Initial `renderPage` can rely on the SDK default flush. Later update routes mutate Element PAPI nodes on the main thread and call `__FlushElementTree()`.

### Engine-Driven Render and Update

Use the engine environment returned from `lynx.getEngine()` for Engine-driven rendering and updates. The engine dispatches `__RenderPage` with the first render payload, dispatches `__UpdatePage` with later update payloads, and dispatches `__DestroyLifetime` for cleanup. The main-thread script listens to both `__RenderPage` and `__UpdatePage`: `__RenderPage` creates the initial tree, and `__UpdatePage` applies later main-thread updates.

Basic Engine-driven render/update shape:

- `__RenderPage`: process Engine input and create the initial Element PAPI tree.
- `__UpdatePage`: process Engine input, apply the later UI update, then flush.
- `__DestroyLifetime`: remove Engine listeners and release local references.

```javascript
const renderPageEventName = "__RenderPage";
const updatePageEventName = "__UpdatePage";
const destroyLifetimeEventName = "__DestroyLifetime";

const engine = lynx.getEngine();

let currentState = {};
let valueText;

function processData(data) {
  return {
    ...data,
    color: data?.color ?? "red",
    value: data?.value ?? "Hello Lynx!",
  };
}

function renderPage(data) {
  currentState = data;

  const view = __CreateView(pageId);
  __SetInlineStyles(view, `color: ${data.color};`);

  valueText = __CreateText(pageId);
  __AppendElement(valueText, __CreateRawText(data.value));
  __AppendElement(view, valueText);
  __AppendElement(page, view);
}

function updatePage(patch) {
  currentState = {
    ...currentState,
    ...patch,
  };

  if (patch.value !== undefined && valueText) {
    __ReplaceElements(
      valueText,
      [__CreateRawText(patch.value)],
      __GetChildren(valueText),
    );
  }

  __FlushElementTree();
}

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
  clearAllEvents();
  valueText = undefined;
}

engine.addEventListener(renderPageEventName, onRenderPage);
engine.addEventListener(updatePageEventName, onUpdatePage);
engine.addEventListener(destroyLifetimeEventName, cleanup);
```

### Background-Driven Update

For complex tasks that need a background thread, read [`background.md`](background.md). Keep this reference focused on the main-thread side: dispatch task requests to the background thread, then listen for background patches and update the UI on the main thread.

The event names below mirror [`background.md`](background.md) for the example only. Real apps can choose their own shared event names.

```javascript
const updateDataFromBackgroundEventName = "UpdateDataFromBackground";
const dispatchEventToBackgroundEventName = "DispatchEventToBackground";

const backgroundThread = lynx.getJSContext();

function dispatchTaskToBackground(handlerName, data) {
  backgroundThread.dispatchEvent({
    type: dispatchEventToBackgroundEventName,
    data: {
      handlerName,
      data,
    },
  });
}

function onBackgroundData(event) {
  const patch = event.data;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return;

  currentState = {
    ...currentState,
    ...patch,
  };

  if (patch.total !== undefined && valueText) {
    __ReplaceElements(
      valueText,
      [__CreateRawText(String(patch.total))],
      __GetChildren(valueText),
    );
    __FlushElementTree();
  }
}

function cleanupBackgroundBridge() {
  backgroundThread.removeEventListener(
    updateDataFromBackgroundEventName,
    onBackgroundData,
  );
  engine.removeEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);
}

backgroundThread.addEventListener(
  updateDataFromBackgroundEventName,
  onBackgroundData,
);
engine.addEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);

dispatchTaskToBackground("computeSummary", [{ value: 3 }, { value: 4 }]);
```
