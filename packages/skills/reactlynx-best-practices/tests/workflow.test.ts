// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, expect, it } from '@rstest/core';
import {
  formatFixPlan,
  formatScanReport,
  ReactLynxWorkflow,
  runSkillWithFixes,
  WORKFLOW_GUIDE,
} from '../src/index';

describe('ReactLynxWorkflow', () => {
  describe('review mode', () => {
    it('should create workflow in review mode', () => {
      const workflow = new ReactLynxWorkflow('review');
      expect(workflow.getMode()).toBe('review');
    });

    it('should review code and find issues', () => {
      const workflow = new ReactLynxWorkflow('review');
      const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
      const summary = workflow.reviewCode(source);
      expect(summary.totalIssues).toBe(1);
      expect(summary.errorCount).toBe(1);
    });

    it('should review clean code with no issues', () => {
      const workflow = new ReactLynxWorkflow('review');
      const source = `
export function App() {
  useEffect(() => {
    lynx.getJSModule('SomeModule');
  }, []);
  return <view />;
}
`;
      const summary = workflow.reviewCode(source);
      expect(summary.totalIssues).toBe(0);
    });
  });

  describe('refactor mode', () => {
    it('should create workflow in refactor mode', () => {
      const workflow = new ReactLynxWorkflow('refactor');
      expect(workflow.getMode()).toBe('refactor');
    });

    it('should generate fix plan after review', () => {
      const workflow = new ReactLynxWorkflow('refactor');
      const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
      workflow.reviewCode(source);
      const plan = workflow.generateFixPlan();

      expect(plan).not.toBeNull();
      expect(plan?.totalIssues).toBe(1);
      expect(plan?.fixableIssues).toBe(1);
    });

    it('should return null fix plan if no review done', () => {
      const workflow = new ReactLynxWorkflow('refactor');
      const plan = workflow.generateFixPlan();
      expect(plan).toBeNull();
    });

    it('should apply auto fixes', () => {
      const workflow = new ReactLynxWorkflow('refactor');
      const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
      workflow.reviewCode(source);
      const { fixed, appliedFixes } = workflow.applyAutoFixes(source);

      expect(appliedFixes.length).toBe(1);
      expect(fixed).toContain('useEffect');
    });
  });

  describe('writing mode', () => {
    it('should create workflow in writing mode', () => {
      const workflow = new ReactLynxWorkflow('writing');
      expect(workflow.getMode()).toBe('writing');
    });
  });
});

describe('runSkillWithFixes', () => {
  it('should return diagnostics with fix suggestions', () => {
    const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
    const diagnostics = runSkillWithFixes(source);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].fixes).toBeDefined();
    expect(diagnostics[0].fixes?.length).toBeGreaterThan(0);
  });

  it('should include wrap-in-useEffect fix', () => {
    const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
    const diagnostics = runSkillWithFixes(source);
    const fix = diagnostics[0].fixes?.find(
      (f) => f.type === 'wrap-in-useEffect',
    );
    expect(fix).toBeDefined();
    expect(fix?.newCode).toContain('useEffect');
  });
});

describe('formatScanReport', () => {
  it('should format scan report correctly', () => {
    const workflow = new ReactLynxWorkflow('review');
    const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
    const summary = workflow.reviewCode(source);
    const report = formatScanReport(summary);

    expect(report).toContain('ReactLynx Best Practices Scan Report');
    expect(report).toContain('Total issues: 1');
    expect(report).toContain('Errors: 1');
  });
});

describe('formatFixPlan', () => {
  it('should format fix plan correctly', () => {
    const workflow = new ReactLynxWorkflow('refactor');
    const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
    workflow.reviewCode(source);
    const plan = workflow.generateFixPlan();
    const formatted = formatFixPlan(plan!);

    expect(formatted).toContain('Fix Plan');
    expect(formatted).toContain('Total issues: 1');
    expect(formatted).toContain('Auto-fixable: 1');
  });
});

describe('WORKFLOW_GUIDE', () => {
  it('should have all three workflow modes', () => {
    expect(WORKFLOW_GUIDE.writing).toBeDefined();
    expect(WORKFLOW_GUIDE.review).toBeDefined();
    expect(WORKFLOW_GUIDE.refactor).toBeDefined();
  });

  it('should have title and description for each mode', () => {
    expect(WORKFLOW_GUIDE.writing.title).toContain('Writing');
    expect(WORKFLOW_GUIDE.review.title).toContain('Review');
    expect(WORKFLOW_GUIDE.refactor.title).toContain('Refactor');
  });
});
