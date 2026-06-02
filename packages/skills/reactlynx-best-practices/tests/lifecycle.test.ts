// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, expect, it } from '@rstest/core';
import { analyzeLifecycleUsage, runSkill } from '../src/index';

describe('avoid-use-layout-effect', () => {
  it('should warn when useLayoutEffect is used', () => {
    const source = `
export function App() {
  useLayoutEffect(() => {
    console.log('measure');
  }, []);
  return <view />;
}
`;
    const diagnostics = analyzeLifecycleUsage(source);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].ruleId).toBe('avoid-use-layout-effect');
    expect(diagnostics[0].severity).toBe('warning');
  });

  it('should be included in runSkill diagnostics', () => {
    const source = `
export function App() {
  useLayoutEffect(() => {}, []);
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
    const diagnostics = runSkill(source);
    expect(diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual([
      'detect-background-only',
      'avoid-use-layout-effect',
    ]);
  });

  it('should not warn for useEffect', () => {
    const source = `
export function App() {
  useEffect(() => {
    console.log('side effect');
  }, []);
  return <view />;
}
`;
    const diagnostics = analyzeLifecycleUsage(source);
    expect(diagnostics).toHaveLength(0);
  });
});
