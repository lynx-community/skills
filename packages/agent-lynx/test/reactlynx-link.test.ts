// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type CommandData,
  DevNodeType,
  parseReactLynxLinkRef,
} from '@lynx-js/devtool-connector/command';
import { renderLink } from '../src/commands/reactlynx/link.ts';

test('parseReactLynxLinkRef distinguishes snapshot refs, component labels, and vnode ids', () => {
  assert.deepEqual(parseReactLynxLinkRef('@e7'), {
    kind: 'element',
    ref: '@e7',
  });
  assert.deepEqual(parseReactLynxLinkRef('e7'), {
    kind: 'element',
    ref: '@e7',
  });
  assert.deepEqual(parseReactLynxLinkRef('@c3'), {
    kind: 'component-label',
    index: 3,
  });
  assert.deepEqual(parseReactLynxLinkRef('84'), {
    kind: 'component-id',
    id: 84,
  });
  assert.throws(() => parseReactLynxLinkRef('@e0'), /expected @e1/u);
  assert.throws(
    () => parseReactLynxLinkRef('button'),
    /expected @cN or a numeric id/u,
  );
});

test('renderLink makes both exact-identity directions readable', () => {
  const data = {
    clientId: 'device:8901',
    sessionId: 1,
    cache: { status: 'reused', generation: 2, capturedAt: 1 },
    direction: 'element-to-component',
    relation: 'nearest-component',
    element: {
      ref: '@e3',
      tag: 'view',
      text: 'Button',
      nodeId: 4,
      backendNodeId: 4,
      center: { x: 60, y: 320 },
      box: { x: 10, y: 300, width: 100, height: 40 },
      flags: {
        interactive: true,
        visible: true,
        offscreen: false,
        scrollable: false,
        disabled: false,
        editable: false,
      },
      attributes: {},
    },
    component: {
      ref: '@c2',
      id: 84,
      type: DevNodeType.Memo,
      name: 'FreshComponent',
      key: '',
    },
  } satisfies CommandData<'reactlynx-link'>;

  assert.equal(
    renderLink(data),
    '@e3 [view] "Button" -> @c2 [memo] FreshComponent (id=84)',
  );
  assert.equal(
    renderLink({
      ...data,
      direction: 'component-to-element',
      relation: 'first-host-element',
    }),
    '@c2 [memo] FreshComponent (id=84) -> @e3 [view] "Button"',
  );
});
