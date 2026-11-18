---
name: render-pipeline
description: A reference guide for Lynx rendering pipeline stages. Use this to understand First Frame and Update rendering metrics, and to deep-dive into specific stage bottlenecks (parse, mtsrender, layout, diffVdom, etc.) with sub-event analysis and optimization strategies.
---

# Lynx Rendering Pipeline Analysis Guide

This guide provides a deep-dive analysis framework for the Lynx rendering pipeline. It covers both First Frame Rendering and Update Rendering.

## Core Knowledge

### 1. First Frame Rendering Metrics (from-scratch render)

Top-level metric: `loadBundle`, with serial sub-metrics:
- `parse` – Time to parse the binary Bundle into in-memory structures.
- `mtsrender` – Time to execute Main Thread Script to build the initial Element Tree.
- `resolve` – Time to compute styles (Computed Styles) for nodes.
- `layout` – Time to compute positions and sizes based on the resolved layout tree.
- `paintingUiOperationExecute` – Time to apply UI operations (style/layout changes) to platform UI.
- `paint` – Time spent by the platform layer to actually draw pixels.
- `loadBackground` – Time to load and execute Background Thread Script. This runs **in parallel** and does not block first-frame completion, but strongly affects later updates.

### 2. Update Rendering Metrics (refresh-on-change)

Triggered by data changes or user interactions:
1. `diffVdom` (background) – Compute Virtual DOM differences.  
2. `packChanges` (background) – Serialize differences.  
3. `parseChanges` (main) – Deserialize differences.  
4. `patchChanges` (main) – Apply differences to the Element Tree.  
5. Reuses pixel pipeline: `resolve` → `layout` → `paintingUiOperationExecute` → `paint`.

## Diagnostic

### First Frame Rendering

#### loadBundle/LynxLoadTemplate

- **Definition**: Lynx First Frame Rendering stage, composed by `parse`, `mtsrender`, `resolve`, `layout`, `paintingUiOperationExecute`, etc stages.

### parse

- **Definition**: Parse the Lynx bundle for subsequent pipeline processing. Includes bundle decoding and script deserialization.
- **Deep Dive Logic**:
  - **Query**: Call `query_by_time_window(parse.start_ts, parse.end_ts, parse.track_id)` to get trace events.
  - **Verdict Logic**:
    - If `LepusNG.DeSerialize` is time-consuming and `bytecodeSize` is large -> **MTS bundle size is too large**.
    - If multiple pages share the same `url` but all have high `parse` time -> **Lack of template reuse / Missing Pre-Decode**.
- **Optimization**:
  - **MTS Bundle Too Large**: Reduce bundle size; split large bundles into smaller chunks; remove unused code.
  - **Missing Pre-Decode**: Use **Pre-Decode** to pre-decode templates and reuse parsed bundles across multiple LynxViews.

### mtsrender

- **Definition**: Execute Main Thread Script (MTS) to construct the element tree. Includes `vmExecute`, `dataProcessor`, and `create_vdom` phases.
- **Deep Dive Logic**:
  - **Query**: Call `query_by_time_window(mtsrender.start_ts, mtsrender.end_ts, mtsrender.track_id)` to get trace events.
  - **Verdict Logic**:
    - If `vmExecute` phase is high -> **MTS size is large**.
    - If `dataProcessor` phase is high -> **Complex data processing logic**.
    - If `create_vdom` phase is high -> Use `query_by_time_window` in the `create_vdom` window and check element count and types (e.g., `FiberCreateXXXX`). If `wrapper` nodes are dominant -> **Too many wrapper nodes**.
- **Optimization**:
  - **Large MTS Size**: Reduce MTS bundle size; move non-critical logic to Background Thread Script (BTS).
  - **Complex Data Processing**: Simplify `dataProcessor` logic; keep only essential logic; defer heavy computation.
  - **Too Many Wrapper Nodes**: Upgrade **ReactLynx3 toolchain (≥ 0.100.0)** to enable "Automatic Wrapper Removal"; simplify component hierarchy.

### resolve

- **Definition**: Resolve element attributes (properties, events, styles) and synchronize computed styles to layout nodes.
- **Deep Dive Logic**:
  - **Query**: Call `query_by_time_window(resolve.start_ts, resolve.end_ts, resolve.track_id)` to get trace events.
  - **Verdict Logic**:
    - If you see many wrapper-like nodes (args.tagName is `wrapper`) -> **Excessive wrapper components**.
- **Optimization**:
  - **Excessive Wrappers**: Reduce wrapper components and unnecessary nesting; upgrade toolchains that automatically remove wrappers.

### paintingUiOperationExecute

- **Definition**: Execute platform UI operations (create, insert, update, delete platform UI elements).
- **Deep Dive Logic**:
  - **Query**: Call `query_by_time_window(paintingUiOperationExecute.start_ts, paintingUiOperationExecute.end_ts, paintingUiOperationExecute.track_id)` to examine the density of platform UI operations and any synchronous resource/image operations.
  - **Verdict Logic**:
    - If `Interceptor.shouldRedirectImageUrl` appears in this window -> **Synchronous image URL redirect blocking UI operations**.
    - If image synchronous fetch events appear in this window -> **Synchronous image loading blocking UI operations**.
- **Optimization**:
  - **Image URL Redirect**: Enable **Asynchronous Image Redirecting** to avoid blocking the main thread.
  - **Synchronous Image Loading**: Enable **Asynchronous Image Fetching**.

### loadBackground

- **Definition**: Time to load and execute Background Thread Script (BTS). Runs in parallel with the main pipeline but is critical for subsequent updates.
- **Deep Dive Logic**: 
  - **Query**: Call `query_by_time_window(loadBackground.start_ts, loadBackground.end_ts, loadBackground.track_id)` to get trace events.
  - **Verdict Logic:**
    - If `evaluateJavaScriptBytecode` exists -> **Bytecode Active** (Slow due to script size/logic).
    - If `evaluateJavaScriptBytecode` MISSING AND `JsCacheManager::TryGetCache` MISSING -> **No Opts Active** (Needs Bytecode/CodeCache).
    - If `JsCacheManager::TryGetCache` present but followed by `evaluateJavaScript` -> **CodeCache Miss**.
- **Optimization**: 
  - If the platform is **iOS/Darwin**: You may only reason about Bytecode distribution strategy and script size / logic placement.
  - Else: 
    - If **Needs Bytecode/CodeCache**: 
      - Recommend open Bytecode or CodeCache to skip parse+compile stage.
    - If **CodeCache Miss**: 
      - Recommend record a new trace **with DevTools disabled** to confirm whether CodeCache hits in a production environment or check online `lynxsdk_code_cache` hit-rate metrics to see whether misses are systemic.
    - If **Bytecode Active** but still slow: 
      - Recommend focus on reducing Background Thread Script size and complexity; defer non-critical work outside the `loadBackground` window, and/or load logic lazily where possible.

## Update Rendering

### diffVdom

- **Definition**: Compare the new virtual DOM with the old one to determine minimal changes needed. Runs on Lynx_JS Thread.
- **Deep Dive Logic**:
  - **Investigation Action**: Call `query_by_time_window(diffVdom.start_ts, diffVdom.end_ts, diffVdom.track_id)` to get sub-events,  and check for `ReactLynx::diff::XXXX` sub-events.
  - **Verdict Logic**:
    - **Scenario A: No `ReactLynx::diff::XXXX` events found**:
      - *Verdict*: **Rspeedy Performance Profile NOT Enabled**.
      - *Action*: Advise user to enable profile in `lynx.config.ts` and re-record trace:
        ```typescript
        export default defineConfig({ performance: { profile: true } });
        ```
    - **Scenario B: `ReactLynx::diff::XXXX` events found**:
      - *Verdict*: Identify the specific component name (e.g., `ReactLynx::diff::MyComponent`).
      - *Action*: Optimize the identified component using `useMemo` or `shouldComponentUpdate` to skip unnecessary diffs.
- **Optimization Summary**:
  - If **Rspeedy Profile Missing**: High Priority recommendation to enable it for precise component-level diagnosis.
  - If **Component Identified**: Optimize specific component with `React.memo`, `useMemo`, or `shouldComponentUpdate`.
  - If **Deep Component Tree**: Flatten component hierarchy; use memoization for expensive components.

## Update Trigger Latency Analysis
For each `timing_flag` present in the metrics, you must calculate the "Wait for Update" duration and compare all metrics, focusing on the following core areas:
You need to determine the trigger source and duration difference based on `pipeline origin` for every `timing_flag`.
- **Native Triggered** (`updateGlobalProps` / `updateTriggeredByNative` / `reloadBundleFromNative`):
  - *Calculation*: Wait for Update Duration = `pipeline` start time - `loadBundle` end time.
  - *Verdict*: If this phase degrades or improves (on same device), it indicates the client triggered the update late. The conclusion points to **Native logic degradations or improvements**.
- **Frontend/BTS Triggered** (`updateTriggeredByBts` / `reloadBundleFromBts` / `setNativeProps`):
  - *Calculation*: Wait for Update Duration = `pipeline` start time - `loadBackground` end time.
  - *Verdict*: If this phase degrades or improves, query preceding trace data triggered by `diffVdom` (using `flow` id) to trace back the preceding chain (e.g., **NativeModule calls slowing down**).
- **Example Input JSON Snippet**:
    ```json
    [
      {
        "timing_flags": "Lynx FCP",
        "origin": "loadBundle",
        "details": [
          { "metrics_name": "loadBackground", "end_ts_ms": "46420290.34ms" }
        ]
      },
      {
        "timing_flags": "lynx_actual_fmp",
        "origin": "updateTriggeredByBts",
        "start_ts_ms": "46420317.43ms",
      }
    ]
    ```
    *Step-by-Step Execution:*
    - **Identify Origin**: For the `lynx_actual_fmp` block, the `origin` is `"updateTriggeredByBts"` (Frontend Trigger).
    - **Select Formula**: `pipeline` start time - `loadBackground` end time.
    - **Calculate**: `46420317.43 - 46420290.34 = 27.09ms`.
    - **Result**: The Wait for Update for `lynx_actual_fmp` is `27.09ms`. You MUST output this exact math result in the Metric Comparison table.

**Deep Dive Logic**
- Attribute late update-start to the concrete precursor types you actually observe (e.g., slow NativeModule response before `diffVdom`, heavy background computation, delayed host-triggered calls).  
- Map actions accordingly (optimize the relevant NativeModule, move heavy logic off critical path, reduce data size, or adjust update frequency).
