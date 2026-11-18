# Open Page

Open a URL in the selected Lynx client.

```bash
agent-lynx open <url> [--client <clientId>]
```

## Options

- `<url>`: Target URL to open.
- `-c, --client <clientId>`: Target client ID. Defaults to the first available client when omitted.

## Output

Prints the `SessionList` response as JSON. Refresh `list-sessions` if you need the newly created session ID for follow-up commands.
