// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  collectRegExpMatches,
  createLineStarts,
  maskCommentsAndStrings,
  positionAt,
} from './text-utils';
import type { Diagnostic } from './types';

const USE_LAYOUT_EFFECT_PATTERN = /\buseLayoutEffect\s*\(/g;

export function analyzeLifecycleUsage(source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const masked = maskCommentsAndStrings(source);
  const lineStarts = createLineStarts(source);

  USE_LAYOUT_EFFECT_PATTERN.lastIndex = 0;

  for (const match of collectRegExpMatches(USE_LAYOUT_EFFECT_PATTERN, masked)) {
    diagnostics.push({
      ruleId: 'avoid-use-layout-effect',
      message:
        'ReactLynx does not support useLayoutEffect; use useEffect for background side effects or main-thread:bindlayoutchange/main-thread:ref for layout reads.',
      severity: 'warning',
      location: {
        start: positionAt(match.index, lineStarts),
        end: positionAt(match.index + 'useLayoutEffect'.length, lineStarts),
      },
    });
  }

  return diagnostics;
}
