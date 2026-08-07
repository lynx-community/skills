# @lynx-js/skill-lynx-devtool

## 0.14.2

## 0.13.4

### Patch Changes

- 6f4df9d: Add the Lynx DevTool packages: `@lynx-js/devtool-connector` (device transport layer with background daemon), `@lynx-js/devtool-mcp-server` (MCP server exposing DOM/CSS/Runtime/Performance and more tools), and an updated `@lynx-js/skill-lynx-devtool` skill with screenshot, console, heap snapshot, recorder, and ReactLynx inspection commands.
- ec84a30: Include package.json in published files so the `#daemon-entry` subpath import resolves correctly after the skill is exported from the workspace.
- 4e9bb31: Bundle the connector daemon entry and inspector wrapper into the skill build so `DaemonTransport` can resolve `#daemon-entry` and the inspector UI assets are available at runtime.
