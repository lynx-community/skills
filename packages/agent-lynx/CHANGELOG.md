# agent-lynx

## 0.14.26

### Patch Changes

- Wait for `Runtime.enable` acknowledgment before applying the one-shot idle timeout in `get-console`.
- Updated dependencies
  - @lynx-js/skill-lynx-devtool@0.14.26
  - @lynx-js/devtool-connector@0.18.5

## 0.14.25

### Patch Changes

- Updated dependency `@microsoft/api-extractor` to `^7.60.1`.
- Updated dependency `@rslib/core` to `^1.0.5`.
- Schedule idle cleanup for unsubscribed daemon device connections discovered by `listClients` and use `readOnce` for daemon control responses.
- Keep an idle DevTool device connection open for 30 seconds after the last subscriber leaves.
- Reset `Runtime` before enabling console capture so V8 Inspector replays cached console events on persistent connections.
- Remove `getAndroidTransportSpec` and delegate default Android ADB server configuration to `AdbServerNodeJsTcpConnector`. Direct mode now uses `ADB_SERVER_SOCKET` first, then `ANDROID_ADB_SERVER_ADDRESS` and `ANDROID_ADB_SERVER_PORT`, with the IPv4 loopback default (`127.0.0.1:5037`), because the ADB server always binds IPv4 loopback while `localhost` can resolve to ::1 first, and upstream errors for invalid ports instead of silently falling back. Replace the nonstandard `ADB_SERVER_HOST` / `ADB_SERVER_PORT` variables with the standard names.
  
  ADB configuration is read from `process.env` at transport construction, not the product entrypoint's injected `env` object. Explicit socket options still override the environment. Strip the standard ADB configuration variables from daemon child processes to retain direct/daemon isolation.
- Updated dependencies
  - @lynx-js/devtool-connector@0.18.4
  - @lynx-js/skill-lynx-devtool@0.14.25

## 0.14.24

### Patch Changes

- Updated dependencies
  - @lynx-js/skill-lynx-devtool@0.14.24
  - @lynx-js/devtool-connector@0.18.3

## 0.14.23

### Patch Changes

- Updated dependency `@microsoft/api-extractor` to `^7.60.0`.
- Export independently maintained public recorder and fixture Skills, with public CLI instructions, portable fixture editing tools, and synthetic examples. Expose both Skills through agent-lynx skill discovery.
- Updated dependencies
  - @lynx-js/devtool-connector@0.18.2
  - @lynx-js/skill-lynx-recorder@0.2.0
  - @lynx-js/skill-lynx-recorder-fixture@0.2.0
  - @lynx-js/skill-lynx-devtool@0.14.23

## 0.14.22

### Patch Changes

- Add sandbox apps open -S/--restart to stop the target app before launching its page through the shared Transport restart option.
- Updated dependencies
  - @lynx-js/devtool-connector@0.18.1
  - @lynx-js/skill-lynx-devtool@0.14.22

## 0.14.21

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.18.0
  - @lynx-js/skill-lynx-devtool@0.14.21

## 0.14.20

### Patch Changes

- Updated dependency `core-js` to `^3.51.0`.
- Updated dependency `@rslib/core` to `^1.0.4`.
- Updated dependencies
  - @lynx-js/devtool-connector@0.17.0
  - @lynx-js/skill-lynx-devtool@0.14.20

## 0.14.19

### Patch Changes

- Updated dependencies
  - @lynx-js/skill-lynx-devtool@0.14.19
  - @lynx-js/devtool-connector@0.16.6

## 0.14.18

### Patch Changes

- Updated dependencies
  - @lynx-js/devtool-connector@0.16.5
  - @lynx-js/skill-lynx-devtool@0.14.18

## 0.14.17

### Patch Changes

- Share the CLI command core and align the public Agent with the current Connector. Preserve product-specific defaults and independent Skill payloads; keep product-only runtime helpers and notices in internal adapters.
  
  Bundle Commander runtime and CLI declarations instead of requiring a runtime installation. Include the existing public DevTool, trace-analysis, and trace-record Skills without exporting new internal Skill payloads.
- Updated dependencies
  - @lynx-js/devtool-connector@0.16.4
  - @lynx-js/skill-lynx-devtool@0.14.17

## 0.14.16

### Patch Changes

- Share the current CLI command implementation, including source-info, JSON preferences, direct-mode command execution, and daemon lifecycle commands.
- Expose a composable CLI API with invocation-scoped optional telemetry and configurable skill roots.

## 0.14.2

### Patch Changes

- Updated dependencies [51e5de9]
  - @lynx-js/devtool-connector@0.13.2
  - @lynx-js/skill-lynx-devtool@0.14.2
