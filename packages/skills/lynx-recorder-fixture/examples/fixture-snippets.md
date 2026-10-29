# Synthetic Fixture Snippets

These snippets illustrate the structure and do not come from application recordings. `DemoModule`, event names, and data are illustrative. Executable template content is omitted, so the snippets are not replayable on their own.

## Config and components

```json
{
  "Config": {
    "jsbIgnoredInfo": [],
    "jsbSettings": { "strict": true },
    "screenWidth": 1080,
    "screenHeight": 1920
  },
  "Component List": [
    { "Name": "view", "Type": 1 },
    { "Name": "text", "Type": 4 }
  ]
}
```

## Action List

```json
{
  "Action List": [
    {
      "Function Name": "setGlobalProps",
      "Record Time": "1700000000",
      "RecordMillisecond": 1700000000000,
      "Params": {
        "global_props": { "screenWidth": 360, "screenHeight": 640, "density": 3 }
      }
    },
    {
      "Function Name": "sendGlobalEvent",
      "Record Time": "1700000001",
      "RecordMillisecond": 1700000001000,
      "Params": {
        "module_id": "GlobalEventEmitter",
        "method_id": "emit",
        "arguments": ["demoPageVisible", [{ "visible": true }]]
      }
    }
  ]
}
```

## Call and callback associations

The call below is associated with `Callback["31"]` through `Params.callback: ["31"]`. To create an empty-list scenario, change only `data.list` and `data.hasMore` in the callback, preserving all other fields and types.

```json
{
  "Invoked Method Data": [
    {
      "Module Name": "DemoModule",
      "Method Name": "request",
      "Record Time": "1700000000",
      "RecordMillisecond": 1700000000200,
      "Params": {
        "argc": 2,
        "args": [{ "url": "https://example.com/api/items" }, "function"],
        "returnValue": "undefined",
        "callback": ["31"]
      }
    }
  ],
  "Callback": {
    "31": {
      "Module Name": "DemoModule",
      "Method Name": "request",
      "Record Time": "1700000000",
      "RecordMillisecond": 1700000000300,
      "Params": {
        "returnValue": {
          "code": 0,
          "msg": "success",
          "data": { "list": [{ "id": "item-1" }], "hasMore": true }
        }
      }
    }
  }
}
```
