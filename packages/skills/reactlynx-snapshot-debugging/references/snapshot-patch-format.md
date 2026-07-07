# Decoding a snapshotPatch

A `snapshotPatch` is a **flat array** where each operation is an opcode followed by its positional arguments. It is compact but unreadable by hand, e.g.:

```ts
[
  0, "__Card__:__snapshot_fffe1_test_3", 2,
  0, "__Card__:__snapshot_fffe1_test_4", 7,
  1, 2, 7, null,
  1, -1, 2, null,
]
```

## Opcode table

Source of truth: [snapshotPatch.ts](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/lifecycle/patch/snapshotPatch.ts#L22).

| Opcode | Operation | Params (in order) |
| --- | --- | --- |
| `0` | `CreateElement` | `type` (string), `id` (number) |
| `1` | `InsertBefore` | `parentId`, `childId`, `beforeId` (number \| undefined) |
| `2` | `RemoveChild` | `parentId`, `childId` |
| `3` | `SetAttribute` | `id`, `dynamicPartIndex`, `value` (any) |
| `4` | `SetAttributes` | `id`, `values` (any) |
| `100` | `DEV_ONLY_AddSnapshot` | `uniqID`, `create`, `update`, `slot`, `cssId?`, `entryName?` |
| `101` | `DEV_ONLY_RegisterWorklet` | `hash`, `fnStr` |

To decode: read one opcode, consume exactly its parameter count, repeat. Example — `0, "__Card__:__snapshot_fffe1_test_3", 2` means `CreateElement(type="__Card__:__snapshot_fffe1_test_3", id=2)`.

## Pretty-printer

The `debug-instrumentation.md` snippet already pretty-prints `rLynxChange` patches. Standalone, the same helper (mirrors [`prettyFormatSnapshotPatch`](https://github.com/lynx-family/lynx-stack/blob/e9e7c093db36fbae51dc964afc1de4600a8b44a1/packages/react/runtime/src/debug/formatPatch.ts#L8)) turns the array above into:

```json
[
  { "op": "CreateElement", "type": "__Card__:__snapshot_fffe1_test_3", "id": 2 },
  { "op": "CreateElement", "type": "__Card__:__snapshot_fffe1_test_4", "id": 7 },
  { "op": "InsertBefore", "parentId": 2, "childId": 7, "beforeId": null },
  { "op": "InsertBefore", "parentId": -1, "childId": 2, "beforeId": null }
]
```

`parentId: -1` is the `root`. So this patch creates two elements and mounts element `2` under root and element `7` under element `2`.

## Using it to explain an error

When you see `snapshotPatchApply failed: ctx not found, snapshot type: 'X'`, decode the failing patch and look for the `id` the failing op references (`InsertBefore.parentId`, `RemoveChild.parentId`, `SetAttribute.id`, ...). If there is **no earlier `CreateElement` for that id** in the applied history, the element the patch expects is missing — which is exactly what happens when hydrate aborted before emitting that `CreateElement`. See `error-ctx-not-found.md`.
