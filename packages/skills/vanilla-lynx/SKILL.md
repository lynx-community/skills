---
name: vanilla-lynx
description: |
  Author, review, or explain Vanilla Lynx source that uses Element PAPI directly. Applies to build-free `.lynxml` artifacts and Rspeedy projects or bundles, with related build and serving workflows. Excludes ReactLynx/JSX, Canvas/WebGL, standalone Lynx API/CSS support lookups, debugging already reachable artifacts on a device, production bundle analysis, and Element PAPI JSON mode.
---

# Author Vanilla Lynx with Element PAPI

Use this skill to author Vanilla Lynx directly with Element PAPI and Lynx Runtime APIs, without ReactLynx or JSX. Treat build-free `.lynxml` and Rspeedy as peer output formats.

## Choose the Output Format

- Choose `.lynxml` when the user asks for a single file, build-free or directly loadable output, or explicitly says not to add a build step.
- Choose Rspeedy when the user asks for Rspeedy, a project scaffold or build configuration, or an app bundle produced by a build.
- Generic words such as app, page, card, or project do not select a format by themselves. If a complete authoring request lacks a distinguishing delivery or build requirement, or gives conflicting format signals, ask one concise clarification before generating the deliverable. Do not generate both complete formats unless the user requests both.
- For a focused source-level question or snippet request, answer the requested scope without forcing an output-format decision.

## Core Rules

- Do not use ReactLynx, JSX, virtual DOM, or browser DOM APIs.
- For a complete authoring request, deliver a complete artifact in the selected format. Never return only an example asset or reference path.
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
| Author or review a complete Rspeedy project or build workflow     | `references/rspeedy-project.md`   |
| Build the main-thread Element PAPI tree or update UI              | `references/main-thread.md`       |
| Choose runtime event APIs or wire lifecycle events                | `references/event.md`             |
| Implement heavier logic in the background script                 | `references/background.md`        |
| Author or review CSS using Lynx styling and layout rules          | `references/style.md`             |
| Build background-thread code into an external bundle with rslib   | `references/external-build.md`    |
| Load or call a background-thread external bundle at runtime       | `references/external-runtime.md`  |

## Runtime Validation

For a generated `.lynxml`, run `npx http-server .` from the directory containing the unchanged artifact and use an address printed by that server that the target device can reach. For an Rspeedy project, use its configured build and development-server workflow rather than a generic static server. Then use the `lynx-devtool` skill for client discovery, opening the reachable URL, runtime inspection, console logs, screenshots, and interactions. Do not duplicate device-debugging workflow here or present `agent-lynx` as an artifact builder or server.
