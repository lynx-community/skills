# Contributing to Lynx Agent Skills

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js 18+
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

3. Add the plugin to root `package.json`:

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

> [!WARNING]
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
