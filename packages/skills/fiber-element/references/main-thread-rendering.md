# Main Thread Rendering Reference

Use this reference for common `src/main-thread.ts` setup shared by FiberElement examples. Focused examples assume these helpers exist unless they say otherwise.

## Page Setup

```typescript
import type { ElementRef } from '@lynx-js/type-element-api';

const page = __CreatePage('0', 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, 'page');
```

## Text Helper

```typescript
function createText(className: string, value: string): ElementRef {
  const text = __CreateText(pageId);
  __SetClasses(text, className);
  __AppendElement(text, __CreateRawText(value));
  return text;
}
```

## Child Replacement Helper

```typescript
function replaceChildren(parent: ElementRef, nextChildren: ElementRef[]): void {
  __ReplaceElements(parent, nextChildren, __GetChildren(parent));
}
```

## Lifecycle Shape

```typescript
let currentState: Required<RenderState> | undefined;

function mergeState(patch: RenderState): Required<RenderState> {
  currentState = normalizeState({
    ...(currentState ?? {}),
    ...patch,
  });
  return currentState;
}

function renderPage(data: RenderState): void {
  renderState(mergeState(data));
}

function updatePage(patch: RenderState): void {
  renderState(mergeState(patch));
  __FlushElementTree();
}

function getPageData(): RenderState {
  return {};
}

function processData(data: RenderState): Required<RenderState> {
  return mergeState(data);
}

Object.assign(globalThis, {
  renderPage,
  updatePage,
  getPageData,
  processData,
});
```

## Usage Rules

- Keep slot refs in module scope when later updates need to replace children.
- Keep business state out of main-thread code; render only from incoming payloads.
- Keep a main-thread `currentState` and merge incoming patches before rendering.
- Call `__FlushElementTree()` after update-time mutations, not after initial `renderPage`.
- Use `__ReplaceElements(parent, newChildren, oldChildren)` for normal-container repeat rendering and condition switches.

## Element PAPI Selection

- Root: `const page = __CreatePage('0', 0)`, then `const pageId = __GetElementUniqueID(page)`.
- Containers: `__CreateView(pageId)` for layout and `__CreateScrollView(pageId)` for scroll.
- Built-in list: `__CreateList(...)` only when the app explicitly needs Lynx's virtualized `list` component.
- Text: create a `text` element with `__CreateText(pageId)`, create text content with `__CreateRawText(value)`, then append raw text into the text node.
- Images: use `__CreateImage(pageId)`, then set attributes such as `src` with `__SetAttribute`.
- Custom elements: use `__CreateElement(tag, pageId)`, then set attributes, classes, dataset, and events explicitly.

## Tree Mutation

- Append: `__AppendElement(parent, child)`.
- Insert: `__InsertElementBefore(parent, child, marker)`.
- Remove: `__RemoveElement(parent, child)`.
- Replace one node: `__ReplaceElement(oldNode, newNode)`.
- Replace node ranges: `__ReplaceElements(parent, newNodes, oldNodes)`.
- Do not use `__UpdateForChildCount` or `__UpdateIfNodeIndex` in frontend-environment examples or apps. For repeat rendering, use a normal `view` container and replace its children with `__ReplaceElements(parent, newChildren, oldChildren)` instead of using Lynx's built-in `list` component unless virtualization is required.
- Traversal helpers include `__GetParent`, `__GetChildren`, `__FirstElement`, `__LastElement`, and `__NextElement`.

## Styling And Data

- Prefer `__SetClasses(node, className)` or `__AddClass(node, className)` for stable styling.
- Use `__SetInlineStyles(node, value)` or `__AddInlineStyle(node, key, value)` for dynamic values that are not practical as classes.
- Set attributes with `__SetAttribute(node, attrName, value)`.
- Store event or lookup metadata with `__SetDataset`, `__AddDataset`, `__GetDataset`, and `__GetDataByKey`.
- Register events with `__AddEvent(node, 'bindEvent', eventName, handlerName)`.

## Queries, Flush, And Animation

- Prefer module-scope refs for nodes that will be updated frequently.
- Use `__GetElementByUniqueID(elementId)` when a numeric ID is already available.
- Use `__QuerySelector(root, cssSelector, params)` or `__QuerySelectorAll(root, cssSelector, params)` when selector lookup is simpler than retaining refs.
- Pass flush options only when the app needs layout callbacks, pipeline tracking, async flush, or other advanced native update behavior.
- Use `__ElementAnimate(element, args)` for Web Animations API style animation control.
