---
name: vanilla-lynx
description: |
  Use when the requested outcome is Vanilla Lynx source authoring or source-level guidance that calls Element PAPI directly rather than ReactLynx or JSX. Default complete authoring requests to a build-free `.lynxml` artifact when no format or build system is specified; support an Rspeedy project or app bundle only when the user explicitly requests Rspeedy or a build step. Covers the XML envelope, Rspeedy scaffold, main-thread UI and lifecycle code, optional background communication, styling, locally serving generated XML, and plain TypeScript background external bundles. Do not trigger merely because a query mentions Lynx, Vanilla Lynx, Element PAPI, XML, Rspeedy, or a `.lynx.bundle`. Excludes Canvas or WebGL, general element or CSS API questions without a Vanilla source-authoring outcome, operating or debugging an already reachable artifact or URL on a device, production bundle diagnosis, ReactLynx, Element PAPI JSON mode, HTML, and unrelated XML.
---

# Author Vanilla Lynx with Element PAPI

Use this skill to author Vanilla Lynx directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX. Prefer a complete single-file `.lynxml`; use Rspeedy only when the request explicitly requires it.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs.
- For a complete authoring request that does not specify a format or build system, deliver the complete `.lynxml` document. For a focused source-level question or snippet request, answer the requested scope. Never return only an example asset or reference path.
- Keep Element PAPI tree creation, mutation, lifecycle rendering, and UI updates in the main-thread source: `<script thread="main">` for `.lynxml` or `main-thread.ts` for Rspeedy. Never call Element PAPI APIs or `__FlushElementTree()` from the background-thread source; it only sends serializable patches for the main thread to apply and flush.
- Rely on the SDK flush for initial render; call `__FlushElementTree()` after later UI mutations.
- Add background-thread source only for heavier business logic, async work, timers, native calls, or data processing. Keep cross-thread payloads serializable.
- Use `lynx.getEngine()` only for engine-defined lifecycle events such as `__RenderPage`, `__UpdatePage`, and `__DestroyLifetime`; never use it for app-defined thread-local or cross-thread events. Lifecycle handlers may ignore their event payload when the implementation does not need it. Keep stable handler references for long-lived and cross-thread listeners; remove them with the same context and event name during destroy instead of registering inline callbacks.
- Keep external bundle building and loading separate and background-only. External modules must be plain TypeScript or JavaScript; never use ReactLynx, JSX, or ReactLynx transforms in them. Match the rslib entry key to the first `loadScript` argument.

## Reference Routing

Read only the reference files needed for the current task. Preserve their explicit constraints rather
than replacing them with generic guidance.

| Task                                                              | Read                              |
| ----------------------------------------------------------------- | --------------------------------- |
| Author, assemble, or review a complete `.lynxml` document         | `references/lynxml.md`            |
| Create a Vanilla Lynx project explicitly built with Rspeedy       | `references/rspeedy-project.md`   |
| Build the main-thread Element PAPI tree or update UI              | `references/main-thread.md`       |
| Choose runtime event APIs or wire lifecycle events                | `references/event.md`             |
| Implement heavier logic in the background script                 | `references/background.md`        |
| Author or review CSS using Lynx styling and layout rules          | `references/style.md`             |
| Build background-thread code into an external bundle with rslib   | `references/external-build.md`    |
| Load or call a background-thread external bundle at runtime       | `references/external-runtime.md`  |

## Runtime Validation

For a generated `.lynxml`, run `npx http-server .` from the directory containing the unchanged artifact and use an address printed by that server that the target device can reach. For an Rspeedy project, use its configured build and development-server workflow rather than a generic static server. Then use the `lynx-devtool` skill for client discovery, opening the reachable URL, runtime inspection, console logs, screenshots, and interactions. Do not duplicate device-debugging workflow here or present `agent-lynx` as an artifact builder or server.
