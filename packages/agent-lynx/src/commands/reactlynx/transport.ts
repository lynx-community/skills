// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';
import type { Connector } from '@lynx-js/devtool-connector';
import { createDebug } from 'obug';
import { readUntilIdle } from '../utils.ts';
import {
  applyOperationV2,
  applyRootOrder,
  createRendererState,
  type RendererState,
} from './protocol.ts';

const debug = createDebug('devtool-mcp-server:reactlynx');

const PREACT_EVENT = 'PreactDevtools';
const SOURCE_PAGE_HOOK = 'preact-page-hook';
const SOURCE_DEVTOOLS_TO_CLIENT = 'preact-devtools-to-client';

export const DEFAULT_IDLE_MS = 700;
export const DEFAULT_MAX_MS = 5_000;

export interface PreactEnvelope<T = unknown> {
  source: string;
  type: string;
  data: T;
}

interface LynxOnVMEventParams {
  vmType?: string;
  event?: string;
  data?: string;
}

interface OutboundCDPFrame {
  method: string;
  params: { vmType: string; event: string; data: string };
}

export function buildOutboundFrame<T = null>(
  type: string,
  data?: T,
): OutboundCDPFrame {
  return {
    method: 'Lynx.sendVMEvent',
    params: {
      vmType: 'JSContext',
      event: PREACT_EVENT,
      data: JSON.stringify({
        source: SOURCE_DEVTOOLS_TO_CLIENT,
        type,
        data: data ?? null,
      } satisfies PreactEnvelope<T | null>),
    },
  };
}

export interface SessionResult {
  state: RendererState;
  framesSeen: number;
  operationFrames: number;
  rootOrderFrames: number;
  envelopeTypes: Set<string>;
}

export type EnvelopeAction = 'continue' | 'stop';

export interface RunSessionOptions {
  connector: Connector;
  clientId: string;
  sessionId: number;
  outbound: OutboundCDPFrame[];
  sendInit?: boolean;
  onEnvelope?: (envelope: PreactEnvelope) => EnvelopeAction;
  idleMs?: number;
  maxMs?: number;
  signal?: AbortSignal;
}

export async function runReactLynxSession(
  options: RunSessionOptions,
): Promise<SessionResult> {
  const {
    connector,
    clientId,
    sessionId,
    outbound,
    sendInit = true,
    onEnvelope = () => 'continue',
    idleMs = DEFAULT_IDLE_MS,
    maxMs = DEFAULT_MAX_MS,
    signal,
  } = options;

  let stopRequested = false;
  let cancelInput: () => void = () => {};
  const input = new ReadableStream<OutboundCDPFrame>({
    start(controller) {
      if (sendInit) controller.enqueue(buildOutboundFrame('init'));
      for (const frame of outbound) controller.enqueue(frame);
      cancelInput = () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
    },
  });

  await using stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    input as unknown as ReadableStream<{ method: string; params?: unknown }>,
    signal ? { signal } : undefined,
  );

  const state = createRendererState();
  let framesSeen = 0;
  let operationFrames = 0;
  let rootOrderFrames = 0;
  const envelopeTypes = new Set<string>();

  try {
    for await (const value of readUntilIdle(
      stream as unknown as ReadableStream<unknown>,
      { idleMs, maxMs },
    )) {
      if (typeof value !== 'object' || value === null) continue;

      const method = (value as { method?: string }).method;
      if (method !== 'Lynx.onVMEvent') continue;
      const params = (value as { params?: LynxOnVMEventParams }).params ?? {};
      if (params.event !== PREACT_EVENT) continue;

      let envelope: PreactEnvelope;
      try {
        envelope = JSON.parse(params.data ?? 'null') as PreactEnvelope;
      } catch {
        continue;
      }
      if (envelope.source !== SOURCE_PAGE_HOOK) continue;

      framesSeen += 1;
      envelopeTypes.add(envelope.type);
      debug(
        'frame %d: type=%s dataSize=%s',
        framesSeen,
        envelope.type,
        Array.isArray(envelope.data)
          ? envelope.data.length
          : typeof envelope.data,
      );

      switch (envelope.type) {
        case 'operation_v2':
          if (Array.isArray(envelope.data)) {
            operationFrames += 1;
            applyOperationV2(state, envelope.data as number[]);
          }
          break;
        case 'root-order':
          if (Array.isArray(envelope.data)) {
            rootOrderFrames += 1;
            applyRootOrder(state, envelope.data as number[]);
          }
          break;
      }

      if (onEnvelope(envelope) === 'stop') {
        stopRequested = true;
        break;
      }
    }
  } finally {
    cancelInput();
  }

  debug(
    'session done: stop=%s frames=%d op=%d root=%d types=%o',
    stopRequested,
    framesSeen,
    operationFrames,
    rootOrderFrames,
    [...envelopeTypes],
  );

  return { state, framesSeen, operationFrames, rootOrderFrames, envelopeTypes };
}

export function emptyTreeDiagnostic(result: SessionResult): string {
  if (result.framesSeen === 0) {
    return (
      'saw 0 frames -- the App is silent on the PreactDevtools channel. ' +
      'Most likely `@lynx-js/preact-devtools` is not installed, the bundle is a production build ' +
      '(`setupReactLynx()` is stripped from `react-lynx/index.ts:3`), or `setupReactLynx()` has not run yet. ' +
      'Look for `[PREACT DEVTOOLS] Devtools initialized successfully` in the device console.'
    );
  }
  if (result.operationFrames === 0) {
    return (
      `saw ${result.framesSeen} frame(s) but no \`operation_v2\` -- ` +
      '`@lynx-js/preact-devtools` is loaded but does not honor `refresh`. ' +
      'Upgrade to a build that includes the PR #2 (`document.body`) and PR #5 (`preactDevtoolsCtx.Node`) fixes from `lynx-family/preact-devtools`.'
    );
  }
  return (
    `saw ${result.framesSeen} frame(s) including ${result.operationFrames} \`operation_v2\` ` +
    'but the resulting tree is empty (every node was unmounted). ' +
    "This is unusual -- rerun with `DEBUG=devtool-mcp-server:reactlynx` to inspect each frame's payload."
  );
}
