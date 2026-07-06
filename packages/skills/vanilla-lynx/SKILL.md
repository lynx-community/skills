---
name: vanilla-lynx
description: |
  Use this Skill when building Lynx applications directly with vanilla Lynx Element PAPI APIs from @lynx-js/type-element-api, without ReactLynx JSX. It covers Rspeedy project structure for native Lynx artifacts, main-thread Element PAPI rendering, UI event binding, main/background thread event communication, CSS packaging, and common Element API patterns.

  Trigger Scenarios:
  - User wants to build a Lynx app without ReactLynx, JSX, or a framework
  - User asks to use @lynx-js/type-element-api, Element PAPI, vanilla Lynx, or APIs such as __CreatePage, __CreateView, __CreateText, __AppendElement, __SetAttribute, or __FlushElementTree
  - User needs a native Lynx artifact with main-thread, optional background-thread, and CSS assets
  - User asks how vanilla Lynx UI events should stay on the main thread or be forwarded to background logic
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless the user explicitly asks for them.
- Put page creation, lifecycle event handling, UI rendering, lightweight UI handlers, UI updates, Element PAPI tree creation, and Element PAPI mutation in the `main-thread.ts` entry.
- Do not call Element PAPI APIs or `__FlushElementTree()` from the `background.ts` entry.
- Do not call `__FlushElementTree()` from initial `renderPage`; the SDK flushes initial render by default. Call `__FlushElementTree()` after later UI mutations.
- Add a `background.ts` entry only for heavier business logic, async work, timers, native calls, or data processing. The main thread drives tasks; the background thread responds and sends patches back.
- Use `lynx.getEngine()` in main-thread or background scripts to get the engine environment, `lynx.getJSContext()` in `main-thread.ts` to get the background-thread environment, and `lynx.getCoreContext()` in `background.ts` to get the main-thread environment.
- Treat `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` as engine-defined lifecycle event names; do not customize them.
- Remove every runtime event listener during destroy.
- Use the CSS entry for page and node styles.
- Build the runnable native Lynx `.bundle` artifact with Rspeedy.

## Reference Routing

Read only the reference files needed for the current task:

| Task | Read |
| --- | --- |
| Create or inspect a runnable vanilla Lynx project layout | `references/rspeedy.md` |
| Build the main-thread Element PAPI tree or update UI | `references/main-thread.md` |
| Choose runtime event APIs or wire lifecycle events | `references/event.md` |
| Add or maintain a `background.ts` entry for heavier work | `references/background.md` |

## Build Workflow

1. Start with `references/rspeedy.md` when the app scaffold or Rspeedy build is part of the task.
2. Implement the `main-thread.ts` entry from `references/main-thread.md`. Main-thread code owns Element PAPI nodes, lifecycle rendering, and UI flushes.
3. Use `references/event.md` when wiring `lynx.getEngine()`, `lynx.getCoreContext()`, or `lynx.getJSContext()`.
4. If the app needs heavier work, add a `background.ts` entry using `references/background.md`; otherwise keep the app main-thread only.
5. Keep styles in the CSS entry, then build or run the app with Rspeedy.

## Upstream Example

Use [lynx-family/lynx-examples/examples/vanilla](https://github.com/lynx-family/lynx-examples/tree/main/examples/vanilla) as the source of truth for runnable vanilla Lynx examples.

## Verification

After creating or changing a vanilla Lynx app, run:

```bash
pnpm dev
```

Confirm:

- expected `.bundle` files are emitted in `dist/`
- the QR/dev URL opens
