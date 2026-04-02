---
name: timing-flag
description: A reference guide for diagnosing issues related to Lynx Timing Flags. It analyzes trace events to troubleshoot missing performance callbacks, invalid timing flags, and abnormal metric values (like excessively long ActualFMP).
---

# Lynx Timing Flag Analysis Guide

## Core Knowledge
### 1. Timing Flag Concepts
*   **Purpose**: A string identifier (`__lynx_timing_flag`) used to tag and monitor a specific rendering pipeline.
*   **Render Cycles**:
    *   **Setup**: Initial render when the LynxView loads (happens once).
    *   **Update**: Re-render triggered by data/attribute changes.
### 2. Injection Methods
*   **Attribute Flag (Recommended)**: Added directly to the component (e.g., `<view __lynx_timing_flag="my_flag">`). Only triggers if the component is mounted/rendered with a valid, non-empty, previously unused flag.
*   **setState Flag (Legacy)**: Passed inside `setState`. **Rule**: If the data update causes NO actual UI change, the flag is ignored.
*   **Native Injection**: Injected via `updateData` or container timestamps via `setExtraTiming` (crucial for `Total_FCP` and `Total_ActualFMP`).

## Diagnostic Protocol (Symptom -> Action -> Verdict)
When a user reports a Timing Flag issue, apply the following logic:
#### Scenario 1: Missing `onSetup` Callback
*   **Symptom**: The initial render callback is not firing.
*   **Investigation Action**: Search the trace for the event `TimingMediator::TriggerSetupRuntimeCallback`.
*   **Verdict Logic**:
    *   If the event is **MISSING** -> The `PerformanceObserver` was registered too late.
*   **Recommendation**: Advise the user to register the observer earlier (e.g., in `useMemo` or the class constructor) before the flagged render occurs.
#### Scenario 2: Missing `onUpdate` Callback (Using Attribute Flag)
*   **Symptom**: `__lynx_timing_flag` is set on a component, but no update callback fires.
*   **Investigation Action 1 (Check Validity)**: Execute the following SQL to find Timing events:
    ```sql
    SELECT
      GROUP_CONCAT(CASE WHEN a.key = 'debug.timing_flags' THEN a.display_value ELSE NULL END) as timing_flags,
      s.id, s.name, s.ts / 10e6 as ts_ms
    FROM slice s JOIN args a ON s.arg_set_id = a.arg_set_id
    WHERE a.display_value != 'react_lynx_hydrate' and s.name Like 'Timing::%'
    GROUP BY s.id, s.name, s.arg_set_id
    HAVING MAX(CASE WHEN a.key = 'debug.timing_flags' THEN 1 ELSE 0 END) = 1
    ORDER BY s.ts;
    ```
*   **Verdict Logic 1**: If the target flag is NOT in the SQL results -> **Invalid Flag**. The flag might be empty, null, undefined, or placed on an unsupported element (like `<template>` or `<block>`).
*   **Investigation Action 2 (Check Listener)**: If the flag IS in the SQL results, search the trace for `TimingMediator::TriggerUpdateRuntimeCallback`.
*   **Verdict Logic 2**: If the event is MISSING -> **Late Registration**. The listener was not ready when the pipeline finished.

#### Scenario 3: Missing `onUpdate` Callback (Using `setState`)
*   **Symptom**: Flag passed via `setState`, but no callback fires.
*   **Investigation Action**: Run the SQL query from Scenario 2. Check if the event `Timing::Mark::paintEnd` exists for this specific flag.
*   **Verdict Logic**: If `paintEnd` is MISSING -> **No UI Update**. The `setState` did not result in a UI change (e.g., diff bailed out).
*   **Recommendation**: Ensure actual data that changes the UI is updated alongside the flag.

#### Scenario 4: `LynxActualFMP` is Abnormally Large (e.g., > 10 seconds)
*   **Symptom**: The duration for `__lynx_timing_actual_fmp` is unrealistically long.
*   **Investigation Action**: Run the SQL query from Scenario 2 to find the `Timing::Mark::paintEnd` event for this specific flag. Identify the event preceding it in this flag's pipeline, and calculate the time gap between them.
*   **Verdict Logic**:
    *  If there is a large gap with massive blank/idle time -> **Delayed UI Update**. The flag was set, but the UI did not actually update at that moment. The pipeline waited, and `paintEnd` was only triggered much later when a subsequent, unrelated UI update forced a paint.
    *  If there is a large gap filled with heavy tasks -> **Main Thread Blocked**. Rendering was delayed by other long-running operations blocking the UI thread.
*   **Recommendation**: If "Delayed UI Update" is detected, ensure the data update (`setState` or attribute change) tied to the flag actually causes an UI change. If the data doesn't change the UI, the flag will hang.

#### Scenario 5: `TotalActualFMP` is Abnormally Large (e.g., > 10 seconds)
*   **Symptom**: The duration for `__lynx_timing_actual_fmp` is unrealistically long.
*   **Investigation Action**: Check `open_time` (container timestamp); Check if the page was preloaded.
*   **Verdict Logic**:
    *   If `open_time` is 0 or missing -> **Missing Container Timestamp**. Native client failed to call `setExtraTiming` before `renderTemplate`.
    *   If it's a Preload scenario -> The time includes background idle time.
*   **Recommendation**: Coordinate with Native engineers to call `setExtraTiming` correctly, or recalculate ActualFMP starting from the LynxView display time for preloaded pages.

## Best Practices to Enforce
If you notice poor implementation in the user's code or trace, proactively recommend these:
1.  **Prefer Attribute Flags**: Stop using `setState` for flags; use `__lynx_timing_flag` on components.
2.  **Long List Anti-Pattern**: If tracking a list, place ONE flag on the `<list>` component itself. If you must flag items, use the **SAME flag name** for all items. Using unique names per item causes a callback storm and severe performance degradation.
3.  **Meaningful Naming**: Use `__lynx_timing_actual_fmp` specifically for the element that indicates the page is ready for the user.