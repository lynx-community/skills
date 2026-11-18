---
title: Hoist Static JSX Elements
ruleId: hoist-static-jsx
impact: LOW
impactDescription: avoids re-creation
tags: rendering, jsx, static, optimization
---

## Hoist Static JSX Elements

Extract static JSX outside components to avoid re-creation.

**Incorrect (recreates element every render):**

```tsx
function LoadingSkeleton() {
  return <view className="animate-pulse h-20 bg-gray-200" />
}

function Container() {
  return (
    <view>
      {loading && <LoadingSkeleton />}
    </view>
  )
}
```

**Correct (reuses same element):**

```tsx
const loadingSkeleton = (
  <view className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return (
    <view>
      {loading && loadingSkeleton}
    </view>
  )
}
```

This is especially helpful for large and static SVG nodes, which can be expensive to recreate on every render.

**Note:** If your project has [React Compiler](https://lynxjs.org/react/react-compiler#react-compiler) enabled, the compiler automatically hoists static JSX elements and optimizes component re-renders, making manual hoisting unnecessary.
