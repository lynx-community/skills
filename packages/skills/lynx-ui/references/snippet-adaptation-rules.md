# Snippet Adaptation Rules

Read this file when the user wants Lynx UI code that stays close to the official docs but still fits an existing project.

## Official docs

- Lynx UI introduction: `https://lynxjs.org/next/lynx-ui/introduction`
- Lynx UI index: `https://lynxjs.org/next/lynx-ui/`

## Default approach

- Start from the closest official Lynx UI snippet first.
- Unless the user asks otherwise, keep the official Lynx UI way of building the feature.
- Adapt only the parts that need to match the user's file layout, data source, and naming.

## Example: keep the official component shape

Official-style starting point:

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

Minimal project-local adaptation:

```tsx
import { Button } from '@lynx-js/lynx-ui';

export function ListActions() {
  return (
    <view className="px-16 py-12">
      <Button />
    </view>
  );
}
```

What changed:
- component name
- surrounding wrapper
- local class names

What stayed aligned with the docs:
- package import
- Lynx UI component usage
- overall component shape

## Example: preserve token semantics

If the official example or the task calls for shared theming, keep Luna semantic tokens instead of flattening them into hard-coded values.

Preferred:

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

Avoid unless the user explicitly asks for it:

```tsx
<view style={{ backgroundColor: '#ffffff', color: '#111111', borderColor: '#dddddd' }} />
```

## Example: preserve motion choice

If the closest official solution uses motion or motion-mini, keep that capability choice unless the user gives a reason to change it.

- Use motion when you need richer animated values or derived styles.
- Use motion-mini when you only need a small numeric transition and direct style writes are acceptable.

## Preserve these things

- component and capability semantics
- official interaction structure
- Luna token usage when theming is part of the task
- motion capability choice when the docs depend on it

## Avoid these mistakes

- do not rewrite official Lynx UI patterns into generic React abstractions without a real reason
- do not replace Luna tokens with ad hoc styling without a user request
- do not invent a fresh API shape when the docs already cover the case
- do not mix major theming or motion changes into a structural task unless the user asked for them

## Output style

- Name the official docs page or example you are following.
- Show the minimal adaptation.
- Explain only the necessary differences.
- Keep the result close to the official pattern.
