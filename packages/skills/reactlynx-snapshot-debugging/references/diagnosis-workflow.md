# Diagnosis workflow: rule out the upstream crash first

Snapshot errors are usually a downstream symptom. Follow this procedure before concluding it is a framework bug.

## 1. Read both threads' errors, in order

Collect the raw log and separate the lines by thread:

- **Main thread** = `main-thread.js` / `lepus.js`. In the client this often appears as `ReportErrorWithMsg` / `QuickContext::Execute() exception` / `lepusng exception`.
- **Background thread** = the JS runtime. Errors here carry a normal JS stack.

Order matters. A typical failing sequence looks like:

1. Main thread throws first (e.g. `TypeError: not a function`).
2. Background thread throws during hydrate (e.g. `cannot read property '0' of undefined`, stack goes `helper` -> `hydrate` -> `onLifecycleEventImpl`).
3. Main thread then logs `snapshotPatchApply failed: ctx not found`.

The third error is the noisy one, but the **first** error is the root cause.

## 2. Two upstream failure modes

- **Main-thread throws before finishing.** `createSnapshot(...)` calls run at the top level of the main-thread bundle. If the bundle throws partway, every snapshot definition *after* the throw is never registered. The main-thread `SnapshotInstance` tree ends up empty (only a `root`, `{"id":-1,"type":"root"}`).
- **Background hydrate throws.** If `hydrate` doesn't complete, the initial diff/patch is wrong or missing, and every later `snapshotPatchApply` operates on a broken tree.

In both modes, fixing the first error makes the snapshot error disappear.

## 3. Get accurate main-thread line numbers

The client-reported main-thread stack is often unhelpful (minified, wrong columns). To get the real throw location, use your Lynx debugger's **"Stop at Entry"** setting for the main thread (MTS):

1. Enable "Stop at Entry" (main-thread / MTS) in the debugger.
2. Reload the page. Execution pauses at the main-thread entry.
3. Step/continue until the exception; now the reported row/column points at the real offending call in `lepus.js` / `main-thread.js`.
4. Map that back to source to find the call site.

## 4. Worked example (representative)

Symptom chain: main thread `not a function` -> background `cannot read property '0' of undefined` in `hydrate` -> main thread `snapshotPatchApply failed: ctx not found`.

Root cause found by pausing at the main-thread entry: the main-thread bundle called a native/JSB method on an analytics-logging SDK (something like `bridgeLogger.app.sendLog(...)`), but on the main thread that SDK module was aliased to an **empty stub** (the main thread does not support that native capability, so the code should never have been bundled into it). The call resolved to `undefined` → `not a function`. The failing call originated from a top-level `analyticsLogger.start()` in a component's render path.

Fix: guard the background-only call so it is not bundled/executed on the main thread:

```tsx
// before
analyticsLogger.start();

// after
if (__BACKGROUND__) {
  analyticsLogger.start();
}
```

`__BACKGROUND__` is true only on the background thread, so the main thread no longer pulls in the unsupported native path. Once the main thread renders its `SnapshotInstance` tree correctly, the `ctx not found` error is gone. (`__JS__` is the deprecated alias of `__BACKGROUND__`.)

> General rule: code that depends on background-only capabilities (JSB, logging/analytics SDKs, native modules) must be gated (`__BACKGROUND__`, `'background only'`, etc.) so it is not compiled into the main-thread bundle. See the `reactlynx-best-practices` skill's background-only guidance.

## 5. When you cannot find a root cause

If both threads look clean and the analysis of `OnLifecycleEvent` / `rLynxChange` (see `debug-instrumentation.md`) still does not explain the mismatch, it may be a framework bug or an unhandled edge case. Open an issue on [lynx-family/lynx-stack](https://github.com/lynx-family/lynx-stack/issues) with a minimal reproduction, the full dual-thread log, and the decoded snapshotPatch.
