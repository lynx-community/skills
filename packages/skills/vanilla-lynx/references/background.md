# Background Thread Reference

Add a `background.ts` entry when a Vanilla Lynx app needs to handle heavier work. The background thread responds to messages from the main thread, owns background state, and runs tasks such as async requests, timers, native calls, data processing, or other business logic.

Read `event.md` for `lynx.getJSContext()`, `lynx.getCoreContext()`, and event environment APIs.

## Table of Contents

- [Role](#role)
- [Listen for Messages dispatched from Main Thread](#listen-for-messages-dispatched-from-main-thread)
- [Dispatch Patches to the Main Thread](#dispatch-patches-to-the-main-thread)
- [Handle Background Tasks](#handle-background-tasks)
- [Data Guardrails](#data-guardrails)

## Role

- Listen for messages from the main thread.
- Merge main-thread data into background-owned state.
- Run heavier tasks requested by the main thread.
- Keep background-owned app state.
- Dispatch serializable patches back to the main thread so `main-thread.ts` can update and flush the UI.
- Never call Element PAPI APIs or `__FlushElementTree()` from the background thread.
- Clean up listeners when the destroy lifecycle arrives.

Simple UI updates do not need a background thread; keep them in `main-thread.ts`.

## Listen for Messages dispatched from Main Thread

Call `setupBackground()` once at module startup. Use `const mainThread = lynx.getCoreContext()` to name the cross-thread target explicitly, then reuse it to listen for messages dispatched from the main thread through `lynx.getJSContext().dispatchEvent`.

```javascript
const mainThread = lynx.getCoreContext();
const backgroundListeners = [];

function addBackgroundListener(name, handler) {
  mainThread.addEventListener(name, handler);
  backgroundListeners.push({ name, handler });
}

function clearBackgroundListeners() {
  const currentListeners = backgroundListeners.splice(0);
  for (const { name, handler } of currentListeners) {
    mainThread.removeEventListener(name, handler);
  }
}

function setupBackground() {
  addBackgroundListener("UpdateDataFromMainThread", (event) => {
    const data = event.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      updateDataFromMainThread(data);
    }
  });

  addBackgroundListener("DispatchEventToBackground", (event) => {
    const payload = event.data;
    if (!payload || typeof payload.handlerName !== "string") return;
    handleBackgroundTask(payload.handlerName, payload.data);
  });

  addBackgroundListener("__DestroyLifetime", () => {
    clearBackgroundListeners();
  });
}
```

## Dispatch Patches to the Main Thread

Reuse the same module-level `mainThread` returned by `lynx.getCoreContext()` to dispatch background changes to the main thread. The main thread listens for the corresponding `PatchFromBackground` event through `backgroundThread`, returned by `lynx.getJSContext()`.

Keep background data private to the background runtime. When it changes, compare it with the last synchronized state and dispatch only changed keys in a `PatchFromBackground` event. The background thread must not call Element PAPI APIs or `__FlushElementTree()`; the main thread receives the patch, owns the actual UI mutation, and flushes the update.

```javascript
const data = {};
let lastSyncedData = { ...data };
let isFirstScreenDataFromMainThread = true;

function getData() {
  return data;
}

function dispatchPatchToMainThread() {
  const patch = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== lastSyncedData[key]) {
      patch[key] = value;
    }
  }
  if (Object.keys(patch).length === 0) return;
  lastSyncedData = { ...data };
  mainThread.dispatchEvent({
    type: "PatchFromBackground",
    data: patch,
  });
}

function setData(patch, shouldSyncToMainThread = true) {
  Object.assign(data, patch);
  if (!shouldSyncToMainThread) {
    lastSyncedData = { ...data };
    return;
  }
  dispatchPatchToMainThread();
}

function updateDataFromMainThread(nextData) {
  const shouldSyncToMainThread = !isFirstScreenDataFromMainThread;
  isFirstScreenDataFromMainThread = false;
  setData(nextData, shouldSyncToMainThread);
}
```

## Handle Background Tasks

Handle task requests by `handlerName`. Unknown task names should return without mutating state. Keep async requests, timers, native calls, data processing, and other heavier business logic here instead of in `main-thread.ts`.

```javascript
function handleBackgroundTask(handlerName, taskData) {
  if (handlerName === "increment") {
    const currentData = getData();
    setData({ count: (currentData.count ?? 0) + 1 });
    return true;
  }

  if (handlerName === "computeSummary") {
    const values = Array.isArray(taskData) ? taskData : [];
    const total = values.reduce((sum, item) => sum + (item.value ?? 0), 0);
    setData({ total });
    return true;
  }

  if (handlerName.startsWith("select:")) {
    setData({ selectedId: handlerName.slice("select:".length) });
    return true;
  }

  return false;
}
```

## Data Guardrails

- Do not store Element PAPI node references in background data.
- Do not echo first-screen data back to main thread unless the app intentionally needs a second update.
- Keep dispatched messages serializable and small; send render data, not functions or node handles.
