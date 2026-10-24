# Contributing to Lynx Agent Skills

Submit changes against `main`. The `release` branch contains installable Marketplace output.

## Setup

Use Node 24 and the pnpm version pinned in [package.json](package.json):

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm turbo build
pnpm run build
```

`turbo build` builds workspace packages; the root build exports the Marketplace. For a focused change, use the affected package's build and test scripts.

## Skills and Plugins

- Skills live in `packages/skills/` and use `@lynx-js/skill-*` names. Declare the payload in the package's `files`; agents need `SKILL.md` and any referenced resources, not a checkout of this repository.
- Plugins live in `packages/plugins/` and use `@lynx-js/ai-plugin-*` names. Declare Skill dependencies and use the existing builder for generated manifests and aggregated payloads.
- Root [dependencies](package.json) select the Skills and Plugins exported to `release`. Use an existing package with the same delivery mode as a starting point, then inspect the [Plugin builder](packages/cmd/build-plugin/src/main.ts), [Marketplace builder](packages/cmd/build-marketplace/src/main.ts) and [Skill exporter](export-skills.mjs) for current behavior.
- Keep eval definitions outside the exported agent instructions. See [scripts/skill-eval](scripts/skill-eval) and the affected Skill's eval fixtures for the supported layout and checks.

Keep README files brief. Follow [AGENTS.md](AGENTS.md) for writing guidance, local constraints and validation. Do not hand-edit generated files or copy a full manifest/tool inventory into documentation.

## MCP integrations

For programmatic DevTool MCP integration, start with the [public exports](packages/mcp-servers/devtool-mcp-server/src/index.ts) and [tool registration](packages/mcp-servers/devtool-mcp-server/src/registerTool.ts). Reuse `coreTools` with `registerToolWithContext` for a custom context, or `setupServer` for the shared daemon. Context factories run once per call, including concurrent calls; keep product-specific transports and telemetry in the integration. The [package manifest](packages/mcp-servers/devtool-mcp-server/package.json) defines peers: Zod 4 is required, while the MCP SDK is optional for programmatic consumers and bundled by the stdio command.

## Validation and release

Run affected package tests, `pnpm lint` and `pnpm exec dprint check`. Check [package scripts](package.json) and the affected package's manifest for runner and build choices. Device and online evals require a configured environment; report what actually ran.

For changes to published packages, record release intent through the project's Changesets workflow. Read [.changeset/config.json](.changeset/config.json) and the [GitHub workflows](.github/workflows) for current versioning, synchronization and release behavior. Do not publish packages as part of validation.
