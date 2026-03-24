# Get Sources

List all parsed scripts. This is useful for finding script IDs to use with other commands (e.g., `Debugger.getScriptSource`). The command automatically fetches all currently loaded scripts.

```bash
node <path_to_the_skill>/scripts/index.mjs get-sources [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.
