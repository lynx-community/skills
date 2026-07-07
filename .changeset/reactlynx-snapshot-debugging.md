---
"@lynx-js/skill-reactlynx-snapshot-debugging": minor
---

Add the `reactlynx-snapshot-debugging` skill: a troubleshooting guide for ReactLynx 3 Snapshot runtime errors (`snapshotPatchApply failed: ctx not found` and `Snapshot not found`). It covers the dual-thread hydrate/snapshotPatch model, a rule-out-upstream-crash diagnosis workflow, and snapshotPatch decoding. For capturing the dual-thread traffic it leads with the built-in ALog macros (`REACT_ALOG` / `REACT_ALOG_ELEMENT_API`, with version gating from `@lynx-js/react` 0.111.2) and driving the `lynx-devtool` skill to dump and analyze both threads directly, falling back to manual entry-file instrumentation only on older runtimes. Wired into the `reactlynx` plugin.
