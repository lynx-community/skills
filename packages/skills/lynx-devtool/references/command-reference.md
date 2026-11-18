# agent-lynx DevTool Command Reference

Index of `agent-lynx` CLI options, environment variables, and per-subcommand reference files. For progressive disclosure, load only the subcommand reference needed for your current step.

## Global Options

- `-V, --version`: Print the `agent-lynx` CLI version.
- `-j, --json`: Enable JSON output on commands that declare a `--json` mode.
- `--no-daemon`: Bypass the shared connector daemon and use direct transports (`HDT`, `Android`, `iOS`, `Desktop`) for this single invocation. Stop the daemon first (`agent-lynx daemon stop`) if it may own a connection to the same DebugRouter target.
- `-h, --help`: Display command help (`agent-lynx <command> --help` is the source of truth for the installed CLI version).

## Environment Variables

- `AGENT_LYNX_FORCE_JSON`: Set to `1` or `true` to enable local `--json` options by default.
- `AGENT_LYNX_DISABLE_UPDATE_NOTICE`: Set to `1` to suppress best-effort version update notices on stderr.
- `ADB_SERVER_SOCKET`, `ANDROID_ADB_SERVER_ADDRESS`, `ANDROID_ADB_SERVER_PORT`: Direct-mode (`--no-daemon`) Android ADB server config (defaults to `127.0.0.1:5037`; `ADB_SERVER_SOCKET` takes precedence). Ignored in daemon mode with a stderr warning.
- `DEBUG`: Comma-separated `obug` namespaces on stderr.

## Subcommand References

| Command | Reference |
| --- | --- |
| `list-clients` | [List Clients](list-clients.md) |
| `wait-for-client` | [Wait For Client](wait-for-client.md) |
| `list-sessions` | [List Sessions](list-sessions.md) |
| `open` | [Open Page](open.md) |
| `snapshot`, `tap`, `long-press`, `fill`, `clear`, `scroll`, `get`, `wait` | [Snapshot and Ref Actions](snapshot.md) |
| `screenshot` | [Annotated Screenshots](screenshot-annotate.md) |
| `get-source-info` | [Get Source Info](get-source-info.md) |
| `get-console` | [Get Console](get-console.md) |
| `evaluate` | [Evaluate JavaScript](evaluate.md) |
| `inspect` | [Inspect in Browser](inspect.md) |
| `global-switch` | [Global Switch](global-switch.md) |
| `reactlynx` (`tree`, `component`, `find`, `link`, `update-*`) | [ReactLynx](reactlynx.md) |
| `app -m <method>` | [Supported App Methods](app/index.md) |
| `cdp -m <method>` | [Supported CDP Methods](cdp/index.md) |
| `cdp -s -1 -m Memory.getAllMemoryUsage` | [Memory.getAllMemoryUsage](cdp/memory/Memory.getAllMemoryUsage.md) |
| `get-sources` | [Get Sources](get-sources.md) |
| `take-screenshot` | [Take Screenshot](take-screenshot.md) |
| `take-content-screenshot` | [Take Content Screenshot](take-content-screenshot.md) |
| `take-heap-snapshot` | [Take Heap Snapshot](take-heap-snapshot.md) |
| `trace` (`start`, `end`, `read-data`, `event-summary`, `query`) | [Performance Trace](trace.md) |
| `tasm` (`encode`, `decode`) | [TASM Template Codec](tasm.md) |
| `recorder` (`start`, `end`) | [Recording](recorder.md) |
| `daemon` (`status`, `start`, `stop`) | [Daemon Lifecycle](daemon.md) |

### Programmatic API and Troubleshooting

- Programmatic Node.js connector (`agent-lynx/connector`): [Library Usage](library-usage.md)
- Discovery, daemon, and protocol diagnostics: [Troubleshooting Index](troubleshooting/index.md)
