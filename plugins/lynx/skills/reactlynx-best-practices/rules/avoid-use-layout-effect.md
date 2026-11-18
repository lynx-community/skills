---
title: Avoid useLayoutEffect
ruleId: avoid-use-layout-effect
impact: MEDIUM
impactDescription: avoids relying on unsupported synchronous lifecycle behavior
tags: lifecycle, dual-thread, layout, main-thread
---

## Avoid useLayoutEffect

ReactLynx does not support `useLayoutEffect`. Lifecycle hooks run asynchronously on the background thread, so they do not have the synchronous "measure before paint" behavior that React DOM developers expect from `useLayoutEffect`.

### Why It Matters

ReactLynx optimizes first-screen rendering by letting the main thread render the first screen quickly while the background thread runs the full React runtime and later drives updates. Because lifecycles run on the background thread, layout reads inside a hook cannot synchronously block or adjust main-thread rendering.

### Incorrect

```tsx
import { useLayoutEffect, useRef, useState } from '@lynx-js/react';

function Tooltip() {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(ref.current?.getBoundingClientRect().height ?? 0);
  }, []);

  return <view ref={ref} style={{ height }} />;
}
```

### Correct: Background Side Effect

Use `useEffect` when the work is a normal background side effect and does not require synchronous layout.

```tsx
import { useEffect } from '@lynx-js/react';

function App() {
  useEffect(() => {
    NativeModules.Analytics.track('mounted');
  }, []);

  return <view />;
}
```

### Correct: Layout on Main Thread

Use `main-thread:bindlayoutchange` or `main-thread:ref` when layout information must be read from the main thread.

```tsx
function App() {
  function handleLayoutChange(event: MainThread.LayoutChangeEvent) {
    'main thread';
    event.currentTarget.setStyleProperty('opacity', '1');
  }

  return <view main-thread:bindlayoutchange={handleLayoutChange} />;
}
```

### List Child Components

`<list />` child component JS instances can be created before their real UI nodes are created. Regular `useEffect` and `ref` callbacks can run even when a list item is off-screen or reused. For UI-node visibility in a list, prefer `main-thread:ref`, whose callback and cleanup reflect when the actual element enters or leaves the main-thread UI tree.
