# Library Usage

Use `scripts/connector.mjs` when you want to interact with Lynx DevTool from JavaScript instead of invoking the CLI.

These examples mirror the common workflow in `@lynx-js/devtool-connector`: initialize a connector, discover devices and clients, select a session, then issue CDP or App requests.

## What it exports

`<path_to_the_skill>/scripts/connector.mjs` re-exports:

- Everything from `@lynx-js/devtool-connector`
- Everything from `@lynx-js/devtool-connector/transport`
- Everything from `@lynx-js/devtool-connector/streams`

It also adds two convenience helpers:

- `createDefaultTransports()`
- `createDefaultConnector()`

These helpers use the same transport setup as the CLI entry.

## Example: create a connector and list clients

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const clients = await connector.listClients();

console.log(clients);
```

## Example: list devices, clients, and sessions

This is usually the first thing to do in a script so you can understand what targets are currently reachable.

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();

const devices = await connector.listDevices();
console.log("devices", devices);

const clients = await connector.listClients();
console.log("clients", clients);

if (clients.length === 0) {
  throw new Error("No Lynx clients found");
}

const sessions = await connector.sendListSessionMessage(clients[0].id);
console.log("sessions", sessions);
```

## Example: list sessions for a client

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

const sessions = await connector.sendListSessionMessage(client.id);

console.log(sessions);
```

## Example: call a CDP method

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

const [session] = await connector.sendListSessionMessage(client.id);

if (!session) {
  throw new Error("No Lynx sessions found");
}

const result = await connector.sendCDPMessage(
  client.id,
  session.session_id,
  "Runtime.evaluate",
  { expression: "2 + 2" },
);

console.log(result);
```

## Example: inspect the DOM tree for the active session

This matches the common DevTool flow of selecting the first available client/session and then fetching the document root.

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

const [session] = await connector.sendListSessionMessage(client.id);

if (!session) {
  throw new Error("No Lynx sessions found");
}

const document = await connector.sendCDPMessage(
  client.id,
  session.session_id,
  "DOM.getDocument",
  { depth: -1 },
);

console.log(document);
```

## Example: call an App method

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

await connector.sendAppMessage(client.id, "App.openPage", {
  url: "lynx://example/page",
});
```

## Example: open a page and then inspect the reloaded session

This is useful when a script needs to drive navigation before issuing CDP requests.

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

await connector.sendAppMessage(client.id, "App.openPage", {
  url: "lynx://example/page",
});

const sessions = await connector.sendListSessionMessage(client.id);
const latestSession = sessions.at(-1);

if (!latestSession) {
  throw new Error("No Lynx sessions found after App.openPage");
}

const pageInfo = await connector.sendCDPMessage(
  client.id,
  latestSession.session_id,
  "Page.getResourceTree",
);

console.log(pageInfo);
```

## Example: subscribe to runtime events with a CDP stream

Use the streaming APIs when you need event-style output, such as console events or other continuous protocol messages.

```js
import { createDefaultConnector } from "<path_to_the_skill>/scripts/connector.mjs";
import { ReadableStream } from "node:stream/web";

const connector = createDefaultConnector();
const [client] = await connector.listClients();

if (!client) {
  throw new Error("No Lynx clients found");
}

const [session] = await connector.sendListSessionMessage(client.id);

if (!session) {
  throw new Error("No Lynx sessions found");
}

const outputStream = await connector.sendCDPStream(
  client.id,
  session.session_id,
  ReadableStream.from([
    { method: "Runtime.enable" },
  ]),
);

try {
  for await (const message of outputStream) {
    console.log(message.method, message.params);
    break;
  }
} finally {
  await outputStream[Symbol.asyncDispose]();
}
```

## Example: construct transports manually

Use manual construction if you need to customize the transport list.

```js
import {
  AndroidTransport,
  Connector,
  DesktopTransport,
  iOSTransport,
} from "<path_to_the_skill>/scripts/connector.mjs";

const connector = new Connector([
  new AndroidTransport({ host: "127.0.0.1", port: 5037 }),
  new DesktopTransport(),
  new iOSTransport(),
]);
```
