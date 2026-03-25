# Get Console

Capture console logs from the device.

```bash
node <path_to_the_skill>/scripts/index.mjs get-console [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
- `--offset <number>`: Skip N messages.
- `--limit <number>`: Limit number of messages.
- `--include-stack-traces`: Include stack traces for non-error messages.
- `--level <levels>`: Filter log levels (e.g., `error,warning`).
