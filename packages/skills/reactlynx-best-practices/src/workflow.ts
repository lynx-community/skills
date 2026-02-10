// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { applyFixes } from './auto-fix';
import { analyzeSource, createScanSummary } from './scanner';
import type {
  Fix,
  ScanResult,
  ScanSummary,
  WorkflowContext,
  WorkflowMode,
} from './types';

export interface FixPlan {
  totalIssues: number;
  fixableIssues: number;
  manualIssues: number;
  files: FilePlan[];
}

export interface FilePlan {
  path: string;
  issues: IssuePlan[];
}

export interface IssuePlan {
  ruleId: string;
  severity: string;
  message: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  fixable: boolean;
  suggestedFixes: Fix[];
}

export class ReactLynxWorkflow {
  private context: WorkflowContext;

  constructor(mode: WorkflowMode) {
    this.context = { mode };
  }

  getMode(): WorkflowMode {
    return this.context.mode;
  }

  getContext(): WorkflowContext {
    return this.context;
  }

  reviewCode(source: string): ScanSummary {
    const diagnostics = analyzeSource(source, { generateFixes: true });
    const result: ScanResult = {
      file: 'inline',
      diagnostics,
      source,
    };
    const summary = createScanSummary([result]);
    this.context.scanResults = summary;
    return summary;
  }

  generateFixPlan(): FixPlan | null {
    if (!this.context.scanResults) {
      return null;
    }

    const files: FilePlan[] = [];
    let fixableIssues = 0;
    let manualIssues = 0;

    for (const result of this.context.scanResults.results) {
      const issues: IssuePlan[] = [];

      for (const diagnostic of result.diagnostics) {
        const hasAutoFix =
          diagnostic.fixes !== undefined && diagnostic.fixes.length > 0;
        if (hasAutoFix) {
          fixableIssues++;
        } else {
          manualIssues++;
        }

        issues.push({
          ruleId: diagnostic.ruleId,
          severity: diagnostic.severity,
          message: diagnostic.message,
          location: diagnostic.location,
          fixable: hasAutoFix,
          suggestedFixes: diagnostic.fixes || [],
        });
      }

      if (issues.length > 0) {
        files.push({
          path: result.file,
          issues,
        });
      }
    }

    return {
      totalIssues: this.context.scanResults.totalIssues,
      fixableIssues,
      manualIssues,
      files,
    };
  }

  applyAutoFixes(source: string): { fixed: string; appliedFixes: Fix[] } {
    const diagnostics = analyzeSource(source, { generateFixes: true });
    const allFixes: Fix[] = [];

    for (const diagnostic of diagnostics) {
      if (diagnostic.fixes && diagnostic.fixes.length > 0) {
        allFixes.push(diagnostic.fixes[0]);
      }
    }

    const fixed = applyFixes(source, allFixes);

    this.context.fixesApplied = [
      {
        file: 'inline',
        fixes: allFixes,
      },
    ];

    return { fixed, appliedFixes: allFixes };
  }
}

export function formatFixPlan(plan: FixPlan): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('  Fix Plan');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`📊 Summary:`);
  lines.push(`   Total issues: ${plan.totalIssues}`);
  lines.push(`   ✅ Auto-fixable: ${plan.fixableIssues}`);
  lines.push(`   ✋ Manual review needed: ${plan.manualIssues}`);
  lines.push('');

  for (const file of plan.files) {
    lines.push(`📁 ${file.path}`);
    for (const issue of file.issues) {
      const icon = issue.fixable ? '✅' : '✋';
      lines.push(
        `   ${icon} Line ${issue.location.start.line}: ${issue.message}`,
      );
      if (issue.fixable && issue.suggestedFixes.length > 0) {
        lines.push(`      💡 Fix: ${issue.suggestedFixes[0].description}`);
      }
    }
    lines.push('');
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

export const WORKFLOW_GUIDE = {
  writing: {
    title: '📝 Writing Mode',
    description:
      'Reference ReactLynx best practices while writing new code. Rules are provided as guidelines.',
    actions: [
      'Check rules/*.md for best practices',
      'Follow dual-thread architecture patterns',
      'Use background-only directive for native module calls',
    ],
  },
  review: {
    title: '🔍 Review Mode',
    description:
      'Analyze existing code for ReactLynx issues using the scanner.',
    actions: [
      'Run reviewCode(source) to analyze code',
      'Check formatScanReport() for detailed report',
      'Review each diagnostic and its location',
    ],
  },
  refactor: {
    title: '🔧 Refactor Mode',
    description:
      'Fix detected issues with auto-fix suggestions. Ask user before applying fixes.',
    actions: [
      'Generate fix plan with generateFixPlan()',
      'Ask user: "Would you like me to apply auto-fixes?"',
      'Apply fixes with applyAutoFixes() if approved',
      'Verify fixes by re-running review',
    ],
  },
};
