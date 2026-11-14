# @lynx-js/skill-lynx-tasm-codec

## 0.1.3

### Patch Changes

- Use `pnpx` for one-shot agent-lynx commands in the documentation, bundled skills, and Connector CLI guidance. Use `npm_config_registry` for registry overrides so the examples work on pnpm 10 and 11.

## 0.1.2

### Patch Changes

- Use the `agent-lynx` name consistently in the TASM Skill instructions. Thanks [@洪志远](https://code.byted.org/hongzhiyuan.hzy) in [!987](https://code.byted.org/lynx/skills/merge_requests/987)

## 0.1.1

### Patch Changes

- Add `agent-lynx tasm encode/decode` backed by a TASM package downloaded and cached at runtime with integrity verification. Run the codec in process, identify its npm package in help, and route the TASM Skill through the managed subcommand. Distribute the TASM Skill through agent-lynx, the Marketplace and the debug Plugin.
