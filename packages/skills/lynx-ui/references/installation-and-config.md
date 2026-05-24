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
