---
name: jank-analysis
description: A guide for analyzing Lynx trace smoothness issues. Use this when encountering jank, frame drops, or stuttering problems. It provides diagnostic logic to identify long tasks on Main/JS threads, analyze root causes, and offer actionable optimization suggestions.
---

# Lynx Jank Analysis Guide

## Core Knowledge Base

#### 1. Thread Models
*   **Main Thread**: Always executes UI Operations (`UIOperation`, `Painting`, `ScrollByInternal`).
    *   *Scenario A (Merged)*: Also executes `TemplateAssembler`, `LoadTemplate/LoadBundle`.
    *   *Scenario B (Separated)*: `Layout` and `TemplateAssembler` run on a dedicated **Layout/Engine Thread**.
*   **Lynx_JS Thread**: Executes Logic (`diffVdom`, `EventHandler`, `NativeModule` etc).

#### 2. Thresholds
*   **Main Thread Long Task**: > **16ms** (1 frame at 60fps).
*   **JS Thread Long Task**: > **30ms** (User-perceptible delay).

### Diagnostic Protocol (The "Drill-Down Loop")

For every analysis, you must execute this loop:

#### Step 1: Identify Thread Model & Long Tasks
1.  Call `query_threads` to get thread infos.
2.  Call `query_long_tasks` on Main, Lynx_JS, and (if present) Layout/Engine threads.

#### Step 2: Deep Dive & Attribution (The "Why")
For each Long Task, call `query_descendants` and apply the specific logic below:

---

### Diagnostic Logic & Rules (Detailed)

#### Phase: Main/Engine Thread - Rendering Blocking
**Symptom**: Long task on Main (or Layout) Thread > 16ms.
**Target Events**: `TemplateAssembler::CallLepusMethod` (Update), `LoadTemplate` (First Frame), `ScrollByInternal` (Scroll), `Layout`.
**Analysis**: Refer to [render-pipeline](./render-pipeline.md) for details.

#### Phase: Lynx_JS Thread - Diff Blocking
**Symptom**: Long duration between `diffVdomStart` and `diffVdomEnd`.
**Investigation Action**: Check for `ReactLynx::diff::XXXX` sub-events.
**Analysis**: Refer to [render-pipeline](./render-pipeline.md) **diffVdom** section for details.

#### Phase: Lynx_JS Thread - NativeModule Blocking
**Symptom**: Long task contains `NativeModule::Invoke`.
**Verdict Logic**:
*   **Frequent Calls**: Multiple calls to the same module in a short time.
    *   *Action:* **Batch NativeModule calls**.
*   **Single Slow Call**: One call takes > 30ms.
    *   *Action:* Refer to [nativemodule-analysis](./references/native-module-analysis.md) for details.

#### Phase: Cross-Instance Blocking
**Symptom**: Long task on JS thread has a different `instance_id` than the current page.
**Verdict**: **Thread Contention** (Other LynxView blocking shared JS thread).
**Action**: Enable **Multi-JS Threads** (LynxGroup) to isolate instances.

#### Phase: Unknown JS Blocking
**Symptom**: Long task on JS thread has NO specific sub-events (just "RunningInJS" or similar).
**Verdict**: **Heavy JS Execution (Unknown Function)**.
**Action**: Suggest enabling **JS Profile** and re-recording trace to pinpoint the exact function.

---

### Output Requirements

**1. Smoothness Summary**
A 2-3 sentence conclusion identifying the primary bottleneck (Main Thread Visual Stutter vs. JS Thread Input Lag) and the root cause.

**2. Long Task Analysis Table**
| Thread | Event Name | Duration (ms) | Root Cause |
| :--- | :--- | :--- | :--- |
| Main | `Layout` | **45.2** | Text Measurement |
| Lynx_JS | `diffVdom` | 32.0 | Large List Diff (Component: `FeedList`) |

**3. Deep Dive & Recommendations**
For the top bottleneck, provide specific analysis:
*   **Investigating [Event Name]**:
    *   *Sub-event Evidence*: "Found `ReactLynx::diff::FeedItem` taking 25ms."
    *   *Conclusion*: "Component `FeedItem` is re-rendering too often."
    *   *Action*: "Wrap `FeedItem` in `React.memo`."

**4. Prioritized Suggestions**
Provide 2-5 actionable recommendations sorted by priority.
*   *If Rspeedy Profile is missing*: High Priority recommendation to enable it.
*   *If Cross-Instance*: High Priority recommendation to enable Multi-JS.

