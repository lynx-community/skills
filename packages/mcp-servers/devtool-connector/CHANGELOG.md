# @lynx-js/devtool-connector

## 0.17.0

### Patch Changes

- Close aborted unary command responses during daemon shutdown so callers do not wait for their own timeout.
- Updated dependency `dprint` to `^0.64.3`.
- Updated dependency `@rslib/core` to `^1.0.4`.
- Scope HDT transport responses to the selected app for both direct and daemon connections, so another app's session list cannot close its streams or supply its CDP responses.
- Preserve the request timeout when its transport closes without a response instead of reporting a generic missing response.
- Wait for the runtime to confirm the screenshot frame acknowledgement before closing its connection, so the next capture is not blocked by an unprocessed acknowledgement.

## 0.16.6

No changes in this release.

## 0.16.5

### Patch Changes

- Refresh cached ref coordinates after unannotated screenshots change the host coordinate mode, preserving node identities and invalidating stale coordinates when capture fails.

## 0.16.4

### Patch Changes

- Updated dependency `dprint` to `^0.63.0`.

## 0.16.3

### Patch Changes

- Updated dependency `@yume-chan/adb-server-node-tcp` to `3.0.0-beta.4`.
- Updated dependency `@yume-chan/adb` to `3.0.0-beta.4`.
- Updated dependency `@yume-chan/stream-extra` to `3.0.0-beta.4`.
- Updated dependency `dprint` to `^0.62.0`.
- Updated dependency `@types/node` to `^24.19.2`.
- Updated dependency `ws` to `^8.22.0`.
- Use Node's stream read-result type in ReactLynx sessions to avoid declaration-build failures caused by mixing Node and DOM stream types. Runtime behavior is unchanged.
- Share the Connector, HDT transports, command engine and daemon lifecycle between the public and internal distributions. Align the public implementation with version 0.16.2 and allow cross-origin version discovery while retaining loopback control protections.
  
  Use the Connector namespace for the Android app icon helper, including its embedded DEX artifact.
  
  Keep host-specific protocol declarations in the internal facade while sharing the generic Customized response parser and request correlation logic.
  
  The `/transport` entry point no longer exports `wsStreams`, `WsWebSocketStream` or `createWebSocketReadable`. Keep the WebSocket implementation internal and bundled for daemon and HDT transports so consumers do not need `ws` types.

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
