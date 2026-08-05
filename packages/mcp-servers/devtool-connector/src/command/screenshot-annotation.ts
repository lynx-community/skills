// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as jpeg from 'jpeg-js';
import type { ScreenshotAnnotation } from './contract.ts';
import {
  type Box,
  SNAPSHOT_REF_ANNOTATION_ROLE,
  type SnapshotRef,
  type SnapshotRefAnnotationRole,
} from './snapshot.ts';

export class ScreenshotAnnotationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScreenshotAnnotationError';
  }
}

function intersectBoxes(left: Box, right: Box): Box | null {
  const x = Math.max(left.x, right.x);
  const y = Math.max(left.y, right.y);
  const maxX = Math.min(left.x + left.width, right.x + right.width);
  const maxY = Math.min(left.y + left.height, right.y + right.height);
  if (maxX <= x || maxY <= y) return null;
  return { x, y, width: maxX - x, height: maxY - y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface RasterImage {
  data: Uint8Array;
  width: number;
  height: number;
}

type Color = readonly [red: number, green: number, blue: number, alpha: number];
type Rgb = readonly [red: number, green: number, blue: number];

const ANNOTATION_PALETTE: readonly Rgb[] = [
  [230, 0, 82],
  [0, 130, 220],
  [242, 145, 0],
  [124, 77, 255],
];

function rgba(color: Rgb, alpha: number): Color {
  return [color[0], color[1], color[2], alpha];
}

function blendPixel(
  image: RasterImage,
  x: number,
  y: number,
  color: Color,
): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const offset = (y * image.width + x) * 4;
  const alpha = color[3] / 255;
  image.data[offset] = Math.round(
    color[0] * alpha + image.data[offset]! * (1 - alpha),
  );
  image.data[offset + 1] = Math.round(
    color[1] * alpha + image.data[offset + 1]! * (1 - alpha),
  );
  image.data[offset + 2] = Math.round(
    color[2] * alpha + image.data[offset + 2]! * (1 - alpha),
  );
  image.data[offset + 3] = 255;
}

function fillRect(image: RasterImage, box: Box, color: Color): void {
  const x = clamp(Math.floor(box.x), 0, image.width);
  const y = clamp(Math.floor(box.y), 0, image.height);
  const right = clamp(Math.ceil(box.x + box.width), 0, image.width);
  const bottom = clamp(Math.ceil(box.y + box.height), 0, image.height);
  for (let pixelY = y; pixelY < bottom; pixelY += 1) {
    for (let pixelX = x; pixelX < right; pixelX += 1)
      blendPixel(image, pixelX, pixelY, color);
  }
}

function strokeRect(
  image: RasterImage,
  box: Box,
  thickness: number,
  color: Color,
): void {
  fillRect(
    image,
    { x: box.x, y: box.y, width: box.width, height: thickness },
    color,
  );
  fillRect(
    image,
    {
      x: box.x,
      y: box.y + box.height - thickness,
      width: box.width,
      height: thickness,
    },
    color,
  );
  const verticalHeight = Math.max(0, box.height - thickness * 2);
  fillRect(
    image,
    {
      x: box.x,
      y: box.y + thickness,
      width: thickness,
      height: verticalHeight,
    },
    color,
  );
  fillRect(
    image,
    {
      x: box.x + box.width - thickness,
      y: box.y + thickness,
      width: thickness,
      height: verticalHeight,
    },
    color,
  );
}

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '[': ['110', '100', '100', '100', '110'],
  ']': ['011', '001', '001', '001', '011'],
};

interface LabelMetrics {
  width: number;
  height: number;
  padding: number;
  glyphWidth: number;
  glyphHeight: number;
  spacing: number;
}

function labelMetrics(text: string, scale: number): LabelMetrics {
  const padding = scale;
  const glyphWidth = 3 * scale;
  const glyphHeight = 5 * scale;
  const spacing = scale;
  const width =
    padding * 2 +
    text.length * glyphWidth +
    Math.max(0, text.length - 1) * spacing;
  const height = padding * 2 + glyphHeight;
  return { width, height, padding, glyphWidth, glyphHeight, spacing };
}

function drawLabel(
  image: RasterImage,
  text: string,
  box: Box,
  scale: number,
  color: Rgb,
): void {
  const metrics = labelMetrics(text, scale);
  fillRect(image, box, rgba(color, 235));

  let cursorX = box.x + metrics.padding;
  for (const character of text) {
    const glyph = GLYPHS[character];
    if (glyph) {
      glyph.forEach((row, rowIndex) => {
        for (let column = 0; column < row.length; column += 1) {
          if (row[column] !== '1') continue;
          fillRect(
            image,
            {
              x: cursorX + column * scale,
              y: box.y + metrics.padding + rowIndex * scale,
              width: scale,
              height: scale,
            },
            [255, 255, 255, 255],
          );
        }
      });
    }
    cursorX += metrics.glyphWidth + metrics.spacing;
  }
}

function annotationNumber(ref: string): number | null {
  const match = /^@e([1-9]\d*)$/u.exec(ref);
  if (!match) return null;
  const number = Number.parseInt(match[1]!, 10);
  return Number.isSafeInteger(number) ? number : null;
}

interface AnnotationCandidate {
  ref: SnapshotRef;
  number: number;
  role: Exclude<SnapshotRefAnnotationRole, 'generic'>;
  visibleBox: Box;
}

function annotationRole(ref: SnapshotRef): SnapshotRefAnnotationRole {
  const internalRole = ref[SNAPSHOT_REF_ANNOTATION_ROLE];
  if (internalRole !== undefined) return internalRole;
  if (ref.flags.editable) return 'editable';
  if (ref.flags.scrollable) return 'scrollable';
  if (ref.attributes['lynx-test-tag'] !== undefined) return 'target';
  return 'generic';
}

function boxArea(box: Box): number {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

function overlapArea(left: Box, right: Box): number {
  const intersection = intersectBoxes(left, right);
  return intersection === null ? 0 : boxArea(intersection);
}

function isAncestor(
  ancestorRef: string,
  descendant: SnapshotRef,
  refsByLabel: ReadonlyMap<string, SnapshotRef>,
): boolean {
  const visited = new Set<string>();
  let parentRef = descendant.parentRef;
  while (parentRef !== undefined && !visited.has(parentRef)) {
    if (parentRef === ancestorRef) return true;
    visited.add(parentRef);
    parentRef = refsByLabel.get(parentRef)?.parentRef;
  }
  return false;
}

function representsSameTarget(
  left: AnnotationCandidate,
  right: AnnotationCandidate,
  refsByLabel: ReadonlyMap<string, SnapshotRef>,
): boolean {
  if (
    !isAncestor(left.ref.ref, right.ref, refsByLabel) &&
    !isAncestor(right.ref.ref, left.ref, refsByLabel)
  ) {
    return false;
  }
  const leftArea = boxArea(left.visibleBox);
  const rightArea = boxArea(right.visibleBox);
  const smallerArea = Math.min(leftArea, rightArea);
  const largerArea = Math.max(leftArea, rightArea);
  if (smallerArea <= 0 || largerArea <= 0) return false;
  return (
    overlapArea(left.visibleBox, right.visibleBox) / smallerArea >= 0.95 &&
    smallerArea / largerArea >= 0.7
  );
}

const ROLE_PRIORITY: Readonly<
  Record<Exclude<SnapshotRefAnnotationRole, 'generic'>, number>
> = {
  editable: 4,
  action: 3,
  target: 2,
  scrollable: 1,
};

/** Select the sparse, actionable projection of a snapshot that should be drawn over an image. */
function selectAnnotationRefs(
  refs: readonly SnapshotRef[],
  viewport: Box,
): AnnotationCandidate[] {
  const refsByLabel = new Map(refs.map((ref) => [ref.ref, ref]));
  const candidates: AnnotationCandidate[] = [];
  for (const ref of refs) {
    if (!ref.flags.interactive || !ref.flags.visible) continue;
    const number = annotationNumber(ref.ref);
    const visibleBox = intersectBoxes(ref.box, viewport);
    const role = annotationRole(ref);
    if (number === null || visibleBox === null || role === 'generic') continue;
    candidates.push({ ref, number, role, visibleBox });
  }

  const retained: AnnotationCandidate[] = [];
  for (const candidate of [...candidates].sort(
    (left, right) =>
      ROLE_PRIORITY[right.role] - ROLE_PRIORITY[left.role] ||
      boxArea(right.visibleBox) - boxArea(left.visibleBox) ||
      left.number - right.number,
  )) {
    if (
      retained.some((existing) =>
        representsSameTarget(existing, candidate, refsByLabel),
      )
    )
      continue;
    retained.push(candidate);
  }
  return [...retained].sort((left, right) => left.number - right.number);
}

interface RenderAnnotation {
  annotation: ScreenshotAnnotation;
  badgeOnly: boolean;
  colorIndex: number;
}

function isSignificantOverlap(
  left: RenderAnnotation,
  right: RenderAnnotation,
): boolean {
  if (left.badgeOnly || right.badgeOnly) return false;
  const smallerArea = Math.min(
    boxArea(left.annotation.box),
    boxArea(right.annotation.box),
  );
  return (
    smallerArea > 0 &&
    overlapArea(left.annotation.box, right.annotation.box) / smallerArea >= 0.1
  );
}

function assignAnnotationColors(
  entries: Array<Omit<RenderAnnotation, 'colorIndex'>>,
): RenderAnnotation[] {
  const result: RenderAnnotation[] = [];
  for (const entry of entries) {
    const used = new Set(
      result
        .filter((existing) =>
          isSignificantOverlap(existing, { ...entry, colorIndex: 0 }),
        )
        .map((existing) => existing.colorIndex),
    );
    const available = ANNOTATION_PALETTE.findIndex(
      (_color, index) => !used.has(index),
    );
    result.push({
      ...entry,
      colorIndex:
        available >= 0 ? available : result.length % ANNOTATION_PALETTE.length,
    });
  }
  return result;
}

function containedLabelBox(
  image: RasterImage,
  x: number,
  y: number,
  metrics: LabelMetrics,
): Box {
  return {
    x: clamp(Math.round(x), 0, Math.max(0, image.width - metrics.width)),
    y: clamp(Math.round(y), 0, Math.max(0, image.height - metrics.height)),
    width: metrics.width,
    height: metrics.height,
  };
}

function uniqueBoxes(boxes: readonly Box[]): Box[] {
  const seen = new Set<string>();
  return boxes.filter((box) => {
    const key = `${box.x}:${box.y}:${box.width}:${box.height}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function placeLabel(
  image: RasterImage,
  target: Box,
  metrics: LabelMetrics,
  occupiedLabels: readonly Box[],
  blockedTargets: readonly Box[],
  badgeOnly: boolean,
): Box {
  const left = target.x;
  const right = target.x + target.width - metrics.width;
  const above = target.y - metrics.height;
  const below = target.y + target.height;
  const insideTop = target.y;
  const insideBottom = target.y + target.height - metrics.height;
  const positions = badgeOnly
    ? ([
        [right, insideTop],
        [left, insideTop],
        [right, insideBottom],
        [left, insideBottom],
      ] as const)
    : ([
        [left, above],
        [right, above],
        [left, below],
        [right, below],
        [left, insideTop],
        [right, insideTop],
      ] as const);
  const boxes = uniqueBoxes(
    positions.map(([x, y]) => containedLabelBox(image, x, y, metrics)),
  );

  return boxes.reduce(
    (best, candidate, index) => {
      const occupiedPenalty =
        occupiedLabels.reduce(
          (sum, box) => sum + overlapArea(candidate, box),
          0,
        ) * 1_000;
      const blockedPenalty =
        blockedTargets.reduce(
          (sum, box) => sum + overlapArea(candidate, box),
          0,
        ) * 5;
      const ownTargetPenalty = overlapArea(candidate, target);
      const score = occupiedPenalty + blockedPenalty + ownTargetPenalty + index;
      return score < best.score ? { box: candidate, score } : best;
    },
    { box: boxes[0]!, score: Number.POSITIVE_INFINITY },
  ).box;
}

export interface AnnotateScreenshotOptions {
  jpeg: Buffer;
  refs: readonly SnapshotRef[];
  /** Full screencast frame bounds in the same logical coordinate space as snapshot refs. */
  frame: Box;
  /** Visible page bounds used to clip refs, which may be inset within the frame. */
  viewport: Box;
  quality?: number;
}

export interface AnnotatedScreenshot {
  jpeg: Buffer;
  width: number;
  height: number;
  annotations: ScreenshotAnnotation[];
}

/** Draw numbered snapshot refs into a JPEG and return matching pixel-space metadata. */
export function annotateScreenshot(
  options: AnnotateScreenshotOptions,
): AnnotatedScreenshot {
  if (options.viewport.width <= 0 || options.viewport.height <= 0) {
    throw new ScreenshotAnnotationError(
      'The snapshot viewport must have positive dimensions.',
    );
  }
  if (
    !Number.isFinite(options.frame.x) ||
    !Number.isFinite(options.frame.y) ||
    !Number.isFinite(options.frame.width) ||
    !Number.isFinite(options.frame.height) ||
    options.frame.width <= 0 ||
    options.frame.height <= 0
  ) {
    throw new ScreenshotAnnotationError(
      'The screencast frame must have finite, positive bounds.',
    );
  }

  let image: RasterImage;
  try {
    image = jpeg.decode(options.jpeg, {
      useTArray: true,
      formatAsRGBA: true,
      maxResolutionInMP: 32,
      maxMemoryUsageInMB: 256,
    });
  } catch (error) {
    throw new ScreenshotAnnotationError(
      'The captured frame is not a decodable JPEG.',
      { cause: error },
    );
  }
  if (image.width <= 0 || image.height <= 0) {
    throw new ScreenshotAnnotationError(
      'The captured JPEG has invalid dimensions.',
    );
  }

  const scaleX = image.width / options.frame.width;
  const scaleY = image.height / options.frame.height;
  const scaleDifference = Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY);
  if (scaleDifference > 0.02) {
    throw new ScreenshotAnnotationError(
      'The screencast frame metadata does not match the captured JPEG aspect ratio.',
    );
  }
  const entries: Array<Omit<RenderAnnotation, 'colorIndex'>> = [];
  for (const candidate of selectAnnotationRefs(
    options.refs,
    options.viewport,
  )) {
    const { ref, number, role, visibleBox } = candidate;
    const frameVisibleBox = intersectBoxes(visibleBox, options.frame);
    if (frameVisibleBox === null) continue;
    const x = clamp(
      Math.floor((frameVisibleBox.x - options.frame.x) * scaleX),
      0,
      image.width,
    );
    const y = clamp(
      Math.floor((frameVisibleBox.y - options.frame.y) * scaleY),
      0,
      image.height,
    );
    const right = clamp(
      Math.ceil(
        (frameVisibleBox.x + frameVisibleBox.width - options.frame.x) * scaleX,
      ),
      0,
      image.width,
    );
    const bottom = clamp(
      Math.ceil(
        (frameVisibleBox.y + frameVisibleBox.height - options.frame.y) * scaleY,
      ),
      0,
      image.height,
    );
    if (right <= x || bottom <= y) continue;
    entries.push({
      annotation: {
        ref: ref.ref,
        number,
        tag: ref.tag,
        ...(ref.text ? { text: ref.text } : {}),
        box: { x, y, width: right - x, height: bottom - y },
      },
      badgeOnly:
        role === 'scrollable' &&
        boxArea(visibleBox) / boxArea(options.viewport) >= 0.65,
    });
  }
  const renderAnnotations = assignAnnotationColors(entries);
  const annotations = renderAnnotations.map((entry) => entry.annotation);

  const deviceScale = Math.max(1, Math.min(scaleX, scaleY));
  const strokeWidth = clamp(Math.round(deviceScale), 2, 4);
  const glyphScale = clamp(Math.round(1.25 * deviceScale), 2, 4);
  for (const entry of renderAnnotations) {
    if (entry.badgeOnly) continue;
    const color = ANNOTATION_PALETTE[entry.colorIndex]!;
    strokeRect(image, entry.annotation.box, strokeWidth, rgba(color, 220));
  }

  const blockedTargets = renderAnnotations
    .filter((entry) => !entry.badgeOnly)
    .map((entry) => entry.annotation.box);
  const occupiedLabels: Box[] = [];
  for (const entry of renderAnnotations) {
    const text = `[${entry.annotation.number}]`;
    const metrics = labelMetrics(text, glyphScale);
    const ownTargetIndex = blockedTargets.indexOf(entry.annotation.box);
    const otherTargets =
      ownTargetIndex < 0
        ? blockedTargets
        : blockedTargets.filter((_target, index) => index !== ownTargetIndex);
    const labelBox = placeLabel(
      image,
      entry.annotation.box,
      metrics,
      occupiedLabels,
      otherTargets,
      entry.badgeOnly,
    );
    drawLabel(
      image,
      text,
      labelBox,
      glyphScale,
      ANNOTATION_PALETTE[entry.colorIndex]!,
    );
    occupiedLabels.push(labelBox);
  }

  try {
    const encoded = jpeg.encode(image, options.quality ?? 90);
    return {
      jpeg: Buffer.from(encoded.data),
      width: image.width,
      height: image.height,
      annotations,
    };
  } catch (error) {
    throw new ScreenshotAnnotationError(
      'Failed to encode the annotated JPEG.',
      { cause: error },
    );
  }
}
