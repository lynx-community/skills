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
  formatReactLynxTree as formatTree,
} from '@lynx-js/devtool-connector/command';

/**
 * Build an `operation_v2` payload by hand, mirroring the encoder in
 * `.reference-repos/preact-devtools/src/adapter/protocol/operations.ts` +
 * `string-table.ts`. Numeric layout:
 *
 *   [rootId, stringTableLen, ...stringTableBytes, ...ops]
 *
 * stringTableBytes = [length, ...charCodes] for each string, prefixed
 * implicitly by len = totalChars + perStringLengthBytes.
 */
function buildOperationV2(opts: {
  rootId: number;
  strings: string[];
  body: number[];
}): number[] {
  // String table encoding (mirrors `flushTable`).
  const tableBytes: number[] = [];
  let charBudget = 0;
  for (const s of opts.strings) {
    charBudget += s.length + 1; // +1 for the leading length byte
    tableBytes.push(s.length);
    for (let i = 0; i < s.length; i++) tableBytes.push(s.charCodeAt(i));
  }
  return [opts.rootId, charBudget, ...tableBytes, ...opts.body];
}

const ADD_VNODE = 2;

test('applyOperationV2: ADD_VNODE creates a tree with the expected shape', () => {
  const state = createRendererState();
  // Strings, 1-indexed in payload: 1=App, 2=Child, 3=keyA
  const ops = buildOperationV2({
    rootId: 100,
    strings: ['App', 'Child', 'keyA'],
    body: [
      // ADD_VNODE App as root: id=100 type=fn parent=-1 owner=-1 nameId=1 keyId=0 start=0 end=0
      ADD_VNODE,
      100,
      DevNodeType.FunctionComponent,
      -1,
      -1,
      1,
      0,
      0,
      0,
      // ADD_VNODE Child under App with key=keyA: id=101 type=fn parent=100 owner=100 nameId=2 keyId=3
      ADD_VNODE,
      101,
      DevNodeType.FunctionComponent,
      100,
      100,
      2,
      3,
      0,
      0,
    ],
  });

  applyOperationV2(state, ops);
  applyRootOrder(state, [100]);

  assert.equal(state.tree.size, 2);
  assert.deepStrictEqual(state.roots, [100]);
  assert.equal(state.tree.get(100)?.name, 'App');
  assert.deepStrictEqual(state.tree.get(100)?.children, [101]);
  assert.equal(state.tree.get(101)?.key, 'keyA');
});

test('formatTree: renders ASCII connectors and stable @cN labels', () => {
  const state = createRendererState();
  applyOperationV2(
    state,
    buildOperationV2({
      rootId: 100,
      strings: ['App', 'A', 'B'],
      body: [
        ADD_VNODE,
        100,
        DevNodeType.FunctionComponent,
        -1,
        -1,
        1,
        0,
        0,
        0,
        ADD_VNODE,
        101,
        DevNodeType.FunctionComponent,
        100,
        100,
        2,
        0,
        0,
        0,
        ADD_VNODE,
        102,
        DevNodeType.FunctionComponent,
        100,
        100,
        3,
        0,
        0,
        0,
      ],
    }),
  );
  applyRootOrder(state, [100]);

  const out = formatTree(state, { hideShells: false });
  assert.equal(
    out.text,
    ['@c1 [fn] App', '├─ @c2 [fn] A', '└─ @c3 [fn] B'].join('\n'),
  );
  assert.deepStrictEqual(out.labels, [100, 101, 102]);
});

test('formatTree: --hide-shells skips Fragment/Root/Anonymous wrappers', () => {
  const state = createRendererState();
  applyOperationV2(
    state,
    buildOperationV2({
      rootId: 1,
      strings: ['Fragment', 'Root', 'Anonymous', 'App'],
      // Fragment (1) -> Root (2) -> Anonymous fRef (3) -> App (4)
      body: [
        ADD_VNODE,
        1,
        DevNodeType.FunctionComponent,
        -1,
        -1,
        1,
        0,
        0,
        0,
        ADD_VNODE,
        2,
        DevNodeType.FunctionComponent,
        1,
        1,
        2,
        0,
        0,
        0,
        ADD_VNODE,
        3,
        DevNodeType.ForwardRef,
        2,
        2,
        3,
        0,
        0,
        0,
        ADD_VNODE,
        4,
        DevNodeType.FunctionComponent,
        3,
        3,
        4,
        0,
        0,
        0,
      ],
    }),
  );
  applyRootOrder(state, [1]);

  const visible = formatTree(state, { hideShells: true });
  assert.equal(visible.text, '@c1 [fn] App');
  assert.deepStrictEqual(visible.labels, [4]);

  const all = formatTree(state, { hideShells: false });
  assert.equal(all.labels.length, 4);
  assert.equal(all.labels[0], 1);
});

test('applyOperationV2: REMOVE_VNODE drops node and its descendants', () => {
  const state = createRendererState();
  applyOperationV2(
    state,
    buildOperationV2({
      rootId: 1,
      strings: ['App', 'A', 'B'],
      body: [
        ADD_VNODE,
        1,
        DevNodeType.FunctionComponent,
        -1,
        -1,
        1,
        0,
        0,
        0,
        ADD_VNODE,
        2,
        DevNodeType.FunctionComponent,
        1,
        1,
        2,
        0,
        0,
        0,
        ADD_VNODE,
        3,
        DevNodeType.FunctionComponent,
        2,
        2,
        3,
        0,
        0,
        0,
      ],
    }),
  );
  // REMOVE_VNODE: count=1, ids=[2]
  applyOperationV2(
    state,
    buildOperationV2({ rootId: 1, strings: [], body: [3, 1, 2] }),
  );

  assert.equal(state.tree.has(2), false);
  assert.equal(state.tree.has(3), false, 'descendants must be reaped too');
  assert.deepStrictEqual(state.tree.get(1)?.children, []);
});

test('applyOperationV2: REORDER_CHILDREN swaps order in place', () => {
  const state = createRendererState();
  applyOperationV2(
    state,
    buildOperationV2({
      rootId: 1,
      strings: ['App', 'A', 'B'],
      body: [
        ADD_VNODE,
        1,
        DevNodeType.FunctionComponent,
        -1,
        -1,
        1,
        0,
        0,
        0,
        ADD_VNODE,
        2,
        DevNodeType.FunctionComponent,
        1,
        1,
        2,
        0,
        0,
        0,
        ADD_VNODE,
        3,
        DevNodeType.FunctionComponent,
        1,
        1,
        3,
        0,
        0,
        0,
      ],
    }),
  );
  // REORDER_CHILDREN parentId=1, count=2, [3, 2]
  applyOperationV2(
    state,
    buildOperationV2({ rootId: 1, strings: [], body: [5, 1, 2, 3, 2] }),
  );
  assert.deepStrictEqual(state.tree.get(1)?.children, [3, 2]);
});
