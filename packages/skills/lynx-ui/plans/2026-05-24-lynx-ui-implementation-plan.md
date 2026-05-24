# Lynx UI Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `@lynx-js/skill-lynx-ui` package in `packages/skills/lynx-ui/` with one public orchestrator `SKILL.md`, focused reference docs, repo-native packaging, and verification steps that preserve the approved architecture.

**Architecture:** The package exposes one public `lynx-ui` skill with strong trigger-oriented frontmatter and a routing-oriented `SKILL.md`. Supporting guidance lives in focused `references/*.md` files so the public surface stays singular while official-doc-first guidance, theming, motion, troubleshooting, and ReactLynx integration remain modular.

**Tech Stack:** Markdown skills, npm package metadata, pnpm workspace packaging, Claude skill conventions, official Lynx UI docs, local repo skills (`reactlynx-best-practices`, `lynx-typescript`)

---

## File structure map

### New files to create
- `packages/skills/lynx-ui/package.json` — package metadata and published file list
- `packages/skills/lynx-ui/SKILL.md` — public orchestrator skill with trigger-oriented description, routing, reading order, and verification guidance
- `packages/skills/lynx-ui/references/installation-and-config.md` — install/config guidance and package selection rules
- `packages/skills/lynx-ui/references/snippet-adaptation-rules.md` — official-doc-first adaptation rules and anti-patterns
- `packages/skills/lynx-ui/references/capability-selection.md` — map user intent to primitives/components, theming, or motion
- `packages/skills/lynx-ui/references/composition-patterns.md` — headless composition guidance and interaction-pattern guardrails
- `packages/skills/lynx-ui/references/theming-and-tokens.md` — Luna themes/tokens guidance
- `packages/skills/lynx-ui/references/motion.md` — motion vs motion-mini guidance
- `packages/skills/lynx-ui/references/troubleshooting.md` — deterministic troubleshooting flow
- `packages/skills/lynx-ui/evals/evals.json` — initial eval prompts for the skill-creator validation loop

### Existing files to modify if needed
- `package.json` — add `@lynx-js/skill-lynx-ui` to dependencies only if this repo requires root registration for release artifacts
- `README.md` — list the new skill only if the repo’s skill index is manually maintained

### Existing docs to reference during implementation
- `packages/skills/fiber-element/SKILL.md`
- `packages/skills/fiber-element/package.json`
- `packages/skills/reactlynx-best-practices/SKILL.md`
- `packages/skills/lynx-typescript/SKILL.md`
- `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`

---

### Task 1: Scaffold the Lynx UI skill package

**Files:**
- Create: `packages/skills/lynx-ui/package.json`
- Create: `packages/skills/lynx-ui/references/.gitkeep`
- Test: `packages/skills/fiber-element/package.json`

- [ ] **Step 1: Inspect the minimal package shape used by existing markdown-first skills**

Read:
- `packages/skills/fiber-element/package.json`
- `packages/skills/fiber-element/SKILL.md`

Expected takeaway:
- package name format is `@lynx-js/skill-*`
- markdown-first skills publish `SKILL.md`, `references`, `examples`, `rules`, and optional scripts
- no build tooling is needed for the initial Lynx UI package

- [ ] **Step 2: Create the package metadata file**

Create `packages/skills/lynx-ui/package.json` with:

```json
{
  "name": "@lynx-js/skill-lynx-ui",
  "version": "0.0.1",
  "description": "Help AI agents use the official Lynx UI library correctly in ReactLynx projects.",
  "repository": {
    "url": "https://github.com/lynx-community/skills"
  },
  "type": "module",
  "files": [
    "SKILL.md",
    "references",
    "examples",
    "rules",
    "scripts"
  ],
  "scripts": {},
  "devDependencies": {},
  "engines": {
    "node": ">=18"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

- [ ] **Step 3: Create the references directory placeholder**

Run:

```bash
touch packages/skills/lynx-ui/references/.gitkeep
```

Expected result:
- `references/` exists so the package shape is visible immediately before the docs are filled in

- [ ] **Step 4: Verify the package files exist**

Run:

```bash
rtk ls "/Users/bytedance/workspace/skills/packages/skills/lynx-ui"
```

Expected output includes:
- `package.json`
- `references/`
- `plans/`
- `specs/`

- [ ] **Step 5: Commit the scaffold**

Run:

```bash
rtk git add "packages/skills/lynx-ui/package.json" "packages/skills/lynx-ui/references/.gitkeep" "packages/skills/lynx-ui/plans/2026-05-24-lynx-ui-implementation-plan.md" "packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md" && rtk git commit -m "feat: scaffold lynx ui skill package"
```

Expected output:
- new commit created on `main`

---

### Task 2: Draft the public orchestrator skill with skill-creator guidance

**Files:**
- Create: `packages/skills/lynx-ui/SKILL.md`
- Test: `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`
- Test: `packages/skills/fiber-element/SKILL.md`

- [ ] **Step 1: Use `skill-creator:skill-creator` to draft the public `SKILL.md` shape without changing the approved architecture**

Invoke the skill creator with the goal:
- preserve one public orchestrator skill
- preserve multiple supporting `references/*.md`
- optimize frontmatter description for reliable invocation
- keep the body under control and route deeper guidance into references

Expected output from the drafting pass:
- frontmatter draft
- trigger scenarios
- reading order / routing structure
- verification section outline

- [ ] **Step 2: Write the `SKILL.md` frontmatter and overview**

Create `packages/skills/lynx-ui/SKILL.md` starting with:

```md
---
name: lynx-ui
description: |
  Use this skill whenever the user wants to use, install, adopt, troubleshoot, or generate code with the official Lynx UI library in a ReactLynx project. This skill should also be used when the task involves Lynx UI primitives, headless UI composition, Luna themes/tokens, motion, motion-mini, or adapting examples from the official Lynx UI docs, even if the user does not explicitly ask for "Lynx UI best practices."
---

# Lynx UI

Use this skill to help AI agents work with the official Lynx UI library in ReactLynx projects. Prefer the official Lynx UI way of building things unless the user explicitly requests a different implementation style.
```

- [ ] **Step 3: Add the core rules and routing section**

Extend `packages/skills/lynx-ui/SKILL.md` with:

```md
## Core Rules

- Prefer official Lynx UI docs and examples first.
- Unless the user asks otherwise, prefer the official Lynx UI way of building the requested thing.
- Adapt official examples minimally to fit the user’s codebase.
- Preserve Lynx UI semantics instead of rewriting examples into generic React abstractions.
- Prefer ReactLynx-safe patterns over generic React assumptions.
- When the problem crosses into ReactLynx architecture or Lynx TypeScript issues, consult the local skills referenced below.

## Reading Order

1. For install choices, package setup, and config checks, read `references/installation-and-config.md`.
2. For adapting official examples into an existing codebase, read `references/snippet-adaptation-rules.md`.
3. For deciding whether the task is about components, theming, or motion, read `references/capability-selection.md`.
4. For headless composition and interaction patterns, read `references/composition-patterns.md`.
5. For Luna token usage, read `references/theming-and-tokens.md`.
6. For motion or motion-mini guidance, read `references/motion.md`.
7. For import, config, or mismatch debugging, read `references/troubleshooting.md`.
```

- [ ] **Step 4: Add task modes, local-skill boundaries, and verification**

Complete `packages/skills/lynx-ui/SKILL.md` with:

```md
## Task Modes

- **Setup/install** — install the right package shape, confirm config, and verify compatibility.
- **Existing-app adoption** — adapt official examples to the user’s file structure and conventions.
- **New-flow implementation** — build new components or interactions using the closest official Lynx UI pattern.
- **Theming/tokens** — use Luna themes/tokens instead of ad hoc styling when appropriate.
- **Motion** — choose between motion and motion-mini and adapt the correct official pattern.
- **Troubleshooting** — diagnose mismatches in imports, setup, types, or unsupported assumptions.

## Related Local Skills

- `reactlynx-best-practices` — use when ReactLynx architecture, thread-sensitive behavior, or ReactLynx-specific patterns become central.
- `lynx-typescript` — use when the task is blocked by Lynx-specific TypeScript configuration or type errors.

## Verification

After generating or modifying Lynx UI guidance:

1. Check that the chosen pattern matches the closest official Lynx UI docs page.
2. Check that the result preserves Lynx UI semantics instead of drifting into generic React abstractions.
3. Check that theming and motion guidance use the correct Lynx UI capability when applicable.
4. Check whether ReactLynx architecture or Lynx TypeScript constraints require consulting local skills.
```

- [ ] **Step 5: Review the final `SKILL.md` for format and length**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/SKILL.md"
```

Expected review checklist:
- frontmatter exists
- description is trigger-oriented
- reading order is explicit
- body stays focused and does not become a docs mirror

- [ ] **Step 6: Commit the public orchestrator**

Run:

```bash
rtk git add "packages/skills/lynx-ui/SKILL.md" && rtk git commit -m "feat: add lynx ui orchestrator skill"
```

Expected output:
- new commit created on `main`

---

### Task 3: Write installation and adaptation references

**Files:**
- Create: `packages/skills/lynx-ui/references/installation-and-config.md`
- Create: `packages/skills/lynx-ui/references/snippet-adaptation-rules.md`
- Test: `packages/skills/lynx-typescript/SKILL.md`
- Test: `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`

- [ ] **Step 1: Write installation and config guidance**

Create `packages/skills/lynx-ui/references/installation-and-config.md` with:

```md
# Installation and Config

Use this reference when the user needs to install Lynx UI, choose package shape, or verify project setup.

## Use the official docs first

Start from `https://lynxjs.org/next/lynx-ui/` and prefer the official install/setup path before inventing project-specific structure.

## Package choice

- If the user wants the full library, prefer `@lynx-js/lynx-ui`.
- If the user has a clear reason to optimize or isolate usage, consider subpackages.
- Do not introduce subpackages by default unless the project or user request makes that useful.

## Config checks

- Confirm the project is a ReactLynx project.
- Confirm Lynx UI compatibility assumptions before generating code.
- If TypeScript config or Lynx-specific types are unclear, consult `lynx-typescript`.

## Output style

- Keep setup guidance short and actionable.
- Point to the relevant official docs page.
- State the exact package choice and why.
```

- [ ] **Step 2: Write snippet adaptation rules**

Create `packages/skills/lynx-ui/references/snippet-adaptation-rules.md` with:

```md
# Snippet Adaptation Rules

Use this reference when the user wants to build with Lynx UI and the official docs already show a close example.

## Default approach

- Prefer the closest official Lynx UI example first.
- Unless the user asks otherwise, prefer the official Lynx UI way of building the requested thing.
- Adapt minimally to fit naming, file structure, and nearby conventions.

## Preserve these things

- component and capability semantics
- official interaction structure
- theming/token usage when the official example uses it
- motion choice when the official example depends on it

## Avoid these mistakes

- do not rewrite official Lynx UI patterns into generic React abstractions without a real reason
- do not replace Lynx UI token usage with ad hoc styling without a user request
- do not invent a fresh API shape when the docs already cover the case

## Output style

- Explain which official example or docs page you are following.
- Explain only the necessary adaptations.
- Keep the result close to the official pattern.
```

- [ ] **Step 3: Verify reference scope stays narrow and directive**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/installation-and-config.md" && rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/snippet-adaptation-rules.md"
```

Expected review checklist:
- both docs are task-oriented
- neither doc tries to mirror the full official website
- both docs reinforce official-doc-first behavior

- [ ] **Step 4: Commit the install/adaptation references**

Run:

```bash
rtk git add "packages/skills/lynx-ui/references/installation-and-config.md" "packages/skills/lynx-ui/references/snippet-adaptation-rules.md" && rtk git commit -m "feat: add lynx ui setup and adaptation references"
```

Expected output:
- new commit created on `main`

---

### Task 4: Write capability and composition references

**Files:**
- Create: `packages/skills/lynx-ui/references/capability-selection.md`
- Create: `packages/skills/lynx-ui/references/composition-patterns.md`
- Test: `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`

- [ ] **Step 1: Write capability selection guidance**

Create `packages/skills/lynx-ui/references/capability-selection.md` with:

```md
# Capability Selection

Use this reference to decide which Lynx UI capability best matches the user’s request.

## Map user intent to capability

- If the user needs a headless UI primitive or interaction structure, start from the closest Lynx UI primitive/component docs.
- If the user needs consistent design values, styling systems, or shared tokens, use Luna themes/tokens guidance.
- If the user needs transitions, animated state changes, or lightweight motion behavior, decide between motion and motion-mini.

## Decision rules

- Prefer the narrowest Lynx UI capability that solves the task.
- Do not jump to motion if the problem is only structural.
- Do not jump to token guidance if the request is only behavioral.
- Link to the most relevant official docs page before generating detailed guidance.
```

- [ ] **Step 2: Write composition guidance**

Create `packages/skills/lynx-ui/references/composition-patterns.md` with:

```md
# Composition Patterns

Use this reference when the task depends on headless composition and interaction structure.

## Goals

- preserve the official Lynx UI interaction structure
- keep state relationships understandable
- keep triggers, content, and interaction boundaries aligned with official patterns

## Rules

- Start from the closest official composition example.
- Keep the composition as close as practical to the official pattern.
- Adapt only the surrounding app structure, naming, or local conventions.
- If the user asks for a custom pattern, explain where it departs from the official approach.

## Avoid

- generic React abstractions that erase Lynx UI semantics
- unnecessary wrapper layers before the base Lynx UI pattern is correct
- mixing unrelated theming or motion changes into a structural composition task unless the user needs them
```

- [ ] **Step 3: Verify composition docs stay capability-oriented**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/capability-selection.md" && rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/composition-patterns.md"
```

Expected review checklist:
- capability selection distinguishes primitives, tokens, and motion
- composition guidance stays focused on structure, not generic UI advice

- [ ] **Step 4: Commit the capability/composition references**

Run:

```bash
rtk git add "packages/skills/lynx-ui/references/capability-selection.md" "packages/skills/lynx-ui/references/composition-patterns.md" && rtk git commit -m "feat: add lynx ui capability and composition references"
```

Expected output:
- new commit created on `main`

---

### Task 5: Write theming, motion, and troubleshooting references

**Files:**
- Create: `packages/skills/lynx-ui/references/theming-and-tokens.md`
- Create: `packages/skills/lynx-ui/references/motion.md`
- Create: `packages/skills/lynx-ui/references/troubleshooting.md`
- Test: `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`

- [ ] **Step 1: Write theming and tokens guidance**

Create `packages/skills/lynx-ui/references/theming-and-tokens.md` with:

```md
# Theming and Tokens

Use this reference when the task involves Luna themes/tokens or consistent design values.

## Start here

Official docs: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`

## Rules

- Prefer Luna token guidance over ad hoc styling when the task is about shared design values.
- Adapt official theming examples minimally.
- Preserve token semantics instead of flattening them into arbitrary style constants.

## Avoid

- replacing token systems with local styling shortcuts unless the user asks for that tradeoff
- inventing a parallel theming system when Lynx UI already covers the need
```

- [ ] **Step 2: Write motion guidance**

Create `packages/skills/lynx-ui/references/motion.md` with:

```md
# Motion

Use this reference when the task involves animation, transitions, or choosing between motion and motion-mini.

## Start here

- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

## Decision rules

- Use the official docs to decide whether the task needs full motion or motion-mini.
- Keep generated guidance aligned with the closest official motion example.
- Explain the choice when selecting motion vs motion-mini.

## Avoid

- introducing animation abstractions unrelated to Lynx UI if the official motion APIs already solve the task
- mixing motion changes into a non-motion task unless the user asks for it
```

- [ ] **Step 3: Write troubleshooting guidance**

Create `packages/skills/lynx-ui/references/troubleshooting.md` with:

```md
# Troubleshooting

Use this reference when Lynx UI guidance or generated code is failing because of imports, setup, compatibility, or type mismatches.

## Debugging order

1. Confirm the chosen package matches the intended usage.
2. Confirm the generated pattern matches a real official Lynx UI docs page.
3. Confirm the issue is not caused by rewriting an official example too far away from the source pattern.
4. Confirm whether the issue is really a ReactLynx architecture problem.
5. Confirm whether the issue is really a Lynx TypeScript problem.

## Escalation

- If the issue is architectural, consult `reactlynx-best-practices`.
- If the issue is type/config related, consult `lynx-typescript`.
```

- [ ] **Step 4: Verify the specialized references**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/theming-and-tokens.md" && rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/motion.md" && rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/troubleshooting.md"
```

Expected review checklist:
- theming guidance points to Luna docs
- motion guidance points to both motion and motion-mini docs
- troubleshooting guidance escalates cleanly to existing local skills when needed

- [ ] **Step 5: Commit the specialized references**

Run:

```bash
rtk git add "packages/skills/lynx-ui/references/theming-and-tokens.md" "packages/skills/lynx-ui/references/motion.md" "packages/skills/lynx-ui/references/troubleshooting.md" && rtk git commit -m "feat: add lynx ui theming motion and troubleshooting references"
```

Expected output:
- new commit created on `main`

---

### Task 6: Add initial eval prompts for skill-creator validation

**Files:**
- Create: `packages/skills/lynx-ui/evals/evals.json`
- Test: `packages/skills/lynx-ui/SKILL.md`
- Test: `packages/skills/lynx-ui/references/*.md`

- [ ] **Step 1: Create the evals directory**

Run:

```bash
mkdir -p packages/skills/lynx-ui/evals
```

Expected result:
- `evals/` exists for skill-creator validation inputs

- [ ] **Step 2: Write realistic eval prompts**

Create `packages/skills/lynx-ui/evals/evals.json` with:

```json
{
  "skill_name": "lynx-ui",
  "evals": [
    {
      "id": 1,
      "prompt": "I already have a ReactLynx app and want to add Lynx UI for a new interactive list flow. Please use the official Lynx UI approach and keep the code close to the docs unless the project structure forces small changes.",
      "expected_output": "The response routes through Lynx UI setup or capability guidance, prefers official docs examples, and avoids generic React rewrites.",
      "files": []
    },
    {
      "id": 2,
      "prompt": "Can you help me add consistent theming to this Lynx UI screen? I think we should use Luna tokens if that's the recommended path.",
      "expected_output": "The response routes into theming and tokens guidance, points to the Luna docs, and keeps the answer in Lynx UI terms.",
      "files": []
    },
    {
      "id": 3,
      "prompt": "I need a small transition for a Lynx UI interaction. Should I use motion or motion-mini, and can you keep it aligned with the official docs?",
      "expected_output": "The response routes into motion guidance, explains motion vs motion-mini, and prefers the official docs path.",
      "files": []
    }
  ]
}
```

- [ ] **Step 3: Validate the eval file reads cleanly**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/evals/evals.json"
```

Expected review checklist:
- prompts are realistic
- prompts cover setup/adoption, theming, and motion
- prompts reinforce official-doc-first behavior

- [ ] **Step 4: Commit the eval prompts**

Run:

```bash
rtk git add "packages/skills/lynx-ui/evals/evals.json" && rtk git commit -m "test: add lynx ui skill eval prompts"
```

Expected output:
- new commit created on `main`

---

### Task 7: Integrate with repo metadata only if required

**Files:**
- Modify: `package.json`
- Test: `CONTRIBUTING.md:79-87`

- [ ] **Step 1: Inspect whether root dependency registration is required for release artifacts**

Read:
- `CONTRIBUTING.md:79-87`
- root `package.json`

Decision rule:
- if other published skill packages are registered in root dependencies for release inclusion, add `@lynx-js/skill-lynx-ui`
- if the repo does not maintain them there, do not add unnecessary integration churn

- [ ] **Step 2: Apply the minimal root package update only if needed**

If required, update the relevant dependency block to include:

```json
"@lynx-js/skill-lynx-ui": "workspace:*"
```

If not required, make no change.

- [ ] **Step 3: Verify the root integration decision**

Run:

```bash
rtk grep "@lynx-js/skill-lynx-ui" "/Users/bytedance/workspace/skills/package.json"
```

Expected output:
- either one match if registration was needed
- or no match with a documented decision to leave root metadata unchanged

- [ ] **Step 4: Commit the repo integration change if one was made**

If `package.json` changed, run:

```bash
rtk git add "package.json" && rtk git commit -m "chore: register lynx ui skill package"
```

If nothing changed, skip this step.

---

### Task 8: Verify the package end-to-end and check plan/spec alignment

**Files:**
- Test: `packages/skills/lynx-ui/package.json`
- Test: `packages/skills/lynx-ui/SKILL.md`
- Test: `packages/skills/lynx-ui/references/*.md`
- Test: `packages/skills/lynx-ui/evals/evals.json`
- Test: `packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md`

- [ ] **Step 1: Verify package layout**

Run:

```bash
rtk ls "/Users/bytedance/workspace/skills/packages/skills/lynx-ui"
```

Expected output includes:
- `SKILL.md`
- `package.json`
- `references/`
- `evals/`
- `plans/`
- `specs/`

- [ ] **Step 2: Verify the package metadata includes the correct published file sets**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/package.json"
```

Expected review checklist:
- package name is `@lynx-js/skill-lynx-ui`
- published files include `SKILL.md` and `references`
- package remains markdown-first with no unnecessary tooling

- [ ] **Step 3: Verify the skill architecture matches the approved spec**

Run:

```bash
rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/SKILL.md" && rtk read "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/specs/2026-05-24-lynx-ui-skill-design.md"
```

Expected review checklist:
- one public orchestrator skill
- strong trigger-oriented description
- explicit reading order
- official-doc-first rules
- no per-component skill split

- [ ] **Step 4: Verify the reference files stay lean and differentiated**

Run:

```bash
rtk ls "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references" && rtk grep "^# " "/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references"
```

Expected review checklist:
- each reference has one clear responsibility
- references are short and directive
- theming, motion, and troubleshooting are explicitly covered

- [ ] **Step 5: Run the skill-creator validation loop preparation**

Use `skill-creator:skill-creator` to confirm the package is ready for:
- eval prompt review
- with-skill runs
- baseline comparison
- future description optimization

Expected output:
- no architecture changes requested
- eval prompts are usable as a starting set

- [ ] **Step 6: Check git status before handoff**

Run:

```bash
rtk git status
```

Expected output:
- clean working tree if all verification changes were committed
- or a small set of intentional uncommitted edits if awaiting user review

---

## Self-review against the spec

- Spec coverage:
  - one public orchestrator skill is implemented in Task 2
  - supporting markdown references are implemented in Tasks 3–5
  - official-doc-first behavior is encoded in Task 2 and Task 3
  - theming/tokens and motion are covered in Task 5
  - local-skill boundaries are encoded in Task 2 and Task 5
  - skill-creator usage is included in Tasks 2, 6, and 8
  - repo-native packaging and optional root integration are covered in Tasks 1 and 7
- Placeholder scan:
  - no `TODO`, `TBD`, or implied “fill this in later” steps remain
- Type consistency:
  - all package and file names use `lynx-ui` consistently
  - all reference file names match the approved spec exactly

## Execution handoff

Plan complete and saved to `packages/skills/lynx-ui/plans/2026-05-24-lynx-ui-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
