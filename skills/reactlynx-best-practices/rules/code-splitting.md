---
title: Code Splitting
ruleId: code-splitting
impact: MEDIUM
impactDescription: improves load time while preserving lazy bundle boundaries
tags: performance, lazy, suspense, bundle, css
---

## Code Splitting

Use `lazy()` and `<Suspense>` to defer loading components until they are rendered. Treat each lazy component as its own Lynx bundle with its own CSS scope.

### Basic Pattern

```tsx
import { Suspense, lazy } from '@lynx-js/react';

const ProductPanel = lazy(() => import('./ProductPanel.jsx'));

export function App() {
  return (
    <view>
      <Suspense fallback={<text>Loading...</text>}>
        <ProductPanel />
      </Suspense>
    </view>
  );
}
```

### Rules

| Rule | Guidance |
|------|----------|
| Use default exports for lazy components | `lazy(() => import('./Panel.jsx'))` expects the imported module's default export |
| Wrap lazy content in `<Suspense>` | Always provide a lightweight fallback near the lazy boundary |
| Render-gate expensive chunks | Lazy chunks start downloading only when they are rendered |
| Respect CSS bundle scope | Global CSS from the main bundle does not apply to lazy-loaded bundles, and lazy CSS does not leak back |
| Add an ErrorBoundary for important chunks | Loading succeeds asynchronously, but component render errors still need React-style error handling |

### Render-Gated Lazy Loading

```tsx
import { Suspense, lazy, useState } from '@lynx-js/react';

const HeavyPanel = lazy(() => import('./HeavyPanel.jsx'));

export function App() {
  const [visible, setVisible] = useState(false);

  return (
    <view>
      <view bindtap={() => setVisible(true)}>Load panel</view>
      {visible && (
        <Suspense fallback={<text>Loading...</text>}>
          <HeavyPanel />
        </Suspense>
      )}
    </view>
  );
}
```

### Standalone Lazy Bundles

For modules built by a standalone Rspeedy producer project:
- Enable `experimental_isLazyBundle: true` in the producer's ReactLynx plugin options.
- Export the component as the producer entry default export.
- In the consumer entry, import `@lynx-js/react/experimental/lazy/import` before rendering.
- Load the remote bundle with dynamic `import()` and `with: { type: 'component' }`.

### Review Checklist

- Check whether large, initially hidden UI trees are statically imported.
- Check whether lazy components have visible fallbacks and error handling.
- Check whether CSS assumptions cross lazy bundle boundaries.
- Check whether a lazy split actually improves the user path instead of delaying critical first-screen UI.
