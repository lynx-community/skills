# @lynx-js/skill-vanilla-lynx

## 0.1.6

### Patch Changes

- dc1f97c: Document parameter contracts for recommended Element PAPI calls and centralize event-listener options guidance.
- 5ce32f6: Constrain Vanilla Lynx styling to a supported CSS allowlist, highlight Web margin-collapse migration fixes, and tighten routing around source-authoring tasks.
- 0427be9: Route bundle-size work in the skill description to `rspeedy-bundle-size`, the skill that exists, instead of the nonexistent `rspeedy-bundle-quality`.

## 0.1.5

### Patch Changes

- 5e0c9e0: Document that `__AddEventListener(element, eventName, handler, options)` requires all four arguments, uses `{}` when no options are needed, and must be paired with matching listener cleanup.

## 0.1.4

### Patch Changes

- ac896a0: Not use ReactLynx/JSX in external bundle for VanillaLynx

## 0.1.3

### Patch Changes

- 6f91792: Add reference tables of contents

## 0.1.2

### Patch Changes

- 284e178: Use the Vanilla Lynx Rsbuild plugin for Rspeedy project scaffolds and focus style guidance on Lynx runtime rules.

## 0.1.1

### Patch Changes

- e24a198: Streamline vanilla Lynx guidance and add focused references for building and loading background-thread external bundles.

## 0.1.0

### Minor Changes

- 634c3f4: Add external bundle guidance, split into a build reference (rslib) and a runtime reference (`lynx.fetchBundle` / `lynx.loadScript`), scoped to background-thread use.

## 0.0.4

### Patch Changes

- 97e4f20: Fix runtime event guidance for cross-thread context pairing, explicit target-thread naming, and main/background thread-local event loops.

## 0.0.3

### Patch Changes

- 3719237: Add `processData` implementation to `globalThis` for current SDK compatibility.
- 0b42f05: Refactor the description of the event context.

## 0.0.2

### Patch Changes

- e96a9af: Add Vanilla Lynx style guidance, streamline reference and runtime-event routing, and restrict the published package to the skill instructions and references so stale generated artifacts cannot be included.
- 67edfe9: Add separate Element PAPI tree examples for non-scrollable and scrollable containers, including fixed-height `__CreateScrollView` usage.
