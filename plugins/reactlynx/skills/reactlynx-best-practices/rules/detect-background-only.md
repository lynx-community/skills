---
title: Detect Background-Only API Usage
ruleId: detect-background-only
impact: CRITICAL
impactDescription: prevents thread context violations
tags: dual-thread, background-only, native-modules, lynx, directive
---

## Detect Background-Only API Usage

Ensure `lynx.getJSModule` and `NativeModules` are only called in background-thread contexts.

### Why It Matters

In ReactLynx's dual-thread architecture, initial rendering can evaluate component code on the main thread while the background thread runs the full React runtime. Side effects unrelated to rendering are background-only. Calling background-only APIs during render can fail on the main thread because APIs such as `lynx.getJSModule` may not exist there.

Calling `lynx.getJSModule` or `NativeModules` from render or other shared code can:
- Throw at runtime on the main thread
- Increase main-thread bundle size by keeping side-effect code reachable
- Break the compiler's background-only analysis

### Thread Context Reference

| Context | Thread | Allowed |
|---------|--------|---------|
| Component render body | Main + background during first render | ❌ |
| `useEffect` | Background | ✅ |
| `useLayoutEffect` | Unsupported in ReactLynx | ❌ |
| `useImperativeHandle` | Background | ✅ |
| `ref` callback | Background | ✅ |
| Event handlers (`bindtap`, etc.) | Background | ✅ |
| `'background only'` functions | Background | ✅ |
| Module with `import 'background-only'` | Background | ✅ |

**Incorrect (Main Thread - render scope):**

```tsx
export function App() {
  // Error: called in main thread (render scope)
  const module = lynx.getJSModule('SomeModule');
  NativeModules.SomeModule.call();

  return <view />;
}
```

**Correct (Background Thread - useEffect):**

```tsx
export function App() {
  useEffect(() => {
    lynx.getJSModule('SomeModule').doSomething();
    NativeModules.SomeModule.call();
  }, []);
  return <view />;
}
```

**Correct (Background Thread - 'background only' directive):**

```tsx
export function App() {
  function doBackgroundWork() {
    'background only';
    lynx.getJSModule('SomeModule');
  }
  useEffect(() => doBackgroundWork(), []);
  return <view />;
}
```

**Correct (Background Thread - event handler):**

```tsx
export function App() {
  function handleTap() {
    lynx.getJSModule('SomeModule');
  }
  return <view bindtap={handleTap} />;
}
```

**Correct (Background Thread - ref callback):**

```tsx
export function App() {
  return <text ref={(ref) => {
    lynx.getJSModule('SomeModule');
  }} />;
}
```

**Correct (Background Thread - useImperativeHandle):**

```tsx
export function App() {
  useImperativeHandle(ref, () => ({
    doSomething: () => lynx.getJSModule('SomeModule')
  }));
  return <view />;
}
```

---

## Background Only Directive

Use the `'background only'` directive to mark functions that should only run on the background thread.

The `'background only'` directive:
- Explicitly marks functions for background thread execution
- Enables tree-shaking of main-thread code
- Improves code clarity about thread boundaries
- Allows native module calls within the function

**Basic usage:**

```tsx
function doBackgroundWork() {
  'background only';
  
  // ✅ Safe to call native modules
  lynx.getJSModule('SomeModule').doWork();
  NativeModules.Analytics.track('event');
}
```

**Arrow function syntax:**

```tsx
const processData = () => {
  'background only';
  
  NativeModules.DataProcessor.process(data);
};
```

**With TypeScript:**

```tsx
function fetchUser(id: string): Promise<User> {
  'background only';
  return lynx.getJSModule('UserAPI').getUser(id);
}
```

### When to Use the Directive

| Scenario | Use Directive? |
|----------|---------------|
| Function calls native modules | ✅ Yes |
| Function is called from useEffect | ✅ Yes (optional but recommended) |
| Function is called from event handler | ✅ Yes (optional but recommended) |
| Function is passed through a custom prop before reaching `bindtap` | ✅ Yes |
| Callback is passed to a custom hook that eventually calls `useEffect` | ✅ Yes |
| Function only does pure computation | ❌ No |
| Function is called during render | ❌ No (will cause error) |

### Best Practices

1. **Place directive first**: Must be the first statement in the function body
2. **Use single or double quotes**: Both `'background only'` and `"background only"` work
3. **Document intent**: The directive serves as documentation for other developers
4. **Mark boundary callbacks**: Add the directive when callbacks cross custom component or custom hook boundaries because compiler analysis may not infer their background-only use
5. **Prefer module directives for utility modules**: If every export in a module is background-only, use `import 'background-only'` at the top of that module

### Custom Component Boundary

When an event handler is passed as a custom prop, the compiler may not know that it eventually becomes `bindtap`. Mark the handler explicitly.

```tsx
function App() {
  function handleTap() {
    'background only';
    NativeModules.Analytics.track('tap');
  }

  return <Button onClick={handleTap} />;
}

function Button({ onClick }) {
  return <view bindtap={onClick} />;
}
```

### Custom Hook Boundary

When a custom hook wraps `useEffect`, mark the callback passed into that hook.

```tsx
function useMount(effect: () => void) {
  useEffect(() => {
    effect();
  }, []);
}

function App() {
  useMount(() => {
    'background only';
    lynx.getJSModule('Tracker').mount();
  });

  return <view />;
}
```
