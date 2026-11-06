# Lynx Skills documentation

The English and Chinese website guides for [agent-lynx](https://lynxjs.org/ai/agent-lynx/) and [Agent Skills](https://lynxjs.org/ai/skills/reactlynx-best-practices), maintained in `lynx-community/skills`. This single package ships MDX, conversation scenarios, shared React components, navigation, and interactive public resources. The website mounts the sections declared in `manifest.json`, following `@lynx-js/lynx-stack-docs`.

## Develop

From the workspace root:

```sh
pnpm --filter @lynx-js/skills-docs dev
```

Open `/ai/agent-lynx/` on the preview server and use the navigation to switch between agent-lynx and Skills. Chinese pages have a `/zh` prefix. Changes to pages, scenarios, and components reload directly from this package.

- Author pages and navigation under `content/<locale>/ai/agent-lynx/` or `content/<locale>/ai/skills/`, with `_meta.json` defining each section's sidebar.
- Keep conversation scenarios in the owning section's `_examples/` directory. Reuse components from `content/_ai/` through relative imports.
- Put public demos and downloads under `public/ai/<section>/` and declare their directories in `manifest.json`.
- Keep agent instructions (`SKILL.md` and references) in their owning skill packages. Website guides explain use cases, outcomes, and examples, and link to those sources.

Use relative Markdown links within and between the packaged sections, and full `https://lynxjs.org/…` URLs for other website sections. The website localizes those URLs when the target exists, then applies its normal dead-link check. Standalone previews keep the external URLs. Keep locale prefixes explicit on external links.

To preview inside a lynx-website checkout, run its `sync:skills-docs` script with this package directory as the source. Its `--watch` option updates the generated documents while the website dev server runs. Generated website files are not authoring sources.

## Validate and release

```sh
pnpm --filter @lynx-js/skills-docs build
pnpm --filter @lynx-js/skills-docs build:preview
pnpm --filter @lynx-js/skills-docs pack
```

The preview checks internal pages and anchors. Website integration additionally checks links to the rest of the site, Markdown exports, and the mounted public demos. Consumers need Rspress 2, React, `lucide-react`, and Less support to compile the shipped source components.

This package has one version independent of the CLI and individual skills. The agent-lynx section's `documentedCliVersion` records its CLI baseline. Unreleased feature previews may be kept outside the sidebar. Each section records its import revision from [lynx-website PR #1748](https://github.com/lynx-family/lynx-website/pull/1748) in `manifest.json`.

The website owns the AI landing page, overall section order, AGENTS.md guide, and MCP guides. Only the agent-lynx and Skills sections are supplied by this package.
