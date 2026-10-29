# Validate a Fixture by Replaying It

An edited file can be delivered directly. When rendering validation is needed, use a Lynx Explorer build that supports TestBench replay. The host must implement the replay entry point; ordinary apps may not support it.

## Serve an accessible fixture

Make the encoded fixture available at a device-accessible HTTP(S) URL. Use an existing file service, or start a temporary server in a directory containing only the fixture for this task:

```bash
python3 -m http.server 8000 --directory /absolute/path/to/fixture-directory
```

For a physical device, use the computer's reachable LAN IP. The computer's `localhost` is not a device-accessible address. Use this temporary server only if the host permits plain HTTP; otherwise use an HTTPS file service. Stop the temporary server after validation.

The fixture's templates, native modules, and components must also be compatible with the target host. A `loadTemplate` entry is required, but does not guarantee replay across different hosts or versions.

## Start replay

Confirm that Lynx Explorer has DevTool enabled and is connected:

```bash
agent-lynx list-clients
```

When multiple clients are connected, explicitly select the Lynx Explorer client ID. Encode the entire fixture URL as a single query parameter so that characters such as `&` and `?` do not alter the replay parameters:

```bash
FIXTURE_URL="https://example.com/fixtures/edited.fixture"
REPLAY_URL=$(python3 -c 'import sys; from urllib.parse import quote; print("sslocal://arkview?url=" + quote(sys.argv[1], safe=""))' "$FIXTURE_URL")
agent-lynx open "$REPLAY_URL" --client <clientId>
```

`example.com` is a placeholder; replace it with the actual file service. If the CLI is not on `PATH`, replace `agent-lynx` with `npx --yes agent-lynx`.

## Check the result

- Inspect rendering and runtime behavior with `agent-lynx screenshot`, DOM/CSS inspection, or `get-console`. Use the relevant command's `--help` for its options.
- If no replay page appears, confirm the selected client, replay support in the build, and the device's ability to download the fixture.
- For a blank page or errors, check template/host compatibility, the structure and types of callback `returnValue` data, callback ID associations, timestamp order, and template data wrappers.
- To record again, use `agent-lynx recorder start/end` and open or reload the target page after `start`.
