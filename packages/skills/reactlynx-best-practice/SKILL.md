---
name: reactlynx-best-practices
description: Best practices and static analysis rules for ReactLynx applications. Detects improper usage patterns in dual-thread architecture, ensures APIs are called in correct thread context. Use this skill when writing, reviewing, or refactoring ReactLynx components.
---

# ReactLynx Best Practices

Best practices and static analysis rules for ReactLynx applications. This skill helps you write performant, correct ReactLynx code by detecting common pitfalls and enforcing recommended patterns.

## Background: Dual-Thread Architecture

ReactLynx uses a **dual-thread architecture**:

| Thread | Description | Runs |
|--------|-------------|------|
| **Main Thread** | Handles UI rendering and layout | React component render, JSX evaluation |
| **Background Thread** | Handles business logic and native calls | Effects, event handlers, native module calls |

This architecture improves performance by offloading heavy operations to the background thread, keeping the main thread responsive for UI updates.

### Key Principle

> **Native module APIs (`lynx.getJSModule`, `NativeModules`) must only be called in background thread contexts, never in main-thread.**

## When to Apply

Reference these guidelines when:
- Writing new ReactLynx components
- Calling native module APIs (`lynx.getJSModule`, `NativeModules`)
- Understanding main-thread vs background-thread boundaries
- Optimizing component performance
- Refactoring existing ReactLynx code

## Rule Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Background-Only APIs | CRITICAL | `background-` |

> More categories coming soon: `rendering-`, `performance-`, `hooks-`

## Quick Reference

### 1. Background-Only APIs (CRITICAL)

- `detect-background-only` - Ensure `lynx.getJSModule` and `NativeModules` are only called in background thread contexts

## Rules

---

### detect-background-only

**Severity:** `error`  
**Category:** Background-Only APIs

Detects when `lynx.getJSModule` and `NativeModules` are called in main-thread context instead of background-thread context.

#### Why It Matters

In ReactLynx's dual-thread architecture:
- **Main thread**: Runs React component render functions, evaluates JSX
- **Background thread**: Runs effects, event handlers, and native module calls

Calling `lynx.getJSModule` or `NativeModules` in main thread will:
- Block UI rendering
- Cause thread synchronization overhead
- Lead to poor user experience

#### Thread Context Reference

| Context | Thread | Allowed |
|---------|--------|---------|
| Component render body | Main and Background | ❌ |
| `useEffect` / `useLayoutEffect` | Background | ✅ |
| `useImperativeHandle` | Background | ✅ |
| `ref` callback | Background | ✅ |
| Event handlers (`bindtap`, etc.) | Background | ✅ |
| `'background only'` functions | Background | ✅ |

#### Examples

**❌ Incorrect (Main Thread):**

```tsx
export function App() {
  // Error: called in main thread (render scope)
  const module = lynx.getJSModule('SomeModule');
  NativeModules.SomeModule.call();

  return <view />;
}
```

**✅ Correct (Background Thread):**

```tsx
// Inside useEffect - runs in background thread
export function App() {
  useEffect(() => {
    lynx.getJSModule('SomeModule').doSomething();
    NativeModules.SomeModule.call();
  }, []);
  return <view />;
}
```

```tsx
// Inside 'background only' function
export function App() {
  function doBackgroundWork() {
    'background only';
    lynx.getJSModule('SomeModule');
  }
  useEffect(() => doBackgroundWork(), []);
  return <view />;
}
```

```tsx
// Inside event handler - runs in background thread
export function App() {
  function handleTap() {
    lynx.getJSModule('SomeModule');
  }
  return <view bindtap={handleTap} />;
}
```

```tsx
// Inside ref callback - runs in background thread
export function App() {
  return <text ref={(ref) => {
    lynx.getJSModule('SomeModule');
  }} />;
}
```

```tsx
// Inside useImperativeHandle - runs in background thread
export function App() {
  useImperativeHandle(ref, () => ({
    doSomething: () => lynx.getJSModule('SomeModule')
  }));
  return <view />;
}
```

---

## Programmatic Usage

### API

```typescript
import { analyzeBackgroundOnlyUsage, runSkill } from '@lynx-js/skills-react';

const diagnostics = runSkill(sourceCode);
// or
const diagnostics = analyzeBackgroundOnlyUsage(sourceCode);
```

### Example

```typescript
const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;

const diagnostics = runSkill(source);
console.log(diagnostics);
// [
//   {
//     ruleId: 'detect-background-only',
//     message: "'lynx.getJSModule' must only be called in background-only contexts...",
//     severity: 'error',
//     location: { start: { line: 3, column: 2 }, end: { line: 3, column: 32 } }
//   }
// ]
```

### Diagnostic Interface

```typescript
interface Diagnostic {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

## Rule Files

Individual rule definitions are located in the `rules/` directory:

```
rules/
└── detect-background-only.yml
```

Each rule file contains:
- Rule ID and language target
- Severity level
- Error message template
- Usage notes and examples
