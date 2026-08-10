# Vanilla Lynx Project Structure

Use this reference to define the project structure for the vanilla Lynx app that needs to be built with Rspeedy. This is the target app scaffold, not the structure of the skill package itself.

The target app uses Rspeedy to build main-thread JavaScript, optional background JavaScript, and CSS into the final native Lynx artifact.

## Minimal Project Structure

```text
my-vanilla-lynx-app/
  package.json
  lynx.config.js
  plugin.js
  src/
    card/
      main-thread.ts
      background.ts  # optional, add only for heavier work
      style.css
    rspeedy-env.d.ts
```

## package.json

```json
{
  "name": "my-vanilla-lynx-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "rspeedy build",
    "dev": "rspeedy dev"
  }
}
```

## File Roles

- `src/card/main-thread.ts`: build and update the page tree with Element PAPI APIs.
- `src/card/background.ts`: optional; receive tasks from the main thread, run heavier business, async, timer, or native logic, and send data back so the main thread can update the UI.
- `src/card/style.css`: define page and node styles.
- `src/rspeedy-env.d.ts`: declare Lynx and Element API types.
- `lynx.config.js`: configure the Rspeedy entry point and build plugins.
- `plugin.js`: split main-thread and background bundles and emit the native Lynx `.bundle` artifact.

## Example Usage

For a complete published reference example, see [`@lynx-example/vanilla`](https://www.npmjs.com/package/@lynx-example/vanilla).
