# Composition Patterns

Read this file when the user needs a Lynx UI component category, a headless composition starting point, or guidance on which official component family to inspect first.

## Official docs

- Index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`
- Consolidated component catalog: [`components.md`](./components.md)

## Default approach

- Start from the closest official component family.
- Then open the matching section in [`components.md`](./components.md).
- Keep the official Lynx UI interaction structure intact.
- Adapt only the surrounding layout, naming, and local data wiring.

## Representative install-and-use pattern

```tsx
import { Button } from '@lynx-js/lynx-ui';

export default function App() {
  return (
    <view>
      <Button />
    </view>
  );
}
```

Use this as the baseline shape when the user wants a new Lynx UI flow. Replace only the component choice and surrounding app structure.

## Component coverage map

Use the nearest official component family below, then jump into the matching section in [`components.md`](./components.md).

### Inputs

Representative components:
- [Button](./components.md#button)
- [Checkbox](./components.md#checkbox)
- [Input and TextArea](./components.md#input-and-textarea)

Use these when the task is about commands, form entry, selection, or toggles.

### Display and overlays

Representative components:
- [Dialog](./components.md#dialog)
- [Popover](./components.md#popover)

Use these when the task is about disclosure, layered UI, or anchored floating surfaces.

### Lists and data-heavy surfaces

Representative components:
- [List](./components.md#list)
- [SwipeAction](./components.md#swipeaction)

Use these when the task is about repeated content, interactive rows, or row-level secondary actions.

### Interaction-heavy patterns

Representative components:
- [Draggable](./components.md#draggable)

Use these when the task is about gestures, rearrangement, or direct manipulation.

## Composition rules

- Keep triggers, content, and state boundaries aligned with the official component pattern.
- Do not wrap Lynx UI primitives in unnecessary generic helpers before the base pattern is correct.
- If the task spans lists, overlays, or gestures, choose the closest documented component family first.
- If the user asks for a custom pattern, explain where it departs from the official approach.

## Output style

- Name the component category you chose.
- Link the nearest official docs page.
- Point to the closest section in [`components.md`](./components.md).
- Keep the proposed code close to the official structure.
- Explain only the necessary local adaptations.
