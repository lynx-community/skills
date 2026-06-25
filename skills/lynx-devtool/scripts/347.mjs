import { __webpack_require__ } from "./rslib-runtime.mjs";
import { randomInt } from "node:crypto";
import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { DesktopTransport, isGetGlobalSwitchResponse, DaemonManager, isInitializeResponse, AndroidTransport, isCustomizedResponseWithType, ClientId, isListSessionResponse, isHeadlessPrepareResponse, node_createDebug, iOSTransport, isSetGlobalSwitchResponse } from "./182.mjs";
var ws_stream_namespaceObject = {};
__webpack_require__.r(ws_stream_namespaceObject);
__webpack_require__.d(ws_stream_namespaceObject, {
    U: ()=>WsWebSocketStream,
    wsStreams: ()=>ws_stream_wsStreams
});
const debug = node_createDebug('devtool-mcp-server:daemon:transport');
class DaemonTransport {
    #port;
    constructor(port = 21783){
        this.#port = port;
    }
    async close() {}
    async listDevices() {
        const result = await this.#controlRequest('listDevices');
        return result;
    }
    async listAvailableApps(deviceId) {
        const result = await this.#controlRequest('listAvailableApps', {
            deviceId
        });
        return result;
    }
    async openApp(deviceId, packageName, options) {
        await this.#controlRequest('openApp', {
            deviceId,
            packageName,
            withDataCleared: options?.withDataCleared
        });
    }
    async listClients() {
        const entries = await this.#controlRequest('listClients');
        debug('received ClientList with %d entries', entries.length);
        return entries.map(({ id, info })=>({
                id,
                info
            }));
    }
    async connect(options) {
        const { deviceId, port, signal } = options;
        debug('connect to %s:%d via daemon', deviceId, port);
        await DaemonManager.ensureRunning(this.#port);
        const conn = await this.#createWebSocketConnection(signal);
        try {
            await this.#controlRequestOnConn(conn, 'subscribe', {
                deviceId,
                port
            });
        } catch (error) {
            await conn[Symbol.asyncDispose]();
            throw new Error(`Failed to subscribe to ${deviceId}:${port}`, {
                cause: error
            });
        }
        const writable = new WritableStream({
            async write (chunk) {
                const message = routeDaemonMessage(chunk, conn.assignedId, port);
                await writeMessage(conn.writable, stringifyMessage(message), signal);
            },
            async abort () {
                await conn[Symbol.asyncDispose]();
            }
        });
        const outputReadable = conn.readable.pipeThrough(new JSONStringToObjectStream());
        return {
            readable: outputReadable,
            writable,
            async [Symbol.asyncDispose] () {
                await conn[Symbol.asyncDispose]();
            }
        };
    }
    async #controlRequest(method, params) {
        await DaemonManager.ensureRunning(this.#port);
        const conn = await this.#createWebSocketConnection();
        try {
            return await this.#controlRequestOnConn(conn, method, params);
        } finally{
            await conn[Symbol.asyncDispose]();
        }
    }
    async #controlRequestOnConn(conn, method, params) {
        const id = randomInt(10000, 50000);
        const signal = AbortSignal.timeout(10000);
        await this.#writeMessage(conn.writable, JSON.stringify({
            event: 'Control',
            data: {
                id,
                method,
                params
            }
        }), signal);
        for await (const value of this.#readMessages(conn.readable, signal)){
            const msg = value;
            if ('ControlResponse' === msg.event) {
                const resp = msg.data;
                if (resp.id === id) {
                    if (resp.error) throw new Error(resp.error);
                    return resp.result;
                }
            }
        }
        throw new Error(`No response for control request: ${method}`);
    }
    async #createWebSocketConnection(signal) {
        const url = await DaemonManager.ensureRunning(this.#port);
        signal?.throwIfAborted();
        const { wsStreams } = await Promise.resolve(ws_stream_namespaceObject);
        const wss = wsStreams.create(url);
        const abortHandler = ()=>{
            wss.close();
        };
        signal?.addEventListener('abort', abortHandler, {
            once: true
        });
        wss.closed.catch(()=>{
            debug('WebSocket to daemon closed');
        });
        try {
            const { readable, writable } = await this.#withAbortSignal(wss.opened, signal);
            const reader = readable.getReader();
            const { value, done } = await reader.read();
            reader.releaseLock();
            if (done) throw new Error('WebSocket closed before initialization.');
            const initMsg = JSON.parse(value);
            if ('Initialize' !== initMsg.event) throw new Error(`Expected Initialize, got ${initMsg.event}`);
            const assignedId = initMsg.data;
            await this.#writeMessage(writable, JSON.stringify({
                event: 'Register',
                data: {
                    id: assignedId,
                    type: 'Driver'
                }
            }), signal);
            return {
                assignedId,
                readable,
                writable,
                async [Symbol.asyncDispose] () {
                    signal?.removeEventListener('abort', abortHandler);
                    wss.close();
                    await wss.closed.catch(()=>{});
                }
            };
        } catch (err) {
            signal?.removeEventListener('abort', abortHandler);
            try {
                wss.close();
            } catch  {}
            try {
                await wss.closed;
            } catch  {}
            throw err;
        }
    }
    async *#readMessages(readable, signal) {
        const reader = readable.getReader();
        const abortHandler = ()=>{
            reader.cancel(signal.reason);
        };
        signal.addEventListener('abort', abortHandler, {
            once: true
        });
        try {
            while(!signal.aborted){
                const { value, done } = await reader.read();
                if (done) break;
                try {
                    yield JSON.parse(value);
                } catch  {}
            }
        } finally{
            signal.removeEventListener('abort', abortHandler);
            reader.releaseLock();
        }
    }
    async #writeMessage(writable, chunk, signal) {
        await writeMessage(writable, chunk, signal);
    }
    async #withAbortSignal(promise, signal) {
        if (!signal) return promise;
        signal.throwIfAborted();
        return new Promise((resolve, reject)=>{
            const abortHandler = ()=>{
                reject(signal.reason);
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
}
function routeDaemonMessage(chunk, sender, port) {
    if (isRecord(chunk) && 'Customized' === chunk['event']) {
        const data = isRecord(chunk['data']) ? chunk['data'] : {};
        return {
            ...chunk,
            data: {
                ...data,
                sender
            },
            to: port
        };
    }
    return chunk;
}
function stringifyMessage(message) {
    try {
        return JSON.stringify(message);
    } catch (err) {
        throw new Error(`Failed to stringify object: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err
        });
    }
}
function isRecord(value) {
    return 'object' == typeof value && null !== value;
}
async function writeMessage(writable, chunk, signal) {
    signal?.throwIfAborted();
    const writer = writable.getWriter();
    const abortHandler = ()=>{
        writer.abort(signal?.reason);
    };
    signal?.addEventListener('abort', abortHandler, {
        once: true
    });
    try {
        await writer.write(chunk);
    } finally{
        signal?.removeEventListener('abort', abortHandler);
        writer.releaseLock();
    }
}
class JSONStringToObjectStream extends TransformStream {
    constructor(){
        super({
            transform (chunk, controller) {
                try {
                    controller.enqueue(JSON.parse(chunk));
                } catch (err) {
                    controller.error(new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`));
                }
            }
        });
    }
}
const websocket = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket.js");
class WsWebSocketStream {
    #ws;
    opened;
    closed;
    #resolveClosed;
    #rejectClosed;
    constructor(url){
        this.#ws = new websocket(url);
        this.closed = new Promise((resolve, reject)=>{
            this.#resolveClosed = resolve;
            this.#rejectClosed = reject;
        });
        this.opened = new Promise((resolve, reject)=>{
            const ws = this.#ws;
            const onError = (err)=>{
                cleanup();
                reject(err);
                this.#rejectClosed(err);
            };
            const onClose = ()=>{
                cleanup();
                reject(new Error('WebSocket closed before opening.'));
                this.#resolveClosed();
            };
            const cleanup = ()=>{
                ws.removeListener('error', onError);
                ws.removeListener('close', onClose);
            };
            ws.once('open', ()=>{
                cleanup();
                const readable = new ReadableStream({
                    start (controller) {
                        ws.on('message', (data)=>{
                            controller.enqueue('string' == typeof data ? data : data.toString());
                        });
                        ws.on('close', ()=>{
                            try {
                                controller.close();
                            } catch  {}
                        });
                        ws.on('error', (err)=>{
                            try {
                                controller.error(err);
                            } catch  {}
                        });
                    },
                    cancel () {
                        ws.close();
                    }
                });
                const writable = new WritableStream({
                    write (chunk) {
                        return new Promise((res, rej)=>{
                            ws.send(chunk, (err)=>{
                                if (err) rej(err);
                                else res();
                            });
                        });
                    },
                    close () {
                        ws.close();
                    },
                    abort () {
                        ws.close();
                    }
                });
                resolve({
                    readable,
                    writable
                });
                ws.on('close', ()=>{
                    this.#resolveClosed();
                });
                ws.on('error', (err)=>{
                    this.#rejectClosed(err);
                });
            });
            ws.once('error', onError);
            ws.once('close', onClose);
        });
    }
    close() {
        this.#ws.close();
    }
}
const ws_stream_wsStreams = {
    create (url) {
        return new WsWebSocketStream(url);
    }
};
class CustomizedClientIdTransformStream extends TransformStream {
    constructor(clientId){
        super({
            transform (chunk, controller) {
                if ('Customized' === chunk.event) controller.enqueue({
                    ...chunk,
                    data: {
                        ...chunk?.data,
                        data: {
                            ...chunk?.data?.data,
                            client_id: clientId
                        },
                        sender: clientId
                    }
                });
                else controller.enqueue(chunk);
            }
        });
    }
}
class CustomizedRequestTransformStream extends TransformStream {
    constructor(options){
        const { type, sessionId = -1, messageBuilder } = options;
        super({
            transform (chunk, controller) {
                const sid = 'function' == typeof sessionId ? sessionId(chunk) : sessionId;
                controller.enqueue({
                    event: 'Customized',
                    data: {
                        type,
                        data: {
                            session_id: sid,
                            message: messageBuilder(chunk)
                        }
                    }
                });
            }
        });
    }
}
class CustomizedResponseTransformStream extends TransformStream {
    constructor(type, id){
        super({
            transform (response, controller) {
                if (!isCustomizedResponseWithType(response, type)) return;
                try {
                    const message = JSON.parse(response.data.data.message);
                    if (void 0 === id || message?.id === id) controller.enqueue(message);
                } catch (err) {
                    controller.error(new Error(`Failed to parse response for type ${type}`, {
                        cause: err
                    }));
                }
            }
        });
    }
}
class ResponseParserTransformStream extends TransformStream {
    constructor(options){
        const { parseResult, checkError } = options;
        super({
            transform (chunk, controller) {
                const error = checkError(chunk);
                if (error) return void controller.error(error);
                try {
                    controller.enqueue(parseResult(chunk));
                } catch (err) {
                    controller.error(err);
                }
            }
        });
    }
}
class AppResponseTransformStream extends ResponseParserTransformStream {
    constructor(method){
        super({
            checkError: (message)=>{
                try {
                    const result = JSON.parse(message.result);
                    if (0 !== result.code && '0' !== result.code) return new Error(`App request ${method} error: ${result.message}`, {
                        cause: message
                    });
                    return null;
                } catch (err) {
                    return new Error('Failed to parse App response message', {
                        cause: err
                    });
                }
            },
            parseResult: (message)=>JSON.parse(message.result)
        });
    }
}
class GlobalSwitchRequestTransformStream extends CustomizedRequestTransformStream {
    constructor(type){
        super({
            type,
            sessionId: -1,
            messageBuilder: ({ key, value })=>({
                    global_key: key,
                    global_value: value
                })
        });
    }
}
class CDPRequestTransformStream extends CustomizedRequestTransformStream {
    constructor(sessionId, fixedId){
        super({
            type: 'CDP',
            sessionId,
            messageBuilder: (chunk)=>{
                const id = fixedId ?? randomInt(10000, 50000);
                return {
                    id,
                    ...chunk
                };
            }
        });
    }
}
class CDPResponseTransformStream extends CustomizedResponseTransformStream {
    constructor(id){
        super('CDP', id);
    }
}
class CDPOutputTransformStream extends ResponseParserTransformStream {
    constructor(){
        super({
            checkError: (message)=>{
                if ('error' in message) return new Error(`CDP request error: ${message.error.message}`, {
                    cause: message
                });
                return null;
            },
            parseResult: (message)=>{
                if ('result' in message) return message.result;
                throw new Error('No result in CDP response message', {
                    cause: message
                });
            }
        });
    }
}
class FilterTransformStream extends TransformStream {
    constructor(filter){
        super({
            transform (chunk, controller) {
                if (filter(chunk)) controller.enqueue(chunk);
            }
        });
    }
}
class InspectStream extends TransformStream {
    constructor(callback){
        super({
            transform (chunk, controller) {
                callback(chunk);
                controller.enqueue(chunk);
            }
        });
    }
}
class SessionGuardTransformStream extends TransformStream {
    constructor(sessionId){
        super({
            transform (chunk, controller) {
                if (isListSessionResponse(chunk)) {
                    const sessions = chunk.data.data;
                    if (!Array.isArray(sessions)) return void controller.enqueue(chunk);
                    if (!sessions.some((s)=>s?.session_id === sessionId)) return void controller.terminate();
                }
                controller.enqueue(chunk);
            }
        });
    }
}
function _ts_add_disposable_resource(env, value, async) {
    if (null != value) {
        if ("object" != typeof value && "function" != typeof value) throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (void 0 === dispose) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if ("function" != typeof dispose) throw new TypeError("Object not disposable.");
        if (inner) dispose = function() {
            try {
                inner.call(this);
            } catch (e) {
                return Promise.reject(e);
            }
        };
        env.stack.push({
            value: value,
            dispose: dispose,
            async: async
        });
    } else if (async) env.stack.push({
        async: true
    });
    return value;
}
function src_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (src_ts_dispose_resources = function(env) {
        function fail(e) {
            env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while(r = env.stack.pop())try {
                if (!r.async && 1 === s) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                if (r.dispose) {
                    var result = r.dispose.call(r.value);
                    if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
                        fail(e);
                        return next();
                    });
                } else s |= 1;
            } catch (e) {
                fail(e);
            }
            if (1 === s) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    })(env);
}
const src_debug = node_createDebug('devtool-mcp-server:connector');
function hasClientList(transport) {
    return 'function' == typeof transport.listClients;
}
class Connector {
    #transports;
    #daemonTransports;
    constructor(transports){
        this.#transports = transports;
        this.#daemonTransports = transports.filter((t)=>t instanceof DaemonTransport);
    }
    async listClients() {
        const daemonClientResults = await Promise.allSettled(this.#daemonTransports.map(async (transport)=>{
            const clients = await transport.listClients();
            await Promise.allSettled(clients.flatMap(({ id })=>this.#setupClient(transport, id)));
            return clients;
        }));
        const fulfilledDaemonClientResults = daemonClientResults.filter((r)=>'fulfilled' === r.status);
        const daemonClients = fulfilledDaemonClientResults.flatMap((r)=>r.value);
        if (fulfilledDaemonClientResults.length > 0) {
            src_debug('Using clients from daemon transport: %o', daemonClients);
            return daemonClients;
        }
        const transportDevices = await Promise.allSettled(this.#transports.filter((t)=>!(t instanceof DaemonTransport)).map(async (transport)=>({
                transport,
                devices: await transport.listDevices()
            })));
        for (const result of transportDevices)if ('rejected' === result.status) src_debug('listClients: listDevices failed on one transport: %O', result.reason);
        const results = await Promise.allSettled(transportDevices.filter((r)=>'fulfilled' === r.status).map((r)=>r.value).flatMap(({ transport, devices })=>devices.flatMap(({ id })=>this.#listClientsForDevice(transport, id))));
        return results.filter((r)=>'fulfilled' === r.status).flatMap((r)=>r.value);
    }
    async listDevices() {
        const results = await Promise.allSettled(this.#transports.map((t)=>t.listDevices()));
        return results.filter((result)=>'fulfilled' === result.status).flatMap(({ value })=>value);
    }
    async listAvailableApps(deviceId) {
        const transport = await this.#findTransportWithDeviceId(deviceId);
        return await transport.listAvailableApps(deviceId);
    }
    async openApp(deviceId, packageName, options) {
        const transport = await this.#findTransportWithDeviceId(deviceId);
        await transport.openApp(deviceId, packageName, options);
        const signal = AbortSignal.any([
            options?.signal,
            AbortSignal.timeout(60000)
        ].filter((i)=>void 0 !== i));
        const { setTimeout } = await import("node:timers/promises");
        while(!signal.aborted){
            try {
                const clients = hasClientList(transport) ? (await transport.listClients()).filter(({ id })=>ClientId.deserialize(id)?.deviceId === deviceId) : await this.#listClientsForDevice(transport, deviceId);
                if (clients.some(({ info })=>info.AppProcessName === packageName || info.bundleId === packageName || info.bundleName === packageName)) break;
            } catch (err) {
                src_debug(`openApp ${deviceId} ${packageName} client not found %o`, err);
            }
            await setTimeout(1000);
        }
    }
    async sendMessage(clientId, message, pipeline = {
        input: [],
        output: []
    }) {
        return this.#sendMessage(clientId, message, pipeline);
    }
    async sendMessageNoReply(clientId, message) {
        const { deviceId, port } = this.#resolveClientId(clientId);
        const transport = await this.#findTransportWithDeviceId(deviceId);
        const signal = AbortSignal.timeout(5000);
        const conn = await transport.connect({
            deviceId,
            port,
            signal
        });
        try {
            const inputStream = [
                new CustomizedClientIdTransformStream(port),
                new InspectStream((msg)=>src_debug(`sendMessageNoReply ${deviceId}:${port} send %o`, JSON.stringify(msg)))
            ].reduce((stream, transform)=>stream.pipeThrough(transform), ReadableStream.from([
                message
            ]));
            await inputStream.pipeTo(conn.writable, {
                preventClose: true
            });
        } finally{
            await conn[Symbol.asyncDispose]();
        }
    }
    async sendAppMessage(clientId, method, params) {
        const id = randomInt(10000, 50000);
        return await this.#sendMessage(clientId, {
            method,
            params: {
                ...params
            }
        }, {
            input: [
                new CustomizedRequestTransformStream({
                    type: 'App',
                    sessionId: -1,
                    messageBuilder: (message)=>({
                            id,
                            ...message
                        })
                })
            ],
            output: [
                new CustomizedResponseTransformStream('App', id),
                new AppResponseTransformStream(method)
            ]
        });
    }
    async sendCDPMessage(clientId, sessionId, method, params, isMainThread = false) {
        const id = randomInt(10000, 50000);
        const SUPPORTED_DOMAIN = [
            'Debugger',
            'Runtime',
            'HeapProfiler',
            'Profiler'
        ];
        if (isMainThread && !SUPPORTED_DOMAIN.some((domain)=>method.startsWith(domain + '.'))) throw new Error(`Method ${method} is not supported for main thread. Supported domains: ${SUPPORTED_DOMAIN.join(', ')}`);
        return await this.#sendMessage(clientId, {
            method,
            params,
            sessionId: isMainThread ? 'Main' : void 0
        }, {
            input: [
                new CDPRequestTransformStream(sessionId, id)
            ],
            output: [
                new CDPResponseTransformStream(id),
                new CDPOutputTransformStream()
            ]
        });
    }
    async sendListSessionMessage(clientId) {
        return await this.#sendListSessionMessage(clientId);
    }
    async prepareHeadless(clientId) {
        const { data: { data: state } } = await this.#sendMessage(clientId, {
            event: 'Customized',
            data: {
                type: 'HeadlessPrepare',
                data: {}
            }
        }, {
            input: [],
            output: [
                new FilterTransformStream(isHeadlessPrepareResponse)
            ]
        });
        return state;
    }
    async waitForHeadlessReady(clientId, options = {}) {
        const timeoutMs = options.timeoutMs ?? 300000;
        const pollIntervalMs = options.pollIntervalMs ?? 1000;
        const { setTimeout: delay } = await import("node:timers/promises");
        const deadline = Date.now() + timeoutMs;
        let lastError;
        for(;;){
            const state = await this.prepareHeadless(clientId);
            if ('ready' === state.status) return;
            if ('error' === state.status) lastError = state.message ?? 'unknown error';
            if (Date.now() >= deadline) throw new Error(void 0 !== lastError ? `Failed to prepare headless runtime: ${lastError}` : `Timed out preparing headless runtime after ${timeoutMs}ms`);
            await delay(pollIntervalMs);
        }
    }
    async #sendListSessionMessage(clientId) {
        const { data: { data: sessions } } = await this.#sendMessage(clientId, {
            event: 'Customized',
            data: {
                type: 'ListSession',
                data: {}
            }
        }, {
            input: [],
            output: [
                new FilterTransformStream(isListSessionResponse)
            ]
        });
        return sessions.map((session)=>({
                ...session,
                type: '' === session.type ? 'lynx' : session.type
            }));
    }
    async getGlobalSwitch(clientId, key) {
        const { data: { data: { message } } } = await this.#sendMessage(clientId, {
            key
        }, {
            input: [
                new GlobalSwitchRequestTransformStream('GetGlobalSwitch')
            ],
            output: [
                new FilterTransformStream(isGetGlobalSwitchResponse)
            ]
        });
        if ('object' == typeof message) return message?.global_value === 'true' || message?.global_value === true;
        return 'true' === message || true === message;
    }
    async setGlobalSwitch(clientId, key, value) {
        await this.#sendMessage(clientId, {
            key,
            value
        }, {
            input: [
                new GlobalSwitchRequestTransformStream('SetGlobalSwitch')
            ],
            output: [
                new FilterTransformStream(isSetGlobalSwitchResponse)
            ]
        });
    }
    async sendStream(clientId, inputStream, { signal, pipeline } = {}) {
        const { deviceId, port } = this.#resolveClientId(clientId);
        const transport = await this.#findTransportWithDeviceId(deviceId);
        return await this.#connect(transport, {
            deviceId,
            port,
            signal
        }, inputStream, pipeline ?? {
            input: [],
            output: []
        });
    }
    async sendCDPStream(clientId, sessionId, inputStream, { signal } = {}) {
        return await this.sendStream(clientId, inputStream, {
            signal,
            pipeline: {
                input: [
                    new CDPRequestTransformStream(sessionId)
                ],
                output: [
                    new SessionGuardTransformStream(sessionId),
                    new CDPResponseTransformStream()
                ]
            }
        });
    }
    #resolveClientId(clientId) {
        const parsed = ClientId.deserialize(clientId);
        if (!parsed) throw new Error(`Invalid clientId: ${clientId}`);
        return parsed;
    }
    async #findTransportWithDeviceId(deviceId) {
        const daemonTransport = await this.#findTransportWithDeviceIdInPool(this.#daemonTransports, deviceId);
        if (daemonTransport) return daemonTransport;
        const transport = await this.#findTransportWithDeviceIdInPool(this.#transports.filter((t)=>!(t instanceof DaemonTransport)), deviceId);
        if (transport) return transport;
        throw new Error(`Device with id: ${deviceId} not found`);
    }
    async #findTransportWithDeviceIdInPool(transports, deviceId) {
        return await Promise.any(transports.map(async (transport)=>{
            const devices = await transport.listDevices();
            if (devices.some(({ id })=>id === deviceId)) return transport;
            throw new Error('Not found in this transport');
        })).catch(()=>null);
    }
    async #connect(transport, options, inputStream, pipeline) {
        const { deviceId, port } = options;
        const conn = await transport.connect(options);
        const inputAbortController = new AbortController();
        const inputClosed = [
            ...pipeline.input,
            new CustomizedClientIdTransformStream(port),
            new InspectStream((msg)=>src_debug(`connect ${deviceId}:${port} input stream send %o`, JSON.stringify(msg)))
        ].reduce((stream, transform)=>stream.pipeThrough(transform), inputStream).pipeTo(conn.writable, {
            preventClose: true,
            signal: inputAbortController.signal
        }).catch((err)=>{
            if (err?.name !== 'AbortError') src_debug(`connect ${deviceId}:${port} input stream err %O`, err);
        });
        const outputStream = [
            new InspectStream((msg)=>src_debug(`connect ${deviceId}:${port} output stream receive %O`, msg)),
            ...pipeline.output
        ].reduce((stream, transform)=>stream.pipeThrough(transform, {
                preventCancel: true
            }), conn.readable);
        return Object.assign(outputStream, {
            inputClosed,
            async [Symbol.asyncDispose] () {
                src_debug(`connect ${deviceId}:${port} close connection`);
                inputAbortController.abort();
                await inputClosed.catch(()=>{});
                return conn[Symbol.asyncDispose]();
            }
        });
    }
    async #sendMessage(clientId, input, pipeline = {
        input: [],
        output: []
    }) {
        const { deviceId, port } = this.#resolveClientId(clientId);
        const transport = await this.#findTransportWithDeviceId(deviceId);
        const signal = AbortSignal.timeout(10000);
        return this.#sendMessageWithTransport(transport, {
            deviceId,
            port,
            signal
        }, input, pipeline);
    }
    async #sendMessageWithTransport(transport, options, input, pipeline) {
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const outputStream = _ts_add_disposable_resource(env, await this.#connect(transport, options, ReadableStream.from([
                input
            ]), pipeline), true);
            for await (const response of outputStream){
                await outputStream.inputClosed;
                return response;
            }
            await outputStream.inputClosed;
            const clientId = ClientId.serialize(options.deviceId, options.port);
            throw new Error(`No response found for clientId: ${clientId}`);
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = src_ts_dispose_resources(env);
            if (result) await result;
        }
    }
    async #listClientsForDevice(transport, deviceId) {
        const MIN_PORT = 8901;
        const PORTS = Array.from({
            length: 10
        }, (_, i)=>MIN_PORT + i);
        const signal = AbortSignal.timeout(5000);
        const results = await Promise.allSettled(PORTS.map(async (port)=>{
            const { data: { info } } = await this.#sendMessageWithTransport(transport, {
                deviceId,
                port,
                signal
            }, {
                event: 'Initialize',
                data: port
            }, {
                input: [],
                output: [
                    new FilterTransformStream(isInitializeResponse)
                ]
            });
            const clientId = ClientId.serialize(deviceId, port);
            await this.#setupClient(transport, clientId);
            return {
                id: clientId,
                info,
                port
            };
        }));
        return results.filter((result)=>'fulfilled' === result.status).map((result)=>result.value);
    }
    async #setupClient(transport, clientId) {
        const { deviceId, port } = this.#resolveClientId(clientId);
        for (const input of [
            {
                key: 'enable_devtool',
                value: true
            },
            {
                key: 'enable_quickjs_debug',
                value: true
            }
        ])try {
            await this.#sendMessageWithTransport(transport, {
                deviceId,
                port,
                signal: AbortSignal.timeout(3000)
            }, input, {
                input: [
                    new GlobalSwitchRequestTransformStream('SetGlobalSwitch')
                ],
                output: [
                    new FilterTransformStream(isSetGlobalSwitchResponse)
                ]
            });
        } catch (err) {
            src_debug(`setupClient ${deviceId}:${port} ${input.key} failed %O`, err);
        }
    }
}
function getAndroidTransportSpec() {
    const port = Number.parseInt(process.env['ADB_SERVER_PORT'] ?? '5037', 10);
    return {
        host: process.env['ADB_SERVER_HOST'] ?? '127.0.0.1',
        port: Number.isInteger(port) && port > 0 ? port : 5037
    };
}
function createDefaultTransports() {
    return [
        new AndroidTransport(getAndroidTransportSpec()),
        new DesktopTransport(),
        new iOSTransport()
    ];
}
function createDefaultConnector(transports = createDefaultTransports()) {
    return new Connector(transports);
}
export { AppResponseTransformStream, CDPOutputTransformStream, CDPRequestTransformStream, CDPResponseTransformStream, Connector, CustomizedClientIdTransformStream, CustomizedRequestTransformStream, CustomizedResponseTransformStream, DaemonTransport, FilterTransformStream, GlobalSwitchRequestTransformStream, InspectStream, ResponseParserTransformStream, SessionGuardTransformStream, WsWebSocketStream, createDefaultConnector, createDefaultTransports, ws_stream_wsStreams as wsStreams };
