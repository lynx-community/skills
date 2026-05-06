---
name: fiber-element
description: |
  Use this Skill when building Lynx applications directly with FiberElement / Element PAPI APIs from @lynx-js/type-element-api, without ReactLynx JSX. It covers project setup, Rspeedy template-webpack bundle assembly, main-thread UI tree creation, background-thread event dispatch, CSS packaging, and common Element API patterns.

  Trigger Scenarios:
  - User wants to build a Lynx app without ReactLynx, JSX, or a framework
  - User asks to use @lynx-js/type-element-api, Element PAPI, FiberElement, or APIs such as __CreatePage, __CreateView, __CreateText, __AppendElement, __SetAttribute, or __FlushElementTree
  - User needs a template-webpack style Lynx bundle with explicit background, main-thread, and CSS assets
---

# FiberElement Lynx Apps

Use this skill to build Lynx apps directly from Element PAPI calls exposed through `@lynx-js/type-element-api`. Treat Element PAPI as the rendering layer: main thread renders, background thread handles async work and events.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless the user explicitly asks for them.
- Split app code into `src/main-thread.ts`, `src/background.ts`, and `src/style.css`.
- Use `@lynx-js/type-element-api` for globals/types; Element PAPI functions are runtime globals and are not imported as values.
- Keep async work, timers, native data updates, storage, and event handling in `src/background.ts`.
- Keep Element PAPI tree creation and mutation in `src/main-thread.ts`.
- If first-screen data exists, keep that data in the main-thread environment first and synchronize it to background through `processData`.

## Reading Order

1. For project scaffold and template-webpack build setup, read `references/template-webpack-build.md`.
2. For shared main-thread helpers, lifecycle shape, Element PAPI selection, and restrictions, read `references/main-thread-rendering.md`.
3. For first-screen data, background updates, and double-thread communication, read `references/double-thread-data-sync.md`.

## Examples

- `examples/counter.md`: minimal counter app.
- `examples/condition.md`: loading, empty, or content states that swap in the same area.
- `examples/repeat.md`: repeated rows from an array of data.
- `examples/todo-list.md`: composed todo app using the focused examples and references.

## Verification

After creating or changing a FiberElement app:

```bash
pnpm build
pnpm dev
```

Confirm `dist/card.bundle` is emitted, the QR/dev URL opens, initial `renderPage` UI appears, events reach `src/background.ts`, and background updates reach main-thread lifecycle methods.
