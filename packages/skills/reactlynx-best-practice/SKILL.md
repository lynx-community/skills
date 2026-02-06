---
name: reactlynx-best-practices
description: ReactLynx best practices covering dual-thread architecture and React patterns. Provides rules reference for writing, static analysis for reviewing, and auto-fix for refactoring.
---

# ReactLynx Best Practices

ReactLynx best practices covering dual-thread architecture and React patterns. Provides rules reference for writing, static analysis for reviewing, and auto-fix for refactoring.

## When to Apply

This skill should be used when:
- **Writing** new ReactLynx components or application → Reference rules as guidelines
- **Reviewing** existing ReactLynx code → Use scanner to detect issues
- **Refactoring** ReactLynx code → Use auto-fix with user approval

## Workflow Modes

### 📝 Writing Mode

When writing new ReactLynx code, reference the rules in `rules/*.md` as best practice guidelines. See also the [Rules](#rules) section below for a summary of all available rules.

### 🔍 Review Mode

When reviewing code, use the scanner to analyze source code for issues:

```bash
node -e "
const { ReactLynxWorkflow, formatScanReport } = await import('<path_to_skill>/scripts/index.mjs');
const sourceCode = \`
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
\`;
const workflow = new ReactLynxWorkflow('review');
const summary = workflow.reviewCode(sourceCode);
console.log(formatScanReport(summary));
"
```

### 🔧 Refactor Mode

When refactoring, generate a fix plan and **ask the user before applying**:

```
TOOL CALL: AskUserQuestion(
  question: "🔧 Found {fixableIssues} auto-fixable issues. Would you like me to apply these fixes?",
  options: ["Yes, apply fixes", "No, show me the issues first", "Skip auto-fix"]
)
```

```bash
node -e "
const { ReactLynxWorkflow, formatFixPlan } = await import('<path_to_skill>/scripts/index.mjs');
const sourceCode = \`
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
\`;
const workflow = new ReactLynxWorkflow('refactor');
workflow.reviewCode(sourceCode);
const plan = workflow.generateFixPlan();

if (plan && plan.fixableIssues > 0) {
  console.log(formatFixPlan(plan));
  // ASK USER: 'Would you like me to apply these auto-fixes?'
  // If yes:
  const { fixed, appliedFixes } = workflow.applyAutoFixes(sourceCode);
  console.log('Fixed code:', fixed);
}
"
```

## Rules

All rules are documented in the `rules/` directory as Markdown files:

| Rule | Impact | Description |
|------|--------|-------------|
| [detect-background-only](./rules/detect-background-only.md) | CRITICAL | Native APIs in background contexts, use `'background only'` directive |
| [proper-event-handlers](./rules/proper-event-handlers.md) | MEDIUM | Correct event handler usage |
| [main-thread-scripts-guide](./rules/main-thread-scripts-guide.md) | MEDIUM | Main thread scripts guide |
| [hoist-static-jsx](./rules/hoist-static-jsx.md) | LOW | Performance optimization |

## API Reference

For complete type definitions:

```
TOOL CALL: Read(<path_to_skill>/scripts/index.d.ts)
```

### Exported Functions

```typescript
function runSkill(source: string): Diagnostic[];
function runSkillWithFixes(source: string): DiagnosticWithFix[];
function analyzeBackgroundOnlyUsage(source: string): Diagnostic[];
function generateFixes(source: string, diagnostic: Diagnostic): Fix[];
function applyFix(source: string, fix: Fix): string;
function applyFixes(source: string, fixes: Fix[]): string;
function formatScanReport(summary: ScanSummary): string;
function formatFixPlan(plan: FixPlan): string;
```

### Workflow Class

```typescript
class ReactLynxWorkflow {
  constructor(mode: WorkflowMode);
  reviewCode(source: string): ScanSummary;
  generateFixPlan(): FixPlan | null;
  applyAutoFixes(source: string): { fixed: string; appliedFixes: Fix[] };
}
```

### Key Types

```typescript
type WorkflowMode = 'writing' | 'review' | 'refactor';

interface Diagnostic {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: { start: { line: number; column: number }; end: { line: number; column: number } };
}

interface DiagnosticWithFix extends Diagnostic {
  fixes?: Fix[];
}

interface Fix {
  type: 'wrap-in-useEffect' | 'add-directive' | 'add-import' | 'move-to-event-handler';
  description: string;
  oldCode: string;
  newCode: string;
  location: { start: { line: number; column: number }; end: { line: number; column: number } };
}

interface ScanSummary {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  results: ScanResult[];
}

interface FixPlan {
  totalIssues: number;
  fixableIssues: number;
  manualIssues: number;
  files: FilePlan[];
}
```
