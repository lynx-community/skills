---
name: event-analysis
description: A guide for analyzing Lynx trace event issues. Use this when encountering missing touch/custom/global events, slow event response, or uncertainty about which business handler processed an event. It provides diagnostic logic to identify the event entry, follow dispatch flow to the real handler, and distinguish delivery delay from handler cost.
---

# Lynx Event Analysis Guide

## Core Knowledge Base

### 1. Event Categories
Lynx event analysis in trace usually starts from one of these categories:

| Category | Typical Event Types | Trace Name |
| :--- | :--- | :--- |
| TouchEvent | `touchstart`, `touchmove`, `touchend`, `touchcancel`, `tap`, `longpress`, `click` | `TouchEventHandler::HandleTouchEvent` |
| Non-Touch Element Event | `layoutchange`, `uiappear`, `uidisappear`, `animationstart`, `animationend`, `transitionstart`, `transitionend`, component custom events(like `scroll`) | `TouchEventHandler::HandleCustomEvent` |
| GlobalEventEmitter | page-level global broadcast/listener events | `CallJSFunction` with `module_name = GlobalEventEmitter`, `method_name = emit`, and `arg0 = eventName` |

### 2. Key Trace Signals
- `args.name`: The concrete event type on `HandleTouchEvent` or `HandleCustomEvent`.
- `arg0` on `GlobalEventEmitter` emit: The emitted event name.
- `TouchEventHandler::FireEvent`: The event is being dispatched into the frontend event system.
- `flow`: The bridge between dispatch on one thread and actual event handling on another thread.
- `Lynx_JS`: The usual execution thread for `bind*`, `catch*`, and `capture-*` handlers.
- Main-thread script handler: If the event is bound via `main-thread:bind*`, the business handler may execute on the main thread script instead of `Lynx_JS`.

### 3. First Principle
Always identify the event entry first, then follow `flow`, `ancestors`, `descendants`, and nearby slices to locate the real business handler. Do not jump directly to render or jank conclusions before confirming whether the event was entered, dispatched, queued, and actually handled.

---

## Analysis Steps

### Step 1: Identify the Event Entry
1. Identify whether the expected event is a TouchEvent, a non-touch Element Event, or a `GlobalEventEmitter` event.
2. Query candidate entry slices and inspect their core args:
   - `args.name` for touch/custom element events.
   - `module_name`, `method_name`, and `arg0` for global events, where `arg0` is the event name.
3. If multiple matching entries exist, narrow the target by time window, thread, and nearby business context.

#### Example SQL: TouchEvent / CustomEvent entry slices for a specific event name
```sql
-- Replace 'tap' with the expected event name, such as
-- 'touchmove', 'layoutchange', 'animationend', or 'transitionend'.
SELECT
  s.id,
  s.name,
  s.ts / 1e6 AS ts_ms,
  s.dur / 1e6 AS dur_ms,
  t.name AS thread_name,
  json_group_object(a.key, a.display_value) AS args
FROM slice s
LEFT JOIN args a ON s.arg_set_id = a.arg_set_id
LEFT JOIN thread_track tt ON s.track_id = tt.id
LEFT JOIN thread t ON tt.utid = t.utid
WHERE s.name = 'TouchEventHandler::HandleTouchEvent'
  AND s.arg_set_id IN (
    SELECT arg_set_id
    FROM args
    WHERE key LIKE '%name%'
      AND display_value = 'tap'
  )
GROUP BY s.id
ORDER BY s.ts DESC
```

#### Example SQL: Inspect the matched event name field
```sql
-- Replace 'scroll' with the expected event name.
SELECT
  s.id,
  s.name,
  s.ts / 1e6 AS ts_ms,
  s.dur / 1e6 AS dur_ms,
  t.name AS thread_name,
  a.key,
  a.display_value
FROM slice s
JOIN args a ON s.arg_set_id = a.arg_set_id
LEFT JOIN thread_track tt ON s.track_id = tt.id
LEFT JOIN thread t ON tt.utid = t.utid
WHERE s.name in ('TouchEventHandler::HandleCustomEvent', 'TouchEventHandler::HandleTouchEvent')
  AND a.key LIKE '%name%'
  AND a.display_value = 'scroll'
ORDER BY s.ts DESC
```

#### Example SQL: GlobalEventEmitter entry slices for a specific event name
```sql
-- Replace 'disexposure' with the expected emitted event name.
SELECT
  s.id,
  s.name,
  s.ts / 1e6 AS ts_ms,
  s.dur / 1e6 AS dur_ms,
  t.name AS thread_name,
  json_group_object(a.key, a.display_value) AS args
FROM slice s
LEFT JOIN args a ON s.arg_set_id = a.arg_set_id
LEFT JOIN thread_track tt ON s.track_id = tt.id
LEFT JOIN thread t ON tt.utid = t.utid
WHERE s.name = 'CallJSFunction'
GROUP BY s.id
HAVING args LIKE '%GlobalEventEmitter%'
   AND args LIKE '%emit%'
   AND args LIKE '%disexposure%'
ORDER BY s.ts DESC
```

### Step 2: Confirm Dispatch to Frontend Event System
1. For touch/custom element events, inspect `descendants` of the entry event.
2. Check whether `TouchEventHandler::FireEvent` exists.
3. If `FireEvent` exists, query its `flow` to locate the receiving handler execution.
4. If the event uses `main-thread:bind*`, also inspect main thread script slices instead of assuming the flow must end on `Lynx_JS`.

### Step 3: Locate the Real Business Handler
1. Use `flow` from `TouchEventHandler::FireEvent` or from the relevant event dispatch slice.
2. On the receiving thread, inspect the landing slice and its descendants events.
3. Use `descendants` around the landing slice to find:
   - frontend event dispatch
   - business handler execution
4. For `GlobalEventEmitter`, inspect the child calls under `CallJSFunction` to locate the listener and business callback.

### Step 4: Classify the Failure or Delay Stage
After locating the event chain, determine which stage failed or became slow:

1. **Entry Missing**: The expected event entry never appears.
2. **Entry Exists, No Dispatch**: Entry exists but `FireEvent` or downstream dispatch is missing.
3. **Dispatched, Handler Not Reached**: Dispatch exists but no business handler is found at the flow destination.
4. **Handler Reached Late**: Dispatch exists, but there is a large gap before handler execution starts.
5. **Handler Slow**: Handler starts promptly but its own execution or descendants are slow.
6. **Handler Fast, UI Slow**: Handler finishes quickly, but `diffVdom`, patch, layout, or paint is slow.

---

## Diagnostic Logic & Rules

### Phase: TouchEvent Missing or Unexpected
**Entry**: `TouchEventHandler::HandleTouchEvent`

**Checkpoints**:
- Does `args.name` match the expected type, such as `tap` or `touchmove`?
- Does `TouchEventHandler::FireEvent` exist under this entry?
- Does the `flow` reach the expected handler thread?

**If the entry is missing, likely causes**:
- The target node was not hit.
- Gesture or scroll handling intercepted the input.
- `tap` failed because movement exceeded the threshold.
- The node did not register the expected event.
- Interaction hit-testing is disabled by configuration such as `user-interaction-enabled=false`.

### Phase: CustomEvent or AnimationEvent Missing
**Entry**: `TouchEventHandler::HandleCustomEvent`

**Checkpoints**:
- Does `args.name` match the expected event, such as `layoutchange`, `animationend`, or `transitionend`?
- Does `TouchEventHandler::FireEvent` exist?
- Does the downstream `flow` reach the frontend/business handler?

**If entry exists but business logic does not run, likely causes**:
- The element did not bind the event.
- The event name does not match the binding.
- The event trigger condition was never satisfied.
- ReactLynx handler mapping failed or is inconsistent.
- Hydration or snapshot issues caused the binding state to diverge.

### Phase: GlobalEventEmitter Missing
**Entry**: `CallJSFunction`

**Required arguments**:
- `module_name = GlobalEventEmitter`
- `method_name = emit`
- `arg0 = eventName`

**Checkpoints**:
- Does the call exist with the expected event name?
- Do child calls or descendants enter the intended listener?

**If emit exists but listener does not run, likely causes**:
- `addListener` happened too late.
- The emitted event name does not match the listener name.
- The producer and listener are on different Lynx pages.
- The event bus is being used in an unsupported runtime context.
- The listener was removed before dispatch.

### Phase: Slow Event Response
**Key path**:
- `TouchEventHandler::FireEvent`
- `flow` to `Lynx_JS` or main-thread script
- actual business handler start

**Mandatory timing comparison**:
1. Record the timestamp of `TouchEventHandler::FireEvent`.
2. Record the timestamp when the real business handler begins.
3. Compare the gap between them.

**Verdict Logic**:
- **Large FireEvent -> handler gap**:
  - Verdict: The handler was queued behind earlier work on the target thread.
  - Action: Inspect the target thread during the gap. Identify the long task already running before the handler started.
- **Small gap, but long handler duration**:
  - Verdict: Business handler logic itself is heavy.
  - Action: Inspect handler descendants and expensive synchronous work.
- **Handler fast, UI update slow**:
  - Verdict: The bottleneck is in `diffVdom`, patching, layout, or paint rather than event dispatch.
  - Action: Switch to render-pipeline analysis for the follow-up stages.

**Common blocking sources during the gap**:
- A previous event handler is still running, such as repeated `touchmove`, scroll, or `layoutchange` work.
- `ReactLynx` render, diff, or commit is already occupying the JS thread.
- `useEffect`, lifecycle callbacks, or synchronous business callbacks are too heavy.
- Large JSON parsing, large array traversal, or synchronous data processing blocks the thread.
- A `GlobalEventEmitter` listener or JSB callback performs heavy sync work.
- Frequent state updates keep the thread busy with continuous update work.

### Phase: Main-Thread Event Handler
**Symptom**: Event uses `main-thread:bind*` and no meaningful `flow` lands on `Lynx_JS`.

**Verdict**:
- This is expected for handlers intentionally executed on main-thread script.

**Action**:
- Inspect main thread script slices, ancestors, descendants, and follow-up UI work instead of treating missing `Lynx_JS` flow as a failure.
