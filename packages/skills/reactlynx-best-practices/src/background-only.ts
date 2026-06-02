// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  collectRegExpMatches,
  createLineStarts,
  findMatchingBracket,
  isInsideAnyRange,
  maskCommentsAndStrings,
  positionAt,
  type TextRange,
} from './text-utils';
import type { Diagnostic } from './types';

const BACKGROUND_ONLY_IMPORT_PATTERN =
  /(?:^|\n)\s*import\s+['"]background-only['"]\s*;?/;
const BACKGROUND_ONLY_DIRECTIVE_PATTERN = /^\s*['"]background only['"]\s*;?/;
const EFFECT_CALL_PATTERN =
  /\b(useEffect|useLayoutEffect|useImperativeHandle)\s*\(/g;
const EVENT_ATTRIBUTE_PATTERN =
  /(^|[\s<])((?:global-bind|global-catch|capture-bind|capture-catch|bind|catch)[A-Za-z0-9_-]*)\s*=\s*\{/g;
const EVENT_ATTRIBUTE_STRING_PATTERN =
  /(^|[\s<])((?:global-bind|global-catch|capture-bind|capture-catch|bind|catch)[A-Za-z0-9_-]*)\s*=\s*(['"])([A-Za-z_$][\w$]*)\3/g;
const REF_ATTRIBUTE_PATTERN = /(^|[\s<])ref\s*=\s*\{/g;
const FUNCTION_DECLARATION_PATTERN =
  /\b(?:async\s+)?function(?:\s*\*)?\s*([A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/g;
const VARIABLE_FUNCTION_PATTERN =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function(?:\s*\*)?\s*(?:[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/g;
const VARIABLE_ARROW_FUNCTION_PATTERN =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g;

interface NamedRange extends TextRange {
  name?: string;
}

interface ApiMatch extends TextRange {
  apiName: string;
}

function isBackgroundOnlyModule(source: string): boolean {
  return BACKGROUND_ONLY_IMPORT_PATTERN.test(source);
}

function hasBackgroundOnlyDirective(
  source: string,
  bodyRange: TextRange,
): boolean {
  return BACKGROUND_ONLY_DIRECTIVE_PATTERN.test(
    source.slice(bodyRange.start, bodyRange.end),
  );
}

function collectFunctionRanges(source: string, masked: string): NamedRange[] {
  const ranges: NamedRange[] = [];

  collectMatchedFunctionRanges(
    source,
    masked,
    FUNCTION_DECLARATION_PATTERN,
    ranges,
  );
  collectMatchedFunctionRanges(
    source,
    masked,
    VARIABLE_FUNCTION_PATTERN,
    ranges,
  );
  collectMatchedFunctionRanges(
    source,
    masked,
    VARIABLE_ARROW_FUNCTION_PATTERN,
    ranges,
  );

  return ranges;
}

function collectMatchedFunctionRanges(
  source: string,
  masked: string,
  pattern: RegExp,
  ranges: NamedRange[],
): void {
  pattern.lastIndex = 0;

  for (const match of collectRegExpMatches(pattern, masked)) {
    const openBrace = masked.indexOf('{', match.index);
    if (openBrace === -1) continue;

    const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
    if (closeBrace === -1) continue;

    ranges.push({
      name: match[1],
      start: openBrace,
      end: closeBrace + 1,
    });
  }
}

function collectDirectiveRanges(
  source: string,
  functionRanges: NamedRange[],
): TextRange[] {
  return functionRanges.filter((range) =>
    hasBackgroundOnlyDirective(source, {
      start: range.start + 1,
      end: range.end - 1,
    }),
  );
}

function collectEffectCallRanges(source: string, masked: string): TextRange[] {
  const ranges: TextRange[] = [];
  EFFECT_CALL_PATTERN.lastIndex = 0;

  for (const match of collectRegExpMatches(EFFECT_CALL_PATTERN, masked)) {
    const openParen = masked.indexOf('(', match.index);
    if (openParen === -1) continue;

    const closeParen = findMatchingBracket(source, openParen, '(', ')');
    if (closeParen === -1) continue;

    ranges.push({ start: openParen, end: closeParen + 1 });
  }

  return ranges;
}

function collectEventHandlerNames(
  source: string,
  masked: string,
): { names: Set<string>; inlineRanges: TextRange[] } {
  const names = new Set<string>();
  const inlineRanges: TextRange[] = [];
  EVENT_ATTRIBUTE_PATTERN.lastIndex = 0;

  for (const match of collectRegExpMatches(EVENT_ATTRIBUTE_PATTERN, masked)) {
    const openBrace = masked.indexOf('{', match.index);
    if (openBrace === -1) continue;

    const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
    if (closeBrace === -1) continue;

    const expression = source.slice(openBrace + 1, closeBrace).trim();
    if (/^[A-Za-z_$][\w$]*$/.test(expression)) {
      names.add(expression);
    }

    inlineRanges.push({ start: openBrace, end: closeBrace + 1 });
  }

  EVENT_ATTRIBUTE_STRING_PATTERN.lastIndex = 0;
  for (const match of collectRegExpMatches(
    EVENT_ATTRIBUTE_STRING_PATTERN,
    source,
  )) {
    const handlerName = match[4];
    if (handlerName) {
      names.add(handlerName);
    }
  }

  return { names, inlineRanges };
}

function collectRefCallbackRanges(source: string, masked: string): TextRange[] {
  const ranges: TextRange[] = [];
  REF_ATTRIBUTE_PATTERN.lastIndex = 0;

  for (const match of collectRegExpMatches(REF_ATTRIBUTE_PATTERN, masked)) {
    const openBrace = masked.indexOf('{', match.index);
    if (openBrace === -1) continue;

    const closeBrace = findMatchingBracket(source, openBrace, '{', '}');
    if (closeBrace === -1) continue;

    ranges.push({ start: openBrace, end: closeBrace + 1 });
  }

  return ranges;
}

function collectNamedRanges(
  names: Set<string>,
  functionRanges: NamedRange[],
): TextRange[] {
  return functionRanges.filter((range) => {
    return range.name !== undefined && names.has(range.name);
  });
}

function collectApiMatches(masked: string): ApiMatch[] {
  const matches: ApiMatch[] = [];

  collectMatchesForApi(
    masked,
    /\blynx\s*\.\s*getJSModule\b/g,
    'lynx.getJSModule',
    matches,
  );
  collectMatchesForApi(masked, /\bNativeModules\b/g, 'NativeModules', matches);

  return matches.sort((a, b) => a.start - b.start);
}

function collectMatchesForApi(
  masked: string,
  pattern: RegExp,
  apiName: string,
  matches: ApiMatch[],
): void {
  pattern.lastIndex = 0;

  for (const match of collectRegExpMatches(pattern, masked)) {
    matches.push({
      apiName,
      start: match.index,
      end: match.index + match[0].length,
    });
  }
}

function isAllowedBackgroundContext(
  apiIndex: number,
  allowedRanges: TextRange[],
): boolean {
  return isInsideAnyRange(apiIndex, allowedRanges);
}

export function analyzeBackgroundOnlyUsage(source: string): Diagnostic[] {
  if (isBackgroundOnlyModule(source)) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const masked = maskCommentsAndStrings(source);
  const lineStarts = createLineStarts(source);
  const functionRanges = collectFunctionRanges(source, masked);
  const directiveRanges = collectDirectiveRanges(source, functionRanges);
  const effectRanges = collectEffectCallRanges(source, masked);
  const { names: eventHandlerNames, inlineRanges: inlineEventRanges } =
    collectEventHandlerNames(source, masked);
  const eventHandlerRanges = collectNamedRanges(
    eventHandlerNames,
    functionRanges,
  );
  const refCallbackRanges = collectRefCallbackRanges(source, masked);
  const allowedRanges = [
    ...directiveRanges,
    ...effectRanges,
    ...inlineEventRanges,
    ...eventHandlerRanges,
    ...refCallbackRanges,
  ];

  for (const match of collectApiMatches(masked)) {
    if (isAllowedBackgroundContext(match.start, allowedRanges)) {
      continue;
    }

    diagnostics.push({
      ruleId: 'detect-background-only',
      message: `'${match.apiName}' must only be called in background-only contexts (useEffect, useImperativeHandle, ref callback, 'background only' functions, event handlers, or modules marked with import 'background-only').`,
      severity: 'error',
      location: {
        start: positionAt(match.start, lineStarts),
        end: positionAt(match.end, lineStarts),
      },
    });
  }

  return diagnostics;
}
