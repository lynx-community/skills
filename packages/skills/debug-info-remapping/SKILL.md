---
name: debug-info-remapping
description: Remap the function_id:pc_index to the original source code position by provided debug info json file.
---

# Debug Info Remapping

## Description

In Lynx, main thread script is encoded to bytecode and uses an external debugging information scheme. Under this scheme, the row and column numbers in the runtime error messages are not the actual row and column numbers. The row and column numbers need to be deciphered from the external `debug-info.json` file.

debug-info.json format is as follows:

```json
{
  "lepusNG_debug_info": {
    "function_info": [
      {
        "function_id": 1,
        "function_name": "App",
        "line_col": [
          { "line": 1, "column": 1 },
          { "line": 2, "column": 1 },
          { "line": 3, "column": 1 }
        ]
      }
    ]
  }
}
```

## When to Apply

This skill is useful when you want to remap the `function_id:pc_index` to the original source code position.

When the user encounters a runtime error message with function_id:pc_index, along with `main-thread.js` and `debug-info.json` in the error message, for example:

```
main-thread.js exception: App render failed at main thread backtrace:
    at App (file:///main-thread.js:1356:13)
    at doRender (file:///main-thread.js:1002:12)
    at call (native)
    at render (file:///main-thread.js:466:52)
    at _renderToString (file:///main-thread.js:1001:569)
    at renderToString (file:///main-thread.js:998:191)
    at renderMainThread (file:///main-thread.js:766:45)
    at renderPage (file:///main-thread.js:853:69)
```

Where `function_id:pc_index` is `1356:13`.

## Workflow

### 1. Ask the User for the `function_id:pc_index`

User should provide the `function_id:pc_index` in the error message. Or give you the full backtrace.

You should check if it is a main-thread backtrace. Since background thread backtrace does not need remapping.

### 2. Find the Corresponding Position in debug-info.json

Ask the user for the `debug-info.json` path. For example in a rspeedy project with `main` entry it will locate at:

- `main-thread.js`: `$PROJECT_DIR/dist/.rspeedy/main/main-thread.js`
- `debug-info.json`: `$PROJECT_DIR/dist/.rspeedy/main/debug-info.json`

If the user uses `rspeedy build` and there is no `.rspeedy` folder, remind them to build the project with `DEBUG='rspeedy,rsbuild' rspeedy build`.

### 3. Run the remapping script

For each `function_id:pc_index` pair in the stack trace, run the remapping script.

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/debug-info-remapping/scripts/index.mjs $PROJECT_DIR/[dist]/.rspeedy/[main]/debug-info.json $function_id $pc_index
```

### 4. Output the Remapped Position

The remapping script will output the remapped position in the format of `line:column`.

You should output the remapped position for each `function_id:pc_index` pair.

Replace the `function_id:pc_index` pair in the stack trace with the remapped position and show the remapped stack trace.

### 5. Show the Remapped Stack Trace

If you can reach the `main-thread.js` file, show the remapped stack trace with the remapped positions source code.

The final output should be something like this:

```log
main-thread.js exception: App render failed at main thread backtrace:
    at App (./dist/.rspeedy/main/main-thread.js:9368:56)
    at doRender (./dist/.rspeedy/main/main-thread.js:7237:44)
    at call (native)
    at render (./dist/.rspeedy/main/main-thread.js:3706:72)
    at _renderToString (./dist/.rspeedy/main/main-thread.js:7177:78)
    at renderToString (./dist/.rspeedy/main/main-thread.js:7067:91)
    at renderMainThread (./dist/.rspeedy/main/main-thread.js:5423:113)
    at renderPage (./dist/.rspeedy/main/main-thread.js:6199:46)

   ╭─[5:55]
 3 │ export function App() {
 4 │   if (__MAIN_THREAD__) {
 5 │     throw new Error('App render failed at main thread');
   ·                                                      ─┬
   ·                                                       ╰── main-thread.js exception: App render failed at main thread backtrace
 6 │   }
 7 │
   ╰────

   ... (the same for other callstacks such as doRender, call, render, _renderToString, renderToString, renderMainThread, renderPage here)

Files used:

  - Debug Info: ./dist/.rspeedy/main/debug-info.json
  - Source File: ./dist/.rspeedy/main/main-thread.js
```

The `./dist/.rspeedy/main/main-thread.js:9368:56` will make sure it is clickable in the editor/terminal.
