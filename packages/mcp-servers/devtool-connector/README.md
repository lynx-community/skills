# Lynx DevTool Connector

`@lynx-js/devtool-connector` is the standalone device and command layer shared by public and internal Lynx tools. It supports Android, iOS, Desktop, Peertalk, HDT and a persistent loopback daemon. Use Node 22.12+ or Node 24 for source development.

```ts
import { Connector } from "@lynx-js/devtool-connector";
import { HttpCommandClient } from "@lynx-js/devtool-connector/command";
import { DaemonTransport } from "@lynx-js/devtool-connector/transport";

const connector = new Connector([new DaemonTransport()]);
const clients = await connector.listClients();
const client = clients[0];
if (!client) throw new Error("No Lynx clients found");
const commands = new HttpCommandClient();
const sessions = await commands.execute("list-sessions", {
  clientId: client.id,
});
```

The daemon owns physical connections; requests subscribe to them rather than opening a competing DebugRouter connection. Successful daemon/HDT discovery, including an empty result, is authoritative. Lifecycle conflicts never fall back to direct connections.

## Product adapters

The public exports include `DaemonLifecycle`, `DevtoolDaemon`, `StaticServer`, `InspectorAssetProvider` and `DebugMetadataLoader`. A product may subclass the lifecycle to resolve its own entry and environment, bind its own daemon identity/command core/assets, and override the command client's and daemon transport's protected lifecycle method. An asset provider that implements the optional `createDevtoolsFrontendResponse` serves a Chrome DevTools frontend under `/chrome-devtools-frontend/`; `TarballCache` takes the tar path prefix of the files to keep. HDT uses the shared implementation directly; it needs no discovery policy injection.

`ActionCore` accepts a metadata loader; source-info acquisition, caching and remapping remain shared. Android adapters may override `getKnownApp` for product-specific labels and activity names. Private integrations are not required to install or run this package.

The GET/OPTIONS version endpoint allows arbitrary origins (`*`) for discovery. Command, shutdown and WebSocket control remain restricted to same-origin loopback requests; the one exception is that `/devtool/connector/cdp` also accepts the `devtools://devtools` origin of the DevTools bundled with Chrome. The public Inspector uses the public Lynx DevTool frontend; it does not advertise the internal browser Preview protocol.

## CDP gateway

`/devtool/connector/cdp?clientId=<id>&sessionId=<n>` speaks standard CDP for one Lynx session, so an unmodified Chrome DevTools frontend attaches when its `ws` query parameter is the URL-encoded `127.0.0.1:21783/devtool/connector/cdp?clientId=…&sessionId=…`. A page that shows the device screen opens `/devtool/connector/cdp-host?clientId=<id>&view=<id>` and adds the same random `view` to its frontend's CDP URL. It then sends `pick`, `clear-highlight`, `cancel-inspect` and `video-size` messages in video pixels, and receives `inspect-mode`, `highlight` and `open-session`, so elements are picked and highlighted on its video instead of on the App.

## Migration from 0.13.2

The implementation now includes the 0.16.2 command, ReactLynx, lifecycle and HDT capabilities. Existing source export paths remain available. `DaemonManager` is now the default `DaemonLifecycle` instance (its `ensureRunning`/`kill` call shape is unchanged). Product adapters should extend `DaemonLifecycle`, not duplicate the manager. Daemon metadata's `product` is a string and `browserPreviewProtocol` is optional because it describes actual product capability.

## Development

Run `pnpm build`, `pnpm test` and `pnpm format:check` in this package. Tests use `node:test`; device-independent tests are in `test/`, explicitly configured device tests in `e2e/`. The package retains its imported dprint source style to keep mechanical moves reviewable; the rest of the public repository uses Biome.
