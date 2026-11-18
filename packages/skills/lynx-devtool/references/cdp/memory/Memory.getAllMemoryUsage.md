# Memory.getAllMemoryUsage

Scope: This is a Lynx global CDP extension. Send it to the global DevTool handler with session ID `-1` unless you have a platform-specific reason to override the session.

- `Memory.getAllMemoryUsage` - Get global Lynx memory usage across live registered Lynx instances.
- Input:
  - `timeoutMs` (integer, optional): Non-negative timeout in milliseconds. `0` or omission lets the platform choose its default wait policy. Maximum accepted value is `300000`; fractional values are rejected.
- Output:
  - `collectionStartMs` (number): Wall-clock collection start time in milliseconds.
  - `collectionStatus` (`"completed"` | `"timeout"`): Whether all expected instance fetchers completed.
  - `collectionDurationMs` (number): Elapsed collection time in milliseconds.
  - `collectionTimeoutMs` (number): Timeout used by the platform query.
  - `expectedInstanceCount` (number): Number of live instance fetchers at request start.
  - `completedInstanceCount` (number): Number of completed instance results.
  - `totalBytes` (number): Global Lynx-attributed bytes, excluding `appBytes` and deduplicating shared background runtime groups.
  - `appBytes` (number): Current app memory footprint sampled by the platform.
  - `ratioToApp` (number): `totalBytes / appBytes`, or `0` when app bytes are unavailable.
  - `elementBytes` (number): Aggregated element tree memory.
  - `elementNodeCount` (number): Aggregated element node count.
  - `viewBytes` (number): Aggregated UI/view memory.
  - `mainThreadRuntimeBytes` (number): Aggregated main-thread runtime bytes.
  - `backgroundThreadRuntimeBytes` (number): Aggregated background runtime bytes with shared groups deduplicated.
  - `instances` (array): Completed instance list, sorted by `totalBytes` descending.
- Description: Queries a global snapshot of Lynx-attributed memory across live registered Lynx instances. This differs from `Runtime.getHeapUsage`, which only reports JavaScript heap usage for one session/thread.

`instances[]` corresponds to registered Lynx instance fetchers, such as live `LynxTemplateRender`/LynxShell instances. It is not a nested child LynxView tree. If a page contains child LynxViews that are not exposed as separate registered instances by the platform collector, their memory is included in the owning instance aggregates rather than reported as separate `instances[]` entries.

Each `instances[]` item contains:

- `instanceId` (number): LynxShell instance id. `-1` means the instance was not fully attached.
- `pageId` (string): Page identity when available.
- `url` (string): Current template URL.
- `totalBytes` (number): Instance-attributed total bytes.
- `elementBytes` (number): Element tree memory.
- `elementNodeCount` (number): Element node count.
- `viewBytes` (number): UI/view bytes.
- `viewDetail` (object): UI view memory records keyed by view category/tag or view key. This is a category aggregation, not a per-child-LynxView breakdown.
- `mainThreadRuntimeBytes` (number): Main-thread runtime bytes.
- `backgroundThreadRuntimeBytes` (number): Background-thread runtime bytes.
- `btsRuntimeGroupId` (string): Background runtime group id used for global deduplication.

## Usage

```bash
agent-lynx cdp -s -1 -m Memory.getAllMemoryUsage
agent-lynx cdp -s -1 -m Memory.getAllMemoryUsage '{"timeoutMs":50000}'
```

The CLI prints the raw `Memory.getAllMemoryUsage` response (do not expect derived `summary`, `topMemoryItems`, or `topInstances` wrapper fields).

When the DevTool MCP server is available, prefer the `Memory_getAllMemoryUsage` MCP tool for the same raw payload.

### Agent Reporting Standard

When summarizing `Memory.getAllMemoryUsage` for a user:

1. Save the complete raw JSON to a file when requested or when the payload is too large to show inline.
2. Format sizes in binary units (`KiB`, `MiB`, `GiB`) and ratios (`ratioToApp`, contribution shares) as percentages, each with two decimal places.
3. Report this global summary first: `collectionStatus`, `${completedInstanceCount}/${expectedInstanceCount}` Lynx instances, `totalBytes`, `appBytes`, `ratioToApp`, `elementNodeCount`, `viewBytes`, `mainThreadRuntimeBytes`, and `backgroundThreadRuntimeBytes`.
4. Report **Top 5 Memory Contributors** sorted by bytes descending across all `instances[i]`, considering `backgroundThreadRuntimeBytes`, `mainThreadRuntimeBytes`, `elementBytes`, each `viewDetail[category].sizeBytes`, and an `other view memory` remainder when `viewBytes` exceeds the sum of `viewDetail[*].sizeBytes`. Include rank, category/kind, size, `% of totalBytes`, `% of instance.totalBytes`, `instanceId`, and `url`.
5. Report **Instances** sorted by `instance.totalBytes` descending with `instanceId`, `url`, `totalBytes`, `mainThreadRuntimeBytes`, `backgroundThreadRuntimeBytes`, `viewBytes`, `elementBytes`, and a compact `viewDetail` summary (e.g. `image=12 / 4.15 MiB`). Do not invent missing fields.
