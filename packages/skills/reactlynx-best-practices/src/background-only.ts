// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Lang, parse, type SgNode } from '@ast-grep/napi';
import type { Diagnostic } from './types';

const BACKGROUND_ONLY_DIRECTIVE = "'background only'";
const BACKGROUND_ONLY_DIRECTIVE_DOUBLE = '"background only"';

const EVENT_HANDLER_ATTRS = ['bindtap', 'catchtap'];

function isBackgroundOnlyAPI(node: SgNode): {
  isMatch: boolean;
  apiName: string;
} {
  const text = node.text();

  if (text.startsWith('lynx.getJSModule')) {
    return { isMatch: true, apiName: 'lynx.getJSModule' };
  }

  if (text.startsWith('NativeModules')) {
    return { isMatch: true, apiName: 'NativeModules' };
  }

  return { isMatch: false, apiName: '' };
}

function isInsideUseEffect(node: SgNode): boolean {
  let current: SgNode | null = node;
  while (current !== null) {
    const parent: SgNode | null = current.parent();
    if (parent === null) break;
    current = parent;
    if (current.kind() === 'call_expression') {
      const callee = current.child(0);
      if (callee) {
        const text = callee.text();
        if (
          text === 'useEffect' ||
          text === 'useLayoutEffect' ||
          text === 'useImperativeHandle'
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function isInsideBackgroundOnlyFunction(node: SgNode): boolean {
  let current: SgNode | null = node;
  while (current !== null) {
    const parent: SgNode | null = current.parent();
    if (parent === null) break;
    current = parent;
    const kind = current.kind();
    if (
      kind === 'function_declaration' ||
      kind === 'arrow_function' ||
      kind === 'function_expression'
    ) {
      const body = current
        .children()
        .find((c: SgNode) => c.kind() === 'statement_block');
      if (body) {
        const firstStatement = body
          .children()
          .find((c: SgNode) => c.kind() === 'expression_statement');
        if (firstStatement) {
          const expr = firstStatement.child(0);
          if (expr && expr.kind() === 'string') {
            const text = expr.text();
            if (
              text === BACKGROUND_ONLY_DIRECTIVE ||
              text === BACKGROUND_ONLY_DIRECTIVE_DOUBLE
            ) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function findEventHandlerFunctions(root: SgNode): Set<string> {
  const handlerFunctions = new Set<string>();

  const jsxAttributes = root.findAll({
    rule: { kind: 'jsx_attribute' },
  });

  for (const attr of jsxAttributes) {
    const nameNode = attr
      .children()
      .find((c: SgNode) => c.kind() === 'property_identifier');
    if (!nameNode) continue;

    const attrName = nameNode.text();
    if (!EVENT_HANDLER_ATTRS.includes(attrName)) continue;

    const valueNode = attr.children().find((c: SgNode) => {
      const kind = c.kind();
      return (
        kind === 'jsx_expression' ||
        kind === 'string' ||
        kind === 'string_fragment'
      );
    });

    if (valueNode) {
      if (valueNode.kind() === 'jsx_expression') {
        const inner = valueNode.child(1);
        if (inner && inner.kind() === 'identifier') {
          handlerFunctions.add(inner.text());
        }
      } else {
        const text = valueNode.text().replace(/['"]/g, '');
        if (text) {
          handlerFunctions.add(text);
        }
      }
    }
  }

  return handlerFunctions;
}

function isInsideEventHandler(
  node: SgNode,
  eventHandlerFunctions: Set<string>,
): boolean {
  let current: SgNode | null = node;
  while (current !== null) {
    const parent: SgNode | null = current.parent();
    if (parent === null) break;
    current = parent;
    const kind = current.kind();

    if (kind === 'function_declaration') {
      const nameNode = current
        .children()
        .find((c: SgNode) => c.kind() === 'identifier');
      if (nameNode && eventHandlerFunctions.has(nameNode.text())) {
        return true;
      }
    }

    if (kind === 'arrow_function' || kind === 'function_expression') {
      const varParent = current.parent();
      if (varParent && varParent.kind() === 'variable_declarator') {
        const varName = varParent
          .children()
          .find((c: SgNode) => c.kind() === 'identifier');
        if (varName && eventHandlerFunctions.has(varName.text())) {
          return true;
        }
      }
    }
  }
  return false;
}

function isInlineEventHandler(node: SgNode): boolean {
  let current: SgNode | null = node;
  while (current !== null) {
    const parent: SgNode | null = current.parent();
    if (parent === null) break;
    current = parent;

    if (current.kind() === 'jsx_expression') {
      const jsxAttr = current.parent();
      if (jsxAttr && jsxAttr.kind() === 'jsx_attribute') {
        const nameNode = jsxAttr
          .children()
          .find((c: SgNode) => c.kind() === 'property_identifier');
        if (nameNode && EVENT_HANDLER_ATTRS.includes(nameNode.text())) {
          return true;
        }
      }
    }
  }
  return false;
}

function isInsideRefCallback(node: SgNode): boolean {
  let current: SgNode | null = node;
  while (current !== null) {
    const parent: SgNode | null = current.parent();
    if (parent === null) break;
    current = parent;

    if (current.kind() === 'jsx_expression') {
      const jsxAttr = current.parent();
      if (jsxAttr && jsxAttr.kind() === 'jsx_attribute') {
        const nameNode = jsxAttr
          .children()
          .find((c: SgNode) => c.kind() === 'property_identifier');
        if (nameNode && nameNode.text() === 'ref') {
          return true;
        }
      }
    }
  }
  return false;
}

export function analyzeBackgroundOnlyUsage(source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const ast = parse(Lang.Tsx, source);
  const root = ast.root();

  const eventHandlerFunctions = findEventHandlerFunctions(root);

  const memberExpressions = root.findAll({
    rule: { kind: 'member_expression' },
  });

  const callExpressions = root.findAll({
    rule: { kind: 'call_expression' },
  });

  const allNodes = [...memberExpressions, ...callExpressions];

  const processedRanges = new Set<string>();

  for (const node of allNodes) {
    const { isMatch, apiName } = isBackgroundOnlyAPI(node);
    if (!isMatch) continue;

    const range = node.range();
    const rangeKey = `${range.start.line}:${range.start.column}`;
    if (processedRanges.has(rangeKey)) continue;
    processedRanges.add(rangeKey);

    if (isInsideUseEffect(node)) continue;

    if (isInsideBackgroundOnlyFunction(node)) continue;

    if (isInsideEventHandler(node, eventHandlerFunctions)) continue;

    if (isInlineEventHandler(node)) continue;

    if (isInsideRefCallback(node)) continue;

    diagnostics.push({
      ruleId: 'detect-background-only',
      message: `'${apiName}' must only be called in background-only contexts (useEffect, useImperativeHandle, ref callback, 'background only' functions, or event handlers).`,
      severity: 'error',
      location: {
        start: { line: range.start.line + 1, column: range.start.column },
        end: { line: range.end.line + 1, column: range.end.column },
      },
    });
  }

  return diagnostics;
}
