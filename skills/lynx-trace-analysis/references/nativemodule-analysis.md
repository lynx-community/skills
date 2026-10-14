---
name: nativemodule-analysis
description: A specialized analyzer for diagnosing performance issues in `NativeModule` calls within Lynx trace. It analyzes trace events to calculate precise duration breakdowns, identifies bottlenecks in native implementation or thread scheduling, and provides actionable optimization advice.
---

# Lynx NativeModule Performance Analysis

## Core Knowledge

### 1. Standard NativeModule Call — 5 Stages

A standard NativeModule call (where the callback fires on the main thread) can be divided into five stages:

| Stage | Trace Events | Description |
| :--- | :--- | :--- |
| **1. Parameter Conversion** | `JSValueToPubValue` | JS data is converted into native types (`PubValue`). |
| **2. Platform-layer Implementation** | `CallPlatformImplementation` → `NativeModule::PlatformCallbackStart` | The native method executes its specific functionality. `CallPlatformImplementation` runs on the [background thread](/guide/spec#background-scripting-thread-historically-known-as-js-thread); logic between it and `PlatformCallbackStart` usually runs on the same thread where `PlatformCallbackStart` fires. Currently, Trace lacks detailed events for NativeModule's internal logic. |
| **3. Waiting for Background Thread Callback** | `NativeModule::PlatformCallbackStart` → `NativeModule::Callback` | Time spent waiting for thread scheduling and switching before the callback executes on the `Lynx_JS` thread. |
| **4. Result Conversion** | `PubValueToJSValue` | Platform-layer return data is converted back into JS arguments. |
| **5. Callback Execution** | `InvokeCallback` | JS callback code logic executes. |

**Example code:**

```js
NativeModules.bridge.call(
  'setStorage',
  {
    data: {
      key: 'lynx_nativemodule_test',
      value: i,
    },
  },
  (res) => {
    console.log('setStorage res is: ', res);
  },
);
```

### 3. Special NativeModule Calls — 5 Stages

Some NativeModule implementations return results via callbacks on the **background thread** directly. These calls have a different stage breakdown:

| Stage | Trace Events | Description |
| :--- | :--- | :--- |
| **1. Parameter Conversion** | `JSValueToPubValue` | JS data is converted into native types. |
| **2. Platform-layer Implementation** | `CallPlatformImplementation` → start of `NativeModule::Callback` | The native method executes and returns platform-layer data. |
| **3. Result Conversion** | `PubValueToJSValue` | Platform-layer return data is converted into JS arguments. |
| **4. Callback Execution** | `InvokeCallback` | JS callback code logic executes. |
| **5. Cleanup** | End of `InvokeCallback` → end of `NativeModule::Invoke` | Platform-layer cleanup; external registrants are notified the call has completed. |

**Example code:**

```js
NativeModules.bridge.call(
  'x.reportAppLog',
  {
    data: {
      eventName: 'lynx_nativemodule_test_event_name',
    },
  },
  (res) => {
    console.log('reportAppLog res is: ' + JSON.stringify(res));
  },
);
```

### 4. Duration Formulas

Based on the three anchor events, calculate the following durations:

1. **`T_platform` (Platform Duration)** = `Timestamp(NativeModule::PlatformCallbackStart)` - `Timestamp(NativeModule::Invoke)`
   - *Meaning:* Actual execution time of the native method (I/O, computation, network request).
2. **`T_wait` (Waiting Duration)** = `Timestamp(NativeModule::Callback)` - `Timestamp(NativeModule::PlatformCallbackStart)`
   - *Meaning:* Time spent waiting for thread scheduling, thread switching, or queueing on the `Lynx_JS` thread.
3. **`T_js` (JS Duration)**
   - *Calculation:* If `PubValueToJSValue` and `InvokeCallback` events exist, sum their durations. Otherwise, use the duration of `NativeModule::Callback`.
   - *Meaning:* Time spent converting native data to JS values and executing the JS callback logic.

## Diagnostic Protocol (Symptom -> Action -> Verdict)

### Step 1: Data Integrity Check

Check if the input trace contains the three core events (`NativeModule::Invoke`, `NativeModule::PlatformCallbackStart`, `NativeModule::Callback`).

- **If events are missing**:
  1. Select an existing core event ID.
  2. Call `query_flow_events(event_id)` to find related events.
  3. Reconstruct the chain and proceed.

### Step 2: Determine Call Type

Identify whether the call is a **Standard** or **Special** NativeModule call by checking if `NativeModule::PlatformCallbackStart` appears before or within the callback execution flow. This determines which 5-stage breakdown to apply.

### Step 3: Bottleneck Identification

Compare `T_platform`, `T_wait`, and `T_js`. The stage with the highest duration or percentage is the **Primary Bottleneck**.

### Step 4: Optimization Strategy

- **Bottleneck: `T_platform` (Native Execution)**
  - *Check:* Is it a network request (args contains `fetch`, `x.request`)?
  - *Action (Network):* Check for `NetworkModule.callback`. If missing, suggest switching to **LynxNetwork** for async benefits.
  - *Action (Non-Network):* Collaborate with Native engineers to profile the native method for synchronous I/O or heavy computation.

- **Bottleneck: `T_wait` (Scheduling/Queueing)**
  - *Investigation:* Look at the `Lynx_JS` thread between `NativeModule::PlatformCallbackStart` and `NativeModule::Callback`.
  - *Action:* Identify what blocked the thread (e.g., heavy JS loops, other NativeModule callbacks). Suggest optimizing those blocking tasks.

- **Bottleneck: `T_js` (JS Execution)**
  - *Investigation:* High cost usually means large data conversion or complex callback logic.
  - *Action:*
    1. **Reduce Data Payload**: Ask backend/native to prune unused fields to speed up serialization.
    2. **Optimize Callback**: Simplify JS logic inside the callback; avoid forcing reflow/layout.

## Output Requirements

Structure your response exactly as follows:

**1. Call Type**
> Standard or Special NativeModule call.

**2. Phase Duration Analysis**
| Phase | Duration (ms) | Ratio (%) | Core Attribution |
| :--- | :--- | :--- | :--- |
| **Parameter Conversion** | [Value] | [%] | `JSValueToPubValue` — JS to native type conversion |
| **Platform Execution** | [Value] | [%] | Native method logic, I/O, network |
| **Waiting / Scheduling** | [Value] | [%] | Thread switching, JS thread queueing |
| **Result Conversion** | [Value] | [%] | `PubValueToJSValue` — native to JS type conversion |
| **Callback Execution** | [Value] | [%] | `InvokeCallback` — JS callback logic |
| **Total** | [Sum] | 100% | |

**3. Primary Bottleneck**
A concise statement identifying the bottleneck.
> *Example: "The primary bottleneck is **Platform Execution**, taking **150ms (80%)**, likely due to slow network response."*

**4. Actionable Optimization Suggestions**
Provide specific advice based on the identified bottleneck.
