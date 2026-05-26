# Main Thread Rendering Reference

Use this reference to build the page tree directly on the main thread with FiberElement / Element PAPI.

## Tree Composition

All FiberElement APIs available on the main thread can be found in [`@lynx-js/type-element-api`](https://www.npmjs.com/package/@lynx-js/type-element-api). The API notes and examples are listed below.

### API Notes

#### Recommended APIs

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
- `__AddEvent`: bind event handlers.
- `__SetDataset` and `__AddDataset`: store metadata for events or lookup.
- `__AppendElement`: attach a child node.
- `__ReplaceElements`: replace child ranges during updates.

#### Disallowed APIs

Do not use the following APIs in main-thread examples or apps:

- `__CreateFor`
- `__CreateIf`
- `__UpdateIfNodeIndex`
- `__UpdateForChildCount`
- `__SetLepusInitData`
- `__CreateStyleObject`
- `__SetStyleObject`
- `__UpdateStyleObject`

### Basic Example

```javascript
// Page root
const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

// Container node
const container = __CreateView(pageId);
__SetClasses(container, "container");
__AppendElement(page, container);

// Text content
const title = __CreateText(pageId);
__SetClasses(title, "title");
__AppendElement(title, __CreateRawText("Hello Lynx!"));
__AppendElement(container, title);

// Node properties
const actionArea = __CreateView(pageId);
__SetClasses(actionArea, "button button-primary");
__SetInlineStyles(actionArea, "width: 100%; height: 48px;");
__SetID(actionArea, "submit-button");
__SetAttribute(actionArea, "aria-label", "Submit form");
__AddEvent(actionArea, "bindEvent", "tap", "onSubmit");
__SetDataset(actionArea, { action: "submit" });
__AppendElement(container, actionArea);

// Image node
const image = __CreateImage(pageId);
__SetClasses(image, "hero-image");
__SetAttribute(image, "src", "https://example.com/image.png");
__AppendElement(container, image);

// Update replace
function replaceChildren(parent, nextChildren) {
  __ReplaceElements(parent, nextChildren, __GetChildren(parent));
}
```

## Environment Initialization

Each LynxView initialization on the main thread depends on three methods mounted on `globalThis`, used for data preprocessing, initial page rendering, and later updates.

```javascript
Object.assign(globalThis, {
  processData,
  renderPage,
  updatePage,
});
```

### processData

Read native initialization data, preprocess it, and merge it into the initial render data.

```javascript
let currentState = {};

function processData(data) {
  return {
    ...data,
    color: "red",
  };
}
```

### renderPage

Build and render the element tree from the initial render data.

```javascript
let view = undefined;

function renderPage(data) {
  view = __CreateView(pageId);
  __SetInlineStyles(view, `color: ${data.color};`);
  __AppendElement(page, view);
}
```

### updatePage Example

Merge a background patch into the current state, then update and flush the element tree.

```javascript
function updatePage(patch) {
  if (view && patch.color !== undefined && currentState.color !== patch.color) {
    __SetInlineStyles(view, `color: ${patch.color};`);
    currentState.color = patch.color;
  }
  __FlushElementTree();
}
```
