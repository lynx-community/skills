# @lynx-js/opencode-plugin-lynx

OpenCode plugin for Lynx development. At runtime it reads the Lynx baseline skills, startup reminder, and shared MCP servers from its `@lynx-js/ai-plugin-lynx` dependency.

## Install

```sh
opencode plugin @lynx-js/opencode-plugin-lynx -g
```

## Verify

```sh
opencode run --model <your-model> "The Lynx startup instructions contain a line that starts with \"Lynx llms.txt:\". Reply with exactly the URL on that line and nothing else."
```
