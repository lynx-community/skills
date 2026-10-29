# File Format, Encoding, and Timestamps

## Encoding: base64(zlib(JSON))

A fixture `.json` file produced by the recorder is **not** plain JSON. The recorder (`EndRecord` in `core/services/recorder/testbench_base_recorder.cc`) writes it through this pipeline:

1. Serialize the in-memory fixture document to a JSON string using rapidjson `Writer` with `kWriteNanAndInfFlag`, so `NaN`/`Infinity` may appear.
2. Compress with zlib (`compress()`).
3. Encode with modp base64.
4. Write to `<shell_id>.json`.

Replay (`ParserTestBenchRecordData` in `testbench_utils_embedder.cc`) reverses this: base64 decode → zlib inflate → JSON.

The compression level and content affect the base64 prefix, which may start with `eJx`, `eAF`, or `eNp`. Do not infer validity from the prefix alone; decode the file and check the fixture structure.

The `decode`/`encode` commands in `fixture_tool.py` handle both directions, so normal editing does not require manual encoding. If you need to implement decoding yourself:

```python
import base64, zlib, json
data = open('fixture.json', 'rb').read()
fixture = json.loads(zlib.decompress(base64.b64decode(data)))
# ...edit the fixture...
out = base64.b64encode(zlib.compress(
    json.dumps(fixture, ensure_ascii=False, separators=(',', ':')).encode()))
open('encoded.fixture', 'wb').write(out)
```

> Compact separators with no extra spaces produce output closer to the original recording. The replay parser ignores whitespace, so indented JSON also works.

## Top-level structure

The recorder's `CreateRecordedFile` creates a document for each LynxView; `EndRecord` adds `Config` at the end:

| Key | Container | Description |
|---|---|---|
| `Action List` | array | Host-to-engine operation sequence; see `action-list.md` |
| `Invoked Method Data` | array | JS-to-native bridge calls; see `invoked-methods-callbacks.md` |
| `Callback` | object | Callback ID → result; see `invoked-methods-callbacks.md` |
| `Component List` | array | Registered native UI components |
| `Debug Info` | array | Debugging information, often empty |
| `SharedData` | object | Shared JS data, often empty |
| `Scripts` | object | Injected script URL → base64(zlib), often empty |
| `Config` | object | Test environment settings |

## Config

Constructed by `InsertReplayConfig` and `SetScreenSize`:

```json
{
  "jsbIgnoredInfo": [],
  "jsbSettings": { "strict": true },
  "screenWidth": 1080.0,
  "screenHeight": 2308.0
}
```

| Field | Type | Meaning |
|---|---|---|
| `jsbIgnoredInfo` | array | JSB methods ignored during replay; empty by default |
| `jsbSettings.strict` | bool | Whether to validate JSB calls strictly |
| `screenWidth` | float | Screen width in physical pixels |
| `screenHeight` | float | Screen height in physical pixels |

Edit `screenWidth`/`screenHeight` to change screen dimensions. These are **independent** of `updateViewPort.ratio` and `screenWidth/Height/density` in `global_props`. When changing the overall device model, all three may need to agree; otherwise the page may render with inconsistent dimensions.

## Component List

Registered native components, with each entry shaped as `{ "Name": <component name>, "Type": <integer type> }`:

```json
[
  { "Name": "view", "Type": 1 },
  { "Name": "text", "Type": 4 },
  { "Name": "raw-text", "Type": 6 },
  { "Name": "scroll-view", "Type": 1 },
  { "Name": "canvas", "Type": 1 }
]
```

Generated automatically from the components used by the template; normally leave it unchanged.

## Timestamps

`RecordTime` adds timestamps to entries in `Action List`, `Invoked Method Data`, and `Callback`:

- `Record Time`: `std::time(nullptr)` (Unix seconds), stored as a **string**.
- `RecordMillisecond`: milliseconds since the epoch, stored as **int64**.

`SharedData`/`Component List`/`Debug Info`/`Scripts`/`Config` do not have timestamps.

Replay uses `RecordMillisecond` to determine the **relative order** of actions, rather than exact time intervals. Therefore:

- Changing `RecordMillisecond` changes replay order.
- When inserting an entry, choose a timestamp between adjacent entries; it need not reproduce the exact elapsed time.
- Keep timestamps in a logical sequence for an invoked method and its callbacks.
