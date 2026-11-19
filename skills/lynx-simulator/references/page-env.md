# Page environments

Use a local `page-env.mjs` for editable business cases: load fixtures, reuse the
project's mock builder, select a scenario, and implement stateful native replies.
Start by reading the page's initialization and bridge consumers. Preserve the
payloads they consume rather than assigning a reconstructed application Store.
Use JSON only when static data and fixed bridge replies cover the case.

## JavaScript contract

```bash
agent-lynx open '<bundle-url-or-absolute-path>' --client <clientId> --page-env ./page-env.mjs
```

The default export is a factory evaluated once for each opened page. All functions
below may be async; data fields may also be plain objects.
All fields are optional, and `jsb` may instead contain JSON-style bridge rules.

| Function                      | Arguments               | Returns                                                        |
| ----------------------------- | ----------------------- | -------------------------------------------------------------- |
| Default factory               | `context`               | `{ templateData?, globalProps?, context?, nativeData?, jsb? }` |
| `templateData`, `globalProps` | `context`               | The actual object consumed by the page                         |
| `context`                     | `context`               | Per-page host data passed to package JSB handlers              |
| `nativeData`                  | `context`               | Data cloned for each native extension's `createContext()`      |
| `jsb`                         | `name, params, context` | The complete native callback result                            |

Shared context contains `target`, `cwd`, `source` (resolved environment URL), and
`windowOptions` (including `size` and `windowless`). Data functions run before the
window exists; JSB context additionally has `window.id` and `next()`.
The returned `context` field is business data, distinct from the factory argument:
package handlers read it as `handlerContext.context`. `nativeData` stays outside
Lynx template data. See [extension usage](extensions.md) and the complete
[extension page-env example](../examples/extensions/page-env.mjs).
Resolve bundled fixtures with `new URL('./fixtures.json', import.meta.url)`;
`cwd` is the caller's directory, which may differ from the module's directory.

Keep storage, counters, builder sessions, and other mutable state inside the
factory. Reopening the same module then starts an independent page session.
Module-level state is shared, and ESM imports are cached: restart Lynx Simulator
after editing a module.

`name` and `params` come directly from native `--invoke`. Inspect the actual
invocation before unwrapping it: callers may supply parameters directly or wrap
them in an envelope. A direct storage write's own `data` field must stay intact.
Return `context.next()` for unhandled methods; it delegates the original
call to JSB handlers installed by `run` and can still report an unsupported method.
Handlers can reach the network; mock specific requests when the case requires
fixture-only replies.
Returning `undefined` completes the call with that value. Do not return success
for every unknown call or use a broad `/request|open|get/` name matcher.

## JSON for fixed cases

JSON supports local paths, file URLs and HTTP(S). JS requires a local `.mjs` or
ESM `.js` (`"type": "module"`); file URLs work, remote JS does not.

```json
{
  "globalProps": { "appTheme": "light" },
  "jsb": {
    "bridge": [
      {
        "name": "demo.fixture",
        "params": { "key": "preview" },
        "result": { "code": 1, "data": { "value": "page-local mock" } }
      }
    ]
  }
}
```

Any template data and global props must be objects matching the page's protocol.
Bridge rules require `name` and `result`; optional `params` match object subsets
or arrays strictly. A parameterized match wins over a name-only fallback.
Optional `delayMs` is an integer from 0 through 2147483647. Use a JS factory for
state transitions or computed responses.
