---
name: lynx-devtool
description: Interact with Lynx DevTool to inspect and debug Lynx applications. Use this skill to list connected clients and sessions, send Chrome DevTools Protocol (CDP) commands, send App commands, and open URLs in Lynx. This is useful for debugging UI issues, inspecting runtime state, or automating interactions with Lynx apps.
---

# DevTool Skill

This skill allows you to interact with Lynx applications running on connected devices (Android, iOS, Desktop) using the Lynx DevTool CLI.

## Usage

The CLI is located at `<path_to_the_skill>/scripts/index.mjs` relative to this skill's directory. You can run it using `node`.

In the skill directory, use:

```bash
node <path_to_the_skill>/scripts/index.mjs <command>
```

**Note:** All command outputs are multi-line JSON. You can use `jq` or Node.js to process the data.

### Global Options

- `-h, --help`: Display help for command.

**Note:** Each subcommand supports the `--help` flag (e.g. `node <path_to_the_skill>/scripts/index.mjs cdp --help`). Use this to view the full list of available arguments and their descriptions.

## Command List

- [Send CDP Command](examples/cdp.md): Send a supported CDP method to a selected session.
- [Send App Command](examples/app.md): Send an App-level method to the Lynx app.
- [Open URL](examples/open.md): Open a target URL in the Lynx app.
- [Get Sources](examples/get-sources.md): List parsed scripts for later debugger operations.
- [Take Screenshot](examples/take-screenshot.md): Capture the current page as a screenshot.

## Example List

- [Inspecting the DOM](examples/inspecting-the-dom.md): Find a session, fetch the document tree, and inspect a specific node.
- [Evaluating JavaScript](examples/evaluating-javascript.md): Run a small JavaScript expression in the current Lynx session.
- [Redirect with Development URL](examples/redirect-with-development-url.md): Reload a page with a local dev-server URL during development.
- [Getting Console Logs](examples/getting-console-logs.md): Filter console output to focus on errors and warnings.

## Troubleshooting

For connector and transport debug logging, see [Troubleshooting Reference](references/troubleshooting/index.md).

## References

- [Supported CDP Methods](references/cdp/index.md): Detailed documentation of all supported CDP methods, their inputs, and outputs.
- [Supported App Methods](references/app/index.md): Detailed documentation of all supported App methods, their inputs, and outputs.
- [Get Console Reference](references/get-console.md): Detailed documentation of the `get-console` command.
- [Get Sources Reference](references/get-sources.md): Detailed documentation of the `get-sources` command.
- [Take Screenshot Reference](references/take-screenshot.md): Detailed documentation of the `take-screenshot` command.
- [Troubleshooting Reference](references/troubleshooting/index.md): Debug namespaces, transport-level logs, and examples of healthy connector output.
