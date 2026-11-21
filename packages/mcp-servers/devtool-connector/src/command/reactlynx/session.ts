// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { ReadableStream, type ReadableStreamReadResult, TransformStream } from "node:stream/web";
import { createDebug } from "obug";
import type { Connector } from "../../index.ts";
import { applyOperationV2, applyRootOrder, createRendererState, type RendererState } from "./protocol.ts";

const debug = createDebug("devtool-mcp-server:reactlynx");
const PREACT_EVENT = "PreactDevtools";
const SOURCE_PAGE_HOOK = "preact-page-hook";
const SOURCE_DEVTOOLS_TO_CLIENT = "preact-devtools-to-client";

export const DEFAULT_REACTLYNX_IDLE_MS = 700;
export const DEFAULT_REACTLYNX_MAX_MS = 5_000;
const INITIAL_TREE_IDLE_MS = 2_500;

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

export interface ReactLynxOutboundFrame {
  method: string;
  params: { vmType: string; event: string; data: string };
}

function buildVMEventFrame<T = null>(
  source: string,
  type: string,
  data?: T,
): ReactLynxOutboundFrame {
  return {
    method: "Lynx.sendVMEvent",
    params: {
      vmType: "JSContext",
      event: PREACT_EVENT,
      data: JSON.stringify(
        {
          source,
          type,
          data: data ?? null,
        } satisfies PreactEnvelope<T | null>,
      ),
    },
  };
}

export function buildReactLynxOutboundFrame<T = null>(
  type: string,
  data?: T,
): ReactLynxOutboundFrame {
  return buildVMEventFrame(SOURCE_DEVTOOLS_TO_CLIENT, type, data);
}

/** Build a `preact-page-hook` frame (e.g. `root-order-page` FIFO sentinel). */
export function buildReactLynxPageHookFrame<T = null>(
  type: string,
  data?: T,
): ReactLynxOutboundFrame {
  return buildVMEventFrame(SOURCE_PAGE_HOOK, type, data);
}

export interface ReactLynxSessionResult {
  state: RendererState;
  framesSeen: number;
  operationFrames: number;
  rootOrderFrames: number;
  envelopeTypes: Set<string>;
}

export type ReactLynxEnvelopeAction = "continue" | "stop";

export interface RunReactLynxSessionOptions {
  connector: Connector;
  clientId: string;
  sessionId: number;
  outbound: ReactLynxOutboundFrame[];
  sendInit?: boolean;
  onEnvelope?: (envelope: PreactEnvelope) => ReactLynxEnvelopeAction;
  afterSnapshot?: (state: RendererState) => [type: string, data?: unknown] | null;
  awaitEnvelope?: boolean;
  snapshotIdleMs?: number;
  idleMs?: number;
  maxMs?: number;
  signal?: AbortSignal;
}

type SessionStreamEvent =
  | { kind: "envelope"; envelope: PreactEnvelope }
  | { kind: "context-cleared" }
  | { kind: "context-created" };

const CONTEXT_CLEARED_METHODS = new Set([
  "Runtime.executionContextsCleared",
  "Runtime.executionContextDestroyed",
  "Target.targetDestroyed",
]);

const CONTEXT_CREATED_METHODS = new Set([
  "Runtime.executionContextCreated",
  "Target.targetCreated",
]);

function parseSessionStreamEvent(value: unknown): SessionStreamEvent | null {
  if (typeof value !== "object" || value === null) return null;
  const method = (value as { method?: unknown }).method;
  if (typeof method !== "string") return null;
  if (CONTEXT_CLEARED_METHODS.has(method)) return { kind: "context-cleared" };
  if (CONTEXT_CREATED_METHODS.has(method)) return { kind: "context-created" };
  if (method !== "Lynx.onVMEvent") return null;

  const params = (value as { params?: LynxOnVMEventParams }).params ?? {};
  if (params.event !== PREACT_EVENT) return null;
  try {
    const parsed: unknown = JSON.parse(params.data ?? "null");
    if (typeof parsed !== "object" || parsed === null) return null;
    const envelope = parsed as PreactEnvelope;
    if (envelope.source !== SOURCE_PAGE_HOOK) return null;
    return { kind: "envelope", envelope };
  } catch {
    return null;
  }
}

async function raceRead<T>(
  read: Promise<ReadableStreamReadResult<T>>,
  timeoutMs: number,
): Promise<ReadableStreamReadResult<T> | "timeout"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">(resolve => {
    timer = setTimeout(resolve, timeoutMs, "timeout");
    timer.unref();
  });
  try {
    return await Promise.race([read, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function* readUntilIdle<T>(
  stream: ReadableStream<T>,
  options: {
    idleMs: number | (() => number);
    maxMs: number;
    onIdle?: () => boolean;
  },
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const startedAt = Date.now();
  let terminated = false;
  let pendingRead: Promise<ReadableStreamReadResult<T>> | undefined;
  try {
    for (;;) {
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= options.maxMs) {
        await reader.cancel();
        terminated = true;
        return;
      }

      pendingRead ??= reader.read();
      const idleMs = typeof options.idleMs === "function" ? options.idleMs() : options.idleMs;
      const remainingMs = options.maxMs - elapsedMs;
      const deadlineWins = remainingMs <= idleMs;
      const result = await raceRead(pendingRead, Math.min(idleMs, remainingMs));
      if (result === "timeout") {
        if (deadlineWins || Date.now() - startedAt >= options.maxMs) {
          await reader.cancel();
          terminated = true;
          return;
        }
        if (options.onIdle?.()) continue;
        await reader.cancel();
        terminated = true;
        return;
      }

      pendingRead = undefined;
      if (result.done) {
        terminated = true;
        return;
      }
      yield result.value;
    }
  } finally {
    if (!terminated) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Drive one short-lived Preact DevTools VM-event exchange. */
export async function runReactLynxSession(
  options: RunReactLynxSessionOptions,
): Promise<ReactLynxSessionResult> {
  const {
    connector,
    clientId,
    sessionId,
    outbound,
    sendInit = true,
    onEnvelope = () => "continue",
    afterSnapshot,
    awaitEnvelope = false,
    snapshotIdleMs = DEFAULT_REACTLYNX_IDLE_MS,
    idleMs = DEFAULT_REACTLYNX_IDLE_MS,
    maxMs = DEFAULT_REACTLYNX_MAX_MS,
    signal,
  } = options;
  const initialTreeIdleMs = options.idleMs ?? INITIAL_TREE_IDLE_MS;

  let stopRequested = false;
  let cancelInput: () => void = () => {};
  let inputTerminated = false;
  let inputTerminalReason: unknown;
  let assertInputWritable: () => void = () => {
    throw new Error("ReactLynx input stream is not ready");
  };
  let sendInput: (frame: ReactLynxOutboundFrame) => void = () => {
    throw new Error("ReactLynx input stream is not ready");
  };

  const input = new ReadableStream<ReactLynxOutboundFrame>({
    start(controller) {
      if (sendInit) controller.enqueue(buildReactLynxOutboundFrame("init"));
      for (const frame of outbound) controller.enqueue(frame);
      assertInputWritable = () => {
        if (!inputTerminated) return;
        if (inputTerminalReason !== undefined) throw inputTerminalReason;
        throw new Error("ReactLynx input stream is no longer writable");
      };
      sendInput = frame => {
        assertInputWritable();
        try {
          controller.enqueue(frame);
        } catch (error) {
          inputTerminated = true;
          inputTerminalReason = error;
          throw error;
        }
      };
      cancelInput = () => {
        if (inputTerminated) return;
        inputTerminated = true;
        try {
          controller.close();
        } catch (error) {
          inputTerminalReason = error;
        }
      };
    },
    cancel(reason) {
      inputTerminated = true;
      inputTerminalReason = reason;
    },
  });

  await using stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    input as ReadableStream<{ method: string; params?: unknown }>,
    signal ? { signal } : undefined,
  );

  const state = createRendererState();
  let framesSeen = 0;
  let operationFrames = 0;
  let rootOrderFrames = 0;
  const envelopeTypes = new Set<string>();
  let snapshotPending = afterSnapshot !== undefined;
  let awaitingNewContext = false;
  const wantsTree = outbound.some(frame => {
    try {
      const parsed = JSON.parse(frame.params.data) as { type?: unknown };
      return parsed.type === "refresh";
    } catch {
      return false;
    }
  });

  const filteredStream = (stream as ReadableStream<unknown>).pipeThrough(
    new TransformStream<unknown, SessionStreamEvent>({
      transform(chunk, controller) {
        const event = parseSessionStreamEvent(chunk);
        if (event !== null) controller.enqueue(event);
      },
    }),
  );

  try {
    for await (
      const event of readUntilIdle(filteredStream, {
        idleMs: () => {
          if (snapshotPending) return snapshotIdleMs;
          if (framesSeen === 0 && wantsTree) return initialTreeIdleMs;
          return idleMs;
        },
        maxMs,
        onIdle: () => {
          if (awaitingNewContext) return true;
          if (
            wantsTree
            && (operationFrames > 0
              ? state.tree.size === 0 || rootOrderFrames === 0
              : envelopeTypes.has("attach") && rootOrderFrames === 0)
          ) {
            return true;
          }
          if (!snapshotPending || !afterSnapshot) return awaitEnvelope;
          snapshotPending = false;
          assertInputWritable();
          const followUp = afterSnapshot(state);
          if (!followUp) {
            stopRequested = true;
            return false;
          }
          sendInput(buildReactLynxOutboundFrame(followUp[0], followUp[1]));
          return true;
        },
      })
    ) {
      if (event.kind === "context-cleared") {
        debug("execution context cleared mid-session; discarding pre-reload state");
        state.tree.clear();
        state.roots.length = 0;
        framesSeen = 0;
        operationFrames = 0;
        rootOrderFrames = 0;
        envelopeTypes.clear();
        awaitingNewContext = true;
        continue;
      }
      if (event.kind === "context-created") {
        const shouldReplay = awaitingNewContext || framesSeen === 0;
        awaitingNewContext = false;
        if (shouldReplay && !inputTerminated) {
          debug("execution context created mid-session; re-sending outbound frames");
          if (sendInit) sendInput(buildReactLynxOutboundFrame("init"));
          for (const frame of outbound) sendInput(frame);
        }
        continue;
      }

      awaitingNewContext = false;
      const { envelope } = event;
      framesSeen += 1;
      envelopeTypes.add(envelope.type);
      debug(
        "frame %d: type=%s dataSize=%s",
        framesSeen,
        envelope.type,
        Array.isArray(envelope.data) ? envelope.data.length : typeof envelope.data,
      );

      if (envelope.type === "init") {
        state.tree.clear();
        state.roots.length = 0;
      } else if (envelope.type === "operation_v2" && Array.isArray(envelope.data)) {
        operationFrames += 1;
        applyOperationV2(state, envelope.data as number[]);
      } else if (envelope.type === "root-order" && Array.isArray(envelope.data)) {
        rootOrderFrames += 1;
        applyRootOrder(state, envelope.data as number[]);
      }

      if (onEnvelope(envelope) === "stop") {
        stopRequested = true;
        break;
      }
    }
  } finally {
    cancelInput();
  }

  debug(
    "session done: stop=%s frames=%d op=%d root=%d types=%o",
    stopRequested,
    framesSeen,
    operationFrames,
    rootOrderFrames,
    [...envelopeTypes],
  );
  return { state, framesSeen, operationFrames, rootOrderFrames, envelopeTypes };
}

export function reactLynxEmptyTreeDiagnostic(result: ReactLynxSessionResult): string {
  if (result.framesSeen === 0) {
    return "saw 0 frames -- the App is silent on the PreactDevtools channel. "
      + "Most likely `@lynx-js/preact-devtools` is not installed, the bundle is a production build, "
      + "or `setupReactLynx()` has not run yet. Look for "
      + "`[PREACT DEVTOOLS] Devtools initialized successfully` in the device console.";
  }
  if (result.operationFrames === 0) {
    if (result.rootOrderFrames > 0 && result.state.roots.length === 0) {
      return `saw ${result.framesSeen} frame(s) with an empty \`root-order\` and no \`operation_v2\` -- `
        + "`@lynx-js/preact-devtools` responded, but no active ReactLynx roots are currently tracked "
        + "(the JS runtime may have been restarted or no root is mounted).";
    }
    return `saw ${result.framesSeen} frame(s) but no \`operation_v2\` -- `
      + "`@lynx-js/preact-devtools` is loaded but does not honor `refresh`. "
      + "Upgrade to a build with the `document.body` and `preactDevtoolsCtx.Node` fixes.";
  }
  if (result.state.tree.size > 0 && result.state.roots.length === 0) {
    return `saw ${result.framesSeen} frame(s) (${result.state.tree.size} node(s)) without \`root-order\` -- `
      + "the component tree stream ended before the root list arrived.";
  }
  return `saw ${result.framesSeen} frame(s) including ${result.operationFrames} \`operation_v2\` `
    + "but the resulting tree is empty (every node was unmounted).";
}
