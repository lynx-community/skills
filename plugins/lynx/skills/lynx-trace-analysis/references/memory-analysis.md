---
name: memory-analysis
description: Analyzes Lynx Perfetto memory usage and leaks. Invoke for high memory, page lifecycle leaks, shared BTS context growth, scrolling trends, or JS heap snapshots.
---

# Lynx Memory Analysis Guide

Use this guide whenever the user asks about Lynx memory usage, memory growth, memory leaks, shared context
retention, scrolling memory trends, or JavaScript heap snapshots in a Perfetto trace.

## Non-Negotiable Rules

1. Use `memory-analysis` for all calculations. Do not reconstruct page lifecycles, VM generations, memory
   deltas, or leak thresholds manually from raw SQL unless the command fails.
2. Treat the generated HTML report as the complete evidence source. Give the user a concise conclusion in
   chat and direct them to the report for all page-level data and interactive charts.
3. Never claim a leak from RSS growth alone. Shared BTS leak detection uses the post-GC **Accumulate**
   delta; RSS is supporting evidence.
4. Do not describe a low-confidence result as a confirmed leak.
5. Heap snapshot content can be large. Use `memory-snapshot` to write it to a local file and pass the file
   path to `js-memory-analyzer`; never place snapshot content in the conversation.

## Core Knowledge

Each Lynx page has a unique `instance_id` and a page-private main-thread script VM (MTS). A page may also
have a background-thread script VM (BTS); pages without one are called no-Runtime pages. BTS can be
page-private or shared by several pages through a shared context.

QuickJS memory has two useful measurements:

- **Accumulate**: JavaScript object/string allocation totals. This is the primary signal for retained JS
  objects and shared BTS leak detection.
- **RSS**: resident physical memory used by the engine, including engine base memory and resident GC pages.
  It can remain high after objects are reclaimed and must not be treated as direct leak proof.

Only `quickjs(gc)` and `quickjs(rc)` currently report the required VM memory data. Other engines can still
be included in process-level analysis, but VM conclusions are incomplete.

The query implementation uses these trace sources:

- `TRACE_BEGIN`: memory tracing and forced-GC configuration.
- `memory_{instance_id}` counters: page state, MTS memory, BTS association metadata, and Lynx UI View counts.
- `bts_vm_acc_{id}` counters: authoritative BTS Accumulate and RSS data, recorded on the BTS thread. The
  counter value is Accumulate; `base_usage + page_rss_usage` is RSS.
- `summary.total-pss`: process physical memory.
- `LynxShell::Create` start / `LynxShell::~LynxShell` end: the LynxShell lifecycle used for page, PSS,
  component, classification, and rollback analysis.
- `page_uses_bts_vm` / `BTSRuntime::Destroy` end: the BTS-thread lifecycle used for shared-BTS loaded-page,
  leak-cycle, snapshot-pair, and BTS chart analysis.
- `page_uses_mts_vm`, `page_uses_bts_vm`, `destroy_vm_instance`: page/VM relationships and shared BTS
  generations.
- `mts_vm_pool_state`, `bts_vm_pool_state`: VM pool memory.
- `RunGC`: a non-INSTANT global forced-collection interval. Treat GC and its trace updates as complete
  **10 ms after `ts + dur`**. Draw its chart bubble at the event start.
- `will_capture_snapshot`, `capture_snapshot`, `snapshot_chunk`: JS heap snapshots.

Do not fall back to legacy BTS memory or lifecycle rules. A supported BTS VM must map to exactly one
`bts_vm_acc_{id}` track using its pointer and generation lifetime. If zero or multiple tracks remain after
requiring the track's first sample to fall inside that generation, disable memory analysis for that VM and
emit a warning.

## First Action

Classify the request, then perform exactly one first action:

| Request | First action |
|---|---|
| Broad memory analysis, high memory, leak check, page load/exit memory | Run `memory-analysis` with the trace path |
| Specific page URL | Run `memory-analysis --url "<substring>"` |
| Specific `instance_id` | Run `memory-analysis --instance-id <id>` |
| Scrolling/sliding trend | Ensure page URL or `instance_id` and an absolute trace time range are known, then run `memory-analysis --scenario scroll --start <ms> --end <ms>` |
| Specific VM snapshot numbers | Run `memory-analysis` first to obtain the VM's 1-based snapshot list |

Do not ask follow-up questions for a broad memory request. The default analysis covers every page created
after trace recording starts.

## Main Analysis Command

```bash
node <path_to_the_skill>/scripts/trace_query.bundle.cjs memory-analysis \
  --path "<trace_path_or_url>" \
  --output "<report_path>.html"
```

Optional selectors:

```bash
--url "<URL substring>"
--instance-id <id>
--scenario scroll --start <absolute_trace_timestamp_ms> --end <absolute_trace_timestamp_ms>
```

The command prints compact JSON containing:

- `valid` and `error`
- `reportPath`
- `summary`
- `warnings`
- `issues`
- the 1-based snapshot list
- `analysableLeakEvents` with usable before/after snapshot IDs

It also writes a self-contained interactive HTML report. The report defaults to Chinese and includes a
Chinese/English language switch. Users can click any series label below a chart to hide or restore that
series.

### Report Content Filter

Build one checked checkbox for every unique shared-context BTS VM name in the trace. The name does not
include its generation. Changing a checkbox immediately filters:

- page-instance analysis, retaining only pages that use a selected shared BTS VM name
- shared BTS VM charts, VM-level analysis results, and shared BTS leak-cycle rows for selected VM names
- conclusion issues produced by pages or VM generations associated with a selected VM name

All checkboxes are selected by default. Update the visible analysis-target and issue counts when the filter
changes, and show an explicit empty state when no page, shared-BTS analysis, or leak cycle matches.

## Stop and Clarification Conditions

### Invalid Trace

If `valid` is false because `enable_memory_trace` is missing or disabled:

1. Tell the user the trace does not contain usable Lynx memory data.
2. Recommend upgrading Lynx and recording again with memory tracing enabled.
3. Stop the analysis.

### URL Does Not Match

If the command reports that no page matches the URL substring:

1. List the unique non-empty URLs from the report/query result.
2. Ask the user to choose one.
3. Do not guess the target page.

### Scrolling Request Is Incomplete

Scrolling/sliding analysis requires:

- one page URL substring or `instance_id`
- start and end timestamps in milliseconds on the trace timeline

Ask only for missing values. If the requested range does not overlap the page lifetime, report the mismatch
and stop that scenario analysis.

### Unsupported VM

If all BTS VMs are unsupported, explain that VM-level memory analysis is incomplete and recommend recording
again with `quickjs(gc)` or `quickjs(rc)`. Process PSS evidence may still be shown, but do not claim a JS VM
leak.

## How to Interpret Results

### Confidence

- **High**: page creation is sufficiently isolated, or a repeated-load pattern is confirmed across runs.
- **Medium**: the signal is meaningful but can include runtime noise, such as a single shared BTS
  post-GC Accumulate increase.
- **Low**: forced GC is disabled, page lifetimes overlap, or unrelated memory changes affect the window.

### Implemented Issue Rules

- Page loading PSS peak increase greater than **150 MiB**: high-memory page and OOM risk.
- MTS VM Pool RSS increase greater than **3 MiB** during a page lifetime: excessive cached MTS VMs.
- Shared BTS post-GC Accumulate increase at least **32 KiB**: possible shared BTS leak, medium confidence.
- Repeated URL where the first Accumulate delta is at least 10 times every later run: first-load shared BTS
  leak, high confidence.
- Repeated URL where every run crosses the leak threshold: continuous shared BTS leak, high confidence.

Physical memory remaining at least 2 MiB above the pre-page baseline is displayed in the report. When forced
GC is disabled it is low-confidence evidence and must not be promoted to a confirmed issue.

For page rollback and shared BTS post-GC checks, use `t_delta_gc = 0.01s` after the end of `RunGC`.

### Shared BTS Leak Cycle

For every supported shared BTS VM generation and every global `RunGC` interval:

1. Set the decision timestamp to `RunGC.ts + RunGC.dur + 10 ms`.
2. Use `querySharedBtsLoadedPages` with the BTS-thread lifecycle to obtain the surviving page set.
3. Scan earlier `page_uses_bts_vm` events backwards. For each candidate event, compare the decision set with
   the loaded-page set immediately before that event, so the page whose BTS creation timestamp equals the
   candidate timestamp is not counted. The first matching event is the cycle baseline.
4. The pages created and destroyed inside the cycle are determined only by `page_uses_bts_vm` and the end
   of `BTSRuntime::Destroy`.
5. Query both baseline and decision memory from the VM's matched `bts_vm_acc_{id}` track. Accumulate delta
   drives the leak rule; RSS delta remains supporting evidence.

When page rollback is available, the memory-delta chart must end at the exact PSS sample that produced the
minimum post-exit value. Its final PSS delta must therefore equal the rollback delta shown in the report.
The report must show the timestamps and PSS values of both the `t_start` baseline sample and the `m_low`
sample so users can locate the two source points in the original trace.

### Page Component Counts

Every page instance includes a component-count chart covering its full lifetime. Each Lynx UI View category
is a separate count series. The chart uses the same zero baseline, hover details, language switching, and
click-to-hide series controls as the memory-delta chart. Use it to identify UI categories that keep growing
or fail to return to zero, but do not claim a leak from component counts alone.

### Scrolling Trend

The query aligns samples to the PSS timeline, smooths short spikes with a rolling median, computes a robust
Theil-Sen slope, and compares the first and last stable windows against a noise threshold. A series is
reported as rising only when its baseline visibly and persistently moves upward.

Review both charts:

1. MTS RSS/Accumulate from `memory_{instance_id}`, BTS RSS/Accumulate from the matched `bts_vm_acc_{id}`
   track, plus process PSS.
2. Per-category Lynx UI View counts.

Correlate an engine-memory trend with UI object counts before suggesting a retained-view cause.

### Shared BTS VM Heap Curve

Analyze every supported BTS VM generation that uses a shared context, even when only one page in the trace
uses that generation. The report includes an expandable section titled **"共享的 BTS 虚拟机堆大小曲线"** for
each VM. Clicking the title expands or collapses both the chart and its analysis results.

The chart covers the VM's first appearance through `destroy_vm_instance`, or through trace end when the VM
is still alive. Query both memory modes from the matched `bts_vm_acc_{id}` track:

- Render **Accumulate** like a Perfetto counter track. Every discrete value occupies a filled interval from
  its timestamp to the next sample, extending from the zero axis to the sample value.
- Render **RSS** as a thin line over the same time range.

Overlay colored event bubbles below the time axis for:

- every `RunGC`
- this VM generation's `destroy_vm_instance`
- `page_uses_bts_vm` and `BTSRuntime::Destroy` for every page using this VM
- every assigned heap snapshot, positioned at `will_capture_snapshot`
- every rule-defined shared BTS possible-leak issue for this VM generation, positioned at the post-GC
  decision timestamp

Hovering a page create/destroy bubble must show its `instance_id` and complete URL in an expanded event
tooltip. Hovering a memory interval must also list the `instance_id` values returned by
`querySharedBtsLoadedPages` for the interval timestamp, using the BTS-thread lifecycle. Issue markers must
use a more prominent icon than normal event bubbles, and their tooltip must
show the issue title, confidence, page `instance_id` list, Accumulate delta, and RSS delta. Event types use
distinct colors. Use this chart to correlate retained Accumulate memory with page lifecycles and GC
boundaries; the curve is supporting evidence and does not replace the post-GC leak rules or heap snapshot
analysis.

Display these VM-level analysis results inside the same expandable section:

1. **VM destruction state**: if the first `bts_vm_acc_{id}` sample is more than 100 ms after trace start,
   treat the VM as created during the trace. If that VM has no `destroy_vm_instance` before trace end, emit a
   high-confidence `BTS VM not destroyed` issue and report its RSS at trace end.
2. **Post-GC Accumulate trend**: for every `RunGC`, use `RunGC.ts + RunGC.dur + 10 ms`. Keep decision points
   inside the VM lifetime and query Accumulate from the matched BTS track. Sort the values by time and apply
   the robust rising-trend assessment. At least **3** post-GC samples are required. For 3-9 sparse samples,
   use the original GC memory levels without moving-median smoothing; denser series continue to use the
   normal smoothing logic. If the stable baseline rises persistently, the robust slope is positive, and the
   endpoint delta exceeds the noise threshold, emit a medium-confidence
   `BTS VM Accumulate memory is rising` issue. Always show the sample count, stable-level delta, slope, and
   assessment reason in the report, including when no issue is emitted.

## Heap Snapshot Workflow

### Leak-Driven Snapshot Analysis

For each `analysableLeakEvent`, the query has already selected:

- the latest valid snapshot before the leak cycle's GC completion
- the earliest valid snapshot after GC completion and before another related page creation

Ask the user whether to continue with Snapshot analysis. If approved:

1. Check whether `js-memory-analyzer` is available.
2. Extract each unique snapshot ID once:

   ```bash
   node <path_to_the_skill>/scripts/trace_query.bundle.cjs memory-snapshot \
     --path "<trace_path_or_url>" \
     --snapshot-id "<snapshot_id>" \
     --output "<temporary_directory>/<safe_name>.heapsnapshot"
   ```

3. Call `js-memory-analyzer` with:

   ```text
   使用js-memory-analyzer分析以下堆快照文件：
   {snapshot_list_file_paths}

   判断是否泄漏和任何可疑的问题，并给出 retainer 和修复建议。
   ```

If `js-memory-analyzer` is unavailable, tell the user it must be installed and stop only the Snapshot
analysis step.

### User-Selected Snapshots

Snapshots are numbered from 1 independently for each VM, ordered by `will_capture_snapshot`. Resolve the
requested numbers through the `memory-analysis` output, extract those exact snapshot IDs, and pass the files
to `js-memory-analyzer`.

## Final Response

Keep the chat response short:

1. State whether any rule-defined issue was found.
2. List the most important issues, prioritizing the user-selected URL or `instance_id`.
3. Include confidence and the key measured delta for every issue.
4. Provide the absolute `reportPath` and tell the user it contains all page data and interactive charts.
5. If analysable snapshot pairs exist, ask whether to continue with Snapshot analysis.

If no issue is found, say: "No high- or medium-confidence memory issue was detected by the current rules."
Do not say that absence of evidence proves absence of all leaks.
