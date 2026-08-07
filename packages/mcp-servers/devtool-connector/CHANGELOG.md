# @lynx-js/devtool-connector

## 0.13.2

### Patch Changes

- 51e5de9: Remove the internal `xdb` protocol types from the public type surface.

  `XdbJsbRequest`, `XdbJsbResponse`, `XdbGlobalPropsRequest` and
  `XdbGlobalPropsResponse`, along with their `CustomizedResponseMap` and
  `Response` entries, described a ByteDance-internal DevTool protocol. The
  commands that spoke it are not part of the public CLI, so the types had no
  consumer here and only leaked internal protocol names into the published
  `.d.ts`.

## 0.9.5

### Patch Changes

- 1ff373d: Allow all available Android Apps.

## 0.9.4

### Patch Changes

- 6f4df9d: Add the Lynx DevTool packages: `@lynx-js/devtool-connector` (device transport layer with background daemon), `@lynx-js/devtool-mcp-server` (MCP server exposing DOM/CSS/Runtime/Performance and more tools), and an updated `@lynx-js/skill-lynx-devtool` skill with screenshot, console, heap snapshot, recorder, and ReactLynx inspection commands.
