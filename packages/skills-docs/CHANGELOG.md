# @lynx-js/skills-docs

## 0.5.1

### Patch Changes

- Updated dependency `@rspress/core` to `2.1.4`.
- Expose Lynx Simulator in the agent-lynx and Skills guides, navigation, and CLI/Skill diagram. Add a complete page-env file preview to the BankCards illustration, using a shared component that follows the website's primary and secondary colors. Document startup options, extension packages, per-page extension data, runtime commands, and rendering options.
- Forward --simulator-window-background-color to windowless Lynx Simulator windows, pass --legacy-peer-deps for prerelease --lynxtron-version installs, and document default Lynxtron host behavior.
- Fix extra indentation in example conversation code blocks and keep their spacing consistent while syntax highlighting loads.

## 0.5.0

### Minor Changes

- Leave Skills navigation to the consuming website: `content/{en,zh}/ai/skills` no longer includes `_meta.json`. Website synchronizers must copy the guides without requiring package-supplied Skills navigation. The complete agent-lynx chapter retains its navigation.

### Patch Changes

- Keep the Skills architecture component compatible with ES2020 website type checking and use the active Rspress theme entry for CSS support prompts.

## 0.4.0

### Minor Changes

- Leave API docs, UI and trace introductions with the website, while publishing the complete agent-lynx chapter and guides maintained in this repository. Consumers must use the website's updated synchronization script to retain website-owned pages alongside package content. The package supplies content, resources and manifest metadata with document edit sources.

### Patch Changes

- Use `pnpx` for one-shot agent-lynx commands in the documentation, bundled skills, and Connector CLI guidance. Use `npm_config_registry` for registry overrides so the examples work on pnpm 10 and 11.
- Updated dependency `@rspress/core` to `2.1.3`.
- Fix the Skills diagram card thickness by connecting the right and bottom side faces to the front of each card.
- Add an interactive CLI and companion Skills diagram to the agent-lynx introduction, with the public catalog, dependency highlighting, zoom, and accessible Markdown output.
- Update the Android and Simulator examples to use the client IDs returned by current agent-lynx transports.
- Render reusable agent instructions as copyable Rspress Prompt cards in the getting-started, API docs, and CSS compatibility guides.
- Match interactive examples to the documentation theme, highlight conversation code, and improve the annotated screenshot layout.
- Organize app connections by platform and simplify Getting Started to the four commands for discovering and inspecting a page.
- Keep links between packaged guides on the current site and route links to other Lynx documentation to the corresponding site for each distribution.

## 0.3.0

### Minor Changes

- Remove the A2UI and OpenUI guides from the shared documentation package so the external website can own those pages independently.

## 0.2.0

No changes in this release.
