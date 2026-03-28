# Agent Instructions for Lynx Community Skills Repository

Welcome to the Lynx Community Skills monorepo! This repository is designed to host and manage various AI agent skills, plugins, and tools for the Lynx ecosystem.

When operating within this codebase, AI coding agents MUST strictly adhere to the following rules, commands, and conventions.

---

## 🏗️ 1. Build, Lint, and Test Commands

This project is a monorepo managed by `pnpm` (workspaces) and `Turbo`.

### General Commands (Run from Root)
*   **Install Dependencies:** `pnpm install`
*   **Build Everything:** `pnpm build` (Executes `turbo build` and marketplace scripts)
*   **Check Formatting & Linting (Dry Run):** `pnpm check` (Executes `biome check && eslint .`)
*   **Fix Formatting & Linting:** `pnpm lint` (Executes `eslint . --fix && biome check --write`)
*   **Run All Tests:** `pnpm test` (Executes `pnpm -r --if-present test`)

### Running Specific Tests
Tests are written using `@rstest/core` (which uses a syntax similar to Jest/Vitest).

*   **Test a Specific Package:**
    ```bash
    pnpm --filter <package-name> test
    # Example: pnpm --filter @lynx-js/skill-reactlynx-best-practices test
    ```
*   **Run a Single Test File or Case:**
    Since `rstest` is used under the hood, to run a specific test file or a specific test case within a package, you can typically use:
    ```bash
    pnpm --filter <package-name> test -- <path-to-test-file> -t "test case name"
    ```
    Alternatively, navigate to the specific package directory and run its test script. If debugging tests, `rstest` output is standard terminal output.

---

## 🎨 2. Code Style & Conventions

### 2.1. Mandatory Copyright Headers
**CRITICAL:** Every new source file MUST begin with the following copyright and license header. This is strictly enforced by `eslint-plugin-headers`. Your PRs will fail CI if this is missing.

```typescript
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
```
*(Note: Replace 2026 with the current year for newly created files).*

### 2.2. TypeScript and Typing
*   **Strict Mode:** The project runs with strict TypeScript compilation (`"strict": true`, `"noUncheckedIndexedAccess": true`).
*   **Type Imports:** Use explicit type imports and exports (`"verbatimModuleSyntax": true`).
    *   *Good:* `import type { Skill } from './types';`
    *   *Bad:* `import { Skill } from './types';` (when only using it as a type)
*   **No Implicit Returns:** All code paths in a function must return a value if a return type is defined.
*   **Module Resolution:** The project uses `NodeNext`/`Node16` module resolution. Ensure your imports are compatible with this ecosystem (e.g., handling `.js` extensions in imports if required by the target environment).

### 2.3. Formatting and Linting
*   **Tooling:** We use **Biome** for fast formatting/linting and **ESLint** (v9 Flat Config) for complex AST/TypeScript rules.
*   **Indentation & Quotes:** Use `space` indentation (2 spaces) and `single` quotes for JavaScript/TypeScript strings.
*   **Auto-Organization:** Biome automatically organizes imports (`organizeImports: true`). Let the formatter do the work when saving or running `pnpm lint`.
*   **Pre-commit Hooks:** Husky and lint-staged are configured to automatically lint and format changed files before commits. Do not bypass these hooks unless strictly necessary.

### 2.4. Naming Conventions
*   **Files & Directories:** Use `kebab-case` for file and directory names (e.g., `reactlynx-best-practices`, `format-scan-report.ts`).
*   **Classes/Interfaces:** Use `PascalCase` (e.g., `ReactLynxWorkflow`, `ScanReport`).
*   **Functions/Variables:** Use `camelCase` (e.g., `formatFixPlan`, `runSkillWithFixes`).
*   **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `WORKFLOW_GUIDE`).

### 2.5. Error Handling
*   **No Silent Failures:** Catch errors specifically and either handle them properly or re-throw them with additional context.
*   **Return Objects:** When building workflow APIs or skills, prefer returning objects containing success states and data/errors (e.g., `{ success: true, data: ... }` or `{ diagnostics, fixed }`) rather than throwing raw exceptions for expected failures.
*   **Logging:** If a skill or command fails, ensure the failure cause is clearly reported to the user (via CLI output or diagnostic arrays).

### 2.6. Package Architecture
*   **Workspaces:** The repository is divided into logical workspaces:
    *   `packages/skills/*`: Contains the standalone agentic skills.
    *   `packages/plugins/*`: Contains AI agent plugins (e.g., ReactLynx, Lynx Debug).
    *   `packages/tools/*`: Shared internal tooling (e.g., trace-processor).
    *   `packages/cmd/*`: CLI tools for the repository.
*   **Dependencies:** When adding a dependency from within the workspace, use the workspace protocol: `"@lynx-js/some-package": "workspace:*"`.
*   **Catalogs:** We use pnpm catalogs for centralized dependency management. Example: `"@rsbuild/core": "catalog:rstack"`.

---

## 🤖 3. Agent Operating Procedures

As an autonomous coding agent working in this repository, you must:

1.  **Understand Before Acting:** Always use your search/grep tools to read related configuration, type definitions, and neighboring files before creating or modifying code.
2.  **Match Surrounding Style:** The existing code is the source of truth. If you see a specific pattern for testing or error handling, duplicate that pattern.
3.  **Use Absolute Paths:** When using file editing tools, ALWAYS construct the absolute path by combining the repo root with the relative path.
4.  **Verify Your Work:** Do not assume your code works. If you make a logic change, run `pnpm check` or `pnpm lint` to ensure you haven't broken the formatting or types. If you edit a package, run its tests.
5.  **No Extraneous Comments:** Keep comments strictly focused on *why* complex logic exists. Do not add chatty "I am doing X" comments.
6.  **Avoid Interactive Commands:** Never run `npm init`, `git rebase -i`, or similar interactive commands that can hang the terminal.
7.  **Commit Messages:** If making commits, provide clear and concise messages that indicate the nature of the change (e.g., `feat: add new scan rule to reactlynx`, `fix: handle edge case in trace processor`).
8.  **Dependencies:** Ensure you do not arbitrarily add new libraries if existing ones in the monorepo can do the job. Always verify in `package.json` first.
9.  **Pull Requests (CRITICAL):** The default branch of the `lynx-community/skills` GitHub repository is `release`, but active development happens on the `main` branch. **When submitting a PR, you MUST specify `main` as the base branch** (e.g., `gh pr create --base main ...`). Do not submit PRs targeting `release` unless explicitly instructed.

