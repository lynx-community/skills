---
name: sourcemap-remapping
description: A guide for remapping line and column numbers from Lynx trace event arguments back to original source positions.
---

# Sourcemap Remapping Guide

## Description

During trace analysis, some trace events may carry `lineNumber` and `columnNumber` in their arguments. This guide helps you map these positions back to the original source code.

## Thread Types and Requirements

There are different requirements based on which thread the trace event belongs to:

- **Lynx_JS** thread events (url is `file://app-service.js` or `file://background.js`): Only need sourcemap file
- **MainThread** or **LynxEngine** thread events (url is `file://lepus.js` or `file://main-thread.js`): Need **both** sourcemap file and `debug-info.json`

## Locating Required Files

Locate the sourcemap path corresponding to the generated JavaScript file referenced by the trace event.

Typical sourcemap examples:
- `dist/.rspeedy/main/main-thread.js.map`
- `dist/.rspeedy/main/lepus.js.map`
- `dist/.rspeedy/main/background.js.map`
- `dist/.rspeedy/main/app-service.js.map`
- `output/{page_name}/intermediate/app-service.js.map`
- `output/{page_name}/intermediate/lepus.js.map`

**If the sourcemap is missing, remind the user to rebuild the project with sourcemap generation enabled.**

If the event belongs to MainThread or LynxEngine, also locate `debug-info.json`.

Typical debug-info.json examples:
- `dist/.rspeedy/main/debug-info.json`
- `output/{page_name}/intermediate/debug-info.json`

## When to Apply

Apply this guide when:
- You are analyzing trace events from Lynx_JS, MainThread, or LynxEngine
- A trace event argument contains `lineNumber` and `columnNumber`

Do not apply this guide when:
- The trace event does not contain `lineNumber` and `columnNumber`
- The position already points to original source files

## Using the Remapping Script

Use the resolver script to perform sourcemap remapping:

```bash
node <path_to_the_skill>/scripts/source_map_resolver.cjs \
  --map "$ABSOLUTE_SOURCE_MAP_PATH_OR_URL" \
  --line "$GENERATED_LINE" \
  --column "$GENERATED_COLUMN" \
```

**Important Notes:**
- For **MainThread** or **LynxEngine** events, you must add the `--debug-info` parameter:

```bash
node <path_to_the_skill>/scripts/source_map_resolver.cjs \
  --map /path/to/main-thread.js.map \
  --debug-info /path/to/debug-info.json \
  --line 1355 \
  --column 13
```

Example output:

```json
{
  "fileName": "/absolute/path/src/app.ts",
  "line": 5,
  "column": 55
}
```

## Requirements

- Always confirm the sourcemap corresponds to the generated JavaScript file in the trace event
- Always preserve the original trace event position in the report for cross-checking
- For MainThread or LynxEngine events, always provide the `--debug-info` parameter
- If remapping fails, clearly explain whether `debug-info.json` is missing, the sourcemap is missing, a file is malformed, or there is simply no matching entry
