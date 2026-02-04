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
function runSkill(source) {
    return analyzeBackgroundOnlyUsage(source);
}
const rules = {
    'detect-background-only': {
        id: 'detect-background-only',
        severity: 'error',
        message: 'lynx.getJSModule and NativeModules must only be called in background-only contexts.'
    }
};
export { rules, runSkill };
