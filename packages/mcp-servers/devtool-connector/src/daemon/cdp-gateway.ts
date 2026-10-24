// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ReadableStream, WritableStreamDefaultWriter } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";
import { createDebug } from "obug";
import type { RawData, WebSocket } from "ws";
import { ClientId, type ClientTarget } from "../client-id.ts";
import { DaemonTransport } from "../transport/daemon.ts";
import type { Connection } from "../transport/transport.ts";
import {
  type CdpMessage,
  LynxCdpAdapter,
  type LynxCdpAdapterOptions,
  lynxLocalResult,
  parseCdpMessage,
} from "./cdp-adapter.ts";
import { DAEMON_CDP_HOST_PATH } from "./protocol.ts";

const debug = createDebug("devtool-mcp-server:daemon:cdp-gateway");

const VIEW_ID_PATTERN = /^[\w-]{8,64}$/;
/** Above the largest message the daemon's WebSocket accepts (100 MiB), so one big reply never trips it. */
const MAX_BUFFERED_BYTES = 128 * 1024 * 1024;
const MAX_QUEUED_MESSAGES = 1_000;
const SESSION_RECT_TTL_MS = 2_000;
/** How long a pick waits for root rectangles; a slower LynxView keeps its last one meanwhile. */
const SESSION_RECT_WAIT_MS = 1_000;
const SCREEN_TTL_MS = 2_000;
const SCREEN_SAMPLE_TIMEOUT_MS = 5_000;
const OVERLAY_METHODS: ReadonlySet<string> = new Set([
  "Overlay.highlightNode",
  "Overlay.hideHighlight",
  "Overlay.setInspectMode",
]);

/** A rectangle in pixels of the video shown by the host page. */
interface VideoBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Host page → gateway. Coordinates are pixels of the video the host shows. */
type HostMessage =
  | { type: "pick"; x: number; y: number; videoWidth: number; videoHeight: number; commit: boolean }
  | { type: "clear-highlight" }
  /** The user left inspect mode on the host, e.g. with Esc. */
  | { type: "cancel-inspect" }
  | { type: "video-size"; videoWidth: number; videoHeight: number };

/** Gateway → host page. */
type GatewayMessage =
  | { type: "inspect-mode"; enabled: boolean }
  | { type: "highlight"; box: VideoBox | null }
  /** The picked node belongs to another LynxView: reload the frontend for this session. */
  | { type: "open-session"; sessionId: number };

interface Size {
  width: number;
  height: number;
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A node of one Lynx session. Lynx reports a nodeId, a backendNodeId or both. */
interface NodeRef {
  sessionId: number;
  nodeId: number | undefined;
  backendNodeId: number | undefined;
}

/**
 * Serves standard CDP over WebSocket for Lynx sessions, so the unmodified Chrome DevTools
 * frontend (hosted, or bundled with Chrome) attaches with `?ws=`. A page that shows the device
 * screen pairs with its frontend through a random `view` id and picks elements on that screen.
 *
 * Every connection reaches the App through the daemon's own `/devtool/connector` socket, one per
 * Lynx client, so the gateway shares the daemon's pooled device connection with other clients.
 */
export class CdpGateway {
  readonly #daemonUrl: string;
  readonly #links = new Map<string, DeviceLink>();

  constructor(daemonUrl: string) {
    this.#daemonUrl = daemonUrl;
  }

  /**
   * `/devtool/connector/cdp?clientId=…&sessionId=…[&view=…]` attaches a frontend;
   * `/devtool/connector/cdp-host?clientId=…&view=…` attaches a host page.
   */
  accept(ws: WebSocket, url: URL): void {
    // ws reports protocol violations such as invalid UTF-8 as errors before it closes the socket;
    // an unhandled one would end the daemon.
    ws.on("error", error => debug("gateway socket error: %O", error));
    const clientId = url.searchParams.get("clientId") ?? "";
    const target = ClientId.deserialize(clientId);
    const viewId = url.searchParams.get("view");
    if (!target || (viewId !== null && !VIEW_ID_PATTERN.test(viewId))) {
      closeSocket(ws, 1008, "Expected a valid clientId and view");
      return;
    }
    if (url.pathname === DAEMON_CDP_HOST_PATH) {
      if (viewId === null) closeSocket(ws, 1008, "Missing view");
      else this.#link(clientId, target).addHost(ws, viewId);
      return;
    }
    const sessionId = url.searchParams.get("sessionId") ?? "";
    if (!/^\d+$/.test(sessionId) || !Number.isSafeInteger(Number(sessionId))) {
      closeSocket(ws, 1008, "Expected a Lynx sessionId");
      return;
    }
    this.#link(clientId, target).addFrontend(ws, Number(sessionId), viewId);
  }

  close(): void {
    for (const link of this.#links.values()) link.close(1001, "Connector daemon is shutting down");
  }

  #link(clientId: string, target: { deviceId: string; port: ClientTarget }): DeviceLink {
    const existing = this.#links.get(clientId);
    if (existing) return existing;
    const link: DeviceLink = new DeviceLink(this.#daemonUrl, clientId, target, () => {
      if (this.#links.get(clientId) === link) this.#links.delete(clientId);
    });
    this.#links.set(clientId, link);
    return link;
  }
}

/** One subscription to a Lynx client, shared by all of its frontends and host pages. */
class DeviceLink {
  readonly clientId: string;
  readonly target: { deviceId: string; port: ClientTarget };
  readonly ready: Promise<void>;
  readonly #probes = new Map<number, LynxCdpAdapter>();
  readonly #views = new Map<string, View>();
  readonly #frontends = new Map<LynxCdpAdapter, WebSocket>();
  readonly #sockets = new Set<WebSocket>();
  readonly #abort = new AbortController();
  readonly #onClosed: () => void;
  #closed = false;
  #connection: Connection<unknown, unknown> | null = null;
  #writer: WritableStreamDefaultWriter<unknown> | null = null;
  /** LynxView sessions of the App, from the latest `SessionList`; WebViews do not share their coordinates. */
  #sessions: number[] = [];
  #rects: { at: number; rects: Promise<(Bounds & { sessionId: number })[]> } | null = null;
  /** The last root rectangle of each LynxView, which a refresh still out leaves in place. */
  readonly #rootRects = new Map<number, Bounds & { sessionId: number }>();
  /** LynxViews with a root rectangle request out; a refresh does not ask them again meanwhile. */
  readonly #refreshing = new Set<number>();
  #screen: Promise<Size | null> | null = null;
  #screencastWaiter: ((metadata: unknown) => void) | null = null;

  constructor(
    daemonUrl: string,
    clientId: string,
    target: { deviceId: string; port: ClientTarget },
    onClosed: () => void,
  ) {
    this.clientId = clientId;
    this.target = target;
    this.#onClosed = onClosed;
    this.ready = this.#connect(daemonUrl);
    this.ready.catch((error: unknown) => {
      this.close(1011, `Cannot attach to ${clientId}: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  addFrontend(ws: WebSocket, sessionId: number, viewId: string | null): void {
    this.#sockets.add(ws);
    const repair = new AbortController();
    const queued: CdpMessage[] = [];
    let adapter: LynxCdpAdapter | null = null;
    // Joined once the link is ready, so a host that reconnects meanwhile finds the same View.
    let view: View | null = null;
    let mainTarget: "absent" | "announced" | "injected" = "absent";

    ws.on("message", (raw: RawData) => {
      const message = parseCdpMessage(String(raw));
      if (!message) return;
      if (adapter) adapter.fromFrontend(message);
      else if (queued.push(message) > MAX_QUEUED_MESSAGES) closeSocket(ws, 1013, "Lynx client is not ready");
    });
    ws.on("close", () => {
      repair.abort();
      if (adapter) {
        adapter.close();
        this.#frontends.delete(adapter);
        view?.frontends.delete(adapter);
        // Picking and highlights belonged to the frontends; the host would otherwise keep picking.
        if (view?.frontends.size === 0) view.reset();
      }
      this.#release(ws, view);
    });

    void this.ready.then(() => {
      if (ws.readyState !== ws.OPEN) return;
      view = viewId === null ? null : this.#view(viewId);
      const frontend: LynxCdpAdapter = this.#createAdapter(sessionId, {
        deliver: message => sendJson(ws, message),
        localResult: message => view ? view.localResult(message, frontend) : standaloneLocalResult(message),
        onReply: (method, reply) => {
          if (method === "DOM.getDocument" && !reply.error) view?.onDocument(frontend);
        },
        filterEvent: (event) => {
          // Frames of the gateway's screen-size sample are not for frontends.
          if (event.method === "Page.screencastFrame" && this.#screencastWaiter !== null) return true;
          if (event.params?.["sessionId"] !== "Main") return false;
          // A reload may detach the main-thread target and announce it again.
          if (event.method === "Target.detachedFromTarget") mainTarget = "absent";
          if (event.method !== "Target.attachedToTarget") return false;
          // A late announcement would add a second main-thread target.
          if (mainTarget === "injected") return true;
          mainTarget = "announced";
          return false;
        },
      });
      adapter = frontend;
      this.#frontends.set(frontend, ws);
      view?.frontends.add(frontend);
      view?.frontendAttached();
      for (const message of queued.splice(0)) frontend.fromFrontend(message);
      // A frontend of a LynxView that has closed meanwhile hears so from the fresh list.
      this.#requestSessions();
      void repairLynxTargets(frontend, repair.signal, {
        announced: () => mainTarget !== "absent",
        onInjected: () => {
          mainTarget = "injected";
        },
      });
    }, () => undefined);
  }

  addHost(ws: WebSocket, viewId: string): void {
    this.#sockets.add(ws);
    const view = this.#view(viewId);
    view.hosts.add(ws);
    ws.on("message", (raw: RawData) => {
      const message = parseHostMessage(String(raw));
      if (!message) return;
      void this.ready
        .then(() => view.onHostMessage(message))
        .catch((error: unknown) => debug("host message %s failed: %O", message.type, error));
    });
    ws.on("close", () => {
      view.hosts.delete(ws);
      this.#release(ws, view);
    });
  }

  close(code: number, reason: string): void {
    if (this.#closed) return;
    this.#closed = true;
    debug("closing link %s: %d %s", this.clientId, code, reason);
    this.#onClosed();
    this.#abort.abort();
    this.#screencastWaiter?.(null);
    for (const adapter of [...this.#frontends.keys(), ...this.#probes.values()]) adapter.close();
    this.#probes.clear();
    this.#frontends.clear();
    this.#views.clear();
    for (const ws of this.#sockets) closeSocket(ws, code, reason);
    this.#sockets.clear();
    Promise.resolve(this.#connection?.[Symbol.asyncDispose]()).catch((error: unknown) => {
      debug("failed to close link %s: %O", this.clientId, error);
    });
  }

  /**
   * Screen size in CDP coordinates (dp on Android), from one tiny fullscreen screencast frame.
   * ponytail: Lynx keeps one coordinate mode per process, and Agent screenshots switch it to lynxview.
   * A sample, which switches it back, therefore holds only briefly; serialize with ActionCore if
   * picks and screenshots ever have to interleave exactly.
   */
  screenSize(sessionId: number): Promise<Size | null> {
    if (this.#screen) return this.#screen;
    // A WebView's frame measures only the WebView; any LynxView's fullscreen frame measures the screen.
    const screen = this.#sampleScreen(this.#sessions.includes(sessionId) ? sessionId : this.#sessions[0] ?? sessionId);
    this.#screen = screen;
    void screen.then((size) => {
      const forget = () => {
        if (this.#screen === screen) this.#screen = null;
      };
      if (size) setTimeout(forget, SCREEN_TTL_MS).unref();
      else forget();
    });
    return screen;
  }

  invalidateScreen(): void {
    this.#screen = null;
  }

  /** Whether a session is a LynxView, whose boxes are in screen coordinates; WebViews use their own. */
  isLynxSession(sessionId: number): boolean {
    return this.#sessions.includes(sessionId);
  }

  /**
   * Node at a point in CDP coordinates; the smallest LynxView containing the point wins. `shown` is the
   * session the frontend shows and `newestAtAttach` the newest session when that frontend attached.
   */
  async nodeAt(x: number, y: number, shown: number, newestAtAttach: number): Promise<NodeRef | null> {
    // ponytail: area stands in for z-order, which Lynx does not report. Of views of equal size, one opened
    // since the frontend attached wins, like a page the user went on to; then the one shown, so choosing a
    // session in the frontend settles the rest; then the newest. Z-order would settle every case.
    const rank = (sessionId: number) => sessionId > newestAtAttach ? 2 : sessionId === shown ? 1 : 0;
    const [smallest] = (await this.#sessionRects())
      .filter(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
      .sort((a, b) => area(a) - area(b) || rank(b.sessionId) - rank(a.sessionId) || b.sessionId - a.sessionId);
    const sessionId = smallest?.sessionId ?? (this.isLynxSession(shown) ? shown : null);
    if (sessionId === null) return null;
    const reply = await this.#probe(sessionId).request("DOM.getNodeForLocation", {
      x,
      y,
      includeUserAgentShadowDOM: false,
    });
    return nodeRef(sessionId, reply.result);
  }

  async borderBounds(node: NodeRef): Promise<Bounds | null> {
    // Prefer the nodeId, as ActionCore does.
    const reply = await this.#probe(node.sessionId).request(
      "DOM.getBoxModel",
      node.nodeId ? { nodeId: node.nodeId } : { backendNodeId: node.backendNodeId },
    );
    const quad = (reply.result?.["model"] as { border?: unknown } | undefined)?.border;
    if (!Array.isArray(quad) || quad.length < 8 || !quad.every(value => typeof value === "number")) return null;
    const xs = [quad[0], quad[2], quad[4], quad[6]] as number[];
    const ys = [quad[1], quad[3], quad[5], quad[7]] as number[];
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }

  async #connect(daemonUrl: string): Promise<void> {
    const connection = await new DaemonTransport(daemonUrl).connect<unknown, unknown>({
      ...this.target,
      signal: this.#abort.signal,
    });
    if (this.#closed) {
      await connection[Symbol.asyncDispose]();
      return;
    }
    this.#connection = connection;
    this.#writer = connection.writable.getWriter();
    void this.#read(connection.readable);
    this.#requestSessions();
  }

  async #read(readable: ReadableStream<unknown>): Promise<void> {
    try {
      for await (const message of readable) this.#onDaemonMessage(message);
    } catch (error) {
      debug("link %s read failed: %O", this.clientId, error);
    }
    this.close(1001, "Lynx client disconnected");
  }

  #onDaemonMessage(message: unknown): void {
    if (!isRecord(message) || message["event"] !== "Customized" || !isRecord(message["data"])) return;
    const { type, data } = message["data"];
    if (type === "SessionList") {
      if (!Array.isArray(data)) return;
      const sessions = data.filter(isRecord).filter(session => Number.isSafeInteger(session["session_id"]));
      const ids = new Set(sessions.map(session => session["session_id"] as number));
      // Like SessionGuardTransformStream: a frontend of a closed LynxView would otherwise show a stale page.
      for (const [frontend, ws] of this.#frontends) {
        if (!ids.has(frontend.sessionId)) closeSocket(ws, 1001, "Lynx session closed");
      }
      this.#sessions = sessions.filter(session => session["type"] !== "web").map(session =>
        session["session_id"] as number
      );
      for (const view of this.#views.values()) view.onSessions(this.#sessions);
      for (const [sessionId, probe] of this.#probes) {
        if (ids.has(sessionId)) continue;
        this.#probes.delete(sessionId);
        probe.close();
      }
      return;
    }
    if (type !== "CDP" || !isRecord(data)) return;
    const cdp = parseCdpMessage(data["message"]);
    if (!cdp) return;
    // Probes last: the frame that ends a screen sample stays hidden from the frontends.
    for (const adapter of [...this.#frontends.keys(), ...this.#probes.values()]) {
      adapter.fromDevice(data["session_id"], cdp);
    }
  }

  readonly #send = (message: unknown): void => {
    if (this.#closed || !this.#writer) return;
    this.#writer.write(message).catch((error: unknown) => {
      this.close(1011, `Lost the connector daemon: ${error instanceof Error ? error.message : String(error)}`);
    });
  };

  #requestSessions(): void {
    this.#send({
      event: "Customized",
      data: { type: "ListSession", data: { client_id: this.target.port, session_id: 0 } },
    });
  }

  #createAdapter(
    sessionId: number,
    options: Omit<LynxCdpAdapterOptions, "port" | "sessionId" | "send">,
  ): LynxCdpAdapter {
    return new LynxCdpAdapter({ ...options, port: this.target.port, sessionId, send: this.#send });
  }

  /** Gateway-owned requests for a session; the frontends never see them. */
  #probe(sessionId: number): LynxCdpAdapter {
    let probe = this.#probes.get(sessionId);
    if (!probe) {
      const created: LynxCdpAdapter = this.#createAdapter(sessionId, {
        deliver: () => undefined,
        filterEvent: (event) => {
          if (event.method === "Page.screencastFrame" && this.#screencastWaiter) {
            const frameSessionId = event.params?.["sessionId"];
            if (typeof frameSessionId === "number") {
              void created.request("Page.screencastFrameAck", { sessionId: frameSessionId });
            }
            this.#screencastWaiter(event.params?.["metadata"]);
          }
          return true;
        },
      });
      probe = created;
      this.#probes.set(sessionId, probe);
    }
    return probe;
  }

  #sampleScreen(sessionId: number): Promise<Size | null> {
    const probe = this.#probe(sessionId);
    return new Promise((resolve) => {
      const finish = (metadata: unknown): void => {
        if (this.#screencastWaiter !== finish) return;
        this.#screencastWaiter = null;
        clearTimeout(timer);
        void probe.request("Page.stopScreencast");
        const width = isRecord(metadata) ? metadata["deviceWidth"] : undefined;
        const height = isRecord(metadata) ? metadata["deviceHeight"] : undefined;
        resolve(isPositive(width) && isPositive(height) ? { width, height } : null);
      };
      const timer = setTimeout(() => finish(null), SCREEN_SAMPLE_TIMEOUT_MS);
      // A sample superseded by a rotation resolves without a size instead of never.
      this.#screencastWaiter?.(null);
      this.#screencastWaiter = finish;
      // Lynx keeps one screencast mode per process; a fullscreen frame shares the DOM's screen origin.
      // ponytail: stopping also ends a screencast that a standalone frontend of the App runs; track
      // frontend screencasts if a standalone frontend and a host page have to share an App.
      void probe.request("Page.startScreencast", {
        format: "jpeg",
        quality: 1,
        maxWidth: 64,
        maxHeight: 128,
        mode: "fullscreen",
      });
    });
  }

  /** Root rectangles of every Lynx session, refreshed at most every two seconds. */
  #sessionRects(): Promise<(Bounds & { sessionId: number })[]> {
    if (this.#rects && performance.now() - this.#rects.at < SESSION_RECT_TTL_MS) return this.#rects.rects;
    this.#requestSessions();
    const refresh = Promise.all(
      this.#sessions.filter(id => !this.#refreshing.has(id)).map(async (sessionId) => {
        this.#refreshing.add(sessionId);
        try {
          const document = await this.#probe(sessionId).request("DOM.getDocument", { depth: 1 });
          const root = document.result?.["root"] as { nodeId?: unknown; children?: { nodeId?: unknown }[] } | undefined;
          const rootId = root?.children?.[0]?.nodeId ?? root?.nodeId;
          const bounds = typeof rootId === "number"
            ? await this.borderBounds({ sessionId, nodeId: rootId, backendNodeId: undefined })
            : null;
          if (bounds && area(bounds) > 0) this.#rootRects.set(sessionId, { ...bounds, sessionId });
          else this.#rootRects.delete(sessionId);
        } finally {
          this.#refreshing.delete(sessionId);
        }
      }),
    );
    // A LynxView that answers late, e.g. a large page whose Lynx ignores `depth`, still counts next time.
    const rects = Promise.race([refresh, delay(SESSION_RECT_WAIT_MS, undefined, { ref: false })]).then(() =>
      this.#sessions.flatMap(sessionId => this.#rootRects.get(sessionId) ?? [])
    );
    this.#rects = { at: performance.now(), rects };
    return rects;
  }

  #view(viewId: string): View {
    let view = this.#views.get(viewId);
    if (!view) {
      view = new View(viewId, this);
      this.#views.set(viewId, view);
    }
    return view;
  }

  #release(ws: WebSocket, view: View | null): void {
    this.#sockets.delete(ws);
    if (view && view.hosts.size === 0 && view.frontends.size === 0 && this.#views.get(view.id) === view) {
      this.#views.delete(view.id);
    }
    if (this.#sockets.size === 0) this.close(1000, "");
  }
}

/** A host page showing the device screen, paired with the frontends it embeds. */
class View {
  readonly id: string;
  readonly hosts: Set<WebSocket> = new Set();
  readonly frontends: Set<LynxCdpAdapter> = new Set();
  readonly #link: DeviceLink;
  #video: Size | null = null;
  #highlighted: NodeRef | null = null;
  /** Whether the frontend's element picker is on; picks only count while it is. */
  #inspecting = false;
  /** Bumped by every pick and cleared highlight, so slower hover picks cannot draw a stale box. */
  #pickSerial = 0;
  #pendingReveal: NodeRef | null = null;
  /** The newest Lynx session when the current frontend attached; null until the next SessionList. */
  #newestAtAttach: number | null = null;

  constructor(id: string, link: DeviceLink) {
    this.id = id;
    this.#link = link;
  }

  /** Session of the most recently attached frontend, the one the host shows. */
  get sessionId(): number | null {
    let sessionId: number | null = null;
    for (const frontend of this.frontends) sessionId = frontend.sessionId;
    return sessionId;
  }

  /** The host draws the overlay on its video, so Lynx must not repaint the page. */
  localResult(message: CdpMessage, frontend: LynxCdpAdapter): Record<string, unknown> | undefined {
    switch (message.method) {
      case "Overlay.setInspectMode": {
        const enabled = message.params?.["mode"] !== "none";
        this.#inspecting = enabled;
        if (enabled) {
          // Measure again: another client may have switched Lynx's coordinate mode since.
          this.#link.invalidateScreen();
          // A pick the host never opened a frontend for is stale now.
          this.#pendingReveal = null;
        }
        this.#toHosts({ type: "inspect-mode", enabled });
        if (!enabled) this.#clearHighlight();
        return {};
      }
      case "Overlay.highlightNode": {
        const node = nodeRef(frontend.sessionId, message.params);
        if (node) this.#highlight(node).catch((error: unknown) => debug("highlight failed: %O", error));
        return {};
      }
      case "Overlay.hideHighlight":
        this.#clearHighlight();
        return {};
      default:
        return lynxLocalResult(message);
    }
  }

  /** Reveals a node picked in another LynxView once the frontend for that session has its document. */
  onDocument(frontend: LynxCdpAdapter): void {
    const reveal = this.#pendingReveal;
    if (reveal?.sessionId !== frontend.sessionId) return;
    this.#pendingReveal = null;
    // Let the frontend handle the document reply before it looks the node up.
    setTimeout(() => revealNode(frontend, reveal), 0);
  }

  async onHostMessage(message: HostMessage): Promise<void> {
    switch (message.type) {
      case "video-size":
        this.#setVideo(message);
        return;
      case "clear-highlight":
        this.#clearHighlight();
        return;
      case "cancel-inspect":
        if (!this.#inspecting) return;
        this.reset();
        for (const frontend of this.frontends) frontend.inject({ method: "Overlay.inspectModeCanceled" });
        return;
      case "pick":
        await this.#pick(message);
        return;
    }
  }

  frontendAttached(): void {
    this.#newestAtAttach = null;
  }

  onSessions(lynxSessions: readonly number[]): void {
    this.#newestAtAttach ??= Math.max(0, ...lynxSessions);
  }

  /** Leaves inspect mode and clears the highlight, e.g. once the last frontend has left. */
  reset(): void {
    if (this.#inspecting) {
      this.#inspecting = false;
      this.#toHosts({ type: "inspect-mode", enabled: false });
    }
    this.#clearHighlight();
  }

  #setVideo({ videoWidth, videoHeight }: { videoWidth: number; videoHeight: number }): void {
    const previous = this.#video;
    this.#video = { width: videoWidth, height: videoHeight };
    // A rotated screen swaps the CDP width and height as well.
    if (previous && previous.width > previous.height !== videoWidth > videoHeight) this.#link.invalidateScreen();
  }

  /** Video pixels per CDP unit on each axis; scrcpy rounds video sizes, so the axes differ slightly. */
  async #scale(sessionId: number): Promise<{ x: number; y: number } | null> {
    const video = this.#video;
    const screen = video && await this.#link.screenSize(sessionId);
    return video && screen ? { x: video.width / screen.width, y: video.height / screen.height } : null;
  }

  async #pick(message: Extract<HostMessage, { type: "pick" }>): Promise<void> {
    this.#setVideo(message);
    const sessionId = this.sessionId;
    // The host keeps sending hover picks until it hears that the picker is off; a click tells it again.
    if (sessionId === null || !this.#inspecting) {
      if (message.commit) this.#toHosts({ type: "inspect-mode", enabled: false });
      return;
    }
    // A click ends picking at once, so later or slower hover picks cannot draw a stale box, and the host
    // stops picking while the node is looked up.
    if (message.commit) this.reset();
    const serial = ++this.#pickSerial;
    const scale = await this.#scale(sessionId);
    const hit = scale
      && await this.#link.nodeAt(
        Math.round(message.x / scale.x),
        Math.round(message.y / scale.y),
        sessionId,
        this.#newestAtAttach ?? sessionId,
      );
    if (!message.commit) {
      if (!this.#inspecting || serial !== this.#pickSerial) return;
      if (hit && !sameNode(hit, this.#highlighted)) await this.#highlight(hit);
      // Native UI without nodes leaves no box behind.
      else if (!hit && this.#highlighted) this.#clearHighlight();
      return;
    }
    const shown = [...this.frontends].filter(frontend => frontend.sessionId === (hit ? hit.sessionId : sessionId));
    if (!hit) {
      // Nothing to select there; turn the frontend's picker button off as well.
      for (const frontend of shown) frontend.inject({ method: "Overlay.inspectModeCanceled" });
    } else if (shown.length === 0) {
      this.#pendingReveal = hit;
      this.#toHosts({ type: "open-session", sessionId: hit.sessionId });
    } else {
      // The frontend also turns its picker button off when it reveals the node.
      for (const frontend of shown) revealNode(frontend, hit);
    }
  }

  #clearHighlight(): void {
    this.#highlighted = null;
    this.#pickSerial++;
    this.#toHosts({ type: "highlight", box: null });
  }

  async #highlight(node: NodeRef): Promise<void> {
    this.#highlighted = node;
    // A WebView reports boxes in its own coordinates; the host cannot place them on the screen.
    const scale = this.#link.isLynxSession(node.sessionId) ? await this.#scale(node.sessionId) : null;
    const bounds = scale && await this.#link.borderBounds(node);
    if (this.#highlighted !== node) return;
    this.#toHosts({
      type: "highlight",
      box: scale && bounds
        ? {
          x: bounds.left * scale.x,
          y: bounds.top * scale.y,
          width: (bounds.right - bounds.left) * scale.x,
          height: (bounds.bottom - bounds.top) * scale.y,
        }
        : null,
    });
  }

  #toHosts(message: GatewayMessage): void {
    for (const host of this.hosts) sendJson(host, message);
  }
}

function revealNode(frontend: LynxCdpAdapter, node: NodeRef): void {
  // inspectNodeRequested only takes a backendNodeId. ponytail: a node known only by its nodeId passes
  // that number, which Lynx accepts; resolve it with DOM.describeNode if a runtime keeps them apart.
  frontend.inject({
    method: "Overlay.inspectNodeRequested",
    params: { backendNodeId: node.backendNodeId ?? node.nodeId },
  });
}

/** Lynx reports `{nodeId: 0}` when no node is at a location. */
function nodeRef(sessionId: number, params: Record<string, unknown> | undefined): NodeRef | null {
  const [nodeId, backendNodeId] = [params?.["nodeId"], params?.["backendNodeId"]].map(id =>
    typeof id === "number" && id > 0 ? id : undefined
  );
  return nodeId || backendNodeId ? { sessionId, nodeId, backendNodeId } : null;
}

function sameNode(a: NodeRef, b: NodeRef | null): boolean {
  return a.sessionId === b?.sessionId && a.nodeId === b.nodeId && a.backendNodeId === b.backendNodeId;
}

/** Without a host page, the upstream screencast view draws the overlay itself. */
function standaloneLocalResult(message: CdpMessage): Record<string, unknown> | undefined {
  return OVERLAY_METHODS.has(message.method ?? "") ? {} : lynxLocalResult(message);
}

/**
 * Lynx announces the main-thread target only to the first client of a runtime and sometimes
 * omits the background-thread context right after an App start. Make each frontend see both.
 * ponytail: assumes a device announcement, when it happens at all, arrives within 1.5 s.
 */
async function repairLynxTargets(
  frontend: LynxCdpAdapter,
  signal: AbortSignal,
  main: { announced: () => boolean; onInjected: () => void },
): Promise<void> {
  try {
    await delay(1_500, undefined, { signal });
    if (!main.announced()) {
      const probe = await frontend.request("Runtime.evaluate", { expression: "0", returnByValue: true }, "Main", 2_000);
      // The App may have announced the target while the probe was out.
      if (!signal.aborted && !probe.error && !main.announced()) {
        main.onInjected();
        frontend.inject({
          method: "Target.attachedToTarget",
          params: {
            sessionId: "Main",
            targetInfo: {
              attached: true,
              canAccessOpener: false,
              targetId: "Main",
              title: "Main",
              type: "worker",
              url: "",
            },
            waitingForDebugger: false,
          },
        });
      }
    }
    await delay(2_500, undefined, { signal });
    if (!frontend.seen.has("Runtime.executionContextCreated@")) void frontend.request("Runtime.enable");
  } catch {
    // The frontend disconnected.
  }
}

function parseHostMessage(raw: string): HostMessage | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const { type, x, y, videoWidth, videoHeight, commit } = value;
  if (type === "clear-highlight" || type === "cancel-inspect") return { type };
  if (!isPositive(videoWidth) || !isPositive(videoHeight)) return null;
  if (type === "video-size") return { type, videoWidth, videoHeight };
  if (type === "pick" && Number.isFinite(x) && Number.isFinite(y) && typeof commit === "boolean") {
    return { type, x: x as number, y: y as number, videoWidth, videoHeight, commit };
  }
  return null;
}

function sendJson(ws: WebSocket, message: unknown): void {
  if (ws.readyState !== ws.OPEN) return;
  if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
    closeSocket(ws, 1013, "Client is not consuming messages");
    return;
  }
  ws.send(JSON.stringify(message));
}

/** Close reasons are limited to 123 bytes. */
function closeSocket(ws: WebSocket, code: number, reason: string): void {
  let text = reason;
  while (Buffer.byteLength(text) > 123) text = text.slice(0, -1);
  ws.close(code, text);
}

function area(bounds: Bounds): number {
  return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
