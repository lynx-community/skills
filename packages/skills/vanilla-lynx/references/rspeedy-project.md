# Vanilla Lynx Rspeedy Project

Use this reference to define the project structure for a Vanilla Lynx app built with Rspeedy and `@lynx-js/vanilla-rsbuild-plugin`. This is the target app scaffold, not the structure of the skill package itself.

The plugin builds the main-thread JavaScript, optional background JavaScript, and CSS into the final Lynx artifact.

## Minimal Project Structure

```text
my-vanilla-lynx-app/
  package.json
  lynx.config.ts
  src/
    main-thread.ts
    background.ts  # optional, add only when background-thread work is needed
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
  },
  "devDependencies": {
    "@lynx-js/rspeedy": "latest",
    "@lynx-js/type-element-api": "latest",
    "@lynx-js/types": "latest",
    "@lynx-js/vanilla-rsbuild-plugin": "latest"
  }
}
```

## lynx.config.ts

Point `source.entry` at the main-thread source and enable `pluginVanillaLynx()`:

```ts
import { defineConfig } from "@lynx-js/rspeedy";
import { pluginVanillaLynx } from "@lynx-js/vanilla-rsbuild-plugin";

export default defineConfig({
  source: {
    entry: "./src/main-thread.ts",
  },
  plugins: [pluginVanillaLynx()],
  environments: {
    web: {},
    lynx: {},
  },
});
```

With this convention-based layout, the plugin discovers sibling `background.ts` and `style.css` files automatically. Use the plugin's explicit `entries` option only when these files do not share a directory or follow these names.

## Source File Roles

- `src/main-thread.ts`: build and update the page tree with Element PAPI APIs.
- `src/background.ts`: optional; receive tasks from the main thread, run heavier business, async, timer, or native logic, and send data back so the main thread can update the UI.
- `src/style.css`: define page and node styles.
- `src/rspeedy-env.d.ts`: declare Lynx and Element API types.

## Example Usage

For a complete published reference example, see [`@lynx-example/vanilla`](https://www.npmjs.com/package/@lynx-example/vanilla).
