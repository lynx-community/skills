# agent-lynx documentation

The English and Chinese guides for [agent-lynx](https://lynxjs.org/ai/agent-lynx/), maintained alongside its implementation. This package ships MDX, conversation scenarios, React components, navigation, and interactive public resources. The website mounts the sections declared in `manifest.json`, following `@lynx-js/lynx-stack-docs`.

## Develop

From the workspace root:

```sh
pnpm --filter @lynx-js/agent-lynx-docs dev
```

Open `/ai/agent-lynx/` or `/zh/ai/agent-lynx/` on the preview server. Changes to pages, scenarios, and components reload directly from this package. Add pages and navigation in each locale's `content/<locale>/ai/agent-lynx/_meta.json`. Public demos live in `public/ai/agent-lynx`.

Use relative Markdown links within the section and full `https://lynxjs.org/…` URLs for other website sections. The website localizes those URLs when the target exists, then applies its normal dead-link check. Standalone previews keep the external URLs. Keep locale prefixes explicit on external links.

To preview inside a lynx-website checkout, run its `sync:agent-lynx-docs` script with this package directory as the source. Its `--watch` option updates the generated documents while the website dev server runs. Generated website files are not authoring sources.

## Validate and release

```sh
pnpm --filter @lynx-js/agent-lynx-docs build
pnpm --filter @lynx-js/agent-lynx-docs build:preview
pnpm --filter @lynx-js/agent-lynx-docs pack
```

The preview checks internal pages and anchors. Website integration additionally checks links to the rest of the site, Markdown exports, and the mounted public demos. Consumers need Rspress 2, React, `lucide-react`, and Less support to compile the shipped source components.

Include a changeset for documentation changes. The docs package versions independently of the CLI; `documentedCliVersion` records the public CLI baseline. Unreleased feature previews may be kept outside the sidebar. The initial import preserves [lynx-website PR #1748](https://github.com/lynx-family/lynx-website/pull/1748); `manifest.json` records its source commit.
