---
name: lynx-simulator
description: Runs Lynx bundles locally with agent-lynx; uses or develops simulator JSB and native-extension packages (for example, host elements); writes or edits page-env.mjs/page-env.json for page data and mocks. Handles page-env authoring without launching a simulator. Routes existing-device debugging to lynx-devtool and fixture-only work to lynx-recorder-fixture.
---

# Lynx Simulator

Prepare page environments and verify local page cases through the
`agent-lynx` CLI.

For requests to write or edit `page-env.mjs` or `page-env.json`, read
[Page environments](references/page-env.md) and use the project's data and JSB
contracts. If only the file is requested, return it with any required fixture
inputs; CLI setup and a running page are unnecessary. Follow the steps below when
the task also includes opening or verifying a page.

Running Lynx Simulator requires npm and Linux x64 or macOS arm64/x64.
Linux also needs the native host's system libraries, including libEGL, libGLES, libva, and libvdpau.

Use `agent-lynx` on PATH. If unavailable, replace it in commands with:

```bash
npx --yes agent-lynx@latest <command>
```

Check `agent-lynx simulator --help` lists `run`, `get`, `logs`, and `stop` before
starting. If a command is missing, update the CLI through that published invocation;
if still missing, report the missing release. Keep daemon mode. The first `run`
prepares public Core and Lynxtron packages; subsequent runs reuse the cache.

The public host has no default JSB or native-extension packages. Supply page
mocks through page-env and reusable host capabilities through extension packages.

## Prepare and open

1. Identify the bundle URL or local file and the expected page behavior. Use an
   absolute path or file URL for a local bundle: the host runs outside the caller's
   working directory. Compiled bundles are commonly named `template.js`;
   that filename does not mean the bundle is a page-env JavaScript module.
2. When the page needs host data or mocks, read [Page environments](references/page-env.md)
   and prepare `page-env.mjs` alongside the case's business fixtures. Its complete
   [extension example](examples/extensions/page-env.mjs) shows data fields and
   JSB delegation. A JS factory can load data, route native calls, and retain
   per-page state.
   JSON is sufficient for fixed replies.
3. Start Lynx Simulator and save the returned `clientId`, `pid`, and `logPath`:

```bash
agent-lynx simulator run
agent-lynx open '/absolute/path/template.js' --client <clientId> \
  --page-env ./page-env.mjs \
  --simulator-window-width 390 --simulator-window-height 844 \
  --simulator-windowless
agent-lynx list-sessions --client <clientId>
```

Omit `--page-env` when unnecessary. Its relative paths resolve from the calling
CLI's directory. Linux requires windowless rendering; macOS defaults to a visible
window and also accepts `--no-simulator-windowless`. Visible-window dimensions
include window decorations, so verify the page viewport when dimensions matter.

Use `--simulator-dpr <factor>` to set the device pixel ratio for windowless
rendering. Use a positive finite number, such as `2.625`.
Use `--simulator-window-background-color '#f5f5f5'` to set the macOS window color
behind transparent page areas. This option has no effect in windowless mode.
Set the page root's `background-color` to control the background in windowless
screenshots.

Always pass the returned `--client`. Select the page's session from the
open/session response.

## Extend the host

Add bridge handlers with `run --jsb <package>` and native capabilities such as
host elements with `run --native-extension <package>`. Both flags are repeatable.
Choose packages when starting the process; supply per-page `context` and
`nativeData` later with `open --page-env`. Check `simulator run --help` for the
installed version's flags. Later JSB handlers override earlier names, while
page-env mocks take precedence over packages.

Load the relevant guide for the task:

| Task                                                                 | Guide and examples                                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Use packages, choose versions, pass native data, or diagnose loading | [Extension usage](references/extensions.md)                                                                         |
| Develop a JSB or native-extension npm package                        | [Package development](references/extension-development.md), with a JSB package, native loader, and page-env example |

## Verify and finish

Load the debugging instructions with `agent-lynx skills get lynx-devtool` before
inspecting the page. Keep the same explicit client and session for snapshots,
screenshots, console inspection, and interactions. Verify the requested UI or
behavior; an accepted `open` alone does not prove the page loaded successfully.

For browser UI inspection of a Lynx Simulator page, use
`agent-lynx inspect --client <clientId> --session <sessionId>`. Open its printed
localhost (`127.0.0.1`) URL in a browser to access the DevTool UI for that page.

Use `agent-lynx simulator get --client <clientId>` for process status and current sessions,
or `agent-lynx simulator logs --client <clientId> --follow` for host output and
page-environment errors.

Finish with `agent-lynx simulator stop --client <clientId>`. Closing all pages
leaves Lynx Simulator running. Use `agent-lynx daemon stop` only for a dedicated
task daemon: it stops every managed Lynx Simulator process.
If asked to keep the case running, return its client/session IDs, PID, log path,
case files, and stop command instead.

Report the saved case and screenshot paths, the observed result, and any host
behavior that remains unsupported or mocked.

## Recorder input

For a requested fixture-to-case conversion, read [Recorder fixtures](references/recorder-fixture.md).
