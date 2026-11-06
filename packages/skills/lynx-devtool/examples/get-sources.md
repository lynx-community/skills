# Get Sources

List all parsed scripts. This is useful for finding script IDs to use with other commands (e.g., `Debugger.getScriptSource`). The command automatically fetches all currently loaded scripts.

```bash
agent-lynx get-sources [options]
```

- `-c, --client <clientId>`: (Optional) Client ID.
- `-s, --session <sessionId>`: (Optional) Session ID.

Completes on the successful second `Debugger.enable` response after collecting scripts, with timeout fallback. See [Get Sources](../references/get-sources.md) for details.
