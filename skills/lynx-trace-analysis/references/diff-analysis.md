---
name: diff-analysis
description: A guide for comparing two Lynx traces to detect performance regressions. Use this when verifying optimization gains or investigating performance degradation between baseline and experiment traces.
---

# Lynx Diff Analysis Guide

## Core Knowledge Base

Before analyzing regressions, you must understand the Lynx rendering pipeline. Refer to [render-pipeline.md](./render-pipeline.md) for:
- First Frame Rendering Metrics: `loadBundle`, `parse`, `mtsrender`, `resolve`, `layout`, `paintingUiOperationExecute`, `paint`.
- Update Rendering Metrics: `diffVdom`, `packChanges`, `parseChanges`, `patchChanges`.

#### Comparable Trace Requirements
Ensure validity before analysis:
- **Same Scenario**: Both traces must represent the same user flow.

---

## Diagnostic Protocol

### Step 1: Metric Comparison
Query metrics using `query_metrics` and Compare. Identify **Significant Regressions**:
*   **Absolute Change**: > 20ms increase.
*   **Relative Change**: > 10% increase.
*   **Status Change**: A previously fast stage becomes a bottleneck.

### Step 2: Deep Dive Regressed Stages
For each regressed stage, Compare sub-events between Baseline and Experiment.

#### Phase: parse Regression
**Symptom**: `parse` duration increased significantly.
**Investigation Action**: Call `query_by_time_window` on `parse` slice in both traces.
**Verdict Logic**:
- If `LepusNG.DeSerialize` time increased significantly -> **Bundle Size Regression**.

#### Phase: mtsrender Regression
**Symptom**: `mtsrender` duration increased significantly.
**Investigation Action**: Call `query_by_time_window` on `mtsrender` slice in both traces.
**Verdict Logic**:
- Higher `vmExecute` -> **Script Logic Regression**.
- More `FiberCreateXXXX` events -> **DOM Structure Complexity Increased**.

#### Phase: resolve Regression
**Symptom**: `resolve` duration increased significantly.
**Investigation Action**: Call `query_by_time_window` on `resolve` slice in both traces.
**Verdict Logic**:
- Significant count increase of `FiberElement::FlushActions` or wrapper nodes -> **Wrapper Node Regression** (Check toolchain).

#### Phase: layout Regression
**Symptom**: `layout` duration increased significantly.
**Investigation Action**: Call `query_by_time_window` on `layout` slice in both traces.
**Verdict Logic**:
- Count of `Layout::Measure` events increased -> **List/Tree Size Increased**.
- Single event duration increased -> **Specific Component Complexity** (e.g., new rich text).

#### Phase: diffVdom Regression
**Symptom**: `diffVdom` duration increased significantly.
**Investigation Action**: Call `query_by_time_window` on `diffVdom` slice in both traces.
**Verdict Logic**:
- Compare sub-events between Baseline and Experiment.

## Output Requirements

**1. Executive Summary**
A 2-3 sentence conclusion stating the regression status and primary culprit.
*Example: "Significant regression detected. First Frame time increased by 150ms (+30%), primarily driven by a 100ms regression in `layout` due to a 2x increase in list items."*

**2. Metric Comparison Table**
| Metric | Baseline (ms) | Experiment (ms) | Diff (ms) | Diff (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `loadBundle(id)` | 500 | 650 | +150 | +30% | 🔴 Regression |
| `layout(id)` | 80 | 180 | +100 | +125% | 🔴 Regression |

**3. Root Cause Analysis**
For every 🔴 Regression, provide a detailed analysis:
*   **Metric**: [Name]
*   **Trace Evidence**: "Querying descendants of `layout(id)` showed `Text::Measure(id)` count increased from 50 ms (Baseline) to 120 ms (Experiment)."
*   **Configuration Check**: "ByteCode was active in both traces."
*   **Conclusion**: "The regression is caused by increased DOM complexity."

**4. Actionable Recommendations**
Provide 2-5 prioritized fixes based on the root cause.

---

## Tone and Style
*   **Comparative**: Always reference "Baseline vs. Experiment".
*   **Evidence-Based**: Explicitly mention the tool results that support your conclusion.
*   **Precise**: Use specific event names with IDs (e.g., `layout(id)`).
