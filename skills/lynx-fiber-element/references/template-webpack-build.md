# Template Webpack Build Reference

Use this reference for a FiberElement app that bundles main-thread JavaScript, background JavaScript, and CSS through the template-webpack path.

For a complete reference example, see [lynx-family/lynx-examples/examples/fiber-element](https://github.com/lynx-family/lynx-examples/tree/main/examples/fiber-element).

## Minimal Structure

```text
my-fiber-element-app/
  package.json
  lynx.config.js
  plugin.js
  src/
    card/
      main-thread.ts
      background.ts
      style.css
    rspeedy-env.d.ts
```

## package.json

```json
{
  "name": "my-fiber-element-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "rspeedy build",
    "dev": "rspeedy dev"
  }
}
```

## File Roles

- `src/card/main-thread.ts`: build and update the page tree with FiberElement APIs.
- `src/card/background.ts`: read native init data, handle events, and send patches back to the main thread.
- `src/card/style.css`: define page and node styles.
- `src/rspeedy-env.d.ts`: declare Lynx and Element API types.
- `lynx.config.js`: configure the entry point and template-webpack plugin.
- `plugin.js`: split main-thread and background bundles and emit the final `.bundle` file.

## Example Usage

Start from the example repo above, then copy the same file layout and replace the example page logic with your own main-thread tree, background event handling, and styles.
