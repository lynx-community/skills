# Double-Thread Data Sync Reference

Use this reference when a FiberElement app needs first-screen data, background-side async updates, or event-driven updates. Keep the main thread deterministic: it renders payloads, updates Element PAPI nodes, and flushes. Keep data loading, native updates, timers, and event handling in `src/background.ts`.

`lynxCoreInject.tt` is the background-thread bridge for card data and event dispatch. Keep it out of `src/main-thread.ts`; main-thread code should expose lifecycle functions on `globalThis` and render payloads it receives from background.

## Bridge API Surface

- Initial data: `lynxCoreInject.tt._params.initData`.
- Update data: `lynxCoreInject.tt._params.updateData`.
- Native/card data updates: `lynxCoreInject.tt.updateCardData(newData, options?)`.
- Element events registered with `__AddEvent(node, 'bindEvent', eventName, handlerName)`: `lynxCoreInject.tt.publishEvent(handlerName, data)`.

## Bridge Usage Rules

- Read `_params.initData` and `_params.updateData` when the background module loads.
- Override `updateCardData` only in `src/background.ts`, then merge the payload into the post-initialization background state.
- Override `publishEvent` only in `src/background.ts`, then delegate unknown events to the previous handler.
- Do not call Element PAPI rendering APIs from these handlers; sync render payloads back to main-thread lifecycle methods instead.

## Ownership Model

- If first-screen data exists, `src/main-thread.ts` owns and normalizes it first.
- `processData(data)` is the main-thread-to-background synchronization point for first-screen data.
- If no first-screen data exists, `src/background.ts` can initialize its state from `_params`.
- Native/card updates merge into background state after initialization.
- Events mutate background state first.
- One `syncState()` function sends top-level diff patches to `updatePage`.

## First-Screen Data

Use this shape when the app receives renderable first-screen data:

```typescript
let firstScreenState: Required<RenderState> | undefined;

function renderPage(data: RenderState): void {
  firstScreenState = normalizeState(data);
  renderState(firstScreenState);
}

function processData(data: RenderState): Required<RenderState> {
  firstScreenState = normalizeState(data);
  return firstScreenState;
}
```

The background thread then treats `lynxCoreInject.tt._params.updateData` as the synchronized first-screen state. Background events may mutate from that baseline and call `syncState()` with only changed fields.

## Background Skeleton

```typescript
let renderState = readInitialState();
let lastSyncedState = renderState;

function readInitialState(): Required<RenderState> {
  const params = (
    lynxCoreInject.tt as {
      _params?: {
        initData?: Record<string, unknown>;
        updateData?: Record<string, unknown>;
      };
    }
  )._params;

  return normalizeState({
    ...(params?.initData ?? {}),
    ...(params?.updateData ?? {}),
  });
}

function setRenderState(patch: RenderState | Record<string, unknown>): void {
  renderState = normalizeState({
    ...renderState,
    ...patch,
  });
}

function createSyncPatch(): RenderState {
  const patch: RenderState = {};

  for (const key of Object.keys(renderState) as Array<keyof RenderState>) {
    if (renderState[key] !== lastSyncedState[key]) {
      patch[key] = renderState[key];
    }
  }

  return patch;
}

function syncState(): void {
  const patch = createSyncPatch();
  if (Object.keys(patch).length === 0) {
    return;
  }

  lastSyncedState = renderState;
  lynx.getNativeApp().callLepusMethod('updatePage', patch);
}

lynxCoreInject.tt.updateCardData = function (
  newData: Record<string, unknown>,
): void {
  setRenderState(newData);
  syncState();
};
```

## Event Skeleton

```typescript
const previousPublishEvent = lynxCoreInject.tt.publishEvent;

lynxCoreInject.tt.publishEvent = (
  handlerName: string,
  data: EventDataType,
) => {
  if (handleAppEvent(handlerName, data)) {
    return;
  }

  previousPublishEvent?.call(lynxCoreInject.tt, handlerName, data);
};
```

`handleAppEvent` should return `true` only after the app has handled the event and called `syncState()`.

## App-Specific Functions

Each app still defines these pieces:

```typescript
function normalizeState(data: RenderState | Record<string, unknown>): Required<RenderState> {
  // Validate external data and fill defaults.
}

function handleAppEvent(handlerName: string, data: EventDataType): boolean {
  // Mutate background state with setRenderState(...), call syncState(), return true.
}
```

## Main Thread Contract

```typescript
let currentState: Required<RenderState> | undefined;

function mergeState(patch: RenderState): Required<RenderState> {
  currentState = normalizeState({
    ...(currentState ?? {}),
    ...patch,
  });
  return currentState;
}

function updatePage(patch: RenderState): void {
  renderState(mergeState(patch));
  __FlushElementTree();
}
```

## Flow

1. Main thread registers events with string handler names.
2. Native dispatches an event into background.
3. Background validates the handler name and mutates its current state.
4. Background calls `syncState()` and sends only changed top-level fields.
5. Main thread receives `updatePage(patch)`, merges it into local state, mutates Element PAPI nodes, and calls `__FlushElementTree()`.

Avoid direct `callLepusMethod('updatePage', ...)` calls outside `syncState()`. A single outbound path keeps native updates, async work, and event-driven changes consistent.
