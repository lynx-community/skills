# @lynx-js/devtool-mcp-server

Inspect and control running Lynx apps from an MCP-compatible AI assistant.

## Requirements

- Node.js 18.19 or later.
- A reachable Lynx app with DevTool enabled.

## Setup

Add this configuration to your MCP client:

```json
{
  "mcpServers": {
    "lynx-devtool": {
      "command": "npx",
      "args": ["-y", "@lynx-js/devtool-mcp-server@latest"]
    }
  }
}
```

Then ask your assistant:

> List the connected Lynx pages and inspect the current page.

[Install in Cursor](https://cursor.com/en/install-mcp?name=lynx-devtool&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBseW54LWpzL2RldnRvb2wtbWNwLXNlcnZlckBsYXRlc3QiXX0%3D).

For programmatic integration, see the [contributor guide](https://github.com/lynx-community/skills/blob/main/CONTRIBUTING.md#mcp-integrations).

Inspired by [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp).
