# Capability Selection

Read this file to decide which Lynx UI capability best matches the user's request before writing guidance or code.

## Official docs

- Index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`
- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`
- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

## Decision table

| User request | Route | Why |
|---|---|---|
| "Help me install Lynx UI" | `installation-and-config.md` | Package choice and setup are the main question. |
| "Add a Lynx UI button/dialog/list/popover flow" | `composition-patterns.md` | The task is about components and headless interaction structure. |
| "Adapt this official Lynx UI example into my app" | `snippet-adaptation-rules.md` | The core job is keeping the official pattern while changing only local details. |
| "Make this screen consistent with Lynx UI theming" | `theming-and-tokens.md` | Shared design values should route to Luna tokens instead of ad hoc styling. |
| "I need a small transition" | `motion.md` | The task depends on choosing motion vs motion-mini. |
| "This Lynx UI code is failing" | `troubleshooting.md` | The job is diagnosis and escalation. |

## Prompt-to-capability examples

- "I already have a ReactLynx app and want a new interactive list flow" → start with `composition-patterns.md`, then use `snippet-adaptation-rules.md`.
- "Can you theme this screen consistently?" → start with `theming-and-tokens.md`.
- "Should I use motion or motion-mini?" → go directly to `motion.md`.
- "My imports or setup are failing" → start with `installation-and-config.md`, then `troubleshooting.md` if needed.

## Decision rules

- Prefer the narrowest Lynx UI capability that solves the task.
- Do not jump to motion if the request is only structural.
- Do not jump to token guidance if the request is only behavioral.
- Link to the most relevant official docs page before generating detailed guidance.
- If the issue is really architectural or type-related, escalate instead of forcing more Lynx UI-specific advice.
