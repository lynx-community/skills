# Daemon Lifecycle

Inspect, start, or gracefully stop the shared local connector daemon (`127.0.0.1:21783` by default).

```bash
agent-lynx daemon status [--port <port>]
agent-lynx daemon start [--port <port>]
agent-lynx daemon stop [--port <port>]
```

## Subcommands and Options

- `daemon status`: Read `/devtool/connector/version` (connector version, protocol versions, `instanceId`, `startedAt`) without starting a daemon.
- `daemon start`: Ensure a compatible daemon is running and print `{ status: "running", port, url }`.
- `daemon stop`: Gracefully stop the running daemon generation (`expectedInstanceId`), closing pooled device connections.
- `--port <port>`: Loopback TCP port (`1`–`65535`, default `21783`). Starting a daemon on a non-default port does not retarget ordinary CLI commands from `21783`.
