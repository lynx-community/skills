# @lynx-js/devtool-connector

`@lynx-js/devtool-connector` provides low-level connectivity for Lynx DevTool. It unifies transport layers for Android / iOS / Desktop, and exposes stable request APIs (such as `CDP`, `App`, and `ListSession`).

It can be used as a TypeScript library in higher-level services like `devtool-mcp-server`.

## Requirements

- Node.js >= 18.19
- At least one available device channel:
  - Android: ADB (default `127.0.0.1:5037`)
  - iOS: usbmuxd
  - Desktop: local `127.0.0.1` port

## Installation

```bash
pnpm add @lynx-js/devtool-connector
```

## Library usage

### 1) Initialize Connector

```ts
import { Connector } from "@lynx-js/devtool-connector";
import { DaemonTransport } from "@lynx-js/devtool-connector/transport";

const transports = [
  new DaemonTransport(),
];

const connector = new Connector(transports);
```

Use `DaemonTransport` as the default transport. It automatically manages a local daemon process and reuses stable device connections, so it should be the primary path for client discovery and follow-up requests.

Add other transports only when you need fallback behavior for environments where the daemon is unavailable or cannot discover a target client. When fallback transports are present, `Connector` tries daemon-backed clients first, then the remaining direct platform transports.

Fallback example:

```ts
import { Connector } from "@lynx-js/devtool-connector";
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  iOSTransport,
} from "@lynx-js/devtool-connector/transport";

const connector = new Connector([
  new DaemonTransport(),
  new AndroidTransport(),
  new iOSTransport(),
  new DesktopTransport(),
]);
```

### 2) List devices, clients, and sessions

```ts
const devices = await connector.listDevices();
const clients = await connector.listClients();

if (clients.length === 0) {
  throw new Error("No available clients found");
}

const clientId = clients[0].id;
const sessions = await connector.sendListSessionMessage(clientId);
```

### 3) Send CDP / App requests

```ts
const sessionId = sessions[0]?.session_id;
if (!sessionId) {
  throw new Error("No session found");
}

const dom = await connector.sendCDPMessage(
  clientId,
  sessionId,
  "DOM.getDocument",
  { depth: -1 },
);

const mainThreadEval = await connector.sendCDPMessage(
  clientId,
  sessionId,
  "Runtime.evaluate",
  { expression: "2 + 2" },
  // isMainThread
  true,
);

await connector.sendAppMessage(clientId, "App.openPage", {
  url: "https://lynxjs.org",
});
```

Pass `true` as the optional `isMainThread` argument to target the main-thread VM. Main-thread CDP requests currently support only `Debugger.*`, `Runtime.*`, `HeapProfiler.*`, and `Profiler.*` methods.

### 4) Streaming APIs (advanced)

The connector also supports streaming send/receive:

- `sendCDPStream(...)`
- `sendStream(...)` (custom pipeline)

These APIs are useful for subscription-style logs, continuous requests, or protocol debugging.

When you finish consuming the returned stream, make sure to close it (dispose the output stream) to release the underlying connection.

Example: consume CDP events with `for await...of`

```ts
import { ReadableStream } from "node:stream/web";

await using outputStream = await connector.sendCDPStream(
  clientId,
  sessionId,
  ReadableStream.from([
    { method: "Runtime.enable" },
  ]),
);

for await (const message of outputStream) {
  // `sendCDPStream` yields CDP events, e.g. { method: "Runtime.consoleAPICalled", params: ... }
  console.log(message.method, message.params);
  break;
}
```

## Exported entry points

- `@lynx-js/devtool-connector`: `Connector`, `ClientId`, and protocol transform streams
- `@lynx-js/devtool-connector/transport`: platform transport implementations and type definitions
- `@lynx-js/devtool-connector/test-with-client`: helper for integration tests with real clients

## Debugging

Use the `debug` namespace to inspect connection/protocol send-receive details while running code that imports this package:

```bash
DEBUG=devtool-mcp-server:connector* node ./your-script.mjs
```

## Known limitations

- USB-based iOS transport (`iOSTransport`) still does not implement `listAvailableApps` / `openApp`.
- `listClients()` has snapshot semantics: each call re-scans ports and re-validates clients via handshake.
