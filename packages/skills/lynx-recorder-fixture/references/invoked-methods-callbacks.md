# Invoked Method Data and Callback Reference

These two sections describe **JS-to-native bridge calls** and their **asynchronous callback results**. During recording, they capture which native methods JS calls. During replay, the recorded callback results are returned to JS, giving the page logic deterministic inputs.

Sources: `core/services/recorder/native_module_recorder.cc` and `testbench_base_recorder.cc` in the public Lynx engine.

---

## Invoked Method Data

`Invoked Method Data` is an array. Each entry records a JS call to a native module across the bridge.

```json
{
  "Module Name": "<native module name>",
  "Method Name": "<method name>",
  "Record Time": "<Unix seconds>",
  "RecordMillisecond": <Unix milliseconds>,
  "Params": {
    "argc": <integer argument count>,
    "args": [ /* serialized arguments */ ],
    "returnValue": <synchronous return value>,
    "callback": [ "<callback ID string>", ... ]   // Present only when callbacks exist.
  }
}
```

Field meanings:

| Field | Meaning |
|---|---|
| `Module Name` | Native module name registered by the host; examples below use the synthetic `DemoModule` |
| `Method Name` | Method name in the module, defined by the app |
| `argc` | Number of JS arguments; equals the length of `args` |
| `args` | Arguments serialized in call order. **Function arguments become the string `"function"`**; NaN becomes `"NaN"`; circular references become `"[Circular Reference]"` |
| `returnValue` | The native method's **synchronous** return value; asynchronous results belong to `Callback` |
| `callback` | Callback IDs registered by this call, as a string array. These IDs are keys in the `Callback` map. **The field is absent when the callback count is zero** |

### Locate calls by their actual module and method

Module names, method names, and argument order are defined by the host. Do not assume every request uses a particular generic bridge. The synthetic `DemoModule.request` below accepts a request object and a callback:

```json
{ "Module Name": "DemoModule", "Method Name": "request", "Record Time": "1780911467",
  "RecordMillisecond": 1780911467631,
  "Params": {
    "argc": 2,
    "args": [ { "url": "https://example.com/api/items" }, "function" ],
    "returnValue": "undefined",
    "callback": [ "1" ] } }
```

If the app uses a generic bridge, the API name may appear in `args`; determine its position from the fixture and app code.

### Synchronous returns and calls without callbacks

```json
{ "Module Name": "DemoModule", "Method Name": "isReady",
  "Record Time": "1780911467", "RecordMillisecond": 1780911467314,
  "Params": { "argc": 0, "args": [], "returnValue": true } }

{ "Module Name": "DemoModule", "Method Name": "notify",
  "Record Time": "1780911467", "RecordMillisecond": 1780911467931,
  "Params": { "argc": 1, "args": [ { "sendEvent": true } ], "returnValue": "undefined" } }
```

---

## Callback

`Callback` is a **map (object)**, not an array. Each key is a callback ID string matching an ID in an `Invoked Method Data` entry's `Params.callback` array.

```json
"4": {
  "Module Name": "DemoModule",
  "Method Name": "request",
  "Record Time": "1780911467",
  "RecordMillisecond": 1780911467723,
  "Params": { "returnValue": { "msg": "", "code": 1.0, "data": { "data": "" } } }
}
```

Key points:

- **A callback's `Params` contains only `returnValue`**, without `argc`/`args`.
- `returnValue` supplies the argument or arguments passed back to the JS callback function.
- `returnValue` has two forms:
  - Single-argument callback: a single value (object or scalar).
  - Multi-argument callback: an **array**, with each element representing one callback argument.

### Call and callback associations

```
Invoked Method Data entry: Params.callback = ["1", "2"]
                                  │
                                  ▼
Callback["1"] = { ... Params.returnValue ... }   ← Input to JS callback #1
Callback["2"] = { ... Params.returnValue ... }   ← Input to JS callback #2
```

During replay, the engine uses an invoked method's callback ID list to retrieve the corresponding `returnValue` entries from the `Callback` map and pass them to the JS callbacks.

### Edit mock response data

To make a page receive a different backend response during replay, such as a different task list, error code, empty dataset, or error state, edit the corresponding `Callback[id].Params.returnValue`.

**Locate the callback to edit**:

1. Match the target module, method, and request arguments (such as the request URL) in `Invoked Method Data`.
2. Read its `Params.callback` to obtain the IDs, such as `["31"]`.
3. Edit `Callback["31"].Params.returnValue`.

> Preserve the original response's **structure and types**, including field names, nesting, and whether `code` is a number or string. Otherwise page JS may fail to parse the response, making the replay result unreliable.

---

## SharedData

`SharedData` is a map from keys to arbitrary JSON values written by JS. It is empty (`{}`) in most fixtures.

```json
"SharedData": {
  "userInfo": { "id": 7, "name": "alice" },
  "theme": "dark"
}
```

---

## Scripts

`Scripts` maps script URLs to `base64(zlib(source code))` values. It is empty (`{}`) in most fixtures. To inspect a script, apply another base64 decode and zlib decompression to its value.

---

## Debug Info

`Debug Info` is an array of debugging information, such as source maps or debug-info.json:

```json
"Debug Info": [
  { "url": "https://.../debug-info.json", "content": "<base64(zlib(original content))>" }
]
```

The `content` is also compressed and encoded separately; decode another layer to inspect it. Most production fixtures have an empty array (`[]`).
