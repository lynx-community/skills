// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Diagnostic, Fix } from './types';

export function generateFixes(source: string, diagnostic: Diagnostic): Fix[] {
  const fixes: Fix[] = [];
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
    location: diagnostic.location,
  });

  fixes.push({
    type: 'add-directive',
    description: "Move to a function with 'background only' directive",
    oldCode: violatingCode,
    newCode: `function doBackgroundWork() {\n  'background only';\n  ${violatingCode};\n}`,
    location: diagnostic.location,
  });

  fixes.push({
    type: 'move-to-event-handler',
    description: 'Move the call to an event handler (bindtap/catchtap)',
    oldCode: violatingCode,
    newCode: `function handleTap() {\n  ${violatingCode};\n}\n// Use: <view bindtap={handleTap} />`,
    location: diagnostic.location,
  });

  return fixes;
}

export function applyFix(source: string, fix: Fix): string {
  const lines = source.split('\n');
  const lineIndex = fix.location.start.line - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    return source;
  }

  const line = lines[lineIndex];
  const before = line.slice(0, fix.location.start.column);
  const after = line.slice(fix.location.end.column);

  lines[lineIndex] = before + fix.newCode + after;

  return lines.join('\n');
}

export function applyFixes(source: string, fixes: Fix[]): string {
  const sortedFixes = [...fixes].sort((a, b) => {
    if (a.location.start.line !== b.location.start.line) {
      return b.location.start.line - a.location.start.line;
    }
    return b.location.start.column - a.location.start.column;
  });

  let result = source;
  for (const fix of sortedFixes) {
    result = applyFix(result, fix);
  }

  return result;
}
