import { Lang, parse } from "@ast-grep/napi";
const BACKGROUND_ONLY_DIRECTIVE = "'background only'";
const BACKGROUND_ONLY_DIRECTIVE_DOUBLE = '"background only"';
const EVENT_HANDLER_ATTRS = [
    'bindtap',
    'catchtap'
];
function isBackgroundOnlyAPI(node) {
    const text = node.text();
    if (text.startsWith('lynx.getJSModule')) return {
        isMatch: true,
        apiName: 'lynx.getJSModule'
    };
    if (text.startsWith('NativeModules')) return {
        isMatch: true,
        apiName: 'NativeModules'
    };
    return {
        isMatch: false,
        apiName: ''
    };
}
function isInsideUseEffect(node) {
    let current = node;
    while(null !== current){
        const parent = current.parent();
        if (null === parent) break;
        current = parent;
        if ('call_expression' === current.kind()) {
            const callee = current.child(0);
            if (callee) {
                const text = callee.text();
                if ('useEffect' === text || 'useLayoutEffect' === text || 'useImperativeHandle' === text) return true;
            }
        }
    }
    return false;
}
function isInsideBackgroundOnlyFunction(node) {
    let current = node;
    while(null !== current){
        const parent = current.parent();
        if (null === parent) break;
        current = parent;
        const kind = current.kind();
        if ('function_declaration' === kind || 'arrow_function' === kind || 'function_expression' === kind) {
            const body = current.children().find((c)=>'statement_block' === c.kind());
            if (body) {
                const firstStatement = body.children().find((c)=>'expression_statement' === c.kind());
                if (firstStatement) {
                    const expr = firstStatement.child(0);
                    if (expr && 'string' === expr.kind()) {
                        const text = expr.text();
                        if (text === BACKGROUND_ONLY_DIRECTIVE || text === BACKGROUND_ONLY_DIRECTIVE_DOUBLE) return true;
                    }
                }
            }
        }
    }
    return false;
}
function findEventHandlerFunctions(root) {
    const handlerFunctions = new Set();
    const jsxAttributes = root.findAll({
        rule: {
            kind: 'jsx_attribute'
        }
    });
    for (const attr of jsxAttributes){
        const nameNode = attr.children().find((c)=>'property_identifier' === c.kind());
        if (!nameNode) continue;
        const attrName = nameNode.text();
        if (!EVENT_HANDLER_ATTRS.includes(attrName)) continue;
        const valueNode = attr.children().find((c)=>{
            const kind = c.kind();
            return 'jsx_expression' === kind || 'string' === kind || 'string_fragment' === kind;
        });
        if (valueNode) if ('jsx_expression' === valueNode.kind()) {
            const inner = valueNode.child(1);
            if (inner && 'identifier' === inner.kind()) handlerFunctions.add(inner.text());
        } else {
            const text = valueNode.text().replace(/['"]/g, '');
            if (text) handlerFunctions.add(text);
        }
    }
    return handlerFunctions;
}
function isInsideEventHandler(node, eventHandlerFunctions) {
    let current = node;
    while(null !== current){
        const parent = current.parent();
        if (null === parent) break;
        current = parent;
        const kind = current.kind();
        if ('function_declaration' === kind) {
            const nameNode = current.children().find((c)=>'identifier' === c.kind());
            if (nameNode && eventHandlerFunctions.has(nameNode.text())) return true;
        }
        if ('arrow_function' === kind || 'function_expression' === kind) {
            const varParent = current.parent();
            if (varParent && 'variable_declarator' === varParent.kind()) {
                const varName = varParent.children().find((c)=>'identifier' === c.kind());
                if (varName && eventHandlerFunctions.has(varName.text())) return true;
            }
        }
    }
    return false;
}
function isInlineEventHandler(node) {
    let current = node;
    while(null !== current){
        const parent = current.parent();
        if (null === parent) break;
        current = parent;
        if ('jsx_expression' === current.kind()) {
            const jsxAttr = current.parent();
            if (jsxAttr && 'jsx_attribute' === jsxAttr.kind()) {
                const nameNode = jsxAttr.children().find((c)=>'property_identifier' === c.kind());
                if (nameNode && EVENT_HANDLER_ATTRS.includes(nameNode.text())) return true;
            }
        }
    }
    return false;
}
function isInsideRefCallback(node) {
    let current = node;
    while(null !== current){
        const parent = current.parent();
        if (null === parent) break;
        current = parent;
        if ('jsx_expression' === current.kind()) {
            const jsxAttr = current.parent();
            if (jsxAttr && 'jsx_attribute' === jsxAttr.kind()) {
                const nameNode = jsxAttr.children().find((c)=>'property_identifier' === c.kind());
                if (nameNode && 'ref' === nameNode.text()) return true;
            }
        }
    }
    return false;
}
function analyzeBackgroundOnlyUsage(source) {
    const diagnostics = [];
    const ast = parse(Lang.Tsx, source);
    const root = ast.root();
    const eventHandlerFunctions = findEventHandlerFunctions(root);
    const memberExpressions = root.findAll({
        rule: {
            kind: 'member_expression'
        }
    });
    const callExpressions = root.findAll({
        rule: {
            kind: 'call_expression'
        }
    });
    const allNodes = [
        ...memberExpressions,
        ...callExpressions
    ];
    const processedRanges = new Set();
    for (const node of allNodes){
        const { isMatch, apiName } = isBackgroundOnlyAPI(node);
        if (!isMatch) continue;
        const range = node.range();
        const rangeKey = `${range.start.line}:${range.start.column}`;
        if (processedRanges.has(rangeKey)) continue;
        processedRanges.add(rangeKey);
        if (isInsideUseEffect(node)) continue;
        if (isInsideBackgroundOnlyFunction(node)) continue;
        if (!isInsideEventHandler(node, eventHandlerFunctions)) {
            if (!isInlineEventHandler(node)) {
                if (!isInsideRefCallback(node)) diagnostics.push({
                    ruleId: 'detect-background-only',
                    message: `'${apiName}' must only be called in background-only contexts (useEffect, useImperativeHandle, ref callback, 'background only' functions, or event handlers).`,
                    severity: 'error',
                    location: {
                        start: {
                            line: range.start.line + 1,
                            column: range.start.column
                        },
                        end: {
                            line: range.end.line + 1,
                            column: range.end.column
                        }
                    }
                });
            }
        }
    }
    return diagnostics;
}
function generateFixes(source, diagnostic) {
    const fixes = [];
    const lines = source.split('\n');
    const lineIndex = diagnostic.location.start.line - 1;
    const line = lines[lineIndex] || '';
    const startCol = diagnostic.location.start.column;
    const endCol = diagnostic.location.end.column;
    const violatingCode = line.slice(startCol, endCol);
    fixes.push({
        type: 'wrap-in-useEffect',
        description: 'Wrap the call in useEffect to run on background thread',
        oldCode: violatingCode,
        newCode: `useEffect(() => {\n  ${violatingCode};\n}, [])`,
        location: diagnostic.location
    });
    fixes.push({
        type: 'add-directive',
        description: "Move to a function with 'background only' directive",
        oldCode: violatingCode,
        newCode: `function doBackgroundWork() {\n  'background only';\n  ${violatingCode};\n}`,
        location: diagnostic.location
    });
    fixes.push({
        type: 'move-to-event-handler',
        description: 'Move the call to an event handler (bindtap/catchtap)',
        oldCode: violatingCode,
        newCode: `function handleTap() {\n  ${violatingCode};\n}\n// Use: <view bindtap={handleTap} />`,
        location: diagnostic.location
    });
    return fixes;
}
function applyFix(source, fix) {
    const lines = source.split('\n');
    const lineIndex = fix.location.start.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return source;
    const line = lines[lineIndex];
    const before = line.slice(0, fix.location.start.column);
    const after = line.slice(fix.location.end.column);
    lines[lineIndex] = before + fix.newCode + after;
    return lines.join('\n');
}
function applyFixes(source, fixes) {
    const sortedFixes = [
        ...fixes
    ].sort((a, b)=>{
        if (a.location.start.line !== b.location.start.line) return b.location.start.line - a.location.start.line;
        return b.location.start.column - a.location.start.column;
    });
    let result = source;
    for (const fix of sortedFixes)result = applyFix(result, fix);
    return result;
}
function analyzeSource(source, options) {
    const diagnostics = analyzeBackgroundOnlyUsage(source);
    if (!options?.generateFixes) return diagnostics;
    return diagnostics.map((diagnostic)=>({
            ...diagnostic,
            fixes: generateFixes(source, diagnostic)
        }));
}
function formatScanReport(summary) {
    const lines = [];
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
        for (const result of summary.results)if (0 !== result.diagnostics.length) {
            lines.push(`📁 ${result.file}`);
            for (const diagnostic of result.diagnostics){
                const icon = 'error' === diagnostic.severity ? '❌' : 'warning' === diagnostic.severity ? '⚠️' : 'ℹ️';
                lines.push(`   ${icon} Line ${diagnostic.location.start.line}: ${diagnostic.message}`);
                if (diagnostic.fixes && diagnostic.fixes.length > 0) lines.push(`      💡 ${diagnostic.fixes.length} fix(es) available`);
            }
            lines.push('');
        }
    }
    lines.push('═'.repeat(60));
    return lines.join('\n');
}
function createScanSummary(results) {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    for (const result of results)for (const diagnostic of result.diagnostics)switch(diagnostic.severity){
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
    return {
        totalFiles: results.length,
        filesWithIssues: results.filter((r)=>r.diagnostics.length > 0).length,
        totalIssues: errorCount + warningCount + infoCount,
        errorCount,
        warningCount,
        infoCount,
        results
    };
}
class ReactLynxWorkflow {
    context;
    constructor(mode){
        this.context = {
            mode
        };
    }
    getMode() {
        return this.context.mode;
    }
    getContext() {
        return this.context;
    }
    reviewCode(source) {
        const diagnostics = analyzeSource(source, {
            generateFixes: true
        });
        const result = {
            file: 'inline',
            diagnostics,
            source
        };
        const summary = createScanSummary([
            result
        ]);
        this.context.scanResults = summary;
        return summary;
    }
    generateFixPlan() {
        if (!this.context.scanResults) return null;
        const files = [];
        let fixableIssues = 0;
        let manualIssues = 0;
        for (const result of this.context.scanResults.results){
            const issues = [];
            for (const diagnostic of result.diagnostics){
                const hasAutoFix = void 0 !== diagnostic.fixes && diagnostic.fixes.length > 0;
                if (hasAutoFix) fixableIssues++;
                else manualIssues++;
                issues.push({
                    ruleId: diagnostic.ruleId,
                    severity: diagnostic.severity,
                    message: diagnostic.message,
                    location: diagnostic.location,
                    fixable: hasAutoFix,
                    suggestedFixes: diagnostic.fixes || []
                });
            }
            if (issues.length > 0) files.push({
                path: result.file,
                issues
            });
        }
        return {
            totalIssues: this.context.scanResults.totalIssues,
            fixableIssues,
            manualIssues,
            files
        };
    }
    applyAutoFixes(source) {
        const diagnostics = analyzeSource(source, {
            generateFixes: true
        });
        const allFixes = [];
        for (const diagnostic of diagnostics)if (diagnostic.fixes && diagnostic.fixes.length > 0) allFixes.push(diagnostic.fixes[0]);
        const fixed = applyFixes(source, allFixes);
        this.context.fixesApplied = [
            {
                file: 'inline',
                fixes: allFixes
            }
        ];
        return {
            fixed,
            appliedFixes: allFixes
        };
    }
}
function formatFixPlan(plan) {
    const lines = [];
    lines.push('═'.repeat(60));
    lines.push('  Fix Plan');
    lines.push('═'.repeat(60));
    lines.push('');
    lines.push(`📊 Summary:`);
    lines.push(`   Total issues: ${plan.totalIssues}`);
    lines.push(`   ✅ Auto-fixable: ${plan.fixableIssues}`);
    lines.push(`   ✋ Manual review needed: ${plan.manualIssues}`);
    lines.push('');
    for (const file of plan.files){
        lines.push(`📁 ${file.path}`);
        for (const issue of file.issues){
            const icon = issue.fixable ? '✅' : '✋';
            lines.push(`   ${icon} Line ${issue.location.start.line}: ${issue.message}`);
            if (issue.fixable && issue.suggestedFixes.length > 0) lines.push(`      💡 Fix: ${issue.suggestedFixes[0].description}`);
        }
        lines.push('');
    }
    lines.push('═'.repeat(60));
    return lines.join('\n');
}
const WORKFLOW_GUIDE = {
    writing: {
        title: '📝 Writing Mode',
        description: 'Reference ReactLynx best practices while writing new code. Rules are provided as guidelines.',
        actions: [
            'Check rules/*.md for best practices',
            'Follow dual-thread architecture patterns',
            'Use background-only directive for native module calls'
        ]
    },
    review: {
        title: '🔍 Review Mode',
        description: 'Analyze existing code for ReactLynx issues using the scanner.',
        actions: [
            'Run reviewCode(source) to analyze code',
            'Check formatScanReport() for detailed report',
            'Review each diagnostic and its location'
        ]
    },
    refactor: {
        title: '🔧 Refactor Mode',
        description: 'Fix detected issues with auto-fix suggestions. Ask user before applying fixes.',
        actions: [
            'Generate fix plan with generateFixPlan()',
            'Ask user: "Would you like me to apply auto-fixes?"',
            'Apply fixes with applyAutoFixes() if approved',
            'Verify fixes by re-running review'
        ]
    }
};
function runSkill(source) {
    return analyzeBackgroundOnlyUsage(source);
}
function runSkillWithFixes(source) {
    return analyzeSource(source, {
        generateFixes: true
    });
}
const rules = {
    'detect-background-only': {
        id: 'detect-background-only',
        severity: 'error',
        message: 'lynx.getJSModule and NativeModules must only be called in background-only contexts.'
    }
};
export { ReactLynxWorkflow, WORKFLOW_GUIDE, analyzeBackgroundOnlyUsage, analyzeSource, applyFix, applyFixes, createScanSummary, formatFixPlan, formatScanReport, generateFixes, rules, runSkill, runSkillWithFixes };
