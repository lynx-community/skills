You can add Lynx UI to an existing ReactLynx app by following the official introduction flow and then building the new interactive list from the closest official list primitives.

Closest official docs to anchor on:
- Introduction: https://lynxjs.org/next/lynx-ui/introduction
- List: https://lynxjs.org/next/lynx-ui/components/list.html
- FeedList: https://lynxjs.org/next/lynx-ui/components/feed-list.html
- SwipeAction: https://lynxjs.org/next/lynx-ui/components/swipe-action.html

Minimal official-style setup

```bash
npm i @lynx-js/lynx-ui
```

If you are not already using the ReactLynx plugin config required by some gesture-driven Lynx UI components, keep it aligned with the official shape:

```ts
export default defineConfig({
  plugins: [
    pluginReactLynx({
      enableNewGesture: true,
    }),
  ],
})
```

For a new interactive list flow, the official Lynx UI choice depends on the behavior:
- Use `List` when it is a general virtualized list.
- Use `FeedList` when the flow is feed-like and needs pull-to-refresh or built-in load-more handling.
- Use `SwipeAction` inside each row when the interaction includes reveal-on-swipe secondary actions.

A good default, close to the docs, is a `FeedList` with `SwipeAction` rows:

```tsx
import { Button, FeedList, SwipeAction } from '@lynx-js/lynx-ui';

type Item = {
  id: string;
  title: string;
  subtitle: string;
};

type Props = {
  items: Item[];
  loadMore: () => void;
  archiveItem: (id: string) => void;
};

function InteractiveListRow({
  item,
  archiveItem,
}: {
  item: Item;
  archiveItem: (id: string) => void;
}) {
  return (
    <SwipeAction
      displayArea={
        <view className="px-16 py-12 border-b border-line bg-paper">
          <text className="text-content text-body-bold">{item.title}</text>
          <text className="text-content-muted text-body-sm">{item.subtitle}</text>
        </view>
      }
      actionArea={
        <Button onClick={() => archiveItem(item.id)}>
          {({ active, disabled }) => (
            <view className={`px-16 py-12 ${active ? 'ui-active' : ''} ${disabled ? 'ui-disabled' : ''}`}>
              <text>Archive</text>
            </view>
          )}
        </Button>
      }
    />
  );
}

export function InteractiveListFlow({ items, loadMore, archiveItem }: Props) {
  return (
    <FeedList
      listId="interactive-list"
      listType="flow"
      refreshOptions={true}
      onScrollToLower={loadMore}
    >
      {items.map((item) => (
        <list-item key={item.id} item-key={item.id}>
          <InteractiveListRow item={item} archiveItem={archiveItem} />
        </list-item>
      ))}
    </FeedList>
  );
}
```

Why this stays close to the official Lynx UI approach:
- It keeps `@lynx-js/lynx-ui` as the package entrypoint from the introduction docs.
- It uses `FeedList` as the virtualization and loading container instead of replacing it with plain mapped views.
- It keeps `SwipeAction` in the documented two-area shape: `displayArea` plus `actionArea`.
- It uses a Lynx UI `Button` for the row action instead of wiring a generic click handler onto a plain view.
- It uses Luna semantic tokens like `bg-paper`, `text-content`, `text-content-muted`, and `border-line` instead of hard-coded colors.

If your flow does not need feed refresh or load-more behavior, switch only the container and keep the row shape the same:

```tsx
import { List, SwipeAction } from '@lynx-js/lynx-ui';

<List listType="flow" onScrollToLower={loadMore} preloadBufferCount={2}>
  {items.map((item) => (
    <InteractiveListRow key={item.id} item={item} archiveItem={archiveItem} />
  ))}
</List>
```

Small project-local adaptations I would make, and only if your structure requires them:
- Rename `InteractiveListFlow` and `InteractiveListRow` to match your screen and row file names.
- Replace the inline row content with your app’s existing row component, but keep it inside `displayArea`.
- Keep data fetching and mutation hooks outside the Lynx UI primitives, then pass the results into `FeedList` and `SwipeAction` as shown.

If you want, I can next adapt this into your actual screen structure once you share the existing ReactLynx list file or the current route/component layout.
