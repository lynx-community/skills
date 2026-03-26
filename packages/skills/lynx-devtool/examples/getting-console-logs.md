# Getting Console Logs

```bash
# Get only errors and warnings
node <path_to_the_skill>/scripts/index.mjs get-console --level error,warning
```

## Exploring Object Properties

When the console output includes runtime objects, they are displayed with their descriptions and `objectId`s. You can use `Runtime.getProperties` via CDP to inspect the contents of these objects.

### Step 1: Capture Console Logs

First, capture the console logs to find the `objectId` of the object you want to inspect.

```bash
node <path_to_the_skill>/scripts/index.mjs get-console -s <session_id>
```

**Example Output:**

```
- [log]: <Array(1) (objectId:13561514816)>
- [log]: <Object (objectId:13561514624)>
```

### Step 2: Retrieve Object Properties

Once you have the `objectId` (e.g., `13561514624`), use the `cdp` command to call `Runtime.getProperties`.

```bash
node <path_to_the_skill>/scripts/index.mjs cdp -s <session_id> -m Runtime.getProperties '{"objectId": "13561514624", "ownProperties": true}'
```

**Example Output:**

```json
{
  "internalProperties": [],
  "result": [
    {
      "configurable": true,
      "enumerable": true,
      "name": "foo",
      "value": {
        "description": "42",
        "type": "number",
        "value": 42
      },
      "writable": true
    },
    {
      "configurable": true,
      "enumerable": false,
      "name": "__proto__",
      "value": {
        "className": "Object",
        "description": "Object",
        "objectId": "13859757760",
        "type": "object"
      },
      "writable": true
    }
  ]
}
```
