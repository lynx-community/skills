# Main Thread Rendering Reference

Use this reference when writing main-thread source: `<script thread="main">` for `.lynxml` or `main-thread.ts` for Rspeedy. The main-thread source owns Element PAPI tree creation, node mutation, lifecycle rendering, and UI flushes.

Read [`event.md`](event.md) for `lynx.getEngine()` and event environment APIs. If the page needs a background thread, read [`background.md`](background.md).

## Table of Contents

- [Responsibilities](#responsibilities)
- [System Metadata](#system-metadata)
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
- Render initial data from `__RenderPage` (and initial host `lynx.__globalProps ?? {}` when needed).
- Apply later engine data from `__UpdatePage` and `__UpdateGlobalProps` to the UI tree.
- Register `__DestroyLifetime` to remove runtime and node listeners.
- Rely on the SDK default flush for initial `renderPage`; call `__FlushElementTree()` after later UI mutations.
- For background-thread workflows, heavy business logic, timers, async requests, or native calls, read [`background.md`](background.md).

## System Metadata

Vanilla Lynx Fiber main-thread source reads `lynx.SystemInfo`; background source reads global `SystemInfo` or `globalThis.SystemInfo`. The engine's [`MTSRuntime::RegisterLynx`](https://github.com/lynx-family/lynx/blob/319e600c01974b674072fa1d05149fba69319604/core/shell/runtime/mts/mts_runtime.cc#L286) installs the main-thread property on `lynx`, while the [background global binding](https://github.com/lynx-family/lynx/blob/319e600c01974b674072fa1d05149fba69319604/core/runtime/js/bindings/global.cc#L59) installs `SystemInfo` on the global object.

Frameworks can add their own aliases: [ReactLynx initialization](https://github.com/lynx-family/lynx-stack/blob/63bcbfccfa408fa651967f119cbf83152a2d08a2/packages/react/runtime/src/snapshot/lynx/env.ts#L14) assigns `globalThis.SystemInfo = lynx.SystemInfo ?? {}` on the main thread. A DevTool expression or shared type declaration for such a page does not establish a built-in global for raw Vanilla Lynx `.lynxml`. The checker allows an alias that the main-thread source explicitly initializes; otherwise use `lynx.SystemInfo`.

## Element PAPI Surface

All Element PAPI APIs available on the main thread can be found in [`@lynx-js/type-element-api`](https://www.npmjs.com/package/@lynx-js/type-element-api).

Treat `ElementRef` as an opaque main-thread handle. Never read or write its properties, enumerate it, clone or spread it, serialize it, or attach application state to it. Use Element PAPI APIs to inspect or mutate element state, and use `__ElementIsEqual` to compare node references.

### Create and Tree APIs

Create the page root with the fixed call `__CreatePage("0", 0)`. Obtain `pageId` from `__GetElementUniqueID(page)` and pass it as the first argument to `__CreateView`, `__CreateScrollView`, `__CreateText`, and `__CreateImage`. Do not inline `__CreatePage` inside `__GetElementUniqueID`; retain `page` so it owns every top-level UI node. `__CreateRawText` takes visible text instead.

| API                                                                                                                                          | Contract & Use                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `__CreatePage("0", 0)`                                                                                                                       | Always pass literal `"0"` and `0` to create the page root.                                                     |
| `__CreateScrollView(pageId)` / `__CreateView(pageId)` / `__CreateImage(pageId)` / `__CreateText(pageId)`                                     | Create scrollable, container, image, or text nodes owned by `pageId`.                                          |
| `__CreateRawText(text: string)`                                                                                                              | Create an immutable text leaf to append directly under a Text node.                                            |
| `__AppendElement(parent: ElementRef, child: ElementRef)`                                                                                     | Attach `child` under `parent` (use for initial children when `parent` is empty).                               |
| `__ReplaceElements(parent: ElementRef, inserted: ElementRef \| ElementRef[] \| undefined, removed: ElementRef \| ElementRef[] \| undefined)` | Replace `removed` children under `parent` with `inserted` (each accepts a single node, array, or `undefined`). |
| `__GetChildren(parent: ElementRef)`                                                                                                          | Read direct children before subtree replacement or listener cleanup.                                           |

For portable subtree replacement, pass node arrays and read current children from the parent:

```javascript
__ReplaceElements(parent, [nextChild], __GetChildren(parent));
```

### Node Property, Event, and Utility APIs

| API                                                                                                                                         | Contract & Use                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `__SetID(node: ElementRef, id: string \| null)` / `__GetID(node: ElementRef)`                                                               | Set (`string` or `null`) or read a stable element id.                                                                              |
| `__SetClasses(node: ElementRef, classes: string \| undefined)` / `__AddClass(node: ElementRef, className: string)` / `__GetClasses(node)`   | Replace all classes (`undefined` clears), append one class, or read applied class names (`string[]`).                              |
| `__SetInlineStyles(node: ElementRef, styles: unknown)` / `__GetInlineStyles(node: ElementRef)`                                              | Apply runtime-computed inline styles (typed as `unknown`) or read the inline style string.                                         |
| `__SetAttribute(node: ElementRef, name: string, value: any)` / `__GetAttributeByName(node: ElementRef, name: string)`                       | Set or read a named element attribute.                                                                                             |
| `__SetDataset(node: ElementRef, dataset: Record<string, unknown> \| undefined)` / `__AddDataset(node, key, value)` / `__GetDataset(node)`   | Replace the complete dataset record (never pass `(node, key, value)` to `__SetDataset`), add one dataset entry, or read dataset.   |
| `__AddEventListener(node: ElementRef, eventName: string, handler: ElementEventCallback \| string, options: ElementEventListenerOptions)`    | Bind a main-thread UI event. All 4 arguments are required; pass `{}` when no listener options are needed.                          |
| `__RemoveEventListener(node: ElementRef, eventName: string, handler: ElementEventCallback \| string, options: ElementEventListenerOptions)` | Remove a node listener during replacement or teardown using the matching 4-argument tuple.                                         |
| `__GetElementUniqueID(node: ElementRef)` / `__ElementIsEqual(left: ElementRef, right: ElementRef)`                                          | Obtain numeric `pageId` or compare opaque `ElementRef` handles.                                                                    |

Do not call compiler-only or legacy PAPIs (`__CreateFor`, `__CreateIf`, `__UpdateIfNodeIndex`, `__UpdateForChildCount`, `__SetLepusInitData`, `__CreateStyleObject`, `__SetStyleObject`, `__UpdateStyleObject`, or `__AddEvent`) in Vanilla Lynx main-thread code.

## Build the Tree

Create the page root once, then create and append child nodes. Append every top-level UI node to that retained Page, and keep node references that need later updates in module scope.

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

Raw-text nodes are immutable content leaves. Create them only as direct children of a Text node; retain the Text parent and replace its children for later text updates.

When an existing image will switch sources, set
`defer-src-invalidation` before its initial `src`. This keeps the current
resource visible until the replacement loads. Skip a later `src` assignment
when the value is unchanged; static images do not need this attribute.

```javascript
const changingImage = __CreateImage(pageId);
__SetAttribute(changingImage, "defer-src-invalidation", true);
__SetAttribute(changingImage, "src", initialSource);
```

## Bind Element Events

Element PAPI node events must always be bound and removed on the main thread. Background-thread source never receives an `ElementRef` and never calls `__AddEventListener` or `__RemoveEventListener`.

Pass runtime event names such as `"tap"` to `__AddEventListener`. Markup binding
names such as `bindtap` and `catchtap` are not Element PAPI event names.

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

When a node event needs heavier business logic, async work, timers, or native calls, keep the Element PAPI listener on the main thread and dispatch a small, serializable task through the cross-thread bridge. Never send a function or `ElementRef`. The helper below uses `dispatchEventToBackground` from [Background-Driven Update](#background-driven-update); the background script receives the task as described in [`background.md`](background.md).

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
const updateGlobalPropsEventName = "__UpdateGlobalProps";
const destroyLifetimeEventName = "__DestroyLifetime";

Object.assign(globalThis, {
  processData(data) {
    return data;
  },
});

const engine = lynx.getEngine();

let currentState = {};
let containerView;
let valueText;
let rendered = false;

function normalizeInitialData(data) {
  return {
    ...data,
    color: data?.color ?? "red",
    value: data?.value ?? "Hello Lynx!",
  };
}

function normalizePatch(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data;
}

let currentGlobalProps = normalizePatch(lynx.__globalProps);
```

Currently, Lynx SDK requires a `processData` implementation on `globalThis`. The main-thread script can instead assign its own data-processing function when native initialization data needs normalization.

Initial host `GlobalProps` are exposed on `lynx.__globalProps` before `__RenderPage` runs (normalize with `lynx.__globalProps ?? {}`; never read bare `__globalProps`, which is not a Fiber global). The engine dispatches `__RenderPage` with the initial page-data payload. Process that payload and create the initial Element PAPI tree in `renderPage`. The handler may ignore its payload when the implementation does not need engine-provided data. Do not call `__FlushElementTree()` solely for this initial render; rely on the SDK default flush.

```javascript
function applyTheme(globalProps) {
  __SetClasses(page, globalProps.theme === "dark" ? "page page-dark" : "page");
}

function renderPage(data, globalProps) {
  currentState = data;
  applyTheme(globalProps);

  containerView = __CreateView(pageId);
  __SetInlineStyles(containerView, `color: ${data.color};`);

  valueText = __CreateText(pageId);
  __AppendElement(valueText, __CreateRawText(data.value));
  __AppendElement(containerView, valueText);
  __AppendElement(page, containerView);
}

function onRenderPage(event) {
  if (rendered) return;
  rendered = true;
  const [data] = event.data;
  renderPage(normalizeInitialData(data), currentGlobalProps);
}

engine.addEventListener(renderPageEventName, onRenderPage);
```

## Update

Every update after the initial render mutates the existing tree on the main thread and calls `__FlushElementTree()`. Choose the update driver based on where the new data originates.

### Engine-Driven Update

The engine dispatches `__UpdatePage` with later page-data payloads and `__UpdateGlobalProps` with later host `GlobalProps` payloads:

- In `__UpdatePage`, process only the provided fields so partial updates do not reset omitted fields back to initial defaults, apply the UI mutation, and call `__FlushElementTree()`.
- In `__UpdateGlobalProps`, read `const [globalProps] = event.data` rather than re-reading `lynx.__globalProps` alone (Web dispatches `event.data` without reassigning `lynx.__globalProps` in place), shallow-merge onto `currentGlobalProps` so partial host updates (for example on Web or Harmony) preserve omitted keys, apply the UI mutation, and call `__FlushElementTree()`.
- Either handler may remain a no-op placeholder on `lynx.getEngine()` when the page intentionally does not consume that update channel, preventing Native hosts from falling back to missing `globalThis.updatePage` or `globalThis.updateGlobalProps` functions.

```javascript
function updatePage(patch) {
  currentState = {
    ...currentState,
    ...patch,
  };

  if (patch.color !== undefined && containerView) {
    __SetInlineStyles(containerView, `color: ${patch.color};`);
  }

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
  if (!rendered) return;
  const [data] = event.data;
  updatePage(normalizePatch(data));
}

function onUpdateGlobalProps(event) {
  const [globalProps] = event.data;
  currentGlobalProps = {
    ...currentGlobalProps,
    ...normalizePatch(globalProps),
  };
  if (!rendered) return;
  applyTheme(currentGlobalProps);
  __FlushElementTree();
}

engine.addEventListener(updatePageEventName, onUpdatePage);
engine.addEventListener(updateGlobalPropsEventName, onUpdateGlobalProps);
```

### Background-Driven Update

See [`event.md`](event.md) for cross-thread bridge pairing (`lynx.getJSContext()` on main ↔ `lynx.getCoreContext()` on background) and [`background.md`](background.md) for the background task/state handler. On the main thread, reuse one `lynx.getJSContext()` bridge to dispatch tasks/data, apply incoming `PatchFromBackground` updates with `__FlushElementTree()`, and forward `BackgroundDestroy` before removing listeners:

```javascript
const backgroundThread = lynx.getJSContext();

function dispatchDataToBackground(data) {
  backgroundThread.dispatchEvent({
    type: "UpdateDataFromMainThread",
    data,
  });
}

function dispatchEventToBackground(handlerName, data) {
  backgroundThread.dispatchEvent({
    type: "DispatchEventToBackground",
    data: { handlerName, data },
  });
}

function onBackgroundPatch(event) {
  const patch = event.data;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return;

  currentState = { ...currentState, ...patch };
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
  backgroundThread.dispatchEvent({ type: "BackgroundDestroy", data: {} });
  backgroundThread.removeEventListener("PatchFromBackground", onBackgroundPatch);
  engine.removeEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);
}

backgroundThread.addEventListener("PatchFromBackground", onBackgroundPatch);
engine.addEventListener(destroyLifetimeEventName, cleanupBackgroundBridge);
```

Call `dispatchDataToBackground(processedData)` when background state needs Engine render/update or `GlobalProps` data, and keep `__DestroyLifetime` reserved for `lynx.getEngine()`.

## Lifecycle Cleanup

The engine dispatches `__DestroyLifetime` when the LynxView is torn down. Remove the render, update, and `GlobalProps` listeners, remove Element PAPI node listeners, and release retained node references. Background-thread workflows also keep the bridge cleanup shown in [Background-Driven Update](#background-driven-update), which forwards the destroy event before removing its listener.

```javascript
function cleanupEngineLifecycle() {
  engine.removeEventListener(renderPageEventName, onRenderPage);
  engine.removeEventListener(updatePageEventName, onUpdatePage);
  engine.removeEventListener(updateGlobalPropsEventName, onUpdateGlobalProps);
  engine.removeEventListener(
    destroyLifetimeEventName,
    cleanupEngineLifecycle,
  );
  clearAllEvents();
  containerView = undefined;
  valueText = undefined;
}

engine.addEventListener(destroyLifetimeEventName, cleanupEngineLifecycle);
```
