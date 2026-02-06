# ReactLynx Best Practice

ReactLynx best practices covering dual-thread architecture and React patterns. Provides rules reference for writing, static analysis for reviewing, and auto-fix for refactoring.

## Installation

```bash
pnpm add @lynx-js/skill-reactlynx-best-practice
```

## Quick Start

```typescript
import { runSkill } from '@lynx-js/skill-reactlynx-best-practice';

const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;

const diagnostics = runSkill(source);
// Returns array of diagnostics with violations
```

## Workflow

The skill supports three workflow modes for different use cases.

### 📝 Writing Mode

Reference best practices while writing new ReactLynx code.

```typescript
import { ReactLynxWorkflow, WORKFLOW_GUIDE } from '@anthropic/skill-reactlynx-best-practice';

const workflow = new ReactLynxWorkflow('writing');
console.log(WORKFLOW_GUIDE.writing);
// {
//   title: '📝 Writing Mode',
//   description: 'Reference ReactLynx best practices while writing new code.',
//   actions: ['Check rules/*.md for best practices', ...]
// }
```

### 🔍 Review Mode

Analyze existing code for ReactLynx issues.

```typescript
import { ReactLynxWorkflow, formatScanReport } from '@anthropic/skill-reactlynx-best-practice';

const workflow = new ReactLynxWorkflow('review');
const summary = workflow.reviewCode(source);
console.log(formatScanReport(summary));
```

Output:

```
════════════════════════════════════════════════════════════
  ReactLynx Best Practices Scan Report
════════════════════════════════════════════════════════════

📊 Summary:
   Total files scanned: 1
   Files with issues: 1
   Total issues: 1

   ❌ Errors: 1
   ⚠️  Warnings: 0
   ℹ️  Info: 0

────────────────────────────────────────────────────────────
  Issues by File
────────────────────────────────────────────────────────────

📁 inline
   ❌ Line 3: 'lynx.getJSModule' must only be called in background-only contexts
      💡 3 fix(es) available

════════════════════════════════════════════════════════════
```

### 🔧 Refactor Mode

Fix detected issues with auto-fix suggestions.

```typescript
import { ReactLynxWorkflow, formatFixPlan } from '@lynx-js/skill-reactlynx-best-practice';

const workflow = new ReactLynxWorkflow('refactor');

// Step 1: Review code
workflow.reviewCode(source);

// Step 2: Generate fix plan
const plan = workflow.generateFixPlan();
console.log(formatFixPlan(plan));

// Step 3: Apply fixes (after user confirmation)
const { fixed, appliedFixes } = workflow.applyAutoFixes(source);
console.log('Fixed code:', fixed);
console.log('Applied fixes:', appliedFixes.length);
```

Output:

```
════════════════════════════════════════════════════════════
  Fix Plan
════════════════════════════════════════════════════════════

📊 Summary:
   Total issues: 1
   ✅ Auto-fixable: 1
   ✋ Manual review needed: 0

📁 inline
   ✅ Line 3: 'lynx.getJSModule' must only be called in background-only contexts
      💡 Fix: Wrap the call in useEffect to run on background thread

════════════════════════════════════════════════════════════
```

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [detect-background-only](./rules/detect-background-only.md) | CRITICAL | Native APIs in background contexts, use `'background only'` directive |
| [proper-event-handlers](./rules/proper-event-handlers.md) | MEDIUM | Correct event handler usage |
| [main-thread-scripts-guide](./rules/main-thread-scripts-guide.md) | MEDIUM | Main thread scripts guide |
| [hoist-static-jsx](./rules/hoist-static-jsx.md) | LOW | Performance optimization |

