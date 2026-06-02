// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { analyzeSource } from './scanner';

export { applyFix, applyFixes, generateFixes } from './auto-fix';

export { analyzeBackgroundOnlyUsage } from './background-only';

export { analyzeLifecycleUsage } from './lifecycle';

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
  return analyzeSource(source);
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
  'avoid-use-layout-effect': {
    id: 'avoid-use-layout-effect',
    severity: 'warning' as const,
    message:
      'ReactLynx does not support useLayoutEffect; use useEffect or main-thread layout events instead.',
  },
  'proper-event-handlers': {
    id: 'proper-event-handlers',
    severity: 'warning' as const,
    message:
      'Use ReactLynx event handlers with correct propagation, thread context, and custom prop boundaries.',
  },
  'main-thread-scripts-guide': {
    id: 'main-thread-scripts-guide',
    severity: 'warning' as const,
    message:
      'Use main thread scripts only for low-latency UI work and respect MTS restrictions.',
  },
  'code-splitting': {
    id: 'code-splitting',
    severity: 'info' as const,
    message:
      'Use lazy loading, Suspense, and CSS bundle-scope awareness for split ReactLynx code.',
  },
  'performance-profiling': {
    id: 'performance-profiling',
    severity: 'info' as const,
    message:
      'Use ReactLynx profiling traces, flow IDs, and displayName values to optimize hot paths.',
  },
  'hoist-static-jsx': {
    id: 'hoist-static-jsx',
    severity: 'info' as const,
    message: 'Hoist large static JSX when React Compiler is not handling it.',
  },
};
