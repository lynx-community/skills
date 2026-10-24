# Lynx Community Skills contributor guide

This directory is a self-contained public workspace. Run commands from this root, using Node 24 and the pnpm version in [package.json](package.json). See [CONTRIBUTING.md](CONTRIBUTING.md) for package and release entry points.

## Documentation

- Keep README files focused on a brief human-readable introduction and setup; link further detail and avoid routine implementation updates.
- Published Skill docs serve agents outside this checkout. Keep triggers precise, resources portable and optional detail behind task-specific links.
- Contributor instructions should preserve non-obvious constraints and route to source, configuration, tests or command help instead of copying volatile implementation details.
- Follow `skill-creator` and [OpenAI's skill guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): include guidance that changes decisions, preserve the user's scope, and avoid generic tutorials, unnecessary fixed procedures or extra approval gates.

## Work and validation

Use the affected package's scripts for builds and tests; packages use different runners, including `node:test` and Rstest. Inspect the script before passing runner-specific flags. Run affected local tests and fix failures caused by the change without asking for approval between retries. Device/online suites need their configured environment and task authorization.

Run `pnpm lint` and `pnpm exec dprint check` before finishing. Connector has its own formatting configuration, included by the root lint script. Inspect packed output when exports, dependencies or shipped assets change.

Read the affected `tsconfig`, lint and format configuration for imports and style. Preserve license headers and use the current year for new source files; [rslint.config.mjs](rslint.config.mjs) defines the copyright rule. Keep `node:*` imports grouped separately and use existing workspace/catalog dependencies where appropriate.

For Connector changes, follow its scoped [architecture guide](packages/mcp-servers/devtool-connector/src/AGENTS.md) and transport instructions. Preserve shared connection ownership, cancellation and cleanup; local mocks do not prove device compatibility.

## Contribution boundaries

Submit PRs against `main`; `release` is the installation branch. Use Conventional Commits. Consult [.changeset/config.json](.changeset/config.json) and the owning release workflow for versioning; do not publish or change remote state merely to validate a local change.

Keep public source, documentation and package artifacts usable without private services or internal registry access. Preserve the existing hooks and the package-specific build/export paths.
