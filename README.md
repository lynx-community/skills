# Lynx Agent Skills

A collection of skills for AI coding agents working with [Lynx](https://lynxjs.org) applications.

Skills follow the [Agent Skills](https://agentskills.io/) format — packaged instructions, scripts, and resources that extend agent capabilities.

## Available Skills

### reactlynx-best-practices

ReactLynx best practices covering dual-thread architecture and React patterns. Provides rules reference for writing, static analysis for reviewing, and auto-fix for refactoring.

**Use when:**
- Writing new ReactLynx components or applications
- Reviewing existing ReactLynx code for issues
- Refactoring ReactLynx code with auto-fixes

**Rules covered:**

| Rule | Impact | Description |
|------|--------|-------------|
| `detect-background-only` | Critical | Native APIs in background contexts |
| `proper-event-handlers` | Medium | Correct event handler usage |
| `main-thread-scripts-guide` | Medium | Main thread scripts guide |
| `hoist-static-jsx` | Low | Performance optimization |

### debug-info-remapping

Remap Lynx main-thread runtime error positions to original source code locations using debug info.

**Use when:**
- Debugging main thread runtime errors with `function_id:pc_index` format
- Working with Lynx bytecode stack traces
- Need to locate the actual source position from encoded error messages

## Installation

```bash
npx skills add lynx-family/skills
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, project structure, and guidelines on creating new skills and plugins.

## Credits

Thanks to:

- [Anthropic Skills](https://github.com/anthropics/skills) for creating the Agent Skills standard and providing excellent skill examples that inspired this project's structure and patterns.
- [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for inspiring the rule-based skill structure and providing comprehensive React performance optimization guidelines for the web ecosystem.
- [Vercel Skills CLI](https://github.com/vercel-labs/skills) for providing the open agent skills CLI that helps distribute skills across coding agents.
