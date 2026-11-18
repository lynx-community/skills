---
name: agent-lynx
description: >-
  agent-lynx is Lynx for your agent, providing a CLI and a set of sub-skills for your Lynx tasks:
  lynx-devtool: Android/iOS/Desktop DevTool/CDP/App/connector debugging, DOM/CSS/ReactLynx, UI snapshots/ref actions, annotated screenshots, sources, runtime/console logs and reload/open;
  lynx-trace-record/lynx-trace-analysis: performance trace capture/export/validation & analysis;
  lynx-recorder/lynx-recorder-fixture: Recorder/Testbench capture/replay diagnosis & fixture editing;
  lynx-tasm-codec: native TASM (template.js) encode/decode/compare;
---

# agent-lynx

Use this Skill for end-to-end Lynx development and diagnosis: inspect apps with DevTool/CDP, capture traces or recordings, inspect memory evidence, edit Recorder fixtures, and convert TASM templates.

## About agent-lynx

`agent-lynx` is the CLI for inspecting and operating Lynx apps, live clients, sessions, devices, and generated artifacts. It also exposes task Skills for development and diagnosis. This Skill selects the relevant capability and coordinates the work; task-specific execution instructions come from the selected Skills, loaded on demand.

A live device/session is not an artifact. Performance traces, Recorder replay JSON, TASM templates, and heap snapshots have different purposes; choose the capability for the requested result. Capabilities outside the CLI's Skill catalog are discovered in the Lynx Skills repository below.

## Installation and invocation

Use `agent-lynx` on PATH. If `command -v agent-lynx` fails, run commands through npm without adding a dependency to the user's project:

```bash
npx --yes agent-lynx@latest <command>
```

For a persistent global installation when requested:

```bash
npm install -g agent-lynx
agent-lynx <command>
```

Use the same invocation for `skills list`, `skills get`, help, and commands in the loaded instructions.

## Standard execution method

List the available Lynx Skills and load the best match for the task:

```bash
agent-lynx skills list
agent-lynx skills get <name>
```

1. Run `skills list` and read the current descriptions.
2. Select the single most specific published Skill using the live descriptions and the map below.
3. Run `skills get <name>` and follow the returned instructions.
4. Load a second Skill only when the task crosses capabilities; stop when the task goal is met.
5. Track loaded Skill names and load each only once unless the available set changed.

| User intent                                                                                                                                                    | Load                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Debug Android/iOS/Desktop clients or Lynx/WebView sessions with DevTool/CDP, DOM/CSS, ReactLynx, UI snapshots/refs, logs, or source lookup                     | `lynx-devtool`                   |
| Record page interactions into replay JSON or diagnose a recording                                                                                              | `lynx-recorder`                  |
| Inspect, decode, edit, or encode a Recorder/TestBench fixture, including mock responses and replay actions                                             | `lynx-recorder-fixture`          |
| Encode template input JSON to TASM, decode template binaries to inspection JSON, or compare decoded templates                                                  | `lynx-tasm-codec`                |
| Analyze an existing Lynx performance trace: startup, jank, events, NativeModule latency, memory, or regressions                                                | `lynx-trace-analysis`            |
| Record, download, and validate a Lynx performance trace                                                                                                        | `lynx-trace-record`              |
| Other tasks with no matching Skill in the current list | Search `https://github.com/lynx-community/skills` for a suitable Skill |

`agent-lynx` publishes the task Skills summarized above. Live `skills list` descriptions take priority over this summary; request only names returned by the current list. The published Skill payload, not dependency package names, defines this inventory.

For the repository fallback, search its `skills/` directory and read the selected `SKILL.md` and its required bundled resources directly. Repository-only Skills are not names to pass to `agent-lynx skills get`.

If `skills list` or `skills get` fails, or the repository cannot be read, report the failed command or access error and try another readable discovery source when available. A failed lookup leaves that source unresolved; it does not establish that no matching Skill exists. Report a missing capability only after successfully searching both discovery sources with no match. Do not route back to this Skill or invent instructions for a Skill that could not be loaded.

## Common workflow decisions

- Load the most specific Skill for the requested artifact or live workflow. Add another only when the task crosses capabilities.
- Existing-device debugging goes directly to `lynx-devtool`.
- Fixture-only decoding or editing stays with `lynx-recorder-fixture`.
- For Lynx/WebView debugging, select the session from returned metadata, not from the URL scheme alone.
- Use `lynx-trace-record` for trace collection and capture-quality checks; use `lynx-trace-analysis` for startup, jank, event delivery, or trace-based memory diagnosis, including PSS, shared BTS contexts, and VM pools.
- A high current memory total alone is not leak proof. Native C++ profiler, ASAN/tombstone, and `dumpsys meminfo` inputs are not JS heap snapshots.
- Use `lynx-recorder` to create or diagnose a recording.
- Use `lynx-tasm-codec` through native `agent-lynx tasm encode` / `agent-lynx tasm decode`, not a separate codec CLI. Keep the fixed default backend, downloaded on first conversion with SHA-512 verification; do not automatically set `--codec-version`. TASM inspection JSON is not encoder-input JSON or a Recorder fixture. Follow the loaded Skill and `agent-lynx tasm --help` for conversion details.

## Current command surface

Do not infer CLI subcommands from Skill names or guess flags. Inspect the current command tree:

```bash
agent-lynx --help
```
