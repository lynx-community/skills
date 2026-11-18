---
title: Performance Profiling
ruleId: performance-profiling
impact: MEDIUM
impactDescription: makes render and update bottlenecks observable
tags: performance, profiling, trace, displayName, setState
---

## Performance Profiling

Use ReactLynx profiling to identify expensive renders, diff work, commits, patches, and unnecessary state updates. Profiling is most useful when run with realistic data and user flows.

### Trace Events

| Trace | Meaning |
|-------|---------|
| `ReactLynx::render::ComponentName` | Time spent executing a component render function |
| `ReactLynx::diff::ComponentName` | Time spent diffing a component's virtual tree |
| `ReactLynx::diffFinishNoPatch` | A diff finished without producing a UI patch |
| `ReactLynx::commit` | Time spent committing updates to the native layer |
| `ReactLynx::patch` | Time spent applying patches on the main thread |
| `ReactLynx::setState` | A state update was scheduled, including changed state key metadata |

### Enable and Interpret

ReactLynx profiling instrumentation is enabled when Lynx engine profile recording is active. Lynx 3.0 or later provides APIs such as `lynx.performance.profileStart()`, `profileEnd()`, `profileMark()`, `profileFlowId()`, and `isProfileRecording()`.

Use flow IDs to connect `setState` to the following diff, commit, and patch work. A repeated `diffFinishNoPatch` pattern usually means components are re-rendering without visible UI changes.

### Component Names

Production builds may minify component names. Set `displayName` for components that need readable profiling traces.

```tsx
function FeedItem() {
  return <view />;
}

FeedItem.displayName = 'FeedItem';
```

If build tooling treats `displayName` assignments as side effects, wrap the assignment in a pure helper.

```tsx
function withDisplayName<T extends React.ComponentType<any>>(
  Component: T,
  name: string,
): T {
  Component.displayName = name;
  return Component;
}

function FeedItem() {
  return <view />;
}

export default /* @__PURE__ */ withDisplayName(FeedItem, 'FeedItem');
```

### Review Checklist

- Profile production-like builds and realistic data, not tiny mock states.
- Focus on components that render frequently or own large UI trees.
- Use `React.memo`, `useMemo`, stable props, and narrower state ownership when traces show repeated no-patch diffs.
- Keep readable `displayName` values for components that appear in hot paths.
- Follow flow IDs from `setState` through diff, commit, and patch before choosing an optimization.
