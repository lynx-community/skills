# List Sessions

List active debugging sessions for a connected Lynx client. Each session represents a LynxView or WebView context.

```bash
agent-lynx list-sessions [--client <clientId>]
```

## Options

- `-c, --client <clientId>`: Target client ID. Defaults to the first available client when omitted.

## Output

Prints a JSON array of sessions, including `session_id`, `type`, and `url`. Inspect `type` (for example `type: "web"` for a WebView) rather than inferring target type from the URL scheme alone; Lynx bundles can also use HTTP/HTTPS URLs. Refresh `list-sessions` after page navigation or reload.
