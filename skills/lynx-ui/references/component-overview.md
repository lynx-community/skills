# lynx-ui Component Overview

Use this file to choose the closest lynx-ui component before loading implementation details.

## Routing Rules

- Select a route from the user-visible behavior.
- Open the API reference before writing code.
- Open the guide when one is available for usage patterns and pitfalls.
- Use examples as implementation patterns after verifying the API.
- State the coverage limit when no route matches.

## Combining Components

When a task combines components, check [component-composition.md](./component-composition.md) for common supported combinations.

## Table of Contents

- [Button](#button)
- [Checkbox](#checkbox)
- [Dialog](#dialog)
- [Draggable](#draggable)
- [FeedList](#feedlist)
- [Form](#form)
- [Input and TextArea](#input-and-textarea)
- [LazyComponent](#lazycomponent)
- [List](#list)
- [OverlayView](#overlayview)
- [Popover](#popover)
- [RadioGroup](#radiogroup)
- [ScrollView](#scrollview)
- [Sheet](#sheet)
- [Slider](#slider)
- [Sortable](#sortable)
- [SwipeAction](#swipeaction)
- [Swiper](#swiper)
- [Switch](#switch)

## Components

### `Button`

- Choose when: The user needs an explicit pressable action or submit control.
- Avoid when: The interaction is selection, toggling, dragging, or text entry.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/button.html)
- [Guide](./components/button/guide.md)
- [API](./components/button/api.md)
- [Examples](./components/button/examples.md)

### `Checkbox`

- Choose when: The user needs boolean selection or an indeterminate partial-selection state.
- Avoid when: The interaction represents an immediate on/off setting; use Switch.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/checkbox.html)
- Guide: Not available yet.
- [API](./components/checkbox/api.md)
- [Examples](./components/checkbox/examples.md)

### `Dialog`

- Choose when: The UI needs a blocking centered modal for confirmation, alerts, or focused content.
- Avoid when: The content is a sliding panel or anchored floating surface; use Sheet or Popover.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/dialog.html)
- [Guide](./components/dialog/guide.md)
- [API](./components/dialog/api.md)
- [Examples](./components/dialog/examples.md)

### `Draggable`

- Choose when: The user needs direct manipulation, bounded dragging, or gesture-aware movement.
- Avoid when: The user needs to reorder a collection; use Sortable.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/draggable.html)
- Guide: Not available yet.
- [API](./components/draggable/api.md)
- [Examples](./components/draggable/examples.md)

### `FeedList`

- Choose when: A virtualized feed needs refresh, pagination, or load-more semantics.
- Avoid when: The collection only needs general virtualization; use List.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/feed-list.html)
- [Guide](./components/feed-list/guide.md)
- [API](./components/feed-list/api.md)
- [Examples](./components/feed-list/examples.md)

### `Form`

- Choose when: Multiple fields need coordinated value collection and submission.
- Avoid when: The task only needs one standalone input or selection control.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/form.html)
- Guide: Not available yet.
- [API](./components/form/api.md)
- [Examples](./components/form/examples.md)

### `Input and TextArea`

- Choose when: The user needs text entry or keyboard-aware input layout behavior.
- Avoid when: The content is read-only text.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/input.html)
- Guide: Not available yet.
- [API](./components/input/api.md)
- [Examples](./components/input/examples.md)

### `LazyComponent`

- Choose when: An expensive subtree should defer mounting until it approaches visibility.
- Avoid when: The content is lightweight or always visible.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/lazy-component.html)
- [Guide](./components/lazy-component/guide.md)
- [API](./components/lazy-component/api.md)
- [Examples](./components/lazy-component/examples.md)

### `List`

- Choose when: A repeated collection can grow large and needs virtualization.
- Avoid when: The content is small or structurally mixed; use ScrollView.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/list.html)
- [Guide](./components/list/guide.md)
- [API](./components/list/api.md)
- [Examples](./components/list/examples.md)

### `OverlayView`

- Choose when: Content must render above the normal view tree in a native overlay layer.
- Avoid when: A higher-level Dialog, Sheet, or Popover already matches the interaction.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/overlay.html)
- Guide: Not available yet.
- [API](./components/overlay/api.md)
- [Examples](./components/overlay/examples.md)

### `Popover`

- Choose when: The user needs anchored floating content relative to a trigger or anchor.
- Avoid when: The content should interrupt the full flow or slide from an edge; use Dialog or Sheet.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/popover.html)
- [Guide](./components/popover/guide.md)
- [API](./components/popover/api.md)
- [Examples](./components/popover/examples.md)

### `RadioGroup`

- Choose when: The user needs one selected value from a mutually exclusive option set.
- Avoid when: Multiple options may be selected independently; use Checkbox.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/radio-group.html)
- Guide: Not available yet.
- [API](./components/radio-group/api.md)
- [Examples](./components/radio-group/examples.md)

### `ScrollView`

- Choose when: A bounded region with mixed or relatively small content needs scrolling.
- Avoid when: The content is a large repeated collection; use List or FeedList.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/scroll-view.html)
- [Guide](./components/scroll-view/guide.md)
- [API](./components/scroll-view/api.md)
- [Examples](./components/scroll-view/examples.md)

### `Sheet`

- Choose when: The UI needs a bottom sheet, top sheet, or side drawer with snap or drag behavior.
- Avoid when: The content is a centered blocking modal or an anchored floating surface.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/sheet.html)
- [Guide](./components/sheet/guide.md)
- [API](./components/sheet/api.md)
- [Examples](./components/sheet/examples.md)

### `Slider`

- Choose when: The user needs to select a numeric value along a continuous or stepped track.
- Avoid when: The user should select from discrete text options; use a selection control.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/slider.html)
- [Guide](./components/slider/guide.md)
- [API](./components/slider/api.md)
- [Examples](./components/slider/examples.md)

### `Sortable`

- Choose when: The user needs drag-driven reordering of a collection.
- Avoid when: The interaction moves one item without collection reordering; use Draggable.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/sortable.html)
- [Guide](./components/sortable/guide.md)
- [API](./components/sortable/api.md)
- [Examples](./components/sortable/examples.md)

### `SwipeAction`

- Choose when: A row needs secondary actions revealed by a swipe gesture.
- Avoid when: The action should always remain visible.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/swipe-action.html)
- Guide: Not available yet.
- [API](./components/swipe-action/api.md)
- [Examples](./components/swipe-action/examples.md)

### `Swiper`

- Choose when: The UI needs horizontal paging or carousel-style interactions.
- Avoid when: The content needs free scrolling without page snapping; use ScrollView.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/swiper.html)
- [Guide](./components/swiper/guide.md)
- [API](./components/swiper/api.md)
- [Examples](./components/swiper/examples.md)

### `Switch`

- Choose when: The UI needs an immediate binary on/off setting.
- Avoid when: The interaction represents form selection or an indeterminate state; use Checkbox.
- [Official docs](https://lynxjs.org/next/lynx-ui/components/switch.html)
- Guide: Not available yet.
- [API](./components/switch/api.md)
- [Examples](./components/switch/examples.md)
