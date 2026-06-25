// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDebug } from 'obug';
import { type WebSocket, WebSocketServer } from 'ws';
import { ClientId } from '../client-id.ts';
import type { Device, Transport } from '../transport/transport.ts';
import {
  DeviceConnection,
  type DeviceConnectionSubscriber,
} from './device-connection.ts';
import {
  type ClientListEntry,
  type ControlRequest,
  type CustomizedMessage,
  DAEMON_SHUTDOWN_PATH,
  DAEMON_VERSION_PATH,
  DAEMON_WS_PATH,
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
const DEVICE_CONN_DISPOSE_TIMEOUT_MS = 1_000;

interface WsClientSession extends DeviceConnectionSubscriber {
  readonly id: number;
  /** Which device connections this client is subscribed to. */
  readonly subscriptions: Set<string>;
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
  #nextClientId = 0;
  #idleTimer: ReturnType<typeof setTimeout> | null = null;
  #closed = false;
  #onIdle: (() => void) | undefined;
  #onShutdown: (() => void) | undefined;
  #staticServer = new StaticServer();

  constructor(
    transports: Transport[],
    options?: { onIdle?: () => void; onShutdown?: () => void },
  ) {
    this.#transports = transports;
    this.#onIdle = options?.onIdle;
    this.#onShutdown = options?.onShutdown;
    this.#httpServer = http.createServer((req, res) => {
      if (req.method === 'GET' && this.#isVersionRequest(req.url)) {
        this.#sendJson(res, 200, { version: CONNECTOR_VERSION });
        return;
      }

      if (this.#staticServer.tryHandle(req, res)) {
        return;
      }

      if (req.method === 'POST' && this.#isShutdownRequest(req.url)) {
        this.#sendJson(res, 202, { ok: true }, () => {
          void this.close()
            .catch((err: unknown) => {
              debug('failed to close daemon after shutdown request: %O', err);
            })
            .finally(() => {
              this.#onShutdown?.();
            });
        });
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
      if (!request.url?.startsWith(DAEMON_WS_PATH)) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        this.#handleConnection(ws);
      });
    });

    return new Promise<number>((resolve, reject) => {
      this.#httpServer.once('error', reject);
      this.#httpServer.listen(port, '127.0.0.1', () => {
        this.#httpServer.removeListener('error', reject);
        this.#resetIdleTimer();
        const address = this.#httpServer.address() as AddressInfo;
        debug(
          'daemon listening on ws://127.0.0.1:%d%s',
          address.port,
          DAEMON_WS_PATH,
        );
        resolve(address.port);
      });
    });
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#clearIdleTimer();

    for (const [, client] of this.#wsClients) {
      client.close();
    }
    this.#wsClients.clear();

    for (const [, conn] of this.#deviceConnections) {
      await conn.dispose();
    }
    this.#deviceConnections.clear();

    for (const [, timer] of this.#deviceConnectionCleanupTimers) {
      clearTimeout(timer);
    }
    this.#deviceConnectionCleanupTimers.clear();

    for (const transport of this.#transports) {
      await transport.close();
    }

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

  #handleConnection(ws: WebSocket): void {
    const clientId = ++this.#nextClientId;
    debug('new ws client %d', clientId);
    this.#clearIdleTimer();

    const session: WsClientSession = {
      id: clientId,
      subscriptions: new Set(),
      send(message: unknown) {
        // ws.OPEN === 1
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(message));
        }
      },
      close() {
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
      this.#wsClients.delete(clientId);

      for (const key of session.subscriptions) {
        const deviceConn = this.#deviceConnections.get(key);
        if (!deviceConn) continue;
        deviceConn.removeSubscriber(clientId);
        if (deviceConn.subscriberCount === 0) {
          this.#scheduleDeviceConnectionCleanup(key);
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
    if (typeof targetPort !== 'number') {
      debug('cannot determine target port from message: %O', msg);
      return;
    }

    // Route to the device connection this client is subscribed to
    for (const key of session.subscriptions) {
      const deviceConn = this.#deviceConnections.get(key);
      if (deviceConn && deviceConn.port === targetPort) {
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
          debug('failed to forward message to %s: %O', key, err);
        }
        return;
      }
    }

    debug(
      'no matching device connection for client %d, port %d',
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
          const s = (params ?? {}) as { deviceId?: string; port?: number };
          if (!s.deviceId || s.port === undefined)
            throw new Error('deviceId and port are required');
          const transport = await this.#findTransportWithDeviceId(s.deviceId);
          const conn = await this.#getOrCreateDeviceConnection(
            transport,
            s.deviceId,
            s.port,
          );
          conn.addSubscriber(session);
          session.subscriptions.add(conn.key);
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

    // 0. Collect clients from transports with listClients() capability.
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
        for (const { id, info } of r.value) {
          entries.push({ id, info, type: 'runtime' });
        }
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
      this.#transports
        .filter((transport) => typeof transport.listClients !== 'function')
        .map(async (transport) => ({
          transport,
          devices: await transport.listDevices(),
        })),
    );
    for (const r of transportResults) {
      if (r.status === 'fulfilled') allDevices.push(r.value);
    }

    const MIN_PORT = 8901;
    const PORTS = Array.from({ length: 10 }, (_, i) => MIN_PORT + i);
    const existingKeys = new Set(this.#deviceConnections.keys());

    const probeResults = await Promise.allSettled(
      allDevices.flatMap(({ transport, devices }) =>
        devices.flatMap((device) =>
          PORTS.filter((port) => !existingKeys.has(`${device.id}:${port}`)).map(
            async (port) => {
              const conn = await this.#getOrCreateDeviceConnection(
                transport,
                device.id,
                port,
              );
              // Match direct transport discovery timeout so cold-start daemon scans
              // do not give up before the device finishes the Initialize/Register handshake.
              const deadline = Date.now() + DEVICE_DISCOVERY_TIMEOUT_MS;
              while (
                !conn.appInfo &&
                !conn.isDisposed &&
                Date.now() < deadline
              ) {
                await new Promise<void>((resolve) => setTimeout(resolve, 100));
              }
              return conn;
            },
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

    return entries;
  }

  // ---------------------------------------------------------------------------
  // Device connection pool
  // ---------------------------------------------------------------------------

  async #getOrCreateDeviceConnection(
    transport: Transport,
    deviceId: string,
    port: number,
  ): Promise<DeviceConnection> {
    const key = `${deviceId}:${port}`;
    const existing = this.#deviceConnections.get(key);
    if (existing && !existing.isDisposed) {
      this.#clearDeviceConnectionCleanup(key);
      return existing;
    }

    const pending = this.#pendingDeviceConnections.get(key);
    if (pending) {
      return await pending;
    }

    const connectionPromise = (async () => {
      const setupAbortController = new AbortController();
      // The signal is passed into transports, so keep the setup deadline clearable.
      // AbortSignal.timeout() would abort later even after this pooled connection succeeds.
      const setupTimeout = setTimeout(() => {
        setupAbortController.abort(
          createDeviceConnectionSetupTimeoutError(key),
        );
      }, DEVICE_CONN_SETUP_TIMEOUT_MS);
      const conn = new DeviceConnection(transport, {
        deviceId,
        port,
        signal: setupAbortController.signal,
      });
      const connectPromise = conn.connect();

      try {
        await withAbortSignal(connectPromise, setupAbortController.signal);
        // Trigger the Initialize handshake so the device sends back Register
        await withAbortSignal(
          conn.send({ event: 'Initialize', data: port }),
          setupAbortController.signal,
        );
        this.#deviceConnections.set(key, conn);
        return conn;
      } catch (err) {
        debug('failed to connect to %s: %O', key, err);
        this.#deviceConnections.delete(key);
        await this.#disposeDeviceConnectionBestEffort(key, conn);
        throw err;
      } finally {
        clearTimeout(setupTimeout);
        this.#pendingDeviceConnections.delete(key);
      }
    })();

    this.#pendingDeviceConnections.set(key, connectionPromise);
    return await connectionPromise;
  }

  async #disposeDeviceConnectionBestEffort(
    key: string,
    conn: DeviceConnection,
  ): Promise<void> {
    const timeoutAbortController = new AbortController();
    const disposePromise = conn.dispose().catch((err: unknown) => {
      debug(
        'failed to dispose device connection %s after setup failure: %O',
        key,
        err,
      );
    });
    const timeoutPromise = sleep(DEVICE_CONN_DISPOSE_TIMEOUT_MS, undefined, {
      signal: timeoutAbortController.signal,
    }).then(() => {
      throw new Error(`Timed out disposing failed device connection ${key}`);
    });

    try {
      await Promise.race([disposePromise, timeoutPromise]);
    } catch (err) {
      debug('best-effort dispose for %s did not complete: %O', key, err);
    } finally {
      timeoutAbortController.abort();
    }
  }

  #scheduleDeviceConnectionCleanup(key: string): void {
    const conn = this.#deviceConnections.get(key);
    if (conn?.isPersistent) {
      // Drop any cleanup timer left over from a previous (non-persistent)
      // connection on this key, otherwise it could later dispose this
      // persistent connection — contradicting "persistent is never cleaned up".
      this.#clearDeviceConnectionCleanup(key);
      debug('skipping cleanup for persistent connection %s', key);
      return;
    }
    debug('scheduling cleanup for %s in %dms', key, DEVICE_CONN_GRACE_MS);
    this.#clearDeviceConnectionCleanup(key);

    const timer = setTimeout(() => {
      this.#deviceConnectionCleanupTimers.delete(key);
      const conn = this.#deviceConnections.get(key);
      if (conn && conn.subscriberCount === 0) {
        debug('disposing idle device connection %s', key);
        this.#deviceConnections.delete(key);
        void conn.dispose();
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
    if (this.#wsClients.size === 0 && !this.#closed) {
      debug(
        'no clients connected, starting idle timer (%dms)',
        IDLE_TIMEOUT_MS,
      );
      this.#idleTimer = setTimeout(() => {
        if (this.#wsClients.size === 0) {
          debug('idle timeout reached, shutting down daemon');
          this.#onIdle?.();
        }
      }, IDLE_TIMEOUT_MS);
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
