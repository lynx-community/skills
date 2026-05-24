Closest official anchor: Lynx UI List docs (`https://lynxjs.org/next/lynx-ui/components/list.html`) plus the local screen recipe for a list flow from `/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/screen-recipes.md` and component guidance from `/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/components.md`.

Because you already have a ReactLynx app, I would keep the adoption path close to the docs:

1. Install the official package if it is not already present.

```bash
npm i @lynx-js/lynx-ui
```

2. Build the new flow around `List` as the virtualization container instead of mapping plain `view`s.
3. Keep the Lynx UI structure intact and only adapt naming, item data, and the surrounding screen wrapper.

A good docs-aligned starting point for an interactive list flow looks like this:

```tsx
import { List, Button } from '@lynx-js/lynx-ui';
import { useState } from 'react';

type Item = {
  id: string;
  title: string;
  selected: boolean;
};

const initialItems: Item[] = [
  { id: '1', title: 'First item', selected: false },
  { id: '2', title: 'Second item', selected: true },
  { id: '3', title: 'Third item', selected: false },
];

export function InteractiveListFlow() {
  const [items, setItems] = useState(initialItems);

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const loadMore = () => {
    // wire this to your real pagination path when needed
  };

  return (
    <view className="flex-1 bg-paper px-16 py-12">
      <text className="mb-12 text-content text-title3">Choose items</text>

      <List
        listType="flow"
        initialScrollIndex={0}
        preloadBufferCount={2}
        onScrollToLower={loadMore}
      >
        {items.map((item) => (
          <view key={item.id} className="mb-8 rounded-12 border border-line bg-paper-elevated p-12">
            <view className="flex flex-row items-center justify-between">
              <text className="text-content">{item.title}</text>

              <Button onClick={() => toggleItem(item.id)}>
                {({ active, disabled }) => (
                  <view
                    className={[
                      'rounded-999 px-12 py-6',
                      item.selected ? 'bg-primary' : 'bg-fill',
                      active ? 'ui-active' : '',
                      disabled ? 'ui-disabled' : '',
                    ].join(' ')}
                  >
                    <text className={item.selected ? 'text-content-inverse' : 'text-content'}>
                      {item.selected ? 'Selected' : 'Select'}
                    </text>
                  </view>
                )}
              </Button>
            </view>
          </view>
        ))}
      </List>
    </view>
  );
}
```

Why this is the official Lynx UI direction:

- `List` stays as the documented virtualization primitive for a list flow.
- `Button` keeps the official render-prop shape for active and disabled state instead of replacing it with a generic click wrapper.
- Styling uses Luna semantic tokens like `bg-paper`, `border-line`, and `text-content` rather than ad hoc colors.

Small adaptations I would make only if your project structure forces them:

- Move `InteractiveListFlow` into your screen or feature directory.
- Replace `initialItems` with your real fetched data.
- Swap `loadMore` to your existing pagination callback.
- If each row already has a shared app-specific card wrapper, keep that wrapper outside the Lynx UI primitives rather than rewriting `List` or `Button`.

If your “interactive” requirement also means swipe actions, filters, or feed-style refresh, I would stay on the same official path but switch primitives instead of inventing a custom pattern:

- use `SwipeAction` for hidden row actions
- use `FeedList` if the screen is more feed/infinite-refresh oriented
- use `Sheet` if the flow needs a filter drawer over the list

If you want, I can next adapt this into your app’s actual file layout or give you the `SwipeAction` version using the official Lynx UI pattern.