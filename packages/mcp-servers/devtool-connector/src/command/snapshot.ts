// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '../index.ts';

/** A bounding box in CDP logical coordinates. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface RefFlags {
  interactive: boolean;
  visible: boolean;
  offscreen: boolean;
  scrollable: boolean;
  disabled: boolean;
  editable: boolean;
}

/** Internal hit-test identities. Symbol keys are deliberately omitted from JSON output. */
export const SNAPSHOT_REF_HIT_NODE_IDS: unique symbol = Symbol(
  'snapshotRefHitNodeIds',
);
const SNAPSHOT_REF_VISIBLE_BOX: unique symbol = Symbol('snapshotRefVisibleBox');
const SNAPSHOT_REF_NEEDS_HIT_TEST: unique symbol = Symbol(
  'snapshotRefNeedsHitTest',
);
export const SNAPSHOT_REF_ANNOTATION_ROLE: unique symbol = Symbol(
  'snapshotRefAnnotationRole',
);

export type SnapshotRefAnnotationRole =
  | 'action'
  | 'editable'
  | 'scrollable'
  | 'target'
  | 'generic';

/** Refs are stable only within the snapshot that produced them. */
export interface SnapshotRef {
  ref: string;
  /** Nearest surfaced ancestor in the compact snapshot; omitted for roots. */
  parentRef?: string;
  tag: string;
  text: string;
  nodeId: number;
  backendNodeId?: number;
  center: Point;
  box: Box;
  flags: RefFlags;
  attributes: Record<string, string>;
  [SNAPSHOT_REF_HIT_NODE_IDS]?: ReadonlySet<number>;
  [SNAPSHOT_REF_VISIBLE_BOX]?: Box;
  [SNAPSHOT_REF_NEEDS_HIT_TEST]?: boolean;
  [SNAPSHOT_REF_ANNOTATION_ROLE]?: SnapshotRefAnnotationRole;
}

export interface SnapshotResult {
  viewport: Box | undefined;
  refs: SnapshotRef[];
}

interface DomBoxModel {
  content?: number[];
  border?: number[];
}

/** Lynx DOM node returned by `DOM.getDocumentWithBoxModel`. */
export interface DomNode {
  nodeId: number;
  backendNodeId?: number;
  nodeName?: string;
  localName?: string;
  nodeValue?: string;
  nodeType?: number;
  attributes?: string[];
  children?: DomNode[];
  /** Field name used by the Lynx CDP protocol. */
  box_model?: DomBoxModel;
  /** Compatibility with callers that already normalized CDP fields to camelCase. */
  boxModel?: DomBoxModel;
}

const INTERACTIVE_TAGS = new Set([
  'view',
  'text',
  'image',
  'scroll-view',
  'list',
  'x-input',
  'input',
  'textarea',
]);
const SCROLLABLE_TAGS = new Set([
  'scroll-view',
  'list',
  'x-scroll-view',
  'x-list',
]);
const EDITABLE_TAGS = new Set(['input', 'textarea', 'x-input', 'x-textarea']);
const SURFACED_ATTRS = [
  'id',
  'class',
  'lynx-test-tag',
  'value',
  'placeholder',
  'disabled',
  'name',
  'type',
];
const PROTOCOL_ATTR_ALIASES: Readonly<Record<string, string>> = {
  classSelector: 'class',
  idSelector: 'id',
};
const ACTION_EVENT_ATTR =
  /^(?:capture-)?(?:bind|catch)(?:tap|longpress|touchstart|touchmove|touchend|input|change|confirm|submit)$/u;

function getAttr(node: DomNode, name: string): string | undefined {
  const attrs = node.attributes ?? [];
  for (let i = 0; i + 1 < attrs.length; i += 2) {
    if (attrs[i] === name) return attrs[i + 1];
  }
  return undefined;
}

function hasActionEvent(node: DomNode): boolean {
  const attrs = node.attributes ?? [];
  for (let index = 0; index + 1 < attrs.length; index += 2) {
    if (ACTION_EVENT_ATTR.test(attrs[index]!)) return true;
  }
  return false;
}

function surfacedAttributes(node: DomNode): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of SURFACED_ATTRS) {
    const value = getAttr(node, name);
    if (value !== undefined) result[name] = value;
  }
  for (const [protocolName, publicName] of Object.entries(
    PROTOCOL_ATTR_ALIASES,
  )) {
    if (result[publicName] !== undefined) continue;
    const value = getAttr(node, protocolName);
    if (value !== undefined) result[publicName] = value;
  }
  return result;
}

function quadBounds(quad: number[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const xs = [quad[0]!, quad[2]!, quad[4]!, quad[6]!];
  const ys = [quad[1]!, quad[3]!, quad[5]!, quad[7]!];
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function centerOfQuad(quad: number[]): Point {
  const { minX, maxX, minY, maxY } = quadBounds(quad);
  return { x: Math.round((minX + maxX) / 2), y: Math.round((minY + maxY) / 2) };
}

function boxOfQuad(quad: number[]): Box {
  const { minX, maxX, minY, maxY } = quadBounds(quad);
  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

function collectText(node: DomNode, depth = 0): string {
  if (depth > 3) return '';
  const finish = (value: string): string =>
    depth === 0 ? value.trim() : value;
  if (node.nodeType === 3 && node.nodeValue) return finish(node.nodeValue);
  const tag = tagName(node);
  const ownText = getAttr(node, 'text');
  if ((tag === 'text' || tag === 'raw-text') && ownText) return finish(ownText);
  const ownValue = getAttr(node, 'value');
  if (EDITABLE_TAGS.has(tag) && ownValue) return finish(ownValue);
  if (SCROLLABLE_TAGS.has(tag)) return '';

  const parts: string[] = [];
  for (const child of node.children ?? []) {
    const childTag = tagName(child);
    const childQuad = boxQuad(child);
    const childHasOwnRef =
      childQuad !== undefined &&
      childQuad.length >= 8 &&
      isInteractive(child) &&
      boxOfQuad(childQuad).width > 0 &&
      boxOfQuad(childQuad).height > 0;
    if (
      tag !== 'text' &&
      child.nodeType !== 3 &&
      childTag !== 'text' &&
      childTag !== 'raw-text'
    ) {
      continue;
    }
    if (tag !== 'text' && childHasOwnRef) continue;
    const text = collectText(child, depth + 1);
    if (text) parts.push(text);
  }
  return finish(parts.join(''));
}

function collectNodeIds(
  node: DomNode,
  result = new Set<number>(),
): ReadonlySet<number> {
  result.add(node.nodeId);
  for (const child of node.children ?? []) collectNodeIds(child, result);
  return result;
}

function tagName(node: DomNode): string {
  return (node.localName || node.nodeName || '').toLowerCase();
}

function boxQuad(node: DomNode): number[] | undefined {
  const model = node.box_model ?? node.boxModel;
  return model?.content ?? model?.border;
}

function visuallyOrderedChildren(node: DomNode): readonly DomNode[] {
  const children = node.children ?? [];
  if (!SCROLLABLE_TAGS.has(tagName(node)) || children.length < 2)
    return children;
  const decorated = children.map((child, index) => {
    const quad = boxQuad(child);
    return {
      child,
      index,
      box: quad && quad.length >= 8 ? boxOfQuad(quad) : undefined,
    };
  });
  if (decorated.some((item) => item.box === undefined)) return children;
  return decorated
    .sort((left, right) => {
      const leftBox = left.box!;
      const rightBox = right.box!;
      return (
        leftBox.y - rightBox.y ||
        leftBox.x - rightBox.x ||
        left.index - right.index
      );
    })
    .map((item) => item.child);
}

function isInteractive(node: DomNode): boolean {
  const tag = tagName(node);
  if (!INTERACTIVE_TAGS.has(tag)) return false;
  if (hasActionEvent(node)) return true;
  if (getAttr(node, 'lynx-test-tag') !== undefined) return true;
  return (
    tag === 'text' ||
    tag === 'image' ||
    tag === 'view' ||
    EDITABLE_TAGS.has(tag) ||
    SCROLLABLE_TAGS.has(tag)
  );
}

function annotationRole(node: DomNode): SnapshotRefAnnotationRole {
  const tag = tagName(node);
  if (EDITABLE_TAGS.has(tag)) return 'editable';
  if (hasActionEvent(node)) return 'action';
  if (SCROLLABLE_TAGS.has(tag)) return 'scrollable';
  if (getAttr(node, 'lynx-test-tag') !== undefined) return 'target';
  return 'generic';
}

type VisibilityClip = Box | null | undefined;

function intersectBoxes(a: Box, b: Box): Box | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, height: bottom - y };
}

function applyClip(clip: VisibilityClip, box: Box): Box | null {
  if (clip === undefined) return box;
  if (clip === null) return null;
  return intersectBoxes(clip, box);
}

function sameBox(left: Box | null, right: Box | null): boolean {
  if (left === null || right === null) return left === right;
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

function centerOfBox(box: Box): Point {
  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
  };
}

function computeFlags(node: DomNode, box: Box, clip: VisibilityClip): RefFlags {
  const tag = tagName(node);
  const visibleBox = clip === undefined ? box : applyClip(clip, box);
  const visible = box.width > 0 && box.height > 0 && visibleBox !== null;
  return {
    interactive: isInteractive(node),
    visible,
    offscreen: clip !== undefined && !visible,
    scrollable: SCROLLABLE_TAGS.has(tag),
    disabled: getAttr(node, 'disabled') !== undefined,
    editable: EDITABLE_TAGS.has(tag),
  };
}

function deriveViewport(root: DomNode): Box | undefined {
  const findFirstBox = (node: DomNode, depth: number): Box | undefined => {
    const quad = boxQuad(node);
    if (quad && quad.length >= 8) {
      const box = boxOfQuad(quad);
      if (box.width > 0 && box.height > 0) return box;
    }
    if (depth > 4) return undefined;
    for (const child of node.children ?? []) {
      const box = findFirstBox(child, depth + 1);
      if (box) return box;
    }
    return undefined;
  };
  return findFirstBox(root, 0);
}

/** Build compact refs from a DOM tree without requiring a live device. */
export function buildRefs(root: DomNode, viewport?: Box): SnapshotRef[] {
  const refs: SnapshotRef[] = [];
  let counter = 0;

  const visit = (
    node: DomNode,
    parentRef: string | undefined,
    clip: VisibilityClip,
    needsHitTest: boolean,
  ): void => {
    let childParentRef = parentRef;
    const quad = boxQuad(node);
    const box = quad && quad.length >= 8 ? boxOfQuad(quad) : undefined;
    if (box && isInteractive(node)) {
      if (box.width > 0 && box.height > 0) {
        const visibleBox = clip === undefined ? box : applyClip(clip, box);
        counter += 1;
        const ref: SnapshotRef = {
          ref: `@e${counter}`,
          tag: tagName(node),
          text: collectText(node).slice(0, 80),
          nodeId: node.nodeId,
          center: centerOfBox(visibleBox ?? box),
          box,
          flags: computeFlags(node, box, clip),
          attributes: surfacedAttributes(node),
          [SNAPSHOT_REF_HIT_NODE_IDS]: collectNodeIds(node),
          [SNAPSHOT_REF_NEEDS_HIT_TEST]: needsHitTest,
          [SNAPSHOT_REF_ANNOTATION_ROLE]: annotationRole(node),
        };
        if (visibleBox) ref[SNAPSHOT_REF_VISIBLE_BOX] = visibleBox;
        if (parentRef !== undefined) ref.parentRef = parentRef;
        if (node.backendNodeId !== undefined)
          ref.backendNodeId = node.backendNodeId;
        refs.push(ref);
        childParentRef = ref.ref;
      }
    }

    let childClip = clip;
    let childNeedsHitTest = needsHitTest;
    if (
      box &&
      box.width > 0 &&
      box.height > 0 &&
      SCROLLABLE_TAGS.has(tagName(node))
    ) {
      const nextClip = applyClip(clip, box);
      if (clip === undefined || !sameBox(nextClip, clip))
        childNeedsHitTest = true;
      childClip = nextClip;
    }
    for (const child of visuallyOrderedChildren(node)) {
      visit(child, childParentRef, childClip, childNeedsHitTest);
    }
  };

  visit(root, undefined, viewport, false);

  const siblingsByBox = new Map<string, SnapshotRef[]>();
  for (const ref of refs) {
    if (!ref.flags.visible) continue;
    const key = `${ref.parentRef ?? '<root>'}:${ref.box.x}:${ref.box.y}:${ref.box.width}:${ref.box.height}`;
    const siblings = siblingsByBox.get(key);
    if (siblings) siblings.push(ref);
    else siblingsByBox.set(key, [ref]);
  }
  for (const siblings of siblingsByBox.values()) {
    if (siblings.length < 2) continue;
    for (const ref of siblings) ref[SNAPSHOT_REF_NEEDS_HIT_TEST] = true;
  }
  return refs;
}

function hitTestPoints(box: Box): Point[] {
  const fractions = [
    [0.5, 0.5],
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ] as const;
  const points = fractions.map(([x, y]) => ({
    x: Math.round(box.x + box.width * x),
    y: Math.round(box.y + box.height * y),
  }));
  return points.filter(
    (point, index) =>
      points.findIndex(
        (candidate) => candidate.x === point.x && candidate.y === point.y,
      ) === index,
  );
}

async function isPaintedRef(
  connector: Connector,
  clientId: string,
  sessionId: number,
  ref: SnapshotRef,
  signal?: AbortSignal,
): Promise<boolean | undefined> {
  let unresolvedBackendHit = false;
  for (const point of hitTestPoints(ref[SNAPSHOT_REF_VISIBLE_BOX] ?? ref.box)) {
    signal?.throwIfAborted();
    let located: { nodeId?: number; backendNodeId?: number };
    try {
      located = await connector.sendCDPMessage<
        { nodeId?: number; backendNodeId?: number },
        Point
      >(clientId, sessionId, 'DOM.getNodeForLocation', point);
    } catch {
      signal?.throwIfAborted();
      return undefined;
    }
    if (
      located.backendNodeId !== undefined &&
      located.backendNodeId !== 0 &&
      located.backendNodeId === ref.backendNodeId
    ) {
      return true;
    }
    if (located.nodeId !== undefined && located.nodeId !== 0) {
      if (
        located.nodeId === ref.nodeId ||
        ref[SNAPSHOT_REF_HIT_NODE_IDS]?.has(located.nodeId)
      )
        return true;
    } else if (
      located.backendNodeId !== undefined &&
      located.backendNodeId !== 0
    ) {
      // Some runtimes expose only backendNodeId. Without descendant backend
      // identities, this is unknown rather than proof that the ref is hidden.
      unresolvedBackendHit = true;
    }
  }
  return unresolvedBackendHit ? undefined : false;
}

async function refinePaintVisibility(
  connector: Connector,
  clientId: string,
  sessionId: number,
  refs: SnapshotRef[],
  signal?: AbortSignal,
): Promise<void> {
  const candidates = refs.filter(
    (ref) => ref.flags.visible && ref[SNAPSHOT_REF_NEEDS_HIT_TEST] === true,
  );
  const concurrency = 8;
  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    const verdicts = await Promise.all(
      batch.map((ref) =>
        isPaintedRef(connector, clientId, sessionId, ref, signal),
      ),
    );
    signal?.throwIfAborted();
    for (let offset = 0; offset < batch.length; offset += 1) {
      if (verdicts[offset] !== false) continue;
      const ref = batch[offset]!;
      ref.flags = { ...ref.flags, visible: false };
    }
    if (verdicts.every((verdict) => verdict === undefined)) break;
  }
}

interface UiNodeInfo {
  readonlyProps?: Record<string, unknown>;
  ui?: { readonlyProps?: Record<string, unknown> };
  view?: { readonlyProps?: Record<string, unknown> };
}

function firstStringProperty(
  records: Array<Record<string, unknown> | undefined>,
  names: readonly string[],
): string | undefined {
  for (const record of records) {
    for (const name of names) {
      const value = record?.[name];
      if (typeof value === 'string') return value;
    }
  }
  return undefined;
}

async function enrichEditableValues(
  connector: Connector,
  clientId: string,
  sessionId: number,
  refs: SnapshotRef[],
  signal?: AbortSignal,
): Promise<void> {
  const editableRefs = refs.filter(
    (ref) =>
      ref.flags.visible &&
      ref.flags.editable &&
      !ref.attributes['type']?.toLowerCase().includes('password'),
  );
  if (editableRefs.length === 0) return;

  try {
    await connector.sendCDPMessage(clientId, sessionId, 'UITree.enable');
  } catch {
    signal?.throwIfAborted();
    return;
  }
  signal?.throwIfAborted();

  // UITree responses can be large platform-reflection objects. Lynx runtimes
  // serialize this UI-thread method, so keep the handful of visible fields in
  // order instead of multiplexing responses and losing later values.
  for (const ref of editableRefs) {
    let info: UiNodeInfo;
    try {
      info = await connector.sendCDPMessage<UiNodeInfo, { UINodeId: number }>(
        clientId,
        sessionId,
        'UITree.getUIInfoForNode',
        { UINodeId: ref.nodeId },
      );
    } catch {
      signal?.throwIfAborted();
      continue;
    }
    signal?.throwIfAborted();
    const value = firstStringProperty(
      [info.readonlyProps, info.ui?.readonlyProps, info.view?.readonlyProps],
      ['value', 'text', 'mText', 'mSpannable', 'mTransformed'],
    );
    if (value === undefined) continue;
    ref.attributes = { ...ref.attributes, value };
    ref.text = (value || ref.attributes['placeholder'] || ref.text).slice(
      0,
      80,
    );
  }
}

/** Filter refs while preserving a valid compact tree among the retained nodes. */
export function filterSnapshotRefs(
  refs: readonly SnapshotRef[],
  predicate: (ref: SnapshotRef) => boolean,
): SnapshotRef[] {
  const refsByLabel = new Map(refs.map((ref) => [ref.ref, ref]));
  const retained = refs.filter(predicate);
  const retainedLabels = new Set(retained.map((ref) => ref.ref));

  return retained.map((ref) => {
    let parentRef = ref.parentRef;
    const visited = new Set<string>();
    while (parentRef !== undefined && !retainedLabels.has(parentRef)) {
      if (visited.has(parentRef)) {
        parentRef = undefined;
        break;
      }
      visited.add(parentRef);
      parentRef = refsByLabel.get(parentRef)?.parentRef;
    }

    if (parentRef === ref.parentRef) return ref;
    const reparented = { ...ref };
    if (parentRef === undefined) delete reparented.parentRef;
    else reparented.parentRef = parentRef;
    return reparented;
  });
}

/** Fetch the DOM-derived structure for one Lynx session without live-node enrichment. */
export async function buildSnapshotStructure(
  connector: Connector,
  clientId: string,
  sessionId: number,
  signal?: AbortSignal,
): Promise<SnapshotResult> {
  signal?.throwIfAborted();
  await connector.sendCDPMessage<unknown, { useCompression: boolean }>(
    clientId,
    sessionId,
    'DOM.enable',
    { useCompression: false },
  );
  signal?.throwIfAborted();
  const result = await connector.sendCDPMessage<{
    root: DomNode | string;
    compress?: boolean;
  }>(clientId, sessionId, 'DOM.getDocumentWithBoxModel');
  signal?.throwIfAborted();

  if (typeof result.root === 'string') {
    throw new Error(
      'DOM.getDocumentWithBoxModel returned a compressed tree. Retry after DOM.enable with useCompression:false.',
    );
  }

  const viewport = deriveViewport(result.root);
  const refs = buildRefs(result.root, viewport);
  return { viewport, refs };
}

/** Enrich a captured snapshot in place so its structure and live metadata stay from one DOM read. */
export async function enrichSnapshot(
  connector: Connector,
  clientId: string,
  sessionId: number,
  snapshot: SnapshotResult,
  signal?: AbortSignal,
): Promise<SnapshotResult> {
  await refinePaintVisibility(
    connector,
    clientId,
    sessionId,
    snapshot.refs,
    signal,
  );
  await enrichEditableValues(
    connector,
    clientId,
    sessionId,
    snapshot.refs,
    signal,
  );
  return snapshot;
}

/** Fetch a structured snapshot of interactive elements for one Lynx session. */
export async function buildSnapshot(
  connector: Connector,
  clientId: string,
  sessionId: number,
  signal?: AbortSignal,
): Promise<SnapshotResult> {
  const snapshot = await buildSnapshotStructure(
    connector,
    clientId,
    sessionId,
    signal,
  );
  return enrichSnapshot(connector, clientId, sessionId, snapshot, signal);
}
