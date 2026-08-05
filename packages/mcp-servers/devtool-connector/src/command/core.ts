// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { setTimeout as delay } from 'node:timers/promises';
import type { Connector } from '../index.ts';
import type {
  CommandAction,
  CommandData,
  CommandObject,
  CommandParams,
  SnapshotAfterResult,
  SnapshotRefreshError,
  StreamCommandEvent,
} from './contract.ts';
import {
  ReactLynxActionError,
  type ReactLynxCacheSnapshot,
  ReactLynxController,
} from './reactlynx/controller.ts';
import { parseReactLynxLinkRef } from './reactlynx/model.ts';
import type { ReactLynxUpdateKind } from './reactlynx/types.ts';
import {
  normalizeRef,
  setValue,
  touchLongPress,
  touchSwipe,
  touchTap,
  validateRef,
} from './ref-actions.ts';
import { type CommandResult, fail, ok } from './result.ts';
import {
  captureScreenshotFrame,
  type ScreencastFrameMetadata,
  ScreenshotTimeoutError,
} from './screenshot.ts';
import {
  annotateScreenshot,
  ScreenshotAnnotationError,
} from './screenshot-annotation.ts';
import {
  type Box,
  buildSnapshot,
  buildSnapshotStructure,
  enrichSnapshot,
  filterSnapshotRefs,
  type Point,
  type SnapshotRef,
} from './snapshot.ts';
import { resolveSessionTarget } from './targets.ts';

interface SnapshotEntry {
  createdAt: number;
  viewport: Box | undefined;
  refs: SnapshotRef[];
}

export interface ActionContext {
  connector: Connector;
}

export type ActionHandlerResult<Action extends CommandAction> = CommandResult<
  CommandData<Action>
>;

type Handler<Action extends CommandAction> = (
  params: CommandParams<Action> & CommandObject,
  ctx: ActionContext,
  signal: AbortSignal,
) => Promise<ActionHandlerResult<Action>>;

interface RegisteredHandler {
  handler: (
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ) => Promise<CommandResult>;
}

type Direction = 'up' | 'down' | 'left' | 'right';

function str(params: CommandObject, key: string): string | undefined {
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
}

function screencastFrameBounds(
  metadata: ScreencastFrameMetadata | undefined,
): Box | undefined {
  const width = metadata?.deviceWidth;
  const height = metadata?.deviceHeight;
  if (
    typeof width !== 'number' ||
    !Number.isFinite(width) ||
    width <= 0 ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return undefined;
  }
  return { x: 0, y: 0, width, height };
}

function num(params: CommandObject, key: string): number | undefined {
  const value = params[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function bool(params: CommandObject, key: string): boolean | undefined {
  const value = params[key];
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

function strList(params: CommandObject, key: string): string[] | undefined {
  const value = params[key];
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string')
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return undefined;
}

function invalidNumber(params: CommandObject, key: string): boolean {
  return Object.hasOwn(params, key) && num(params, key) === undefined;
}

function invalidBoolean(params: CommandObject, key: string): boolean {
  return Object.hasOwn(params, key) && bool(params, key) === undefined;
}

function isUnsupportedCdpMethod(error: unknown): boolean {
  if (
    !(error instanceof Error) ||
    typeof error.cause !== 'object' ||
    error.cause === null
  )
    return false;
  const response = error.cause as { error?: { code?: unknown } };
  return response.error?.code === -32601;
}

function sameSnapshotNode(left: SnapshotRef, right: SnapshotRef): boolean {
  if (left.backendNodeId !== undefined && right.backendNodeId !== undefined) {
    return left.backendNodeId === right.backendNodeId;
  }
  return left.nodeId === right.nodeId;
}

const WAIT_DEADLINE = Symbol('waitDeadline');

async function runBeforeDeadline<T>(
  deadline: number,
  signal: AbortSignal,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T | typeof WAIT_DEADLINE> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) return WAIT_DEADLINE;

  const operationController = new AbortController();
  const timerController = new AbortController();
  const operationSignal = AbortSignal.any([signal, operationController.signal]);
  const timerSignal = AbortSignal.any([signal, timerController.signal]);
  const operationPromise = operation(operationSignal);
  const timeoutPromise = delay(remaining, WAIT_DEADLINE, {
    signal: timerSignal,
  });
  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    operationController.abort(new Error('Wait deadline elapsed.'));
    timerController.abort();
    await timeoutPromise.catch(() => {});
  }
}

/** Finger movement is opposite to the direction in which content moves. */
function gestureBox(box: Box, viewport: Box | undefined): Box {
  if (!viewport) return box;
  const x = Math.max(box.x, viewport.x);
  const y = Math.max(box.y, viewport.y);
  const right = Math.min(box.x + box.width, viewport.x + viewport.width);
  const bottom = Math.min(box.y + box.height, viewport.y + viewport.height);
  return right > x && bottom > y
    ? { x, y, width: right - x, height: bottom - y }
    : box;
}

function gestureAxis(
  start: number,
  size: number,
): { min: number; max: number } {
  const rawMin = Math.ceil(start);
  const rawMax = Math.max(rawMin, Math.ceil(start + size) - 1);
  const inset = rawMax - rawMin >= 4 ? 1 : 0;
  return { min: rawMin + inset, max: rawMax - inset };
}

function swipeForDirection(
  box: Box,
  direction: Direction,
  viewport?: Box,
): { from: Point; to: Point } {
  const visibleBox = gestureBox(box, viewport);
  const x = gestureAxis(visibleBox.x, visibleBox.width);
  const y = gestureAxis(visibleBox.y, visibleBox.height);
  const centerX = Math.round((x.min + x.max) / 2);
  const centerY = Math.round((y.min + y.max) / 2);
  const edgeLaneX = Math.round(x.min + (x.max - x.min) * 0.05);
  const edgeLaneY = Math.round(y.min + (y.max - y.min) * 0.05);
  const deltaX = Math.max(1, Math.round((x.max - x.min) * 0.3));
  const deltaY = Math.max(1, Math.round((y.max - y.min) * 0.3));
  switch (direction) {
    case 'down':
      return {
        from: { x: edgeLaneX, y: centerY + deltaY },
        to: { x: edgeLaneX, y: centerY - deltaY },
      };
    case 'up':
      return {
        from: { x: edgeLaneX, y: centerY - deltaY },
        to: { x: edgeLaneX, y: centerY + deltaY },
      };
    case 'left':
      return {
        from: { x: centerX + deltaX, y: edgeLaneY },
        to: { x: centerX - deltaX, y: edgeLaneY },
      };
    case 'right':
      return {
        from: { x: centerX - deltaX, y: edgeLaneY },
        to: { x: centerX + deltaX, y: edgeLaneY },
      };
  }
}

/**
 * Daemon-owned action layer. In-memory DOM and ReactLynx caches deliberately
 * live here so refs survive across independent CLI runs.
 */
export class ActionCore {
  #snapshots = new Map<string, SnapshotEntry>();
  #reactLynx = new ReactLynxController();
  #handlers = new Map<CommandAction, RegisteredHandler>();

  constructor() {
    this.#register('snapshot', (params, ctx, signal) =>
      this.#snapshot(params, ctx, signal),
    );
    this.#register('screenshot', (params, ctx, signal) =>
      this.#screenshot(params, ctx, signal),
    );
    this.#register('tap', (params, ctx, signal) =>
      this.#tap(params, ctx, signal),
    );
    this.#register('long-press', (params, ctx, signal) =>
      this.#longPress(params, ctx, signal),
    );
    this.#register('fill', (params, ctx, signal) =>
      this.#fill(params, ctx, signal),
    );
    this.#register('clear', (params, ctx, signal) =>
      this.#clear(params, ctx, signal),
    );
    this.#register('scroll', (params, ctx, signal) =>
      this.#scroll(params, ctx, signal),
    );
    this.#register('get-text', (params, ctx, signal) =>
      this.#getText(params, ctx, signal),
    );
    this.#register('get-style', (params, ctx, signal) =>
      this.#getStyle(params, ctx, signal),
    );
    this.#register('wait', (params, ctx, signal) =>
      this.#wait(params, ctx, signal),
    );
    this.#register('reactlynx-tree', (params, ctx, signal) =>
      this.#reactLynxTree(params, ctx, signal),
    );
    this.#register('reactlynx-find', (params, ctx, signal) =>
      this.#reactLynxFind(params, ctx, signal),
    );
    this.#register('reactlynx-component', (params, ctx, signal) =>
      this.#reactLynxComponent(params, ctx, signal),
    );
    this.#register('reactlynx-link', (params, ctx, signal) =>
      this.#reactLynxLink(params, ctx, signal),
    );
    this.#register('reactlynx-update-prop', (params, ctx, signal) =>
      this.#reactLynxUpdate(
        'reactlynx-update-prop',
        'update-prop',
        params,
        ctx,
        signal,
      ),
    );
    this.#register('reactlynx-update-state', (params, ctx, signal) =>
      this.#reactLynxUpdate(
        'reactlynx-update-state',
        'update-state',
        params,
        ctx,
        signal,
      ),
    );
    this.#register('reactlynx-update-context', (params, ctx, signal) =>
      this.#reactLynxUpdate(
        'reactlynx-update-context',
        'update-context',
        params,
        ctx,
        signal,
      ),
    );
  }

  has(action: string): boolean {
    return this.#handlers.has(action as CommandAction);
  }

  /** `wait` is the only phase-one action with progressive SSE events. */
  hasStream(action: string): boolean {
    return action === 'wait';
  }

  actions(): string[] {
    return [...this.#handlers.keys()].sort();
  }

  streamActions(): string[] {
    return ['wait'];
  }

  async execute(
    action: string,
    params: CommandObject,
    ctx: ActionContext,
    signal?: AbortSignal,
  ): Promise<CommandResult> {
    const registration = this.#handlers.get(action as CommandAction);
    if (!registration) {
      return fail(action, `Unknown command action: ${action}`, {
        reason: 'unknown-action',
        nextActions: this.actions().map((name) => `POST /command/${name}`),
      });
    }

    const actionSignal = signal ?? new AbortController().signal;
    try {
      actionSignal.throwIfAborted();
      const target = await resolveSessionTarget(action, params, ctx.connector);
      if (!target.ok) return target.result;
      if (
        ['tap', 'long-press', 'fill', 'clear', 'scroll'].includes(action) &&
        invalidBoolean(target.params, 'snapshotAfter')
      ) {
        return fail(action, 'snapshotAfter must be a boolean when provided.', {
          reason: 'bad-params',
        });
      }
      return await registration.handler(target.params, ctx, actionSignal);
    } catch (error) {
      if (actionSignal.aborted) {
        return fail(action, 'Command was aborted.', {
          cause: actionSignal.reason,
          reason: 'aborted',
          recoverable: true,
        });
      }
      if (error instanceof ReactLynxActionError) {
        return fail(action, error.message, {
          reason: error.reason,
          recoverable: error.recoverable,
          nextActions: error.nextActions,
        });
      }
      return fail(
        action,
        error instanceof Error ? error.message : String(error),
        {
          cause: error,
          recoverable: true,
          nextActions: ['agent-lynx list-clients', 'agent-lynx list-sessions'],
        },
      );
    }
  }

  async *stream(
    action: string,
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): AsyncGenerator<CommandResult<StreamCommandEvent<'wait'>>> {
    if (!this.hasStream(action)) {
      yield fail(action, `Unknown stream action: ${action}`, {
        reason: 'unknown-action',
        nextActions: this.streamActions().map((name) => `GET /command/${name}`),
      });
      return;
    }

    try {
      signal.throwIfAborted();
      const target = await resolveSessionTarget(action, params, ctx.connector);
      if (!target.ok) {
        yield target.result;
        return;
      }
      yield* this.#waitStream(target.params, ctx, signal, true);
    } catch (error) {
      if (signal.aborted) return;
      yield fail(
        action,
        error instanceof Error ? error.message : String(error),
        {
          cause: error,
          recoverable: true,
        },
      );
    }
  }

  #register<Action extends CommandAction>(
    action: Action,
    handler: Handler<Action>,
  ): void {
    this.#handlers.set(action, {
      handler: handler as RegisteredHandler['handler'],
    });
  }

  #key(clientId: string, sessionId: number): string {
    return `${clientId}:${sessionId}`;
  }

  getSnapshot(clientId: string, sessionId: number): SnapshotEntry | undefined {
    return this.#snapshots.get(this.#key(clientId, sessionId));
  }

  getReactLynxCache(
    clientId: string,
    sessionId: number,
  ): ReactLynxCacheSnapshot | undefined {
    return this.#reactLynx.getCache(clientId, sessionId);
  }

  async #reactLynxTree(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'reactlynx-tree'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    if (!clientId || sessionId === undefined) {
      return fail('reactlynx-tree', 'clientId and sessionId are required.', {
        reason: 'bad-params',
      });
    }
    if (invalidBoolean(params, 'showShells')) {
      return fail(
        'reactlynx-tree',
        'showShells must be a boolean when provided.',
        { reason: 'bad-params' },
      );
    }
    const depth = num(params, 'depth');
    if (
      (Object.hasOwn(params, 'depth') && depth === undefined) ||
      (depth !== undefined && (!Number.isInteger(depth) || depth < 1))
    ) {
      return fail(
        'reactlynx-tree',
        'depth must be a positive integer when provided.',
        { reason: 'bad-params' },
      );
    }
    const data = await this.#reactLynx.tree(
      ctx.connector,
      { clientId, sessionId },
      {
        ...(depth === undefined ? {} : { depth }),
        showShells: bool(params, 'showShells') === true,
      },
      signal,
    );
    return ok('reactlynx-tree', data);
  }

  async #reactLynxFind(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'reactlynx-find'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const pattern = params['pattern'];
    if (!clientId || sessionId === undefined || typeof pattern !== 'string') {
      return fail(
        'reactlynx-find',
        'clientId, sessionId, and a string pattern are required.',
        {
          reason: 'bad-params',
        },
      );
    }
    for (const key of ['regex', 'showShells', 'refresh'] as const) {
      if (invalidBoolean(params, key)) {
        return fail(
          'reactlynx-find',
          `${key} must be a boolean when provided.`,
          { reason: 'bad-params' },
        );
      }
    }
    const parsedLimit = num(params, 'limit');
    if (Object.hasOwn(params, 'limit') && parsedLimit === undefined) {
      return fail(
        'reactlynx-find',
        'limit must be a positive integer when provided.',
        { reason: 'bad-params' },
      );
    }
    const limit = parsedLimit ?? 50;
    if (!Number.isInteger(limit) || limit < 1) {
      return fail(
        'reactlynx-find',
        'limit must be a positive integer when provided.',
        { reason: 'bad-params' },
      );
    }
    const data = await this.#reactLynx.find(
      ctx.connector,
      { clientId, sessionId },
      {
        pattern,
        regex: bool(params, 'regex') === true,
        showShells: bool(params, 'showShells') === true,
        limit,
        refresh: bool(params, 'refresh') === true,
      },
      signal,
    );
    return ok('reactlynx-find', data);
  }

  async #reactLynxComponent(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'reactlynx-component'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const ref = str(params, 'ref')?.trim();
    if (!clientId || sessionId === undefined || !ref) {
      return fail(
        'reactlynx-component',
        'clientId, sessionId, and a non-empty ref are required.',
        {
          reason: 'bad-params',
        },
      );
    }
    for (const key of ['showShells', 'refresh'] as const) {
      if (invalidBoolean(params, key)) {
        return fail(
          'reactlynx-component',
          `${key} must be a boolean when provided.`,
          { reason: 'bad-params' },
        );
      }
    }
    const data = await this.#reactLynx.component(
      ctx.connector,
      { clientId, sessionId },
      {
        ref,
        showShells: bool(params, 'showShells') === true,
        refresh: bool(params, 'refresh') === true,
      },
      signal,
    );
    return ok('reactlynx-component', data);
  }

  async #reactLynxLink(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'reactlynx-link'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref')?.trim();
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail(
        'reactlynx-link',
        'clientId, sessionId, and a non-empty ref are required.',
        {
          reason: 'bad-params',
        },
      );
    }
    for (const key of ['showShells', 'refresh'] as const) {
      if (invalidBoolean(params, key)) {
        return fail(
          'reactlynx-link',
          `${key} must be a boolean when provided.`,
          { reason: 'bad-params' },
        );
      }
    }

    let ref: ReturnType<typeof parseReactLynxLinkRef>;
    try {
      ref = parseReactLynxLinkRef(rawRef);
    } catch (error) {
      return fail(
        'reactlynx-link',
        error instanceof Error ? error.message : String(error),
        {
          reason: 'bad-params',
        },
      );
    }
    const target = { clientId, sessionId };
    const showShells = bool(params, 'showShells') === true;
    const refresh = bool(params, 'refresh') === true;

    if (ref.kind === 'element') {
      const resolved = this.#resolveRef(
        'reactlynx-link',
        clientId,
        sessionId,
        ref.ref,
      );
      if ('ok' in resolved) return resolved;
      const mapping = await this.#reactLynx.componentForElement(
        ctx.connector,
        target,
        {
          uniqueId: resolved.ref.backendNodeId ?? resolved.ref.nodeId,
          showShells,
          refresh,
        },
        signal,
      );
      return ok('reactlynx-link', {
        ...target,
        cache: mapping.cache,
        direction: 'element-to-component',
        relation: 'nearest-component',
        element: resolved.ref,
        component: mapping.component,
      });
    }

    const snapshot = this.#snapshots.get(this.#key(clientId, sessionId));
    if (!snapshot) {
      return fail(
        'reactlynx-link',
        `No snapshot found for ${clientId} session ${sessionId}.`,
        {
          reason: 'no-snapshot',
          recoverable: true,
          nextActions: ['agent-lynx snapshot'],
        },
      );
    }
    const componentRef =
      ref.kind === 'component-label' ? `@c${ref.index}` : String(ref.id);
    const mapping = await this.#reactLynx.elementForComponent(
      ctx.connector,
      target,
      { ref: componentRef, showShells, refresh },
      signal,
    );
    const element = snapshot.refs.find(
      (candidate) =>
        (candidate.backendNodeId ?? candidate.nodeId) === mapping.uniqueId,
    );
    if (!element) {
      return fail(
        'reactlynx-link',
        `No snapshot ref matches host uniqueId ${mapping.uniqueId} for ${componentRef}. ` +
          'The DOM snapshot may be stale, filtered, or the host element may not be surfaced.',
        {
          reason: 'ref-not-found',
          recoverable: true,
          nextActions: ['Run `agent-lynx snapshot`, then retry the link.'],
        },
      );
    }
    return ok('reactlynx-link', {
      ...target,
      cache: mapping.cache,
      direction: 'component-to-element',
      relation: 'first-host-element',
      element,
      component: mapping.component,
    });
  }

  async #reactLynxUpdate(
    action:
      | 'reactlynx-update-prop'
      | 'reactlynx-update-state'
      | 'reactlynx-update-context',
    kind: ReactLynxUpdateKind,
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'reactlynx-update-prop'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const ref = str(params, 'ref')?.trim();
    const path = str(params, 'path');
    if (
      !clientId ||
      sessionId === undefined ||
      !ref ||
      path === undefined ||
      !Object.hasOwn(params, 'value')
    ) {
      return fail(
        action,
        'clientId, sessionId, ref, path, and value are required.',
        { reason: 'bad-params' },
      );
    }
    for (const key of ['showShells', 'refresh'] as const) {
      if (invalidBoolean(params, key)) {
        return fail(action, `${key} must be a boolean when provided.`, {
          reason: 'bad-params',
        });
      }
    }
    const data = await this.#reactLynx.update(
      ctx.connector,
      { clientId, sessionId },
      {
        kind,
        ref,
        path,
        value: params['value'],
        showShells: bool(params, 'showShells') === true,
        refresh: bool(params, 'refresh') === true,
      },
      signal,
    );
    return ok(action, data);
  }

  async #withSnapshotAfter<T extends Record<string, unknown>>(
    action: string,
    params: CommandObject,
    ctx: ActionContext,
    clientId: string,
    sessionId: number,
    data: T,
    signal: AbortSignal,
  ): Promise<CommandResult<T & SnapshotAfterResult>> {
    if (invalidBoolean(params, 'snapshotAfter')) {
      return fail(action, 'snapshotAfter must be a boolean when provided.', {
        reason: 'bad-params',
      });
    }
    if (bool(params, 'snapshotAfter') !== true) return ok(action, data);

    try {
      const { viewport, refs } = await buildSnapshot(
        ctx.connector,
        clientId,
        sessionId,
        signal,
      );
      this.#snapshots.set(this.#key(clientId, sessionId), {
        createdAt: Date.now(),
        viewport,
        refs,
      });
      return ok(action, {
        ...data,
        snapshot: { clientId, sessionId, viewport, refs },
      });
    } catch (error) {
      const snapshotError: SnapshotRefreshError = {
        message: error instanceof Error ? error.message : String(error),
        recoverable: true,
        nextActions: ['agent-lynx snapshot'],
      };
      if (error instanceof Error && error.cause !== undefined)
        snapshotError.cause = String(error.cause);
      return ok(action, { ...data, snapshotError });
    }
  }

  async #snapshot(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'snapshot'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    if (!clientId || sessionId === undefined) {
      return fail('snapshot', 'clientId and sessionId are required.', {
        reason: 'bad-params',
      });
    }

    if (invalidBoolean(params, 'visibleOnly')) {
      return fail('snapshot', 'visibleOnly must be a boolean when provided.', {
        reason: 'bad-params',
      });
    }
    const { viewport, refs: allRefs } = await buildSnapshot(
      ctx.connector,
      clientId,
      sessionId,
      signal,
    );
    const refs =
      bool(params, 'visibleOnly') === true
        ? filterSnapshotRefs(allRefs, (ref) => ref.flags.visible)
        : allRefs;
    this.#snapshots.set(this.#key(clientId, sessionId), {
      createdAt: Date.now(),
      viewport,
      refs,
    });
    return ok('snapshot', { clientId, sessionId, viewport, refs });
  }

  async #screenshot(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'screenshot'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    if (!clientId || sessionId === undefined) {
      return fail('screenshot', 'clientId and sessionId are required.', {
        reason: 'bad-params',
      });
    }
    if (
      invalidBoolean(params, 'fullscreen') ||
      invalidBoolean(params, 'annotate')
    ) {
      return fail(
        'screenshot',
        'fullscreen and annotate must be booleans when provided.',
        {
          reason: 'bad-params',
        },
      );
    }

    const fullscreen = bool(params, 'fullscreen') === true;
    const annotate = bool(params, 'annotate') === true;
    if (fullscreen && annotate) {
      return fail(
        'screenshot',
        '--fullscreen cannot be combined with --annotate.',
        {
          reason: 'unsupported-option',
          recoverable: true,
          nextActions: [
            'Remove --fullscreen to annotate the LynxView viewport.',
            'Use `agent-lynx take-screenshot --fullscreen` for an unannotated fullscreen image.',
          ],
        },
      );
    }

    try {
      const capturedFrame = await captureScreenshotFrame(
        ctx.connector,
        clientId,
        sessionId,
        {
          fullscreen,
          quality: annotate ? 100 : 80,
          signal,
        },
      );
      const jpegBase64 = capturedFrame.data;
      let snapshot: CommandData<'screenshot'>['snapshot'];
      let frameBounds: Box | undefined;
      if (annotate) {
        // Page.startScreencast is also the engine's coordinate-mode setter. Capture
        // first so the DOM snapshot below is guaranteed to use the same LynxView
        // mode as the image when no external client changes the process-global mode.
        frameBounds = screencastFrameBounds(capturedFrame.metadata);
        if (!frameBounds) {
          return fail(
            'screenshot',
            'The captured frame has no usable logical-size metadata for annotation.',
            {
              reason: 'invalid-screenshot',
              recoverable: true,
              nextActions: [
                'Retry with a Lynx runtime that provides Page.screencastFrame metadata.',
                'Use `agent-lynx screenshot` without --annotate for an unannotated image.',
              ],
            },
          );
        }
        const { viewport, refs } = await buildSnapshot(
          ctx.connector,
          clientId,
          sessionId,
          signal,
        );
        if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
          return fail(
            'screenshot',
            'The current snapshot has no usable viewport for screenshot annotation.',
            {
              reason: 'unsupported-target',
              recoverable: true,
              nextActions: [
                'Verify the target page exposes DOM box models, then retry.',
                'Use `agent-lynx take-screenshot` for an unannotated image.',
              ],
            },
          );
        }
        snapshot = { clientId, sessionId, viewport, refs };
        this.#snapshots.set(this.#key(clientId, sessionId), {
          createdAt: Date.now(),
          viewport,
          refs,
        });
      }
      let annotated: ReturnType<typeof annotateScreenshot> | undefined;
      if (snapshot?.viewport && frameBounds) {
        try {
          annotated = annotateScreenshot({
            jpeg: Buffer.from(jpegBase64, 'base64'),
            refs: snapshot.refs,
            frame: frameBounds,
            viewport: snapshot.viewport,
          });
        } catch (error) {
          if (!(error instanceof ScreenshotAnnotationError)) throw error;
          return fail('screenshot', error.message, {
            reason: 'invalid-screenshot',
            recoverable: true,
            nextActions: [
              'Retry the screenshot after refreshing the target page.',
            ],
          });
        }
      }
      return ok('screenshot', {
        clientId,
        sessionId,
        jpegBase64: annotated?.jpeg.toString('base64') ?? jpegBase64,
        ...(annotated
          ? { width: annotated.width, height: annotated.height }
          : {}),
        ...(snapshot ? { snapshot } : {}),
        ...(annotated ? { annotations: annotated.annotations } : {}),
      });
    } catch (error) {
      if (!(error instanceof ScreenshotTimeoutError)) throw error;
      return fail('screenshot', error.message, {
        reason: 'timeout',
        recoverable: true,
        nextActions: [
          'Verify the target app is foregrounded and rendering.',
          'Retry `agent-lynx screenshot` after opening or refreshing the page.',
        ],
      });
    }
  }

  #resolveRef(
    action: string,
    clientId: string,
    sessionId: number,
    rawRef: string,
  ): { ref: SnapshotRef; snapshot: SnapshotEntry } | CommandResult<never> {
    const refLabel = normalizeRef(rawRef);
    const snapshot = this.#snapshots.get(this.#key(clientId, sessionId));
    if (!snapshot) {
      return fail(
        action,
        `No snapshot found for ${clientId} session ${sessionId}.`,
        {
          reason: 'no-snapshot',
          recoverable: true,
          nextActions: ['agent-lynx snapshot'],
        },
      );
    }
    const ref = snapshot.refs.find((candidate) => candidate.ref === refLabel);
    if (!ref) {
      return fail(
        action,
        `Ref ${refLabel} was not found in the latest snapshot.`,
        {
          reason: 'ref-not-found',
          recoverable: true,
          nextActions: ['agent-lynx snapshot'],
        },
      );
    }
    return { ref, snapshot };
  }

  async #tap(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'tap'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail('tap', 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }

    const resolved = this.#resolveRef('tap', clientId, sessionId, rawRef);
    if ('ok' in resolved) return resolved;
    const validation = await validateRef(
      'tap',
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref,
      {},
      signal,
    );
    if (!validation.ok) return validation;

    await touchTap(
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref.center,
      signal,
    );
    return this.#withSnapshotAfter(
      'tap',
      params,
      ctx,
      clientId,
      sessionId,
      {
        clientId,
        sessionId,
        ref: resolved.ref.ref,
        point: resolved.ref.center,
      },
      signal,
    );
  }

  async #longPress(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'long-press'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    const duration = num(params, 'duration') ?? 600;
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail('long-press', 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }
    if (invalidNumber(params, 'duration')) {
      return fail(
        'long-press',
        'duration must be a finite number when provided.',
        { reason: 'bad-params' },
      );
    }
    if (duration < 0)
      return fail('long-press', 'duration must be non-negative.', {
        reason: 'bad-params',
      });

    const resolved = this.#resolveRef(
      'long-press',
      clientId,
      sessionId,
      rawRef,
    );
    if ('ok' in resolved) return resolved;
    const validation = await validateRef(
      'long-press',
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref,
      {},
      signal,
    );
    if (!validation.ok) return validation;

    await touchLongPress(
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref.center,
      duration,
      signal,
    );
    return this.#withSnapshotAfter(
      'long-press',
      params,
      ctx,
      clientId,
      sessionId,
      {
        clientId,
        sessionId,
        ref: resolved.ref.ref,
        point: resolved.ref.center,
        longPress: true,
      },
      signal,
    );
  }

  async #fillOrClear<Action extends 'fill' | 'clear'>(
    action: Action,
    params: CommandObject,
    ctx: ActionContext,
    value: string,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<Action>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail(action, 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }

    const resolved = this.#resolveRef(action, clientId, sessionId, rawRef);
    if ('ok' in resolved) return resolved;
    const validation = await validateRef(
      action,
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref,
      {
        requireEditable: true,
      },
      signal,
    );
    if (!validation.ok) return validation;

    await touchTap(
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref.center,
      signal,
    );
    await setValue(
      ctx.connector,
      clientId,
      sessionId,
      validation.nodeId,
      value,
      signal,
      resolved.ref.attributes['value'],
    );
    return this.#withSnapshotAfter(
      action,
      params,
      ctx,
      clientId,
      sessionId,
      {
        clientId,
        sessionId,
        ref: resolved.ref.ref,
        value,
      },
      signal,
    );
  }

  async #fill(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'fill'>> {
    const text = str(params, 'text');
    if (text === undefined)
      return fail('fill', 'text is required.', { reason: 'bad-params' });
    return this.#fillOrClear('fill', params, ctx, text, signal);
  }

  async #clear(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'clear'>> {
    return this.#fillOrClear('clear', params, ctx, '', signal);
  }

  async #scroll(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'scroll'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail('scroll', 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }
    const direction = (str(params, 'direction') ?? 'down') as Direction;
    if (!['up', 'down', 'left', 'right'].includes(direction)) {
      return fail(
        'scroll',
        `Invalid direction: ${direction}. Use up | down | left | right.`,
        {
          reason: 'bad-params',
        },
      );
    }

    const resolved = this.#resolveRef('scroll', clientId, sessionId, rawRef);
    if ('ok' in resolved) return resolved;
    const validation = await validateRef(
      'scroll',
      ctx.connector,
      clientId,
      sessionId,
      resolved.ref,
      {},
      signal,
    );
    if (!validation.ok) return validation;

    const { from, to } = swipeForDirection(
      resolved.ref.box,
      direction,
      resolved.snapshot.viewport,
    );
    await touchSwipe(ctx.connector, clientId, sessionId, from, to, signal, 30);
    return this.#withSnapshotAfter(
      'scroll',
      params,
      ctx,
      clientId,
      sessionId,
      {
        clientId,
        sessionId,
        ref: resolved.ref.ref,
        direction,
        from,
        to,
      },
      signal,
    );
  }

  async #getText(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'get-text'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail('get-text', 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }

    const resolved = this.#resolveRef('get-text', clientId, sessionId, rawRef);
    if ('ok' in resolved) return resolved;

    let text = resolved.ref.text;
    try {
      const result = await ctx.connector.sendCDPMessage<
        { rawTextValues?: Array<{ text: string }> },
        { nodeId: number }
      >(clientId, sessionId, 'DOM.innerText', { nodeId: resolved.ref.nodeId });
      signal.throwIfAborted();
      const liveText = (result.rawTextValues ?? [])
        .map((value) => value.text)
        .join(' ')
        .trim();
      if (liveText) text = liveText;
    } catch (error) {
      // Older runtimes do not support DOM.innerText; snapshot text is still useful.
      if (!isUnsupportedCdpMethod(error)) throw error;
    }
    return ok('get-text', { clientId, sessionId, ref: resolved.ref.ref, text });
  }

  async #getStyle(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'get-style'>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    const rawRef = str(params, 'ref');
    if (!clientId || sessionId === undefined || !rawRef) {
      return fail('get-style', 'clientId, sessionId and ref are required.', {
        reason: 'bad-params',
      });
    }
    const wanted = strList(params, 'property');
    const resolved = this.#resolveRef('get-style', clientId, sessionId, rawRef);
    if ('ok' in resolved) return resolved;

    const result = await ctx.connector.sendCDPMessage<
      { computedStyle?: Array<{ name: string; value: string }> },
      { nodeId: number }
    >(clientId, sessionId, 'CSS.getComputedStyleForNode', {
      nodeId: resolved.ref.nodeId,
    });
    signal.throwIfAborted();
    const style: Record<string, string> = {};
    for (const { name, value } of result.computedStyle ?? []) {
      if (!wanted || wanted.includes(name)) style[name] = value;
    }
    return ok('get-style', {
      clientId,
      sessionId,
      ref: resolved.ref.ref,
      style,
    });
  }

  async #wait(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
  ): Promise<ActionHandlerResult<'wait'>> {
    for await (const event of this.#waitStream(params, ctx, signal, false)) {
      return event as ActionHandlerResult<'wait'>;
    }
    return fail('wait', 'Wait ended before producing a result.', {
      reason: signal.aborted ? 'aborted' : 'empty-stream',
      recoverable: true,
    });
  }

  async *#waitStream(
    params: CommandObject,
    ctx: ActionContext,
    signal: AbortSignal,
    emitProgress: boolean,
  ): AsyncGenerator<CommandResult<StreamCommandEvent<'wait'>>> {
    const clientId = str(params, 'clientId');
    const sessionId = num(params, 'sessionId');
    if (!clientId || sessionId === undefined) {
      yield fail('wait', 'clientId and sessionId are required.', {
        reason: 'bad-params',
      });
      return;
    }
    const text = str(params, 'text');
    const rawRef = str(params, 'ref');
    if (!text && !rawRef) {
      yield fail('wait', 'Provide text or ref to wait for.', {
        reason: 'bad-params',
      });
      return;
    }

    if (invalidNumber(params, 'timeout') || invalidNumber(params, 'interval')) {
      yield fail(
        'wait',
        'timeout and interval must be finite numbers when provided.',
        { reason: 'bad-params' },
      );
      return;
    }
    const timeout = num(params, 'timeout') ?? 10_000;
    const interval = num(params, 'interval') ?? 500;
    if (timeout < 0 || interval <= 0) {
      yield fail(
        'wait',
        'timeout must be non-negative and interval must be positive.',
        { reason: 'bad-params' },
      );
      return;
    }

    const by: 'text' | 'ref' = text ? 'text' : 'ref';
    const query = text ?? normalizeRef(rawRef!);
    const startedAt = Date.now();
    const deadline = startedAt + timeout;
    let expectedRef: SnapshotRef | undefined;
    if (by === 'ref') {
      const resolved = this.#resolveRef('wait', clientId, sessionId, query);
      if ('ok' in resolved) {
        yield resolved;
        return;
      }
      expectedRef = resolved.ref;
      this.#snapshots.delete(this.#key(clientId, sessionId));
    }

    const timeoutResult = () =>
      fail(
        'wait',
        `Timed out after ${timeout}ms waiting for ${by} "${query}".`,
        {
          reason: 'timeout',
          recoverable: true,
          nextActions: ['agent-lynx snapshot'],
        },
      );

    for (;;) {
      signal.throwIfAborted();
      // Text and ref identity are both available in the DOM structure. Avoid
      // spending the wait deadline on paint/editable enrichment before match.
      const snapshot = await runBeforeDeadline(
        deadline,
        signal,
        (operationSignal) =>
          buildSnapshotStructure(
            ctx.connector,
            clientId,
            sessionId,
            operationSignal,
          ),
      );
      if (snapshot === WAIT_DEADLINE) {
        yield timeoutResult();
        return;
      }
      const { viewport, refs } = snapshot;
      const elapsedMs = Date.now() - startedAt;
      const matched =
        by === 'text'
          ? refs.some((ref) => ref.text.includes(query))
          : refs.some((ref) => sameSnapshotNode(ref, expectedRef!));
      if (by === 'text') {
        this.#snapshots.set(this.#key(clientId, sessionId), {
          createdAt: Date.now(),
          viewport,
          refs,
        });
      }

      if (matched) {
        if (by === 'ref') {
          const enriched = await runBeforeDeadline(
            deadline,
            signal,
            (operationSignal) =>
              enrichSnapshot(
                ctx.connector,
                clientId,
                sessionId,
                snapshot,
                operationSignal,
              ),
          );
          if (enriched !== WAIT_DEADLINE) {
            this.#snapshots.set(this.#key(clientId, sessionId), {
              createdAt: Date.now(),
              viewport,
              refs,
            });
          }
        }
        yield ok('wait', {
          clientId,
          sessionId,
          matched: true,
          by,
          query,
          elapsedMs,
        });
        return;
      }
      if (elapsedMs >= timeout) {
        yield timeoutResult();
        return;
      }
      if (emitProgress) {
        yield ok('wait.progress', {
          clientId,
          sessionId,
          matched: false,
          by,
          query,
          elapsedMs,
          refCount: refs.length,
        });
      }
      await delay(
        Math.min(interval, Math.max(0, deadline - Date.now())),
        undefined,
        { signal },
      );
    }
  }
}
