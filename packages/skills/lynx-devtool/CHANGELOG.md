# @lynx-js/skill-lynx-devtool

## 0.15.0

No changes in this release.

## 0.14.29

No changes in this release.

## 0.14.28

### Patch Changes

- Finish `get-sources` on the successful second `Debugger.enable` response after collecting scripts, without requiring an option. Retain idle and overall timeout fallbacks.

## 0.14.27

### Patch Changes

- Use the `agent-lynx` name consistently in documentation.

## 0.14.26

No changes in this release.

## 0.14.25

### Patch Changes

- Schedule idle cleanup for unsubscribed daemon device connections discovered by `listClients` and use `readOnce` for daemon control responses.
- Keep an idle DevTool device connection open for 30 seconds after the last subscriber leaves.

## 0.14.24

No changes in this release.

## 0.14.23

No changes in this release.

## 0.14.22

### Patch Changes

- Add sandbox apps open -S/--restart to stop the target app before launching its page through the shared Transport restart option.

## 0.14.21

No changes in this release.

## 0.14.20

No changes in this release.

## 0.14.19

No changes in this release.

## 0.14.18

No changes in this release.

## 0.14.17

No changes in this release.

## 0.14.2

## 0.13.4

### Patch Changes

- 6f4df9d: Add the Lynx DevTool packages: `@lynx-js/devtool-connector` (device transport layer with background daemon), `@lynx-js/devtool-mcp-server` (MCP server exposing DOM/CSS/Runtime/Performance and more tools), and an updated `@lynx-js/skill-lynx-devtool` skill with screenshot, console, heap snapshot, recorder, and ReactLynx inspection commands.
- ec84a30: Include package.json in published files so the `#daemon-entry` subpath import resolves correctly after the skill is exported from the workspace.
- 4e9bb31: Bundle the connector daemon entry and inspector wrapper into the skill build so `DaemonTransport` can resolve `#daemon-entry` and the inspector UI assets are available at runtime.
