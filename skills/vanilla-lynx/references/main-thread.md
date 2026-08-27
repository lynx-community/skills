# Main Thread Rendering Reference

Use this reference when writing a `main-thread.ts` entry. The main-thread script owns Element PAPI tree creation, node mutation, lifecycle rendering, and UI flushes.

Read `event.md` for `lynx.getEngine()` and event environment APIs. If the page needs a background thread, read [`background.md`](background.md).

## Table of Contents

- [Responsibilities](#responsibilities)
- [Element PAPI Surface](#element-papi-surface)
- [Build the Tree](#build-the-tree)
- [Bind Element Events](#bind-element-events)
- [Render](#render)
- [Update](#update)
  - [Engine-Driven Update](#engine-driven-update)
  - [Background-Driven Update](#background-driven-update)
- [Lifecycle Cleanup](#lifecycle-cleanup)

## Responsibilities

- Create the page root and child nodes with Element PAPI APIs.
- Apply classes, attributes, inline styles, datasets, and child relationships.
- Bind lightweight node events on the main thread and remove those listeners during cleanup.
- Render initial data from `__RenderPage`.
- Apply later engine data from `__UpdatePage` to the UI tree.
- Register `__DestroyLifetime` to remove runtime and node listeners.
- Rely on the SDK default flush for initial `renderPage`; call `__FlushElementTree()` after later UI mutations.
- For background-thread workflows, heavy business logic, timers, async requests, or native calls, read [`background.md`](background.md).

## Element PAPI Surface

All Element PAPI APIs available on the main thread can be found in [`@lynx-js/type-element-api`](https://www.npmjs.com/package/@lynx-js/type-element-api).

Treat `ElementRef` as an opaque main-thread handle. Never read or write its properties, enumerate it, clone or spread it, serialize it, or attach application state to it. Use Element PAPI APIs to inspect or mutate element state, and use `__ElementIsEqual` to compare node references.

### Create APIs

Create the page root with the fixed call `__CreatePage("0", 0)`. Then obtain `pageId` from `__GetElementUniqueID(page)` and pass it as the first argument to `__CreateView`, `__CreateScrollView`, `__CreateText`, and `__CreateImage`. `__CreateRawText` takes visible text instead.

| API                                                | Parameters                                                                     | Use                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `__CreatePage("0", 0)`                            | Always pass the literal values `"0"` and `0`.                                 | Create the page root.                                     |
| `__CreateScrollView(pageId: number)`               | `pageId` is the page root's unique id.                                         | Create a scrollable container node.                       |
| `__CreateView(pageId: number)`                     | `pageId` is the page root's unique id.                                         | Create a container node.                                  |
| `__CreateImage(pageId: number)`                    | `pageId` is the page root's unique id.                                         | Create an image node.                                     |
| `__CreateText(pageId: number)`                     | `pageId` is the page root's unique id.                                         | Create a text element that can contain raw-text children. |
| `__CreateRawText(text: string)`                    | `text` is the visible string.                                                  | Create text content to append under a text element.       |

### Tree APIs

| API                                                                                                                                          | Parameters                                                                                        | Use                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `__AppendElement(parent: ElementRef, child: ElementRef)`                                                                                     | `parent` receives the node; `child` is the node to append.                                        | Attach a child node.                               |
| `__ReplaceElements(parent: ElementRef, inserted: ElementRef \| ElementRef[] \| undefined, removed: ElementRef \| ElementRef[] \| undefined)` | `parent` owns the range; `inserted` and `removed` each accept one node, an array, or `undefined`. | Replace child nodes during updates.                |
| `__GetChildren(parent: ElementRef)`                                                                                                          | `parent` is the node whose direct children are requested.                                         | Inspect child nodes before replacement or cleanup. |

### Element ID APIs

| API                                             | Parameters                                                         | Use                                      |
| ----------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| `__SetID(node: ElementRef, id: string \| null)` | `node` is the target; `id` accepts an element-id string or `null`. | Set a stable element id.                 |
| `__GetID(node: ElementRef)`                     | `node` is the target.                                              | Get the element's stable id as a string. |

### Class APIs

| API                                                            | Parameters                                                                                                 | Use                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `__SetClasses(node: ElementRef, classes: string \| undefined)` | `node` is the target; `classes` is the complete class string, or `undefined` when there is no class value. | Replace the node's applied classes.                     |
| `__GetClasses(node: ElementRef)`                               | `node` is the target.                                                                                      | Get the applied class names as a string array.          |
| `__AddClass(node: ElementRef, className: string)`              | `node` is the target; `className` is the class name to add.                                                | Add a styling class without replacing existing classes. |

### Inline Style APIs

| API                                                    | Parameters                                                                                                                 | Use                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `__SetInlineStyles(node: ElementRef, styles: unknown)` | `node` is the target; `styles` is the runtime style payload. The type package intentionally leaves its shape as `unknown`. | Apply runtime-computed inline styles.     |
| `__GetInlineStyles(node: ElementRef)`                  | `node` is the target.                                                                                                      | Get the node's inline styles as a string. |

### Attribute APIs

| API                                                          | Parameters                                                                   | Use                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------ |
| `__SetAttribute(node: ElementRef, name: string, value: any)` | `node` is the target; `name` identifies the attribute; `value` is its value. | Set a node attribute.          |
| `__GetAttributeByName(node: ElementRef, name: string)`       | `node` is the target; `name` identifies the attribute.                       | Get the named attribute value. |

### Dataset APIs

| API                                                                             | Parameters                                                                          | Use                                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `__SetDataset(node: ElementRef, dataset: Record<string, unknown> \| undefined)` | `node` is the target; `dataset` accepts a complete dataset record or `undefined`.   | Set dataset metadata used by events or lookup. |
| `__GetDataset(node: ElementRef)`                                                | `node` is the target.                                                               | Get the complete dataset record.               |
| `__AddDataset(node: ElementRef, key: string, value: unknown)`                   | `node` is the target; `key` names one dataset entry; `value` is that entry's value. | Add one dataset entry.                         |

### Event Listener APIs

| API                                                                                                                                         | Parameters                                                                                                                                                                                                                                                                                                 | Use                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `__AddEventListener(node: ElementRef, eventName: string, handler: ElementEventCallback \| string, options: ElementEventListenerOptions)`    | `node` is the event target; `eventName` identifies the event; `handler` is an `(event: ElementEvent) => void` function or string value; `options` is required even though its `capture`, `once`, `passive`, `signal`, `closure_type`, and `bind_type` fields are optional. Pass `{}` when none are needed. | Bind a UI event on the main thread.          |
| `__RemoveEventListener(node: ElementRef, eventName: string, handler: ElementEventCallback \| string, options: ElementEventListenerOptions)` | Pass the corresponding target, event name, handler, and options used when adding the listener. All four parameters are required.                                                                                                                                                                           | Remove a node event listener during cleanup. |

### Runtime Utility APIs

| API                                                     | Parameters                                                         | Use                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| `__GetElementUniqueID(node: ElementRef)`                | `node` is the Element PAPI node whose numeric unique id is needed. | Get the `pageId` passed to element-creation APIs. |
| `__ElementIsEqual(left: ElementRef, right: ElementRef)` | `left` and `right` are the two node references to compare.         | Compare Element PAPI node references.             |

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

Do not use `__AddEvent` to bind UI events. Use `__AddEventListener` and pair it with matching `__RemoveEventListener` cleanup.

## Build the Tree

Create the page root once, then create and append child nodes. Keep node
references that need later updates in module scope.

### Vertically Scrollable Container

Prefer a vertically scrollable container for page-level content because the page root does not scroll by itself. Ensure the scroll view resolves to a viewport-bounded height: it may inherit the viewport height through its layout chain or declare a height when the surrounding layout does not provide one. Then append a regular view as its content container. Use a non-scrollable root container only when the content is known to fit within the viewport.

```javascript
const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

const scrollView = __CreateScrollView(pageId);
__SetClasses(scrollView, "page-scroll");
__SetAttribute(scrollView, "scroll-orientation", "vertical");
__AppendElement(page, scrollView);

const container = __CreateView(pageId);
__SetClasses(container, "container");
__AppendElement(scrollView, container);

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

Element PAPI node events must always be bound and removed on the main thread. `background.ts` never receives an `ElementRef` and never calls `__AddEventListener` or `__RemoveEventListener`.

### Main-Thread Node Events

Keep the handler on the main thread when an event only mutates UI state. Track every listener so node replacement and `__DestroyLifetime` cleanup can remove it with the corresponding node, event name, handler, and options.

```javascript
const elementEventListeners = [];

function bindMainThreadEvent(node, name, handler, eventOptions) {
  __AddEventListener(node, name, handler, eventOptions);
  elementEventListeners.push({ node, name, handler, eventOptions });
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

Bind a lightweight main-thread handler for direct UI updates:

```javascript
bindMainThreadEvent(
  actionArea,
  "tap",
  () => {
    updatePage({ value: "Submitted" });
  },
  {},
);
```

### Background-Thread Event Dispatch

When a node event needs heavier business logic, async work, timers, or native calls, keep the Element PAPI listener on the main thread and dispatch a small, serializable task through the cross-thread bridge. Never send a function or `ElementRef`. The helper below uses `dispatchEventToBackground` from [Background-Driven Update](#background-driven-update); `background.ts` receives the task as described in [`background.md`](background.md).

```javascript
function bindBackgroundEvent(node, name, handlerName, data) {
  bindMainThreadEvent(
    node,
    name,
    () => {
      dispatchEventToBackground(handlerName, data);
    },
    {},
  );
}
```

Bind the main-thread node event to a background task name and serializable payload:

```javascript
bindBackgroundEvent(actionArea, "longpress", "computeSummary", [
  { value: 3 },
  { value: 4 },
]);
```

## Render

Use the engine environment returned from `lynx.getEngine()` for the initial `__RenderPage` lifecycle event. `renderPage` can rely on the SDK default flush.

The render and update examples below share this module-scope setup:

```javascript
const renderPageEventName = "__RenderPage";
const updatePageEventName = "__UpdatePage";
const destroyLifetimeEventName = "__DestroyLifetime";

Object.assign(globalThis, {
  processData: () => {},
});

const engine = lynx.getEngine();

let currentState = {};
let valueText;

function normalizeData(data) {
  return {
    ...data,
    color: data?.color ?? "red",
    value: data?.value ?? "Hello Lynx!",
  };
}
```

Currently, Lynx SDK requires a `processData` implementation on `globalThis`. The main-thread script can instead assign its own data-processing function when native initialization data needs normalization.

The engine dispatches `__RenderPage` with the initial payload. Process that payload and create the initial Element PAPI tree in `renderPage`. The handler may ignore its payload when the implementation does not need engine-provided data. Do not call `__FlushElementTree()` solely for this initial render; rely on the SDK default flush.

```javascript
function renderPage(data) {
  currentState = data;

  const view = __CreateView(pageId);
  __SetInlineStyles(view, `color: ${data.color};`);

  valueText = __CreateText(pageId);
  __AppendElement(valueText, __CreateRawText(data.value));
  __AppendElement(view, valueText);
  __AppendElement(page, view);
}

function onRenderPage(event) {
  const [data] = event.data;
  renderPage(normalizeData(data));
}

engine.addEventListener(renderPageEventName, onRenderPage);
```

## Update

Every update after the initial render mutates the existing tree on the main thread and calls `__FlushElementTree()`. Choose the update driver based on where the new data originates.

### Engine-Driven Update

The engine dispatches `__UpdatePage` with later update payloads. Process the payload, apply the UI mutation, and call `__FlushElementTree()`. The handler may remain a placeholder when the page intentionally does not consume engine-driven updates.

```javascript
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

function onUpdatePage(event) {
  const [data] = event.data;
  updatePage(normalizeData(data));
}

engine.addEventListener(updatePageEventName, onUpdatePage);
```

### Background-Driven Update

For complex tasks that need a background thread, read [`background.md`](background.md). Keep this reference focused on the main-thread side: dispatch task requests to the background thread, then listen for background patches and update the UI on the main thread.

The event names below mirror [`background.md`](background.md) for the example only. Real apps can choose their own shared event names.

In `main-thread.ts`, use `const backgroundThread = lynx.getJSContext()` so the cross-thread target is explicit, then reuse it for both directions: dispatch events to background and add or remove listeners for events sent back from background. The background counterpart similarly uses `const mainThread = lynx.getCoreContext()`.

```javascript
const patchFromBackgroundEventName = "PatchFromBackground";
const updateDataFromMainThreadEventName = "UpdateDataFromMainThread";
const dispatchEventToBackgroundEventName = "DispatchEventToBackground";

const backgroundThread = lynx.getJSContext();

function dispatchDataToBackground(data) {
  backgroundThread.dispatchEvent({
    type: updateDataFromMainThreadEventName,
    data,
  });
}

function dispatchEventToBackground(handlerName, data) {
  backgroundThread.dispatchEvent({
    type: dispatchEventToBackgroundEventName,
    data: {
      handlerName,
      data,
    },
  });
}

function onBackgroundPatch(event) {
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
  backgroundThread.dispatchEvent({
    type: destroyLifetimeEventName,
    data: undefined,
  });
  backgroundThread.removeEventListener(
    patchFromBackgroundEventName,
    onBackgroundPatch,
  );
  engine.removeEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);
}

backgroundThread.addEventListener(
  patchFromBackgroundEventName,
  onBackgroundPatch,
);
engine.addEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);

dispatchEventToBackground("computeSummary", [{ value: 3 }, { value: 4 }]);
```

Call `dispatchDataToBackground(processedData)` after processing Engine render or update data. Forward `__DestroyLifetime` before removing the bridge so `background.ts` can release its listeners.

## Lifecycle Cleanup

The engine dispatches `__DestroyLifetime` when the LynxView is torn down. Remove the render and update listeners, remove Element PAPI node listeners, and release retained node references. Background-thread workflows also keep the bridge cleanup shown in [Background-Driven Update](#background-driven-update), which forwards the destroy event before removing its listener.

```javascript
function cleanupEngineLifecycle() {
  engine.removeEventListener(renderPageEventName, onRenderPage);
  engine.removeEventListener(updatePageEventName, onUpdatePage);
  engine.removeEventListener(
    destroyLifetimeEventName,
    cleanupEngineLifecycle,
  );
  clearAllEvents();
  valueText = undefined;
}

engine.addEventListener(destroyLifetimeEventName, cleanupEngineLifecycle);
```
