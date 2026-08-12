---
name: vanilla-lynx
description: |
  Build Vanilla Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX. Default to a build-free Lynx XML artifact with the .lynxml file suffix. Use Rspeedy and @lynx-js/vanilla-rsbuild-plugin only when the request explicitly requires a build step, bundle or compiled artifact, or Rspeedy. Also use for main-thread UI rendering, lifecycle and events, main/background communication, Lynx runtime styling, and external bundles consumed by Vanilla Lynx apps. Do not use for general Lynx API or compatibility queries, use lynx-api-docs. Do not use for ReactLynx tasks, including external-bundle build or runtime failures, use reactlynx-best-practices. Do not use for general Rspeedy bundle size, mangle, or minifier diagnosis, use rspeedy-bundle-quality. Do not use for unrelated XML or HTML authoring.
---

# Build Vanilla Lynx Apps

Use this skill to build Lynx apps directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs unless explicitly requested.
- Default to a Lynx XML document with the `.lynxml` file suffix. Use Rspeedy only when the user explicitly asks for a build step, bundle or compiled artifact, or Rspeedy; do not infer a build requirement merely because the request calls the result an app or project.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in the main-thread source: `main-thread.ts` for Rspeedy or `<script thread="main">` for `.lynxml`. Never call Element PAPI APIs or `__FlushElementTree()` from the background-thread source; it only sends serializable patches for the main thread to apply and flush.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add background-thread source only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Treat `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime` as engine-defined names. Keep stable handler references for long-lived and cross-thread listeners; remove them with the same context and event name during destroy instead of registering inline callbacks.
- Keep external bundle building and loading separate and background-only. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task:

| Task                                                             | Read                             |
| ---------------------------------------------------------------- | -------------------------------- |
| Create or inspect a build-free Lynx XML (`.lynxml`) artifact     | `references/lynxml.md`           |
| Create a Vanilla Lynx project built with Rspeedy                 | `references/rspeedy-project.md`  |
| Build the main-thread Element PAPI tree or update UI             | `references/main-thread.md`      |
| Choose runtime event APIs or wire lifecycle events               | `references/event.md`            |
| Implement heavier logic on the background thread                 | `references/background.md`       |
| Author or review CSS using Lynx styling and layout rules         | `references/style.md`            |
| Build background-thread code into an external bundle with rslib  | `references/external-build.md`   |
| Load or call a background-thread external bundle in Vanilla Lynx | `references/external-runtime.md` |
