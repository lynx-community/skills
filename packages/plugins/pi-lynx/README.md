# @lynx-js/pi-plugin-lynx

Pi Agent plugin for Lynx development. At runtime it reads the Lynx baseline skills and startup reminder from its `@lynx-js/ai-plugin-lynx` dependency.

Runtime skill discovery requires Pi Agent 0.50.8 or newer.

## Install

```sh
pi install npm:@lynx-js/pi-plugin-lynx
```

## Verify

```sh
pi list
pi --no-tools -p "The Lynx startup instructions contain a line that starts with \"Lynx llms.txt:\". Reply with exactly the URL on that line and nothing else."
```
