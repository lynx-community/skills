---
name: lynx-trace-record
description: This guide provides step-by-step instructions for recording Lynx performance traces. Use this guide when the user asks how to record a trace.
---

## 1. Workflow Example

The recording process requires using the `trace_record` CLI tool. **The order of operations is critical**.

### Step 1. List connected clients:
First, list all connected clients to get the client ID. This helps you identify which app to trace.
- If you have multiple connected clients, ask the user to specify the client ID you want to trace. Then, use this ID with the `--client` parameter to trace.
- If you have only one connected client, you can omit the `--client` parameter.
- If no clients are found, prompt the user to connect their device via USB and open the debugging app.
   ```bash
   node <path_to_the_skill>/scripts/trace_record.bundle.cjs list-clients
   ```

### Step 2. Start recording:
Execute the start command **BEFORE** building or opening the page on your device. This ensures you capture the entire first frame of the page. Use the `--client` parameter with the client ID from Step 1.
   ```bash
   node <path_to_the_skill>/scripts/trace_record.bundle.cjs start --client <client-id>
   ```

Optional start parameters can be controlled from the user's natural language request:

| User intent | CLI parameter | Trace config field | Default |
| --- | --- | --- | --- |
| Include only specific trace categories | `--include-categories <categories>` | `includedCategories` | `*` |
| Exclude specific trace categories | `--exclude-categories <categories>` | `excludedCategories` | `*` |
| Enable memory data collection | `--enable-memory-trace` | `enableMemoryTrace` | `false` |
| Disable automatic Garbage Collection | `--no-force-gc` | `forceGC` | `true` |
| Automatically capture heap snapshots for "shared-group" VMs | `--enable-auto-heap-snapshot` | `enableAutoHeapSnapshot` | `false` |
| Only capture automatic heap snapshots for a specific "shared-group" VM | `--shared-group-id <id>` | `sharedGroupId` | empty string |
| Specify the JS profile type, such as quickjs or v8 | `--js-profile-type <type>` | `JSProfileType` | empty string (JS profile disabled) |
| Specify the JS profile interval, such as 100 | `--js-profile-interval <interval>` | `JSProfileInterval` | `100` when `JSProfileType` is non-empty and interval is `<= 0`; otherwise `-1` |

When the user asks in natural language, translate the request into the corresponding `start` flags. For example, if the user says "record a trace with trace_record, enable memory data collection, and automatically capture heap snapshots for the VM named 'xxx'", run:
   ```bash
   node <path_to_the_skill>/scripts/trace_record.bundle.cjs start --client <client-id> --enable-memory-trace --enable-auto-heap-snapshot --shared-group-id xxx
   ```

Common trace categories are `lynx`, `vitals`, `javascript`, `jsb`, and `devtool`. If the user asks to include only specific event categories, pass them as a comma-separated list with `--include-categories`. For example, "录制trace时只允许以下类型的事件js，jsb" maps to `--include-categories lynx,jsb`. If the user asks "录制trace时允许所有事件", do not pass `--include-categories`; the default `includedCategories: ['*']` records all events.

If the user asks to exclude specific event categories, pass them as a comma-separated list with `--exclude-categories`. For example, "录制trace时关闭devtool事件和vitals事件" maps to `--exclude-categories devtool,vitals`.

If the user asks to use a specific JS engine profile type, such as "record with v8 JS profile", add `--js-profile-type v8`. If the user does not ask for JS profile collection, do not pass `--js-profile-type`; the default empty string disables JS profile collection.

If the user asks to use a specific JS profile interval, such as "record with JS profile interval 100", add `--js-profile-interval 100`. For example, "record with v8 JS profile and interval 100" maps to `--js-profile-type v8 --js-profile-interval 100`.

### Step 3. Build and Open the Page
Start your development server. If it does not auto-open the page, manually open the target page.
  ```bash
    pnpm run dev
  ```

### Step 4. Perform Actions
If you are debugging interactions (e.g., scrolling, clicking, data updates), perform those actions on the device now.

### Step 5. Stop Recording & Get Stream Handle
Stop the trace recording. The CLI will output a JSON response containing a `stream` field (this is your stream handle). Use the `--client` parameter with the same client ID from Step 1.
   ```bash
   node <path_to_the_skill>/scripts/trace_record.bundle.cjs end --client <client-id>
   ```

### Step 6. Read and Save Trace Data
Use the stream handle obtained from Step 5 to download and save the trace file to your local machine. Use the `--client` parameter with the same client ID from Step 1.
   ```bash
   node <path_to_the_skill>/scripts/trace_record.bundle.cjs readData --client <client-id> --stream <stream-handle> --output ./my-trace.pftrace
   ```

## 2. Troubleshooting Common Errors

### "Please restart the app to enable tracing functionality"

`enable_debug_mode` was off. The CLI attempted to enable it automatically. Solution: Force close the app on your device, restart it, and try recording again from Step 1.

### "Tracing functionality is not supported in the current version"

Make sure you're using the Lynx development version. For more information, visit: https://lynxjs.org/guide/start/integrate-lynx-dev-version.html

### "Tracing is not started, please start tracing first"

You need to run `start` before running `end` and `readData`.
