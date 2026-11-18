# ReactLynx Component Workflows

Use the daemon-backed `reactlynx` commands to inspect, search, link, and mutate
the component tree exposed by `@lynx-js/preact-devtools`.

## Requirements

- Do not combine any `reactlynx` command with `--no-daemon`.
- The page must be a dev build running `@lynx-js/preact-devtools`; production
  bundles strip `setupReactLynx()`.
- A healthy setup logs `[PREACT DEVTOOLS] Devtools initialized successfully`.
- The installed preact-devtools build must include the `document.body` and
  `preactDevtoolsCtx.Node` fixes from PRs #2 and #5 in
  `lynx-family/preact-devtools`.
- Select `--client` and `--session` explicitly when several targets are active.

Set `DEBUG=devtool-mcp-server:reactlynx` to trace PreactDevtools frames on
stderr while keeping command stdout clean.

## Print a Component Tree

```bash
agent-lynx reactlynx tree [-c <clientId>] [-s <sessionId>] [--depth <n>] [--show-shells] [--json]
```

Output uses pre-order `@cN [type] Name` labels. Every `tree` call captures a fresh component generation and caches the exact label view it emitted, including `--depth`. Compact and `--show-shells` views are cached separately.

An empty result exits with code `1` and reports one targeted diagnostic:

- `saw 0 frames`: the devtools hook is absent, production-stripped, not yet initialized, or the wrong session was selected.
- `saw N frames but no operation_v2`: upgrade preact-devtools to a build with PRs #2 and #5.
- `tree is empty`: every observed node was unmounted; rerun with the `DEBUG` namespace to inspect raw envelopes.

## Inspect One Component

```bash
agent-lynx reactlynx component <@cN|vnodeId> [-c <clientId>] [-s <sessionId>] [--show-shells] [--refresh] [--json]
```

`<ref>` may be a cached `@cN` label or a numeric VNode ID. Pass `--show-shells` only when the label came from a shell-inclusive view; pass `--refresh` to replace the component generation before resolving `@cN`. `--json` prints the raw `InspectData` payload.

## Find Components

```bash
agent-lynx reactlynx find <pattern> [-c <clientId>] [-s <sessionId>] [--regex] [--show-shells] [--refresh] [--limit <n>] [--json]
```

Matches case-insensitive substrings by default (`--regex` for JS regular expressions; `--limit` defaults to `50`). Results use the same pre-order labels as `tree` and publish a full-depth label view for follow-up commands.

## Link Snapshot Elements and Components

Relate the latest daemon-cached DOM Snapshot to the cached ReactLynx tree:

```bash
# Snapshot element to nearest surfaced component
agent-lynx snapshot
agent-lynx reactlynx link @e7

# Component to first host element in the latest snapshot
agent-lynx reactlynx tree
agent-lynx reactlynx link @c8
```

Supports a numeric VNode ID, `--json`, `--show-shells`, and `--refresh`. Linking is an exact identity lookup through Lynx `nodeId` and ReactLynx `uniqueId`. It does not refresh the DOM Snapshot; run `agent-lynx snapshot` when an `@eN` ref is missing or stale.

## Update Props, State, or Context

```bash
agent-lynx reactlynx update-prop <ref> <path> <value> [options]
agent-lynx reactlynx update-state <ref> <path> <value> [options]
agent-lynx reactlynx update-context <ref> <path> <value> [options]
```

- `<path>` starts at the selected object (e.g. `count`, `user.name`, `items.0.title`). Do not prefix with `root.`, `props.`, `state.`, or `context.`.
- `<value>` is parsed as JSON (or pass `--raw` to send verbatim as a string).
- Supports `--show-shells`, `--refresh`, and `--json`.
