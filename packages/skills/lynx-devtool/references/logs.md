# Host Script events

Use `logs` to receive asynchronous observer or runtime messages after the command that installed a listener has returned. It listens to `HSR.messageReceived` on the client's global CDP session (`-1`). A page session is not required.

```sh
agent-lynx logs --client "$CLIENT_ID" --follow --json
```

Start the watcher first. Once stderr says `Listening for HSR events`, install the observer and trigger the action from another command. The app must implement HSR automatic error reporting. When an HSR observer callback throws, the runtime publishes an `hsr.error` event without a script-side catch or emit call. Synchronous `HSR.loadScript` / `HSR.evaluate` failures still return through their command responses. This does not cover every asynchronous exception or native crash. Page console output remains available through `get-console --watch`.

## Options and output

- `-c, --client <clientId>` selects a discovered client; omitted means the first discovered client. The target remains fixed for the invocation. Automatic discovery uses the connector's discovery timeouts; interruption during discovery takes effect before opening the event stream. Pass an explicit client to skip discovery.
- `-f, --follow` waits for future events until interrupted, the connection ends, or `--limit` is reached. `SIGINT`, `SIGTERM`, and a closed output pipe release this subscription while other daemon clients continue.
- `-j, --json` writes one JSON object per line in both modes. Diagnostics and the listening notice go to stderr.
- `--limit <number>` stops after a positive number of matching events.

Without `--follow`, capture ends after 500 ms of stream silence or at most 5 seconds. This is a short live capture, not a historical query. There is no replay, durable cursor, or automatic reconnection; events before subscription or during disconnection may be missed. The global subscription continues when a page closes.

Each JSON record has `version: 1`, `source: "hsr"`, the selected `clientId`, `sessionId: -1`, a host `receivedAt` ISO timestamp, and the unchanged `message` string. If `message` parses as JSON, `data` contains that value. The CLI does not infer severity from an opaque string or require a particular event schema.

For example, a runtime can publish a JSON message containing:

```json
{"version":1,"thread":"ui","runtimeId":"4","payload":{"type":"hsr.error","level":"error","message":"Error: observer callback failed","phase":"interceptor"}}
```

The consumer can inspect `record.data.payload.level` and `record.data.payload.type` for this producer's schema, while retaining `record.message` for complete provenance. Runtime timestamps, if supplied, remain inside `data`; `receivedAt` is when the CLI received the event.

## Consumption by an agent

Run the watcher using the agent host's managed background-command facility. Continue issuing operation commands, and read newly available stdout records from that running command. An operation's success response only acknowledges that operation; a later `hsr.error` event can arrive independently.

`--follow` exposes a stream. Scheduling a model turn or notifying a user when an event arrives remains the responsibility of the agent host. Stop the watcher when the observation task ends.
