# agent-lynx

`agent-lynx` is a command-line interface for inspecting and operating [Lynx](https://lynxjs.org/) applications running on a connected device. It talks to Lynx DevTool over the DevTool protocol and exposes each capability as a small, scriptable subcommand.

The CLI is designed to be driven by AI agents as well as humans: every command prints compact text by default and accepts `--json` to emit a machine-readable result envelope instead.

## Requirements

- Node.js >= 18
- At least one reachable Lynx target:
  - Android: an ADB server (default `127.0.0.1:5037`)
  - iOS: usbmuxd
  - Desktop: a local Lynx process

## Installation

Run it without installing anything:

```bash
npx --yes agent-lynx --help
```

Or install it so that `agent-lynx` is available on `PATH`:

```bash
npm install --global agent-lynx
```

To use the programmatic connector export from a project, add it as a dependency:

```bash
npm install agent-lynx
```

## Quick start

```bash
# 1. Discover which Lynx clients are currently reachable
agent-lynx list-clients

# 2. Open a page on the discovered client
agent-lynx open https://example.com/my-lynx-page

# 3. Capture a compact tree of interactive elements with stable refs
agent-lynx snapshot

# 4. Act on an element using a ref from the snapshot
agent-lynx tap @e3
```

Most commands auto-discover their target, so `-c/--client` and `-s/--session` are optional. Pass them only when more than one client or session is present and you need to pin one:

```bash
agent-lynx snapshot --client <clientId> --session <sessionId>
```

## Core concepts

### Clients and sessions

A *client* is a connected app or device channel; a *session* is a single Lynx view inside it. `list-clients` and `list-sessions` enumerate them, and `wait-for-client` blocks until one becomes available — useful at the start of a script or CI job.

### Snapshot refs

`snapshot` returns a compact tree of interactive elements, each tagged with a stable ref such as `@e1`, `@e2`. Those refs are the currency of the interaction commands: `tap`, `long-press`, `fill`, `clear`, `scroll`, `get text`, and `get style` all take a ref instead of a brittle selector.

Mutating commands accept `--snapshot` to refresh the refs immediately after the action, so an agent can chain steps without a separate `snapshot` call:

```bash
agent-lynx tap @e3 --snapshot --json
```

Use `wait` to synchronise with the UI instead of sleeping:

```bash
agent-lynx wait --text "Checkout" --timeout 15000
agent-lynx wait --ref @e7
```

### Transports and the daemon

By default the CLI routes requests through a shared local daemon, which keeps device connections warm across invocations. Pass `--no-daemon` to bypass it and connect directly for a single invocation — this is also the only mode in which `ADB_SERVER_HOST` and `ADB_SERVER_PORT` take effect.

### Output modes

Every command prints a short human-readable line by default. Add `--json` to get a structured envelope suitable for parsing.

## Commands

Run `agent-lynx <command> --help` for the full option list of any command.

### Agent Skills

| Command | Purpose |
| --- | --- |
| `skills list` | List the Agent Skills shipped with the CLI, as agent-readable XML |
| `skills get <name>` | Print one skill and its bundled resources |

### Discovery

| Command | Purpose |
| --- | --- |
| `list-clients` | List all available clients |
| `list-sessions` | List all available sessions |
| `wait-for-client` | Wait until a client is available |

### Navigation and interaction

| Command | Purpose |
| --- | --- |
| `open <url>` | Open a page |
| `snapshot` | Capture interactive elements with stable refs |
| `tap <ref>` | Tap an element |
| `long-press <ref>` | Long-press an element (`--duration <ms>`) |
| `fill <ref> <text>` | Set the text of an editable field |
| `clear <ref>` | Clear an editable field |
| `scroll <ref>` | Scroll a scrollable element |
| `wait` | Poll fresh snapshots until `--text` appears or `--ref` resolves |
| `get text <ref>` / `get style <ref>` | Read visible text or computed style |

### Inspection

| Command | Purpose |
| --- | --- |
| `inspect` | Print the inspector URL for a client/session |
| `get-console` | Capture console logs from the device |
| `get-sources` | List all parsed scripts |
| `evaluate <expression>` | Evaluate a JavaScript expression in the selected Lynx VM |
| `cdp -m <method> [params]` | Send a raw CDP request |
| `app -m <method> [params]` | Send a raw App request |
| `global-switch list\|get\|set` | Manage DevTool global switches |

### Captures and profiling

| Command | Purpose |
| --- | --- |
| `screenshot` | Capture a screenshot, optionally annotated with snapshot refs (`--annotate`) |
| `take-screenshot` | Take a screenshot of the current page |
| `take-content-screenshot` | Capture the full content of a scroll container |
| `take-heap-snapshot` | Save a `.heapsnapshot` file |
| `trace start` / `trace end` / `trace read-data` | Record and download a Lynx performance trace |
| `trace query <trace>` | Run Perfetto SQL against a local `.pftrace` and emit JSON evidence |
| `trace event-summary <trace>` | List every Perfetto slice event name and its occurrence count |
| `recorder start` / `recorder end` | Record page interactions via TestBench and export a replay file |

`trace query` and `trace event-summary` work on a local trace file and need no device connection.

### ReactLynx

| Command | Purpose |
| --- | --- |
| `reactlynx tree` | Print the ReactLynx component tree |
| `reactlynx component <ref>` | Inspect one component |
| `reactlynx find <pattern>` | Search the component tree |
| `reactlynx link <ref>` | Link a DOM snapshot ref to its ReactLynx component |
| `reactlynx update-prop\|update-state\|update-context <ref> <path> <value>` | Mutate a component's prop, state, or context |

## Agent Skills

`agent-lynx` bundles Agent Skills so that an agent can teach itself how to use the CLI before running anything:

```bash
agent-lynx skills list
agent-lynx skills get lynx-devtool
```

Skills are discovered from the CLI's own declared dependencies: any dependency named `@lynx-js/skill-*` is resolved and its `SKILL.md` is exposed through the `skills` command. The `lynx-devtool` skill comes from [`@lynx-js/skill-lynx-devtool`](../skills/lynx-devtool), which documents the client/session model, the snapshot-ref workflow, and the ReactLynx commands in the detail an agent needs. Because it is a regular runtime dependency, installing `agent-lynx` is enough to get the skill — there is no separate install step.

## Programmatic usage

The connector layer is exported for scripts that need more than the CLI surface. `agent-lynx/connector` re-exports [`@lynx-js/devtool-connector`](../mcp-servers/devtool-connector) — including its stream and transport entry points — and adds a couple of helpers that build a connector with the same daemon-backed defaults the CLI uses:

```ts
import { createDefaultConnector } from 'agent-lynx/connector';

const connector = createDefaultConnector();
```

Pass your own transports to `createDefaultConnector(transports)` to override the defaults, or call `createDefaultTransports()` to start from them. `evaluateExpression` and `wrapExpression` are also exported for evaluating JavaScript on a target.

## Environment variables

| Variable | Effect |
| --- | --- |
| `AGENT_LYNX_DISABLE_UPDATE_NOTICE` | Set to `1` to disable best-effort new-version notices |
| `ADB_SERVER_HOST` | Android ADB server host in direct mode (default `127.0.0.1`; requires `--no-daemon`) |
| `ADB_SERVER_PORT` | Android ADB server port in direct mode (default `5037`; requires `--no-daemon`) |
| `DEBUG` | Comma-separated namespaces for diagnostic logs on stderr |
| `CODEX_SANDBOX_NETWORK_DISABLED` | When set to `1`, device commands stop with a network-permission error |

Device commands need local and private network access to discover and reach targets. In a sandbox that blocks networking, the CLI fails fast with an explanatory error rather than hanging.

## License

Apache-2.0
