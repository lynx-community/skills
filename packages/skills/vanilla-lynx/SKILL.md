---
name: vanilla-lynx
description: |
  Build Rspeedy Vanilla Lynx apps with Element PAPI and Lynx Runtime APIs, never ReactLynx or JSX. Use for project scaffolding, main-thread UI, lifecycle/events, background communication, styling, or external bundles. Do not use for device-side runtime validation or debugging of an already built artifact; use lynx-devtool instead. For general APIs use lynx-api-docs; for ReactLynx use reactlynx-best-practices; for bundle quality use rspeedy-bundle-size. Excludes Element PAPI JSON mode and output formats outside the Rspeedy Vanilla Lynx workflow.
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless explicitly requested.
- Always pass all four required arguments to `__AddEventListener(element, eventName, handler, options)`; pass `{}` when no listener options are needed.
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
