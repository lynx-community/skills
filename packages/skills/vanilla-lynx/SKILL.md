---
name: vanilla-lynx
description: |
  Build Vanilla Lynx apps built with Rspeedy and @lynx-js/vanilla-rsbuild-plugin, without ReactLynx or JSX. Use when a request targets a Vanilla Lynx app and involves project scaffolding, main-thread Element PAPI UI, lifecycle and events, main/background communication, Lynx runtime styling, or external bundles consumed by that app. Do not use for general Lynx API or compatibility queries, use lynx-api-docs. Do not use for ReactLynx tasks, including external-bundle build or runtime failures, use reactlynx-best-practices. Do not use for general Rspeedy bundle size, mangle, or minifier diagnosis, use rspeedy-bundle-quality. Do not use for Element PAPI JSON mode, or other output formats outside the Rspeedy Vanilla Lynx workflow.
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless explicitly requested.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in `main-thread.ts`. Never call Element PAPI APIs or `__FlushElementTree()` from `background.ts`; the background thread only sends serializable patches for the main thread to apply and flush.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add `background.ts` only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Treat `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` as engine-defined names. Keep stable handler references for long-lived and cross-thread listeners; remove them with the same context and event name during destroy instead of registering inline callbacks.
- Keep external bundle building and loading separate and background-only. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task:

| Task                                                             | Read                             |
| ---------------------------------------------------------------- | -------------------------------- |
| Create a Vanilla Lynx project built with Rspeedy                 | `references/rspeedy-project.md`  |
| Build the main-thread Element PAPI tree or update UI             | `references/main-thread.md`      |
| Choose runtime event APIs or wire lifecycle events               | `references/event.md`            |
| Implement heavier logic on the background thread                 | `references/background.md`       |
| Author or review CSS using Lynx styling and layout rules         | `references/style.md`            |
| Build background-thread code into an external bundle with rslib  | `references/external-build.md`   |
| Load or call a background-thread external bundle in Vanilla Lynx | `references/external-runtime.md` |
