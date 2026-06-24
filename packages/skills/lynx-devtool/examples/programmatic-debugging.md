# Programmatic Debugging

This example shows a realistic JavaScript workflow using `<path_to_the_skill>/scripts/connector.mjs` instead of the CLI.

It follows the same steps you would take manually:

1. Create a connector with the default transports.
2. Discover devices, clients, and sessions.
3. Pick a session.
4. Send CDP and App commands directly.

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();

const devices = await connector.listDevices();
console.log("devices", devices);

const clients = await connector.listClients();
if (clients.length === 0) {
  throw new Error("No Lynx clients found");
}

const client = clients[0];
console.log("client", client);

const sessions = await connector.sendListSessionMessage(client.id);
if (sessions.length === 0) {
  throw new Error("No Lynx sessions found");
}

const session = sessions.at(-1);
if (!session) {
  throw new Error("No Lynx sessions found");
}

const document = await connector.sendCDPMessage(
  client.id,
  session.session_id,
  "DOM.getDocument",
  { depth: 1 },
);

console.log("document", document);

const evaluation = await connector.sendCDPMessage(
  client.id,
  session.session_id,
  "Runtime.evaluate",
  { expression: "globalThis.location?.href ?? 'unknown'" },
);

console.log("evaluation", evaluation);

await connector.sendAppMessage(client.id, "App.openPage", {
  url: "lynx://example/page",
});
```

## When to use this pattern

- You want to reuse one connector across multiple operations.
- You need conditional logic that is awkward to express with shell commands.
- You are building a higher-level tool on top of Lynx DevTool.

## Related references

- [Library Usage Reference](../references/library-usage.md)
- [Supported CDP Methods](../references/cdp/index.md)
- [Supported App Methods](../references/app/index.md)
- [Programmatic Touch: Click and Double Click](./programmatic-touch-click-and-double-click.md)
