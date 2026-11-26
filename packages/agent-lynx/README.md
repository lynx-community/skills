# agent-lynx

Agent-friendly CLI and typed Connector API for inspecting Lynx applications.

## Install and use

```sh
pnpx agent-lynx --help
pnpx agent-lynx skills list
pnpx agent-lynx skills get lynx-devtool
pnpx agent-lynx list-clients
pnpx agent-lynx snapshot
pnpx agent-lynx get-source-info @e1
```

The default device connection uses the public Connector daemon. Use `--no-daemon` for explicit direct Android, iOS, Desktop, or HDT access. Direct and daemon connections are mutually exclusive.

Commands include page discovery and opening, snapshots and ref actions, screenshots, console and source inspection, evaluation and CDP, ReactLynx, tracing, recording, and local daemon lifecycle. `app` forwards a caller-specified host protocol method; available methods depend on the host. No private transports or infrastructure are included.

Use `--json` or `AGENT_LYNX_FORCE_JSON=1` for commands which declare JSON output. A process host can set `AGENT_LYNX_INVOKED_AS` to customize help and recovery hints. Update notices use the public npm registry and can be disabled with `AGENT_LYNX_DISABLE_UPDATE_NOTICE=1`.

## Typed Connector API

```ts
import { createDefaultConnector } from 'agent-lynx/connector';

const connector = createDefaultConnector();
const clients = await connector.listClients();
```

The Connector dependency is resolved at runtime, not copied into the Agent bundle.

## Development

Use the repository's Node and pnpm versions:

```sh
pnpm run build
pnpm run test
```

Environment-sensitive tests are separate from unit tests. GitHub selects `test:e2e:public` against Lynxtron; Codebase may run the complete `test:e2e` entry. Real-device tests require an explicitly configured target.
