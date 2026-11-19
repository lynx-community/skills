# Local Lynx Simulator

Manage daemon-owned Lynx Simulator processes. For complete `page-env.mjs` / `page-env.json` authoring, JSB/native extension packages, and local bundle verification workflows, load the `lynx-simulator` skill (`agent-lynx skills get lynx-simulator`).

```bash
agent-lynx simulator run [--ttl <duration>] [--jsb <pkg>] [--native-extension <pkg>] [--lynxtron-version <ver>]
agent-lynx simulator list
agent-lynx simulator get --client <clientId>
agent-lynx simulator logs --client <clientId> [--follow]
agent-lynx simulator wait --client <clientId> [--timeout <duration>]
agent-lynx simulator stop --client <clientId>
```

## Key Rules and Options

- Requires daemon mode (`--no-daemon` is rejected) on Linux x64 or macOS arm64/x64.
- First `simulator run` prepares public native dependencies; repeat `--jsb` or `--native-extension` to add packages.
- Always pass the returned `--client <clientId>` explicitly to `open` and subsequent commands.
- Durations (`--ttl`, `--timeout`) accept `ms`, `s`, `m`, or `h` (bare numbers are milliseconds; `wait --timeout` defaults to `60s` and does not stop the process on timeout).
- `simulator stop --client <clientId>` stops one instance; `daemon stop` stops all managed instances.
