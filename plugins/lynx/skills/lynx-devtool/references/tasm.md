# TASM Template Codec

Encode template JSON into a `.tasm` binary or decode a `.tasm` / `template.js` / `.bundle` binary into inspection JSON using the in-process `@lynx-js/tasm` WASM codec. Load the `lynx-tasm-codec` skill (`agent-lynx skills get lynx-tasm-codec`) for detailed workflow guidance.

```bash
agent-lynx tasm [--codec-version <version>] encode -i <input.json> -o <output.tasm> [--json]
agent-lynx tasm [--codec-version <version>] decode -i <input.tasm> -o <output.json> [--json]
```

## Options

- `-i, --input <path>`: Input file path (required). `encode` requires a non-array JSON object; `decode` reads a compiled template binary.
- `-o, --output <path>`: Output file path (required).
- `--codec-version <version>`: Exact `@lynx-js/tasm` version (ranges and `latest` are rejected). Downloaded on first conversion and cached with SHA-512 verification under `$AGENT_LYNX_TASM_CACHE_DIR` or `~/.cache/agent-lynx/tasm`.
- `-j, --json`: Print `{ operation, output, package, version }` as JSON to stdout instead of the human-readable stderr notice.

`tasm` runs locally and offline (after the codec version is cached) without starting the daemon or connecting to a device.
