# @lynx-js/devtool-mcp-server

## 0.16.14

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.7

## 0.16.13

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.6

## 0.16.12

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.5

## 0.16.11

### Patch Changes

- Parse `tcp:` socket specs with `parseTcpSocketSpec` from `@yume-chan/adb-server-node-tcp`, so ADB server specs get strict port validation and bare IPv6 hosts. Host-less specs (`tcp:` and `tcp::<port>`) are now rejected; `tcp:<port>` falls back to `127.0.0.1`, and host-only specs fall back to port `5037`.
- Updated dependency `@rslib/core` to `^1.0.5`.
- Reset `Runtime` before enabling console capture so V8 Inspector replays cached console events on persistent connections.
- Updated dependencies
  - @lynx-js/devtool-connector@0.18.4

## 0.16.10

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.3

## 0.16.9

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.2

## 0.16.8

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.1

## 0.16.7

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.0

## 0.16.6

### Patch Changes

- Updated dependency `core-js` to `^3.51.0`.
- Updated dependency `@modelcontextprotocol/sdk` to `^1.32.2`.
- Updated dependency `@rslib/core` to `^1.0.4`.
- Updated dependencies
  - @lynx-js/devtool-connector@0.17.0

## 0.16.5

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.16.6

## 0.16.4

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.16.5

## 0.16.3

### Patch Changes

- Updated dependency `zod` to `4.6.7`.
  Updated dependency `zod` to `^4.6.7`.
- Share MCP tool definitions, request execution, response formatting, schemas and stream helpers between the public and internal distributions. Align the public implementation with version 0.16.2 and expose a tool-context factory for distribution-specific integrations.
  
  Preserve existing tool names, schemas, results and command-line behavior in the internal distribution while keeping product-specific tools and infrastructure out of the public package.
- Preserve concrete tool schemas when registering a custom context, and correct the public Cursor installation link.
- Updated dependencies
  - @lynx-js/devtool-connector@0.16.4

## 0.13.15

### Patch Changes

- Updated dependencies [51e5de9]
  - @lynx-js/devtool-connector@0.13.2

## 0.13.5

### Patch Changes

- Updated dependencies [1ff373d]
  - @lynx-js/devtool-connector@0.9.5

## 0.13.4

### Patch Changes

- 6f4df9d: Add the Lynx DevTool packages: `@lynx-js/devtool-connector` (device transport layer with background daemon), `@lynx-js/devtool-mcp-server` (MCP server exposing DOM/CSS/Runtime/Performance and more tools), and an updated `@lynx-js/skill-lynx-devtool` skill with screenshot, console, heap snapshot, recorder, and ReactLynx inspection commands.
- Updated dependencies [6f4df9d]
  - @lynx-js/devtool-connector@0.9.4
