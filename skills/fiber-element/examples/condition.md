# Focused Demo: Conditional Rendering

Use this pattern when a frontend-environment FiberElement app needs to switch between mutually exclusive UI states. Create a normal slot `view` and replace its children.

This demo assumes the shared page setup, `createText`, `replaceChildren`, and lifecycle shape from `../references/main-thread-rendering.md`.

## Core State

```typescript
interface RenderState {
  loading?: boolean;
  items?: string[];
}
```

## Main Thread Delta

```typescript
let statusSlot: ElementRef | undefined;

function createContent(items: string[]): ElementRef {
  const content = __CreateView(pageId);
  __SetClasses(content, "content");
  __AppendElement(
    content,
    createText("content-title", `${items.length} items`),
  );
  return content;
}

function renderStatus(data: RenderState): void {
  if (!statusSlot) return;

  const items = Array.isArray(data.items) ? data.items : [];
  if (data.loading) {
    replaceChildren(statusSlot, [createText("message", "Loading...")]);
    return;
  }

  replaceChildren(
    statusSlot,
    items.length > 0
      ? [createContent(items)]
      : [createText("message", "No items yet")],
  );
}

function renderPage(data: RenderState): void {
  statusSlot = __CreateView(pageId);
  __SetClasses(statusSlot, "status-slot");
  __AppendElement(page, statusSlot);
  renderStatus(data);
}

function updatePage(data: RenderState): void {
  renderStatus(data);
  __FlushElementTree();
}
```

## Notes

- Keep a module-scope ref to the slot container, not to each branch child.
- Recreate branch children when state changes; the slot remains stable.
- For repeated content inside a branch, combine this with `repeat.md`.
