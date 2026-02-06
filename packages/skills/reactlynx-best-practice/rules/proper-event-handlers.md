---
title: Proper Event Handler Usage
ruleId: proper-event-handlers
impact: MEDIUM
impactDescription: ensures correct event binding and propagation
tags: events, bindtap, catchtap, handlers, propagation
---

## Proper Event Handler Usage

Use event handlers correctly for proper event binding and propagation in ReactLynx.

### Event Handler Types

| Attribute | Behavior | Use Case |
|-----------|----------|----------|
| `bindtap` | Bubbles up to parent | Default choice for tap events |
| `catchtap` | Stops propagation | Prevent parent handlers from firing |

### Why It Matters

Event handlers in ReactLynx run on the **background thread**, making them safe for:
- Native module calls (`lynx.getJSModule`, `NativeModules`)
- API requests
- Heavy computations

### Event Object

The `Event` object contains state information when the event is triggered:

```typescript
interface Event {
  type: string;           // Event type
  timestamp: number;      // Timestamp when event was generated
  target: {               // Element that triggered the event
    id: string;
    uid: number;
    dataset: Record<string, any>;
  };
  currentTarget: {        // Element that listens to the event
    id: string;
    uid: number;
    dataset: Record<string, any>;
  };
}
```

**`target` vs `currentTarget`:**
- `target` - The element that **triggered** the event (e.g., the clicked child)
- `currentTarget` - The element that **listens** to the event (e.g., the parent with handler)

### Event Types

| Type | Description |
|------|-------------|
| `TouchEvent` | Touch events (tap, touchstart, touchmove, touchend) |
| `CustomEvent` | Custom component events |
| `AnimationEvent` | CSS animation lifecycle events |

### Basic Usage

**Function reference (recommended):**

```tsx
function App() {
  function handleTap(event) {
    console.log('Event type:', event.type);
    console.log('Target id:', event.target.id);
    lynx.getJSModule('Analytics').track('tap');
  }
  
  return <view id="my-view" bindtap={handleTap}>Tap me</view>;
}
```

**Inline arrow function:**

```tsx
function App() {
  return (
    <view bindtap={(event) => {
      console.log('tapped at:', event.timestamp);
    }}>
      Tap me
    </view>
  );
}
```

### Using `dataset`

Pass custom data via `data-` attributes:

```tsx
function App() {
  function handleTap(event) {
    const { itemId, itemName } = event.currentTarget.dataset;
    console.log(`Tapped item: ${itemId} - ${itemName}`);
  }
  
  return (
    <view 
      data-item-id="123" 
      data-item-name="Product" 
      bindtap={handleTap}
    >
      Tap me
    </view>
  );
}
```

### Event Propagation

**Bubbling with `bindtap`:**

```tsx
function App() {
  function handleOuterTap() {
    console.log('outer tapped'); // Fires second
  }
  
  function handleInnerTap() {
    console.log('inner tapped'); // Fires first
  }
  
  return (
    <view bindtap={handleOuterTap}>
      <view bindtap={handleInnerTap}>Inner</view>
    </view>
  );
}
// Output when clicking Inner: "inner tapped", "outer tapped"
```

**Stop propagation with `catchtap`:**

```tsx
function App() {
  function handleOuterTap() {
    console.log('outer tapped'); // Never fires
  }
  
  function handleInnerTap() {
    console.log('inner tapped'); // Only this fires
  }
  
  return (
    <view bindtap={handleOuterTap}>
      <view catchtap={handleInnerTap}>Inner</view>
    </view>
  );
}
// Output when clicking Inner: "inner tapped"
```

**Programmatic stop propagation (main thread only):**

```tsx
function handleTap(event: MainThread.ITouchEvent) {
  'main thread';
  event.stopPropagation();           // Stop bubbling
  event.stopImmediatePropagation();  // Stop bubbling + prevent other handlers on same element
}
```

### Best Practices

1. **Use function references** over inline functions for better performance
2. **Use `catchtap`** only when you need to stop event propagation
3. **Use `dataset`** to pass data instead of closures when possible
4. **Prefer `currentTarget`** over `target` for accessing the listening element's data
5. **Native calls are safe** - event handlers run on background thread
