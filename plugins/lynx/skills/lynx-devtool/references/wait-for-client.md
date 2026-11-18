# Wait For Client

Poll until a matching Lynx DevTool client becomes available.

```bash
agent-lynx wait-for-client [--client-name <name>] [--timeout <seconds>] [--interval <seconds>]
```

## Options

- `--client-name <name>`: Package or app name to match against `AppProcessName`, `bundleId`, `bundleName`, or `App`. Returns all matching clients. When omitted, returns on the first discovered client.
- `--timeout <seconds>`: Maximum wait time in **seconds** (non-negative number). Defaults to `30`.
- `--interval <seconds>`: Polling interval in **seconds** (non-negative number). Defaults to `1`.

## Output

Prints the final matching client array as JSON. Note that `--timeout` and `--interval` use **seconds** here, whereas the page-level `wait` command uses milliseconds.
