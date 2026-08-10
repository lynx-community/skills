---
name: vanilla-lynx
description: |
  Build and debug vanilla Lynx apps directly with Element PAPI, without ReactLynx or JSX. Use for Rspeedy project scaffolds, main-thread UI tree creation and mutation, lifecycle and event wiring, main/background thread communication, CSS packaging, Lynx styling constraints, and external bundles in vanilla Lynx apps.
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless explicitly requested.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in `main-thread.ts`. Never call Element PAPI APIs from `background.ts`.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add `background.ts` only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Treat `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` as engine-defined names, and remove runtime listeners during destroy.
- Keep external bundle building and loading separate and background-only. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task:

| Task | Read |
| --- | --- |
| Create or inspect a runnable vanilla Lynx project layout | `references/project-structure.md` |
| Build the main-thread Element PAPI tree or update UI | `references/main-thread.md` |
| Choose runtime event APIs or wire lifecycle events | `references/event.md` |
| Add or maintain a `background.ts` entry for heavier work | `references/background.md` |
| Author or review CSS, choose a layout, or migrate Web styles | `references/style.md` |
| Build background-thread code into an external `.lynx.bundle` with rslib | `references/external-build.md` |
| Load or call a background-thread external bundle | `references/external-runtime.md` |
