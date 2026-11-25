# Open Page

Open a URL in the selected Lynx client.

```bash
agent-lynx open <url> [--client <clientId>]
```

## Options

- `<url>`: Target URL to open.
- `-c, --client <clientId>`: Target client ID. Defaults to the first available client when omitted.

For Lynx Simulator bundles, page environments, and window dimensions, use the
`lynx-simulator` Skill (`agent-lynx skills get lynx-simulator`). `open` accepts
`--page-env <path-or-url>`, `--simulator-window-width <pixels>`,
`--simulator-window-height <pixels>`, and `--simulator-windowless` for these clients.

- `--simulator-dpr <factor>` sets the device pixel ratio in windowless mode. It accepts a positive finite number.
- `--simulator-window-background-color <color>` sets the window background behind transparent page areas, for example `'#f5f5f5'`. Default Lynxtron `0.0.31` ignores it in windowless mode; set the page root's `background-color` on `0.0.31` or pass a newer `--lynxtron-version` to `simulator run`.

## Output

Prints the `SessionList` response as JSON. Refresh `list-sessions` if you need the newly created session ID for follow-up commands.
