---
name: metrics-analysis
description: A guide for analyzing Lynx trace metrics performance. Use this when encountering slow startup, white screen, or high latency issues. It provides diagnostic logic to identify slow stages, analyze gaps between metrics, and offer actionable optimization suggestions.
---

# Lynx Metrics Analysis Guide

## Core Knowledge Base

Before analyzing metrics, you must understand the Lynx rendering pipeline. Loading [render-pipeline.md](./render-pipeline.md) for more details.
---

## Analysis Steps

### Step 1: Reading Render Pipeline
1. Read [render-pipeline](./render-pipeline.md) to understand the Lynx rendering pipeline.

### Step 2: Retrieve Metrics
1. Call `query_metrics` to retrieve First Frame and/or Update stage metrics.
2. If the `query_metrics` result contains **"Invalid Timing Flags"**: Read `[timing-flag](./timing-flag.md)` and follow the troubleshooting steps in the guide to diagnose why the flags are invalid
3. Identify **suspicious stages** based on absolute duration and ratio within the parent.

### Step 3: Deep Dive Suspicious Stages
1. For each suspicious stage or gap, according to [render-pipeline](./render-pipeline.md) to query trace data.
2. Analyze the trace data to identify the root cause of the slow stage or gap.

### Step 4: Generate Output
1. Generate the final output report based on the analysis results.
---

## Output Requirements

**1. Executive Summary**
A 2-3 sentence conclusion identifying the primary bottleneck (Stage, Gap, or Trigger Latency).
*Example: "Update rendering took 1080ms. The main bottleneck is trigger latency (800ms) caused by a slow NativeModule(id) request before `diffVdom(id)` started."*

**2. Metric Breakdown Table**
| Stage/Gap | Duration (ms) | Ratio | Analysis |
| :--- | :--- | :--- | :--- |
| `loadBundle(id)` | 600 | 100% | |
| **`layout(id)`** | **300** | **50%** | **Complex Text Layout** |
| [GAP] | 50 | 8% | GC Blocking |

**3. Render Pipeline Overview**
A short, narrative description (3–6 sentences) of how this page was rendered/updated:
- First-frame flow: which stages ran, how long they took, and any important inter-stage gaps.
- Update flow (if relevant): what triggered the update, timing of subsequent events, and trigger latency analysis.

**4. Prioritized Suggestions**
Provide 2-5 actionable recommendations sorted by priority.
*   *If CodeCache missing*: High Priority recommendation to enable it.
*   *If Trigger Latency*: Optimize the identified precursor (NativeModule, async task, etc.).

## Requirements
- Optimization Recommendations must be based on the Lynx rendering pipeline defined in [./render-pipeline](./render-pipeline.md).
- Analysis must follow the steps outlined in the Analysis Steps section.
