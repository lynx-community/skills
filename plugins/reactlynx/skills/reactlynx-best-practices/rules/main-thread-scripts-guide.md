---
title: Main Thread Script Guide
ruleId: main-thread-scripts-guide
impact: MEDIUM
impactDescription: enables smooth animations and gesture handling
tags: dual-thread, main-thread, animation, gesture, optimization
---

## Main Thread Script

Use `'main thread'` directive and `main-thread:` event prefix to handle events synchronously on the main thread for smooth animations and gesture handling.

### Why It Matters

In Lynx's multi-threaded architecture, events are triggered on the main thread, but regular JS event handlers execute on the background thread. This causes:

- Event trigger → Event handling → Rendering involves multiple thread switches
- Untimely responses and animations lagging behind gestures
- Delay increases as page complexity grows

The main thread script provides **synchronous event handling on the main thread**, eliminating response delay.

### Basic Usage

**Step 1: Add `main-thread:` prefix to event attribute:**

```tsx
<view main-thread:bindtap={onTap} />
<view main-thread:global-bindscroll={onScroll} />
```

**Step 2: Declare function as main thread function with `'main thread'` directive:**

```tsx
function onTap(event: MainThread.ITouchEvent) {
  'main thread';
  event.currentTarget.setStyleProperty('background-color', 'red');
}
```

### Example: Scroll-Synced Animation

**❌ Without main thread (has delay):**

```tsx
function App() {
  const [pos, setPos] = useState(0);
  
  function onScroll(event) {
    // Runs on background thread - causes delay
    setPos(event.detail.scrollTop);
  }
  
  return (
    <scroll-view global-bindscroll={onScroll}>
      <view style={{ transform: `translateY(${pos}px)` }} />
    </scroll-view>
  );
}
```

**✅ With main thread (no delay):**

```tsx
function App() {
  function onScroll(event: MainThread.IScrollEvent) {
    'main thread';
    const scrollTop = event.detail.scrollTop;
    event.currentTarget.setStyleProperty(
      'transform',
      `translateY(${scrollTop}px)`
    );
  }
  
  return (
    <scroll-view main-thread:global-bindscroll={onScroll}>
      <view />
    </scroll-view>
  );
}
```

### Capturing Variables from Background Thread

Main thread functions can capture external variables, but cannot modify them:

```tsx
function App() {
  const color = 'red';
  
  function handleTap(event: MainThread.ITouchEvent) {
    'main thread';
    // ✅ Can read captured variable
    event.currentTarget.setStyleProperty('background-color', color);
    // ❌ Cannot modify: color = 'blue';
  }
  
  return <view main-thread:bindtap={handleTap} />;
}
```

**Important:**
- Captured values sync from background to main thread only after component re-renders
- Captured values must be JSON-serializable

### Using `main-thread:ref`

Use `useMainThreadRef()` to get a node object usable on the main thread:

```tsx
import { useMainThreadRef } from '@lynx-js/react';

function App() {
  const textRef = useMainThreadRef<MainThread.Element>();
  
  function handleTap(event: MainThread.ITouchEvent) {
    'main thread';
    textRef.current?.setStyleProperty('background-color', 'red');
  }
  
  return (
    <view main-thread:bindtap={handleTap}>
      <text main-thread:ref={textRef}>Only this text changes</text>
      <text>This text stays the same</text>
    </view>
  );
}
```

### Maintaining State in Main Thread

Use `MainThreadRef` to maintain state between main thread function calls:

```tsx
import { useMainThreadRef } from '@lynx-js/react';

function App() {
  const countRef = useMainThreadRef(0);
  
  function handleTap(event: MainThread.ITouchEvent) {
    'main thread';
    countRef.current++;
    event.currentTarget.setStyleProperty(
      'background-color',
      countRef.current % 2 ? 'blue' : 'green'
    );
  }
  
  return <view main-thread:bindtap={handleTap} />;
}
```

### Cross-Thread Function Calls

**Background → Main thread:**

```tsx
import { runOnMainThread, useMainThreadRef } from '@lynx-js/react';

function App() {
  const countRef = useMainThreadRef(0);
  
  const addCount = (value: number) => {
    'main thread';
    countRef.current += value;
    return countRef.current;
  };
  
  const increaseCount = async () => {
    const result = await runOnMainThread(addCount)(1);
    console.log(result);
  };
}
```

**Main thread → Background:**

```tsx
import { runOnBackground, useState } from '@lynx-js/react';

function App() {
  const [count, setCount] = useState(0);
  
  const handleTap = async (event: MainThread.ITouchEvent) => {
    'main thread';
    const result = await runOnBackground(() => {
      setCount((c) => c + 1);
      return count + 1;
    })();
    console.log(result);
  };
}
```

### Rules Summary

| Rule | Description |
|------|-------------|
| Main thread functions must use `'main thread'` directive | First statement in function body |
| Use `main-thread:` prefix for events | e.g., `main-thread:bindtap` |
| Captured variables must be JSON-serializable | Passed via `JSON.stringify()` |
| Cannot modify captured variables | Read-only access |
| No nested main thread function definitions | Not supported |
| `MainThreadRef.current` only accessible in main thread | Use `useMainThreadRef()` |
