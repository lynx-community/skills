# Snapshot and Ref Actions

Capture a compact tree of interactive elements with stable `@eN` refs, then interact with or query those refs across CLI invocations through the shared connector daemon.

```bash
agent-lynx snapshot [--visible-only] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx tap <@eN> [--snapshot] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx long-press <@eN> [--duration <ms>] [--snapshot] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx fill <@eN> <text> [--snapshot] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx clear <@eN> [--snapshot] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx scroll <@eN> [--direction <up|down|left|right>] [--snapshot] [-c <clientId>] [-s <sessionId>] [--json [--compact]]
agent-lynx get text <@eN> [-c <clientId>] [-s <sessionId>] [--json]
agent-lynx get style <@eN> [--property <names>] [-c <clientId>] [-s <sessionId>] [--json]
agent-lynx wait (--text <text> | --ref <@eN>) [--timeout <ms>] [--interval <ms>] [-c <clientId>] [-s <sessionId>] [--json]
```

## Daemon and Ref Cache Rules

- Snapshot refs live in daemon memory across invocations. Never pass `--no-daemon`.
- Rerun `snapshot` (or pass `--snapshot` on an action) after the page changes and use refs from the latest snapshot.

## Subcommands and Options

- `snapshot`: Capture the element tree (`@e1`, `@e2`, ...).
  - `--visible-only`: Exclude offscreen/hidden elements.
- `tap <ref>`: Tap the center of `<ref>`.
- `long-press <ref>`: Long-press `<ref>`.
  - `--duration <ms>`: Hold duration in milliseconds (default `600`).
- `fill <ref> <text>`: Replace text in an editable element.
- `clear <ref>`: Clear an editable element.
- `scroll <ref>`: Scroll a scrollable container.
  - `--direction <up|down|left|right>`: Scroll direction (default `down`).
- `get text <ref>`: Print visible text of `<ref>`.
- `get style <ref>`: Print computed styles of `<ref>`.
  - `--property <names>`: Comma-separated style property names (e.g. `color,width`).
- `wait`: Poll fresh snapshots until a condition matches, then cache the matching snapshot.
  - `--text <text>`: Wait until `<text>` appears in any element.
  - `--ref <ref>`: Wait until `<ref>` resolves in a fresh snapshot.
  - `--timeout <ms>`: Maximum wait in **milliseconds** (default `10000`).
  - `--interval <ms>`: Polling interval in **milliseconds** (default `500`).

## Output Controls

- `--snapshot`: Supported on `tap`, `long-press`, `fill`, `clear`, and `scroll`. Refreshes the daemon's cached snapshot after the action and includes the new snapshot when `--json` is set.
- `-j, --json`: Emit a structured JSON result envelope (`{ ok, action, data }`).
- `--compact`: Supported on `snapshot`, `tap`, `long-press`, `fill`, `clear`, and `scroll`. Emits single-line JSON when combined with `--json`.

For visual ref labels drawn onto a JPEG (`screenshot --annotate`), see [Annotated Screenshots](screenshot-annotate.md).
