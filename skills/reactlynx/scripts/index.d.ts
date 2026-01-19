export interface Diagnostic {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
}
export interface RuleConfig {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}
export declare function analyzeBackgroundOnlyUsage(
  source: string,
): Diagnostic[];
export declare function runSkill(source: string): Diagnostic[];
export declare const rules: {
  'detect-background-only': {
    id: string;
    severity: 'error';
    message: string;
  };
};
