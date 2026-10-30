# agent-lynx

## 0.14.23

### Patch Changes

- Updated dependency `@microsoft/api-extractor` to `^7.60.0`.
- Export independently maintained public recorder and fixture Skills, with public CLI instructions, portable fixture editing tools, and synthetic examples. Expose both Skills through Agent Lynx skill discovery.
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
