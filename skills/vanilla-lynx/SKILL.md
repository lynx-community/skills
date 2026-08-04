---
name: vanilla-lynx
description: |
  Use this Skill when building Lynx applications directly with vanilla Lynx Element PAPI APIs from @lynx-js/type-element-api, without ReactLynx JSX. It covers Rspeedy project structure for native Lynx artifacts, main-thread Element PAPI rendering, UI event binding, main/background thread event communication, CSS authoring and Web-to-Lynx styling constraints, CSS packaging, and common Element API patterns.

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
- Main-thread and background scripts can both call `lynx.getEngine()`, `lynx.getJSContext()`, and `lynx.getCoreContext()`. Use `lynx.getEngine()` for the engine environment, `lynx.getJSContext()` for the background-thread environment, and `lynx.getCoreContext()` for the main-thread environment.
- For cross-thread events, prefer dispatching from the sending thread and adding or removing the listener in the target thread. Main-thread scripts should avoid adding listeners through `lynx.getJSContext()`, and background scripts should avoid adding listeners through `lynx.getCoreContext()`. Use `lynx.getJSContext()` for the complete Main → Background event flow and `lynx.getCoreContext()` for the complete Background → Main event flow.
- Treat `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` as engine-defined lifecycle event names; do not customize them.
- Remove every runtime event listener during destroy.
- Read `references/style.md` before authoring Lynx CSS or migrating styles from the Web.
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
| Author or review CSS, choose a layout, or migrate Web styles | `references/style.md` |

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
