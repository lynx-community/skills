# Lynx UI Skill Design

- Date: 2026-05-24
- Status: Proposed
- Scope: Design spec for a new `@lynx-js/skill-lynx-ui` package
- Repository context: This repo distributes skills from `packages/skills/*`. The skill should be designed on `main` and packaged in a repo-native way.

## 1. Goal

Create a single installable Lynx UI skill package with one public entry skill, `lynx-ui`, that helps AI coding agents use the official Lynx UI library correctly in ReactLynx projects.

The skill should optimize for:
- correct setup and adoption of Lynx UI in existing projects
- correct generation of Lynx UI-based flows and components
- use of official Lynx UI documentation as the primary source of truth
- minimal, safe adaptation of official snippets into the user’s codebase
- ReactLynx-appropriate guidance rather than generic React guidance

The skill should not be organized as one skill per component.

## 2. Why this shape

This design follows the strongest patterns observed in external references:
- **shadcn/ui**: one install surface with modular internal guidance
- **Mantine**: scoped guidance by workflow/subsystem rather than per component
- **MUI**: prescriptive implementation guardrails with examples and anti-patterns
- **Ant Design**: concise decision-oriented framing with clear scope boundaries

The intended synthesis is deliberate:
- use **shadcn/ui-style packaging** for one install surface with modular internal docs
- use **Mantine-style scoped organization** for capability/task-oriented guidance instead of one skill per component
- use **MUI-style strictness** for prescriptive, correctness-oriented code generation and anti-pattern prevention

It also fits local repository patterns:
- `packages/skills/fiber-element/` uses one public `SKILL.md` with supporting `references/` and `examples/`
- `packages/skills/reactlynx-best-practices/SKILL.md` is organized around explicit workflow modes
- `packages/skills/lynx-typescript/SKILL.md` is organized around concrete problem/solution guidance

## 3. Product decision

Use **one public entry skill** with **multiple internal markdown references**.

### Public behavior
Users install one package and invoke one skill surface.

### Internal behavior
The main `SKILL.md` acts as an orchestrator that:
- identifies the user’s task mode
- routes to the most relevant internal reference files
- enforces source-of-truth and adaptation rules
- keeps guidance specific to Lynx UI, ReactLynx, theming, and motion

## 4. Core design principles

1. **Official-doc-first**
   - Prefer official Lynx UI documentation and examples first.
   - Unless the user explicitly requests a different implementation style, prefer the official Lynx UI way of building the requested thing.
   - If the official docs cover the requested pattern, adapt that pattern rather than inventing a new one.
   - If the official site is updated later, the skill should continue to be useful because it points the agent toward the correct pages and adaptation strategy instead of hardcoding every detail.

2. **Single front door**
   - The package exposes one clear entry skill.
   - Internal modularization should not leak extra install or invocation complexity to the user.
   - Internal markdown references may grow over time, but the public skill surface should remain singular unless requirements materially change.

3. **Capability-oriented guidance**
   - Lynx UI is not only a component library; it also includes theming/tokens and motion.
   - Internal references should be organized by capability and task mode, not by a giant per-component catalog.

4. **Prescriptive over vague**
   - Because Lynx UI is newer for many users and models, the skill should lean toward explicit rules, canonical examples, and anti-pattern avoidance.

5. **ReactLynx-aware**
   - When generic React guidance conflicts with Lynx or ReactLynx constraints, prefer Lynx-safe guidance.
   - Reuse local repo references where useful, especially `reactlynx-best-practices` and `lynx-typescript`.

## 5. Intended task modes

The `lynx-ui` skill should support these main modes:

1. **Setup/install mode**
   - install packages
   - decide between full package and subpackages
   - confirm required configuration
   - verify compatibility assumptions

2. **Existing-app adoption mode**
   - add Lynx UI to an existing ReactLynx app
   - fit official examples into local file structure and conventions
   - preserve project patterns while keeping official Lynx UI semantics

3. **New-flow implementation mode**
   - build a new component, screen, or interaction with Lynx UI
   - choose the right Lynx UI capability
   - adapt official examples rather than synthesizing novel patterns unnecessarily

4. **Theming/tokens mode**
   - use Luna themes/tokens correctly
   - map user intent for design consistency to the appropriate token-based approach

5. **Motion mode**
   - choose between motion and motion-mini
   - adapt official motion patterns safely
   - combine motion with Lynx UI primitives without drifting into unsupported assumptions

6. **Troubleshooting mode**
   - diagnose package/config/import/type mismatches
   - explain likely causes and checks in a deterministic order

## 6. Source-of-truth policy

The skill should explicitly tell the agent:

- Prefer the official Lynx UI website first.
- Point to relevant official pages when possible.
- Use official examples as the canonical implementation baseline.
- Adapt official snippets minimally unless the user explicitly requests a different implementation style.
- Do not rewrite official Lynx UI examples into generic React abstractions unless required by the user’s codebase or request.

This policy should be enforced in `SKILL.md` and expanded in `snippet-adaptation-rules.md`.

## 7. Official docs coverage to reference

The skill should explicitly route to official Lynx UI docs areas, including:
- main Lynx UI docs index: `https://lynxjs.org/next/lynx-ui/`
- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`
- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

As implementation proceeds, component-specific docs pages should also be linked from capability references where they are stable and high-value.

## 8. Package/file structure

Create a new package:

```text
packages/skills/lynx-ui/
├── SKILL.md
├── package.json
├── references/
│   ├── installation-and-config.md
│   ├── snippet-adaptation-rules.md
│   ├── capability-selection.md
│   ├── composition-patterns.md
│   ├── theming-and-tokens.md
│   ├── motion.md
│   └── troubleshooting.md
└── specs/
    └── 2026-05-24-lynx-ui-skill-design.md
```

Optional later additions:

```text
├── examples/
│   └── ...
├── rules/
│   └── ...
└── scripts/
    └── ...
```

The initial version should avoid scripts unless a real need appears. Start markdown-first.

## 9. File responsibilities

### `SKILL.md`
The single public entrypoint.

Responsibilities:
- declare when to use the skill
- identify task mode
- route to the correct references
- enforce official-doc-first behavior
- enforce ReactLynx-aware constraints
- tell the agent to preserve Lynx UI semantics when adapting snippets
- use strong trigger-oriented frontmatter so the description helps Claude invoke the skill reliably
- include an explicit reading order / routing section similar to existing repo skills such as `packages/skills/fiber-element/SKILL.md`

### `references/installation-and-config.md`
Responsibilities:
- installation commands
- full-package vs subpackage guidance
- required setup/config checks
- compatibility assumptions
- links to official getting-started docs
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/snippet-adaptation-rules.md`
Responsibilities:
- prefer official examples first
- adapt minimally
- preserve semantics while matching local code style
- list anti-patterns such as rewriting into generic React patterns without need
- explain how to transform docs snippets into production code carefully
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/capability-selection.md`
Responsibilities:
- map user intent to Lynx UI capabilities
- cover components/primitives, theming/tokens, and motion
- help the agent choose the correct area before writing code
- link to relevant official docs sections
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/composition-patterns.md`
Responsibilities:
- headless composition guidance
- structure of common interaction patterns
- how triggers/content/state relationships should be preserved
- when to compose primitives vs keep examples close to official implementations
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/theming-and-tokens.md`
Responsibilities:
- guidance for Luna themes/tokens
- when to use token/theming APIs instead of ad hoc styling
- how to adapt official theming examples
- anti-patterns around bypassing token systems
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/motion.md`
Responsibilities:
- when to use motion vs motion-mini
- how to adapt official motion examples
- interaction of motion with Lynx UI flows/components
- anti-patterns and limitations to watch for
- keep content short, directive, and task-oriented rather than restating the full official docs

### `references/troubleshooting.md`
Responsibilities:
- deterministic checks for install/import/config/type issues
- likely mismatch cases between official examples and a real codebase
- references to local Lynx/ReactLynx help where appropriate
- keep content short, directive, and task-oriented rather than restating the full official docs

## 10. Interaction with existing local skills

The new `lynx-ui` skill should reference existing local skills instead of duplicating them.

### `reactlynx-best-practices`
Use when implementation touches ReactLynx architecture, thread-sensitive patterns, or ReactLynx-specific best practices.

### `lynx-typescript`
Use when the user hits configuration/type issues or needs Lynx-specific TypeScript guidance.

The new skill should not copy these skills wholesale. It should point to them when the problem crosses those boundaries.

## 11. What the skill should optimize for

Primary optimization targets:
- correctness of generated Lynx UI usage
- alignment with official documentation
- reduced hallucination for a newer ecosystem
- consistent handling of theming and motion, not just components
- good support for both existing-app adoption and new-flow creation

Secondary optimization targets:
- concise install UX
- maintainable internal documentation structure
- room to add examples/rules later without changing the public skill shape

## 12. What the skill should not optimize for

Do not optimize for:
- one skill per component
- broad generic React education
- full duplication of the official documentation site
- novel abstractions unsupported by official Lynx UI examples
- early script/tooling complexity without proven need

## 13. Initial implementation plan

This implementation plan is intentionally small and markdown-first.

### Phase 1 — package scaffold
Create `packages/skills/lynx-ui/` with:
- `package.json`
- `SKILL.md`
- `references/*.md`
- this design spec under `specs/`

Use `packages/skills/fiber-element/package.json` as the closest minimal packaging reference.

### Phase 2 — create the skill with the skill creator workflow
Use the official `skill-creator:skill-creator` skill when creating the new skill package content so the implementation follows current AI-skill best practices and packaging conventions.

Using `skill-creator:skill-creator` should refine and validate this design, not replace the chosen architecture. The implementation should keep one orchestrator `SKILL.md`, one public entry skill, and multiple supporting markdown references.

Draft `SKILL.md` to include:
- frontmatter with `name: lynx-ui`
- a strong trigger-oriented `description` that does the heavy lifting for skill invocation
- description text with explicit trigger scenarios
- task-mode routing section
- official-doc-first source-of-truth rules
- reading order into the `references/` files
- verification section telling the agent to validate setup and generated code against the current project context

### Phase 3 — write core references
Author first-pass versions of:
- `installation-and-config.md`
- `snippet-adaptation-rules.md`
- `capability-selection.md`
- `composition-patterns.md`
- `theming-and-tokens.md`
- `motion.md`
- `troubleshooting.md`

These should be concise and prescriptive. Avoid copying large chunks of official docs verbatim.

### Phase 4 — integrate with repo metadata
Add the new package to the workspace in the same way other skill packages are represented if needed by this repo’s release/build process.

This may include updating the root `package.json` dependencies if the package needs inclusion in release artifacts, following `CONTRIBUTING.md` guidance.

### Phase 5 — verify
At minimum:
- validate package structure against repo conventions
- check markdown references are included in `package.json` files list
- verify the skill reads cleanly as one entrypoint with clear routing
- ensure references point to official Lynx UI docs and local skill boundaries correctly

## 14. Risks and mitigations

### Risk: the skill becomes a docs mirror
Mitigation:
- keep references short and directive
- point to official docs as source of truth
- focus on adaptation rules and selection logic

### Risk: the skill becomes too vague
Mitigation:
- include explicit trigger scenarios
- include task modes
- include do/don’t guidance and anti-patterns
- include capability-specific references for tokens and motion

### Risk: generic React advice leaks into outputs
Mitigation:
- explicitly prefer ReactLynx/Lynx-safe guidance
- point to `reactlynx-best-practices` and `lynx-typescript` when needed
- make snippet adaptation rules preserve Lynx semantics

### Risk: future Lynx UI expansion outgrows the structure
Mitigation:
- modular `references/` design allows incremental additions
- add `examples/`, `rules/`, or scripts later only where justified

## 15. Success criteria

The design is successful if:
- users install one skill package and have one obvious entrypoint
- the skill reliably guides agents toward official Lynx UI docs/examples first
- generated guidance covers components, theming/tokens, and motion
- agents adapt official snippets correctly instead of inventing generic React patterns
- the package fits cleanly into this repository’s `packages/skills/` structure
- future additions can be made without changing the public skill shape

## 16. Approved direction

Approved by conversation:
- one install surface
- one main entry skill
- multiple internal markdown references
- official-doc-first behavior, including preferring the official Lynx UI way unless the user requests otherwise
- support for both existing-app adoption and new-flow creation
- explicit inclusion of theming/tokens and motion
- the skill should stay useful as the official website evolves by directing agents back to current official docs instead of duplicating everything locally
- initial implementation plan included in the spec
