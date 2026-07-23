---
title: Component Library Packaging
ruleId: component-library-packaging
impact: HIGH
impactDescription: preserves ReactLynx JSX for the consumer toolchain
tags: component-library, package, typescript, tsx, jsx, tsc
---

## Component Library Packaging

Prefer publishing TS/TSX source from reusable ReactLynx component libraries. Let the consuming ReactLynx toolchain compile JSX so it can apply the framework-specific transform.

This rule applies to component libraries, not application entry projects whose JSX is already compiled by their own Rspeedy build.

### Preferred: Publish Source

Export the library's source entry and include its source files in the package:

```json
{
  "files": ["src", "dist/types"],
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "default": "./src/index.ts"
    }
  }
}
```

Keep ReactLynx components as `.tsx` files reachable from that entry. If declaration files are required, run `tsc` in declaration-only mode while continuing to publish the TS/TSX source as the executable entry:

```json
{
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "jsx": "preserve",
    "outDir": "dist/types"
  }
}
```

Adapt the exact export conditions and declaration paths to the repository's package conventions. The invariant is that the consumer receives untransformed ReactLynx JSX.

### If `tsc` Emits Executable Files

Keep JSX intact:

```json
{
  "compilerOptions": {
    "declaration": true,
    "jsx": "preserve",
    "outDir": "dist"
  }
}
```

TypeScript emits `.tsx` inputs containing JSX as `.jsx` when `jsx` is `preserve`. Point package exports at the actual emitted extension.

Do not use the classic React transform for a ReactLynx component-library build:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "React.createElement"
  }
}
```

That transform erases the JSX before the consuming ReactLynx toolchain can process it. Also check Babel, SWC, Rslib, or other post-`tsc` stages: `jsx: "preserve"` in TypeScript is insufficient if a later stage still emits `React.createElement(...)`.

### Review Checklist

- Distinguish a reusable component library from an application entry project.
- Prefer an export path that leaves ReactLynx components in TS/TSX source form.
- If `tsc` runs only for types, use `emitDeclarationOnly` and keep source exports.
- If `tsc` emits executable files, set `jsx: "preserve"` and export the emitted `.jsx` path where applicable.
- Inspect every later transform and the packed artifact for `React.createElement(`.
- Build a small ReactLynx consumer against the packed package before publishing.
