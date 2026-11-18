# Inspect in Browser

Print the local DevTool inspector URL served by the connector daemon for the selected client and session.

```bash
agent-lynx inspect [-c <clientId>] [-s <sessionId>] [--port <port>]
```

## Options

- `-c, --client <clientId>`: Target client ID.
- `-s, --session <sessionId>`: Target session ID.
- `--port <port>`: Loopback daemon port (default `21783`).

## Output

Prints `http://127.0.0.1:<port>/devtool/connector/inspector?clientId=<clientId>&sessionId=<sessionId>`. Open the URL in a browser to attach the graphical DevTool inspector to the same session.
