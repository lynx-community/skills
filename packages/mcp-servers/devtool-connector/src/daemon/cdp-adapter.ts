// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ClientTarget } from "../client-id.ts";
import { nextRequestId } from "../request-id.ts";

/** A standard CDP request, response or event. */
export interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
  sessionId?: string;
}

export interface LynxCdpAdapterOptions {
  /** DebugRouter client port of the Lynx App. */
  port: ClientTarget;
  /** Lynx session (one LynxView) this adapter talks to. */
  sessionId: number;
  /** Writes a daemon `Customized` message towards the App. */
  send: (message: unknown) => void;
  /** Receives replies to frontend requests and device events for the frontend. */
  deliver: (message: CdpMessage) => void;
  /** Returns a result to answer a frontend request locally instead of forwarding it. */
  localResult?: (message: CdpMessage) => Record<string, unknown> | undefined;
  /** Observes or adjusts a device reply before the frontend sees it. */
  onReply?: (method: string, reply: CdpMessage) => void;
  /** Returns true to keep a device event away from the frontend. */
  filterEvent?: (event: CdpMessage) => boolean;
}

interface PendingRequest {
  readonly method: string;
  readonly sessionId: string | undefined;
  /** Set for frontend requests; their replies go back under the frontend's own id. */
  readonly frontendId?: number;
  /** Set for gateway-owned requests; the frontend never sees their replies. */
  readonly resolve?: (reply: CdpMessage) => void;
}

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Methods the upstream frontend calls during startup that Lynx does not implement and whose
 * errors are only noise. Everything else is forwarded so real Lynx errors stay visible.
 */
const EMPTY_RESULT_METHODS: ReadonlySet<string> = new Set([
  "Audits.enable",
  "Autofill.enable",
  "Autofill.setAddresses",
  "Debugger.setBlackboxExecutionContexts",
  "Emulation.setAutoDarkModeOverride",
  "Emulation.setEmitTouchEventsForMouse",
  "Emulation.setEmulatedMedia",
  "Emulation.setEmulatedVisionDeficiency",
  "Emulation.setFocusEmulationEnabled",
  "Emulation.setTouchEmulationEnabled",
  "Log.startViolationsReport",
  "Network.clearAcceptedEncodingsOverride",
  "Network.setAttachDebugStack",
  "Overlay.disable",
  "Overlay.enable",
  "Overlay.setPausedInDebuggerMessage",
  "Overlay.setShowContainerQueryOverlays",
  "Overlay.setShowFlexOverlays",
  "Overlay.setShowGridOverlays",
  "Overlay.setShowIsolatedElements",
  "Overlay.setShowScrollSnapOverlays",
  "Overlay.setShowViewportSizeOnResize",
  "Overlay.setShowWindowControlsOverlay",
  "Page.setAdBlockingEnabled",
  "Page.setLifecycleEventsEnabled",
  "Preload.enable",
  "ServiceWorker.enable",
  "Target.setAutoAttach",
  "Target.setDiscoverTargets",
  "Target.setRemoteLocations",
]);

export function lynxLocalResult(message: CdpMessage): Record<string, unknown> | undefined {
  return EMPTY_RESULT_METHODS.has(message.method ?? "") ? {} : undefined;
}

/** Rewrites frontend requests into the form Lynx implements. */
function patchLynxRequest(message: CdpMessage): CdpMessage {
  switch (message.method) {
    // The upstream screencast view sends mouse events; Lynx implements the touch-emulating variant.
    case "Input.dispatchMouseEvent":
      return { ...message, method: "Input.emulateTouchFromMouseEvent", params: { button: "none", ...message.params } };
    // Fullscreen frames share the screen origin with DOM coordinates.
    case "Page.startScreencast":
      return { ...message, params: { mode: "fullscreen", ...message.params } };
    default:
      return message;
  }
}

/**
 * Adapts one standard CDP client to one Lynx session behind the daemon's `Customized`
 * envelope. Several adapters can share a daemon connection: device request ids are allocated
 * process-wide, so each adapter only claims replies to its own requests, while events reach
 * every adapter of the session.
 */
export class LynxCdpAdapter {
  readonly sessionId: number;
  /** Device events seen so far, as `method@sessionId`. */
  readonly seen: Set<string> = new Set();
  readonly #pending = new Map<number, PendingRequest>();
  readonly #options: LynxCdpAdapterOptions;

  constructor(options: LynxCdpAdapterOptions) {
    this.#options = options;
    this.sessionId = options.sessionId;
  }

  /** Forgets outstanding requests; gateway-owned ones resolve with an error. */
  close(): void {
    for (const request of this.#pending.values()) {
      request.resolve?.({ error: { code: -32000, message: "CDP client closed" } });
    }
    this.#pending.clear();
  }

  fromFrontend(message: CdpMessage): void {
    if (typeof message.id !== "number" || typeof message.method !== "string") return;
    const local = this.#options.localResult?.(message);
    if (local !== undefined) {
      this.#options.deliver({
        id: message.id,
        result: local,
        ...(message.sessionId ? { sessionId: message.sessionId } : {}),
      });
      return;
    }
    this.#forward(patchLynxRequest(message), { frontendId: message.id });
  }

  /** Sends a request whose reply resolves here instead of reaching the frontend. */
  request(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
    timeoutMs: number = REQUEST_TIMEOUT_MS,
  ): Promise<CdpMessage> {
    return new Promise((resolve) => {
      const id = this.#forward({ method, params, ...(sessionId ? { sessionId } : {}) }, { resolve });
      setTimeout(() => {
        if (this.#pending.delete(id)) resolve({ error: { code: -32000, message: `${method} timed out` } });
      }, timeoutMs).unref();
    });
  }

  /** Delivers a synthetic event to the frontend, e.g. `Overlay.inspectNodeRequested`. */
  inject(event: CdpMessage): void {
    this.#options.deliver(event);
  }

  /** Handles a CDP message the App sent for `sessionId`, if it belongs to this adapter. */
  fromDevice(sessionId: unknown, message: CdpMessage): void {
    if (typeof sessionId === "number" && sessionId !== this.sessionId) return;

    if (typeof message.id === "number") {
      const request = this.#pending.get(message.id);
      // A reply to another client of the same App port.
      if (!request) return;
      this.#pending.delete(message.id);
      // Native Lynx agents drop `sessionId` from replies; the frontend routes by it (main-thread worker).
      const reply = { ...message, ...(request.sessionId ? { sessionId: request.sessionId } : {}) };
      this.#options.onReply?.(request.method, reply);
      if (request.resolve) request.resolve(reply);
      else this.#options.deliver({ ...reply, id: request.frontendId! });
      return;
    }

    this.seen.add(`${String(message.method)}@${message.sessionId ?? ""}`);
    if (!this.#options.filterEvent?.(message)) this.#options.deliver(message);
  }

  #forward(message: CdpMessage, request: Pick<PendingRequest, "frontendId" | "resolve">): number {
    const id = nextRequestId();
    this.#pending.set(id, { ...request, method: message.method!, sessionId: message.sessionId });
    this.#options.send({
      event: "Customized",
      data: {
        type: "CDP",
        data: { client_id: this.#options.port, session_id: this.sessionId, message: { ...message, id } },
      },
    });
    return id;
  }
}

/** Parses a CDP message that the App sent either as JSON text or as an object. */
export function parseCdpMessage(raw: unknown): CdpMessage | null {
  try {
    const message: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    return typeof message === "object" && message !== null && !Array.isArray(message) ? message as CdpMessage : null;
  } catch {
    return null;
  }
}
