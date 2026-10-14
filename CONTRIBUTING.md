# Contributing to Lynx Agent Skills

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js 24 (repository tooling and tests)
- pnpm 10+

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd skills

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Project Structure

```
├── packages/
│   ├── cmd/                    # Build tools
│   │   ├── build-plugin/
│   │   └── build-marketplace/
│   ├── tools/
│   ├── skills/                 # Skill packages
│   └── plugins/                # Plugin packages
├── package.json                # Marketplace root
└── pnpm-workspace.yaml
```

## Creating a Skill

1. Create a directory under `packages/skills/`:

```bash
mkdir -p packages/skills/my-skill
```

2. Add `package.json`:

```json
{
  "name": "@lynx-js/skill-my-skill",
  "version": "1.0.0",
  "type": "module",
  "files": [
    "SKILL.md",
    "scripts",
    "references",
    "examples",
    "reference.md",
    "examples.md"
  ],
  "scripts": {
    "build": "rslib build"
  },
  "devDependencies": {
    "@rslib/core": "catalog:rstack"
  }
}
```

3. Create `SKILL.md` describing what the skill does.

4. (Optional) Add scripts in `src/` with `rslib.config.ts` for TypeScript compilation.

5. (Optional, recommended) Add the skill to root `package.json` if you need this skill in the release branch (final artifact):

```json
{
  "dependencies": {
    "@lynx-js/skill-my-skill": "workspace:*"
  }
}
```

## Creating a Plugin

1. Create a directory under `packages/plugins/`:

```bash
mkdir -p packages/plugins/my-plugin
```

2. Add `package.json`:

```json
{
  "name": "@lynx-js/ai-plugin-my-plugin",
  "private": true,
  "version": "0.1.0",
  "description": "My Plugin",
  "type": "module",
  "files": [
    ".claude-plugin",
    "commands",
    "agents",
    "skills",
    "scripts",
    "hooks",
    ".mcp.json",
    ".lsp.json"
  ],
  "scripts": {
    "build": "build-plugin"
  },
  "dependencies": {
    "@lynx-js/skill-my-skill": "workspace:*"
  },
  "devDependencies": {
    "build-plugin": "workspace:*"
  },
  "claudePlugin": {
    "category": "development"
  }
}
```

3. (Optional, recommended) Add the plugin to root `package.json` if you need this plugin in the release branch (final artifact):

```json
{
  "dependencies": {
    "@lynx-js/ai-plugin-my-plugin": "workspace:*"
  }
}
```

## Build Commands

```bash
# Build everything
pnpm build

# Build a specific package
pnpm -F @lynx-js/skill-reactlynx-best-practices build

# Run tests
pnpm -F @lynx-js/skill-reactlynx-best-practices test
```

## Naming Conventions

| Type   | Pattern                | Example                                   |
| ------ | ---------------------- | ----------------------------------------- |
| Skill  | `@lynx-js/skill-*`     | `@lynx-js/skill-reactlynx-best-practices` |
| Plugin | `@lynx-js/ai-plugin-*` | `@lynx-js/ai-plugin-reactlynx`            |

## How It Works

This project uses pnpm workspaces to manage Skills and Plugins:

- **Skills** are reusable packages containing `SKILL.md` and optional scripts
- **Plugins** depend on Skills and bundle them during build
- **Build tools** (`build-plugin`, `build-marketplace`) handle metadata generation and file aggregation

The build process:

1. Compiles TypeScript scripts via rslib
2. Copies dependent Skills into the plugin's `skills/` directory
3. Generates `.claude-plugin/plugin.json` metadata

## Release Process

> [!IMPORTANT]
> Pull requests must target the `main` branch, not the `release` branch.

When code is merged to `main`:

1. CI builds all packages
2. Artifacts are pushed to the `release` branch
3. Only `plugins/`, `skills/`, `.claude-plugin/`, and `README.md` are kept on `release`

## Escape Hatch

For simple cases without TypeScript, you can bypass the build system:

```bash
# Force-add ignored build artifacts
git add -f packages/plugins/my-plugin/.claude-plugin/
git add -f packages/skills/my-skill/scripts/
```

> **Note**: Don't mix manual and build-managed files in the same package.

## Questions?

Open an issue or reach out to the maintainers.

## Code quality

Run `pnpm lint` for Rslint recommended rules and copyright headers through
`eslint-plugin-headers`, and `pnpm exec dprint check` for formatting.
Use `pnpm exec rslint --config rslint.config.mjs --fix .` to fix lint issues and
`pnpm exec dprint fmt` to format files. Keep `node:*` imports in the first group,
separated from other imports by a blank line so dprint sorts each group separately.
Husky runs nano-staged on changed files, including package manifest sorting.

The ESLint migration retains the TypeScript recommended preset, copyright rule
options, existing `eslint-disable` directives, and lint-specific exclusions.
Rslint reads `.gitignore` directly and provides the Node globals used by the config.
dprint handles formatting for the other file types; it does not replace Biome's
CSS or JSON lint rules.
The Connector keeps its package-local dprint configuration; `pnpm lint` also
runs its `format:check`, and staged Connector files use that configuration.
