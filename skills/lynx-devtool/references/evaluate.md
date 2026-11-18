# Evaluate JavaScript

Evaluate a JavaScript expression in the selected Lynx VM.

```bash
agent-lynx evaluate <expression> [options]
```

## Options

- `<expression>`: JavaScript expression to evaluate.
- `-c, --client <clientId>`: Target client ID.
- `-s, --session <sessionId>`: Target session ID.
- `--thread <background|main>`: Target VM thread (default `background`). On `background`, `lynx` and `nativeLynx` are exposed as local variables; `main` expressions are sent unchanged.
- `--return-by-value` / `--no-return-by-value`: Request serialization by value (default `true`). Pass `--no-return-by-value` to receive an `objectId` for `Runtime.getProperties` or `Runtime.callFunctionOn`. Some Android Lynx runtimes still return an `objectId` for object values even with `returnByValue: true`; wrap with `JSON.stringify(...)` when plain JSON text is needed.
- `--await-promise`: Await a returned Promise when supported by the runtime.
- `--silent`: Do not report or pause on exceptions during evaluation.
- `--context-id <id>`: Integer execution context ID.
- `--throw-on-side-effect`: Fail if side effects cannot be ruled out.
- `--generate-preview`: Request an object preview.
- `--object-group <name>`: Symbolic group name for releasing remote objects.
- `--include-command-line-api`: Expose command-line API helpers when supported.

## Examples

```bash
agent-lynx evaluate 'JSON.stringify(lynx.__globalProps)'
agent-lynx evaluate '1 + 1' --thread main
agent-lynx evaluate 'lynx' --no-return-by-value
```

## Output

Prints the `Runtime.evaluate` result as JSON. Inspect `error`, `exceptionDetails`, and `result.subtype: "error"`—a protocol or runtime exception can still exit with status `0`.
