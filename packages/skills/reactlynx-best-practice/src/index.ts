import { analyzeBackgroundOnlyUsage } from './background-only';
import { analyzeSource } from './scanner';

export { applyFix, applyFixes, generateFixes } from './auto-fix';

export { analyzeBackgroundOnlyUsage } from './background-only';

export {
  analyzeSource,
  createScanSummary,
  formatScanReport,
} from './scanner';

export type {
  Diagnostic,
  DiagnosticWithFix,
  Fix,
  RuleConfig,
  ScanConfig,
  ScanResult,
  ScanSummary,
  WorkflowContext,
  WorkflowMode,
} from './types';

export {
  type FilePlan,
  type FixPlan,
  formatFixPlan,
  type IssuePlan,
  ReactLynxWorkflow,
  WORKFLOW_GUIDE,
} from './workflow';

export function runSkill(source: string) {
  return analyzeBackgroundOnlyUsage(source);
}

export function runSkillWithFixes(source: string) {
  return analyzeSource(source, { generateFixes: true });
}

export const rules = {
  'detect-background-only': {
    id: 'detect-background-only',
    severity: 'error' as const,
    message:
      'lynx.getJSModule and NativeModules must only be called in background-only contexts.',
  },
};
