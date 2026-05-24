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
