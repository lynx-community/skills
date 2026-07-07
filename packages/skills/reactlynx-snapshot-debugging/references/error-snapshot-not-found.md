# Error: `Snapshot not found: __Card__:__snapshot_...`

Full message shape:

```
Error: Snapshot not found: __Card__:__snapshot_d6204_98358_1
```

- **Where it throws**: the `SnapshotInstance` constructor — [snapshot.ts#L293](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/snapshot.ts#L293).
- **Root cause**: the runtime is asked to create a `SnapshotInstance` of type `__snapshot_d6204_98358_1`, but there is **no registered Snapshot definition** for that type. Distinct from `ctx not found`: there the instance is missing; here the *definition* itself is missing.

## Investigation directions

1. **Is there another main-thread error?** A main-thread crash that terminates the bundle early prevents later `createSnapshot(...)` calls from running, so their definitions are absent. Fix that first (`diagnosis-workflow.md`).
2. **Does `__snapshot_d6204_98358_1` exist in the main-thread output?** Grep the built `lepus.js` / `main-thread.js` for the exact type string.
   - **Absent** → this is a **compile/bundling problem**. It frequently reproduces **only in production** (dev and prod differ in how snapshots are emitted). Check your build config, minifier/tree-shaking, and any code that strips or renames snapshot definitions.
   - **Present** → the definition exists but was not registered at runtime when needed; move to step 3.
3. **Analyze `OnLifecycleEvent` and `rLynxChange`** by capturing dual-thread logs (`debug-instrumentation.md`: `REACT_ALOG=true` + `lynx-devtool` dump). Trace which step asks for the missing type and what the tree looked like just before, to find where the definition should have been registered but was not.
4. **Complex / unresolved** → open an issue on [lynx-family/lynx-stack](https://github.com/lynx-family/lynx-stack/issues) with a minimal reproduction, the dual-thread log, and the decoded patch.

## Contrast with `ctx not found`

| | `Snapshot not found` | `ctx not found` |
| --- | --- | --- |
| Throws in | `SnapshotInstance` constructor | `snapshotPatchApply` |
| Missing thing | the Snapshot **definition** (type not registered) | the Snapshot **instance** (id has no ctx) |
| Typical cause | main-thread early crash, or compile/bundling (prod-only) | trees out of sync after an upstream crash/hydrate throw |

Both start the same way: **rule out other errors, confirm the type/id exists in the main-thread output, then analyze the dual-thread traffic.**
