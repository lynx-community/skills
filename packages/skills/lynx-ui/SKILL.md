---
name: lynx-ui
description: |
  Use this skill whenever the user wants to use, install, adopt, troubleshoot, or generate code with the official Lynx UI library in a ReactLynx project. Use it for Lynx UI primitives, headless UI composition, Luna themes/tokens, motion, motion-mini, or adapting examples from the official Lynx UI docs, even if the user does not explicitly ask for "Lynx UI best practices." Prefer this skill over generic React UI guidance when the task touches Lynx UI in any meaningful way.
---

# Lynx UI

Use this skill to help AI agents work with the official Lynx UI library in ReactLynx projects. Prefer the official Lynx UI way of building things unless the user explicitly requests a different implementation style.

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
