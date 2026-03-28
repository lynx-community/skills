# Get Console

Capture console logs from the device. This command connects to a Lynx session and streams console logs (Runtime.consoleAPICalled events) for a short duration or until a limit is reached.

## Usage

```bash
node scripts/index.mjs get-console [options]
```

## Options

- `-c, --client <clientId>`: Client ID. If not provided, the command will attempt to discover the first available client.
- `-s, --session <sessionId>`: Session ID. If not provided, the command will attempt to discover the latest available session.
- `--offset <number>`: The number of console messages to skip before returning results. Default is `0`.
- `--limit <number>`: The maximum number of console messages to return. Values are clamped between 1 and 100.
- `--include-stack-traces`: By default, only error messages include stack traces. Set this flag to include stack traces for all message types.
- `--level <levels>`: A comma-separated list of log levels to filter. Default is `info,log,warning,error`.

## Behavior

The command listens for logs for up to 5 seconds. It stops early if:
- The `limit` is reached.
- No new logs are received for 500ms.

## Output

The output is formatted text where each line represents a console message. The format is:
`- [<type>]: <message>`

If a message contains an object or array, it will be represented with its description and `objectId` (e.g., `<Object (objectId:123)>` or `<Array(1) (objectId:456)>`).

If `--include-stack-traces` is set or the message type is `error`, the stack trace will be printed below the message.

## Examples

### Get all recent logs
```bash
node scripts/index.mjs get-console
```

### Get only errors
```bash
node scripts/index.mjs get-console --level error
```

### Get logs with stack traces
```bash
node scripts/index.mjs get-console --include-stack-traces
```

### Pagination (Skip and Limit)
Skip the first 10 logs and get the next 5.
```bash
node scripts/index.mjs get-console --offset 10 --limit 5
```
