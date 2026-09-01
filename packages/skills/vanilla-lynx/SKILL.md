---
name: vanilla-lynx
description: |
  Use when the requested outcome is Vanilla Lynx source authoring or source-level guidance that calls Element PAPI directly rather than ReactLynx or JSX. Default authoring requests to a complete build-free `.lynxml` artifact, even when the user does not name that format. Covers the single-file XML envelope, main-thread UI and lifecycle code, optional background communication, styling, locally serving the generated artifact, and plain TypeScript background external bundles loaded by it. Do not trigger merely because a query mentions Lynx, Vanilla Lynx, Element PAPI, XML, or a `.lynx.bundle`. Excludes Rspeedy project or app-bundle authoring, Canvas or WebGL, general element or CSS API questions without a Vanilla source-authoring outcome, operating or debugging an already reachable artifact or URL on a device, production bundle diagnosis, ReactLynx, Element PAPI JSON mode, HTML, and unrelated XML.
---

# Build Vanilla Lynx XML Artifacts

Use this skill to author a complete single-file `.lynxml` artifact directly with Element PAPI and Lynx Runtime APIs, without ReactLynx, JSX, or an app build step.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs.
- Deliver the complete `.lynxml` document when source is requested. Do not replace it with an Rspeedy project, separate source files, a package manifest, or a reference to an example asset.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in `<script thread="main">`. Never call Element PAPI APIs or `__FlushElementTree()` from `<script thread="background">`; the background thread only sends serializable patches for the main thread to apply and flush.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add `<script thread="background">` only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Use `lynx.getEngine()` only for engine-defined lifecycle events such as `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime`; never use it for app-defined thread-local or cross-thread events. Lifecycle handlers may ignore their event payload when the implementation does not need it. Keep stable handler references for long-lived and cross-thread listeners; remove them with the same context and event name during destroy instead of registering inline callbacks.
- Keep external bundle building and loading separate and background-only. External modules must be plain TypeScript or JavaScript; never use ReactLynx, JSX, or ReactLynx transforms in them. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task. Preserve their explicit constraints rather
than replacing them with generic guidance.

| Task                                                              | Read                              |
| ----------------------------------------------------------------- | --------------------------------- |
| Author, assemble, or review a complete `.lynxml` document         | `references/lynxml.md`            |
| Build the main-thread Element PAPI tree or update UI              | `references/main-thread.md`       |
| Choose runtime event APIs or wire lifecycle events                | `references/event.md`             |
| Implement heavier logic in the background script                 | `references/background.md`        |
| Author or review CSS using Lynx styling and layout rules          | `references/style.md`             |
| Build background-thread code into an external bundle with rslib   | `references/external-build.md`    |
| Load or call a background-thread external bundle from `.lynxml`   | `references/external-runtime.md`  |

## Runtime Validation

Serve a generated `.lynxml` unchanged from its containing directory when runtime validation is requested, and use an address printed by the chosen static server that the target device can reach. Then use the `lynx-devtool` skill for client discovery, opening that reachable URL, runtime inspection, console logs, screenshots, and interactions. Do not duplicate device-debugging workflow here or present `agent-lynx` as an artifact builder or server.
