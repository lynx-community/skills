# @lynx-js/devtool-mcp-server

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
