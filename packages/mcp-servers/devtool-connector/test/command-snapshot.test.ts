// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildRefs,
  type DomNode,
  filterSnapshotRefs,
  SNAPSHOT_REF_ANNOTATION_ROLE,
} from '../src/command/snapshot.ts';

function quad(x: number, y: number, width: number, height: number): number[] {
  return [x, y, x + width, y, x + width, y + height, x, y + height];
}

describe('snapshot refs', () => {
  test('assigns compact sequential refs with text and geometry', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'view',
          attributes: ['bindtap', 'onTap'],
          box_model: { content: quad(0, 0, 100, 50) },
          children: [{ nodeId: 3, nodeType: 3, nodeValue: 'Hello' }],
        },
        {
          nodeId: 4,
          localName: 'text',
          box_model: { content: quad(0, 60, 80, 20) },
          children: [{ nodeId: 5, nodeType: 3, nodeValue: 'Label' }],
        },
      ],
    };

    const refs = buildRefs(root);
    assert.deepEqual(
      refs.map((ref) => ref.ref),
      ['@e1', '@e2'],
    );
    assert.deepEqual(
      refs.map((ref) => ref.parentRef),
      [undefined, undefined],
    );
    assert.equal(refs[0]?.text, 'Hello');
    assert.deepEqual(refs[0]?.center, { x: 50, y: 25 });
    assert.equal(refs[1]?.text, 'Label');
  });

  test('reads text and editable values stored directly on Lynx element attributes', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'text',
          attributes: ['text', 'Gallery title'],
          box_model: { content: quad(0, 0, 100, 20) },
        },
        {
          nodeId: 3,
          localName: 'input',
          attributes: ['value', 'Hello', 'placeholder', 'Type here...'],
          box_model: { content: quad(0, 30, 100, 30) },
        },
      ],
    });

    assert.deepEqual(
      refs.map((ref) => ref.text),
      ['Gallery title', 'Hello'],
    );
    assert.deepEqual(refs[1]?.attributes, {
      value: 'Hello',
      placeholder: 'Type here...',
    });
  });

  test('does not label structural containers with text from nested controls', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'view',
      box_model: { content: quad(0, 0, 100, 100) },
      children: [
        {
          nodeId: 2,
          localName: 'view',
          box_model: { content: quad(0, 0, 100, 50) },
          children: [
            {
              nodeId: 3,
              localName: 'text',
              attributes: ['text', 'Nested label'],
              box_model: { content: quad(0, 0, 80, 20) },
            },
          ],
        },
      ],
    });

    assert.deepEqual(
      refs.map((ref) => ref.text),
      ['', '', 'Nested label'],
    );
  });

  test('preserves inline text boundaries without inventing whitespace', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'text',
      box_model: { content: quad(0, 0, 100, 20) },
      children: [
        {
          nodeId: 2,
          localName: 'raw-text',
          attributes: ['text', 'scroll-row-'],
        },
        { nodeId: 3, localName: 'raw-text', attributes: ['text', '0'] },
      ],
    });

    assert.equal(refs[0]?.text, 'scroll-row-0');
  });

  test('skips unboxed, zero-area, and unsupported nodes', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'view',
          box_model: { content: quad(0, 0, 0, 0) },
        },
        { nodeId: 3, localName: 'view' },
        {
          nodeId: 4,
          localName: 'unknown-tag',
          box_model: { content: quad(0, 0, 10, 10) },
        },
      ],
    };

    assert.deepEqual(buildRefs(root), []);
  });

  test('surfaces action-relevant attributes and flags', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'input',
          attributes: ['placeholder', 'Name', 'value', 'Bob'],
          box_model: { content: quad(0, 0, 100, 30) },
        },
        {
          nodeId: 3,
          localName: 'scroll-view',
          box_model: { border: quad(0, 40, 100, 200) },
        },
        {
          nodeId: 4,
          localName: 'view',
          attributes: ['bindtap', 'x', 'disabled', 'true'],
          box_model: { content: quad(0, 250, 100, 30) },
        },
      ],
    };

    const refs = buildRefs(root);
    assert.equal(refs[0]?.flags.editable, true);
    assert.deepEqual(refs[0]?.attributes, {
      value: 'Bob',
      placeholder: 'Name',
    });
    assert.equal(refs[1]?.flags.scrollable, true);
    assert.equal(refs[2]?.flags.disabled, true);
    assert.deepEqual(
      refs.map((ref) => ref[SNAPSHOT_REF_ANNOTATION_ROLE]),
      ['editable', 'scrollable', 'action'],
    );
  });

  test('classifies direct actions separately from generic snapshot refs', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'view',
          attributes: ['capture-bindtap', 'capture'],
          box_model: { content: quad(0, 0, 100, 30) },
        },
        {
          nodeId: 3,
          localName: 'view',
          attributes: ['bindlongpress', 'hold'],
          box_model: { content: quad(0, 40, 100, 30) },
        },
        {
          nodeId: 4,
          localName: 'view',
          box_model: { content: quad(0, 80, 100, 30) },
        },
        {
          nodeId: 5,
          localName: 'text',
          attributes: ['lynx-test-tag', 'test-target'],
          box_model: { content: quad(0, 120, 100, 30) },
        },
      ],
    });

    assert.deepEqual(
      refs.map((ref) => ref[SNAPSHOT_REF_ANNOTATION_ROLE]),
      ['action', 'action', 'generic', 'target'],
    );
  });

  test('normalizes ids, classes, and raw text from the live Lynx DOM protocol', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'view',
      attributes: [
        'idSelector',
        'tap-target',
        'classSelector',
        'primary',
        'bindtap',
        '-15:0:',
      ],
      box_model: { content: quad(0, 0, 100, 50) },
      children: [
        {
          nodeId: 2,
          localName: 'text',
          children: [
            {
              nodeId: 3,
              localName: 'raw-text',
              nodeType: 1,
              nodeValue: '',
              attributes: ['text', 'Tap target'],
            },
          ],
        },
      ],
    };

    const [ref] = buildRefs(root);
    assert.equal(ref?.text, 'Tap target');
    assert.deepEqual(ref?.attributes, { id: 'tap-target', class: 'primary' });
  });

  test('preserves the nearest surfaced ancestor as a compact tree', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'view',
          box_model: { content: quad(0, 0, 100, 100) },
          children: [
            {
              nodeId: 3,
              localName: 'unsupported-wrapper',
              children: [
                {
                  nodeId: 4,
                  localName: 'text',
                  box_model: { content: quad(10, 10, 80, 20) },
                },
              ],
            },
            {
              nodeId: 5,
              localName: 'view',
              box_model: { content: quad(10, 40, 80, 40) },
              children: [
                {
                  nodeId: 6,
                  localName: 'image',
                  box_model: { content: quad(20, 50, 20, 20) },
                },
              ],
            },
          ],
        },
      ],
    };

    const refs = buildRefs(root);
    assert.deepEqual(
      refs.map((ref) => ({
        ref: ref.ref,
        parentRef: ref.parentRef,
        tag: ref.tag,
      })),
      [
        { ref: '@e1', parentRef: undefined, tag: 'view' },
        { ref: '@e2', parentRef: '@e1', tag: 'text' },
        { ref: '@e3', parentRef: '@e1', tag: 'view' },
        { ref: '@e4', parentRef: '@e3', tag: 'image' },
      ],
    );
  });

  test('reparents retained refs when filtering removes an ancestor', () => {
    const refs = buildRefs(
      {
        nodeId: 1,
        localName: 'page',
        children: [
          {
            nodeId: 2,
            localName: 'view',
            box_model: { content: quad(0, 500, 100, 100) },
            children: [
              {
                nodeId: 3,
                localName: 'text',
                box_model: { content: quad(10, 10, 80, 20) },
                children: [
                  {
                    nodeId: 4,
                    localName: 'image',
                    box_model: { content: quad(20, 15, 20, 10) },
                  },
                ],
              },
            ],
          },
        ],
      },
      { x: 0, y: 0, width: 100, height: 100 },
    );

    const visible = filterSnapshotRefs(refs, (ref) => ref.flags.visible);
    assert.deepEqual(
      visible.map((ref) => ({ ref: ref.ref, parentRef: ref.parentRef })),
      [
        { ref: '@e2', parentRef: undefined },
        { ref: '@e3', parentRef: '@e2' },
      ],
    );
  });

  test('marks refs outside the viewport as offscreen', () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      children: [
        {
          nodeId: 2,
          localName: 'view',
          box_model: { content: quad(10, 10, 50, 20) },
        },
        {
          nodeId: 3,
          localName: 'view',
          box_model: { content: quad(10, 500, 50, 20) },
        },
      ],
    };

    const refs = buildRefs(root, { x: 0, y: 0, width: 100, height: 100 });
    assert.equal(refs[0]?.flags.visible, true);
    assert.equal(refs[1]?.flags.visible, false);
    assert.equal(refs[1]?.flags.offscreen, true);
  });

  test('clips descendants to every scrollable ancestor and uses the visible center', () => {
    const refs = buildRefs(
      {
        nodeId: 1,
        localName: 'page',
        children: [
          {
            nodeId: 2,
            localName: 'scroll-view',
            box_model: { content: quad(0, 0, 100, 200) },
            children: [
              {
                nodeId: 3,
                localName: 'scroll-view',
                box_model: { content: quad(10, 20, 60, 30) },
                children: [
                  {
                    nodeId: 4,
                    localName: 'text',
                    attributes: ['text', 'fully clipped'],
                    box_model: { content: quad(72, 25, 10, 10) },
                  },
                  {
                    nodeId: 5,
                    localName: 'text',
                    attributes: ['text', 'partially visible'],
                    box_model: { content: quad(60, 35, 20, 10) },
                  },
                ],
              },
            ],
          },
        ],
      },
      { x: 0, y: 0, width: 100, height: 100 },
    );

    assert.equal(refs[2]?.flags.visible, false);
    assert.equal(refs[2]?.flags.offscreen, true);
    assert.equal(refs[3]?.flags.visible, true);
    assert.deepEqual(refs[3]?.center, { x: 65, y: 40 });
  });

  test('orders children of scrollers by their current visual position', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'list',
      box_model: { content: quad(0, 0, 100, 100) },
      children: [
        {
          nodeId: 2,
          localName: 'text',
          attributes: ['text', 'recycled last'],
          box_model: { content: quad(0, 60, 100, 20) },
        },
        {
          nodeId: 3,
          localName: 'text',
          attributes: ['text', 'visual first'],
          box_model: { content: quad(0, 10, 100, 20) },
        },
      ],
    });

    assert.deepEqual(
      refs.map((ref) => ref.nodeId),
      [1, 3, 2],
    );
    assert.deepEqual(
      refs.map((ref) => ref.text),
      ['', 'visual first', 'recycled last'],
    );
  });

  test('accepts a camelCase box model from normalized callers', () => {
    const refs = buildRefs({
      nodeId: 1,
      localName: 'view',
      boxModel: { content: quad(0, 0, 20, 10) },
    });

    assert.deepEqual(
      refs.map((ref) => ref.ref),
      ['@e1'],
    );
  });
});
