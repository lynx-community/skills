---
name: lynx-fiber-element
description: |
  Use this Skill when building Lynx applications directly with FiberElement / Element PAPI APIs from @lynx-js/type-element-api, without ReactLynx JSX. It covers project setup, Rspeedy template-webpack bundle assembly, main-thread UI tree creation, background-thread event dispatch, CSS packaging, and common Element API patterns.

  Trigger Scenarios:
  - User wants to build a Lynx app without ReactLynx, JSX, or a framework
  - User asks to use @lynx-js/type-element-api, Element PAPI, FiberElement, or APIs such as __CreatePage, __CreateView, __CreateText, __AppendElement, __SetAttribute, or __FlushElementTree
  - User needs a template-webpack style Lynx bundle with explicit background, main-thread, and CSS assets
---

# Build Lynx Apps without Framework

Use this skill to build Lynx apps directly from Element PAPIs and Lynx Runtime APIs.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless the user explicitly asks for them.
- Split app code into three parts.
  - `src/main-thread.ts` creates and mutates the element tree by using Element PAPIs.
  - `src/background.ts` get data from main-thread environment and handle events which always generate patches to main thread.
  - `src/style.css` contains common CSS styles used in the app.

## Recommended Path

1. For bundle scenarios, start with `references/template-webpack-build.md` for package setup.
2. Then read `references/main-thread-rendering.md` for main-thread UI tree creation and mutation.
3. Then read `references/double-thread-data-sync.md` for double-thread event dispatch and data synchronization.

## Examples

Prefer the smallest relevant example:

- `examples/counter.md`: minimal app shape for scaffolding, exact file contents, or debugging the template-webpack bundle path.
- `examples/todo-list.md`: composed app that combines first-screen data, patch-based rerendering, condition switching, repeat rendering, filters, and background event handling.

## Verification

After creating or changing a FiberElement app:

```bash
pnpm dev
```

Confirm:

- expected `.bundle` files are emitted in `dist/`
- the QR/dev URL opens
