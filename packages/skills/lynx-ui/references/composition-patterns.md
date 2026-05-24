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
