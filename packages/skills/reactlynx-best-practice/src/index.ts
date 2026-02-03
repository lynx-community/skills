import { analyzeBackgroundOnlyUsage, Diagnostic } from './background-only';

export function runSkill(source: string): Diagnostic[] {
  return analyzeBackgroundOnlyUsage(source);
}

export const rules = {
  'detect-background-only': {
    id: 'detect-background-only',
    severity: 'error' as const,
    message:
      'lynx.getJSModule and NativeModules must only be called in background-only contexts.',
  },
};
