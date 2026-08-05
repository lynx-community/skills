// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomUUID } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createDebug } from 'obug';
import { type WebSocket, WebSocketServer } from 'ws';
import { throwClientDiscoveryFailures } from '../client-discovery-errors.ts';
import { ClientId, type ClientTarget } from '../client-id.ts';
import { ActionCore } from '../command/core.ts';
import { decodeCommandQuery } from '../command/query.ts';
import { Connector } from '../index.ts';
import { DaemonTransport } from '../transport/daemon.ts';
import type { Device, Transport } from '../transport/transport.ts';
import {
  DeviceConnection,
  type DeviceConnectionSubscriber,
} from './device-connection.ts';
import {
  type ClientListEntry,
  type ControlRequest,
  type CustomizedMessage,
  DAEMON_COMMAND_PATH_PREFIX,
  DAEMON_COMMAND_PROTOCOL_VERSION,
  DAEMON_LIFECYCLE_PROTOCOL_VERSION,
  DAEMON_PRODUCT,
  DAEMON_SHUTDOWN_PATH,
  DAEMON_VERSION_PATH,
  DAEMON_WS_PATH,
  type DaemonShutdownRequest,
  isControlRequest,
  isCustomizedMessage,
  isListClientsRequest,
  isPingEvent,
  isRegisterEvent,
} from './protocol.ts';
import { StaticServer } from './static-server.ts';
import { CONNECTOR_VERSION } from './version.ts';

const debug = createDebug('devtool-mcp-server:daemon:server');

const IDLE_TIMEOUT_MS = 300_000;
/** Grace period before disposing an unsubscribed device connection. */
const DEVICE_CONN_GRACE_MS = 10_000;
const DEVICE_DISCOVERY_TIMEOUT_MS = 2_500;
const DEVICE_CONN_SETUP_TIMEOUT_MS = 5_000;

interface WsClientSession extends DeviceConnectionSubscriber {
  readonly id: number;
  readonly isClosing: boolean;
  /** Which device connections this client is subscribed to. */
  readonly subscriptions: Set<DeviceConnection>;
  send(message: unknown): void;
  close(): void;
}

/**
 * The daemon process. Holds real transports, manages persistent device
 * connections, and exposes a WebSocket server for DaemonTransport clients.
 */
export class DevtoolDaemon {
  #httpServer: http.Server;
  #wss: WebSocketServer | null = null;
  #transports: Transport[];
  #deviceConnections = new Map<string, DeviceConnection>();
  #pendingDeviceConnections = new Map<string, Promise<DeviceConnection>>();
  #deviceConnectionCleanupTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  #wsClients = new Map<number, WsClientSession>();
  #commandControllers = new Set<AbortController>();
  #nextClientId = 0;
  #activeCommandRequests = 0;
  #idleTimer: ReturnType<typeof setTimeout> | null = null;
  #idleTimeoutMs: number;
  #closed = false;
  #closePromise: Promise<void> | null = null;
  #shutdownAccepted = false;
  #onIdle: (() => void) | undefined;
  #onShutdown: (() => void) | undefined;
  #staticServer = new StaticServer();
  #actionCore = new ActionCore();
  #commandConnector: Connector | null = null;
  readonly #instanceId = randomUUID();
  readonly #startedAt = Date.now();

  constructor(
    transports: Transport[],
    options?: {
      onIdle?: () => void;
      onShutdown?: () => void;
      idleTimeoutMs?: number;
    },
  ) {
    this.#transports = transports;
    this.#onIdle = options?.onIdle;
    this.#onShutdown = options?.onShutdown;
    this.#idleTimeoutMs = options?.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
    this.#httpServer = http.createServer((req, res) => {
      const isCommandRequest = this.#isCommandRequest(req.url);
      const isShutdownRequest = this.#isShutdownRequest(req.url);
      if (
        (isCommandRequest || isShutdownRequest) &&
        !this.#isTrustedLocalRequest(req)
      ) {
        this.#sendJson(res, 403, {
          ok: false,
          error:
            'Daemon control requests require a same-origin loopback Host and Origin.',
        });
        return;
      }
      if (
        isCommandRequest &&
        req.method === 'POST' &&
        !this.#hasJsonContentType(req)
      ) {
        this.#sendJson(res, 415, {
          ok: false,
          error:
            'POST /command requests require Content-Type: application/json.',
        });
        return;
      }

      if (req.method === 'GET' && this.#isVersionRequest(req.url)) {
        this.#sendJson(res, 200, {
          product: DAEMON_PRODUCT,
          version: CONNECTOR_VERSION,
          lifecycleProtocol: DAEMON_LIFECYCLE_PROTOCOL_VERSION,
          commandProtocol: DAEMON_COMMAND_PROTOCOL_VERSION,
          instanceId: this.#instanceId,
          startedAt: this.#startedAt,
        });
        return;
      }

      if (this.#staticServer.tryHandle(req, res)) {
        return;
      }

      if (
        req.method === 'POST' &&
        isCommandRequest &&
        this.#acceptsEventStream(req)
      ) {
        this.#trackCommandRequest(() => this.#handleCommandStream(req, res));
        return;
      }

      if (req.method === 'POST' && isCommandRequest) {
        this.#trackCommandRequest(() => this.#handleCommandRequest(req, res));
        return;
      }

      if (req.method === 'GET' && isCommandRequest) {
        this.#trackCommandRequest(() => this.#handleCommandStream(req, res));
        return;
      }

      if (req.method === 'POST' && isShutdownRequest) {
        void this.#handleShutdownRequest(req, res);
        return;
      }

      res.writeHead(404);
      res.end();
    });
  }

  async start(port: number): Promise<number> {
    const wss = new WebSocketServer({ noServer: true });
    this.#wss = wss;

    this.#httpServer.on('upgrade', (request, socket, head) => {
      if (
        this.#closed ||
        !request.url?.startsWith(DAEMON_WS_PATH) ||
        !this.#isTrustedLocalRequest(request)
      ) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        if (this.#closed) {
          ws.terminate();
          return;
        }
        this.#handleConnection(ws);
      });
    });

    return new Promise<number>((resolve, reject) => {
      this.#httpServer.once('error', reject);
      this.#httpServer.listen(port, '127.0.0.1', () => {
        this.#httpServer.removeListener('error', reject);
        this.#resetIdleTimer();
        const address = this.#httpServer.address() as AddressInfo;
        // ActionCore must use the daemon transport too. Routing back through
        // the loopback WebSocket adds a short-lived local subscriber while the
        // server reuses its pooled DeviceConnection, instead of opening a
        // second raw Android/iOS connection to the same debug-router target.
        this.#commandConnector = new Connector([
          new DaemonTransport(address.port),
        ]);
        debug(
          'daemon listening on ws://127.0.0.1:%d%s',
          address.port,
          DAEMON_WS_PATH,
        );
        resolve(address.port);
      });
    });
  }

  close(): Promise<void> {
    this.#closePromise ??= this.#close();
    return this.#closePromise;
  }

  async #close(): Promise<void> {
    this.#closed = true;
    this.#clearIdleTimer();

    for (const controller of this.#commandControllers) {
      controller.abort(new Error('Connector daemon is shutting down.'));
    }
    this.#commandControllers.clear();

    for (const [, client] of this.#wsClients) {
      client.close();
    }
    this.#wsClients.clear();
    for (const ws of this.#wss?.clients ?? []) {
      ws.terminate();
    }

    for (const [, timer] of this.#deviceConnectionCleanupTimers) {
      clearTimeout(timer);
    }
    this.#deviceConnectionCleanupTimers.clear();

    const shutdownResults = await Promise.allSettled([
      ...Array.from(this.#deviceConnections.values(), (conn) => conn.dispose()),
      ...this.#pendingDeviceConnections.values(),
      ...this.#transports.map((transport) =>
        Promise.resolve().then(() => transport.close()),
      ),
    ]);
    for (const result of shutdownResults) {
      if (result.status === 'rejected') {
        debug(
          'device connection did not settle cleanly during daemon shutdown: %O',
          result.reason,
        );
      }
    }
    const lateDisposalResults = await Promise.allSettled(
      Array.from(this.#deviceConnections.values(), (conn) => conn.dispose()),
    );
    for (const result of lateDisposalResults) {
      if (result.status === 'rejected') {
        debug(
          'failed to dispose late device connection during daemon shutdown: %O',
          result.reason,
        );
      }
    }
    this.#deviceConnections.clear();

    this.#wss?.close();
    return new Promise<void>((resolve) => {
      this.#httpServer.close(() => resolve());
    });
  }

  // ---------------------------------------------------------------------------
  // WebSocket client lifecycle
  // ---------------------------------------------------------------------------

  #isVersionRequest(url: string | undefined): boolean {
    return (
      new URL(url ?? '/', 'http://127.0.0.1').pathname === DAEMON_VERSION_PATH
    );
  }

  #isShutdownRequest(url: string | undefined): boolean {
    return (
      new URL(url ?? '/', 'http://127.0.0.1').pathname === DAEMON_SHUTDOWN_PATH
    );
  }

  #isCommandRequest(url: string | undefined): boolean {
    return new URL(url ?? '/', 'http://127.0.0.1').pathname.startsWith(
      DAEMON_COMMAND_PATH_PREFIX,
    );
  }

  #isTrustedLocalRequest(req: http.IncomingMessage): boolean {
    const host = req.headers.host;
    if (!host) return false;

    let requestOrigin: URL;
    try {
      requestOrigin = new URL(`http://${host}`);
    } catch {
      return false;
    }
    if (
      requestOrigin.hostname !== '127.0.0.1' &&
      requestOrigin.hostname !== 'localhost'
    ) {
      return false;
    }

    const origin = req.headers.origin;
    if (!origin) return true;
    try {
      const originUrl = new URL(origin);
      return (
        originUrl.protocol === 'http:' &&
        originUrl.host.toLowerCase() === requestOrigin.host.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  #hasJsonContentType(req: http.IncomingMessage): boolean {
    return (
      req.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase() ===
      'application/json'
    );
  }

  #acceptsEventStream(req: http.IncomingMessage): boolean {
    const accept = req.headers.accept;
    const values: readonly string[] = Array.isArray(accept)
      ? accept
      : [accept ?? ''];
    return values.some((value) =>
      value
        .split(',')
        .some((mediaType: string) =>
          mediaType.trim().toLowerCase().startsWith('text/event-stream'),
        ),
    );
  }

  async #handleShutdownRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    let parsed: unknown;
    try {
      const body = await this.#readBody(req);
      parsed = body.trim() === '' ? {} : JSON.parse(body);
    } catch (error) {
      this.#sendJson(res, 400, {
        ok: false,
        error: `Invalid shutdown request: ${error instanceof Error ? error.message : String(error)}`,
      });
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      this.#sendJson(res, 400, {
        ok: false,
        error: 'Shutdown request body must be a JSON object.',
      });
      return;
    }

    const { expectedInstanceId } = parsed as Partial<DaemonShutdownRequest>;
    if (typeof expectedInstanceId !== 'string' || expectedInstanceId === '') {
      this.#sendJson(res, 428, {
        ok: false,
        error: 'Shutdown requires the expected daemon instance ID.',
      });
      return;
    }
    if (expectedInstanceId !== this.#instanceId) {
      this.#sendJson(res, 409, {
        ok: false,
        error: 'Daemon instance changed before shutdown.',
        instanceId: this.#instanceId,
      });
      return;
    }

    if (this.#shutdownAccepted) {
      this.#sendJson(res, 202, { ok: true, alreadyStopping: true });
      return;
    }
    this.#shutdownAccepted = true;

    this.#sendJson(res, 202, { ok: true }, () => {
      void this.close()
        .catch((err: unknown) => {
          debug('failed to close daemon after shutdown request: %O', err);
        })
        .finally(() => {
          this.#onShutdown?.();
        });
    });
  }

  async #handleCommandRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    let action: string;
    try {
      action = decodeURIComponent(
        pathname.slice(DAEMON_COMMAND_PATH_PREFIX.length),
      );
    } catch {
      this.#sendJson(res, 400, {
        ok: false,
        action: '',
        error: {
          message: 'Command action path contains invalid percent encoding.',
          reason: 'bad-path',
          recoverable: false,
          nextActions: [],
        },
      });
      return;
    }

    const controller = new AbortController();
    this.#commandControllers.add(controller);
    const onDisconnect = () =>
      controller.abort(new Error('HTTP command client disconnected.'));
    req.once('aborted', onDisconnect);
    res.once('close', onDisconnect);

    try {
      let params: Record<string, unknown> = {};
      try {
        const body = await this.#readBody(req, controller.signal);
        if (body.trim() !== '') {
          const parsed: unknown = JSON.parse(body);
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            this.#sendJson(res, 200, {
              ok: false,
              action,
              error: {
                message: 'Request body must be a JSON object.',
                reason: 'bad-params',
                recoverable: false,
                nextActions: [],
              },
            });
            return;
          }
          params = parsed as Record<string, unknown>;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        this.#sendJson(res, 200, {
          ok: false,
          action,
          error: {
            message: `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`,
            reason: 'bad-params',
            recoverable: false,
            nextActions: [],
          },
        });
        return;
      }

      const result = await this.#actionCore.execute(
        action,
        params,
        { connector: this.#requireCommandConnector() },
        controller.signal,
      );
      if (!controller.signal.aborted && !res.destroyed)
        this.#sendJson(res, 200, result);
    } finally {
      req.off('aborted', onDisconnect);
      res.off('close', onDisconnect);
      this.#commandControllers.delete(controller);
    }
  }

  /** Stream `wait` progress and its final result as Server-Sent Events. */
  async #handleCommandStream(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    let action: string;
    try {
      action = decodeURIComponent(
        url.pathname.slice(DAEMON_COMMAND_PATH_PREFIX.length),
      );
    } catch {
      this.#sendJson(res, 400, {
        ok: false,
        action: '',
        error: {
          message: 'Command action path contains invalid percent encoding.',
          reason: 'bad-path',
          recoverable: false,
          nextActions: [],
        },
      });
      return;
    }

    if (!this.#actionCore.hasStream(action)) {
      this.#sendJson(res, 404, {
        ok: false,
        action,
        error: {
          message: `Unknown stream action: ${action}`,
          reason: 'unknown-action',
          recoverable: false,
          nextActions: this.#actionCore
            .streamActions()
            .map((name) => `GET /command/${name}`),
        },
      });
      return;
    }

    const controller = new AbortController();
    this.#commandControllers.add(controller);
    const onDisconnect = () =>
      controller.abort(new Error('SSE command client disconnected.'));
    req.once('aborted', onDisconnect);
    res.once('close', onDisconnect);

    try {
      let params: Record<string, unknown>;
      try {
        params =
          req.method === 'POST'
            ? await this.#readCommandStreamBody(req, controller.signal)
            : decodeCommandQuery(url.searchParams);
      } catch (error) {
        if (controller.signal.aborted) return;
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store',
          connection: 'keep-alive',
        });
        res.end(
          `data: ${JSON.stringify({
            ok: false,
            action,
            error: {
              message: `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`,
              reason: 'bad-params',
              recoverable: false,
              nextActions: [],
            },
          })}\n\n`,
        );
        return;
      }

      controller.signal.throwIfAborted();
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      });
      for await (const event of this.#actionCore.stream(
        action,
        params,
        { connector: this.#requireCommandConnector() },
        controller.signal,
      )) {
        if (controller.signal.aborted) break;
        if (!res.write(`data: ${JSON.stringify(event)}\n\n`)) {
          const drained = await this.#waitForDrain(res, controller.signal);
          if (!drained) break;
        }
      }
    } catch (error) {
      if (!controller.signal.aborted)
        debug('command stream %s failed: %O', action, error);
    } finally {
      req.off('aborted', onDisconnect);
      res.off('close', onDisconnect);
      this.#commandControllers.delete(controller);
      if (!res.destroyed && !res.writableEnded) res.end();
    }
  }

  #waitForDrain(
    res: http.ServerResponse,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (signal.aborted || res.destroyed) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (drained: boolean) => {
        if (settled) return;
        settled = true;
        res.off('drain', onDrain);
        res.off('close', onClose);
        res.off('error', onClose);
        signal.removeEventListener('abort', onAbort);
        resolve(drained);
      };
      const onDrain = () => finish(true);
      const onAbort = () => finish(false);
      const onClose = () => finish(false);
      res.once('drain', onDrain);
      res.once('close', onClose);
      res.once('error', onClose);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted || res.destroyed) finish(false);
    });
  }

  #requireCommandConnector(): Connector {
    if (!this.#commandConnector) {
      throw new Error(
        'Connector daemon has not started its command transport.',
      );
    }
    return this.#commandConnector;
  }

  #readBody(req: http.IncomingMessage, signal?: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      let settled = false;
      const maxSize = 8 * 1024 * 1024;

      const cleanup = () => {
        req.off('data', onData);
        req.off('end', onEnd);
        req.off('error', onError);
        req.off('aborted', onAborted);
        signal?.removeEventListener('abort', onSignalAbort);
      };
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const onData = (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxSize) {
          finish(() => reject(new Error('Request body exceeds 8 MiB.')));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      };
      const onEnd = () =>
        finish(() => resolve(Buffer.concat(chunks).toString('utf8')));
      const onError = (error: Error) => finish(() => reject(error));
      const onAborted = () =>
        finish(() => reject(new Error('Request body was aborted.')));
      const onSignalAbort = () => {
        finish(() =>
          reject(signal?.reason ?? new Error('Request was aborted.')),
        );
        if (!req.destroyed) req.destroy();
      };

      req.on('data', onData);
      req.once('end', onEnd);
      req.once('error', onError);
      req.once('aborted', onAborted);
      signal?.addEventListener('abort', onSignalAbort, { once: true });
      if (signal?.aborted) onSignalAbort();
    });
  }

  async #readCommandStreamBody(
    req: http.IncomingMessage,
    signal: AbortSignal,
  ): Promise<Record<string, unknown>> {
    const body = await this.#readBody(req, signal);
    if (body.trim() === '') return {};

    const parsed: unknown = JSON.parse(body);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error('Request body must be a JSON object.');
    }
    return parsed as Record<string, unknown>;
  }

  #sendJson(
    res: http.ServerResponse,
    statusCode: number,
    data: unknown,
    callback?: () => void,
  ): void {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
      'cache-control': 'no-store',
    });
    res.end(body, callback);
  }

  #trackCommandRequest(handler: () => Promise<void>): void {
    this.#activeCommandRequests += 1;
    this.#clearIdleTimer();
    void handler()
      .catch((error: unknown) => {
        debug('command request failed: %O', error);
      })
      .finally(() => {
        this.#activeCommandRequests -= 1;
        this.#resetIdleTimer();
      });
  }

  #handleConnection(ws: WebSocket): void {
    if (this.#closed) {
      ws.terminate();
      return;
    }
    const clientId = ++this.#nextClientId;
    debug('new ws client %d', clientId);
    this.#clearIdleTimer();

    let closing = false;
    const session: WsClientSession = {
      id: clientId,
      get isClosing() {
        return closing;
      },
      subscriptions: new Set(),
      send(message: unknown) {
        // ws.OPEN === 1
        if (!closing && ws.readyState === 1) {
          ws.send(JSON.stringify(message));
        }
      },
      close: () => {
        if (closing) return;
        closing = true;
        this.#wsClients.delete(clientId);
        ws.close(1001, 'device disconnected');
      },
    };

    // Standard debug-router handshake: send Initialize
    session.send({ event: 'Initialize', data: clientId });

    ws.on('message', (raw: Buffer | string) => {
      try {
        const msg: unknown = JSON.parse(String(raw));
        this.#handleMessage(session, msg);
      } catch (err) {
        debug('failed to parse message from client %d: %O', clientId, err);
      }
    });

    ws.on('close', () => {
      debug('ws client %d disconnected', clientId);
      closing = true;
      this.#wsClients.delete(clientId);

      for (const deviceConn of session.subscriptions) {
        deviceConn.removeSubscriber(clientId);
        if (!this.#closed && deviceConn.subscriberCount === 0) {
          this.#scheduleDeviceConnectionCleanup(deviceConn);
        }
      }
      session.subscriptions.clear();
      this.#resetIdleTimer();
    });

    ws.on('error', (err: Error) => {
      debug('ws client %d error: %O', clientId, err);
    });
  }

  // ---------------------------------------------------------------------------
  // Message dispatch
  // ---------------------------------------------------------------------------

  #handleMessage(session: WsClientSession, msg: unknown): void {
    if (session.isClosing) {
      debug('ignoring message from closing client %d', session.id);
      return;
    }
    if (this.#closed) {
      session.close();
      return;
    }
    if (isRegisterEvent(msg)) {
      this.#wsClients.set(session.id, session);
      debug('client %d registered', session.id);
      return;
    }
    if (isListClientsRequest(msg)) {
      void this.#sendClientList(session);
      return;
    }
    if (isPingEvent(msg)) {
      session.send({ event: 'Pong' });
      return;
    }
    if (isControlRequest(msg)) {
      void this.#handleControlRequest(session, msg);
      return;
    }
    if (isCustomizedMessage(msg)) {
      void this.#handleCustomizedMessage(session, msg);
      return;
    }
    debug('unknown message from client %d: %O', session.id, msg);
  }

  // ---------------------------------------------------------------------------
  // Customized message forwarding (Client → Device)
  // ---------------------------------------------------------------------------

  async #handleCustomizedMessage(
    session: WsClientSession,
    msg: CustomizedMessage,
  ): Promise<void> {
    // DaemonTransport sets `to` = port.
    // CustomizedClientIdTransformStream also sets client_id = port.
    const targetPort = msg.to ?? msg.data?.data?.client_id;
    if (typeof targetPort !== 'number' && typeof targetPort !== 'string') {
      debug('cannot determine target from message: %O', msg);
      return;
    }

    // Route to the device connection this client is subscribed to
    for (const deviceConn of session.subscriptions) {
      if (deviceConn.port === targetPort) {
        try {
          // Multiple daemon WS clients share one app-side debug-router port.
          // Keep the app's client id stable even when the upstream WS sender differs.
          await deviceConn.send({
            ...msg,
            data: {
              ...msg.data,
              sender: targetPort,
            },
          });
        } catch (err) {
          debug('failed to forward message to %s: %O', deviceConn.key, err);
        }
        return;
      }
    }

    debug(
      'no matching device connection for client %d, target %o',
      session.id,
      targetPort,
    );
  }

  // ---------------------------------------------------------------------------
  // Control RPC
  // ---------------------------------------------------------------------------

  async #handleControlRequest(
    session: WsClientSession,
    req: ControlRequest,
  ): Promise<void> {
    const { id, method, params } = req.data;

    try {
      let result: unknown;

      switch (method) {
        case 'listClients': {
          result = await this.#discoverClients();
          break;
        }

        case 'listDevices': {
          const devices: Device[] = [];
          const allResults = await Promise.allSettled(
            this.#transports.map((t) => t.listDevices()),
          );
          for (const r of allResults) {
            if (r.status === 'fulfilled') devices.push(...r.value);
          }
          result = devices;
          break;
        }

        case 'listAvailableApps': {
          const deviceId = (params as { deviceId?: string } | undefined)
            ?.deviceId;
          if (!deviceId) throw new Error('deviceId is required');
          const transport = await this.#findTransportWithDeviceId(deviceId);
          result = await transport.listAvailableApps(deviceId);
          break;
        }

        case 'openApp': {
          const p = (params ?? {}) as {
            deviceId?: string;
            packageName?: string;
            withDataCleared?: boolean;
          };
          if (!p.deviceId || !p.packageName)
            throw new Error('deviceId and packageName are required');
          const transport = await this.#findTransportWithDeviceId(p.deviceId);
          await transport.openApp(p.deviceId, p.packageName, {
            withDataCleared: p.withDataCleared,
          });
          result = null;
          break;
        }

        case 'subscribe': {
          const s = (params ?? {}) as {
            deviceId?: string;
            port?: ClientTarget;
          };
          if (!s.deviceId || s.port === undefined)
            throw new Error('deviceId and port are required');
          const key = `${s.deviceId}:${s.port}`;
          let conn = this.#deviceConnections.get(key);
          if (!conn || conn.isDisposed) {
            const transport = await this.#findTransportWithDeviceId(s.deviceId);
            conn = await this.#getOrCreateDeviceConnection(
              transport,
              s.deviceId,
              s.port,
            );
          } else {
            this.#clearDeviceConnectionCleanup(key);
          }
          if (
            session.isClosing ||
            this.#wsClients.get(session.id) !== session
          ) {
            if (conn.subscriberCount === 0)
              this.#scheduleDeviceConnectionCleanup(conn);
            throw new Error(
              `Daemon client ${session.id} disconnected before subscription`,
            );
          }
          conn.addSubscriber(session);
          session.subscriptions.add(conn);
          result = null;
          break;
        }

        default:
          throw new Error(`Unknown control method: ${method}`);
      }

      session.send({ event: 'ControlResponse', data: { id, result } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session.send({ event: 'ControlResponse', data: { id, error: message } });
    }
  }

  // ---------------------------------------------------------------------------
  // Client list discovery
  // ---------------------------------------------------------------------------

  async #sendClientList(session: WsClientSession): Promise<void> {
    try {
      const clients = await this.#discoverClients();
      session.send({ event: 'ClientList', data: clients });
    } catch (err) {
      debug('failed to send client list: %O', err);
      session.send({ event: 'ClientList', data: [] });
    }
  }

  async #discoverClients(): Promise<ClientListEntry[]> {
    const entries: ClientListEntry[] = [];
    const discoveryFailures: unknown[] = [];
    let lowerAuthorityFulfilled = false;

    // 0. Collect clients from transports that implement listClients().
    // These are added to the entries list but do NOT short-circuit discovery so
    // that real device clients (Android, iOS, etc.) are still discovered.
    const clientListTransports = this.#transports.filter(
      (
        t,
      ): t is Transport & {
        listClients(): Promise<{ id: string; info: Record<string, unknown> }[]>;
      } => typeof t.listClients === 'function',
    );
    const clientListResults = await Promise.allSettled(
      clientListTransports.map((t) => t.listClients()),
    );
    for (const r of clientListResults) {
      if (r.status === 'fulfilled') {
        lowerAuthorityFulfilled = true;
        for (const { id, info } of r.value) {
          entries.push({ id, info, type: 'runtime' });
        }
      } else {
        discoveryFailures.push(r.reason);
      }
    }

    // 1. Report already-connected device connections that completed handshake
    for (const [, conn] of this.#deviceConnections) {
      if (conn.appInfo && !conn.isDisposed) {
        const id = ClientId.serialize(conn.deviceId, conn.port);
        if (entries.some((e) => e.id === id)) continue;
        entries.push({
          id,
          info: conn.appInfo,
          type: 'runtime',
        });
      }
    }

    // 2. Probe unconnected ports on all discovered devices
    const allDevices: { transport: Transport; devices: Device[] }[] = [];
    const transportResults = await Promise.allSettled(
      this.#transports.map(async (transport) => ({
        transport,
        devices: await transport.listDevices(),
      })),
    );
    for (const r of transportResults) {
      if (r.status === 'fulfilled') {
        lowerAuthorityFulfilled = true;
        allDevices.push(r.value);
      } else {
        discoveryFailures.push(r.reason);
      }
    }

    const MIN_PORT = 8901;
    const PORTS = Array.from({ length: 10 }, (_, i) => MIN_PORT + i);
    const existingKeys = new Set(
      Array.from(this.#deviceConnections.entries())
        .filter(([, connection]) => !connection.isDisposed)
        .map(([key]) => key),
    );

    const probeResults = await Promise.allSettled(
      allDevices.flatMap(({ transport, devices }) =>
        devices.flatMap((device) =>
          PORTS.filter((port) => !existingKeys.has(`${device.id}:${port}`)).map(
            (port) =>
              this.#getOrCreateDeviceConnection(transport, device.id, port),
          ),
        ),
      ),
    );

    for (const r of probeResults) {
      if (r.status === 'fulfilled') {
        const conn = r.value;
        if (conn.appInfo && !conn.isDisposed) {
          const clientId = ClientId.serialize(conn.deviceId, conn.port);
          if (!entries.some((e) => e.id === clientId)) {
            entries.push({ id: clientId, info: conn.appInfo, type: 'runtime' });
          }
        }
      }
    }

    if (
      entries.length === 0 &&
      !lowerAuthorityFulfilled &&
      discoveryFailures.length > 0
    ) {
      throwClientDiscoveryFailures(discoveryFailures);
    }

    return entries;
  }

  // ---------------------------------------------------------------------------
  // Device connection pool
  // ---------------------------------------------------------------------------

  async #getOrCreateDeviceConnection(
    transport: Transport,
    deviceId: string,
    port: ClientTarget,
  ): Promise<DeviceConnection> {
    const key = `${deviceId}:${port}`;
    if (this.#closed) {
      throw new Error(
        `DevTool daemon closed while acquiring device connection ${key}`,
      );
    }
    this.#clearDeviceConnectionCleanup(key);
    const existing = this.#deviceConnections.get(key);
    if (existing && !existing.isDisposed) {
      return existing;
    }

    const pending = this.#pendingDeviceConnections.get(key);
    if (pending) {
      return await pending;
    }

    const connectionPromise = (async () => {
      if (existing) {
        await existing.dispose();
        if (this.#deviceConnections.get(key) === existing) {
          this.#deviceConnections.delete(key);
        }
      }
      if (this.#closed) {
        throw new Error(
          `DevTool daemon closed while acquiring device connection ${key}`,
        );
      }

      const setupAbortController = new AbortController();
      // The signal is passed into transports, so keep the setup deadline clearable.
      // AbortSignal.timeout() would abort later even after this pooled connection succeeds.
      const setupTimeout = setTimeout(() => {
        setupAbortController.abort(
          createDeviceConnectionSetupTimeoutError(key),
        );
      }, DEVICE_CONN_SETUP_TIMEOUT_MS);
      const registerAbortController = new AbortController();
      let registerTimeout: ReturnType<typeof setTimeout> | undefined;
      const conn = new DeviceConnection(transport, {
        deviceId,
        port,
        signal: setupAbortController.signal,
      });
      const connectPromise = conn.connect();

      try {
        await withAbortSignal(connectPromise, setupAbortController.signal);
        if (this.#closed) {
          throw new Error(
            `DevTool daemon closed while acquiring device connection ${key}`,
          );
        }
        // Trigger the Initialize handshake so the device sends back Register
        await withAbortSignal(
          conn.send({ event: 'Initialize', data: port }),
          setupAbortController.signal,
        );
        clearTimeout(setupTimeout);
        registerTimeout = setTimeout(() => {
          registerAbortController.abort(createDeviceRegisterTimeoutError(key));
        }, DEVICE_DISCOVERY_TIMEOUT_MS);
        await withAbortSignal(
          conn.waitUntilRegistered(),
          registerAbortController.signal,
        );
        if (conn.isDisposed) {
          throw new Error(
            `Device connection ${key} closed immediately after Register`,
          );
        }
        if (this.#closed) {
          throw new Error(
            `DevTool daemon closed while acquiring device connection ${key}`,
          );
        }
        this.#deviceConnections.set(key, conn);
        return conn;
      } catch (err) {
        debug('failed to connect to %s: %O', key, err);
        this.#deviceConnections.set(key, conn);
        void conn.dispose().catch((disposeError: unknown) => {
          debug(
            'failed to dispose device connection %s after setup failure: %O',
            key,
            disposeError,
          );
        });
        throw err;
      } finally {
        clearTimeout(setupTimeout);
        if (registerTimeout) clearTimeout(registerTimeout);
      }
    })().finally(() => {
      this.#pendingDeviceConnections.delete(key);
    });

    this.#pendingDeviceConnections.set(key, connectionPromise);
    return await connectionPromise;
  }

  #scheduleDeviceConnectionCleanup(conn: DeviceConnection): void {
    const { key } = conn;
    if (this.#deviceConnections.get(key) !== conn) {
      debug('skipping cleanup for stale connection %s', key);
      return;
    }
    if (conn.isPersistent) {
      // Drop any cleanup timer left over from a previous (non-persistent)
      // connection on this key, otherwise it could later dispose this
      // persistent connection — contradicting 'persistent is never cleaned up'.
      this.#clearDeviceConnectionCleanup(key);
      debug('skipping cleanup for persistent connection %s', key);
      return;
    }
    debug('scheduling cleanup for %s in %dms', key, DEVICE_CONN_GRACE_MS);
    this.#clearDeviceConnectionCleanup(key);

    const timer = setTimeout(() => {
      this.#deviceConnectionCleanupTimers.delete(key);
      if (
        this.#deviceConnections.get(key) === conn &&
        conn.subscriberCount === 0
      ) {
        debug('disposing idle device connection %s', key);
        void conn.dispose().then(
          () => {
            if (this.#deviceConnections.get(key) === conn) {
              this.#deviceConnections.delete(key);
            }
          },
          (err: unknown) => {
            debug('failed to retire idle device connection %s: %O', key, err);
          },
        );
      }
    }, DEVICE_CONN_GRACE_MS);

    this.#deviceConnectionCleanupTimers.set(key, timer);
  }

  #clearDeviceConnectionCleanup(key: string): void {
    const timer = this.#deviceConnectionCleanupTimers.get(key);
    if (!timer) return;

    clearTimeout(timer);
    this.#deviceConnectionCleanupTimers.delete(key);
  }

  async #findTransportWithDeviceId(deviceId: string): Promise<Transport> {
    for (const transport of this.#transports) {
      try {
        const devices = await transport.listDevices();
        if (devices.some(({ id }) => id === deviceId)) return transport;
      } catch {
        // skip
      }
    }
    throw new Error(`Device with id: ${deviceId} not found`);
  }

  // ---------------------------------------------------------------------------
  // Idle auto-shutdown
  // ---------------------------------------------------------------------------

  #resetIdleTimer(): void {
    this.#clearIdleTimer();
    if (
      this.#wsClients.size === 0 &&
      this.#activeCommandRequests === 0 &&
      !this.#closed
    ) {
      debug(
        'no clients connected, starting idle timer (%dms)',
        this.#idleTimeoutMs,
      );
      this.#idleTimer = setTimeout(() => {
        if (this.#wsClients.size === 0 && this.#activeCommandRequests === 0) {
          debug('idle timeout reached, shutting down daemon');
          this.#onIdle?.();
        }
      }, this.#idleTimeoutMs);
    }
  }

  #clearIdleTimer(): void {
    if (this.#idleTimer) {
      clearTimeout(this.#idleTimer);
      this.#idleTimer = null;
    }
  }
}

function createDeviceConnectionSetupTimeoutError(key: string): Error {
  return new Error(
    `Timed out setting up device connection ${key} after ${DEVICE_CONN_SETUP_TIMEOUT_MS}ms`,
  );
}

function createDeviceRegisterTimeoutError(key: string): Error {
  return new Error(
    `Timed out waiting for Register from device connection ${key} after ${DEVICE_DISCOVERY_TIMEOUT_MS}ms`,
  );
}

async function withAbortSignal<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();

  return await new Promise<T>((resolve, reject) => {
    const abortHandler = () => {
      reject(signal.reason ?? new Error('The operation was aborted'));
    };

    signal.addEventListener('abort', abortHandler, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abortHandler);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abortHandler);
        reject(error);
      },
    );
  });
}
