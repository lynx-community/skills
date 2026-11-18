---
title: Component Library Packaging
ruleId: component-library-packaging
impact: HIGH
impactDescription: preserves ReactLynx JSX for the consumer toolchain
tags: component-library, package, typescript, tsx, jsx, tsc, rslib
---

## Component Library Packaging

Publish reusable ReactLynx component libraries as type-erased ESM with authored JSX still intact in JSX-bearing files. Let the consuming ReactLynx toolchain own the framework-specific JSX transform.

This rule applies to component libraries, not application entry projects whose JSX is already compiled by their own Rspeedy build.

### Preferred: Publish Type-Erased, Preserved-JSX Output

Point the normal runtime entry at emitted ESM and its matching declarations. JSX-bearing `.tsx` modules should remain `.jsx`; a plain `.ts` entry or barrel may emit as `.js`. Include source only as an additional, explicitly selected entry such as `jsnext:source` or a repository-supported package condition:

```json
{
  "type": "module",
  "files": ["dist", "src"],
  "main": "./dist/index.jsx",
  "module": "./dist/index.jsx",
  "types": "./dist/index.d.ts",
  "jsnext:source": "./src/index.tsx",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.jsx"
    }
  }
}
```

Keep `types` before runtime conditions, and keep the top-level `main`, `module`, and `types` fields when the supported consumer matrix includes tools that do not read conditional exports. If the source entry is a plain `.ts` barrel, point `main`, `module`, and `default` at the emitted `.js` file instead. Only add a source condition when the repository and consumer resolver support it; otherwise `jsnext:source` can expose source without replacing the normal runtime entry.

Do not use raw `.ts` or `.tsx` as the universal `default` entry. That makes the package depend on every test runner, documentation tool, and consumer bundler compiling TypeScript inside dependencies.

### Rslib Configuration

Rslib's React transform does not inherit TypeScript's `jsx` emit setting. Configure the React plugin itself, use bundleless output, and emit `.jsx` filenames:

```ts
import { pluginReact } from '@rsbuild/plugin-react'
import { defineConfig } from '@rslib/core'

export default defineConfig({
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'preserve',
      },
    }),
  ],
  lib: [
    {
      bundle: false,
      format: 'esm',
      syntax: 'esnext',
      dts: true,
      output: {
        filename: {
          js: '[name].jsx',
        },
      },
    },
  ],
})
```

`runtime: 'preserve'` and `bundle: false` are both required for Rslib to leave native JSX in bundleless output. Keep package exports aligned with the emitted filenames.

### TypeScript Emit

If `tsc` emits executable files, keep JSX intact:

```json
{
  "compilerOptions": {
    "declaration": true,
    "jsx": "preserve",
    "outDir": "dist"
  }
}
```

TypeScript emits `.tsx` inputs as `.jsx` when `jsx` is `preserve`; `.ts` inputs still emit `.js`. Point every package entry at the file extension that was actually produced.

If `tsc` runs only for declarations, use declaration-only emit while another build step creates the preserved-JSX runtime files:

```json
{
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "jsx": "preserve",
    "outDir": "dist"
  }
}
```

### Check the Packed Artifact

Do not infer preservation only from `tsconfig.json`. Inspect the packed runtime files and confirm that authored JSX such as `<view>`, `<Component>`, or fragments is still present.

Look for evidence that a later TypeScript, Babel, SWC, or Rslib stage lowered JSX:

- classic runtime calls such as `React.createElement(...)`;
- automatic runtime imports from a `jsx-runtime` module;
- automatic helpers such as `_jsx(...)`, `_jsxs(...)`, `_jsxDEV(...)`, or `jsxDEV(...)`;
- calls to a custom `jsxFactory`, Babel `pragma`, or equivalent configured factory.

ReactLynx supports intentional `React.createElement(type, props, children)` calls starting with `@lynx-js/react` 0.121.0. Do not report every occurrence as a runtime incompatibility. For library build output, however, a generated `React.createElement` call still proves that authored JSX was lowered before the consumer compiler could apply JSX-specific transforms, and it excludes older peer versions. Check the package's minimum `@lynx-js/react` peer version and whether the call was authored intentionally before reporting it.

### Review Checklist

- Distinguish a reusable component library from an application entry project.
- Publish type-erased `dist` ESM and matching declarations as the default package entry; keep JSX-bearing files as `.jsx` and export the actual emitted entry extension.
- Expose TS/TSX source only through `jsnext:source` or a repository-supported condition.
- For Rslib, set `runtime: 'preserve'`, `bundle: false`, and a `[name].jsx` filename.
- For `tsc` executable emit, set `jsx: "preserve"` and export the actual `.jsx` or `.js` path.
- Positively confirm JSX remains, then check classic, automatic, and custom-factory lowering.
- Treat `React.createElement` according to its origin, the `@lynx-js/react` peer range, and the lost consumer-side JSX transforms.
- Build a small ReactLynx consumer against the packed package before publishing.
