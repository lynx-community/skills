---
name: lynx-devtool
description: Use when working with Lynx DevTool or debugging a Lynx app, page, or device, especially when the task mentions clients or sessions, CDP or App commands, DOM/CSS inspection, runtime or console logs, screenshots, heap snapshots, Page.reload or App.openPage, global switches, or inspecting a ReactLynx component tree (`reactlynx tree`), searching components (`reactlynx find`), inspecting props/state/hooks (`reactlynx component`), or mutating props/state/context (`reactlynx update-prop` / `update-state` / `update-context`) on Android, iOS, or Desktop.
---

# DevTool Skill

This skill allows you to interact with Lynx applications running on connected devices (Android, iOS, Desktop) using the Lynx DevTool CLI.

## Usage

The CLI is located at `<path_to_the_skill>/scripts/index.mjs` relative to this skill's directory. You can run it using `node`.

The programmatic API is located at `<path_to_the_skill>/scripts/connector.mjs`. This entry re-exports everything from `@lynx-js/devtool-connector`, `@lynx-js/devtool-connector/transport`, and `@lynx-js/devtool-connector/streams`, and also provides `createDefaultTransports()` and `createDefaultConnector()` helpers that match the CLI defaults.

In the skill directory, use:

```bash
node <path_to_the_skill>/scripts/index.mjs <command>
```

**Note:** All command outputs are multi-line JSON. You can use `jq` or Node.js to process the data.

### Use as a Library

If you want to drive Lynx DevTool directly from JavaScript instead of shelling out to the CLI, import from `scripts/connector.mjs`.

```js
import {
  Connector,
  createDefaultConnector,
} from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const clients = await connector.listClients();

console.log(clients);
```

For fuller programmatic workflows, see [Library Usage Reference](references/library-usage.md) and [Programmatic Debugging Example](examples/programmatic-debugging.md).

You can also construct the connector manually if you need custom transports:

```js
import {
  AndroidTransport,
  Connector,
  DesktopTransport,
  iOSTransport,
} from "<path_to_the_skill>/scripts/connector.mjs";

const connector = new Connector([
  new AndroidTransport({ host: "127.0.0.1", port: 5037 }),
  new DesktopTransport(),
  new iOSTransport(),
]);
```

### Global Options

- `-h, --help`: Display help for command.

**Note:** Each subcommand supports the `--help` flag (e.g. `node <path_to_the_skill>/scripts/index.mjs cdp --help`). Use this to view the full list of available arguments and their descriptions.

### Client Targeting

Commands that accept `-c, --client <clientId>` also accept `--client-name <name>`.
Use `--client-name` to resolve a client from `list-clients` by package/app identifier
(`AppProcessName`, `bundleId`, `bundleName`, or `App`), for example:

```bash
node <path_to_the_skill>/scripts/index.mjs cdp --client-name com.example.app -m DOM.getDocument
node <path_to_the_skill>/scripts/index.mjs list-sessions --client-name com.lynx.uiapp
```

If multiple clients match the name, use `list-clients` and pass the exact client ID with `--client`.

### Commands

#### 1. List Clients

List all available Lynx clients (apps with DevTool enabled).

```bash
node <path_to_the_skill>/scripts/index.mjs list-clients
```

#### 2. List Sessions

List all active debugging sessions. A session corresponds to a specific Lynx view or context.

```bash
node <path_to_the_skill>/scripts/index.mjs list-sessions
# Optional: Filter by client ID
node <path_to_the_skill>/scripts/index.mjs list-sessions --client <clientId>
```

#### 3. Send CDP Command

Send a Chrome DevTools Protocol (CDP) command to a specific session.

> Note that Lynx only supports a part of the standard CDP command.
> LynxView note: when the target session is a LynxView, you **MUST** read [Supported CDP Methods](references/cdp/index.md) before sending a CDP command.
> WebView note: when the target session is a WebView (for example `type: "web"` or an HTTP/HTTPS URL), use the standard Chrome DevTools Protocol documentation for CDP method names, parameters, and enable prerequisites. The local `references/cdp` pages focus on LynxView support and Lynx-specific extensions, which may return `method not found` on WebView targets.

```bash
node <path_to_the_skill>/scripts/index.mjs cdp -m <method> [options] [params]
```

- `-m, --method <method>`: The CDP method name (e.g., `DOM.getDocument`, `Runtime.evaluate`).
- `-c, --client <clientId>`: (Optional) The Client ID. If omitted, uses the first available client.
- `--client-name <name>`: (Optional) Package/app name resolved from `list-clients`.
- `-s, --session <sessionId>`: (Optional) The Session ID. If omitted, uses the latest session (with the largest session ID).
- `--thread <thread>`: (Optional) Target VM thread, `background` or `main`. Defaults to `background`.
- `[params]`: (Optional) JSON string of parameters for the command.

When `--thread main` is used, only `Debugger.*`, `Runtime.*`, `HeapProfiler.*`, and `Profiler.*` methods are supported.

Example:

```bash
# Get the document root
node <path_to_the_skill>/scripts/index.mjs cdp -m DOM.getDocument

# Evaluate JavaScript
node <path_to_the_skill>/scripts/index.mjs cdp -m Runtime.evaluate '{"expression": "2 + 2"}'

# Evaluate JavaScript on the main-thread VM
node <path_to_the_skill>/scripts/index.mjs cdp --thread main -m Runtime.evaluate '{"expression": "2 + 2"}'
```

#### 4. Send App Command

Send an App-level command.

```bash
node <path_to_the_skill>/scripts/index.mjs app -m <method> [options] [params]
```

- `-m, --method <method>`: The App method name (e.g., `App.openPage`).
- `-c, --client <clientId>`: (Optional) Client ID.
- `--client-name <name>`: (Optional) Package/app name resolved from `list-clients`.
- `[params]`: (Optional) JSON string of parameters.

> You **MUST** read [Supported App Methods](references/app/index.md) before sending an App command.

#### 5. Open URL

Open a specific URL in the Lynx app.

```bash
node <path_to_the_skill>/scripts/index.mjs open <url> [options]
```

- `<url>`: The URL to open.
- `-c, --client <clientId>`: (Optional) Client ID.

Example:

```bash
node <path_to_the_skill>/scripts/index.mjs open "lynx://example/page"
```

#### 6. Inspect

Output the inspector URL for a client/session.

```bash
node <path_to_the_skill>/scripts/index.mjs inspect [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--port <port>`: (Optional) Daemon port. Defaults to `21783`.

#### 7. Get Console

Capture console logs from the device.

```bash
node <path_to_the_skill>/scripts/index.mjs get-console [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--offset <number>`: Skip N messages.
- `--limit <number>`: Limit number of messages.
- `--include-stack-traces`: Include stack traces for non-error messages.
- `--level <levels>`: Filter log levels (e.g., `error,warning`).
- `--thread <thread...>`: Target VM thread(s): `background` or `main`. If omitted, both threads are collected by default.

#### 8. Get Sources

List all parsed scripts. This is useful for finding script IDs to use with other commands (e.g., `Debugger.getScriptSource`). The command automatically fetches all currently loaded scripts.

```bash
node <path_to_the_skill>/scripts/index.mjs get-sources [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.

#### 9. Take Screenshot

Take a screenshot of the current page.

```bash
node <path_to_the_skill>/scripts/index.mjs take-screenshot [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--fullscreen`: (Optional) Capture the screenshot in `fullscreen` mode. Defaults to `lynxview` mode if not provided.
- `-o, --output <path>`: (Optional) Output file path.

#### 10. Take Heap Snapshot

Capture a QuickJS heap snapshot from the current Lynx session and save it as a `.heapsnapshot` file.

```bash
node <path_to_the_skill>/scripts/index.mjs take-heap-snapshot [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--thread <thread>`: (Optional) Target VM thread, `background` or `main`. Defaults to `background`.
- `-o, --output <path>`: (Optional) Output file path. Defaults to the OS temp directory.

#### 11. Global Switch

Manage DevTool global switches.

```bash
# List all supported keys and their current values
node <path_to_the_skill>/scripts/index.mjs global-switch list [options]

# Get one key
node <path_to_the_skill>/scripts/index.mjs global-switch get --key <globalKey> [options]

# Set one key
node <path_to_the_skill>/scripts/index.mjs global-switch set --key <globalKey> --status <on|off> [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.

`global-switch list` options:

- `--fail-fast`: Abort on first key-read failure.

`global-switch get` options:

- `--key <globalKey>`: Global switch key. (Required)

`global-switch set` options:

- `--key <globalKey>`: Global switch key. (Required)
- `--status <on|off>`: Target switch status. (Required)

For the full key list and examples, see [Global Switch Reference](references/global-switch.md).

#### 12. Query Global Memory Usage

Query Lynx global memory usage through the global `Memory.*` CDP domain. Use the generic `cdp` command and send the request to the global DevTool handler with session ID `-1`.

```bash
# Get global Lynx memory usage across live instances
node <path_to_the_skill>/scripts/index.mjs cdp -s -1 -m Memory.getAllMemoryUsage
node <path_to_the_skill>/scripts/index.mjs cdp -s -1 -m Memory.getAllMemoryUsage '{"timeoutMs":50000}'
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: CDP session ID. Use `-1` for the global DevTool handler unless you have a platform-specific reason to override it.
- `params.timeoutMs` (Optional): Non-negative timeout in milliseconds. Maximum value is `300000`.

When the DevTool MCP server is available, prefer the `Memory_getAllMemoryUsage` MCP tool for the same raw payload instead of shelling out to the CLI.

#### 13. Recording

Record Lynx page interactions via TestBench (CDP-based). Captures all actions (template loads, touch events, JS module calls, data updates) and produces a JSON replay file.

```bash
# Start recording (BEFORE opening the target page)
node <path_to_the_skill>/scripts/index.mjs recorder start [options]

# Stop recording and save the replay file
node <path_to_the_skill>/scripts/index.mjs recorder end [options]
```

- `-c, --client <clientId>`: (Optional) Client ID for `start` and `end`.
- `-o, --output <path>`: (Optional) Output file or directory path for `end`. Defaults to `~/.lynx-devtool/files/lynxrecorder/recording-<clientId>-<timestamp>.json`.

Workflow:

1. Run `recorder start`. If it enables `enable_debug_mode`, restart the app and run `recorder start` again.
2. User opens and interacts with the Lynx page.
3. Run `recorder end --output <file.json>` to stop and save.
4. Report the absolute file path to the user.

**Important:** For a replayable file, open or reload the target page after `recorder start` so the recording includes `loadTemplate`.

See [Recording Reference](references/recorder.md) for more details.

#### 14. ReactLynx Component Tree

Print the component tree of a running ReactLynx page, decoded from `@lynx-js/preact-devtools`. The CLI opens a `Lynx.onVMEvent` stream, sends a Preact DevTools `init`+`refresh` handshake, and renders the resulting `operation_v2` payloads as an ASCII tree.

```bash
node <path_to_the_skill>/scripts/index.mjs reactlynx tree [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--depth <n>`: (Optional) Maximum tree depth to print. Default: unbounded.
- `--show-shells`: Include the synthetic `Fragment` / `Root` / `Anonymous` wrappers ReactLynx inserts. They are hidden by default.
- `--json`: Emit `{ labels, roots, nodes }` instead of ASCII; use this when a script will consume the tree.

Output uses `@cN [type] Name` references (the convention from `agent-react-devtools`). Labels are pre-order DFS over visible roots and reset on every invocation, so they are stable within a single command but **not** across runs:

```
@c1 [fn] App
├─ @c2 [fn] Header
│  └─ @c3 [fn] Logo
└─ @c4 [fn] Body
```

Requirements:

- The page must be a **dev build** running `@lynx-js/preact-devtools` (production bundles strip `setupReactLynx()`). Successful initialization logs `[PREACT DEVTOOLS] Devtools initialized successfully` to the device console.
- `@lynx-js/preact-devtools` must include the `document.body` and `preactDevtoolsCtx.Node` fixes (PR #2 + PR #5 against `lynx-family/preact-devtools`). Without them, the `refresh` channel will return zero `operation_v2` frames and the CLI will print the "stale preact-devtools" diagnostic.

When the tree comes back empty, the CLI exits with code `1` and writes one of three targeted diagnostics on stderr:

- **`saw 0 frames`**: nothing replied on the `PreactDevtools` channel. The App is most likely missing `@lynx-js/preact-devtools`, is a production build, has not finished `setupReactLynx()`, or you picked the wrong `--session`.
- **`saw N frames but no operation_v2`**: the hook is loaded but its `refresh` handler is buggy. Upgrade `@lynx-js/preact-devtools` to a build that contains PRs #2 and #5.
- **`tree is empty`**: every node was unmounted between commits -- rare, rerun with `DEBUG` (below) to see the raw envelopes.

For deep debugging, set `DEBUG=devtool-mcp-server:reactlynx` to log every PreactDevtools frame (type + payload size) on stderr while leaving stdout (the tree / JSON) clean:

```bash
DEBUG='devtool-mcp-server:reactlynx' node <path_to_the_skill>/scripts/index.mjs reactlynx tree
```

#### 15. ReactLynx Component Inspect

Inspect a single ReactLynx component (props / state / hooks / context / signals) by sending the Preact DevTools `inspect` envelope and reading back `inspect-result`.

```bash
node <path_to_the_skill>/scripts/index.mjs reactlynx component <ref> [options]
```

- `<ref>`: either a label `@cN` produced by `reactlynx tree` / `reactlynx find`, or a numeric vnode id.
  - With `@cN`, the CLI does an extra init+refresh+tree round-trip first to resolve the label. Pass `--show-shells` if (and only if) the label was generated with shells visible.
  - With a numeric id (e.g. `3856353762`), the snapshot is skipped -- one round-trip total.
- `-c, --client <clientId>`, `-s, --session <sessionId>`: (Optional) standard targeting flags.
- `--show-shells`: When resolving `@cN`, count synthetic Fragment / Root / Anonymous wrappers the same way `reactlynx tree --show-shells` does.
- `--json`: Print the raw `InspectData` payload as JSON. Default output is a compact ASCII summary.

Example output:

```text
@c5 (id=3856353783) [fn] TUXIntroViewListCell key=1. HMR
  source: src/TUXIntroViewListCell.tsx:42:3
  props:
    {
      "title": "1. HMR",
      "icon": { "type": "vnode", "name": "TUXIcon" }
    }
```

#### 16. ReactLynx Component Find

Find every component whose name matches a substring or regex. Output is ordered identically to `reactlynx tree` (pre-order DFS) so the `@cN` labels round-trip with the other subcommands.

```bash
node <path_to_the_skill>/scripts/index.mjs reactlynx find <pattern> [options]
```

- `<pattern>`: substring (default, case-insensitive) or JavaScript regex with `--regex`.
- `-c, --client <clientId>`, `-s, --session <sessionId>`: (Optional) standard targeting flags.
- `--regex`: Treat `<pattern>` as a JavaScript regular expression (e.g. `--regex '^Toast(List)?$'`).
- `--show-shells`: Include synthetic Fragment / Root / Anonymous wrappers.
- `--limit <n>`: Maximum number of matches to print. Default `50`.
- `--json`: Emit `[{ label, id, name, type, key, ancestors: [{label, name}] }, ...]` for scripted post-processing.

Example output:

```text
@c8 [fn] TUXCenterToastActivator
  in @c1 TUXApp > @c2 Provider > @c3 App
@c10 [fn] TUXTopToastActivator
  in @c1 TUXApp > @c2 Provider > @c3 App
```

`reactlynx find` is the recommended way to discover labels for follow-up `reactlynx component @cN` calls when the tree is too large to scan visually.
