# Agent Lynx

Agent-friendly CLI and typed Connector API for inspecting Lynx applications.

## Install and use

```sh
npx --yes agent-lynx --help
npx --yes agent-lynx skills list
npx --yes agent-lynx skills get lynx-devtool
npx --yes agent-lynx list-clients
npx --yes agent-lynx snapshot
npx --yes agent-lynx get-source-info @e1
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

## Composable CLI API

`agent-lynx/cli` exports the public program factory, root-command lifecycle, command registrations, skill readers, and output helpers. Product entrypoints can register their own commands and supply their own Connector context without copying the common command implementations.

```ts
import { createProgram } from 'agent-lynx/cli';

const program = createProgram({
  cliPlaceholder: 'my-tool lynx',
  telemetry: (code, data) => { console.error('event', code, data); },
});
await program.parseAsync(process.argv);
```

Telemetry is optional, best-effort, and scoped to an invocation. There is no default reporter or monitoring SDK. For a custom program, `createRootCommand(context, telemetry)` preserves the original action error and closes the transports supplied in its context on success or failure. The caller owns transport setup and command-client configuration.

`registerSkillsCommand(program, { skillRoots })` reads an explicit set of skill payloads. Each product should select its own package's direct Skill dependencies; shared CLI code does not recursively discover skills through other Agent packages. Skill Markdown remains independently maintained and is not composed through code includes.

## Development

Use the repository's Node and pnpm versions:

```sh
pnpm run build
pnpm run test
```

Environment-sensitive tests are separate from unit tests. GitHub selects `test:e2e:public` against EmbeddedLynx; Codebase may run the complete `test:e2e` entry. Real-device tests require an explicitly configured target.
