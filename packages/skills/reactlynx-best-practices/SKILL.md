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

## Input

This skill accepts the following inputs:

| Input | Required | Description |
|-------|----------|-------------|
| `sourceCode` | No | The ReactLynx source code to analyze (string or file path) |
| `mode` | No | Workflow mode: `writing`, `review`, or `refactor`. Auto-detected if not specified |

### Mode Auto-Detection

When `mode` is not explicitly provided, the skill will determine the appropriate mode based on context:

| Context | Auto-Selected Mode |
|---------|-------------------|
| User is asking for best practices or guidelines | `writing` |
| User wants to check/analyze existing code for issues | `review` |
| User wants to fix/refactor code with auto-fixes | `refactor` |

## Workflow Modes

### 📝 Writing Mode

When writing new ReactLynx code, reference the rules in `rules/*.md` as best practice guidelines. See also the [Rules](#rules) section below for a summary of all available rules.

**Use this mode when:**
- User is creating new ReactLynx components or application
- User asks "how should I write..." or "what's the best practice for..."
- No existing code to analyze

### 🔍 Review Mode

When reviewing code, do both:
1. Use the scanner (`scripts/index.mjs`) to analyze source code for issues
2. Combine findings with `rules/*.md` explanations to generate a rule-aware report

**Use this mode when:**
- User provides code and asks to "check", "review", or "analyze" it
- User wants to know if their code has any issues
- User asks "is this code correct?" or "any problems with this?"

**Report requirements (must include):**
- Scan summary from `workflow.reviewCode(sourceCode)`
- Rule interpretation for each hit `ruleId` from `rules/<ruleId>.md`
- Severity/impact context from rule metadata (`impact`, `impactDescription`)
- Actionable suggestions based on rule guidance (not only raw diagnostics)

```bash
node -e "
import fs from 'fs';
import { ReactLynxWorkflow, formatScanReport } from '<path_to_skill>/scripts/index.mjs';

// <sourceCode>: string (source code) or file path
const input = '<sourceCode>';
const sourceCode = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;

const workflow = new ReactLynxWorkflow('review');
const summary = workflow.reviewCode(sourceCode);
console.log(formatScanReport(summary));
"
```

### 🔧 Refactor Mode

When refactoring, generate a fix plan and **ask the user before applying**.  
In this mode, output must include both script results and a rules-aware report.

**Use this mode when:**
- User explicitly asks to "fix", "refactor", or "auto-fix" code
- User wants to apply suggested fixes from a previous review
- User says "please fix these issues" or "apply the fixes"

**Report requirements (must include):**
- Pre-fix scan summary and rule-aware interpretation
- Fix plan summary (`fixableIssues`, `manualIssues`, per-file changes)
- Post-fix outcome (`appliedFixes`) and remaining manual issues

```
TOOL CALL: AskUserQuestion(
  question: "🔧 Found {fixableIssues} auto-fixable issues. Would you like me to apply these fixes?",
  options: ["Yes, apply fixes", "No, show me the issues first", "Skip auto-fix"]
)
```

```bash
node -e "
import fs from 'fs';
import { ReactLynxWorkflow, formatFixPlan } from '<path_to_skill>/scripts/index.mjs';

// <sourceCode>: string (source code) or file path
const input = '<sourceCode>';
const sourceCode = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;

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
