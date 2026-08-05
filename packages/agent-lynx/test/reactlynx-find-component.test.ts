// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyOperationV2,
  applyRootOrder,
  createRendererState,
  DevNodeType,
  type RendererState,
} from '@lynx-js/devtool-connector/command';
import {
  buildRegexMatcher,
  buildSubstringMatcher,
  findComponents,
  formatMatches,
} from '../src/commands/reactlynx/find.ts';
import {
  formatInspectResult,
  type InspectResult,
  parseComponentRef,
} from '../src/commands/reactlynx/inspect.ts';

const ADD_VNODE = 2;

/**
 * Compact `operation_v2` builder, identical to the one used by
 * `reactlynx.test.ts`. Repeated here so this file stays self-contained --
 * the helper is small enough that one-off duplication beats a `_helpers.ts`
 * module that would only ever be imported from these two test files.
 */
function buildOperationV2(opts: {
  rootId: number;
  strings: string[];
  body: number[];
}): number[] {
  const tableBytes: number[] = [];
  let charBudget = 0;
  for (const s of opts.strings) {
    charBudget += s.length + 1;
    tableBytes.push(s.length);
    for (let i = 0; i < s.length; i++) tableBytes.push(s.charCodeAt(i));
  }
  return [opts.rootId, charBudget, ...tableBytes, ...opts.body];
}

/**
 * Build a fixture tree shaped like a real ReactLynx app:
 *
 *   App
 *   ├── Header
 *   │   ├── Title
 *   │   └── ToggleButton
 *   └── Body
 *       ├── Toast (key=primary)
 *       └── ToastList
 *           ├── Toast (key=a)
 *           └── Toast (key=b)
 */
function buildAppTree(): RendererState {
  const state = createRendererState();
  applyOperationV2(
    state,
    buildOperationV2({
      rootId: 100,
      strings: [
        'App',
        'Header',
        'Title',
        'ToggleButton',
        'Body',
        'Toast',
        'ToastList',
        'primary',
        'a',
        'b',
      ],
      body: [
        // App (id=100)
        ADD_VNODE,
        100,
        DevNodeType.FunctionComponent,
        -1,
        -1,
        1,
        0,
        0,
        0,
        // Header (id=101) under App
        ADD_VNODE,
        101,
        DevNodeType.FunctionComponent,
        100,
        100,
        2,
        0,
        0,
        0,
        // Title (id=102) under Header
        ADD_VNODE,
        102,
        DevNodeType.FunctionComponent,
        101,
        101,
        3,
        0,
        0,
        0,
        // ToggleButton (id=103) under Header
        ADD_VNODE,
        103,
        DevNodeType.FunctionComponent,
        101,
        101,
        4,
        0,
        0,
        0,
        // Body (id=104) under App
        ADD_VNODE,
        104,
        DevNodeType.FunctionComponent,
        100,
        100,
        5,
        0,
        0,
        0,
        // Toast (id=105) under Body, key=primary
        ADD_VNODE,
        105,
        DevNodeType.FunctionComponent,
        104,
        104,
        6,
        8,
        0,
        0,
        // ToastList (id=106) under Body
        ADD_VNODE,
        106,
        DevNodeType.FunctionComponent,
        104,
        104,
        7,
        0,
        0,
        0,
        // Toast (id=107) under ToastList, key=a
        ADD_VNODE,
        107,
        DevNodeType.FunctionComponent,
        106,
        106,
        6,
        9,
        0,
        0,
        // Toast (id=108) under ToastList, key=b
        ADD_VNODE,
        108,
        DevNodeType.FunctionComponent,
        106,
        106,
        6,
        10,
        0,
        0,
      ],
    }),
  );
  applyRootOrder(state, [100]);
  return state;
}

// ── findComponents ─────────────────────────────────────────────────────────

test('findComponents: substring match returns labelled hits in DFS order', () => {
  const state = buildAppTree();
  const matches = findComponents(state, buildSubstringMatcher('toast'), {
    hideShells: false,
    limit: 50,
  });
  // DFS order of the test tree is: App, Header, Title, ToggleButton, Body, Toast(primary), ToastList, Toast(a), Toast(b).
  // Toggle*Button* contains "toggle" not "toast", so it is filtered.
  assert.deepStrictEqual(
    matches.map((m) => m.label),
    ['@c6', '@c7', '@c8', '@c9'],
  );
  assert.deepStrictEqual(
    matches.map((m) => m.name),
    ['Toast', 'ToastList', 'Toast', 'Toast'],
  );
  assert.deepStrictEqual(
    matches.map((m) => m.key),
    ['primary', '', 'a', 'b'],
  );
});

test('findComponents: regex matcher only counts whole-word matches', () => {
  const state = buildAppTree();
  // \b requires word boundary; ToastList must NOT match.
  const matches = findComponents(state, buildRegexMatcher('\\bToast\\b'), {
    hideShells: false,
    limit: 50,
  });
  assert.deepStrictEqual(
    matches.map((m) => m.name),
    ['Toast', 'Toast', 'Toast'],
  );
});

test('findComponents: ancestors point back to labelled visible parents', () => {
  const state = buildAppTree();
  // The deepest Toasts (key=a, key=b) should report App > Body > ToastList as ancestors.
  const matches = findComponents(state, (n) => n === 'Toast', {
    hideShells: false,
    limit: 50,
  });
  const deepToast = matches.find((m) => m.key === 'a');
  assert.ok(deepToast, 'expected a Toast with key=a');
  assert.deepStrictEqual(
    deepToast.ancestors.map((a) => `${a.label} ${a.name}`),
    ['@c1 App', '@c5 Body', '@c7 ToastList'],
  );
});

test('findComponents: --limit honored even when more matches exist', () => {
  const state = buildAppTree();
  const matches = findComponents(state, buildSubstringMatcher('toast'), {
    hideShells: false,
    limit: 2,
  });
  assert.equal(matches.length, 2);
  // Limit is applied during DFS so the first two by tree order win.
  assert.deepStrictEqual(
    matches.map((m) => m.label),
    ['@c6', '@c7'],
  );
});

test('formatMatches: ASCII output annotates labels with type tag and key', () => {
  const state = buildAppTree();
  const matches = findComponents(state, buildSubstringMatcher('toast'), {
    hideShells: false,
    limit: 50,
  });
  const out = formatMatches(matches);
  // Spot-check one keyed entry and its ancestor line.
  assert.match(out, /@c6 \[fn\] Toast key=primary/);
  assert.match(out, /in @c1 App > @c5 Body/);
  // Multi-line: each match contributes 1-2 lines (header + optional ancestors).
  // 4 matches, all rooted under App, so 4 ancestor lines.
  assert.equal(out.split('\n').length, 8);
});

test('buildRegexMatcher: rejects malformed patterns at construction time', () => {
  assert.throws(() => buildRegexMatcher('('), /--regex pattern is invalid/);
});

// ── parseComponentRef ──────────────────────────────────────────────────────

test('parseComponentRef: @cN form returns 1-based index', () => {
  assert.deepStrictEqual(parseComponentRef('@c1'), { kind: 'label', index: 1 });
  assert.deepStrictEqual(parseComponentRef('@c42'), {
    kind: 'label',
    index: 42,
  });
});

test('parseComponentRef: numeric form returns id verbatim', () => {
  assert.deepStrictEqual(parseComponentRef('3856353762'), {
    kind: 'id',
    id: 3856353762,
  });
});

test('parseComponentRef: rejects ambiguous or junk inputs', () => {
  assert.throws(() => parseComponentRef('@c0'), /Invalid label/);
  assert.throws(() => parseComponentRef(''), /Invalid <ref>/);
  assert.throws(() => parseComponentRef('App'), /Invalid <ref>/);
  assert.throws(() => parseComponentRef('@cAbc'), /Invalid <ref>/);
  assert.throws(() => parseComponentRef('12abc'), /Invalid <ref>/);
});

// ── formatInspectResult ────────────────────────────────────────────────────

const sampleInspect: InspectResult = {
  id: 105,
  name: 'Toast',
  type: DevNodeType.FunctionComponent,
  key: 'primary',
  props: { message: 'Hello', visible: true, count: 3 },
  state: null,
  hooks: null,
  context: null,
  signals: null,
  suspended: false,
  __source: { fileName: 'src/Toast.tsx', lineNumber: 12, columnNumber: 3 },
};

test('formatInspectResult: renders a header with id, type tag, name, and key', () => {
  const out = formatInspectResult(sampleInspect, '@c6');
  const firstLine = out.split('\n')[0];
  assert.equal(firstLine, '@c6 (id=105) [fn] Toast key=primary');
});

test('formatInspectResult: includes source line when __source is set', () => {
  const out = formatInspectResult(sampleInspect, '@c6');
  assert.match(out, /source: src\/Toast\.tsx:12:3/);
});

test('formatInspectResult: skips empty / null sections', () => {
  const out = formatInspectResult(sampleInspect, '@c6');
  // props is non-empty -> rendered.
  assert.match(out, /props:/);
  // state/hooks/context/signals are null -> NOT rendered.
  assert.equal(/state:/.test(out), false);
  assert.equal(/hooks:/.test(out), false);
  assert.equal(/context:/.test(out), false);
  assert.equal(/signals:/.test(out), false);
});

test('formatInspectResult: indents JSON value bodies under each section', () => {
  const out = formatInspectResult(sampleInspect, '@c6');
  // Each line of the JSON dump must start with "    " (4 spaces) -- two
  // for the section indent + two for the JSON.stringify indent.
  const propsBody = out
    .split('\n')
    .slice(out.split('\n').indexOf('  props:') + 1);
  for (const line of propsBody) {
    assert.match(line, /^\s{4}/, `expected indented line, got: ${line}`);
  }
});

test('formatInspectResult: marks suspended components', () => {
  const out = formatInspectResult({ ...sampleInspect, suspended: true }, '@c6');
  assert.match(out, /suspended: true/);
});
