# Get Source Info

Get the source location for a Lynx element node by numeric node ID or a cached Snapshot ref.

## Usage

```bash
agent-lynx get-source-info <nodeId|@eN> [options]
```

## Options

- `-c, --client <clientId>`: Client ID. If not provided, the command will attempt to discover the first available client.
- `-s, --session <sessionId>`: Session ID. If not provided, the command will attempt to discover the latest session (with the largest session ID).

## Behavior

1. **Resolve Node**: Uses the numeric node ID directly, or resolves `@eN` from the latest daemon-cached Snapshot.
   Snapshot refs require daemon mode; numeric node IDs also work with `--no-daemon`.
2. **Query Runtime**: Sends `DOM.getOriginalNodeSourceInfo` for the resolved element node ID.
3. **Fetch Metadata**: Downloads the returned debug metadata when `debugMetadataUrl` and `nodeIndex` are available.
4. **Remap Location**: Resolves the node index to its repository, source file, line, and column.
5. **Report Status**: Reports `mapped`, `runtime_only`, or `unsupported` to describe the source-location result.

## Output

Prints a JSON object containing node information (`nodeId`, `tag`, `nodeIndex`, `debugMetadataUrl`, `lazyBundleUrl`) and the source-location result (`repo`, `source`, `line`, `column`, `status`, `reason`).

- `mapped`: A source file, line, and column were resolved.
- `runtime_only`: The node is a runtime-generated `wrapper` without a direct source location.
- `unsupported`: Required metadata is missing, metadata could not be fetched or remapped, or `nodeIndex` is absent from the UI source map.

## Examples

```bash
agent-lynx get-source-info 13
agent-lynx snapshot
agent-lynx get-source-info @e3
```
