export declare function analyzeBackgroundOnlyUsage(source: string): Diagnostic[];

export declare function analyzeSource(source: string, options?: {
    generateFixes?: boolean;
}): DiagnosticWithFix[];

export declare function applyFix(source: string, fix: Fix): string;

export declare function applyFixes(source: string, fixes: Fix[]): string;

export declare function createScanSummary(results: ScanResult[]): ScanSummary;

export declare interface Diagnostic {
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

export declare interface DiagnosticWithFix extends Diagnostic {
    fixes?: Fix[];
}

export declare interface FilePlan {
    path: string;
    issues: IssuePlan[];
}

export declare interface Fix {
    type: 'wrap-in-useEffect' | 'add-directive' | 'add-import' | 'move-to-event-handler';
    description: string;
    oldCode: string;
    newCode: string;
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

export declare interface FixPlan {
    totalIssues: number;
    fixableIssues: number;
    manualIssues: number;
    files: FilePlan[];
}

export declare function formatFixPlan(plan: FixPlan): string;

export declare function formatScanReport(summary: ScanSummary): string;

export declare function generateFixes(source: string, diagnostic: Diagnostic): Fix[];

export declare interface IssuePlan {
    ruleId: string;
    severity: string;
    message: string;
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
    fixable: boolean;
    suggestedFixes: Fix[];
}

export declare class ReactLynxWorkflow {
    private context;
    constructor(mode: WorkflowMode);
    getMode(): WorkflowMode;
    getContext(): WorkflowContext;
    reviewCode(source: string): ScanSummary;
    generateFixPlan(): FixPlan | null;
    applyAutoFixes(source: string): {
        fixed: string;
        appliedFixes: Fix[];
    };
}

export declare interface RuleConfig {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
}

export declare const rules: {
    'detect-background-only': {
        id: string;
        severity: "error";
        message: string;
    };
};

export declare function runSkill(source: string): Diagnostic[];

export declare function runSkillWithFixes(source: string): DiagnosticWithFix[];

export declare interface ScanConfig {
    root: string;
    include?: string[];
    exclude?: string[];
    generateFixes?: boolean;
    severity?: ('error' | 'warning' | 'info')[];
    rules?: string[];
}

export declare interface ScanResult {
    file: string;
    diagnostics: DiagnosticWithFix[];
    source: string;
}

export declare interface ScanSummary {
    totalFiles: number;
    filesWithIssues: number;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    results: ScanResult[];
}

export declare const WORKFLOW_GUIDE: {
    writing: {
        title: string;
        description: string;
        actions: string[];
    };
    review: {
        title: string;
        description: string;
        actions: string[];
    };
    refactor: {
        title: string;
        description: string;
        actions: string[];
    };
};

export declare interface WorkflowContext {
    mode: WorkflowMode;
    scanResults?: ScanSummary;
    fixesApplied?: {
        file: string;
        fixes: Fix[];
    }[];
}

export declare type WorkflowMode = 'writing' | 'review' | 'refactor';

export { }
