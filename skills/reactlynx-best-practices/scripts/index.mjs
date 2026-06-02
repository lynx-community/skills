function generateFixes(source, diagnostic) {
    const fixes = [];
    if ('detect-background-only' !== diagnostic.ruleId) return fixes;
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
function maskCommentsAndStrings(source) {
    const chars = source.split('');
    let index = 0;
    while(index < chars.length){
        const current = chars[index];
        const next = chars[index + 1];
        if ('/' === current && '/' === next) {
            chars[index] = ' ';
            chars[index + 1] = ' ';
            index += 2;
            while(index < chars.length && '\n' !== chars[index]){
                chars[index] = ' ';
                index++;
            }
            continue;
        }
        if ('/' === current && '*' === next) {
            chars[index] = ' ';
            chars[index + 1] = ' ';
            index += 2;
            while(index < chars.length){
                if ('*' === chars[index] && '/' === chars[index + 1]) {
                    chars[index] = ' ';
                    chars[index + 1] = ' ';
                    index += 2;
                    break;
                }
                if ('\n' !== chars[index]) chars[index] = ' ';
                index++;
            }
            continue;
        }
        if ("'" === current || '"' === current || '`' === current) {
            const quote = current;
            chars[index] = ' ';
            index++;
            while(index < chars.length){
                const char = chars[index];
                if ('\\' === char) {
                    chars[index] = ' ';
                    if (index + 1 < chars.length && '\n' !== chars[index + 1]) chars[index + 1] = ' ';
                    index += 2;
                    continue;
                }
                if (char === quote) {
                    chars[index] = ' ';
                    index++;
                    break;
                }
                if ('\n' !== char) chars[index] = ' ';
                index++;
            }
            continue;
        }
        index++;
    }
    return chars.join('');
}
function findMatchingBracket(source, openIndex, openChar, closeChar) {
    let depth = 0;
    let index = openIndex;
    let quote = null;
    let inLineComment = false;
    let inBlockComment = false;
    while(index < source.length){
        const current = source[index];
        const next = source[index + 1];
        if (inLineComment) {
            if ('\n' === current) inLineComment = false;
            index++;
            continue;
        }
        if (inBlockComment) {
            if ('*' === current && '/' === next) {
                inBlockComment = false;
                index += 2;
                continue;
            }
            index++;
            continue;
        }
        if (null !== quote) {
            if ('\\' === current) {
                index += 2;
                continue;
            }
            if (current === quote) quote = null;
            index++;
            continue;
        }
        if ('/' === current && '/' === next) {
            inLineComment = true;
            index += 2;
            continue;
        }
        if ('/' === current && '*' === next) {
            inBlockComment = true;
            index += 2;
            continue;
        }
        if ("'" === current || '"' === current || '`' === current) {
            quote = current;
            index++;
            continue;
        }
        if (current === openChar) depth++;
        else if (current === closeChar) {
            depth--;
            if (0 === depth) return index;
        }
        index++;
    }
    return -1;
}
function createLineStarts(source) {
    const starts = [
        0
    ];
    for(let index = 0; index < source.length; index++)if ('\n' === source[index]) starts.push(index + 1);
    return starts;
}
function positionAt(index, lineStarts) {
    let low = 0;
    let high = lineStarts.length - 1;
    while(low <= high){
        const middle = Math.floor((low + high) / 2);
        const lineStart = lineStarts[middle] ?? 0;
        const nextLineStart = lineStarts[middle + 1] ?? 1 / 0;
        if (index < lineStart) high = middle - 1;
        else {
            if (!(index >= nextLineStart)) return {
                line: middle + 1,
                column: index - lineStart
            };
            low = middle + 1;
        }
    }
    const fallbackStart = lineStarts[lineStarts.length - 1] ?? 0;
    return {
        line: lineStarts.length,
        column: Math.max(0, index - fallbackStart)
    };
}
function isInsideAnyRange(index, ranges) {
    return ranges.some((range)=>index >= range.start && index < range.end);
}
function collectRegExpMatches(pattern, source) {
    const matches = [];
    pattern.lastIndex = 0;
    let match = pattern.exec(source);
    while(null !== match){
        matches.push(match);
        match = pattern.exec(source);
    }
    return matches;
}
const BACKGROUND_ONLY_IMPORT_PATTERN = /(?:^|\n)\s*import\s+['"]background-only['"]\s*;?/;
const BACKGROUND_ONLY_DIRECTIVE_PATTERN = /^\s*['"]background only['"]\s*;?/;
const EFFECT_CALL_PATTERN = /\b(useEffect|useLayoutEffect|useImperativeHandle)\s*\(/g;
const EVENT_ATTRIBUTE_PATTERN = /(^|[\s<])((?:global-bind|global-catch|capture-bind|capture-catch|bind|catch)[A-Za-z0-9_-]*)\s*=\s*\{/g;
const EVENT_ATTRIBUTE_STRING_PATTERN = /(^|[\s<])((?:global-bind|global-catch|capture-bind|capture-catch|bind|catch)[A-Za-z0-9_-]*)\s*=\s*(['"])([A-Za-z_$][\w$]*)\3/g;
const REF_ATTRIBUTE_PATTERN = /(^|[\s<])ref\s*=\s*\{/g;
const FUNCTION_DECLARATION_PATTERN = /\b(?:async\s+)?function(?:\s*\*)?\s*([A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/g;
const VARIABLE_FUNCTION_PATTERN = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function(?:\s*\*)?\s*(?:[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/g;
const VARIABLE_ARROW_FUNCTION_PATTERN = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g;
function isBackgroundOnlyModule(source) {
    return BACKGROUND_ONLY_IMPORT_PATTERN.test(source);
}
function hasBackgroundOnlyDirective(source, bodyRange) {
    return BACKGROUND_ONLY_DIRECTIVE_PATTERN.test(source.slice(bodyRange.start, bodyRange.end));
}
function collectFunctionRanges(source, masked) {
    const ranges = [];
    collectMatchedFunctionRanges(source, masked, FUNCTION_DECLARATION_PATTERN, ranges);
    collectMatchedFunctionRanges(source, masked, VARIABLE_FUNCTION_PATTERN, ranges);
    collectMatchedFunctionRanges(source, masked, VARIABLE_ARROW_FUNCTION_PATTERN, ranges);
    return ranges;
}
function collectMatchedFunctionRanges(source, masked, pattern, ranges) {
    pattern.lastIndex = 0;
    for (const match of collectRegExpMatches(pattern, masked)){
        const openBrace = masked.indexOf('{', match.index);
        if (-1 === openBrace) continue;
        const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
        if (-1 !== closeBrace) ranges.push({
            name: match[1],
            start: openBrace,
            end: closeBrace + 1
        });
    }
}
function collectDirectiveRanges(source, functionRanges) {
    return functionRanges.filter((range)=>hasBackgroundOnlyDirective(source, {
            start: range.start + 1,
            end: range.end - 1
        }));
}
function collectEffectCallRanges(source, masked) {
    const ranges = [];
    EFFECT_CALL_PATTERN.lastIndex = 0;
    for (const match of collectRegExpMatches(EFFECT_CALL_PATTERN, masked)){
        const openParen = masked.indexOf('(', match.index);
        if (-1 === openParen) continue;
        const closeParen = findMatchingBracket(source, openParen, '(', ')');
        if (-1 !== closeParen) ranges.push({
            start: openParen,
            end: closeParen + 1
        });
    }
    return ranges;
}
function collectEventHandlerNames(source, masked) {
    const names = new Set();
    const inlineRanges = [];
    EVENT_ATTRIBUTE_PATTERN.lastIndex = 0;
    for (const match of collectRegExpMatches(EVENT_ATTRIBUTE_PATTERN, masked)){
        const openBrace = masked.indexOf('{', match.index);
        if (-1 === openBrace) continue;
        const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
        if (-1 === closeBrace) continue;
        const expression = source.slice(openBrace + 1, closeBrace).trim();
        if (/^[A-Za-z_$][\w$]*$/.test(expression)) names.add(expression);
        inlineRanges.push({
            start: openBrace,
            end: closeBrace + 1
        });
    }
    EVENT_ATTRIBUTE_STRING_PATTERN.lastIndex = 0;
    for (const match of collectRegExpMatches(EVENT_ATTRIBUTE_STRING_PATTERN, source)){
        const handlerName = match[4];
        if (handlerName) names.add(handlerName);
    }
    return {
        names,
        inlineRanges
    };
}
function collectRefCallbackRanges(source, masked) {
    const ranges = [];
    REF_ATTRIBUTE_PATTERN.lastIndex = 0;
    for (const match of collectRegExpMatches(REF_ATTRIBUTE_PATTERN, masked)){
        const openBrace = masked.indexOf('{', match.index);
        if (-1 === openBrace) continue;
        const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
        if (-1 !== closeBrace) ranges.push({
            start: openBrace,
            end: closeBrace + 1
        });
    }
    return ranges;
}
function collectNamedRanges(names, functionRanges) {
    return functionRanges.filter((range)=>void 0 !== range.name && names.has(range.name));
}
function collectApiMatches(masked) {
    const matches = [];
    collectMatchesForApi(masked, /\blynx\s*\.\s*getJSModule\b/g, 'lynx.getJSModule', matches);
    collectMatchesForApi(masked, /\bNativeModules\b/g, 'NativeModules', matches);
    return matches.sort((a, b)=>a.start - b.start);
}
function collectMatchesForApi(masked, pattern, apiName, matches) {
    pattern.lastIndex = 0;
    for (const match of collectRegExpMatches(pattern, masked))matches.push({
        apiName,
        start: match.index,
        end: match.index + match[0].length
    });
}
function isAllowedBackgroundContext(apiIndex, allowedRanges) {
    return isInsideAnyRange(apiIndex, allowedRanges);
}
function analyzeBackgroundOnlyUsage(source) {
    if (isBackgroundOnlyModule(source)) return [];
    const diagnostics = [];
    const masked = maskCommentsAndStrings(source);
    const lineStarts = createLineStarts(source);
    const functionRanges = collectFunctionRanges(source, masked);
    const directiveRanges = collectDirectiveRanges(source, functionRanges);
    const effectRanges = collectEffectCallRanges(source, masked);
    const { names: eventHandlerNames, inlineRanges: inlineEventRanges } = collectEventHandlerNames(source, masked);
    const eventHandlerRanges = collectNamedRanges(eventHandlerNames, functionRanges);
    const refCallbackRanges = collectRefCallbackRanges(source, masked);
    const allowedRanges = [
        ...directiveRanges,
        ...effectRanges,
        ...inlineEventRanges,
        ...eventHandlerRanges,
        ...refCallbackRanges
    ];
    for (const match of collectApiMatches(masked))if (!isAllowedBackgroundContext(match.start, allowedRanges)) diagnostics.push({
        ruleId: 'detect-background-only',
        message: `'${match.apiName}' must only be called in background-only contexts (useEffect, useImperativeHandle, ref callback, 'background only' functions, event handlers, or modules marked with import 'background-only').`,
        severity: 'error',
        location: {
            start: positionAt(match.start, lineStarts),
            end: positionAt(match.end, lineStarts)
        }
    });
    return diagnostics;
}
const USE_LAYOUT_EFFECT_PATTERN = /\buseLayoutEffect\s*\(/g;
function analyzeLifecycleUsage(source) {
    const diagnostics = [];
    const masked = maskCommentsAndStrings(source);
    const lineStarts = createLineStarts(source);
    USE_LAYOUT_EFFECT_PATTERN.lastIndex = 0;
    for (const match of collectRegExpMatches(USE_LAYOUT_EFFECT_PATTERN, masked))diagnostics.push({
        ruleId: 'avoid-use-layout-effect',
        message: 'ReactLynx does not support useLayoutEffect; use useEffect for background side effects or main-thread:bindlayoutchange/main-thread:ref for layout reads.',
        severity: 'warning',
        location: {
            start: positionAt(match.index, lineStarts),
            end: positionAt(match.index + 15, lineStarts)
        }
    });
    return diagnostics;
}
function analyzeSource(source, options) {
    const diagnostics = [
        ...analyzeBackgroundOnlyUsage(source),
        ...analyzeLifecycleUsage(source)
    ];
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
    return analyzeSource(source);
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
    },
    'avoid-use-layout-effect': {
        id: 'avoid-use-layout-effect',
        severity: 'warning',
        message: 'ReactLynx does not support useLayoutEffect; use useEffect or main-thread layout events instead.'
    },
    'proper-event-handlers': {
        id: 'proper-event-handlers',
        severity: 'warning',
        message: 'Use ReactLynx event handlers with correct propagation, thread context, and custom prop boundaries.'
    },
    "main-thread-scripts-guide": {
        id: "main-thread-scripts-guide",
        severity: 'warning',
        message: "Use main thread scripts only for low-latency UI work and respect MTS restrictions."
    },
    'code-splitting': {
        id: 'code-splitting',
        severity: 'info',
        message: 'Use lazy loading, Suspense, and CSS bundle-scope awareness for split ReactLynx code.'
    },
    'performance-profiling': {
        id: 'performance-profiling',
        severity: 'info',
        message: 'Use ReactLynx profiling traces, flow IDs, and displayName values to optimize hot paths.'
    },
    'hoist-static-jsx': {
        id: 'hoist-static-jsx',
        severity: 'info',
        message: 'Hoist large static JSX when React Compiler is not handling it.'
    }
};
export { ReactLynxWorkflow, WORKFLOW_GUIDE, analyzeBackgroundOnlyUsage, analyzeLifecycleUsage, analyzeSource, applyFix, applyFixes, createScanSummary, formatFixPlan, formatScanReport, generateFixes, rules, runSkill, runSkillWithFixes };
