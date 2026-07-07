# Error: `snapshotPatchApply failed: ctx not found`

Full message shape:

```
snapshotPatchApply failed: ctx not found, snapshot type: '__Card__:__snapshot_d9459_61989_1'
```

- **Where it throws**: inside `snapshotPatchApply`, reachable from the `InsertBefore`, `RemoveChild`, `SetAttribute`, and `SetAttributes` branches — [snapshotPatchApply.ts#L51](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/lifecycle/patch/snapshotPatchApply.ts#L51).
- **Root cause**: while applying a patch from the background thread, the runtime cannot find the `SnapshotInstance` for the id the patch references, so there is no `ctx`. This almost always means the main-thread and background-thread `SnapshotInstance` trees are **out of sync** — usually caused by an *earlier* error, occasionally a framework bug.

## Playbook

1. **Rule out an upstream crash first** (`diagnosis-workflow.md`). This error is the tail end of a chain far more often than it is the primary fault.
2. Capture the dual-thread logs (`debug-instrumentation.md`): enable `REACT_ALOG=true`, then dump both threads via `lynx-devtool` and reload to catch first-screen hydrate.
3. Inspect the `SnapshotInstance tree for first screen hydration`. If it only contains `root` (`{"id":-1,"type":"root"}`), the main thread crashed before creating its snapshot definitions — find and fix that main-thread error.
4. Inspect the `rLynxChange` patch and search it for the `type` in the message (e.g. `__snapshot_d9459_61989_1`). If that patch tries to insert *into* that snapshot but never `CreateElement`-d it (because hydrate already emitted — and then aborted on — that create), the main thread has nothing to attach to → `ctx not found`.

## Worked example (the guide's case)

Observed, top to bottom:

1. Main thread (`lepus.js`): `not a function`.
2. Background thread: `cannot read property '0' of undefined`, stack `helper -> hydrate -> onLifecycleEventImpl`.
3. Main thread: `snapshotPatchApply failed: ctx not found, snapshot type: '__Card__:__snapshot_d9459_61989_1'`.

Two obvious red flags: a main-thread `not a function` (very likely to break things downstream), and a **throw inside hydrate** (which stops `snapshotPatchApply` from running correctly for everything after).

Why `ctx not found` specifically: the background hydrate *should* have produced a `CreateElement __snapshot_d9459_61989_1` operation and sent it to the main thread. But hydrate threw partway, so that `CreateElement` was never delivered. The background then sent a follow-up `rLynxChange` patch that assumes `__snapshot_d9459_61989_1` already exists and tries to insert into it — the main thread has no such element, so it throws `ctx not found`. (Confirmed by decoding that follow-up patch: the reported `type` does not appear as a `CreateElement` in it; the patch is built *on top of* a hydrate result that never landed.)

Breakpointing the hydrate throw showed the underlying framework-level trigger: the background `BackgroundSnapshotInstance` had `values` but the main-thread `SnapshotInstance` did not, so hydrate indexed into a missing `values` entry (`before.values[index]` → `after.key` on `undefined`). RL3 did not tolerate that shape — but that mismatch itself came from the main thread rendering an empty tree due to its own crash.

**Root cause & fix**: the main-thread `not a function` came from a native/JSB call on a background-only SDK (e.g. `bridgeLogger.app.sendLog(...)`), because the main thread had that SDK module aliased to an empty stub (the main thread does not support that native capability; that code should not be in the main-thread bundle). It was pulled in by a top-level `analyticsLogger.start()` in a component's render path. Gating it to the background thread fixes the whole chain:

```tsx
if (__BACKGROUND__) {
  analyticsLogger.start();
}
```

Once the main thread renders its `SnapshotInstance` tree correctly, hydrate matches, and `ctx not found` disappears.

## Takeaway

`ctx not found` is a **synchronization** failure, not usually a bug at the throw site. Find the first error (most often a main-thread crash that leaves the tree empty, or a background hydrate throw) and fix that. Only if both threads are clean and the tree/patch analysis still shows an unhandled shape should you treat it as a framework issue and open an upstream issue with a minimal reproduction.
