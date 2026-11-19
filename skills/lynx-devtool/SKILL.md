---
name: lynx-devtool
description: Debug live Lynx apps, pages, and devices with the agent-lynx CLI or Node.js connector. Use for client/session discovery, UI snapshots and @eN ref actions, annotated screenshots, DOM/CSS or ReactLynx inspection, JS evaluation, console logs, and CDP/App commands on Android, iOS, or Desktop.
---

# agent-lynx DevTool Skill

Interact with Lynx applications through the `agent-lynx` CLI.

## Start Here

1. Match the goal in the **Reference Map** below and read only its linked reference file before acting.
2. Discover the target with `agent-lynx list-clients` and, when needed, `agent-lynx list-sessions --client <clientId>`.
3. When multiple clients or sessions exist, pass explicit `--client` and `--session` flags on every command.
4. Run the command, preserve structured stdout, and report the selected target plus any saved artifact path.

If `command -v agent-lynx` fails, run via `pnpx`:

```bash
pnpx agent-lynx <command>
```

For programmatic use (`agent-lynx/connector`), install `agent-lynx` in a temporary directory under `/tmp` rather than modifying the user's project (unless explicitly asked for a project integration), and read [Library Usage](references/library-usage.md) first:

```bash
agent_lynx_tmp="$(mktemp -d /tmp/agent-lynx.XXXXXX)" &&
  cd "$agent_lynx_tmp" &&
  pnpm add agent-lynx
```

## Connection Mode

Online CLI commands share a local connector daemon (`127.0.0.1:21783`) by default so independent CLI calls reuse one physical DebugRouter connection.

- Snapshot/ref commands (`snapshot`, `tap`, `long-press`, `fill`, `clear`, `scroll`, `get`, `wait`, `screenshot`) `reactlynx`, and `simulator` require daemon mode.
- `--no-daemon` bypasses the daemon for a single direct invocation. Stop the daemon (`agent-lynx daemon stop`) first when direct mode could compete for the same target.
- `ADB_SERVER_SOCKET`, `ANDROID_ADB_SERVER_ADDRESS`, and `ANDROID_ADB_SERVER_PORT` configure only `--no-daemon`; daemon mode ignores them with a stderr warning.

For local bundles and page-env authoring, load `lynx-simulator` with
`agent-lynx skills get lynx-simulator`.

## Reference Map

Read the specific reference in the third column on demand.

| Goal | Primary command | Reference |
| --- | --- | --- |
| Discover or wait for a client | `list-clients`, `wait-for-client` | [List Clients](references/list-clients.md), [Wait For Client](references/wait-for-client.md) |
| List page sessions | `list-sessions` | [List Sessions](references/list-sessions.md) |
| Open a URL | `open <url>` | [Open Page](references/open.md) |
| Capture element tree & act on `@eN` refs | `snapshot`, `tap`, `long-press`, `fill`, `clear`, `scroll`, `get`, `wait` | [Snapshot and Ref Actions](references/snapshot.md) |
| Capture a labeled Agent screenshot | `screenshot [--annotate]` | [Annotated Screenshots](references/screenshot-annotate.md) |
| Resolve a node or `@eN` ref to source | `get-source-info <nodeId\|@eN>` | [Get Source Info](references/get-source-info.md) |
| Read or watch console logs | `get-console` | [Get Console](references/get-console.md) |
| Evaluate JavaScript in a Lynx VM | `evaluate <expression>` | [Evaluate JavaScript](references/evaluate.md) |
| Print the browser inspector URL | `inspect` | [Inspect in Browser](references/inspect.md) |
| Inspect or toggle DevTool global switches | `global-switch list/get/set` | [Global Switch](references/global-switch.md) |
| Inspect, find, link, or mutate ReactLynx components | `reactlynx ...` | [ReactLynx](references/reactlynx.md) |
| Send a host App command | `app -m <method>` | [Supported App Methods](references/app/index.md), then the method page |
| Send LynxView or WebView CDP | `cdp -m <method>` | [Supported CDP Methods](references/cdp/index.md), then the method page |
| Query global Lynx memory usage | `cdp -s -1 -m Memory.getAllMemoryUsage` | [Memory.getAllMemoryUsage](references/cdp/memory/Memory.getAllMemoryUsage.md) |
| Enumerate parsed scripts | `get-sources` | [Get Sources](references/get-sources.md) |
| Capture a direct CDP screenshot | `take-screenshot` | [Take Screenshot](references/take-screenshot.md) |
| Capture full scrollable node content | `take-content-screenshot` | [Take Content Screenshot](references/take-content-screenshot.md) |
| Capture a QuickJS heap snapshot | `take-heap-snapshot` | [Take Heap Snapshot](references/take-heap-snapshot.md) |
| Record or query a Perfetto trace | `trace ...` | [Performance Trace](references/trace.md) |
| Encode or decode a TASM template | `tasm encode/decode` | [TASM Template Codec](references/tasm.md) |
| Record interactions into a TestBench replay | `recorder start/end` | [Recording](references/recorder.md) |
| Manage local Lynx Simulator processes | `simulator ...` | [Local Lynx Simulator](references/simulator.md) |
| Inspect, start, or stop the local daemon | `daemon status/start/stop` | [Daemon Lifecycle](references/daemon.md) |
| Browse global options, env vars, and all commands | `help`, `<command> --help` | [Command Reference Index](references/command-reference.md) |
| Diagnose discovery, daemon, or command failures | varies | [Troubleshooting Index](references/troubleshooting/index.md) |

## CDP and App Boundaries

- **LynxView (`type` is not `"web"`)**: Read [Supported CDP Methods](references/cdp/index.md) before sending raw `cdp`; Lynx implements a subset of standard CDP plus Lynx extensions.
- **WebView (`type: "web"`)**: Use standard Chrome DevTools Protocol methods; Lynx-specific extensions return `method not found`. Check `type` in `list-sessions` rather than guessing from an HTTP/HTTPS URL.
- **VM threads**: `--thread main` supports only `Debugger.*`, `Runtime.*`, `HeapProfiler.*`, and `Profiler.*`. Default is `background`.
- **Global handlers**: Use `-s -1` only for app-global handlers such as `Memory.getAllMemoryUsage`.
- **Host App calls**: Read [Supported App Methods](references/app/index.md) before calling `agent-lynx app`.
