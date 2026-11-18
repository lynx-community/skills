# Trace Analysis Output Examples

This file contains example outputs for each analysis scenario. Use these as reference templates when generating analysis reports.

---

## Example 1: Metrics Analysis - Slow First Frame (White Screen)

**User Query:** "Why is there a white screen for 3 seconds on first load?"

### Executive Summary

First frame rendering took 3120ms. The primary bottleneck is `loadBackground` (1850ms, 59%) caused by a **CodeCache miss** - the background thread script was re-parsed and compiled instead of loading from cache. Without CodeCache, the BTS evaluation dominates the pipeline and delays the first interactive update.

### Metric Breakdown Table

| Stage/Gap | Duration (ms) | Ratio | Analysis |
| :--- | :--- | :--- | :--- |
| `loadBundle(100)` | 3120 | 100% | |
| `parse(101)` | 120 | 3.8% | Bundle decode |
| `mtsrender(102)` | 280 | 9.0% | |
| `resolve(103)` | 95 | 3.0% | |
| `layout(104)` | 180 | 5.8% | |
| `paintingUiOperationExecute(105)` | 45 | 1.4% | |
| `paint(106)` | 30 | 1.0% | **FCP @ 750ms** |
| **[GAP] paint -> loadBackground** | 520 | 16.7% | Thread scheduling delay |
| **`loadBackground(107)`** | **1850** | **59.3%** | **CodeCache Miss - full parse+compile** |

### Render Pipeline Overview

The first frame completed FCP at 750ms after `paint(106)`, which is acceptable. However, the `loadBackground(107)` stage took 1850ms - nearly 60% of the total pipeline. Trace events within the loadBackground window show `JsCacheManager::TryGetCache` returned no result, followed by `evaluateJavaScript` (not `evaluateJavaScriptBytecode`), confirming a **complete CodeCache miss**. The background thread had to parse and compile the entire BTS from source. The 520ms gap between `paint` and `loadBackground` start is a thread scheduling delay where the JS thread was busy with other work.

### Prioritized Suggestions

| Priority | Suggestion | Impact |
| :--- | :--- | :--- |
| **High** | Enable and verify **CodeCache** is working. Check `lynxsdk_code_cache` hit-rate metrics. Re-record trace with DevTools disabled to confirm cache hits in production. | Reduce loadBackground from 1850ms to ~200ms |
| **Medium** | If CodeCache is already enabled, investigate why it misses: check bundle hash changes, disk space, or cache eviction policy. | Prevent recurring misses |
| **Low** | Reduce BTS bundle size by deferring non-critical logic outside the loadBackground window. | Further reduce parse time even on cache miss |

---

## Example 2: Metrics Analysis - Slow Update (Trigger Latency)

**User Query:** "The page takes 2 seconds to update after user clicks a button."

### Executive Summary

Update rendering took 2150ms. The main bottleneck is **trigger latency** (1600ms, 74%) — the Actual FMP update is triggered by the `x.storage.getStorage(5000)` callback returning data. The NativeModule call took 1480ms, and only after the data returned did the frontend call `setState` to trigger `diffVdom(200)`. The actual rendering work was fast (550ms total).

### Metric Breakdown Table

| Stage/Gap | Duration (ms) | Ratio | Analysis |
| :--- | :--- | :--- | :--- |
| `loadBackground(50)` end -> update pipeline start | **1600** | **74.4%** | **Trigger Latency — waiting for NativeModule to return data** |
| ↳ `NativeModule::Invoke(5000)` | 1480 | 68.8% | `x.storage.getStorage` — slow I/O, blocks JS thread |
| ↳ JS handler → `setState` | 120 | 5.6% | Process returned data, trigger update |
| `diffVdom(200)` | 280 | 13.0% | |
| `packChanges(201)` | 15 | 0.7% | |
| `parseChanges(202)` | 40 | 1.9% | |
| `patchChanges(203)` | 35 | 1.6% | |
| `resolve(204)` | 80 | 3.7% | |
| `layout(205)` | 120 | 5.6% | |
| `paint(207)` | 25 | 1.2% | **FMP for update** |

### Render Pipeline Overview

The Actual FMP timing flag is triggered by an update whose precursor is the `x.storage.getStorage(5000)` callback. This NativeModule call took 1480ms on the platform side (T_platform=1400ms, T_wait=50ms, T_js=30ms). The native storage read was synchronous and blocked the JS thread. Only after the callback returned with the data did the frontend code call `setState`, which triggered `diffVdom(200)`. The diff completed in 280ms, and the actual rendering pipeline (parseChanges → paint) took only 280ms, confirming the rendering itself is not the problem — the delay is entirely in waiting for the NativeModule to return data before the Actual FMP update could be triggered.

### Prioritized Suggestions

| Priority | Suggestion | Impact |
| :--- | :--- | :--- |
| **High** | Pre-fetch storage data during page load or idle time, so it is ready before the user clicks. | Eliminate 1480ms from the critical path |
| **High** | If pre-fetch is not possible, show a loading state immediately on click and use async storage API to avoid blocking the JS thread. | Improve perceived responsiveness |
| **Medium** | Cache frequently accessed storage values in JS memory to avoid repeated native calls. | Reduce call frequency |

---

## Example 3: Jank Analysis - Scroll Stuttering

**User Query:** "Scrolling is janky on this page, especially in the feed list."

### Smoothness Summary

Scroll jank is caused by **Main Thread rendering blocking** during scroll events. The `ScrollByInternal(3000)` event triggered a `Layout(3001)` that took 45.2ms - nearly 3 frames at 60fps. The root cause is **text measurement** in a large list with complex text nodes. Additionally, the JS thread shows a 32ms `diffVdom(3010)` during scroll, indicating unnecessary re-renders triggered by scroll position changes.

### Long Task Analysis Table

| Thread | Event Name | Duration (ms) | Root Cause |
| :--- | :--- | :--- | :--- |
| **Main** | `Layout(3001)` | **45.2** | **Text Measurement - 1200+ text nodes** |
| Main | `ScrollByInternal(3000)` | 18.5 | Scroll event handler |
| Main | `paintingUiOperationExecute(3002)` | 22.0 | 850 UI operations (list item updates) |
| **Lynx_JS** | `diffVdom(3010)` | **32.0** | **Large List Diff - Component: FeedItem** |
| Lynx_JS | `NativeModule::Invoke(3011)` | 15.0 | `x.analytics.logScroll` - acceptable |

### Deep Dive & Recommendations

**Investigating Layout(3001):**
- *Sub-event Evidence*: `Layout::Measure` called 1,247 times. 89% of measurements are for `<text>` nodes inside `FeedItem` components.
- *Conclusion*: Each scroll triggers a full layout pass that re-measures all visible text nodes. Text measurement is inherently expensive.
- *Action*: Set fixed heights for list items where possible. Use `line-height` to avoid dynamic text measurement.

**Investigating diffVdom(3010):**
- *Sub-event Evidence*: Found `ReactLynx::diff::FeedItem` taking 25ms, called 12 times per scroll frame.
- *Conclusion*: `FeedItem` components are re-rendering on every scroll position change, likely due to an `onScroll` handler calling `setState` with scroll position.
- *Action*: Wrap `FeedItem` in `React.memo`. Remove scroll-position-dependent state updates, or throttle them to 100ms intervals.

### Prioritized Suggestions

| Priority | Suggestion | Impact |
| :--- | :--- | :--- |
| **High** | Remove or throttle `setState` in scroll handler. `FeedItem` should not re-render on every scroll tick. | Eliminate 32ms JS thread blocking |
| **High** | Set fixed heights on list items to skip text measurement during scroll. | Reduce Layout from 45ms to ~10ms |
| **Medium** | Enable Rspeedy Performance Profile (`performance: { profile: true }`) to get precise component-level diff data. | Better diagnosis for future issues |
| **Low** | Consider virtualizing the list if not already done - only render visible items. | Reduce total node count |

---

## Example 4: Diff Analysis - Regression Between Versions

**User Query:** "Compare v2.3.1 (baseline) with v2.4.0 (experiment). Did performance regress?"

### Executive Summary

Overall FCP degrades by +180ms (+24%), primarily driven by a +120ms regression in `loadBackground` due to **BTS bundle size expansion** (420KB -> 680KB) and a +60ms regression in `diffVdom` caused by `FeedCard` over-rendering. The `loadBackground` regression is the dominant factor.

### Metric Comparison

| Metric | Baseline (ms) | Experiment (ms) | Diff (ms) | Diff (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `loadBundle` | 750 | 820 | +70 | +9.3% | REGRESSED |
| `parse` | 80 | 130 | +50 | +62.5% | REGRESSED |
| `loadBackground` | 320 | 440 | +120 | +37.5% | REGRESSED |
| `diffVdom` | 150 | 210 | +60 | +40.0% | REGRESSED |
| `layout` | 180 | 175 | -5 | -2.8% | OK |
| `paint` | 30 | 32 | +2 | +6.7% | OK |

### Root Cause Analysis

**`loadBackground`: +120ms**
- **Evidence**: BTS bundle size increased from 420KB to 680KB (+62%). CodeCache hit rate dropped from 95% to 78%.
- **Context**: v2.4.0 added new `FeedCard` recommendation module with heavy BTS dependencies.
- **Conclusion**: Bundle expansion increased parse+compile time. CodeCache misses amplify the impact.

**`diffVdom`: +60ms**
- **Evidence**: `Component::Diff` count increased from 50 -> 120 per update. `ReactLynx::diff::FeedCard` appears 8x in experiment vs 2x in baseline.
- **Context**: `FeedCard` component lacks memoization and re-renders on every parent state change.
- **Conclusion**: Over-rendering increased DOM Diff complexity.

### Prioritized Suggestions

| Priority | Suggestion | Impact |
| :--- | :--- | :--- |
| **High** | Add `React.memo` to `FeedCard` component to prevent unnecessary re-renders. | Recover 60ms in diffVdom |
| **High** | Investigate CodeCache miss rate drop. Verify bundle hash stability between v2.3.1 and v2.4.0. | Recover up to 120ms in loadBackground |
| **Medium** | Code-split the new recommendation module BTS. Load lazily only when visible. | Reduce initial BTS size |

---

## Example 5: NativeModule Analysis - Slow Bridge Call

**User Query:** "This API call takes 200ms, is the bridge slow?"

### Call Type

Standard NativeModule call (callback fires on main thread).

### Phase Duration Analysis

| Phase | Duration (ms) | Ratio (%) | Core Attribution |
| :--- | :--- | :--- | :--- |
| Parameter Conversion | 2.0 | 1.0% | `JSValueToPubValue(6000)` - small payload |
| **Platform Execution** | **165.0** | **82.5%** | **`CallPlatformImplementation(6001)` - network request** |
| Waiting / Scheduling | 8.0 | 4.0% | Thread switch delay |
| Result Conversion | 15.0 | 7.5% | `PubValueToJSValue(6002)` - large response |
| Callback Execution | 10.0 | 5.0% | `InvokeCallback(6003)` |
| **Total** | **200.0** | **100%** | |

### Primary Bottleneck

The primary bottleneck is **Platform Execution**, taking **165ms (82.5%)**. Trace event arguments show this is a `NetworkModule.callback` call (`x.request`), indicating a **network request** to the backend API. The 165ms includes network round-trip time.

### Actionable Optimization Suggestions

| Priority | Suggestion | Impact |
| :--- | :--- | :--- |
| **High** | The network request is the dominant cost. Check if this API supports caching or if data can be pre-fetched during page load. | Eliminate 165ms from critical path |
| **Medium** | Result Conversion takes 15ms (7.5%) - the response payload is large. Ask backend to prune unused fields from the response. | Reduce serialization overhead |
| **Low** | If this call is not on the critical path, make it fire-and-forget (no callback) to avoid blocking the JS thread. | Free JS thread for other work |

---

## Example 6: Broad Exploratory Analysis

**User Query:** "Analyze this trace, find all performance problems."

### Executive Summary

This trace reveals **two independent bottlenecks**: (1) First frame `loadBackground` takes 1200ms due to CodeCache miss, causing delayed initial render. (2) During scrolling, the Main Thread is blocked by `Layout` events averaging 35ms due to excessive text measurement in list items. Both issues are independently fixable.

### Loading Performance

| Stage/Gap | Duration (ms) | Ratio | Analysis |
| :--- | :--- | :--- | :--- |
| `loadBundle(100)` | 1850 | 100% | |
| `parse(101)` | 95 | 5.1% | Normal |
| `mtsrender(102)` | 220 | 11.9% | |
| `layout(104)` | 150 | 8.1% | |
| `paint(106)` | 25 | 1.4% | **FCP @ 520ms** |
| **`loadBackground(107)`** | **1200** | **64.9%** | **CodeCache Miss** |

### Smoothness Performance

| Thread | Event Name | Duration (ms) | Root Cause |
| :--- | :--- | :--- | :--- |
| **Main** | `Layout(4001)` | **38.5** | **Text Measurement - 800+ text nodes** |
| Main | `Layout(4005)` | **35.2** | **Text Measurement** |
| Main | `Layout(4009)` | **42.1** | **Text Measurement** |
| Lynx_JS | `diffVdom(4010)` | 28.0 | Below 30ms threshold - acceptable |

### Prioritized Suggestions

| Priority | Suggestion | Category |
| :--- | :--- | :--- |
| **High** | Enable CodeCache for BTS. Verify hit rate > 50% in production. | Loading |
| **Medium** | Reduce BTS bundle size by deferring non-critical logic. | Loading |
| **Low** | Enable Rspeedy Performance Profile for finer-grained diff analysis. | Diagnostics |

---

## Example 7: Timing Flag Diagnosis

**User Query:** "My PerformanceObserver callback never fires after upgrading to Lynx 3.7."

### Executive Summary

The callback is not firing because the code is listening to **deprecated `metric.actualFmp` entries** which were removed in Lynx 3.7. The trace confirms `PipelineEntry` events are being emitted correctly, but the observer filter never matches them.

### Diagnosis

| Check | Result | Verdict |
| :--- | :--- | :--- |
| Observer target | `entryType === "metric" && name === "actualFmp"` | **Deprecated in Lynx 3.7** |
| Pipeline events in trace | `entryType === "pipeline"` entries present | Events are being emitted |
| `LoadBundleEntry` in trace | Present with valid `fcp` and `lynxFcp` values | FCP data available |
| `PipelineEntry` with matching identifier | Present with valid `actualFmp` value | ActualFMP data available |

### Root Cause

In Lynx 3.7+, the following `PerformanceEntry` types were **deprecated**:
- `InitContainerEntry`, `InitLynxViewEntry`, `InitBackgroundRuntimeEntry`
- `MetricFcpEntry` (`entryType === "metric" && name === "fcp"`)
- `MetricActualFmpEntry` (`entryType === "metric" && name === "actualFmp"`)

They are replaced by:
- `LoadBundleEntry` (`entry.name === "loadBundle"`) for FCP data
- `PipelineEntry` (filter by `entry.identifier`) for ActualFMP data

### Migration Code

```typescript
const observer = lynx.performance.createObserver((entry: PerformanceEntry) => {
  if (entry.entryType !== "pipeline") return;

  // First render / FCP.
  if (entry.name === "loadBundle") {
    const loadBundle = entry as LoadBundleEntry;
    // loadBundle.fcp / loadBundle.lynxFcp / loadBundle.totalFcp
  }

  // Timing-flag pipeline / ActualFMP.
  const pipeline = entry as PipelineEntry;
  if (pipeline.identifier === "__your_timing_flag__") {
    // pipeline.actualFmp / pipeline.lynxActualFmp / pipeline.totalActualFmp
  }
});

observer.observe(["pipeline"]);
```

---

## Example 8: Timing Flag - Abnormally Large actualFMP

**User Query:** "Why is my actualFMP showing 15 seconds? The page renders in under 1 second."

### Executive Summary

The `actualFMP` of 15s is inflated because the timing flag was set on a component that **did not cause any UI change** at that moment. The flag hung until a later, unrelated UI update triggered `paintEnd`, making the duration include 14 seconds of idle time.

### Diagnosis

| Check | Result | Verdict |
| :--- | :--- | :--- |
| `Timing::Mark::paintEnd` for flag | Found at ts = 15000ms | Flag eventually resolved |
| Event preceding `paintEnd` | `diffVdom(8000)` at ts = 14950ms | Unrelated update |
| Gap between flag set and paintEnd | ~14 seconds | **Delayed UI Update** |

### Root Cause

The `__lynx_timing_flag` was set via `setState`, but the data update did not result in any actual UI change (the diff bailed out). The flag remained pending until a completely unrelated `setState` 14 seconds later triggered a paint, which incorrectly closed the timing flag.

### Recommendation

1. Ensure the data update tied to the flag **actually changes the UI**. If the data does not change the UI, the flag will hang.
2. **Prefer attribute flags** (`<view __lynx_timing_flag="my_flag">`) over `setState` flags, as they only trigger when the component is actually mounted/rendered.
3. For tracking page readiness, use `__lynx_timing_actual_fmp` on the element that indicates the page is ready for the user.

---

## Output Format Quick Reference

When generating analysis reports, always follow this structure:

### 1. Executive Summary (2-3 sentences)
- Identify the primary bottleneck or root cause
- Include key numbers (duration, percentage)
- Reference specific trace events with IDs: `[EventName](id)`

### 2. Data Evidence Table
- Adapt columns to analysis type
- **Bold** the bottleneck row
- Insert **[GAP]** rows for gaps > 10ms between stages

### 3. Execution Timeline / Deep Dive (3-6 sentences)
- Narrative description of event sequence
- Focus on: what happened, in what order, which stages stand out
- Reference specific events with IDs

### 4. Prioritized Suggestions (2-5 items)
- Sort by priority: High / Medium / Low
- Must be strictly based on trace data and diagnostic rules
- No generic advice unless data supports it
