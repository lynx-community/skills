// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
export interface TextRange {
  start: number;
  end: number;
}

export function maskCommentsAndStrings(source: string): string {
  const chars = source.split('');
  let index = 0;

  while (index < chars.length) {
    const current = chars[index];
    const next = chars[index + 1];

    if (current === '/' && next === '/') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      index += 2;
      while (index < chars.length && chars[index] !== '\n') {
        chars[index] = ' ';
        index++;
      }
      continue;
    }

    if (current === '/' && next === '*') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      index += 2;
      while (index < chars.length) {
        if (chars[index] === '*' && chars[index + 1] === '/') {
          chars[index] = ' ';
          chars[index + 1] = ' ';
          index += 2;
          break;
        }
        if (chars[index] !== '\n') {
          chars[index] = ' ';
        }
        index++;
      }
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      const quote = current;
      chars[index] = ' ';
      index++;
      while (index < chars.length) {
        const char = chars[index];
        if (char === '\\') {
          chars[index] = ' ';
          if (index + 1 < chars.length && chars[index + 1] !== '\n') {
            chars[index + 1] = ' ';
          }
          index += 2;
          continue;
        }
        if (char === quote) {
          chars[index] = ' ';
          index++;
          break;
        }
        if (char !== '\n') {
          chars[index] = ' ';
        }
        index++;
      }
      continue;
    }

    index++;
  }

  return chars.join('');
}

export function findMatchingBracket(
  source: string,
  openIndex: number,
  openChar: string,
  closeChar: string,
): number {
  let depth = 0;
  let index = openIndex;
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
      }
      index++;
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        index += 2;
        continue;
      }
      index++;
      continue;
    }

    if (quote !== null) {
      if (current === '\\') {
        index += 2;
        continue;
      }
      if (current === quote) {
        quote = null;
      }
      index++;
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = true;
      index += 2;
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      index++;
      continue;
    }

    if (current === openChar) {
      depth++;
    } else if (current === closeChar) {
      depth--;
      if (depth === 0) {
        return index;
      }
    }

    index++;
  }

  return -1;
}

export function createLineStarts(source: string): number[] {
  const starts = [0];
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '\n') {
      starts.push(index + 1);
    }
  }
  return starts;
}

export function positionAt(
  index: number,
  lineStarts: number[],
): { line: number; column: number } {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const lineStart = lineStarts[middle] ?? 0;
    const nextLineStart = lineStarts[middle + 1] ?? Number.POSITIVE_INFINITY;

    if (index < lineStart) {
      high = middle - 1;
    } else if (index >= nextLineStart) {
      low = middle + 1;
    } else {
      return { line: middle + 1, column: index - lineStart };
    }
  }

  const fallbackStart = lineStarts[lineStarts.length - 1] ?? 0;
  return {
    line: lineStarts.length,
    column: Math.max(0, index - fallbackStart),
  };
}

export function isInsideAnyRange(index: number, ranges: TextRange[]): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

export function collectRegExpMatches(
  pattern: RegExp,
  source: string,
): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  pattern.lastIndex = 0;

  let match = pattern.exec(source);
  while (match !== null) {
    matches.push(match);
    match = pattern.exec(source);
  }

  return matches;
}
