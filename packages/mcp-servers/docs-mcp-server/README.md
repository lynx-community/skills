# @lynx-js/docs-mcp-server

Give an MCP-compatible AI assistant access to Lynx documentation.

## Requirements

- Node.js 22.18.0 or later in the Node 22 line, or Node.js 24 or later.
- Network access to https://lynxjs.org/next/ and a client that supports MCP resources.

## Setup

Add this configuration to your MCP client:

```json
{
  "mcpServers": {
    "lynx-docs": {
      "command": "npx",
      "args": ["-y", "@lynx-js/docs-mcp-server@latest"]
    }
  }
}
```

Then ask your assistant:

> Read `lynx-docs://llms.txt`, then use the linked documentation to answer my Lynx question.

For command options, run `npx -y @lynx-js/docs-mcp-server@latest --help`.

If the client does not follow server instructions automatically, include the resource request with your question.

Inspired by the [Svelte MCP server](https://svelte.dev/docs/mcp/overview).
