---
name: reactlynx-snapshot-debugging
description: |
  Use this Skill to diagnose and fix ReactLynx 3 (RL3) Snapshot runtime errors that surface during first-screen hydrate or subsequent state updates. RL3 compiles JSX into Snapshot definitions and drives the UI through dual-thread hydrate + snapshotPatch, so these errors are usually a downstream symptom of a different crash on the main thread or background thread.

  Trigger Scenarios:
  - The runtime logs "snapshotPatchApply failed: ctx not found, snapshot type: '__Card__:__snapshot_...'".
  - The runtime logs "Error: Snapshot not found: __Card__:__snapshot_..." (or "Snapshot not found").
  - A ReactLynx page renders blank / stops updating after hydrate, or a "not a function" / "cannot read property '0' of undefined" error appears in the hydrate call stack.
  - The user needs to inspect dual-thread communication: the OnLifecycleEvent SnapshotInstance tree (main -> background) or the rLynxChange snapshotPatch (background -> main), or decode a raw snapshotPatch array.
  - The user mentions RL3 snapshot, createSnapshot, snapshotPatchApply, SnapshotInstance, hydrate, rLynxChange, or a bug report about a ReactLynx snapshot error.
---

# ReactLynx 3 Snapshot Error Debugging

Diagnose and fix RL3 Snapshot runtime errors. This is a troubleshooting guide, not a code generator: read the evidence, find the *root* crash, then fix that.

## Background: how RL3 snapshots work

To reduce vnode count and improve performance, RL3 compiles JSX into **Snapshot** definitions. A snapshot definition is created by `createSnapshot(...)` at the very top level of the main-thread bundle (`main-thread.js` / `lepus.js`):

```js
const __snapshot_d9459_61989_1 = (__webpack_require__(".../react/runtime/lib/internal.js").createSnapshot)(
  "__snapshot_d9459_61989_1",
  function () { /* create elements */ },
  [ /* update dynamic parts */ ],
  ...
);
```

The runtime then renders through a **dual-thread** flow:

- **Main thread** builds a `SnapshotInstance` tree from these definitions and owns the real UI (Element PAPI).
- **Background thread** builds a `BackgroundSnapshotInstance` tree from your React render.
- **`OnLifecycleEvent` (`rLynxFirstScreen`) + hydrate**: matches the main-thread tree against the background tree, diffs them, and sends a `snapshotPatch` to the main thread to run `snapshotPatchApply` and reconcile the UI.
- **`rLynxChange`**: every later update (hydrate result and `setState`) is delivered as a `snapshotPatch` over `rLynxChange`, which the main thread applies via `snapshotPatchApply`.

Because the whole UI hangs off this pipeline, a crash *anywhere upstream* (a main-thread definition that never got created, or a background hydrate that threw) shows up later as a confusing snapshot error.

## The first rule: rule out unrelated errors first

**Most snapshot errors are a secondary symptom.** Before analyzing the snapshot error itself, confirm there are **no other Errors** on either thread:

- **Main thread** (`main-thread.js` / `lepus.js`): if it throws before finishing, every `createSnapshot(...)` after the throw never runs, so those snapshot *definitions* are missing. Later patches that reference them fail.
- **Background thread**: if it throws so that `hydrate` doesn't complete, the main thread never gets the correct initial patch, and *every* subsequent `snapshotPatchApply` operates on a wrong/empty tree.

So the correct order is: **find and fix the first non-snapshot Error on each thread, then re-check whether the snapshot error is gone.** Only treat a snapshot error as a framework bug after both threads are otherwise clean.

## Diagnosis workflow

1. Collect the full error log from **both threads**, in order. Note which thread each line came from and the call stack (especially anything inside `hydrate` / `onHydrate` / `onLifecycleEventImpl`).
2. Look for an **earlier, non-snapshot error** (e.g. `not a function`, `cannot read property '0' of undefined`). If present, that is almost certainly the root cause — fix it first. See `references/diagnosis-workflow.md`.
3. To inspect the dual-thread traffic, prefer the **built-in ALog macros** (available since `@lynx-js/react` **0.111.2**): rebuild/run with `REACT_ALOG=true` (add `REACT_ALOG_ELEMENT_API=true`, `@lynx-js/react` >= 0.116.3, for Element PAPI tracing) so the runtime emits `[ReactLynxDebug]` diagnostics on both threads. **With the user's consent, you can dump and analyze these logs yourself** by driving the [`lynx-devtool`](../lynx-devtool/SKILL.md) skill (`get-console --thread main` / `--thread background`, reload to catch first-screen hydrate). The manual instrumentation snippet is only needed on `@lynx-js/react` < 0.111.2 (no built-in ALog). All of this is in `references/debug-instrumentation.md`.
4. Decode any raw `snapshotPatch` array using `references/snapshot-patch-format.md`.
5. Match the specific error to its playbook below.
6. If the case is complex and none of the above resolves it, escalate upstream with a minimal reproduction (see references).

You are not limited to handing the user a script: when a device/emulator is connected, offer to enable ALog, dump both threads via lynx-devtool, and analyze the root cause directly — only after the user agrees, since reloading restarts their session.

## Error catalog

| Error message | Where it throws | Read |
| --- | --- | --- |
| `snapshotPatchApply failed: ctx not found, snapshot type: '...'` | inside `snapshotPatchApply` (InsertBefore / RemoveChild / SetAttribute / SetAttributes) | `references/error-ctx-not-found.md` |
| `Error: Snapshot not found: __Card__:__snapshot_...` | `SnapshotInstance` constructor | `references/error-snapshot-not-found.md` |

Both playbooks share the same first move: **rule out an upstream crash** (the "first rule" above).

## Tooling reference

- `references/debug-instrumentation.md` — how to capture dual-thread logs: the built-in ALog macros (`REACT_ALOG` / `REACT_ALOG_ELEMENT_API`, with version requirements) first, dumping + analyzing them yourself via `lynx-devtool`, and the manual instrumentation snippet ([gist](https://gist.github.com/upupming/9f8c5d006dbfaccc225ca6b2ad32e8b5)) as a fallback only for `@lynx-js/react` < 0.111.2. Plus how to read the output.
- `references/snapshot-patch-format.md` — the `snapshotPatch` opcode table and how to pretty-print a raw patch.
- `references/diagnosis-workflow.md` — the end-to-end rule-out procedure, including the Lynx debugger's "Stop at Entry" (main-thread / MTS) setting to get accurate main-thread line numbers.

## Source of truth

Pinned RL3 runtime source (lynx-family/lynx-stack @ `e9e7c093`):

- `snapshotPatchApply` — [packages/react/runtime/src/lifecycle/patch/snapshotPatchApply.ts#L51](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/lifecycle/patch/snapshotPatchApply.ts#L51)
- `SnapshotInstance` constructor — [packages/react/runtime/src/snapshot.ts#L293](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/snapshot.ts#L293)
- `snapshotPatch` op definitions — [packages/react/runtime/src/lifecycle/patch/snapshotPatch.ts#L22](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/lifecycle/patch/snapshotPatch.ts#L22)
- `prettyFormatSnapshotPatch` — [packages/react/runtime/src/debug/formatPatch.ts#L8](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/debug/formatPatch.ts#L8)
