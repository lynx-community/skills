// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { generateFixes } from './auto-fix';
import { analyzeBackgroundOnlyUsage } from './background-only';
import type { DiagnosticWithFix, ScanResult, ScanSummary } from './types';

export function analyzeSource(
  source: string,
  options?: { generateFixes?: boolean },
): DiagnosticWithFix[] {
  const diagnostics = analyzeBackgroundOnlyUsage(source);

  if (!options?.generateFixes) {
    return diagnostics;
  }

  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    fixes: generateFixes(source, diagnostic),
  }));
}

export function formatScanReport(summary: ScanSummary): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('  ReactLynx Best Practices Scan Report');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`📊 Summary:`);
  lines.push(`   Total files scanned: ${summary.totalFiles}`);
  lines.push(`   Files with issues: ${summary.filesWithIssues}`);
  lines.push(`   Total issues: ${summary.totalIssues}`);
  lines.push('');
  lines.push(`   ❌ Errors: ${summary.errorCount}`);
  lines.push(`   ⚠️  Warnings: ${summary.warningCount}`);
  lines.push(`   ℹ️  Info: ${summary.infoCount}`);
  lines.push('');

  if (summary.results.length > 0) {
    lines.push('─'.repeat(60));
    lines.push('  Issues by File');
    lines.push('─'.repeat(60));
    lines.push('');

    for (const result of summary.results) {
      if (result.diagnostics.length === 0) continue;

      lines.push(`📁 ${result.file}`);
      for (const diagnostic of result.diagnostics) {
        const icon =
          diagnostic.severity === 'error'
            ? '❌'
            : diagnostic.severity === 'warning'
              ? '⚠️'
              : 'ℹ️';
        lines.push(
          `   ${icon} Line ${diagnostic.location.start.line}: ${diagnostic.message}`,
        );
        if (diagnostic.fixes && diagnostic.fixes.length > 0) {
          lines.push(`      💡 ${diagnostic.fixes.length} fix(es) available`);
        }
      }
      lines.push('');
    }
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

export function createScanSummary(results: ScanResult[]): ScanSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const result of results) {
    for (const diagnostic of result.diagnostics) {
      switch (diagnostic.severity) {
        case 'error':
          errorCount++;
          break;
        case 'warning':
          warningCount++;
          break;
        case 'info':
          infoCount++;
          break;
      }
    }
  }

  return {
    totalFiles: results.length,
    filesWithIssues: results.filter((r) => r.diagnostics.length > 0).length,
    totalIssues: errorCount + warningCount + infoCount,
    errorCount,
    warningCount,
    infoCount,
    results,
  };
}

export { analyzeBackgroundOnlyUsage } from './background-only';
