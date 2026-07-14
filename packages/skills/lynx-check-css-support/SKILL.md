---
name: lynx-check-css-support
description: Query @lynx-js/css-defines compat_data to check Lynx CSS property and nested feature/value support by rendering backend and Lynx version, or check whether a newer dataset version exists. Use when asked whether CSS is supported in Lynx or ReactLynx, which backends support it, when support was added, whether a style change is compatible, whether the bundled data is current, or when inspecting the raw definition JSON.
---

# Check Lynx CSS Support

Use the bundled CLI instead of inferring Lynx support from browser CSS behavior, documentation examples, or TypeScript types. Its data is pinned and bundled when the skill is built, so running a query never downloads or executes packages.

Treat this skill as the authority for declared backend/version availability. For questions about how a property behaves, layout semantics, syntax, or usage examples, consult the official Lynx documentation. If a request asks both whether a feature is supported and how it behaves, query support here first, then consult the docs.

## Query support

Resolve this skill directory, then run:

```bash
node <skill-directory>/scripts/query-css-compat.mjs <property> [options]
```

Query the property's base compatibility across every backend:

```bash
node <skill-directory>/scripts/query-css-compat.mjs display
```

Pass the user's backend and Lynx version when provided. Omitting `--backend` returns every backend. `--lynx-version` classifies availability for that target; it does not change the published `version_added` value.

```bash
node <skill-directory>/scripts/query-css-compat.mjs display \
  --feature grid \
  --backend android \
  --lynx-version 2.0
```

Pass nested feature keys exactly as published. They are case-sensitive and may contain punctuation, such as `Flex`, `rotateX`, or `circle()`. If the exact key is unknown, inspect the property's `compat_data` with `--json` before querying the feature.

```bash
node <skill-directory>/scripts/query-css-compat.mjs filter \
  --feature brightness \
  --backend harmony \
  --lynx-version 3.5 \
  --json
```

## Report findings

Give a concise answer containing:

- The property and nested feature/value, if any.
- The requested backend and Lynx version, or that all backends were compared.
- The resulting `availability` and published `version_added` value or condition.
- Any relevant notes, `partial_implementation`, deprecated, or experimental status.
- The `@lynx-js/css-defines` version shown by the script.

If a definition has no `compat_data`, report that compatibility is unspecified by the dataset. Do not interpret missing compatibility data as unsupported.

Never claim backend support from the definition's top-level `version` or a value's `version` field when `compat_data.__compat.support` provides backend-specific evidence. Do not treat declared availability as proof of browser parity or complete runtime behavior.

## Interpret results

Treat `version_added` as follows:

- A numeric version string is the minimum Lynx version for that backend.
- A non-numeric string is a conditional requirement such as a `targetSdkVersion` gate; preserve and report it verbatim.
- `true` means supported without a numeric minimum in the dataset.
- `false` means unsupported.
- `null` means unknown.

Treat `availability` as follows:

- `available`: supported at the requested version, or supported at some version when no target was supplied.
- `requires-newer-version`: supported only after the requested version.
- `conditional`: support depends on the non-numeric condition shown in `version_added` and cannot be decided from the Lynx version alone.
- `unavailable`: explicitly unsupported.
- `unknown`: not established by the dataset.

## Keep data current

Report the displayed package version with every compatibility answer. When the user asks whether the data is current, or freshness is important to the task, run:

```bash
node <skill-directory>/scripts/query-css-compat.mjs --check-updates
```

Use `--json` when structured output is useful. The check reads only the latest numeric version from the public npm registry. It does not download dataset files, modify the bundled copy, or accept cache overrides. If an update is available, report both versions and recommend updating the skill. Compatibility data changes only through reviewed skill releases that bump the pinned dependency.
