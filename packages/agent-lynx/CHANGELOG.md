# agent-lynx

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
