---
name: reactlynx-best-practices
description: Review, write, and refactor ReactLynx code using dual-thread, lifecycle, main-thread script, code-splitting, and profiling best practices.
---

# ReactLynx Best Practices

Use this skill when writing, reviewing, or refactoring ReactLynx code. ReactLynx follows the React programming model, but Lynx's dual-thread runtime changes how side effects, lifecycle timing, event handlers, and main-thread scripts should be reasoned about.

This skill intentionally does not require `@ast-grep/napi` or any native parser at runtime. The bundled scanner is a lightweight heuristic helper for common issues. The agent must still read the code and apply the rule documents in `rules/*.md`.

## When to Apply

- Writing new ReactLynx components or application code.
- Reviewing ReactLynx code for thread-boundary, lifecycle, event, code-splitting, or performance issues.
- Refactoring code that calls `lynx.getJSModule`, `NativeModules`, `runOnMainThread`, `runOnBackground`, `lazy`, `Suspense`, or `useLayoutEffect`.
- Investigating performance traces that include ReactLynx render, diff, commit, patch, or setState events.

## Official References

- Thinking in ReactLynx: https://lynxjs.org/next/react/thinking-in-reactlynx.html
- Rendering Process and Lifecycle: https://lynxjs.org/next/react/lifecycle.html
- Main Thread Script: https://lynxjs.org/next/react/main-thread-script.html
- Code Splitting: https://lynxjs.org/next/react/code-splitting.html
- Performance Profiling: https://lynxjs.org/next/react/performance/profiling

## Workflow

### 1. Classify the task

Use one of these modes:

| Mode | Use when |
|------|----------|
| `writing` | The user asks for new ReactLynx code or best-practice guidance |
| `review` | The user asks to check, audit, explain, or validate existing code |
| `refactor` | The user asks to fix or rewrite existing code |

If the mode is not explicit, infer it from the user's wording. Prefer `review` before `refactor` when code has not been inspected yet.

### 2. Inspect the code

For repository work, search before editing:

```bash
rg "lynx.getJSModule|NativeModules|useLayoutEffect|main-thread:|runOnMainThread|runOnBackground|lazy\\(|Suspense|background only" <target>
```

Read nearby components, custom hooks, custom components that forward event handlers, Rspeedy config, and performance-related code before making changes.

### 3. Run the helper scanner when source is available

The scanner catches common background-only and lifecycle issues. It is not a complete parser and must not replace code review.

```bash
node -e "
import fs from 'fs';
import { ReactLynxWorkflow, formatScanReport } from '<path_to_skill>/scripts/index.mjs';

const input = '<sourceCodeOrFilePath>';
const sourceCode = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;
const workflow = new ReactLynxWorkflow('review');
const summary = workflow.reviewCode(sourceCode);
console.log(formatScanReport(summary));
"
```

### 4. Apply the rule checklist

Always combine scanner output with these manual checks:

- Dual-thread boundaries: render code may run on the main thread; side effects and native APIs must be background-only.
- Background-only propagation: code called only from background-only code is background-only, but custom prop and custom hook boundaries often need an explicit `'background only'` directive.
- Lifecycle: `useLayoutEffect` is unsupported; use `useEffect` for background side effects or main-thread layout events/refs for layout reads.
- Events: normal `bind*`/`catch*` handlers run on the background thread; `main-thread:*` handlers require `'main thread'` and have stricter limitations.
- MTS: captured values must be JSON-serializable, captured variables cannot be modified, nested main-thread functions are unsupported, and cross-thread calls must use `runOnMainThread()` or `runOnBackground()`.
- Shared modules: import helpers with `with { runtime: 'shared' }` only for code sharing, not state sharing.
- Code splitting: lazy components need default exports, `Suspense`, CSS scope awareness, and error handling for important boundaries.
- Profiling: use trace events and readable `displayName` values to identify hot render/diff/update paths before optimizing.

### 5. Refactor safely

For refactor mode:

1. Report current findings first.
2. Explain which fixes are mechanical and which require human design judgment.
3. Apply only scoped changes.
4. Re-run the helper scanner or package tests after edits.

Use auto-fixes only as suggestions. The current auto-fixes are designed for `detect-background-only` diagnostics and should be reviewed before applying.

```bash
node -e "
import fs from 'fs';
import { ReactLynxWorkflow, formatFixPlan } from '<path_to_skill>/scripts/index.mjs';

const input = '<sourceCodeOrFilePath>';
const sourceCode = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;
const workflow = new ReactLynxWorkflow('refactor');
workflow.reviewCode(sourceCode);
const plan = workflow.generateFixPlan();

if (plan) {
  console.log(formatFixPlan(plan));
}
"
```

## Rules

| Rule | Impact | Use for |
|------|--------|---------|
| [detect-background-only](./rules/detect-background-only.md) | CRITICAL | `lynx.getJSModule`, `NativeModules`, `'background only'`, custom event/hook boundaries |
| [avoid-use-layout-effect](./rules/avoid-use-layout-effect.md) | MEDIUM | Lifecycle and layout reads |
| [proper-event-handlers](./rules/proper-event-handlers.md) | MEDIUM | `bindtap`, `catchtap`, propagation, dataset, custom prop handlers |
| [main-thread-scripts-guide](./rules/main-thread-scripts-guide.md) | MEDIUM | `main-thread:*`, `useMainThreadRef`, cross-thread calls, shared modules |
| [code-splitting](./rules/code-splitting.md) | MEDIUM | `lazy`, `Suspense`, standalone lazy bundles, CSS bundle scope |
| [performance-profiling](./rules/performance-profiling.md) | MEDIUM | ReactLynx trace events, flow IDs, displayName |
| [hoist-static-jsx](./rules/hoist-static-jsx.md) | LOW | Static JSX and render cost |

## API Reference

```typescript
function runSkill(source: string): Diagnostic[];
function runSkillWithFixes(source: string): DiagnosticWithFix[];
function analyzeBackgroundOnlyUsage(source: string): Diagnostic[];
function analyzeLifecycleUsage(source: string): Diagnostic[];
function generateFixes(source: string, diagnostic: Diagnostic): Fix[];
function applyFix(source: string, fix: Fix): string;
function applyFixes(source: string, fixes: Fix[]): string;
function formatScanReport(summary: ScanSummary): string;
function formatFixPlan(plan: FixPlan): string;
```

```typescript
class ReactLynxWorkflow {
  constructor(mode: WorkflowMode);
  reviewCode(source: string): ScanSummary;
  generateFixPlan(): FixPlan | null;
  applyAutoFixes(source: string): { fixed: string; appliedFixes: Fix[] };
}
```
