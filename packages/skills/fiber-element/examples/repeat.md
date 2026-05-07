# Focused Demo: Repeat Rendering

Use this pattern when repeating a small or moderate data array into row elements.

This demo assumes the shared page setup, `createText`, `replaceChildren`, and lifecycle shape from `../references/main-thread-rendering.md`.

## Core State

```typescript
interface Item {
  id: string;
  title: string;
  selected?: boolean;
}

interface RenderState {
  items?: Item[];
}
```

## Main Thread Delta

```typescript
let repeatSlot: ElementRef | undefined;

function isItem(value: unknown): value is Item {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item['id'] === 'string' && typeof item['title'] === 'string';
}

function normalizeItems(value: unknown): Item[] {
  return Array.isArray(value) ? value.filter(isItem) : [];
}

function createRow(item: Item): ElementRef {
  const row = __CreateView(pageId);
  __SetClasses(row, item.selected ? 'row row-selected' : 'row');
  __SetDataset(row, { id: item.id });
  __AddEvent(row, 'bindEvent', 'tap', `select:${item.id}`);
  __AppendElement(row, createText('row-title', item.title));
  return row;
}

function renderItems(data: RenderState): void {
  if (!repeatSlot) return;

  const items = normalizeItems(data.items);
  replaceChildren(
    repeatSlot,
    items.length > 0
      ? items.map(createRow)
      : [createText('repeat-message', 'No rows')],
  );
}
```

## Notes

- Pass stable IDs through `__SetDataset` or handler names when background needs to identify the tapped row.
- Normalize repeated data before rendering; do not cast arbitrary payloads to item arrays.
- For row reordering, filtering, or replacement, rerender all repeated children unless the app has a measured need for granular mutation.
