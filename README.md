# Lynx Agent Skills

A collection of [Agent skills](https://agentskills.io/) for [Lynx](https://lynxjs.org).

## Available Skills

- [reactlynx-best-practices](./packages/skills/reactlynx-best-practices): ReactLynx dual-thread best practices, static analysis, and auto-fixes.
- [lynx-debug-info-remapping](./packages/skills/lynx-debug-info-remapping): Remap `function_id:pc_index` runtime errors to original source positions with `debug-info.json`.
- [lynx-devtool](./packages/skills/lynx-devtool): Inspect and debug Lynx apps through DevTool CLI, CDP/App commands, console logs, sources, and screenshots.
- [lynx-trace-analysis](https://www.npmjs.com/package/@lynx-js/skill-lynx-trace-analysis): Analyze Lynx traces to diagnose loading, rendering, smoothness, and native module performance issues.
- [lynx-trace-record](https://www.npmjs.com/package/@lynx-js/skill-lynx-trace-record): Record Lynx performance traces from connected clients for later analysis.
- [lynx-typescript](./packages/skills/lynx-typescript): Configure and fix common Lynx TypeScript issues around environment setup, events, components, and ReactLynx.
- [lynx-ui](https://www.npmjs.com/package/@lynx-js/skill-lynx-ui): Use lynx-ui component references for component selection, props, examples, and usage troubleshooting.

## Installation

```bash
npx skills add lynx-community/skills
```

## Contributing

> [!IMPORTANT]
> Pull requests must target the `main` branch, not the `release` branch.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, project structure, and guidelines on creating new skills and plugins.

## Credits

Thanks to:

- [Anthropic Skills](https://github.com/anthropics/skills) for creating the Agent Skills standard and providing excellent skill examples that inspired this project's structure and patterns.
- [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for inspiring the rule-based skill structure and providing comprehensive React performance optimization guidelines for the web ecosystem.
- [Vercel Skills CLI](https://github.com/vercel-labs/skills) for providing the open agent skills CLI that helps distribute skills across coding agents.
