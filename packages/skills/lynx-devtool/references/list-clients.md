# List Clients

List all reachable Lynx DevTool clients (connected apps with DevTool enabled).

```bash
agent-lynx list-clients
```

## Behavior and Output

Prints a JSON array of discovered clients. Each entry includes `id` and `info` (`App`, `AppProcessName`, `bundleId`, `bundleName`, `deviceModel`, `osType`, `osVersion`, `sdkVersion`). When no clients are reachable, the command exits non-zero with `No Lynx DevTool clients were found`.

Pass `--no-daemon` to probe direct transports without the shared daemon; stop the daemon first if it may already own a connection to the same DebugRouter target.
