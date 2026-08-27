---
name: vanilla-lynx
description: |
  Use only when the requested outcome is source code or source-level guidance for an Rspeedy-built Vanilla Lynx app that calls Element PAPI directly, never ReactLynx or JSX. Covers project scaffolding, main-thread UI and lifecycle code, background communication, styling, and plain TypeScript background external bundles loaded by that app. Do not trigger merely because a query mentions Lynx, Vanilla Lynx, Element PAPI, Rspeedy, or a `.lynx.bundle`. Excludes general element or CSS API questions that do not require Vanilla source authoring, operating or debugging an already built bundle or URL on a device, production bundle size or mangling diagnosis, ReactLynx, Element PAPI JSON mode, and any output not built by Rspeedy.
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless explicitly requested.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in `main-thread.ts`. Never call Element PAPI APIs or `__FlushElementTree()` from `background.ts`; the background thread only sends serializable patches for the main thread to apply and flush.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add `background.ts` only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Use `lynx.getEngine()` only for engine-defined lifecycle events such as `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime`; never use it for app-defined thread-local or cross-thread events. Lifecycle handlers may ignore their event payload when the implementation does not need it. Keep stable handler references for long-lived and cross-thread listeners; remove them with the same context and event name during destroy instead of registering inline callbacks.
- Keep external bundle building and loading separate and background-only. External modules must be plain TypeScript or JavaScript; never use ReactLynx, JSX, or ReactLynx transforms in them. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task. Preserve their explicit constraints rather
than replacing them with generic guidance.

| Task                                                             | Read                             |
| ---------------------------------------------------------------- | -------------------------------- |
| Create a Vanilla Lynx project built with Rspeedy                 | `references/rspeedy-project.md`  |
| Build the main-thread Element PAPI tree or update UI             | `references/main-thread.md`      |
| Choose runtime event APIs or wire lifecycle events               | `references/event.md`            |
| Implement heavier logic on the background thread                 | `references/background.md`       |
| Author or review CSS using Lynx styling and layout rules         | `references/style.md`            |
| Build background-thread code into an external bundle with rslib  | `references/external-build.md`   |
| Load or call a background-thread external bundle in Vanilla Lynx | `references/external-runtime.md` |

## Runtime Validation

When the user asks to run, inspect, debug, or validate a built artifact on a device, use the
`lynx-devtool` skill. It owns client discovery, opening an already reachable artifact URL, runtime
inspection, console logs, screenshots, and interactions. Do not duplicate that workflow here or
present `agent-lynx` as an artifact builder or server.
