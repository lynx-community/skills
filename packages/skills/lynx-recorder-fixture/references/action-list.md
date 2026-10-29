# Action List Reference

`Action List` is an array of operations sent from the host (platform layer) to the Lynx engine. During replay, the engine executes them in ascending `RecordMillisecond` order.

Each action has the same outer structure:

```json
{
  "Function Name": "<action name>",
  "Record Time": "<Unix seconds as a string>",
  "RecordMillisecond": <Unix milliseconds as an integer>,
  "Params": { /* action-specific parameters */ }
}
```

> The recorder's `AddMember` calls produce fields in a fixed order: `Function Name` → `Record Time` → `RecordMillisecond` → `Params`. This makes the fixture shape deterministic. Manually inserted entries do not require this field order, but keeping it consistent is preferable.

Sources: `core/services/recorder/template_assembler_recorder.cc`, `lynxview_init_recorder.cc`, and `native_module_recorder.cc` in the public Lynx engine; `recorder_constants.h` defines the key strings. Page and event values below are illustrative. Actual fields depend on the engine version and host.

## Contents

- Initialization: `setThreadStrategy`, `updateViewPort`, `initialLynxView`
- Template loading: `loadTemplate`, `loadTemplateBundle`, `reloadTemplate`, `LoadComponentWithCallback`, `RequireTemplate`
- Data updates: `setGlobalProps`, `updateMetaData`, `updateConfig`, `updateFontScale`, `updateDataByPreParsedData`
- Events: `SendTouchEvent`, `SendCustomEvent`, `SendBubbleEvent`, `sendGlobalEvent`, `sendEventAndroid`
- Other: `switchEngineFromUIThread`

---

## Initialization

### setThreadStrategy

Sets the LynxView thread strategy. Usually the first entry in `Action List`.

| Field | Type | Meaning |
|---|---|---|
| `threadStrategy` | int | Thread strategy enum: 0 = all on the UI thread; 1 = most-on-tasm; 2 = part-on-layout; 3 = multi-threads |
| `enableJSRuntime` | bool | Whether to enable the JS runtime |

```json
{ "Function Name": "setThreadStrategy", "Record Time": "1780911466", "RecordMillisecond": 1780911466871,
  "Params": { "threadStrategy": 0, "enableJSRuntime": true } }
```

### updateViewPort

Updates the viewport's layout constraints.

| Field | Type | Meaning |
|---|---|---|
| `layoutHeightMode` | int | Height measurement mode; see the table below |
| `layoutWidthMode` | int | Width measurement mode; see the table below |
| `preferredLayoutHeight` | double | Preferred layout height; the exact value in `Definite` mode |
| `preferredLayoutWidth` | double | Preferred layout width |
| `preferredMaxLayoutHeight` | double | Maximum layout height; the upper bound in `AtMost` mode |
| `preferredMaxLayoutWidth` | double | Maximum layout width |
| `ratio` | double | Device pixel ratio |

Measurement modes (`SLMeasureMode`):

| Value | Enum | Meaning |
|---|---|---|
| 0 | Indefinite | Unconstrained (wrap content); the corresponding `preferred*` fields are ignored |
| 1 | Definite | Exactly `preferredLayout{Height,Width}` |
| 2 | AtMost | At most `preferredMaxLayout{Height,Width}` |

```json
{ "Function Name": "updateViewPort", "Record Time": "1780911466", "RecordMillisecond": 1780911466874,
  "Params": { "layoutHeightMode": 0, "layoutWidthMode": 0, "preferredLayoutHeight": 0.0,
              "preferredLayoutWidth": 0.0, "preferredMaxLayoutHeight": 0.0,
              "preferredMaxLayoutWidth": 0.0, "ratio": 3.0 } }
```

### initialLynxView

The constants define `kFuncInitialLynxView = "initialLynxView"`, but the current engine implementation **does not emit** this reserved action. Initialization uses `updateViewPort` and `setThreadStrategy`. Preserve this entry if it appears in an older fixture.

---

## Template loading

### loadTemplate

Loads the main template. `source` is the compiled template binary encoded as base64; it is usually large and should not be edited manually.

| Field | Type | Meaning |
|---|---|---|
| `url` | string | Template URL |
| `source` | string | Template binary encoded as base64 |
| `templateData` | object | Parsed TemplateData with **inline** data fields plus `preprocessorName` (string) and `readOnly` (bool); `{}` when empty |
| `isCSR` | bool | Whether rendering is client-side |

```json
{ "Function Name": "loadTemplate", "Record Time": "1780911467", "RecordMillisecond": 1780911467132,
  "Params": { "url": "https://.../template.js",
    "source": "sVVWAAAAAG0H...<truncated>",
    "templateData": { "userId": 12345, "preprocessorName": "", "readOnly": false },
    "isCSR": false } }
```

### loadTemplateBundle

Uses the same structure as `loadTemplate`, except that `isCSR` is always `true`.

### reloadTemplate

Reloads the template with new data. Here the template data is **wrapped in `value`**, unlike the inline fields in `loadTemplate`. When `template_data` is empty, the entire `Params` value is `null`.

| Field | Type | Meaning |
|---|---|---|
| `value` | object | TemplateData payload |
| `preprocessorName` | string | Preprocessor name |
| `readOnly` | bool | Whether the data is read-only |

```json
{ "Function Name": "reloadTemplate", "Record Time": "...", "RecordMillisecond": ...,
  "Params": { "value": { "list": [1,2,3], "count": 3 }, "preprocessorName": "", "readOnly": true } }
```

### LoadComponentWithCallback

Loads a dynamic component (lazy bundle) with a callback ID.

| Field | Type | Meaning |
|---|---|---|
| `url` | string | Component URL |
| `source` | string | Component binary encoded as base64 |
| `sync_tag` | bool | Synchronous or asynchronous loading |
| `callback_id` | int | Callback identifier |

```json
{ "Function Name": "LoadComponentWithCallback", "Record Time": "1780911469", "RecordMillisecond": 1780911469379,
  "Params": { "url": "https://.../weekend/template.js?...", "source": "3KgIAA...<truncated>",
              "sync_tag": false, "callback_id": 1001 } }
```

### RequireTemplate

| Field | Type | Meaning |
|---|---|---|
| `url` | string | URL of the required template |
| `sync_tag` | bool | Whether the request is fulfilled synchronously |

```json
{ "Function Name": "RequireTemplate", "Record Time": "...", "RecordMillisecond": ...,
  "Params": { "url": "https://.../lazy-component.js", "sync_tag": true } }
```

---

## Data updates

### setGlobalProps

Sets global properties. `global_props` is the global context read by the page, such as device information, login state, and A/B experiments. Actual recordings often contain more than 60 fields.

```json
{ "Function Name": "setGlobalProps", "Record Time": "1780911467", "RecordMillisecond": 1780911467085,
  "Params": { "global_props": { "screenHeight": 803, "density": 3, "os": "android",
                                "appVersion": 380900, "isLogin": 1 /* ... */ } } }
```

### updateMetaData

Updates global props and template data together. `templateData` uses the `value` wrapper.

| Field | Type | Meaning |
|---|---|---|
| `global_props` | object | Global properties |
| `templateData` | object | `{ value, preprocessorName, readOnly }` |

### updateConfig

| Field | Type | Meaning |
|---|---|---|
| `config` | object | Configuration object |
| `noticeDelegate` | bool | Whether to notify the delegate |

### updateFontScale

| Field | Type | Meaning |
|---|---|---|
| `scale` | float | Font scale factor |
| `type` | string | Scale type |

### updateDataByPreParsedData

| Field | Type | Meaning |
|---|---|---|
| `value` | object | TemplateData payload |
| `preprocessorName` | string | Preprocessor name |
| `updatePageOption` | object | See below |
| `readOnly` | bool | Whether the data is read-only |

`updatePageOption` fields: `from_native` (bool), `reset_page_data` (bool), `update_first_time` (bool), `reload_template` (bool), `global_props_changed` (bool), `reload_from_js` (bool), and `native_update_data_order_` (int).

---

## Events

### SendTouchEvent

Single-touch events; multi-touch events are not currently recorded.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Event name, such as tap |
| `tag` | int | Target node tag |
| `root_tag` | int | Root node tag |
| `x`, `y` | float | Coordinates relative to the element |
| `client_x`, `client_y` | float | Client coordinates |
| `page_x`, `page_y` | float | Page coordinates |

### SendCustomEvent

Custom events, such as `layoutchange`, are **the most common** events in replay. These include `pname`, unlike `SendBubbleEvent`.

| Field | Type | Meaning |
|---|---|---|
| `tag` | int | Target node tag |
| `root_tag` | int | Root node tag |
| `name` | string | Event name |
| `pname` | string | Parameter key used when delivering `params` |
| `params` | object | Event parameters |

```json
{ "Function Name": "SendCustomEvent", "Record Time": "1780911467", "RecordMillisecond": 1780911467497,
  "Params": { "tag": 30, "root_tag": 10, "name": "layoutchange", "pname": "params",
    "params": { "top": 0, "left": 0, "bottom": 38.6667, "width": 23, "id": "tooltip__content_1",
                "height": 38.6667, "timestamp": 1780911467496 } } }
```

### SendBubbleEvent

The same as `SendCustomEvent`, but **without `pname`**.

| Field | Type | Meaning |
|---|---|---|
| `tag` | int | Target node tag |
| `root_tag` | int | Root node tag |
| `name` | string | Event name |
| `params` | object | Event parameters |

### sendGlobalEvent

Dispatches a global event to JS. The keys are `module_id`/`method_id`/`arguments`, unlike the naming used by other actions.

| Field | Type | Meaning |
|---|---|---|
| `module_id` | string | Usually `GlobalEventEmitter` |
| `method_id` | string | Usually `emit` |
| `arguments` | array | `[event name, event parameters...]` |

```json
{ "Function Name": "sendGlobalEvent", "Record Time": "1780911468", "RecordMillisecond": 1780911468323,
  "Params": { "module_id": "GlobalEventEmitter", "method_id": "emit",
    "arguments": [ "demoPageVisible", [ { "msg": "success", "code": 1.0, "data": { "from": "lynx" } } ] ] } }
```

### sendEventAndroid

Native Android touch/key events. All values are **strings**.

event_type=0 (touch):

```json
{ "Function Name": "sendEventAndroid", "Record Time": "...", "RecordMillisecond": ...,
  "Params": { "action": "0", "x": "100", "y": "200", "metaState": "0", "type": "touch" } }
```

event_type=1 (key):

```json
{ "Function Name": "sendEventAndroid", "Record Time": "...", "RecordMillisecond": ...,
  "Params": { "action": "0", "keycode": "66", "metaState": "0", "type": "key" } }
```

---

## Other

### switchEngineFromUIThread

| Field | Type | Meaning |
|---|---|---|
| `attach` | bool | true = attach; false = detach |

```json
{ "Function Name": "switchEngineFromUIThread", "Record Time": "...", "RecordMillisecond": ...,
  "Params": { "attach": true } }
```

---

## Two template data forms

- `loadTemplate` / `loadTemplateBundle`: `templateData` has **inline** data fields plus `preprocessorName` and `readOnly`.
- `reloadTemplate` / `updateDataByPreParsedData` / `updateMetaData`: data is wrapped in a **`value`** field.

Preserve this distinction when copying template data between actions, or replay will not be able to read the data.
