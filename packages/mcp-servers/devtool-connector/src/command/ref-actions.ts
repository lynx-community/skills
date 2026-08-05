// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { setTimeout as delay } from 'node:timers/promises';
import type { Connector } from '../index.ts';
import { type CommandFailure, fail } from './result.ts';
import {
  type Point,
  SNAPSHOT_REF_HIT_NODE_IDS,
  type SnapshotRef,
} from './snapshot.ts';

export type RefFailureReason =
  | 'no-snapshot'
  | 'ref-not-found'
  | 'stale-ref'
  | 'not-visible'
  | 'covered'
  | 'offscreen'
  | 'disabled'
  | 'not-editable';

export function normalizeRef(ref: string): string {
  return ref.startsWith('@') ? ref : `@${ref}`;
}

function reasonResult(
  action: string,
  reason: RefFailureReason,
  message: string,
  nextActions: string[],
): CommandFailure {
  return fail(action, message, { reason, recoverable: true, nextActions });
}

export type RefValidationResult = CommandFailure | { ok: true; nodeId: number };

interface LocatedNode {
  nodeId?: number;
  backendNodeId?: number;
}

async function resolveBackendNodeId(
  connector: Connector,
  clientId: string,
  sessionId: number,
  backendNodeId: number,
  signal?: AbortSignal,
): Promise<number | undefined> {
  try {
    const result = await connector.sendCDPMessage<
      { nodeIds?: number[] },
      { backendNodeIds: number[] }
    >(clientId, sessionId, 'DOM.pushNodesByBackendIdsToFrontend', {
      backendNodeIds: [backendNodeId],
    });
    signal?.throwIfAborted();
    const nodeId = result.nodeIds?.[0];
    return nodeId !== undefined && nodeId !== 0 ? nodeId : undefined;
  } catch {
    signal?.throwIfAborted();
    return undefined;
  }
}

/** Validate cached geometry against the live hit target before mutating the page. */
export async function validateRef(
  action: string,
  connector: Connector,
  clientId: string,
  sessionId: number,
  ref: SnapshotRef,
  options: { requireEditable?: boolean } = {},
  signal?: AbortSignal,
): Promise<RefValidationResult> {
  signal?.throwIfAborted();
  if (ref.flags.offscreen) {
    return reasonResult(
      action,
      'offscreen',
      `Ref ${ref.ref} is offscreen; scroll it into view first.`,
      [`agent-lynx scroll ${ref.ref} --direction down`, 'agent-lynx snapshot'],
    );
  }
  if (ref.flags.disabled) {
    return reasonResult(action, 'disabled', `Ref ${ref.ref} is disabled.`, [
      'agent-lynx snapshot',
    ]);
  }
  if (options.requireEditable && !ref.flags.editable) {
    return reasonResult(
      action,
      'not-editable',
      `Ref ${ref.ref} (${ref.tag}) is not an editable field.`,
      ['agent-lynx snapshot'],
    );
  }

  const located = await connector.sendCDPMessage<LocatedNode, Point>(
    clientId,
    sessionId,
    'DOM.getNodeForLocation',
    { x: ref.center.x, y: ref.center.y },
  );
  signal?.throwIfAborted();
  if (
    !located ||
    ((located.nodeId === undefined || located.nodeId === 0) &&
      (located.backendNodeId === undefined || located.backendNodeId === 0))
  ) {
    return reasonResult(
      action,
      'stale-ref',
      `Ref ${ref.ref} no longer resolves to a node.`,
      ['agent-lynx snapshot'],
    );
  }

  let locatedNodeId =
    located.nodeId !== undefined && located.nodeId !== 0
      ? located.nodeId
      : undefined;
  if (
    locatedNodeId === undefined &&
    located.backendNodeId !== undefined &&
    located.backendNodeId !== 0
  ) {
    locatedNodeId = await resolveBackendNodeId(
      connector,
      clientId,
      sessionId,
      located.backendNodeId,
      signal,
    );
  }
  const backendMatches =
    located.backendNodeId !== undefined &&
    located.backendNodeId !== 0 &&
    located.backendNodeId === ref.backendNodeId;
  const frontendMatches =
    locatedNodeId !== undefined &&
    (locatedNodeId === ref.nodeId ||
      ref[SNAPSHOT_REF_HIT_NODE_IDS]?.has(locatedNodeId) === true);
  if (!backendMatches && !frontendMatches) {
    return reasonResult(
      action,
      'covered',
      `Ref ${ref.ref} is covered: (${ref.center.x},${ref.center.y}) hit node ${
        locatedNodeId ?? `backend:${located.backendNodeId}`
      }, expected ${ref.nodeId}.`,
      ['agent-lynx snapshot'],
    );
  }
  if (!ref.flags.visible) {
    return reasonResult(
      action,
      'not-visible',
      `Ref ${ref.ref} is not visible.`,
      ['agent-lynx snapshot'],
    );
  }

  let liveNodeId =
    locatedNodeId === ref.nodeId || backendMatches ? locatedNodeId : undefined;
  if (
    liveNodeId === undefined &&
    options.requireEditable &&
    ref.backendNodeId !== undefined
  ) {
    liveNodeId = await resolveBackendNodeId(
      connector,
      clientId,
      sessionId,
      ref.backendNodeId,
      signal,
    );
  }
  if (options.requireEditable && liveNodeId === undefined) {
    return reasonResult(
      action,
      'stale-ref',
      `Ref ${ref.ref} no longer resolves to a live editable node.`,
      ['agent-lynx snapshot'],
    );
  }
  return { ok: true, nodeId: liveNodeId ?? ref.nodeId };
}

interface RuntimeEvaluateResult {
  result?: {
    value?: unknown;
  };
  exceptionDetails?: unknown;
}

function selectEditableTextExpression(
  nodeId: number,
  selectionEnd: number,
): string {
  const select =
    `(()=>{if(!lynx||typeof lynx.createSelectorQuery!=="function")return false;` +
    `const query=lynx.createSelectorQuery();` +
    `if(!query||typeof query.selectUniqueID!=="function")return false;` +
    `query.selectUniqueID(${nodeId}).invoke({method:"setSelectionRange",params:{selectionStart:0,selectionEnd:${selectionEnd}}}).exec();` +
    `return true})()`;
  return (
    `(function(){var __a=globalThis.multiApps&&globalThis.multiApps[globalThis.currentDebugAppId||globalThis.currentAppId];` +
    `var lynx=__a&&__a.lynx;return(${select});})()`
  );
}

async function selectEditableText(
  connector: Connector,
  clientId: string,
  sessionId: number,
  nodeId: number,
  selectionEnd: number,
  signal: AbortSignal,
): Promise<void> {
  const result = await connector.sendCDPMessage<
    RuntimeEvaluateResult,
    Record<string, unknown>
  >(clientId, sessionId, 'Runtime.evaluate', {
    expression: selectEditableTextExpression(nodeId, selectionEnd),
    returnByValue: true,
  });
  signal.throwIfAborted();
  if (result.exceptionDetails !== undefined || result.result?.value !== true) {
    throw new Error(
      `Unable to select the existing value for editable node ${nodeId}.`,
    );
  }

  // SelectorQuery dispatches the UI method asynchronously. Give the UI thread
  // one frame to apply the range before Input.insertText commits replacement
  // text through the already-focused native editor.
  await delay(50, undefined, { signal });
}

interface TouchEvent {
  type: 'mousePressed' | 'mouseReleased' | 'mouseMoved';
  x: number;
  y: number;
  timestamp: number;
  button: 'left';
  clickCount: number;
}

async function sendTouch(
  connector: Connector,
  clientId: string,
  sessionId: number,
  event: TouchEvent,
): Promise<void> {
  await connector.sendCDPMessage<unknown, Record<string, unknown>>(
    clientId,
    sessionId,
    'Input.emulateTouchFromMouseEvent',
    { ...event },
  );
}

async function withPressedTouch(
  connector: Connector,
  clientId: string,
  sessionId: number,
  pressPoint: Point,
  releasePoint: Point,
  signal: AbortSignal,
  operation: () => Promise<void>,
): Promise<void> {
  signal.throwIfAborted();
  let failed = false;
  let failure: unknown;
  try {
    await sendTouch(connector, clientId, sessionId, {
      type: 'mousePressed',
      x: pressPoint.x,
      y: pressPoint.y,
      timestamp: Date.now(),
      button: 'left',
      clickCount: 1,
    });
    signal.throwIfAborted();
    await operation();
  } catch (error) {
    failed = true;
    failure = error;
  }

  try {
    await sendTouch(connector, clientId, sessionId, {
      type: 'mouseReleased',
      x: releasePoint.x,
      y: releasePoint.y,
      timestamp: Date.now(),
      button: 'left',
      clickCount: 1,
    });
  } catch (error) {
    if (!failed) {
      failed = true;
      failure = error;
    }
  }

  if (failed) throw failure;
}

export async function touchTap(
  connector: Connector,
  clientId: string,
  sessionId: number,
  point: Point,
  signal: AbortSignal,
): Promise<void> {
  await withPressedTouch(
    connector,
    clientId,
    sessionId,
    point,
    point,
    signal,
    async () => {
      signal.throwIfAborted();
    },
  );
}

export async function touchLongPress(
  connector: Connector,
  clientId: string,
  sessionId: number,
  point: Point,
  durationMs: number,
  signal: AbortSignal,
): Promise<void> {
  await withPressedTouch(
    connector,
    clientId,
    sessionId,
    point,
    point,
    signal,
    async () => {
      await delay(durationMs, undefined, { signal });
    },
  );
}

export async function touchSwipe(
  connector: Connector,
  clientId: string,
  sessionId: number,
  from: Point,
  to: Point,
  signal: AbortSignal,
  steps = 8,
): Promise<void> {
  await withPressedTouch(
    connector,
    clientId,
    sessionId,
    from,
    to,
    signal,
    async () => {
      for (let i = 1; i <= steps; i++) {
        signal.throwIfAborted();
        const progress = i / steps;
        await sendTouch(connector, clientId, sessionId, {
          type: 'mouseMoved',
          x: Math.round(from.x + (to.x - from.x) * progress),
          y: Math.round(from.y + (to.y - from.y) * progress),
          timestamp: Date.now(),
          button: 'left',
          clickCount: 1,
        });
        await delay(16, undefined, { signal });
      }
    },
  );
}

export async function setValue(
  connector: Connector,
  clientId: string,
  sessionId: number,
  nodeId: number,
  value: string,
  signal: AbortSignal,
  currentValue?: string,
): Promise<void> {
  signal.throwIfAborted();
  await connector.sendCDPMessage<unknown, { nodeId: number }>(
    clientId,
    sessionId,
    'DOM.focus',
    { nodeId },
  );
  signal.throwIfAborted();
  if (currentValue !== undefined && currentValue.length > 0) {
    await selectEditableText(
      connector,
      clientId,
      sessionId,
      nodeId,
      currentValue.length,
      signal,
    );
  }
  await connector.sendCDPMessage<unknown, { text: string }>(
    clientId,
    sessionId,
    'Input.insertText',
    { text: value },
  );
  signal.throwIfAborted();
}
