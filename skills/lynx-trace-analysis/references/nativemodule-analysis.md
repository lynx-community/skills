---
name: nativemodule-analysis
description: A specialized analyzer for diagnosing performance issues in `NativeModule` calls within Lynx trace. It analyzes trace events to calculate precise duration breakdowns, identifies bottlenecks in native implementation or thread scheduling, and provides actionable optimization advice.
---

# Lynx NativeModule Performance Analysis

### Core Knowledge Base
#### 1. The Three Core Stages of NativeModule Calls
You must calculate durations based on these three key events:
*   **Event A**: `NativeModule::Invoke` (Start of the call).
*   **Event B**: `NativeModule::PlatformCallbackStart` (Platform logic finished, callback triggering).
*   **Event C**: `NativeModule::Callback` (Callback execution starts on `Lynx_JS` thread).

**Duration Formulas:**
1.  **`T_platform` (Platform Duration)** = `Timestamp(B)` - `Timestamp(A)`
    *   *Meaning:* Actual execution time of the native method (I/O, computation, network request).
2.  **`T_wait` (Waiting Duration)** = `Timestamp(C)` - `Timestamp(B)`
    *   *Meaning:* Time spent waiting for thread scheduling, thread switching, or queueing on the `Lynx_JS` thread.
3.  **`T_js` (JS Duration)**
    *   *Calculation:* If `PubValueToJSValue` and `InvokeCallback` events exist, sum their durations. Otherwise, use the duration of `NativeModule::Callback`.
    *   *Meaning:* Time spent converting native data to JS values and executing the JS callback logic.

### Diagnostic Logic & Rules

#### Step 1: Data Integrity Check & Completion
Check if the input trace contains all three core events (NativeModule::Invoke, NativeModule::PlatformCallbackStart, NativeModule::Callback).
*   **If events are missing**:
    1.  Select an existing core event ID.
    2.  Call `query_flow_events(event_id)` to find related events.
    3.  Reconstruct the chain and proceed.

#### Step 2: Bottleneck Identification
Compare `T_platform`, `T_wait`, and `T_js`. The stage with the highest duration or percentage is the **Primary Bottleneck**.

#### Step 3: Optimization Strategy (Symptom -> Action)
*   **Bottleneck: `T_platform` (Native Execution)**
    *   *Check:* Is it a network request (args contains `fetch`, `x.request`)?
    *   *Action (Network):*
        1.  Check for `NetworkModule.callback`. If missing, suggest switching to **LynxNetwork** for async benefits.
    *   *Action (Non-Network):* Collaborate with Native engineers to profile the native method for synchronous I/O or heavy computation.

*   **Bottleneck: `T_wait` (Scheduling/Queueing)**
    *   *Investigation:* Look at the `Lynx_JS` thread between `NativeModule::PlatformCallbackStart` and `NativeModule::Callback`.
    *   *Action:* Identify what blocked the thread (e.g., heavy JS loops, other NativeModule callbacks). Suggest optimizing those blocking tasks.

*   **Bottleneck: `T_js` (JS Execution)**
    *   *Investigation:* High cost usually means large data conversion or complex callback logic.
    *   *Action:*
        1.  **Reduce Data Payload**: Ask backend/native to prune unused fields to speed up serialization.
        2.  **Optimize Callback**: Simplify JS logic inside the callback; avoid forcing reflow/layout.

### Output Requirements
Structure your response exactly as follows:
**1. Phase Duration Analysis**
| Phase | Duration (ms) | Ratio (%) | Core Attribution |
| :--- | :--- | :--- | :--- |
| **Platform** | [Value] | [%] | Native method execution, Network I/O |
| **Waiting** | [Value] | [%] | Thread switching, JS thread queueing |
| **JS Execution** | [Value] | [%] | Data conversion, JS callback logic |
| **Total** | [Sum] | 100% | |

**2. Primary Bottleneck**
A concise statement identifying the bottleneck.
> *Example: "The primary bottleneck is **Platform**, taking **150ms (80%)**, likely due to slow network response."*

**3. Actionable Optimization Suggestions**
Provide specific advice based on the identified bottleneck.
