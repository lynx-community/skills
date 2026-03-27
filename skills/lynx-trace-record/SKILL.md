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