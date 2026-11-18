---
name: diff-analysis
description: A guide for comparing two Lynx traces to detect performance degradations or improvements. Use this when verifying optimization gains or investigating performance degradation between baseline and experiment traces.
---

# Lynx Trace Diff Guide

## 1. Objective
To accurately diagnose performance degradations or improvements between a Baseline and an Experiment trace. You must identify the root causes of performance degradation by analyzing rendering metrics, call stacks, and thread fluency.

## 2. Diagnostic Boundaries & Constraints
You must dynamically adapt your diagnostic depth based on the comparability of the two traces. You must strictly adhere to the following boundaries:

- **Hardware Discrepancy Constraint:** Absolute duration (ms) comparisons across different physical devices are invalid. When device models or OS differ, you must issue a prominent warning, restrict your analysis to metrics changes and long tasks.
- **Framework Alignment Constraint:** If metrics cannot be aligned (indicating different underlying frameworks or mismatched scenarios), you must halt the rendering metrics analysis and pivot entirely to the universal Long Task analysis.
- **DSL/Stack Alignment Constraint:** If metrics align but the underlying sub-event stacks differ fundamentally (indicating a DSL or architecture change), you must not compare call stack details.
- **Call Stack Comparison:** If the stacks match, you MUST perform a detailed call stack comparison to pinpoint the exact root cause of the degradation or improvement.

## 3. Analysis Focus Areas

### Metrics Comparison

#### Wait for Update (Mandatory)
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
    - **Result**: The `Wait for Update` for `lynx_actual_fmp` is `27.09ms`. You MUST output this exact math result in the Metric Comparison table.


#### Metrics Comparison

For aligned metrics within each `timing_flag`, you must pinpoint the exact cause of degradation by evaluating:
  - `loadBackground`: BTS size expansion or CodeCache misses.
  - `create_vdom` / `resolve`: DOM node volume and CSS parsing complexity.
  - `diffVdom`: Component over-rendering (evidenced by `Component::Diff` call counts).
  - `layout`: List size expansion (`Layout::Measure` count) or specific component layout complexity.

### Fluency & Long Tasks
- **Fluency & Long Tasks (Universal):** Extract and analyze Long Tasks (Main > 16ms, JS > 30ms). You must trace UI-blocking tasks back to their specific business components via `flow` data, and identify pure business logic bottlenecks (e.g., slow `fetch` callbacks).

## 4. Output Requirements

The output MUST strictly follow this Markdown template:

### 1. Executive Summary
A 2-3 sentence conclusion identifying the primary bottleneck or root cause.
[⚠️ **WARNING: Cross-Device Comparison Detected.** Absolute duration diffs are hardware-dependent.]
[Example: Overall duration degrades by +150ms, primarily driven by a +100ms degradation in `diffVdom` due to `FeedList` over-rendering.]

### 2. Metric Comparison
*(Constraint: `Wait for Update` MUST be the first row, even if normal. If frameworks do not align, output: "No aligned metrics, skipped.")*
| Metric | Baseline (ms) | Experiment (ms) | Diff (ms) | Diff (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Wait for Update` | [X] | [Y] | [Z] | [%] | 🟢/🔴 |
| `[Metric Name]` | [X] | [Y] | [Z] | [%] | 🟢/🔴 |

### 3. Root Cause Analysis
For top degradations or top long tasks, provide a detailed analysis (Constraint: Max 3 lines per regression):
**[Stage/Task Name]: +[X]ms**
*   **Evidence**: [Exact Count/Depth/Duration changes, e.g., `Component::Diff` Count: 50 -> 120]
*   **Context**: [Specific component name or trigger source, e.g., `FeedCard` state update]
*   **Conclusion**: [1 sentence root cause, e.g., Over-rendering increased DOM Diff complexity]

