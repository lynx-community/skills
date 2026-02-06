export interface Diagnostic {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface Fix {
  type:
    | 'wrap-in-useEffect'
    | 'add-directive'
    | 'add-import'
    | 'move-to-event-handler';
  description: string;
  oldCode: string;
  newCode: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface DiagnosticWithFix extends Diagnostic {
  fixes?: Fix[];
}

export interface RuleConfig {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ScanConfig {
  root: string;
  include?: string[];
  exclude?: string[];
  generateFixes?: boolean;
  severity?: ('error' | 'warning' | 'info')[];
  rules?: string[];
}

export interface ScanResult {
  file: string;
  diagnostics: DiagnosticWithFix[];
  source: string;
}

export interface ScanSummary {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  results: ScanResult[];
}

export type WorkflowMode = 'writing' | 'review' | 'refactor';

export interface WorkflowContext {
  mode: WorkflowMode;
  scanResults?: ScanSummary;
  fixesApplied?: {
    file: string;
    fixes: Fix[];
  }[];
}
