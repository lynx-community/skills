import * as __rspack_external_node_http_2dc67212 from "node:http";
import * as __rspack_external_node_url_e96de089 from "node:url";
import { __webpack_require__ } from "./rslib-runtime.mjs";
import "./374.mjs";
import "./10.mjs";
__webpack_require__.add({
    "../../mcp-servers/devtool-connector/src/daemon/device-connection.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Z: ()=>DeviceConnection
        });
        var obug__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/obug@2.1.3/node_modules/obug/dist/node.js");
        var _types_ts__rspack_import_1 = __webpack_require__("../../mcp-servers/devtool-connector/src/types.ts");
        const debug = (0, obug__rspack_import_0.U)('devtool-mcp-server:daemon:device-connection');
        class DeviceConnection {
            key;
            deviceId;
            port;
            #conn = null;
            #writer = null;
            #subscribers = new Map();
            #transport;
            #options;
            #disposed = false;
            #readLoopPromise = null;
            appInfo = null;
            constructor(transport, options){
                this.#transport = transport;
                this.#options = options;
                this.deviceId = options.deviceId;
                this.port = options.port;
                this.key = `${options.deviceId}:${options.port}`;
            }
            async connect() {
                debug('connecting to %s', this.key);
                if (this.#disposed) throw new Error(`DeviceConnection ${this.key} was disposed before connect started`);
                const conn = await this.#transport.connect(this.#options);
                if (this.#disposed) {
                    await conn[Symbol.asyncDispose]();
                    throw new Error(`DeviceConnection ${this.key} was disposed before connect completed`);
                }
                this.#conn = conn;
                this.#writer = this.#conn.writable.getWriter();
                this.#readLoopPromise = this.#readLoop();
                debug('connected to %s', this.key);
            }
            addSubscriber(subscriber) {
                this.#subscribers.set(subscriber.id, subscriber);
                debug('subscriber %d added to %s (total: %d)', subscriber.id, this.key, this.#subscribers.size);
            }
            removeSubscriber(id) {
                this.#subscribers.delete(id);
                debug('subscriber %d removed from %s (total: %d)', id, this.key, this.#subscribers.size);
            }
            get subscriberCount() {
                return this.#subscribers.size;
            }
            get isDisposed() {
                return this.#disposed;
            }
            get isPersistent() {
                return true === this.#transport.persistent;
            }
            async send(message) {
                if (!this.#writer) throw new Error(`DeviceConnection ${this.key} is not connected`);
                try {
                    await this.#writer.write(message);
                } catch (err) {
                    debug('send to %s failed: %O', this.key, err);
                    throw err;
                }
            }
            async dispose() {
                if (this.#disposed) return;
                this.#disposed = true;
                debug('disposing device connection %s', this.key);
                try {
                    this.#writer?.releaseLock();
                } catch  {}
                try {
                    await this.#conn?.[Symbol.asyncDispose]();
                } catch (err) {
                    debug('error disposing connection %s: %O', this.key, err);
                }
                await this.#readLoopPromise;
                this.#subscribers.clear();
            }
            async #readLoop() {
                if (!this.#conn) return;
                try {
                    for await (const message of this.#conn.readable){
                        if (null === this.appInfo) {
                            const response = message;
                            if ((0, _types_ts__rspack_import_1.aS)(response)) {
                                this.appInfo = response.data.info;
                                debug('captured appInfo for %s: %O', this.key, this.appInfo);
                                continue;
                            }
                        }
                        this.#broadcast(message);
                    }
                } catch (err) {
                    if (!this.#disposed) debug('read loop error on %s: %O', this.key, err);
                }
                if (!this.#disposed) {
                    debug('device connection %s closed by remote', this.key);
                    this.#disposed = true;
                    this.#closeAllSubscribers();
                }
            }
            #closeAllSubscribers() {
                for (const [, subscriber] of this.#subscribers)try {
                    subscriber.close();
                } catch (err) {
                    debug('failed to close subscriber %d: %O', subscriber.id, err);
                }
            }
            #broadcast(message) {
                for (const [, subscriber] of this.#subscribers)try {
                    subscriber.send(message);
                } catch (err) {
                    debug('failed to send to subscriber %d: %O', subscriber.id, err);
                }
            }
        }
    },
    "../../mcp-servers/devtool-connector/src/daemon/entry.ts" (module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.a(module, async function(__rspack_load_async_deps, __rspack_async_done) {
            try {
                __webpack_require__.r(__webpack_exports__);
                var node_util__rspack_import_0 = __webpack_require__("node:util");
                var _transport_android_ts__rspack_import_1 = __webpack_require__("../../mcp-servers/devtool-connector/src/transport/android.ts");
                var _transport_desktop_ts__rspack_import_2 = __webpack_require__("../../mcp-servers/devtool-connector/src/transport/desktop.ts");
                var _transport_ios_ts__rspack_import_3 = __webpack_require__("../../mcp-servers/devtool-connector/src/transport/ios.ts");
                var _manager_ts__rspack_import_4 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/manager.ts");
                var _server_ts__rspack_import_5 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/server.ts");
                function getAndroidTransportSpec(env) {
                    const port = Number.parseInt(env['ADB_SERVER_PORT'] ?? '5037', 10);
                    return {
                        host: env['ADB_SERVER_HOST'] ?? '127.0.0.1',
                        port: Number.isInteger(port) && port > 0 ? port : 5037
                    };
                }
                const { values } = (0, node_util__rspack_import_0.parseArgs)({
                    options: {
                        port: {
                            type: 'string',
                            default: String(_manager_ts__rspack_import_4.$G)
                        }
                    },
                    strict: true
                });
                const port = Number.parseInt(values.port ?? String(_manager_ts__rspack_import_4.$G), 10);
                const daemon = new _server_ts__rspack_import_5.e([
                    new _transport_android_ts__rspack_import_1.R(getAndroidTransportSpec(process.env)),
                    new _transport_ios_ts__rspack_import_3.H(),
                    new _transport_desktop_ts__rspack_import_2.y()
                ], {
                    onIdle: ()=>{
                        daemon.close().then(()=>{
                            process.exit(0);
                        });
                    },
                    onShutdown: ()=>{
                        process.exit(0);
                    }
                });
                await daemon.start(port);
                process.on('SIGTERM', ()=>{
                    daemon.close().then(()=>{
                        process.exit(0);
                    });
                });
                process.on('SIGINT', ()=>{
                    daemon.close().then(()=>{
                        process.exit(0);
                    });
                });
                __rspack_async_done();
            } catch (e) {
                __rspack_async_done(e);
            }
        }, 1);
    },
    "../../mcp-servers/devtool-connector/src/daemon/server.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            e: ()=>DevtoolDaemon
        });
        var node_http__rspack_import_0 = __webpack_require__("node:http");
        var node_timers_promises__rspack_import_1 = __webpack_require__("node:timers/promises");
        var obug__rspack_import_7 = __webpack_require__("../../../node_modules/.pnpm/obug@2.1.3/node_modules/obug/dist/node.js");
        var ws__rspack_import_2 = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/wrapper.mjs");
        var _client_id_ts__rspack_import_8 = __webpack_require__("../../mcp-servers/devtool-connector/src/client-id.ts");
        var _device_connection_ts__rspack_import_3 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/device-connection.ts");
        var _protocol_ts__rspack_import_4 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/protocol.ts");
        var _static_server_ts__rspack_import_5 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/static-server.ts");
        var _version_ts__rspack_import_6 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/version.ts");
        const debug = (0, obug__rspack_import_7.U)('devtool-mcp-server:daemon:server');
        const IDLE_TIMEOUT_MS = 300000;
        const DEVICE_CONN_GRACE_MS = 10000;
        const DEVICE_DISCOVERY_TIMEOUT_MS = 2500;
        const DEVICE_CONN_SETUP_TIMEOUT_MS = 5000;
        const DEVICE_CONN_DISPOSE_TIMEOUT_MS = 1000;
        class DevtoolDaemon {
            #httpServer;
            #wss = null;
            #transports;
            #deviceConnections = new Map();
            #pendingDeviceConnections = new Map();
            #deviceConnectionCleanupTimers = new Map();
            #wsClients = new Map();
            #nextClientId = 0;
            #idleTimer = null;
            #closed = false;
            #onIdle;
            #onShutdown;
            #staticServer = new _static_server_ts__rspack_import_5.Y();
            constructor(transports, options){
                this.#transports = transports;
                this.#onIdle = options?.onIdle;
                this.#onShutdown = options?.onShutdown;
                this.#httpServer = node_http__rspack_import_0["default"].createServer((req, res)=>{
                    if ('GET' === req.method && this.#isVersionRequest(req.url)) return void this.#sendJson(res, 200, {
                        version: _version_ts__rspack_import_6.P
                    });
                    if (this.#staticServer.tryHandle(req, res)) return;
                    if ('POST' === req.method && this.#isShutdownRequest(req.url)) return void this.#sendJson(res, 202, {
                        ok: true
                    }, ()=>{
                        this.close().catch((err)=>{
                            debug('failed to close daemon after shutdown request: %O', err);
                        }).finally(()=>{
                            this.#onShutdown?.();
                        });
                    });
                    res.writeHead(404);
                    res.end();
                });
            }
            async start(port) {
                const wss = new ws__rspack_import_2.zu({
                    noServer: true
                });
                this.#wss = wss;
                this.#httpServer.on('upgrade', (request, socket, head)=>{
                    if (!request.url?.startsWith(_protocol_ts__rspack_import_4.yp)) return void socket.destroy();
                    wss.handleUpgrade(request, socket, head, (ws)=>{
                        this.#handleConnection(ws);
                    });
                });
                return new Promise((resolve, reject)=>{
                    this.#httpServer.once('error', reject);
                    this.#httpServer.listen(port, '127.0.0.1', ()=>{
                        this.#httpServer.removeListener('error', reject);
                        this.#resetIdleTimer();
                        const address = this.#httpServer.address();
                        debug('daemon listening on ws://127.0.0.1:%d%s', address.port, _protocol_ts__rspack_import_4.yp);
                        resolve(address.port);
                    });
                });
            }
            async close() {
                if (this.#closed) return;
                this.#closed = true;
                this.#clearIdleTimer();
                for (const [, client] of this.#wsClients)client.close();
                this.#wsClients.clear();
                for (const [, conn] of this.#deviceConnections)await conn.dispose();
                this.#deviceConnections.clear();
                for (const [, timer] of this.#deviceConnectionCleanupTimers)clearTimeout(timer);
                this.#deviceConnectionCleanupTimers.clear();
                for (const transport of this.#transports)await transport.close();
                this.#wss?.close();
                return new Promise((resolve)=>{
                    this.#httpServer.close(()=>resolve());
                });
            }
            #isVersionRequest(url) {
                return new URL(url ?? '/', 'http://127.0.0.1').pathname === _protocol_ts__rspack_import_4.UR;
            }
            #isShutdownRequest(url) {
                return new URL(url ?? '/', 'http://127.0.0.1').pathname === _protocol_ts__rspack_import_4.oc;
            }
            #sendJson(res, statusCode, data, callback) {
                const body = JSON.stringify(data);
                res.writeHead(statusCode, {
                    'content-type': 'application/json; charset=utf-8',
                    'content-length': Buffer.byteLength(body),
                    'cache-control': 'no-store'
                });
                res.end(body, callback);
            }
            #handleConnection(ws) {
                const clientId = ++this.#nextClientId;
                debug('new ws client %d', clientId);
                this.#clearIdleTimer();
                const session = {
                    id: clientId,
                    subscriptions: new Set(),
                    send (message) {
                        if (1 === ws.readyState) ws.send(JSON.stringify(message));
                    },
                    close () {
                        ws.close(1001, 'device disconnected');
                    }
                };
                session.send({
                    event: 'Initialize',
                    data: clientId
                });
                ws.on('message', (raw)=>{
                    try {
                        const msg = JSON.parse(String(raw));
                        this.#handleMessage(session, msg);
                    } catch (err) {
                        debug('failed to parse message from client %d: %O', clientId, err);
                    }
                });
                ws.on('close', ()=>{
                    debug('ws client %d disconnected', clientId);
                    this.#wsClients.delete(clientId);
                    for (const key of session.subscriptions){
                        const deviceConn = this.#deviceConnections.get(key);
                        if (deviceConn) {
                            deviceConn.removeSubscriber(clientId);
                            if (0 === deviceConn.subscriberCount) this.#scheduleDeviceConnectionCleanup(key);
                        }
                    }
                    session.subscriptions.clear();
                    this.#resetIdleTimer();
                });
                ws.on('error', (err)=>{
                    debug('ws client %d error: %O', clientId, err);
                });
            }
            #handleMessage(session, msg) {
                if ((0, _protocol_ts__rspack_import_4.oF)(msg)) {
                    this.#wsClients.set(session.id, session);
                    debug('client %d registered', session.id);
                    return;
                }
                if ((0, _protocol_ts__rspack_import_4._0)(msg)) return void this.#sendClientList(session);
                if ((0, _protocol_ts__rspack_import_4.ji)(msg)) return void session.send({
                    event: 'Pong'
                });
                if ((0, _protocol_ts__rspack_import_4.jG)(msg)) return void this.#handleControlRequest(session, msg);
                if ((0, _protocol_ts__rspack_import_4.Zr)(msg)) return void this.#handleCustomizedMessage(session, msg);
                debug('unknown message from client %d: %O', session.id, msg);
            }
            async #handleCustomizedMessage(session, msg) {
                const targetPort = msg.to ?? msg.data?.data?.client_id;
                if ('number' != typeof targetPort) return void debug('cannot determine target port from message: %O', msg);
                for (const key of session.subscriptions){
                    const deviceConn = this.#deviceConnections.get(key);
                    if (deviceConn && deviceConn.port === targetPort) {
                        try {
                            await deviceConn.send({
                                ...msg,
                                data: {
                                    ...msg.data,
                                    sender: targetPort
                                }
                            });
                        } catch (err) {
                            debug('failed to forward message to %s: %O', key, err);
                        }
                        return;
                    }
                }
                debug('no matching device connection for client %d, port %d', session.id, targetPort);
            }
            async #handleControlRequest(session, req) {
                const { id, method, params } = req.data;
                try {
                    let result;
                    switch(method){
                        case 'listClients':
                            result = await this.#discoverClients();
                            break;
                        case 'listDevices':
                            {
                                const devices = [];
                                const allResults = await Promise.allSettled(this.#transports.map((t)=>t.listDevices()));
                                for (const r of allResults)if ('fulfilled' === r.status) devices.push(...r.value);
                                result = devices;
                                break;
                            }
                        case 'listAvailableApps':
                            {
                                const deviceId = params?.deviceId;
                                if (!deviceId) throw new Error('deviceId is required');
                                const transport = await this.#findTransportWithDeviceId(deviceId);
                                result = await transport.listAvailableApps(deviceId);
                                break;
                            }
                        case 'openApp':
                            {
                                const p = params ?? {};
                                if (!p.deviceId || !p.packageName) throw new Error('deviceId and packageName are required');
                                const transport = await this.#findTransportWithDeviceId(p.deviceId);
                                await transport.openApp(p.deviceId, p.packageName, {
                                    withDataCleared: p.withDataCleared
                                });
                                result = null;
                                break;
                            }
                        case 'subscribe':
                            {
                                const s = params ?? {};
                                if (!s.deviceId || void 0 === s.port) throw new Error('deviceId and port are required');
                                const transport = await this.#findTransportWithDeviceId(s.deviceId);
                                const conn = await this.#getOrCreateDeviceConnection(transport, s.deviceId, s.port);
                                conn.addSubscriber(session);
                                session.subscriptions.add(conn.key);
                                result = null;
                                break;
                            }
                        default:
                            throw new Error(`Unknown control method: ${method}`);
                    }
                    session.send({
                        event: 'ControlResponse',
                        data: {
                            id,
                            result
                        }
                    });
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    session.send({
                        event: 'ControlResponse',
                        data: {
                            id,
                            error: message
                        }
                    });
                }
            }
            async #sendClientList(session) {
                try {
                    const clients = await this.#discoverClients();
                    session.send({
                        event: 'ClientList',
                        data: clients
                    });
                } catch (err) {
                    debug('failed to send client list: %O', err);
                    session.send({
                        event: 'ClientList',
                        data: []
                    });
                }
            }
            async #discoverClients() {
                const entries = [];
                const clientListTransports = this.#transports.filter((t)=>'function' == typeof t.listClients);
                const clientListResults = await Promise.allSettled(clientListTransports.map((t)=>t.listClients()));
                for (const r of clientListResults)if ('fulfilled' === r.status) for (const { id, info } of r.value)entries.push({
                    id,
                    info,
                    type: 'runtime'
                });
                for (const [, conn] of this.#deviceConnections)if (conn.appInfo && !conn.isDisposed) {
                    const id = _client_id_ts__rspack_import_8.R.serialize(conn.deviceId, conn.port);
                    if (entries.some((e)=>e.id === id)) continue;
                    entries.push({
                        id,
                        info: conn.appInfo,
                        type: 'runtime'
                    });
                }
                const allDevices = [];
                const transportResults = await Promise.allSettled(this.#transports.filter((transport)=>'function' != typeof transport.listClients).map(async (transport)=>({
                        transport,
                        devices: await transport.listDevices()
                    })));
                for (const r of transportResults)if ('fulfilled' === r.status) allDevices.push(r.value);
                const MIN_PORT = 8901;
                const PORTS = Array.from({
                    length: 10
                }, (_, i)=>MIN_PORT + i);
                const existingKeys = new Set(this.#deviceConnections.keys());
                const probeResults = await Promise.allSettled(allDevices.flatMap(({ transport, devices })=>devices.flatMap((device)=>PORTS.filter((port)=>!existingKeys.has(`${device.id}:${port}`)).map(async (port)=>{
                            const conn = await this.#getOrCreateDeviceConnection(transport, device.id, port);
                            const deadline = Date.now() + DEVICE_DISCOVERY_TIMEOUT_MS;
                            while(!conn.appInfo && !conn.isDisposed && Date.now() < deadline)await new Promise((resolve)=>setTimeout(resolve, 100));
                            return conn;
                        }))));
                for (const r of probeResults)if ('fulfilled' === r.status) {
                    const conn = r.value;
                    if (conn.appInfo && !conn.isDisposed) {
                        const clientId = _client_id_ts__rspack_import_8.R.serialize(conn.deviceId, conn.port);
                        if (!entries.some((e)=>e.id === clientId)) entries.push({
                            id: clientId,
                            info: conn.appInfo,
                            type: 'runtime'
                        });
                    }
                }
                return entries;
            }
            async #getOrCreateDeviceConnection(transport, deviceId, port) {
                const key = `${deviceId}:${port}`;
                const existing = this.#deviceConnections.get(key);
                if (existing && !existing.isDisposed) {
                    this.#clearDeviceConnectionCleanup(key);
                    return existing;
                }
                const pending = this.#pendingDeviceConnections.get(key);
                if (pending) return await pending;
                const connectionPromise = (async ()=>{
                    const setupAbortController = new AbortController();
                    const setupTimeout = setTimeout(()=>{
                        setupAbortController.abort(createDeviceConnectionSetupTimeoutError(key));
                    }, DEVICE_CONN_SETUP_TIMEOUT_MS);
                    const conn = new _device_connection_ts__rspack_import_3.Z(transport, {
                        deviceId,
                        port,
                        signal: setupAbortController.signal
                    });
                    const connectPromise = conn.connect();
                    try {
                        await withAbortSignal(connectPromise, setupAbortController.signal);
                        await withAbortSignal(conn.send({
                            event: 'Initialize',
                            data: port
                        }), setupAbortController.signal);
                        this.#deviceConnections.set(key, conn);
                        return conn;
                    } catch (err) {
                        debug('failed to connect to %s: %O', key, err);
                        this.#deviceConnections.delete(key);
                        await this.#disposeDeviceConnectionBestEffort(key, conn);
                        throw err;
                    } finally{
                        clearTimeout(setupTimeout);
                        this.#pendingDeviceConnections.delete(key);
                    }
                })();
                this.#pendingDeviceConnections.set(key, connectionPromise);
                return await connectionPromise;
            }
            async #disposeDeviceConnectionBestEffort(key, conn) {
                const timeoutAbortController = new AbortController();
                const disposePromise = conn.dispose().catch((err)=>{
                    debug('failed to dispose device connection %s after setup failure: %O', key, err);
                });
                const timeoutPromise = (0, node_timers_promises__rspack_import_1.setTimeout)(DEVICE_CONN_DISPOSE_TIMEOUT_MS, void 0, {
                    signal: timeoutAbortController.signal
                }).then(()=>{
                    throw new Error(`Timed out disposing failed device connection ${key}`);
                });
                try {
                    await Promise.race([
                        disposePromise,
                        timeoutPromise
                    ]);
                } catch (err) {
                    debug('best-effort dispose for %s did not complete: %O', key, err);
                } finally{
                    timeoutAbortController.abort();
                }
            }
            #scheduleDeviceConnectionCleanup(key) {
                const conn = this.#deviceConnections.get(key);
                if (conn?.isPersistent) {
                    this.#clearDeviceConnectionCleanup(key);
                    debug('skipping cleanup for persistent connection %s', key);
                    return;
                }
                debug('scheduling cleanup for %s in %dms', key, DEVICE_CONN_GRACE_MS);
                this.#clearDeviceConnectionCleanup(key);
                const timer = setTimeout(()=>{
                    this.#deviceConnectionCleanupTimers.delete(key);
                    const conn = this.#deviceConnections.get(key);
                    if (conn && 0 === conn.subscriberCount) {
                        debug('disposing idle device connection %s', key);
                        this.#deviceConnections.delete(key);
                        conn.dispose();
                    }
                }, DEVICE_CONN_GRACE_MS);
                this.#deviceConnectionCleanupTimers.set(key, timer);
            }
            #clearDeviceConnectionCleanup(key) {
                const timer = this.#deviceConnectionCleanupTimers.get(key);
                if (!timer) return;
                clearTimeout(timer);
                this.#deviceConnectionCleanupTimers.delete(key);
            }
            async #findTransportWithDeviceId(deviceId) {
                for (const transport of this.#transports)try {
                    const devices = await transport.listDevices();
                    if (devices.some(({ id })=>id === deviceId)) return transport;
                } catch  {}
                throw new Error(`Device with id: ${deviceId} not found`);
            }
            #resetIdleTimer() {
                this.#clearIdleTimer();
                if (0 === this.#wsClients.size && !this.#closed) {
                    debug('no clients connected, starting idle timer (%dms)', IDLE_TIMEOUT_MS);
                    this.#idleTimer = setTimeout(()=>{
                        if (0 === this.#wsClients.size) {
                            debug('idle timeout reached, shutting down daemon');
                            this.#onIdle?.();
                        }
                    }, IDLE_TIMEOUT_MS);
                }
            }
            #clearIdleTimer() {
                if (this.#idleTimer) {
                    clearTimeout(this.#idleTimer);
                    this.#idleTimer = null;
                }
            }
        }
        function createDeviceConnectionSetupTimeoutError(key) {
            return new Error(`Timed out setting up device connection ${key} after ${DEVICE_CONN_SETUP_TIMEOUT_MS}ms`);
        }
        async function withAbortSignal(promise, signal) {
            signal.throwIfAborted();
            return await new Promise((resolve, reject)=>{
                const abortHandler = ()=>{
                    reject(signal.reason ?? new Error('The operation was aborted'));
                };
                signal.addEventListener('abort', abortHandler, {
                    once: true
                });
                promise.then((value)=>{
                    signal.removeEventListener('abort', abortHandler);
                    resolve(value);
                }, (error)=>{
                    signal.removeEventListener('abort', abortHandler);
                    reject(error);
                });
            });
        }
    },
    "../../mcp-servers/devtool-connector/src/daemon/static-server.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Y: ()=>StaticServer
        });
        var node_fs__rspack_import_0 = __webpack_require__("node:fs");
        var node_path__rspack_import_1 = __webpack_require__("node:path");
        var node_url__rspack_import_2 = __webpack_require__("node:url");
        var node_zlib__rspack_import_3 = __webpack_require__("node:zlib");
        var obug__rspack_import_6 = __webpack_require__("../../../node_modules/.pnpm/obug@2.1.3/node_modules/obug/dist/node.js");
        var _protocol_ts__rspack_import_4 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/protocol.ts");
        var _tarball_cache_ts__rspack_import_5 = __webpack_require__("../../mcp-servers/devtool-connector/src/daemon/tarball-cache.ts");
        const debug = (0, obug__rspack_import_6.U)('devtool-mcp-server:daemon:static-server');
        const DEVTOOL_FRONTEND_TARBALL_URL = 'https://github.com/lynx-family/lynx-devtool/releases/download/devtools-frontend-lynx-7/devtool.frontend.lynx_1.0.1779085629.tar.gz';
        const DEVTOOL_FRONTEND_PATH_PREFIX = '/devtool-frontend/';
        const MIME_TYPES = {
            '.html': 'text/html; charset=utf-8',
            '.js': "application/javascript; charset=utf-8",
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.woff2': 'font/woff2',
            '.woff': 'font/woff',
            '.ttf': 'font/ttf'
        };
        class StaticServer {
            #frontendCache = null;
            tryHandle(req, res) {
                if ('GET' !== req.method) return false;
                const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
                if (pathname === _protocol_ts__rspack_import_4.dB) {
                    this.#serveInspectorWrapper(res);
                    return true;
                }
                if (pathname.startsWith(DEVTOOL_FRONTEND_PATH_PREFIX)) {
                    this.#serveFrontendRes(req, res, pathname);
                    return true;
                }
                return false;
            }
            #serveInspectorWrapper(res) {
                const base = node_path__rspack_import_1["default"].dirname((0, node_url__rspack_import_2.fileURLToPath)(import.meta.url));
                const primary = node_path__rspack_import_1["default"].resolve(base, '../../public');
                const secondary = node_path__rspack_import_1["default"].resolve(base, '../public');
                const candidates = [
                    primary,
                    secondary
                ];
                const filePath = candidates.map((d)=>node_path__rspack_import_1["default"].join(d, 'inspector-wrapper.html')).find((f)=>node_fs__rspack_import_0["default"].existsSync(f)) ?? node_path__rspack_import_1["default"].join(primary, 'inspector-wrapper.html');
                node_fs__rspack_import_0["default"].readFile(filePath, 'utf-8', (err, content)=>{
                    if (err) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    res.writeHead(200, {
                        'content-type': 'text/html; charset=utf-8',
                        'content-length': Buffer.byteLength(content),
                        'cache-control': 'no-store'
                    });
                    res.end(content);
                });
            }
            async #serveFrontendRes(req, res, pathname) {
                try {
                    if (!this.#frontendCache) {
                        this.#frontendCache = new _tarball_cache_ts__rspack_import_5.h();
                        this.#frontendCache.start(DEVTOOL_FRONTEND_TARBALL_URL);
                    }
                    const relativePath = pathname.slice(DEVTOOL_FRONTEND_PATH_PREFIX.length);
                    if (relativePath.includes('..')) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    const ext = node_path__rspack_import_1["default"].extname(relativePath).toLowerCase();
                    if ('.map' === ext) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    const entry = this.#frontendCache.get(relativePath) ?? await this.#frontendCache.waitFor(relativePath);
                    if (!entry) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
                    const acceptGzip = req.headers['accept-encoding']?.includes('gzip');
                    if (acceptGzip) {
                        res.writeHead(200, {
                            'content-type': contentType,
                            'content-encoding': 'gzip',
                            'content-length': entry.gzipped.length,
                            'cache-control': 'public, max-age=31536000, immutable'
                        });
                        res.end(entry.gzipped);
                    } else {
                        const raw = node_zlib__rspack_import_3["default"].gunzipSync(entry.gzipped);
                        res.writeHead(200, {
                            'content-type': contentType,
                            'content-length': raw.length,
                            'cache-control': 'public, max-age=31536000, immutable'
                        });
                        res.end(raw);
                    }
                } catch (err) {
                    debug('failed to serve frontend file: %O', err);
                    res.writeHead(502);
                    res.end('Failed to load resource');
                }
            }
        }
    },
    "../../mcp-servers/devtool-connector/src/daemon/tarball-cache.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            h: ()=>TarballCache
        });
        var node_path__rspack_import_0 = __webpack_require__("node:path");
        var node_zlib__rspack_import_1 = __webpack_require__("node:zlib");
        var obug__rspack_import_2 = __webpack_require__("../../../node_modules/.pnpm/obug@2.1.3/node_modules/obug/dist/node.js");
        const debug = (0, obug__rspack_import_2.U)('devtool-mcp-server:daemon:tarball-cache');
        const TAR_FILTER_PREFIX = '';
        class TarballCache {
            #files = new Map();
            #pending = new Map();
            #done = false;
            #error = null;
            #loading = null;
            get(filePath) {
                return this.#files.get(filePath);
            }
            get isDone() {
                return this.#done;
            }
            waitFor(filePath) {
                const existing = this.#files.get(filePath);
                if (existing) return Promise.resolve(existing);
                if (this.#error) return Promise.reject(this.#error);
                if (this.#done) return Promise.resolve(null);
                return new Promise((resolve, reject)=>{
                    let waiters = this.#pending.get(filePath);
                    if (!waiters) {
                        waiters = [];
                        this.#pending.set(filePath, waiters);
                    }
                    waiters.push({
                        resolve,
                        reject
                    });
                });
            }
            start(url) {
                if (this.#loading) return;
                this.#loading = this.#load(url);
            }
            async #load(url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch tarball: ${response.status}`);
                    if (!response.body) throw new Error('No response body');
                    const gunzip = node_zlib__rspack_import_1["default"].createGunzip();
                    const { Readable } = await import("node:stream");
                    Readable.fromWeb(response.body).pipe(gunzip);
                    let buf = Buffer.alloc(0);
                    for await (const chunk of gunzip){
                        buf = Buffer.concat([
                            buf,
                            chunk
                        ]);
                        buf = this.#consumeTar(buf);
                    }
                    this.#consumeTar(buf);
                } catch (err) {
                    this.#error = err instanceof Error ? err : new Error(String(err));
                    debug('tarball stream error: %O', this.#error);
                } finally{
                    this.#done = true;
                    for (const [, waiters] of this.#pending)for (const { resolve, reject } of waiters)if (this.#error) reject(this.#error);
                    else resolve(null);
                    this.#pending.clear();
                    debug('tarball cache done: %d files', this.#files.size);
                }
            }
            #consumeTar(buf) {
                while(buf.length >= 512){
                    const header = buf.subarray(0, 512);
                    if (header.every((b)=>0 === b)) {
                        buf = buf.subarray(512);
                        continue;
                    }
                    const rawName = header.subarray(0, 100).toString('utf-8').replace(/\0.*$/, '');
                    const prefix = header.subarray(345, 500).toString('utf-8').replace(/\0.*$/, '');
                    const name = prefix ? `${prefix}/${rawName}` : rawName;
                    const sizeStr = header.subarray(124, 136).toString('utf-8').replace(/\0.*$/, '').trim();
                    const size = parseInt(sizeStr, 8) || 0;
                    const typeFlag = header[156];
                    const paddedSize = 512 * Math.ceil(size / 512);
                    if (buf.length < 512 + paddedSize) break;
                    if ((48 === typeFlag || 0 === typeFlag) && name.startsWith(TAR_FILTER_PREFIX)) {
                        const fileData = buf.subarray(512, 512 + size);
                        const ext = node_path__rspack_import_0["default"].extname(name).toLowerCase();
                        if ('.map' !== ext) {
                            const gzipped = node_zlib__rspack_import_1["default"].gzipSync(fileData, {
                                level: node_zlib__rspack_import_1["default"].constants.Z_BEST_SPEED
                            });
                            const entry = {
                                gzipped,
                                rawSize: size
                            };
                            this.#files.set(name, entry);
                            const waiters = this.#pending.get(name);
                            if (waiters) {
                                this.#pending.delete(name);
                                for (const { resolve } of waiters)resolve(entry);
                            }
                        }
                    }
                    buf = buf.subarray(512 + paddedSize);
                }
                return buf;
            }
        }
    },
    "../../mcp-servers/devtool-connector/src/daemon/version.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            P: ()=>CONNECTOR_VERSION
        });
        var _package_json__rspack_import_0 = __webpack_require__("../../mcp-servers/devtool-connector/package.json");
        const CONNECTOR_VERSION = _package_json__rspack_import_0.rE;
    },
    "node:http" (module) {
        module.exports = __rspack_external_node_http_2dc67212;
    },
    "node:url" (module) {
        module.exports = __rspack_external_node_url_e96de089;
    },
    "../../mcp-servers/devtool-connector/package.json" (module) {
        module.exports = {
            rE: "0.9.3"
        };
    }
});
__webpack_require__("../../mcp-servers/devtool-connector/src/daemon/entry.ts");
