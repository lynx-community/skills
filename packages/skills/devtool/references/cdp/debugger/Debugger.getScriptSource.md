# Debugger.getScriptSource

- `Debugger.getScriptSource` - Returns source for the script with given id.
- Input: `{scriptId: string}`
- Output: `{scriptSource: string}`
- Description: Returns source for the script with given id.

## Usage

First, use `get-sources` command to find the script ID.

```bash
node scripts/index.mjs get-sources
```

Output:
```json
[
  {
    "scriptId": "1",
    "url": "file:///main-thread.js"
  },
  {
    "scriptId": "5",
    "url": "file:///krypton.js"
  }
]
```

Then, use the `cdp` command to get the source.

```bash
node scripts/index.mjs cdp --method Debugger.getScriptSource '{"scriptId": "1"}'
```

Output:
```json
{
  "scriptSource": "{globalThis.currentDebugAppId = \"5\"}"
}
```
