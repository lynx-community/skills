# Lynx DevTool Connector

Discover Lynx apps and send debugging requests from Node.js. Requires Node.js 18.19 or later and a reachable Lynx app with DevTool enabled.

## Install

```bash
npm install @lynx-js/devtool-connector
```

## Quick start

```ts
import { Connector } from "@lynx-js/devtool-connector";
import { DaemonTransport } from "@lynx-js/devtool-connector/transport";

const connector = new Connector([new DaemonTransport()]);
const [client] = await connector.listClients();
if (!client) throw new Error("No Lynx app found");
const [session] = await connector.sendListSessionMessage(client.id);
if (!session) throw new Error("No Lynx page found");
console.log(
  await connector.sendCDPMessage(
    client.id,
    session.session_id,
    "DOM.getDocument",
    { depth: 1 },
  ),
);
```

Select the intended app and page when several are connected. The default daemon shares persistent device connections across callers.

Contributor constraints and source entry points live in [AGENTS.md](https://github.com/lynx-community/skills/blob/main/packages/mcp-servers/devtool-connector/src/AGENTS.md).
