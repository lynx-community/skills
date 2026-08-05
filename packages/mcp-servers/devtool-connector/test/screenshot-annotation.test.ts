// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jpeg from 'jpeg-js';
import {
  annotateScreenshot,
  ScreenshotAnnotationError,
} from '../src/command/screenshot-annotation.ts';
import {
  SNAPSHOT_REF_ANNOTATION_ROLE,
  type SnapshotRef,
  type SnapshotRefAnnotationRole,
} from '../src/command/snapshot.ts';

function makeJpeg(width: number, height: number): Buffer {
  const data = Buffer.alloc(width * height * 4, 255);
  return jpeg.encode({ width, height, data }, 95).data;
}

function makeRef(
  ref: string,
  box: { x: number; y: number; width: number; height: number },
  visible = true,
  role: SnapshotRefAnnotationRole = 'action',
): SnapshotRef {
  return {
    ref,
    tag: 'button',
    text: `Button ${ref}`,
    nodeId: Number.parseInt(ref.slice(2), 10),
    center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    box,
    flags: {
      interactive: true,
      visible,
      offscreen: !visible,
      scrollable: false,
      disabled: false,
      editable: false,
    },
    attributes: {},
    [SNAPSHOT_REF_ANNOTATION_ROLE]: role,
  };
}

function pixel(
  image: ReturnType<typeof jpeg.decode>,
  x: number,
  y: number,
): [number, number, number] {
  const offset = (y * image.width + x) * 4;
  return [
    image.data[offset]!,
    image.data[offset + 1]!,
    image.data[offset + 2]!,
  ];
}

test('annotateScreenshot draws numbered refs into one JPEG and returns matching pixel boxes', () => {
  const result = annotateScreenshot({
    jpeg: makeJpeg(200, 400),
    frame: { x: 10, y: 20, width: 100, height: 200 },
    viewport: { x: 10, y: 20, width: 100, height: 200 },
    refs: [
      makeRef('@e1', { x: 20, y: 40, width: 30, height: 40 }),
      makeRef('@e2', { x: 5, y: 100, width: 20, height: 30 }),
      makeRef('@e3', { x: 20, y: 500, width: 30, height: 40 }, false),
    ],
  });

  assert.equal(result.jpeg[0], 0xff);
  assert.equal(result.jpeg[1], 0xd8);
  assert.equal(result.width, 200);
  assert.equal(result.height, 400);
  assert.deepEqual(
    result.annotations.map((annotation) => ({
      ref: annotation.ref,
      number: annotation.number,
      box: annotation.box,
    })),
    [
      { ref: '@e1', number: 1, box: { x: 20, y: 40, width: 60, height: 80 } },
      { ref: '@e2', number: 2, box: { x: 0, y: 160, width: 30, height: 60 } },
    ],
  );

  const decoded = jpeg.decode(result.jpeg, {
    useTArray: true,
    formatAsRGBA: true,
  });
  const [red, green, blue] = pixel(decoded, 50, 40);
  assert.ok(
    red > 150,
    `annotation border must remain red after JPEG encoding: ${red},${green},${blue}`,
  );
  assert.ok(red > green + 60);
  assert.ok(red > blue + 30);
});

test('annotateScreenshot maps inset DOM viewport coordinates through the full screencast frame', () => {
  const result = annotateScreenshot({
    jpeg: makeJpeg(414, 875),
    frame: { x: 0, y: 0, width: 414, height: 875 },
    viewport: { x: 0, y: 36, width: 414, height: 839 },
    refs: [makeRef('@e1', { x: 169, y: 47, width: 75, height: 27 })],
  });

  assert.deepEqual(result.annotations[0]?.box, {
    x: 169,
    y: 47,
    width: 75,
    height: 27,
  });
});

test('annotateScreenshot skips non-interactive, hidden, malformed, and non-overlapping refs', () => {
  const nonInteractive = makeRef('@e2', {
    x: 10,
    y: 10,
    width: 20,
    height: 20,
  });
  nonInteractive.flags.interactive = false;
  const malformed = makeRef('node', { x: 10, y: 10, width: 20, height: 20 });
  const result = annotateScreenshot({
    jpeg: makeJpeg(100, 100),
    frame: { x: 0, y: 0, width: 100, height: 100 },
    viewport: { x: 0, y: 0, width: 100, height: 100 },
    refs: [
      makeRef('@e1', { x: 10, y: 10, width: 20, height: 20 }, false),
      nonInteractive,
      malformed,
      makeRef('@e3', { x: 200, y: 200, width: 20, height: 20 }),
      makeRef('@e4', { x: 10, y: 10, width: 20, height: 20 }, true, 'generic'),
    ],
  });

  assert.deepEqual(result.annotations, []);
  assert.equal(result.width, 100);
  assert.equal(result.height, 100);
});

test('annotateScreenshot removes generic and duplicate parent-child boxes', () => {
  const parent = makeRef('@e2', { x: 10, y: 10, width: 60, height: 30 });
  const duplicateChild = makeRef('@e3', {
    x: 10,
    y: 10,
    width: 60,
    height: 30,
  });
  duplicateChild.parentRef = parent.ref;
  const nestedAction = makeRef('@e4', { x: 50, y: 15, width: 15, height: 15 });
  nestedAction.parentRef = parent.ref;
  const generic = makeRef(
    '@e1',
    { x: 0, y: 0, width: 100, height: 100 },
    true,
    'generic',
  );
  const scroll = makeRef(
    '@e5',
    { x: 0, y: 0, width: 100, height: 100 },
    true,
    'scrollable',
  );
  scroll.flags.scrollable = true;

  const result = annotateScreenshot({
    jpeg: makeJpeg(100, 100),
    frame: { x: 0, y: 0, width: 100, height: 100 },
    viewport: { x: 0, y: 0, width: 100, height: 100 },
    refs: [generic, parent, duplicateChild, nestedAction, scroll],
  });

  assert.deepEqual(
    result.annotations.map((annotation) => annotation.ref),
    ['@e2', '@e4', '@e5'],
  );
});

test('annotateScreenshot uses distinct colors for meaningful overlapping targets', () => {
  const result = annotateScreenshot({
    jpeg: makeJpeg(100, 100),
    frame: { x: 0, y: 0, width: 100, height: 100 },
    viewport: { x: 0, y: 0, width: 100, height: 100 },
    refs: [
      makeRef('@e1', { x: 10, y: 10, width: 80, height: 80 }),
      makeRef('@e2', { x: 30, y: 30, width: 40, height: 40 }),
    ],
  });
  const decoded = jpeg.decode(result.jpeg, {
    useTArray: true,
    formatAsRGBA: true,
  });
  const [firstRed, firstGreen] = pixel(decoded, 10, 50);
  const [secondRed, secondGreen, secondBlue] = pixel(decoded, 30, 50);

  assert.ok(
    firstRed > firstGreen + 60,
    'the first target should use the default magenta border',
  );
  assert.ok(
    secondBlue > secondRed + 80,
    'the overlapping target should switch to a blue border',
  );
  assert.ok(secondBlue > secondGreen + 30);
});

test('annotateScreenshot renders viewport-sized scroll containers as badge-only', () => {
  const scroll = makeRef(
    '@e1',
    { x: 0, y: 0, width: 100, height: 100 },
    true,
    'scrollable',
  );
  scroll.flags.scrollable = true;
  const result = annotateScreenshot({
    jpeg: makeJpeg(300, 300),
    frame: { x: 0, y: 0, width: 100, height: 100 },
    viewport: { x: 0, y: 0, width: 100, height: 100 },
    refs: [scroll],
  });
  const decoded = jpeg.decode(result.jpeg, {
    useTArray: true,
    formatAsRGBA: true,
  });
  const [red, green, blue] = pixel(decoded, 1, 150);

  assert.ok(
    Math.abs(red - green) < 20 && Math.abs(red - blue) < 20,
    'the full viewport must not get a border',
  );
  assert.deepEqual(
    result.annotations.map((annotation) => annotation.ref),
    ['@e1'],
  );
});

test('annotateScreenshot caps high-DPR label size', () => {
  const result = annotateScreenshot({
    jpeg: makeJpeg(300, 300),
    frame: { x: 0, y: 0, width: 100, height: 100 },
    viewport: { x: 0, y: 0, width: 100, height: 100 },
    refs: [makeRef('@e1', { x: 30, y: 50, width: 40, height: 20 })],
  });
  const decoded = jpeg.decode(result.jpeg, {
    useTArray: true,
    formatAsRGBA: true,
  });
  let firstColoredRow = Number.POSITIVE_INFINITY;
  for (let y = 0; y < 150; y += 1) {
    for (let x = 0; x < decoded.width; x += 1) {
      const [red, green, blue] = pixel(decoded, x, y);
      if (red > 150 && red > green + 50 && red > blue + 20) {
        firstColoredRow = Math.min(firstColoredRow, y);
      }
    }
  }

  assert.ok(
    firstColoredRow >= 116,
    `the capped label should start near y=122, got y=${firstColoredRow}`,
  );
});

test('annotateScreenshot rejects invalid viewport and image input', () => {
  assert.throws(
    () =>
      annotateScreenshot({
        jpeg: makeJpeg(10, 10),
        frame: { x: 0, y: 0, width: 10, height: 10 },
        viewport: { x: 0, y: 0, width: 0, height: 10 },
        refs: [],
      }),
    ScreenshotAnnotationError,
  );
  assert.throws(
    () =>
      annotateScreenshot({
        jpeg: Buffer.from('not a jpeg'),
        frame: { x: 0, y: 0, width: 10, height: 10 },
        viewport: { x: 0, y: 0, width: 10, height: 10 },
        refs: [],
      }),
    /not a decodable JPEG/u,
  );
  assert.throws(
    () =>
      annotateScreenshot({
        jpeg: makeJpeg(100, 200),
        frame: { x: 0, y: 0, width: 100, height: 100 },
        viewport: { x: 0, y: 0, width: 100, height: 100 },
        refs: [],
      }),
    /does not match the captured JPEG aspect ratio/u,
  );
});
