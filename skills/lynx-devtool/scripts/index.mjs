import * as __rspack_external_net from "net";
import * as __rspack_external_node_child_process_27f17141 from "node:child_process";
import * as __rspack_external_node_crypto_9ba42079 from "node:crypto";
import * as __rspack_external_node_events_0a6aefe7 from "node:events";
import * as __rspack_external_node_fs_5ea92f0c from "node:fs";
import * as __rspack_external_node_fs_promises_153e37e0 from "node:fs/promises";
import * as __rspack_external_node_net_0373943e from "node:net";
import * as __rspack_external_node_os_74b4b876 from "node:os";
import * as __rspack_external_node_path_c5b9b54f from "node:path";
import * as __rspack_external_node_process_786449bf from "node:process";
import * as __rspack_external_node_stream_444d1c2b from "node:stream";
import * as __rspack_external_node_stream_web_2bbcbe48 from "node:stream/web";
import * as __rspack_external_node_timers_promises_aedbf14c from "node:timers/promises";
import * as __rspack_external_os from "os";
import * as __rspack_external_tty from "tty";
import * as __rspack_external_util from "util";
import { __webpack_require__ } from "./rslib-runtime.mjs";
__webpack_require__.add({
    "./src/commands/app.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            y: ()=>registerAppCommand
        });
        var _utils_ts__rspack_import_0 = __webpack_require__("./src/commands/utils.ts");
        function registerAppCommand(program, connector) {
            program.command('app').description('Send an App request').requiredOption('-m, --method <method>', 'App method (e.g., App.openPage)').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
                const { method } = options;
                let { client: clientId } = options;
                if (!clientId) clientId = await (0, _utils_ts__rspack_import_0.a)(connector);
                const params = paramsStr ? JSON.parse(paramsStr) : {};
                const result = await connector.sendAppMessage(clientId, method, params);
                console.log(JSON.stringify(result, null, 2));
            });
        }
    },
    "./src/commands/cdp.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            I: ()=>registerCdpCommand
        });
        var _utils_ts__rspack_import_0 = __webpack_require__("./src/commands/utils.ts");
        function registerCdpCommand(program, connector) {
            program.command('cdp').description('Send a CDP request').requiredOption('-m, --method <method>', 'CDP method (e.g., DOM.getDocument)').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').option('-s, --session <sessionId>', 'Session ID (optional, will auto-discover if not provided)').argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
                const { method } = options;
                let { client: clientId, session: sessionId } = options;
                if (!clientId) clientId = await (0, _utils_ts__rspack_import_0.a)(connector);
                if (!sessionId) sessionId = await (0, _utils_ts__rspack_import_0.k)(connector, clientId);
                const params = paramsStr ? JSON.parse(paramsStr) : {};
                const result = await connector.sendCDPMessage(clientId, Number(sessionId), method, params);
                console.log(JSON.stringify(result, null, 2));
            });
        }
    },
    "./src/commands/get-console.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            c: ()=>registerGetConsoleCommand
        });
        var node_stream_web__rspack_import_0 = __webpack_require__("node:stream/web");
        var node_timers_promises__rspack_import_1 = __webpack_require__("node:timers/promises");
        var _utils_ts__rspack_import_2 = __webpack_require__("./src/commands/utils.ts");
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
        function _ts_dispose_resources(env) {
            var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
                var e = new Error(message);
                return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
            };
            return (_ts_dispose_resources = function(env) {
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
        function registerGetConsoleCommand(program, connector) {
            program.command('get-console').description('Capture console logs from the device').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').option('-s, --session <sessionId>', 'Session ID (optional, will auto-discover if not provided)').option('--offset <number>', 'The number of console messages to skip before returning results.', parseInt).option('--limit <number>', 'The maximum number of console messages to return.', parseInt).option('--include-stack-traces', 'By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.').option('--level <levels>', "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']", (value)=>value.split(',').map((s)=>s.trim())).action(async (options)=>{
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    let { client: clientId, session: sessionId, limit } = options;
                    const { offset = 0, includeStackTraces, level } = options;
                    if (limit) limit = Math.max(1, Math.min(100, limit));
                    if (!clientId) clientId = await (0, _utils_ts__rspack_import_2.a)(connector);
                    if (!sessionId) sessionId = await (0, _utils_ts__rspack_import_2.k)(connector, clientId);
                    const numericSessionId = Number(sessionId);
                    const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, node_stream_web__rspack_import_0.ReadableStream.from([
                        {
                            sessionId: numericSessionId,
                            method: 'Page.enable'
                        },
                        {
                            sessionId: numericSessionId,
                            method: 'Runtime.enable'
                        }
                    ])), true);
                    const messages = [];
                    const defaultLevels = [
                        'info',
                        'log',
                        'warning',
                        'error'
                    ];
                    const allowedLevels = level || defaultLevels;
                    let skipped = 0;
                    const reader = stream.getReader();
                    const IDLE_TIMEOUT = 500;
                    const MAX_TOTAL_TIME = 5000;
                    const startTime = Date.now();
                    try {
                        while(Date.now() - startTime < MAX_TOTAL_TIME){
                            const result = await Promise.race([
                                reader.read(),
                                (0, node_timers_promises__rspack_import_1.setTimeout)(IDLE_TIMEOUT, 'timeout')
                            ]);
                            if ('timeout' === result) {
                                await reader.cancel();
                                break;
                            }
                            const { done, value } = result;
                            if (done) break;
                            if ('Runtime.consoleAPICalled' === value.method) {
                                const params = value.params;
                                if (allowedLevels.includes(params.type)) {
                                    if (skipped < offset) {
                                        skipped++;
                                        continue;
                                    }
                                    if (!includeStackTraces && 'error' !== params.type) delete params.stackTrace;
                                    messages.push(params);
                                    if (limit && messages.length >= limit) {
                                        await reader.cancel();
                                        break;
                                    }
                                }
                            }
                        }
                    } finally{
                        reader.releaseLock();
                    }
                    console.log(messages.map(({ type, args, stackTrace })=>`- [${type}]: ${args.map((arg)=>{
                            if (arg.objectId) return `<${arg.description || arg.className || 'Object'} (objectId:${arg.objectId})>`;
                            return arg.value;
                        }).join(' ')}${stackTrace ? '\n' + stackTrace.callFrames.map(({ url, lineNumber, columnNumber })=>`    at ${url}:${lineNumber}:${columnNumber}`).join('\n') : ''}`).join('\n'));
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = _ts_dispose_resources(env);
                    if (result) await result;
                }
            });
        }
    },
    "./src/commands/get-sources.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            h: ()=>registerGetSourcesCommand
        });
        var node_stream_web__rspack_import_0 = __webpack_require__("node:stream/web");
        var node_timers_promises__rspack_import_1 = __webpack_require__("node:timers/promises");
        var _utils_ts__rspack_import_2 = __webpack_require__("./src/commands/utils.ts");
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
        function _ts_dispose_resources(env) {
            var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
                var e = new Error(message);
                return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
            };
            return (_ts_dispose_resources = function(env) {
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
        function registerGetSourcesCommand(program, connector) {
            program.command('get-sources').description("List all parsed scripts.").option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').option('-s, --session <sessionId>', 'Session ID (optional, will auto-discover if not provided)').action(async (options)=>{
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    let { client: clientId, session: sessionId } = options;
                    if (!clientId) clientId = await (0, _utils_ts__rspack_import_2.a)(connector);
                    if (!sessionId) sessionId = await (0, _utils_ts__rspack_import_2.k)(connector, clientId);
                    const numericSessionId = Number(sessionId);
                    const messages = [
                        {
                            sessionId: numericSessionId,
                            method: 'Debugger.disable'
                        },
                        {
                            sessionId: numericSessionId,
                            method: 'Debugger.enable'
                        }
                    ];
                    const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, node_stream_web__rspack_import_0.ReadableStream.from(messages)), true);
                    const scripts = [];
                    const reader = stream.getReader();
                    const IDLE_TIMEOUT = 2000;
                    const MAX_TOTAL_TIME = 5000;
                    const startTime = Date.now();
                    try {
                        while(Date.now() - startTime < MAX_TOTAL_TIME){
                            const result = await Promise.race([
                                reader.read(),
                                (0, node_timers_promises__rspack_import_1.setTimeout)(IDLE_TIMEOUT, 'timeout')
                            ]);
                            if ('timeout' === result) {
                                await reader.cancel();
                                break;
                            }
                            const { done, value } = result;
                            if (done) break;
                            if ("Debugger.scriptParsed" === value.method) scripts.push(value.params);
                        }
                    } finally{
                        reader.releaseLock();
                    }
                    console.log(JSON.stringify(scripts.map(({ scriptId, url })=>({
                            scriptId,
                            url
                        })), null, 2));
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = _ts_dispose_resources(env);
                    if (result) await result;
                }
            });
        }
    },
    "./src/commands/list-clients.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            P: ()=>registerListClientsCommand
        });
        function registerListClientsCommand(program, connector) {
            program.command('list-clients').description('List all available clients').action(async ()=>{
                const clients = await connector.listClients();
                console.log(JSON.stringify(clients, null, 2));
            });
        }
    },
    "./src/commands/list-sessions.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            a: ()=>registerListSessionsCommand
        });
        var _utils_ts__rspack_import_0 = __webpack_require__("./src/commands/utils.ts");
        function registerListSessionsCommand(program, connector) {
            program.command('list-sessions').description('List all available sessions').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').action(async (options)=>{
                let { client: clientId } = options;
                if (!clientId) clientId = await (0, _utils_ts__rspack_import_0.a)(connector);
                const sessions = await connector.sendListSessionMessage(clientId);
                console.log(JSON.stringify(sessions, null, 2));
            });
        }
    },
    "./src/commands/open.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            v: ()=>registerOpenCommand
        });
        var _utils_ts__rspack_import_0 = __webpack_require__("./src/commands/utils.ts");
        function registerOpenCommand(program, connector) {
            program.command('open').description('Open page').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').argument('<url>', 'The url of the page').action(async (url, options)=>{
                let { client: clientId } = options;
                if (!clientId) clientId = await (0, _utils_ts__rspack_import_0.a)(connector);
                const openCardMessage = {
                    event: 'Customized',
                    data: {
                        type: 'OpenCard',
                        data: {
                            type: 'url',
                            url
                        },
                        sender: -1
                    },
                    from: -1
                };
                let result;
                try {
                    result = await connector.sendMessage(clientId, openCardMessage);
                } catch (error) {
                    console.warn(`OpenCard failed, falling back to App.openPage for ${url}`, error);
                    result = await connector.sendAppMessage(clientId, 'App.openPage', {
                        url
                    });
                }
                console.log(JSON.stringify(result, null, 2));
            });
        }
    },
    "./src/commands/take-screenshot.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            i: ()=>registerTakeScreenshotCommand
        });
        var node_fs_promises__rspack_import_0 = __webpack_require__("node:fs/promises");
        var node_stream_web__rspack_import_1 = __webpack_require__("node:stream/web");
        var node_timers_promises__rspack_import_2 = __webpack_require__("node:timers/promises");
        var _utils_ts__rspack_import_3 = __webpack_require__("./src/commands/utils.ts");
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
        function _ts_dispose_resources(env) {
            var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
                var e = new Error(message);
                return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
            };
            return (_ts_dispose_resources = function(env) {
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
        function registerTakeScreenshotCommand(program, connector) {
            program.command('take-screenshot').description('Take a screenshot of the current page').option('-c, --client <clientId>', 'Client ID (optional, will auto-discover if not provided)').option('-s, --session <sessionId>', 'Session ID (optional, will auto-discover if not provided)').option('--fullscreen', 'Capture the fullscreen screenshot instead of the lynxview').option('-o, --output <path>', 'Output file path (default: screenshot-<timestamp>.jpeg)').action(async (options)=>{
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    let { client: clientId, session: sessionId } = options;
                    const { output, fullscreen } = options;
                    if (!clientId) clientId = await (0, _utils_ts__rspack_import_3.a)(connector);
                    if (!sessionId) sessionId = await (0, _utils_ts__rspack_import_3.k)(connector, clientId);
                    const numericSessionId = Number(sessionId);
                    const signal = AbortSignal.timeout(10000);
                    const { promise, resolve } = Promise.withResolvers();
                    const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, new node_stream_web__rspack_import_1.ReadableStream({
                        async start (controller) {
                            controller.enqueue({
                                method: 'Page.startScreencast',
                                params: {
                                    format: 'jpeg',
                                    quality: 80,
                                    mode: fullscreen ? 'fullscreen' : 'lynxview'
                                },
                                sessionId: numericSessionId
                            });
                            await Promise.race([
                                promise,
                                (0, node_timers_promises__rspack_import_2.setTimeout)(10000, void 0, {
                                    ref: false
                                })
                            ]);
                            controller.enqueue({
                                method: 'Page.stopScreencast',
                                sessionId: numericSessionId
                            });
                            controller.close();
                        }
                    }), {
                        signal
                    }), true);
                    for await (const { method, params: eventParams } of stream)if ('Page.screencastFrame' === method) {
                        const { data } = eventParams;
                        if (data) {
                            resolve();
                            const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
                            await node_fs_promises__rspack_import_0["default"].writeFile(fileName, Buffer.from(data, 'base64'));
                            console.log(`Screenshot saved to ${fileName}`);
                            return;
                        }
                    }
                    throw new Error('Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.');
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = _ts_dispose_resources(env);
                    if (result) await result;
                }
            });
        }
    },
    "./src/commands/utils.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            a: ()=>getFirstClient,
            k: ()=>getLatestSession
        });
        async function getFirstClient(connector) {
            const clients = await connector.listClients();
            const firstClient = clients[0];
            if (!firstClient) throw new Error('No available clients found.');
            return firstClient.id;
        }
        async function getLatestSession(connector, clientId) {
            const sessions = await connector.sendListSessionMessage(clientId);
            if (!sessions || 0 === sessions.length) throw new Error(`No available sessions found for client: ${clientId}`);
            const latestSession = sessions.reduce((max, session)=>session.session_id > max.session_id ? session : max);
            return String(latestSession.session_id);
        }
    },
    "./src/devtool.ts" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            r: ()=>createProgram
        });
        var commander__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/esm.mjs");
        var _package_json__rspack_import_1 = __webpack_require__("./package.json");
        var _commands_app_ts__rspack_import_8 = __webpack_require__("./src/commands/app.ts");
        var _commands_cdp_ts__rspack_import_7 = __webpack_require__("./src/commands/cdp.ts");
        var _commands_get_console_ts__rspack_import_2 = __webpack_require__("./src/commands/get-console.ts");
        var _commands_get_sources_ts__rspack_import_3 = __webpack_require__("./src/commands/get-sources.ts");
        var _commands_list_clients_ts__rspack_import_5 = __webpack_require__("./src/commands/list-clients.ts");
        var _commands_list_sessions_ts__rspack_import_6 = __webpack_require__("./src/commands/list-sessions.ts");
        var _commands_open_ts__rspack_import_9 = __webpack_require__("./src/commands/open.ts");
        var _commands_take_screenshot_ts__rspack_import_4 = __webpack_require__("./src/commands/take-screenshot.ts");
        function createProgram(connector, transports) {
            const program = new commander__rspack_import_0.uB();
            program.name('devtool').description('CLI to interact with Lynx DevTool Connector').version(_package_json__rspack_import_1.rE).hook('postAction', async ()=>{
                await Promise.allSettled(transports.map((t)=>t.close()));
            });
            (0, _commands_list_clients_ts__rspack_import_5.P)(program, connector);
            (0, _commands_list_sessions_ts__rspack_import_6.a)(program, connector);
            (0, _commands_cdp_ts__rspack_import_7.I)(program, connector);
            (0, _commands_app_ts__rspack_import_8.y)(program, connector);
            (0, _commands_open_ts__rspack_import_9.v)(program, connector);
            (0, _commands_get_console_ts__rspack_import_2.c)(program, connector);
            (0, _commands_get_sources_ts__rspack_import_3.h)(program, connector);
            (0, _commands_take_screenshot_ts__rspack_import_4.i)(program, connector);
            return program;
        }
    },
    "./src/index.ts" (module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.a(module, async function(__rspack_load_async_deps, __rspack_async_done) {
            try {
                __webpack_require__.r(__webpack_exports__);
                var _lynx_js_devtool_connector__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/index.js");
                var _lynx_js_devtool_connector_transport__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/transport/index.js");
                var _devtool_ts__rspack_import_2 = __webpack_require__("./src/devtool.ts");
                function getAndroidTransportSpec() {
                    const port = Number.parseInt(process.env['ADB_SERVER_PORT'] ?? '5037', 10);
                    return {
                        host: process.env['ADB_SERVER_HOST'] ?? '127.0.0.1',
                        port: Number.isInteger(port) && port > 0 ? port : 5037
                    };
                }
                const transports = [
                    new _lynx_js_devtool_connector_transport__rspack_import_1.Ry(getAndroidTransportSpec()),
                    new _lynx_js_devtool_connector_transport__rspack_import_1.y4(),
                    new _lynx_js_devtool_connector_transport__rspack_import_1.HS()
                ];
                const connector = new _lynx_js_devtool_connector__rspack_import_0.Wi(transports);
                await (0, _devtool_ts__rspack_import_2.r)(connector, transports).parseAsync(process.argv);
                __rspack_async_done();
            } catch (e) {
                __rspack_async_done(e);
            }
        }, 1);
    },
    net (module) {
        module.exports = __rspack_external_net;
    },
    "node:child_process" (module) {
        module.exports = __rspack_external_node_child_process_27f17141;
    },
    "node:crypto" (module) {
        module.exports = __rspack_external_node_crypto_9ba42079;
    },
    "node:events" (module) {
        module.exports = __rspack_external_node_events_0a6aefe7;
    },
    "node:fs" (module) {
        module.exports = __rspack_external_node_fs_5ea92f0c;
    },
    "node:fs/promises" (module) {
        module.exports = __rspack_external_node_fs_promises_153e37e0;
    },
    "node:net" (module) {
        module.exports = __rspack_external_node_net_0373943e;
    },
    "node:os" (module) {
        module.exports = __rspack_external_node_os_74b4b876;
    },
    "node:path" (module) {
        module.exports = __rspack_external_node_path_c5b9b54f;
    },
    "node:process" (module) {
        module.exports = __rspack_external_node_process_786449bf;
    },
    "node:stream" (module) {
        module.exports = __rspack_external_node_stream_444d1c2b;
    },
    "node:stream/web" (module) {
        module.exports = __rspack_external_node_stream_web_2bbcbe48;
    },
    "node:timers/promises" (module) {
        module.exports = __rspack_external_node_timers_promises_aedbf14c;
    },
    os (module) {
        module.exports = __rspack_external_os;
    },
    tty (module) {
        module.exports = __rspack_external_tty;
    },
    util (module) {
        module.exports = __rspack_external_util;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/index.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { Argument } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
        const { Command } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js");
        const { CommanderError, InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        const { Help } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js");
        const { Option } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js");
        exports.program = new Command();
        exports.createCommand = (name)=>new Command(name);
        exports.createOption = (flags, description)=>new Option(flags, description);
        exports.createArgument = (name, description)=>new Argument(name, description);
        exports.Command = Command;
        exports.Option = Option;
        exports.Argument = Argument;
        exports.Help = Help;
        exports.CommanderError = CommanderError;
        exports.InvalidArgumentError = InvalidArgumentError;
        exports.InvalidOptionArgumentError = InvalidArgumentError;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        class Argument {
            constructor(name, description){
                this.description = description || '';
                this.variadic = false;
                this.parseArg = void 0;
                this.defaultValue = void 0;
                this.defaultValueDescription = void 0;
                this.argChoices = void 0;
                switch(name[0]){
                    case '<':
                        this.required = true;
                        this._name = name.slice(1, -1);
                        break;
                    case '[':
                        this.required = false;
                        this._name = name.slice(1, -1);
                        break;
                    default:
                        this.required = true;
                        this._name = name;
                        break;
                }
                if (this._name.endsWith('...')) {
                    this.variadic = true;
                    this._name = this._name.slice(0, -3);
                }
            }
            name() {
                return this._name;
            }
            _collectValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                previous.push(value);
                return previous;
            }
            default(value, description) {
                this.defaultValue = value;
                this.defaultValueDescription = description;
                return this;
            }
            argParser(fn) {
                this.parseArg = fn;
                return this;
            }
            choices(values) {
                this.argChoices = values.slice();
                this.parseArg = (arg, previous)=>{
                    if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
                    if (this.variadic) return this._collectValue(arg, previous);
                    return arg;
                };
                return this;
            }
            argRequired() {
                this.required = true;
                return this;
            }
            argOptional() {
                this.required = false;
                return this;
            }
        }
        function humanReadableArgName(arg) {
            const nameOutput = arg.name() + (true === arg.variadic ? '...' : '');
            return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
        }
        exports.Argument = Argument;
        exports.humanReadableArgName = humanReadableArgName;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js" (__unused_rspack_module, exports, __webpack_require__) {
        const EventEmitter = __webpack_require__("node:events").EventEmitter;
        const childProcess = __webpack_require__("node:child_process");
        const path = __webpack_require__("node:path");
        const fs = __webpack_require__("node:fs");
        const process1 = __webpack_require__("node:process");
        const { Argument, humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
        const { CommanderError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        const { Help, stripColor } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js");
        const { Option, DualOptions } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js");
        const { suggestSimilar } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/suggestSimilar.js");
        class Command extends EventEmitter {
            constructor(name){
                super();
                this.commands = [];
                this.options = [];
                this.parent = null;
                this._allowUnknownOption = false;
                this._allowExcessArguments = false;
                this.registeredArguments = [];
                this._args = this.registeredArguments;
                this.args = [];
                this.rawArgs = [];
                this.processedArgs = [];
                this._scriptPath = null;
                this._name = name || '';
                this._optionValues = {};
                this._optionValueSources = {};
                this._storeOptionsAsProperties = false;
                this._actionHandler = null;
                this._executableHandler = false;
                this._executableFile = null;
                this._executableDir = null;
                this._defaultCommandName = null;
                this._exitCallback = null;
                this._aliases = [];
                this._combineFlagAndOptionalValue = true;
                this._description = '';
                this._summary = '';
                this._argsDescription = void 0;
                this._enablePositionalOptions = false;
                this._passThroughOptions = false;
                this._lifeCycleHooks = {};
                this._showHelpAfterError = false;
                this._showSuggestionAfterError = true;
                this._savedState = null;
                this._outputConfiguration = {
                    writeOut: (str)=>process1.stdout.write(str),
                    writeErr: (str)=>process1.stderr.write(str),
                    outputError: (str, write)=>write(str),
                    getOutHelpWidth: ()=>process1.stdout.isTTY ? process1.stdout.columns : void 0,
                    getErrHelpWidth: ()=>process1.stderr.isTTY ? process1.stderr.columns : void 0,
                    getOutHasColors: ()=>useColor() ?? (process1.stdout.isTTY && process1.stdout.hasColors?.()),
                    getErrHasColors: ()=>useColor() ?? (process1.stderr.isTTY && process1.stderr.hasColors?.()),
                    stripColor: (str)=>stripColor(str)
                };
                this._hidden = false;
                this._helpOption = void 0;
                this._addImplicitHelpCommand = void 0;
                this._helpCommand = void 0;
                this._helpConfiguration = {};
                this._helpGroupHeading = void 0;
                this._defaultCommandGroup = void 0;
                this._defaultOptionGroup = void 0;
            }
            copyInheritedSettings(sourceCommand) {
                this._outputConfiguration = sourceCommand._outputConfiguration;
                this._helpOption = sourceCommand._helpOption;
                this._helpCommand = sourceCommand._helpCommand;
                this._helpConfiguration = sourceCommand._helpConfiguration;
                this._exitCallback = sourceCommand._exitCallback;
                this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
                this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
                this._allowExcessArguments = sourceCommand._allowExcessArguments;
                this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
                this._showHelpAfterError = sourceCommand._showHelpAfterError;
                this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
                return this;
            }
            _getCommandAndAncestors() {
                const result = [];
                for(let command = this; command; command = command.parent)result.push(command);
                return result;
            }
            command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
                let desc = actionOptsOrExecDesc;
                let opts = execOpts;
                if ('object' == typeof desc && null !== desc) {
                    opts = desc;
                    desc = null;
                }
                opts = opts || {};
                const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
                const cmd = this.createCommand(name);
                if (desc) {
                    cmd.description(desc);
                    cmd._executableHandler = true;
                }
                if (opts.isDefault) this._defaultCommandName = cmd._name;
                cmd._hidden = !!(opts.noHelp || opts.hidden);
                cmd._executableFile = opts.executableFile || null;
                if (args) cmd.arguments(args);
                this._registerCommand(cmd);
                cmd.parent = this;
                cmd.copyInheritedSettings(this);
                if (desc) return this;
                return cmd;
            }
            createCommand(name) {
                return new Command(name);
            }
            createHelp() {
                return Object.assign(new Help(), this.configureHelp());
            }
            configureHelp(configuration) {
                if (void 0 === configuration) return this._helpConfiguration;
                this._helpConfiguration = configuration;
                return this;
            }
            configureOutput(configuration) {
                if (void 0 === configuration) return this._outputConfiguration;
                this._outputConfiguration = {
                    ...this._outputConfiguration,
                    ...configuration
                };
                return this;
            }
            showHelpAfterError(displayHelp = true) {
                if ('string' != typeof displayHelp) displayHelp = !!displayHelp;
                this._showHelpAfterError = displayHelp;
                return this;
            }
            showSuggestionAfterError(displaySuggestion = true) {
                this._showSuggestionAfterError = !!displaySuggestion;
                return this;
            }
            addCommand(cmd, opts) {
                if (!cmd._name) throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
                opts = opts || {};
                if (opts.isDefault) this._defaultCommandName = cmd._name;
                if (opts.noHelp || opts.hidden) cmd._hidden = true;
                this._registerCommand(cmd);
                cmd.parent = this;
                cmd._checkForBrokenPassThrough();
                return this;
            }
            createArgument(name, description) {
                return new Argument(name, description);
            }
            argument(name, description, parseArg, defaultValue) {
                const argument = this.createArgument(name, description);
                if ('function' == typeof parseArg) argument.default(defaultValue).argParser(parseArg);
                else argument.default(parseArg);
                this.addArgument(argument);
                return this;
            }
            arguments(names) {
                names.trim().split(/ +/).forEach((detail)=>{
                    this.argument(detail);
                });
                return this;
            }
            addArgument(argument) {
                const previousArgument = this.registeredArguments.slice(-1)[0];
                if (previousArgument?.variadic) throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
                if (argument.required && void 0 !== argument.defaultValue && void 0 === argument.parseArg) throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
                this.registeredArguments.push(argument);
                return this;
            }
            helpCommand(enableOrNameAndArgs, description) {
                if ('boolean' == typeof enableOrNameAndArgs) {
                    this._addImplicitHelpCommand = enableOrNameAndArgs;
                    if (enableOrNameAndArgs && this._defaultCommandGroup) this._initCommandGroup(this._getHelpCommand());
                    return this;
                }
                const nameAndArgs = enableOrNameAndArgs ?? 'help [command]';
                const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
                const helpDescription = description ?? 'display help for command';
                const helpCommand = this.createCommand(helpName);
                helpCommand.helpOption(false);
                if (helpArgs) helpCommand.arguments(helpArgs);
                if (helpDescription) helpCommand.description(helpDescription);
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
                return this;
            }
            addHelpCommand(helpCommand, deprecatedDescription) {
                if ('object' != typeof helpCommand) {
                    this.helpCommand(helpCommand, deprecatedDescription);
                    return this;
                }
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                this._initCommandGroup(helpCommand);
                return this;
            }
            _getHelpCommand() {
                const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand('help'));
                if (hasImplicitHelpCommand) {
                    if (void 0 === this._helpCommand) this.helpCommand(void 0, void 0);
                    return this._helpCommand;
                }
                return null;
            }
            hook(event, listener) {
                const allowedValues = [
                    'preSubcommand',
                    'preAction',
                    'postAction'
                ];
                if (!allowedValues.includes(event)) throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
                if (this._lifeCycleHooks[event]) this._lifeCycleHooks[event].push(listener);
                else this._lifeCycleHooks[event] = [
                    listener
                ];
                return this;
            }
            exitOverride(fn) {
                if (fn) this._exitCallback = fn;
                else this._exitCallback = (err)=>{
                    if ('commander.executeSubCommandAsync' !== err.code) throw err;
                };
                return this;
            }
            _exit(exitCode, code, message) {
                if (this._exitCallback) this._exitCallback(new CommanderError(exitCode, code, message));
                process1.exit(exitCode);
            }
            action(fn) {
                const listener = (args)=>{
                    const expectedArgsCount = this.registeredArguments.length;
                    const actionArgs = args.slice(0, expectedArgsCount);
                    if (this._storeOptionsAsProperties) actionArgs[expectedArgsCount] = this;
                    else actionArgs[expectedArgsCount] = this.opts();
                    actionArgs.push(this);
                    return fn.apply(this, actionArgs);
                };
                this._actionHandler = listener;
                return this;
            }
            createOption(flags, description) {
                return new Option(flags, description);
            }
            _callParseArg(target, value, previous, invalidArgumentMessage) {
                try {
                    return target.parseArg(value, previous);
                } catch (err) {
                    if ('commander.invalidArgument' === err.code) {
                        const message = `${invalidArgumentMessage} ${err.message}`;
                        this.error(message, {
                            exitCode: err.exitCode,
                            code: err.code
                        });
                    }
                    throw err;
                }
            }
            _registerOption(option) {
                const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
                if (matchingOption) {
                    const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
                    throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
                }
                this._initOptionGroup(option);
                this.options.push(option);
            }
            _registerCommand(command) {
                const knownBy = (cmd)=>[
                        cmd.name()
                    ].concat(cmd.aliases());
                const alreadyUsed = knownBy(command).find((name)=>this._findCommand(name));
                if (alreadyUsed) {
                    const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|');
                    const newCmd = knownBy(command).join('|');
                    throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
                }
                this._initCommandGroup(command);
                this.commands.push(command);
            }
            addOption(option) {
                this._registerOption(option);
                const oname = option.name();
                const name = option.attributeName();
                if (option.negate) {
                    const positiveLongFlag = option.long.replace(/^--no-/, '--');
                    if (!this._findOption(positiveLongFlag)) this.setOptionValueWithSource(name, void 0 === option.defaultValue ? true : option.defaultValue, 'default');
                } else if (void 0 !== option.defaultValue) this.setOptionValueWithSource(name, option.defaultValue, 'default');
                const handleOptionValue = (val, invalidValueMessage, valueSource)=>{
                    if (null == val && void 0 !== option.presetArg) val = option.presetArg;
                    const oldValue = this.getOptionValue(name);
                    if (null !== val && option.parseArg) val = this._callParseArg(option, val, oldValue, invalidValueMessage);
                    else if (null !== val && option.variadic) val = option._collectValue(val, oldValue);
                    if (null == val) val = option.negate ? false : option.isBoolean() || option.optional ? true : '';
                    this.setOptionValueWithSource(name, val, valueSource);
                };
                this.on('option:' + oname, (val)=>{
                    const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
                    handleOptionValue(val, invalidValueMessage, 'cli');
                });
                if (option.envVar) this.on('optionEnv:' + oname, (val)=>{
                    const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
                    handleOptionValue(val, invalidValueMessage, 'env');
                });
                return this;
            }
            _optionEx(config, flags, description, fn, defaultValue) {
                if ('object' == typeof flags && flags instanceof Option) throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
                const option = this.createOption(flags, description);
                option.makeOptionMandatory(!!config.mandatory);
                if ('function' == typeof fn) option.default(defaultValue).argParser(fn);
                else if (fn instanceof RegExp) {
                    const regex = fn;
                    fn = (val, def)=>{
                        const m = regex.exec(val);
                        return m ? m[0] : def;
                    };
                    option.default(defaultValue).argParser(fn);
                } else option.default(fn);
                return this.addOption(option);
            }
            option(flags, description, parseArg, defaultValue) {
                return this._optionEx({}, flags, description, parseArg, defaultValue);
            }
            requiredOption(flags, description, parseArg, defaultValue) {
                return this._optionEx({
                    mandatory: true
                }, flags, description, parseArg, defaultValue);
            }
            combineFlagAndOptionalValue(combine = true) {
                this._combineFlagAndOptionalValue = !!combine;
                return this;
            }
            allowUnknownOption(allowUnknown = true) {
                this._allowUnknownOption = !!allowUnknown;
                return this;
            }
            allowExcessArguments(allowExcess = true) {
                this._allowExcessArguments = !!allowExcess;
                return this;
            }
            enablePositionalOptions(positional = true) {
                this._enablePositionalOptions = !!positional;
                return this;
            }
            passThroughOptions(passThrough = true) {
                this._passThroughOptions = !!passThrough;
                this._checkForBrokenPassThrough();
                return this;
            }
            _checkForBrokenPassThrough() {
                if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
            }
            storeOptionsAsProperties(storeAsProperties = true) {
                if (this.options.length) throw new Error('call .storeOptionsAsProperties() before adding options');
                if (Object.keys(this._optionValues).length) throw new Error('call .storeOptionsAsProperties() before setting option values');
                this._storeOptionsAsProperties = !!storeAsProperties;
                return this;
            }
            getOptionValue(key) {
                if (this._storeOptionsAsProperties) return this[key];
                return this._optionValues[key];
            }
            setOptionValue(key, value) {
                return this.setOptionValueWithSource(key, value, void 0);
            }
            setOptionValueWithSource(key, value, source) {
                if (this._storeOptionsAsProperties) this[key] = value;
                else this._optionValues[key] = value;
                this._optionValueSources[key] = source;
                return this;
            }
            getOptionValueSource(key) {
                return this._optionValueSources[key];
            }
            getOptionValueSourceWithGlobals(key) {
                let source;
                this._getCommandAndAncestors().forEach((cmd)=>{
                    if (void 0 !== cmd.getOptionValueSource(key)) source = cmd.getOptionValueSource(key);
                });
                return source;
            }
            _prepareUserArgs(argv, parseOptions) {
                if (void 0 !== argv && !Array.isArray(argv)) throw new Error('first parameter to parse must be array or undefined');
                parseOptions = parseOptions || {};
                if (void 0 === argv && void 0 === parseOptions.from) {
                    if (process1.versions?.electron) parseOptions.from = 'electron';
                    const execArgv = process1.execArgv ?? [];
                    if (execArgv.includes('-e') || execArgv.includes('--eval') || execArgv.includes('-p') || execArgv.includes('--print')) parseOptions.from = 'eval';
                }
                if (void 0 === argv) argv = process1.argv;
                this.rawArgs = argv.slice();
                let userArgs;
                switch(parseOptions.from){
                    case void 0:
                    case 'node':
                        this._scriptPath = argv[1];
                        userArgs = argv.slice(2);
                        break;
                    case 'electron':
                        if (process1.defaultApp) {
                            this._scriptPath = argv[1];
                            userArgs = argv.slice(2);
                        } else userArgs = argv.slice(1);
                        break;
                    case 'user':
                        userArgs = argv.slice(0);
                        break;
                    case 'eval':
                        userArgs = argv.slice(1);
                        break;
                    default:
                        throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
                }
                if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
                this._name = this._name || 'program';
                return userArgs;
            }
            parse(argv, parseOptions) {
                this._prepareForParse();
                const userArgs = this._prepareUserArgs(argv, parseOptions);
                this._parseCommand([], userArgs);
                return this;
            }
            async parseAsync(argv, parseOptions) {
                this._prepareForParse();
                const userArgs = this._prepareUserArgs(argv, parseOptions);
                await this._parseCommand([], userArgs);
                return this;
            }
            _prepareForParse() {
                if (null === this._savedState) this.saveStateBeforeParse();
                else this.restoreStateBeforeParse();
            }
            saveStateBeforeParse() {
                this._savedState = {
                    _name: this._name,
                    _optionValues: {
                        ...this._optionValues
                    },
                    _optionValueSources: {
                        ...this._optionValueSources
                    }
                };
            }
            restoreStateBeforeParse() {
                if (this._storeOptionsAsProperties) throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
                this._name = this._savedState._name;
                this._scriptPath = null;
                this.rawArgs = [];
                this._optionValues = {
                    ...this._savedState._optionValues
                };
                this._optionValueSources = {
                    ...this._savedState._optionValueSources
                };
                this.args = [];
                this.processedArgs = [];
            }
            _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
                if (fs.existsSync(executableFile)) return;
                const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
                const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
                throw new Error(executableMissing);
            }
            _executeSubCommand(subcommand, args) {
                args = args.slice();
                let launchWithNode = false;
                const sourceExt = [
                    '.js',
                    '.ts',
                    '.tsx',
                    '.mjs',
                    '.cjs'
                ];
                function findFile(baseDir, baseName) {
                    const localBin = path.resolve(baseDir, baseName);
                    if (fs.existsSync(localBin)) return localBin;
                    if (sourceExt.includes(path.extname(baseName))) return;
                    const foundExt = sourceExt.find((ext)=>fs.existsSync(`${localBin}${ext}`));
                    if (foundExt) return `${localBin}${foundExt}`;
                }
                this._checkForMissingMandatoryOptions();
                this._checkForConflictingOptions();
                let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
                let executableDir = this._executableDir || '';
                if (this._scriptPath) {
                    let resolvedScriptPath;
                    try {
                        resolvedScriptPath = fs.realpathSync(this._scriptPath);
                    } catch  {
                        resolvedScriptPath = this._scriptPath;
                    }
                    executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
                }
                if (executableDir) {
                    let localFile = findFile(executableDir, executableFile);
                    if (!localFile && !subcommand._executableFile && this._scriptPath) {
                        const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
                        if (legacyName !== this._name) localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
                    }
                    executableFile = localFile || executableFile;
                }
                launchWithNode = sourceExt.includes(path.extname(executableFile));
                let proc;
                if ('win32' !== process1.platform) if (launchWithNode) {
                    args.unshift(executableFile);
                    args = incrementNodeInspectorPort(process1.execArgv).concat(args);
                    proc = childProcess.spawn(process1.argv[0], args, {
                        stdio: 'inherit'
                    });
                } else proc = childProcess.spawn(executableFile, args, {
                    stdio: 'inherit'
                });
                else {
                    this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                    args.unshift(executableFile);
                    args = incrementNodeInspectorPort(process1.execArgv).concat(args);
                    proc = childProcess.spawn(process1.execPath, args, {
                        stdio: 'inherit'
                    });
                }
                if (!proc.killed) {
                    const signals = [
                        'SIGUSR1',
                        'SIGUSR2',
                        'SIGTERM',
                        'SIGINT',
                        'SIGHUP'
                    ];
                    signals.forEach((signal)=>{
                        process1.on(signal, ()=>{
                            if (false === proc.killed && null === proc.exitCode) proc.kill(signal);
                        });
                    });
                }
                const exitCallback = this._exitCallback;
                proc.on('close', (code)=>{
                    code = code ?? 1;
                    if (exitCallback) exitCallback(new CommanderError(code, 'commander.executeSubCommandAsync', '(close)'));
                    else process1.exit(code);
                });
                proc.on('error', (err)=>{
                    if ('ENOENT' === err.code) this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                    else if ('EACCES' === err.code) throw new Error(`'${executableFile}' not executable`);
                    if (exitCallback) {
                        const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
                        wrappedError.nestedError = err;
                        exitCallback(wrappedError);
                    } else process1.exit(1);
                });
                this.runningCommand = proc;
            }
            _dispatchSubcommand(commandName, operands, unknown) {
                const subCommand = this._findCommand(commandName);
                if (!subCommand) this.help({
                    error: true
                });
                subCommand._prepareForParse();
                let promiseChain;
                promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand');
                promiseChain = this._chainOrCall(promiseChain, ()=>{
                    if (!subCommand._executableHandler) return subCommand._parseCommand(operands, unknown);
                    this._executeSubCommand(subCommand, operands.concat(unknown));
                });
                return promiseChain;
            }
            _dispatchHelpCommand(subcommandName) {
                if (!subcommandName) this.help();
                const subCommand = this._findCommand(subcommandName);
                if (subCommand && !subCommand._executableHandler) subCommand.help();
                return this._dispatchSubcommand(subcommandName, [], [
                    this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? '--help'
                ]);
            }
            _checkNumberOfArguments() {
                this.registeredArguments.forEach((arg, i)=>{
                    if (arg.required && null == this.args[i]) this.missingArgument(arg.name());
                });
                if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) return;
                if (this.args.length > this.registeredArguments.length) this._excessArguments(this.args);
            }
            _processArguments() {
                const myParseArg = (argument, value, previous)=>{
                    let parsedValue = value;
                    if (null !== value && argument.parseArg) {
                        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
                        parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
                    }
                    return parsedValue;
                };
                this._checkNumberOfArguments();
                const processedArgs = [];
                this.registeredArguments.forEach((declaredArg, index)=>{
                    let value = declaredArg.defaultValue;
                    if (declaredArg.variadic) {
                        if (index < this.args.length) {
                            value = this.args.slice(index);
                            if (declaredArg.parseArg) value = value.reduce((processed, v)=>myParseArg(declaredArg, v, processed), declaredArg.defaultValue);
                        } else if (void 0 === value) value = [];
                    } else if (index < this.args.length) {
                        value = this.args[index];
                        if (declaredArg.parseArg) value = myParseArg(declaredArg, value, declaredArg.defaultValue);
                    }
                    processedArgs[index] = value;
                });
                this.processedArgs = processedArgs;
            }
            _chainOrCall(promise, fn) {
                if (promise?.then && 'function' == typeof promise.then) return promise.then(()=>fn());
                return fn();
            }
            _chainOrCallHooks(promise, event) {
                let result = promise;
                const hooks = [];
                this._getCommandAndAncestors().reverse().filter((cmd)=>void 0 !== cmd._lifeCycleHooks[event]).forEach((hookedCommand)=>{
                    hookedCommand._lifeCycleHooks[event].forEach((callback)=>{
                        hooks.push({
                            hookedCommand,
                            callback
                        });
                    });
                });
                if ('postAction' === event) hooks.reverse();
                hooks.forEach((hookDetail)=>{
                    result = this._chainOrCall(result, ()=>hookDetail.callback(hookDetail.hookedCommand, this));
                });
                return result;
            }
            _chainOrCallSubCommandHook(promise, subCommand, event) {
                let result = promise;
                if (void 0 !== this._lifeCycleHooks[event]) this._lifeCycleHooks[event].forEach((hook)=>{
                    result = this._chainOrCall(result, ()=>hook(this, subCommand));
                });
                return result;
            }
            _parseCommand(operands, unknown) {
                const parsed = this.parseOptions(unknown);
                this._parseOptionsEnv();
                this._parseOptionsImplied();
                operands = operands.concat(parsed.operands);
                unknown = parsed.unknown;
                this.args = operands.concat(unknown);
                if (operands && this._findCommand(operands[0])) return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
                if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) return this._dispatchHelpCommand(operands[1]);
                if (this._defaultCommandName) {
                    this._outputHelpIfRequested(unknown);
                    return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
                }
                if (this.commands.length && 0 === this.args.length && !this._actionHandler && !this._defaultCommandName) this.help({
                    error: true
                });
                this._outputHelpIfRequested(parsed.unknown);
                this._checkForMissingMandatoryOptions();
                this._checkForConflictingOptions();
                const checkForUnknownOptions = ()=>{
                    if (parsed.unknown.length > 0) this.unknownOption(parsed.unknown[0]);
                };
                const commandEvent = `command:${this.name()}`;
                if (this._actionHandler) {
                    checkForUnknownOptions();
                    this._processArguments();
                    let promiseChain;
                    promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
                    promiseChain = this._chainOrCall(promiseChain, ()=>this._actionHandler(this.processedArgs));
                    if (this.parent) promiseChain = this._chainOrCall(promiseChain, ()=>{
                        this.parent.emit(commandEvent, operands, unknown);
                    });
                    promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
                    return promiseChain;
                }
                if (this.parent?.listenerCount(commandEvent)) {
                    checkForUnknownOptions();
                    this._processArguments();
                    this.parent.emit(commandEvent, operands, unknown);
                } else if (operands.length) {
                    if (this._findCommand('*')) return this._dispatchSubcommand('*', operands, unknown);
                    if (this.listenerCount('command:*')) this.emit('command:*', operands, unknown);
                    else if (this.commands.length) this.unknownCommand();
                    else {
                        checkForUnknownOptions();
                        this._processArguments();
                    }
                } else if (this.commands.length) {
                    checkForUnknownOptions();
                    this.help({
                        error: true
                    });
                } else {
                    checkForUnknownOptions();
                    this._processArguments();
                }
            }
            _findCommand(name) {
                if (!name) return;
                return this.commands.find((cmd)=>cmd._name === name || cmd._aliases.includes(name));
            }
            _findOption(arg) {
                return this.options.find((option)=>option.is(arg));
            }
            _checkForMissingMandatoryOptions() {
                this._getCommandAndAncestors().forEach((cmd)=>{
                    cmd.options.forEach((anOption)=>{
                        if (anOption.mandatory && void 0 === cmd.getOptionValue(anOption.attributeName())) cmd.missingMandatoryOptionValue(anOption);
                    });
                });
            }
            _checkForConflictingLocalOptions() {
                const definedNonDefaultOptions = this.options.filter((option)=>{
                    const optionKey = option.attributeName();
                    if (void 0 === this.getOptionValue(optionKey)) return false;
                    return 'default' !== this.getOptionValueSource(optionKey);
                });
                const optionsWithConflicting = definedNonDefaultOptions.filter((option)=>option.conflictsWith.length > 0);
                optionsWithConflicting.forEach((option)=>{
                    const conflictingAndDefined = definedNonDefaultOptions.find((defined)=>option.conflictsWith.includes(defined.attributeName()));
                    if (conflictingAndDefined) this._conflictingOption(option, conflictingAndDefined);
                });
            }
            _checkForConflictingOptions() {
                this._getCommandAndAncestors().forEach((cmd)=>{
                    cmd._checkForConflictingLocalOptions();
                });
            }
            parseOptions(args) {
                const operands = [];
                const unknown = [];
                let dest = operands;
                function maybeOption(arg) {
                    return arg.length > 1 && '-' === arg[0];
                }
                const negativeNumberArg = (arg)=>{
                    if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
                    return !this._getCommandAndAncestors().some((cmd)=>cmd.options.map((opt)=>opt.short).some((short)=>/^-\d$/.test(short)));
                };
                let activeVariadicOption = null;
                let activeGroup = null;
                let i = 0;
                while(i < args.length || activeGroup){
                    const arg = activeGroup ?? args[i++];
                    activeGroup = null;
                    if ('--' === arg) {
                        if (dest === unknown) dest.push(arg);
                        dest.push(...args.slice(i));
                        break;
                    }
                    if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
                        this.emit(`option:${activeVariadicOption.name()}`, arg);
                        continue;
                    }
                    activeVariadicOption = null;
                    if (maybeOption(arg)) {
                        const option = this._findOption(arg);
                        if (option) {
                            if (option.required) {
                                const value = args[i++];
                                if (void 0 === value) this.optionMissingArgument(option);
                                this.emit(`option:${option.name()}`, value);
                            } else if (option.optional) {
                                let value = null;
                                if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) value = args[i++];
                                this.emit(`option:${option.name()}`, value);
                            } else this.emit(`option:${option.name()}`);
                            activeVariadicOption = option.variadic ? option : null;
                            continue;
                        }
                    }
                    if (arg.length > 2 && '-' === arg[0] && '-' !== arg[1]) {
                        const option = this._findOption(`-${arg[1]}`);
                        if (option) {
                            if (option.required || option.optional && this._combineFlagAndOptionalValue) this.emit(`option:${option.name()}`, arg.slice(2));
                            else {
                                this.emit(`option:${option.name()}`);
                                activeGroup = `-${arg.slice(2)}`;
                            }
                            continue;
                        }
                    }
                    if (/^--[^=]+=/.test(arg)) {
                        const index = arg.indexOf('=');
                        const option = this._findOption(arg.slice(0, index));
                        if (option && (option.required || option.optional)) {
                            this.emit(`option:${option.name()}`, arg.slice(index + 1));
                            continue;
                        }
                    }
                    if (dest === operands && maybeOption(arg) && !(0 === this.commands.length && negativeNumberArg(arg))) dest = unknown;
                    if ((this._enablePositionalOptions || this._passThroughOptions) && 0 === operands.length && 0 === unknown.length) {
                        if (this._findCommand(arg)) {
                            operands.push(arg);
                            unknown.push(...args.slice(i));
                            break;
                        } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
                            operands.push(arg, ...args.slice(i));
                            break;
                        } else if (this._defaultCommandName) {
                            unknown.push(arg, ...args.slice(i));
                            break;
                        }
                    }
                    if (this._passThroughOptions) {
                        dest.push(arg, ...args.slice(i));
                        break;
                    }
                    dest.push(arg);
                }
                return {
                    operands,
                    unknown
                };
            }
            opts() {
                if (this._storeOptionsAsProperties) {
                    const result = {};
                    const len = this.options.length;
                    for(let i = 0; i < len; i++){
                        const key = this.options[i].attributeName();
                        result[key] = key === this._versionOptionName ? this._version : this[key];
                    }
                    return result;
                }
                return this._optionValues;
            }
            optsWithGlobals() {
                return this._getCommandAndAncestors().reduce((combinedOptions, cmd)=>Object.assign(combinedOptions, cmd.opts()), {});
            }
            error(message, errorOptions) {
                this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
                if ('string' == typeof this._showHelpAfterError) this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
                else if (this._showHelpAfterError) {
                    this._outputConfiguration.writeErr('\n');
                    this.outputHelp({
                        error: true
                    });
                }
                const config = errorOptions || {};
                const exitCode = config.exitCode || 1;
                const code = config.code || 'commander.error';
                this._exit(exitCode, code, message);
            }
            _parseOptionsEnv() {
                this.options.forEach((option)=>{
                    if (option.envVar && option.envVar in process1.env) {
                        const optionKey = option.attributeName();
                        if (void 0 === this.getOptionValue(optionKey) || [
                            'default',
                            'config',
                            'env'
                        ].includes(this.getOptionValueSource(optionKey))) if (option.required || option.optional) this.emit(`optionEnv:${option.name()}`, process1.env[option.envVar]);
                        else this.emit(`optionEnv:${option.name()}`);
                    }
                });
            }
            _parseOptionsImplied() {
                const dualHelper = new DualOptions(this.options);
                const hasCustomOptionValue = (optionKey)=>void 0 !== this.getOptionValue(optionKey) && ![
                        'default',
                        'implied'
                    ].includes(this.getOptionValueSource(optionKey));
                this.options.filter((option)=>void 0 !== option.implied && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option)=>{
                    Object.keys(option.implied).filter((impliedKey)=>!hasCustomOptionValue(impliedKey)).forEach((impliedKey)=>{
                        this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
                    });
                });
            }
            missingArgument(name) {
                const message = `error: missing required argument '${name}'`;
                this.error(message, {
                    code: 'commander.missingArgument'
                });
            }
            optionMissingArgument(option) {
                const message = `error: option '${option.flags}' argument missing`;
                this.error(message, {
                    code: 'commander.optionMissingArgument'
                });
            }
            missingMandatoryOptionValue(option) {
                const message = `error: required option '${option.flags}' not specified`;
                this.error(message, {
                    code: 'commander.missingMandatoryOptionValue'
                });
            }
            _conflictingOption(option, conflictingOption) {
                const findBestOptionFromValue = (option)=>{
                    const optionKey = option.attributeName();
                    const optionValue = this.getOptionValue(optionKey);
                    const negativeOption = this.options.find((target)=>target.negate && optionKey === target.attributeName());
                    const positiveOption = this.options.find((target)=>!target.negate && optionKey === target.attributeName());
                    if (negativeOption && (void 0 === negativeOption.presetArg && false === optionValue || void 0 !== negativeOption.presetArg && optionValue === negativeOption.presetArg)) return negativeOption;
                    return positiveOption || option;
                };
                const getErrorMessage = (option)=>{
                    const bestOption = findBestOptionFromValue(option);
                    const optionKey = bestOption.attributeName();
                    const source = this.getOptionValueSource(optionKey);
                    if ('env' === source) return `environment variable '${bestOption.envVar}'`;
                    return `option '${bestOption.flags}'`;
                };
                const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
                this.error(message, {
                    code: 'commander.conflictingOption'
                });
            }
            unknownOption(flag) {
                if (this._allowUnknownOption) return;
                let suggestion = '';
                if (flag.startsWith('--') && this._showSuggestionAfterError) {
                    let candidateFlags = [];
                    let command = this;
                    do {
                        const moreFlags = command.createHelp().visibleOptions(command).filter((option)=>option.long).map((option)=>option.long);
                        candidateFlags = candidateFlags.concat(moreFlags);
                        command = command.parent;
                    }while (command && !command._enablePositionalOptions);
                    suggestion = suggestSimilar(flag, candidateFlags);
                }
                const message = `error: unknown option '${flag}'${suggestion}`;
                this.error(message, {
                    code: 'commander.unknownOption'
                });
            }
            _excessArguments(receivedArgs) {
                if (this._allowExcessArguments) return;
                const expected = this.registeredArguments.length;
                const s = 1 === expected ? '' : 's';
                const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
                const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
                this.error(message, {
                    code: 'commander.excessArguments'
                });
            }
            unknownCommand() {
                const unknownName = this.args[0];
                let suggestion = '';
                if (this._showSuggestionAfterError) {
                    const candidateNames = [];
                    this.createHelp().visibleCommands(this).forEach((command)=>{
                        candidateNames.push(command.name());
                        if (command.alias()) candidateNames.push(command.alias());
                    });
                    suggestion = suggestSimilar(unknownName, candidateNames);
                }
                const message = `error: unknown command '${unknownName}'${suggestion}`;
                this.error(message, {
                    code: 'commander.unknownCommand'
                });
            }
            version(str, flags, description) {
                if (void 0 === str) return this._version;
                this._version = str;
                flags = flags || '-V, --version';
                description = description || 'output the version number';
                const versionOption = this.createOption(flags, description);
                this._versionOptionName = versionOption.attributeName();
                this._registerOption(versionOption);
                this.on('option:' + versionOption.name(), ()=>{
                    this._outputConfiguration.writeOut(`${str}\n`);
                    this._exit(0, 'commander.version', str);
                });
                return this;
            }
            description(str, argsDescription) {
                if (void 0 === str && void 0 === argsDescription) return this._description;
                this._description = str;
                if (argsDescription) this._argsDescription = argsDescription;
                return this;
            }
            summary(str) {
                if (void 0 === str) return this._summary;
                this._summary = str;
                return this;
            }
            alias(alias) {
                if (void 0 === alias) return this._aliases[0];
                let command = this;
                if (0 !== this.commands.length && this.commands[this.commands.length - 1]._executableHandler) command = this.commands[this.commands.length - 1];
                if (alias === command._name) throw new Error("Command alias can't be the same as its name");
                const matchingCommand = this.parent?._findCommand(alias);
                if (matchingCommand) {
                    const existingCmd = [
                        matchingCommand.name()
                    ].concat(matchingCommand.aliases()).join('|');
                    throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
                }
                command._aliases.push(alias);
                return this;
            }
            aliases(aliases) {
                if (void 0 === aliases) return this._aliases;
                aliases.forEach((alias)=>this.alias(alias));
                return this;
            }
            usage(str) {
                if (void 0 === str) {
                    if (this._usage) return this._usage;
                    const args = this.registeredArguments.map((arg)=>humanReadableArgName(arg));
                    return [].concat(this.options.length || null !== this._helpOption ? '[options]' : [], this.commands.length ? '[command]' : [], this.registeredArguments.length ? args : []).join(' ');
                }
                this._usage = str;
                return this;
            }
            name(str) {
                if (void 0 === str) return this._name;
                this._name = str;
                return this;
            }
            helpGroup(heading) {
                if (void 0 === heading) return this._helpGroupHeading ?? '';
                this._helpGroupHeading = heading;
                return this;
            }
            commandsGroup(heading) {
                if (void 0 === heading) return this._defaultCommandGroup ?? '';
                this._defaultCommandGroup = heading;
                return this;
            }
            optionsGroup(heading) {
                if (void 0 === heading) return this._defaultOptionGroup ?? '';
                this._defaultOptionGroup = heading;
                return this;
            }
            _initOptionGroup(option) {
                if (this._defaultOptionGroup && !option.helpGroupHeading) option.helpGroup(this._defaultOptionGroup);
            }
            _initCommandGroup(cmd) {
                if (this._defaultCommandGroup && !cmd.helpGroup()) cmd.helpGroup(this._defaultCommandGroup);
            }
            nameFromFilename(filename) {
                this._name = path.basename(filename, path.extname(filename));
                return this;
            }
            executableDir(path) {
                if (void 0 === path) return this._executableDir;
                this._executableDir = path;
                return this;
            }
            helpInformation(contextOptions) {
                const helper = this.createHelp();
                const context = this._getOutputContext(contextOptions);
                helper.prepareContext({
                    error: context.error,
                    helpWidth: context.helpWidth,
                    outputHasColors: context.hasColors
                });
                const text = helper.formatHelp(this, helper);
                if (context.hasColors) return text;
                return this._outputConfiguration.stripColor(text);
            }
            _getOutputContext(contextOptions) {
                contextOptions = contextOptions || {};
                const error = !!contextOptions.error;
                let baseWrite;
                let hasColors;
                let helpWidth;
                if (error) {
                    baseWrite = (str)=>this._outputConfiguration.writeErr(str);
                    hasColors = this._outputConfiguration.getErrHasColors();
                    helpWidth = this._outputConfiguration.getErrHelpWidth();
                } else {
                    baseWrite = (str)=>this._outputConfiguration.writeOut(str);
                    hasColors = this._outputConfiguration.getOutHasColors();
                    helpWidth = this._outputConfiguration.getOutHelpWidth();
                }
                const write = (str)=>{
                    if (!hasColors) str = this._outputConfiguration.stripColor(str);
                    return baseWrite(str);
                };
                return {
                    error,
                    write,
                    hasColors,
                    helpWidth
                };
            }
            outputHelp(contextOptions) {
                let deprecatedCallback;
                if ('function' == typeof contextOptions) {
                    deprecatedCallback = contextOptions;
                    contextOptions = void 0;
                }
                const outputContext = this._getOutputContext(contextOptions);
                const eventContext = {
                    error: outputContext.error,
                    write: outputContext.write,
                    command: this
                };
                this._getCommandAndAncestors().reverse().forEach((command)=>command.emit('beforeAllHelp', eventContext));
                this.emit('beforeHelp', eventContext);
                let helpInformation = this.helpInformation({
                    error: outputContext.error
                });
                if (deprecatedCallback) {
                    helpInformation = deprecatedCallback(helpInformation);
                    if ('string' != typeof helpInformation && !Buffer.isBuffer(helpInformation)) throw new Error('outputHelp callback must return a string or a Buffer');
                }
                outputContext.write(helpInformation);
                if (this._getHelpOption()?.long) this.emit(this._getHelpOption().long);
                this.emit('afterHelp', eventContext);
                this._getCommandAndAncestors().forEach((command)=>command.emit('afterAllHelp', eventContext));
            }
            helpOption(flags, description) {
                if ('boolean' == typeof flags) {
                    if (flags) {
                        if (null === this._helpOption) this._helpOption = void 0;
                        if (this._defaultOptionGroup) this._initOptionGroup(this._getHelpOption());
                    } else this._helpOption = null;
                    return this;
                }
                this._helpOption = this.createOption(flags ?? '-h, --help', description ?? 'display help for command');
                if (flags || description) this._initOptionGroup(this._helpOption);
                return this;
            }
            _getHelpOption() {
                if (void 0 === this._helpOption) this.helpOption(void 0, void 0);
                return this._helpOption;
            }
            addHelpOption(option) {
                this._helpOption = option;
                this._initOptionGroup(option);
                return this;
            }
            help(contextOptions) {
                this.outputHelp(contextOptions);
                let exitCode = Number(process1.exitCode ?? 0);
                if (0 === exitCode && contextOptions && 'function' != typeof contextOptions && contextOptions.error) exitCode = 1;
                this._exit(exitCode, 'commander.help', '(outputHelp)');
            }
            addHelpText(position, text) {
                const allowedValues = [
                    'beforeAll',
                    'before',
                    'after',
                    'afterAll'
                ];
                if (!allowedValues.includes(position)) throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
                const helpEvent = `${position}Help`;
                this.on(helpEvent, (context)=>{
                    let helpStr;
                    helpStr = 'function' == typeof text ? text({
                        error: context.error,
                        command: context.command
                    }) : text;
                    if (helpStr) context.write(`${helpStr}\n`);
                });
                return this;
            }
            _outputHelpIfRequested(args) {
                const helpOption = this._getHelpOption();
                const helpRequested = helpOption && args.find((arg)=>helpOption.is(arg));
                if (helpRequested) {
                    this.outputHelp();
                    this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
                }
            }
        }
        function incrementNodeInspectorPort(args) {
            return args.map((arg)=>{
                if (!arg.startsWith('--inspect')) return arg;
                let debugOption;
                let debugHost = '127.0.0.1';
                let debugPort = '9229';
                let match;
                if (null !== (match = arg.match(/^(--inspect(-brk)?)$/))) debugOption = match[1];
                else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/))) {
                    debugOption = match[1];
                    if (/^\d+$/.test(match[3])) debugPort = match[3];
                    else debugHost = match[3];
                } else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/))) {
                    debugOption = match[1];
                    debugHost = match[3];
                    debugPort = match[4];
                }
                if (debugOption && '0' !== debugPort) return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
                return arg;
            });
        }
        function useColor() {
            if (process1.env.NO_COLOR || '0' === process1.env.FORCE_COLOR || 'false' === process1.env.FORCE_COLOR) return false;
            if (process1.env.FORCE_COLOR || void 0 !== process1.env.CLICOLOR_FORCE) return true;
        }
        exports.Command = Command;
        exports.useColor = useColor;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js" (__unused_rspack_module, exports) {
        class CommanderError extends Error {
            constructor(exitCode, code, message){
                super(message);
                Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
                this.code = code;
                this.exitCode = exitCode;
                this.nestedError = void 0;
            }
        }
        class InvalidArgumentError extends CommanderError {
            constructor(message){
                super(1, 'commander.invalidArgument', message);
                Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
            }
        }
        exports.CommanderError = CommanderError;
        exports.InvalidArgumentError = InvalidArgumentError;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
        class Help {
            constructor(){
                this.helpWidth = void 0;
                this.minWidthToWrap = 40;
                this.sortSubcommands = false;
                this.sortOptions = false;
                this.showGlobalOptions = false;
            }
            prepareContext(contextOptions) {
                this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
            }
            visibleCommands(cmd) {
                const visibleCommands = cmd.commands.filter((cmd)=>!cmd._hidden);
                const helpCommand = cmd._getHelpCommand();
                if (helpCommand && !helpCommand._hidden) visibleCommands.push(helpCommand);
                if (this.sortSubcommands) visibleCommands.sort((a, b)=>a.name().localeCompare(b.name()));
                return visibleCommands;
            }
            compareOptions(a, b) {
                const getSortKey = (option)=>option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
                return getSortKey(a).localeCompare(getSortKey(b));
            }
            visibleOptions(cmd) {
                const visibleOptions = cmd.options.filter((option)=>!option.hidden);
                const helpOption = cmd._getHelpOption();
                if (helpOption && !helpOption.hidden) {
                    const removeShort = helpOption.short && cmd._findOption(helpOption.short);
                    const removeLong = helpOption.long && cmd._findOption(helpOption.long);
                    if (removeShort || removeLong) {
                        if (helpOption.long && !removeLong) visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
                        else if (helpOption.short && !removeShort) visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
                    } else visibleOptions.push(helpOption);
                }
                if (this.sortOptions) visibleOptions.sort(this.compareOptions);
                return visibleOptions;
            }
            visibleGlobalOptions(cmd) {
                if (!this.showGlobalOptions) return [];
                const globalOptions = [];
                for(let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent){
                    const visibleOptions = ancestorCmd.options.filter((option)=>!option.hidden);
                    globalOptions.push(...visibleOptions);
                }
                if (this.sortOptions) globalOptions.sort(this.compareOptions);
                return globalOptions;
            }
            visibleArguments(cmd) {
                if (cmd._argsDescription) cmd.registeredArguments.forEach((argument)=>{
                    argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
                });
                if (cmd.registeredArguments.find((argument)=>argument.description)) return cmd.registeredArguments;
                return [];
            }
            subcommandTerm(cmd) {
                const args = cmd.registeredArguments.map((arg)=>humanReadableArgName(arg)).join(' ');
                return cmd._name + (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') + (cmd.options.length ? ' [options]' : '') + (args ? ' ' + args : '');
            }
            optionTerm(option) {
                return option.flags;
            }
            argumentTerm(argument) {
                return argument.name();
            }
            longestSubcommandTermLength(cmd, helper) {
                return helper.visibleCommands(cmd).reduce((max, command)=>Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command)))), 0);
            }
            longestOptionTermLength(cmd, helper) {
                return helper.visibleOptions(cmd).reduce((max, option)=>Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))), 0);
            }
            longestGlobalOptionTermLength(cmd, helper) {
                return helper.visibleGlobalOptions(cmd).reduce((max, option)=>Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))), 0);
            }
            longestArgumentTermLength(cmd, helper) {
                return helper.visibleArguments(cmd).reduce((max, argument)=>Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument)))), 0);
            }
            commandUsage(cmd) {
                let cmdName = cmd._name;
                if (cmd._aliases[0]) cmdName = cmdName + '|' + cmd._aliases[0];
                let ancestorCmdNames = '';
                for(let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent)ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
                return ancestorCmdNames + cmdName + ' ' + cmd.usage();
            }
            commandDescription(cmd) {
                return cmd.description();
            }
            subcommandDescription(cmd) {
                return cmd.summary() || cmd.description();
            }
            optionDescription(option) {
                const extraInfo = [];
                if (option.argChoices) extraInfo.push(`choices: ${option.argChoices.map((choice)=>JSON.stringify(choice)).join(', ')}`);
                if (void 0 !== option.defaultValue) {
                    const showDefault = option.required || option.optional || option.isBoolean() && 'boolean' == typeof option.defaultValue;
                    if (showDefault) extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
                }
                if (void 0 !== option.presetArg && option.optional) extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
                if (void 0 !== option.envVar) extraInfo.push(`env: ${option.envVar}`);
                if (extraInfo.length > 0) {
                    const extraDescription = `(${extraInfo.join(', ')})`;
                    if (option.description) return `${option.description} ${extraDescription}`;
                    return extraDescription;
                }
                return option.description;
            }
            argumentDescription(argument) {
                const extraInfo = [];
                if (argument.argChoices) extraInfo.push(`choices: ${argument.argChoices.map((choice)=>JSON.stringify(choice)).join(', ')}`);
                if (void 0 !== argument.defaultValue) extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
                if (extraInfo.length > 0) {
                    const extraDescription = `(${extraInfo.join(', ')})`;
                    if (argument.description) return `${argument.description} ${extraDescription}`;
                    return extraDescription;
                }
                return argument.description;
            }
            formatItemList(heading, items, helper) {
                if (0 === items.length) return [];
                return [
                    helper.styleTitle(heading),
                    ...items,
                    ''
                ];
            }
            groupItems(unsortedItems, visibleItems, getGroup) {
                const result = new Map();
                unsortedItems.forEach((item)=>{
                    const group = getGroup(item);
                    if (!result.has(group)) result.set(group, []);
                });
                visibleItems.forEach((item)=>{
                    const group = getGroup(item);
                    if (!result.has(group)) result.set(group, []);
                    result.get(group).push(item);
                });
                return result;
            }
            formatHelp(cmd, helper) {
                const termWidth = helper.padWidth(cmd, helper);
                const helpWidth = helper.helpWidth ?? 80;
                function callFormatItem(term, description) {
                    return helper.formatItem(term, termWidth, description, helper);
                }
                let output = [
                    `${helper.styleTitle('Usage:')} ${helper.styleUsage(helper.commandUsage(cmd))}`,
                    ''
                ];
                const commandDescription = helper.commandDescription(cmd);
                if (commandDescription.length > 0) output = output.concat([
                    helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
                    ''
                ]);
                const argumentList = helper.visibleArguments(cmd).map((argument)=>callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument))));
                output = output.concat(this.formatItemList('Arguments:', argumentList, helper));
                const optionGroups = this.groupItems(cmd.options, helper.visibleOptions(cmd), (option)=>option.helpGroupHeading ?? 'Options:');
                optionGroups.forEach((options, group)=>{
                    const optionList = options.map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                    output = output.concat(this.formatItemList(group, optionList, helper));
                });
                if (helper.showGlobalOptions) {
                    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                    output = output.concat(this.formatItemList('Global Options:', globalOptionList, helper));
                }
                const commandGroups = this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub)=>sub.helpGroup() || 'Commands:');
                commandGroups.forEach((commands, group)=>{
                    const commandList = commands.map((sub)=>callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub))));
                    output = output.concat(this.formatItemList(group, commandList, helper));
                });
                return output.join('\n');
            }
            displayWidth(str) {
                return stripColor(str).length;
            }
            styleTitle(str) {
                return str;
            }
            styleUsage(str) {
                return str.split(' ').map((word)=>{
                    if ('[options]' === word) return this.styleOptionText(word);
                    if ('[command]' === word) return this.styleSubcommandText(word);
                    if ('[' === word[0] || '<' === word[0]) return this.styleArgumentText(word);
                    return this.styleCommandText(word);
                }).join(' ');
            }
            styleCommandDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleOptionDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleSubcommandDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleArgumentDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleDescriptionText(str) {
                return str;
            }
            styleOptionTerm(str) {
                return this.styleOptionText(str);
            }
            styleSubcommandTerm(str) {
                return str.split(' ').map((word)=>{
                    if ('[options]' === word) return this.styleOptionText(word);
                    if ('[' === word[0] || '<' === word[0]) return this.styleArgumentText(word);
                    return this.styleSubcommandText(word);
                }).join(' ');
            }
            styleArgumentTerm(str) {
                return this.styleArgumentText(str);
            }
            styleOptionText(str) {
                return str;
            }
            styleArgumentText(str) {
                return str;
            }
            styleSubcommandText(str) {
                return str;
            }
            styleCommandText(str) {
                return str;
            }
            padWidth(cmd, helper) {
                return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
            }
            preformatted(str) {
                return /\n[^\S\r\n]/.test(str);
            }
            formatItem(term, termWidth, description, helper) {
                const itemIndent = 2;
                const itemIndentStr = ' '.repeat(itemIndent);
                if (!description) return itemIndentStr + term;
                const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
                const spacerWidth = 2;
                const helpWidth = this.helpWidth ?? 80;
                const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
                let formattedDescription;
                if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) formattedDescription = description;
                else {
                    const wrappedDescription = helper.boxWrap(description, remainingWidth);
                    formattedDescription = wrappedDescription.replace(/\n/g, '\n' + ' '.repeat(termWidth + spacerWidth));
                }
                return itemIndentStr + paddedTerm + ' '.repeat(spacerWidth) + formattedDescription.replace(/\n/g, `\n${itemIndentStr}`);
            }
            boxWrap(str, width) {
                if (width < this.minWidthToWrap) return str;
                const rawLines = str.split(/\r\n|\n/);
                const chunkPattern = /[\s]*[^\s]+/g;
                const wrappedLines = [];
                rawLines.forEach((line)=>{
                    const chunks = line.match(chunkPattern);
                    if (null === chunks) return void wrappedLines.push('');
                    let sumChunks = [
                        chunks.shift()
                    ];
                    let sumWidth = this.displayWidth(sumChunks[0]);
                    chunks.forEach((chunk)=>{
                        const visibleWidth = this.displayWidth(chunk);
                        if (sumWidth + visibleWidth <= width) {
                            sumChunks.push(chunk);
                            sumWidth += visibleWidth;
                            return;
                        }
                        wrappedLines.push(sumChunks.join(''));
                        const nextChunk = chunk.trimStart();
                        sumChunks = [
                            nextChunk
                        ];
                        sumWidth = this.displayWidth(nextChunk);
                    });
                    wrappedLines.push(sumChunks.join(''));
                });
                return wrappedLines.join('\n');
            }
        }
        function stripColor(str) {
            const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
            return str.replace(sgrPattern, '');
        }
        exports.Help = Help;
        exports.stripColor = stripColor;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        class Option {
            constructor(flags, description){
                this.flags = flags;
                this.description = description || '';
                this.required = flags.includes('<');
                this.optional = flags.includes('[');
                this.variadic = /\w\.\.\.[>\]]$/.test(flags);
                this.mandatory = false;
                const optionFlags = splitOptionFlags(flags);
                this.short = optionFlags.shortFlag;
                this.long = optionFlags.longFlag;
                this.negate = false;
                if (this.long) this.negate = this.long.startsWith('--no-');
                this.defaultValue = void 0;
                this.defaultValueDescription = void 0;
                this.presetArg = void 0;
                this.envVar = void 0;
                this.parseArg = void 0;
                this.hidden = false;
                this.argChoices = void 0;
                this.conflictsWith = [];
                this.implied = void 0;
                this.helpGroupHeading = void 0;
            }
            default(value, description) {
                this.defaultValue = value;
                this.defaultValueDescription = description;
                return this;
            }
            preset(arg) {
                this.presetArg = arg;
                return this;
            }
            conflicts(names) {
                this.conflictsWith = this.conflictsWith.concat(names);
                return this;
            }
            implies(impliedOptionValues) {
                let newImplied = impliedOptionValues;
                if ('string' == typeof impliedOptionValues) newImplied = {
                    [impliedOptionValues]: true
                };
                this.implied = Object.assign(this.implied || {}, newImplied);
                return this;
            }
            env(name) {
                this.envVar = name;
                return this;
            }
            argParser(fn) {
                this.parseArg = fn;
                return this;
            }
            makeOptionMandatory(mandatory = true) {
                this.mandatory = !!mandatory;
                return this;
            }
            hideHelp(hide = true) {
                this.hidden = !!hide;
                return this;
            }
            _collectValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                previous.push(value);
                return previous;
            }
            choices(values) {
                this.argChoices = values.slice();
                this.parseArg = (arg, previous)=>{
                    if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
                    if (this.variadic) return this._collectValue(arg, previous);
                    return arg;
                };
                return this;
            }
            name() {
                if (this.long) return this.long.replace(/^--/, '');
                return this.short.replace(/^-/, '');
            }
            attributeName() {
                if (this.negate) return camelcase(this.name().replace(/^no-/, ''));
                return camelcase(this.name());
            }
            helpGroup(heading) {
                this.helpGroupHeading = heading;
                return this;
            }
            is(arg) {
                return this.short === arg || this.long === arg;
            }
            isBoolean() {
                return !this.required && !this.optional && !this.negate;
            }
        }
        class DualOptions {
            constructor(options){
                this.positiveOptions = new Map();
                this.negativeOptions = new Map();
                this.dualOptions = new Set();
                options.forEach((option)=>{
                    if (option.negate) this.negativeOptions.set(option.attributeName(), option);
                    else this.positiveOptions.set(option.attributeName(), option);
                });
                this.negativeOptions.forEach((value, key)=>{
                    if (this.positiveOptions.has(key)) this.dualOptions.add(key);
                });
            }
            valueFromOption(value, option) {
                const optionKey = option.attributeName();
                if (!this.dualOptions.has(optionKey)) return true;
                const preset = this.negativeOptions.get(optionKey).presetArg;
                const negativeValue = void 0 !== preset ? preset : false;
                return option.negate === (negativeValue === value);
            }
        }
        function camelcase(str) {
            return str.split('-').reduce((str, word)=>str + word[0].toUpperCase() + word.slice(1));
        }
        function splitOptionFlags(flags) {
            let shortFlag;
            let longFlag;
            const shortFlagExp = /^-[^-]$/;
            const longFlagExp = /^--[^-]/;
            const flagParts = flags.split(/[ |,]+/).concat('guard');
            if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
            if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
            if (!shortFlag && shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
            if (!shortFlag && longFlagExp.test(flagParts[0])) {
                shortFlag = longFlag;
                longFlag = flagParts.shift();
            }
            if (flagParts[0].startsWith('-')) {
                const unsupportedFlag = flagParts[0];
                const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
                if (/^-[^-][^-]/.test(unsupportedFlag)) throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
                if (shortFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many short flags`);
                if (longFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many long flags`);
                throw new Error(`${baseError}
- unrecognised flag format`);
            }
            if (void 0 === shortFlag && void 0 === longFlag) throw new Error(`option creation failed due to no flags found in '${flags}'.`);
            return {
                shortFlag,
                longFlag
            };
        }
        exports.Option = Option;
        exports.DualOptions = DualOptions;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/suggestSimilar.js" (__unused_rspack_module, exports) {
        const maxDistance = 3;
        function editDistance(a, b) {
            if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
            const d = [];
            for(let i = 0; i <= a.length; i++)d[i] = [
                i
            ];
            for(let j = 0; j <= b.length; j++)d[0][j] = j;
            for(let j = 1; j <= b.length; j++)for(let i = 1; i <= a.length; i++){
                let cost = 1;
                cost = a[i - 1] === b[j - 1] ? 0 : 1;
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
            return d[a.length][b.length];
        }
        function suggestSimilar(word, candidates) {
            if (!candidates || 0 === candidates.length) return '';
            candidates = Array.from(new Set(candidates));
            const searchingOptions = word.startsWith('--');
            if (searchingOptions) {
                word = word.slice(2);
                candidates = candidates.map((candidate)=>candidate.slice(2));
            }
            let similar = [];
            let bestDistance = maxDistance;
            const minSimilarity = 0.4;
            candidates.forEach((candidate)=>{
                if (candidate.length <= 1) return;
                const distance = editDistance(word, candidate);
                const length = Math.max(word.length, candidate.length);
                const similarity = (length - distance) / length;
                if (similarity > minSimilarity) {
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        similar = [
                            candidate
                        ];
                    } else if (distance === bestDistance) similar.push(candidate);
                }
            });
            similar.sort((a, b)=>a.localeCompare(b));
            if (searchingOptions) similar = similar.map((candidate)=>`--${candidate}`);
            if (similar.length > 1) return `\n(Did you mean one of ${similar.join(', ')}?)`;
            if (1 === similar.length) return `\n(Did you mean ${similar[0]}?)`;
            return '';
        }
        exports.suggestSimilar = suggestSimilar;
    },
    "../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/844.js" (__unused_rspack___webpack_module__, __unused_rspack___webpack_exports__, __webpack_require__) {
        var os__rspack_import_0 = __webpack_require__("os");
        var tty__rspack_import_1 = __webpack_require__("tty");
        var util__rspack_import_2 = __webpack_require__("util");
        var _rslib_runtime_js__rspack_import_3 = __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/rslib-runtime.js");
        _rslib_runtime_js__rspack_import_3.Q.add({
            "../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js" (module, exports, __webpack_require__) {
                exports.formatArgs = formatArgs;
                exports.save = save;
                exports.load = load;
                exports.useColors = useColors;
                exports.storage = localstorage();
                exports.destroy = (()=>{
                    let warned = false;
                    return ()=>{
                        if (!warned) {
                            warned = true;
                            console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
                        }
                    };
                })();
                exports.colors = [
                    '#0000CC',
                    '#0000FF',
                    '#0033CC',
                    '#0033FF',
                    '#0066CC',
                    '#0066FF',
                    '#0099CC',
                    '#0099FF',
                    '#00CC00',
                    '#00CC33',
                    '#00CC66',
                    '#00CC99',
                    '#00CCCC',
                    '#00CCFF',
                    '#3300CC',
                    '#3300FF',
                    '#3333CC',
                    '#3333FF',
                    '#3366CC',
                    '#3366FF',
                    '#3399CC',
                    '#3399FF',
                    '#33CC00',
                    '#33CC33',
                    '#33CC66',
                    '#33CC99',
                    '#33CCCC',
                    '#33CCFF',
                    '#6600CC',
                    '#6600FF',
                    '#6633CC',
                    '#6633FF',
                    '#66CC00',
                    '#66CC33',
                    '#9900CC',
                    '#9900FF',
                    '#9933CC',
                    '#9933FF',
                    '#99CC00',
                    '#99CC33',
                    '#CC0000',
                    '#CC0033',
                    '#CC0066',
                    '#CC0099',
                    '#CC00CC',
                    '#CC00FF',
                    '#CC3300',
                    '#CC3333',
                    '#CC3366',
                    '#CC3399',
                    '#CC33CC',
                    '#CC33FF',
                    '#CC6600',
                    '#CC6633',
                    '#CC9900',
                    '#CC9933',
                    '#CCCC00',
                    '#CCCC33',
                    '#FF0000',
                    '#FF0033',
                    '#FF0066',
                    '#FF0099',
                    '#FF00CC',
                    '#FF00FF',
                    '#FF3300',
                    '#FF3333',
                    '#FF3366',
                    '#FF3399',
                    '#FF33CC',
                    '#FF33FF',
                    '#FF6600',
                    '#FF6633',
                    '#FF9900',
                    '#FF9933',
                    '#FFCC00',
                    '#FFCC33'
                ];
                function useColors() {
                    if ("u" > typeof window && window.process && ('renderer' === window.process.type || window.process.__nwjs)) return true;
                    if ("u" > typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
                    let m;
                    return "u" > typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "u" > typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "u" > typeof navigator && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || "u" > typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
                }
                function formatArgs(args) {
                    args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);
                    if (!this.useColors) return;
                    const c = 'color: ' + this.color;
                    args.splice(1, 0, c, 'color: inherit');
                    let index = 0;
                    let lastC = 0;
                    args[0].replace(/%[a-zA-Z%]/g, (match)=>{
                        if ('%%' === match) return;
                        index++;
                        if ('%c' === match) lastC = index;
                    });
                    args.splice(lastC, 0, c);
                }
                exports.log = console.debug || console.log || (()=>{});
                function save(namespaces) {
                    try {
                        if (namespaces) exports.storage.setItem('debug', namespaces);
                        else exports.storage.removeItem('debug');
                    } catch (error) {}
                }
                function load() {
                    let r;
                    try {
                        r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG');
                    } catch (error) {}
                    if (!r && "u" > typeof process && 'env' in process) r = process.env.DEBUG;
                    return r;
                }
                function localstorage() {
                    try {
                        return localStorage;
                    } catch (error) {}
                }
                module.exports = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js")(exports);
                const { formatters } = module.exports;
                formatters.j = function(v) {
                    try {
                        return JSON.stringify(v);
                    } catch (error) {
                        return '[UnexpectedJSONParseError]: ' + error.message;
                    }
                };
            },
            "../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js" (module, __unused_rspack_exports, __webpack_require__) {
                function setup(env) {
                    createDebug.debug = createDebug;
                    createDebug.default = createDebug;
                    createDebug.coerce = coerce;
                    createDebug.disable = disable;
                    createDebug.enable = enable;
                    createDebug.enabled = enabled;
                    createDebug.humanize = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js");
                    createDebug.destroy = destroy;
                    Object.keys(env).forEach((key)=>{
                        createDebug[key] = env[key];
                    });
                    createDebug.names = [];
                    createDebug.skips = [];
                    createDebug.formatters = {};
                    function selectColor(namespace) {
                        let hash = 0;
                        for(let i = 0; i < namespace.length; i++){
                            hash = (hash << 5) - hash + namespace.charCodeAt(i);
                            hash |= 0;
                        }
                        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
                    }
                    createDebug.selectColor = selectColor;
                    function createDebug(namespace) {
                        let prevTime;
                        let enableOverride = null;
                        let namespacesCache;
                        let enabledCache;
                        function debug(...args) {
                            if (!debug.enabled) return;
                            const self = debug;
                            const curr = Number(new Date());
                            const ms = curr - (prevTime || curr);
                            self.diff = ms;
                            self.prev = prevTime;
                            self.curr = curr;
                            prevTime = curr;
                            args[0] = createDebug.coerce(args[0]);
                            if ('string' != typeof args[0]) args.unshift('%O');
                            let index = 0;
                            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format)=>{
                                if ('%%' === match) return '%';
                                index++;
                                const formatter = createDebug.formatters[format];
                                if ('function' == typeof formatter) {
                                    const val = args[index];
                                    match = formatter.call(self, val);
                                    args.splice(index, 1);
                                    index--;
                                }
                                return match;
                            });
                            createDebug.formatArgs.call(self, args);
                            const logFn = self.log || createDebug.log;
                            logFn.apply(self, args);
                        }
                        debug.namespace = namespace;
                        debug.useColors = createDebug.useColors();
                        debug.color = createDebug.selectColor(namespace);
                        debug.extend = extend;
                        debug.destroy = createDebug.destroy;
                        Object.defineProperty(debug, 'enabled', {
                            enumerable: true,
                            configurable: false,
                            get: ()=>{
                                if (null !== enableOverride) return enableOverride;
                                if (namespacesCache !== createDebug.namespaces) {
                                    namespacesCache = createDebug.namespaces;
                                    enabledCache = createDebug.enabled(namespace);
                                }
                                return enabledCache;
                            },
                            set: (v)=>{
                                enableOverride = v;
                            }
                        });
                        if ('function' == typeof createDebug.init) createDebug.init(debug);
                        return debug;
                    }
                    function extend(namespace, delimiter) {
                        const newDebug = createDebug(this.namespace + (void 0 === delimiter ? ':' : delimiter) + namespace);
                        newDebug.log = this.log;
                        return newDebug;
                    }
                    function enable(namespaces) {
                        createDebug.save(namespaces);
                        createDebug.namespaces = namespaces;
                        createDebug.names = [];
                        createDebug.skips = [];
                        const split = ('string' == typeof namespaces ? namespaces : '').trim().replace(/\s+/g, ',').split(',').filter(Boolean);
                        for (const ns of split)if ('-' === ns[0]) createDebug.skips.push(ns.slice(1));
                        else createDebug.names.push(ns);
                    }
                    function matchesTemplate(search, template) {
                        let searchIndex = 0;
                        let templateIndex = 0;
                        let starIndex = -1;
                        let matchIndex = 0;
                        while(searchIndex < search.length)if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || '*' === template[templateIndex])) if ('*' === template[templateIndex]) {
                            starIndex = templateIndex;
                            matchIndex = searchIndex;
                            templateIndex++;
                        } else {
                            searchIndex++;
                            templateIndex++;
                        }
                        else {
                            if (-1 === starIndex) return false;
                            templateIndex = starIndex + 1;
                            matchIndex++;
                            searchIndex = matchIndex;
                        }
                        while(templateIndex < template.length && '*' === template[templateIndex])templateIndex++;
                        return templateIndex === template.length;
                    }
                    function disable() {
                        const namespaces = [
                            ...createDebug.names,
                            ...createDebug.skips.map((namespace)=>'-' + namespace)
                        ].join(',');
                        createDebug.enable('');
                        return namespaces;
                    }
                    function enabled(name) {
                        for (const skip of createDebug.skips)if (matchesTemplate(name, skip)) return false;
                        for (const ns of createDebug.names)if (matchesTemplate(name, ns)) return true;
                        return false;
                    }
                    function coerce(val) {
                        if (val instanceof Error) return val.stack || val.message;
                        return val;
                    }
                    function destroy() {
                        console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
                    }
                    createDebug.enable(createDebug.load());
                    return createDebug;
                }
                module.exports = setup;
            },
            "../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js" (module, __unused_rspack_exports, __webpack_require__) {
                if ("u" < typeof process || 'renderer' === process.type || true === process.browser || process.__nwjs) module.exports = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js");
                else module.exports = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js");
            },
            "../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js" (module, exports, __webpack_require__) {
                const tty = (0, _rslib_runtime_js__rspack_import_3.Q)("tty");
                const util = (0, _rslib_runtime_js__rspack_import_3.Q)("util");
                exports.init = init;
                exports.log = log;
                exports.formatArgs = formatArgs;
                exports.save = save;
                exports.load = load;
                exports.useColors = useColors;
                exports.destroy = util.deprecate(()=>{}, 'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
                exports.colors = [
                    6,
                    2,
                    3,
                    4,
                    5,
                    1
                ];
                try {
                    const supportsColor = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/supports-color@8.1.1/node_modules/supports-color/index.js");
                    if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
                        20,
                        21,
                        26,
                        27,
                        32,
                        33,
                        38,
                        39,
                        40,
                        41,
                        42,
                        43,
                        44,
                        45,
                        56,
                        57,
                        62,
                        63,
                        68,
                        69,
                        74,
                        75,
                        76,
                        77,
                        78,
                        79,
                        80,
                        81,
                        92,
                        93,
                        98,
                        99,
                        112,
                        113,
                        128,
                        129,
                        134,
                        135,
                        148,
                        149,
                        160,
                        161,
                        162,
                        163,
                        164,
                        165,
                        166,
                        167,
                        168,
                        169,
                        170,
                        171,
                        172,
                        173,
                        178,
                        179,
                        184,
                        185,
                        196,
                        197,
                        198,
                        199,
                        200,
                        201,
                        202,
                        203,
                        204,
                        205,
                        206,
                        207,
                        208,
                        209,
                        214,
                        215,
                        220,
                        221
                    ];
                } catch (error) {}
                exports.inspectOpts = Object.keys(process.env).filter((key)=>/^debug_/i.test(key)).reduce((obj, key)=>{
                    const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k)=>k.toUpperCase());
                    let val = process.env[key];
                    val = /^(yes|on|true|enabled)$/i.test(val) ? true : /^(no|off|false|disabled)$/i.test(val) ? false : 'null' === val ? null : Number(val);
                    obj[prop] = val;
                    return obj;
                }, {});
                function useColors() {
                    return 'colors' in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
                }
                function formatArgs(args) {
                    const { namespace: name, useColors } = this;
                    if (useColors) {
                        const c = this.color;
                        const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
                        const prefix = `  ${colorCode};1m${name} \u001B[0m`;
                        args[0] = prefix + args[0].split('\n').join('\n' + prefix);
                        args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
                    } else args[0] = getDate() + name + ' ' + args[0];
                }
                function getDate() {
                    if (exports.inspectOpts.hideDate) return '';
                    return new Date().toISOString() + ' ';
                }
                function log(...args) {
                    return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
                }
                function save(namespaces) {
                    if (namespaces) process.env.DEBUG = namespaces;
                    else delete process.env.DEBUG;
                }
                function load() {
                    return process.env.DEBUG;
                }
                function init(debug) {
                    debug.inspectOpts = {};
                    const keys = Object.keys(exports.inspectOpts);
                    for(let i = 0; i < keys.length; i++)debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
                }
                module.exports = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js")(exports);
                const { formatters } = module.exports;
                formatters.o = function(v) {
                    this.inspectOpts.colors = this.useColors;
                    return util.inspect(v, this.inspectOpts).split('\n').map((str)=>str.trim()).join(' ');
                };
                formatters.O = function(v) {
                    this.inspectOpts.colors = this.useColors;
                    return util.inspect(v, this.inspectOpts);
                };
            },
            "../../../node_modules/.pnpm/has-flag@4.0.0/node_modules/has-flag/index.js" (module) {
                module.exports = (flag, argv = process.argv)=>{
                    const prefix = flag.startsWith('-') ? '' : 1 === flag.length ? '-' : '--';
                    const position = argv.indexOf(prefix + flag);
                    const terminatorPosition = argv.indexOf('--');
                    return -1 !== position && (-1 === terminatorPosition || position < terminatorPosition);
                };
            },
            "../../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js" (module) {
                var s = 1000;
                var m = 60 * s;
                var h = 60 * m;
                var d = 24 * h;
                var w = 7 * d;
                var y = 365.25 * d;
                module.exports = function(val, options) {
                    options = options || {};
                    var type = typeof val;
                    if ('string' === type && val.length > 0) return parse(val);
                    if ('number' === type && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
                    throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
                };
                function parse(str) {
                    str = String(str);
                    if (str.length > 100) return;
                    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
                    if (!match) return;
                    var n = parseFloat(match[1]);
                    var type = (match[2] || 'ms').toLowerCase();
                    switch(type){
                        case 'years':
                        case 'year':
                        case 'yrs':
                        case 'yr':
                        case 'y':
                            return n * y;
                        case 'weeks':
                        case 'week':
                        case 'w':
                            return n * w;
                        case 'days':
                        case 'day':
                        case 'd':
                            return n * d;
                        case 'hours':
                        case 'hour':
                        case 'hrs':
                        case 'hr':
                        case 'h':
                            return n * h;
                        case 'minutes':
                        case 'minute':
                        case 'mins':
                        case 'min':
                        case 'm':
                            return n * m;
                        case 'seconds':
                        case 'second':
                        case 'secs':
                        case 'sec':
                        case 's':
                            return n * s;
                        case 'milliseconds':
                        case 'millisecond':
                        case 'msecs':
                        case 'msec':
                        case 'ms':
                            return n;
                        default:
                            return;
                    }
                }
                function fmtShort(ms) {
                    var msAbs = Math.abs(ms);
                    if (msAbs >= d) return Math.round(ms / d) + 'd';
                    if (msAbs >= h) return Math.round(ms / h) + 'h';
                    if (msAbs >= m) return Math.round(ms / m) + 'm';
                    if (msAbs >= s) return Math.round(ms / s) + 's';
                    return ms + 'ms';
                }
                function fmtLong(ms) {
                    var msAbs = Math.abs(ms);
                    if (msAbs >= d) return plural(ms, msAbs, d, 'day');
                    if (msAbs >= h) return plural(ms, msAbs, h, 'hour');
                    if (msAbs >= m) return plural(ms, msAbs, m, 'minute');
                    if (msAbs >= s) return plural(ms, msAbs, s, 'second');
                    return ms + ' ms';
                }
                function plural(ms, msAbs, n, name) {
                    var isPlural = msAbs >= 1.5 * n;
                    return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
                }
            },
            "../../../node_modules/.pnpm/supports-color@8.1.1/node_modules/supports-color/index.js" (module, __unused_rspack_exports, __webpack_require__) {
                const os = (0, _rslib_runtime_js__rspack_import_3.Q)("os");
                const tty = (0, _rslib_runtime_js__rspack_import_3.Q)("tty");
                const hasFlag = (0, _rslib_runtime_js__rspack_import_3.Q)("../../../node_modules/.pnpm/has-flag@4.0.0/node_modules/has-flag/index.js");
                const { env } = process;
                let flagForceColor;
                if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false') || hasFlag('color=never')) flagForceColor = 0;
                else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) flagForceColor = 1;
                function envForceColor() {
                    if ('FORCE_COLOR' in env) {
                        if ('true' === env.FORCE_COLOR) return 1;
                        if ('false' === env.FORCE_COLOR) return 0;
                        return 0 === env.FORCE_COLOR.length ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
                    }
                }
                function translateLevel(level) {
                    if (0 === level) return false;
                    return {
                        level,
                        hasBasic: true,
                        has256: level >= 2,
                        has16m: level >= 3
                    };
                }
                function supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
                    const noFlagForceColor = envForceColor();
                    if (void 0 !== noFlagForceColor) flagForceColor = noFlagForceColor;
                    const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
                    if (0 === forceColor) return 0;
                    if (sniffFlags) {
                        if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) return 3;
                        if (hasFlag('color=256')) return 2;
                    }
                    if (haveStream && !streamIsTTY && void 0 === forceColor) return 0;
                    const min = forceColor || 0;
                    if ('dumb' === env.TERM) return min;
                    if ('win32' === process.platform) {
                        const osRelease = os.release().split('.');
                        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
                        return 1;
                    }
                    if ('CI' in env) {
                        if ([
                            'TRAVIS',
                            'CIRCLECI',
                            'APPVEYOR',
                            'GITLAB_CI',
                            'GITHUB_ACTIONS',
                            'BUILDKITE',
                            'DRONE'
                        ].some((sign)=>sign in env) || 'codeship' === env.CI_NAME) return 1;
                        return min;
                    }
                    if ('TEAMCITY_VERSION' in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
                    if ('truecolor' === env.COLORTERM) return 3;
                    if ('TERM_PROGRAM' in env) {
                        const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);
                        switch(env.TERM_PROGRAM){
                            case 'iTerm.app':
                                return version >= 3 ? 3 : 2;
                            case 'Apple_Terminal':
                                return 2;
                        }
                    }
                    if (/-256(color)?$/i.test(env.TERM)) return 2;
                    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
                    if ('COLORTERM' in env) return 1;
                    return min;
                }
                function getSupportLevel(stream, options = {}) {
                    const level = supportsColor(stream, {
                        streamIsTTY: stream && stream.isTTY,
                        ...options
                    });
                    return translateLevel(level);
                }
                module.exports = {
                    supportsColor: getSupportLevel,
                    stdout: getSupportLevel({
                        isTTY: tty.isatty(1)
                    }),
                    stderr: getSupportLevel({
                        isTTY: tty.isatty(2)
                    })
                };
            },
            os (module) {
                module.exports = os__rspack_import_0;
            },
            tty (module) {
                module.exports = tty__rspack_import_1;
            },
            util (module) {
                module.exports = util__rspack_import_2;
            }
        });
    },
    "../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/index.js" (__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Wi: ()=>Connector
        });
        var _rslib_runtime_js__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/rslib-runtime.js");
        var node_crypto__rspack_import_1 = __webpack_require__("node:crypto");
        var node_stream_web__rspack_import_2 = __webpack_require__("node:stream/web");
        var node_fs_promises__rspack_import_3 = __webpack_require__("node:fs/promises");
        var node_os__rspack_import_4 = __webpack_require__("node:os");
        var node_path__rspack_import_5 = __webpack_require__("node:path");
        __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/844.js");
        function isInitializeResponse(response) {
            return 'Register' === response.event;
        }
        function isListSessionResponse(response) {
            return 'Customized' === response.event && 'SessionList' === response.data.type;
        }
        function isCustomizedResponseWithType(response, type) {
            return 'Customized' === response.event && response.data.type === type;
        }
        class CustomizedRequestTransformStream extends node_stream_web__rspack_import_2.TransformStream {
            port;
            constructor(options){
                const { type, port, sessionId = -1, messageBuilder } = options;
                super({
                    transform (chunk, controller) {
                        const sid = 'function' == typeof sessionId ? sessionId(chunk) : sessionId;
                        controller.enqueue({
                            event: 'Customized',
                            data: {
                                type,
                                data: {
                                    client_id: port,
                                    session_id: sid,
                                    message: messageBuilder(chunk)
                                },
                                sender: port
                            }
                        });
                    }
                });
                this.port = port;
            }
        }
        class CustomizedResponseTransformStream extends node_stream_web__rspack_import_2.TransformStream {
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
        class ResponseParserTransformStream extends node_stream_web__rspack_import_2.TransformStream {
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
            constructor(type, port){
                super({
                    type,
                    port,
                    sessionId: -1,
                    messageBuilder: ({ key, value })=>({
                            global_key: key,
                            global_value: value
                        })
                });
            }
        }
        class CDPRequestTransformStream extends CustomizedRequestTransformStream {
            constructor(port, fixedId){
                super({
                    type: 'CDP',
                    port,
                    sessionId: (chunk)=>chunk.sessionId,
                    messageBuilder: (chunk)=>{
                        const id = fixedId ?? (0, node_crypto__rspack_import_1.randomInt)(10000, 50000);
                        const { method, params } = chunk;
                        return {
                            id,
                            method,
                            params
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
        class PeertalkToMessageTransformStream extends node_stream_web__rspack_import_2.TransformStream {
            constructor(){
                let buffer = new Uint8Array(0);
                const decoder = new TextDecoder();
                super({
                    transform: (chunk, c)=>{
                        const n = new Uint8Array(buffer.length + chunk.length);
                        n.set(buffer);
                        n.set(chunk, buffer.length);
                        buffer = n;
                        while(buffer.length >= 20){
                            const v = new DataView(buffer.buffer, buffer.byteOffset);
                            const len = v.getUint32(16);
                            if (buffer.length < 20 + len) break;
                            try {
                                c.enqueue(JSON.parse(decoder.decode(buffer.subarray(20, 20 + len))));
                            } catch (e) {
                                c.error(e);
                            }
                            buffer = buffer.subarray(20 + len);
                        }
                    }
                });
            }
        }
        class MessageToPeertalkTransformStream extends node_stream_web__rspack_import_2.TransformStream {
            constructor(){
                const encoder = new TextEncoder();
                super({
                    transform (chunk, controller) {
                        const body = encoder.encode(JSON.stringify(chunk));
                        const len = body.length;
                        const data = new Uint8Array(20 + len);
                        const view = new DataView(data.buffer);
                        view.setUint32(0, 1);
                        view.setUint32(4, 101);
                        view.setUint32(8, 0);
                        view.setUint32(12, len + 4);
                        view.setUint32(16, len);
                        data.set(body, 20);
                        controller.enqueue(data);
                    }
                });
            }
        }
        class FilterTransformStream extends node_stream_web__rspack_import_2.TransformStream {
            constructor(filter){
                super({
                    transform (chunk, controller) {
                        if (filter(chunk)) controller.enqueue(chunk);
                    }
                });
            }
        }
        class InspectStream extends node_stream_web__rspack_import_2.TransformStream {
            constructor(callback){
                super({
                    transform (chunk, controller) {
                        callback(chunk);
                        controller.enqueue(chunk);
                    }
                });
            }
        }
        const src = (0, _rslib_runtime_js__rspack_import_0.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js");
        var src_default = /*#__PURE__*/ _rslib_runtime_js__rspack_import_0.Q.n(src);
        const debug = src_default()('devtool-mcp-server:takeover');
        const DEBUG_ROUTER_DIR = node_path__rspack_import_5["default"].join(node_os__rspack_import_4["default"].homedir(), '.DebugRouterConnector');
        const DEBUG_ROUTER_LOCK_DIR = node_path__rspack_import_5["default"].join(DEBUG_ROUTER_DIR, 'lockfile');
        const DEBUG_ROUTER_LATEST_FILE = node_path__rspack_import_5["default"].join(DEBUG_ROUTER_DIR, 'LatestDriverProcess');
        async function takeoverDebugRouterLock() {
            try {
                await node_fs_promises__rspack_import_3["default"].mkdir(DEBUG_ROUTER_DIR, {
                    recursive: true
                });
                await node_fs_promises__rspack_import_3["default"].rm(DEBUG_ROUTER_LOCK_DIR, {
                    recursive: true,
                    force: true
                });
                await node_fs_promises__rspack_import_3["default"].mkdir(DEBUG_ROUTER_LOCK_DIR, {
                    recursive: true
                });
                await node_fs_promises__rspack_import_3["default"].writeFile(DEBUG_ROUTER_LATEST_FILE, `${process.pid}`, 'utf-8');
                debug(`wrote PID=${process.pid}`);
            } catch (err) {
                debug('skipped due to filesystem error %O', err);
            } finally{
                try {
                    await node_fs_promises__rspack_import_3["default"].rm(DEBUG_ROUTER_LOCK_DIR, {
                        recursive: true,
                        force: true
                    });
                } catch (_cleanupError) {
                    debug('failed to remove lock directory %O', _cleanupError);
                }
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
        const src_debug = src_default()('devtool-mcp-server:connector');
        class ClientId {
            static serialize(deviceId, port) {
                return `${encodeURIComponent(deviceId)}:${port}`;
            }
            static deserialize(clientId) {
                try {
                    const lastColonIndex = clientId.lastIndexOf(':');
                    if (-1 === lastColonIndex) return null;
                    const port = Number.parseInt(clientId.substring(lastColonIndex + 1), 10);
                    if (Number.isNaN(port)) return null;
                    return {
                        deviceId: decodeURIComponent(clientId.substring(0, lastColonIndex)),
                        port
                    };
                } catch  {
                    return null;
                }
            }
        }
        class Connector {
            #transports;
            constructor(transports){
                this.#transports = transports;
            }
            async listClients() {
                const transportDevices = await Promise.allSettled(this.#transports.map(async (transport)=>({
                        transport,
                        devices: await transport.listDevices()
                    })));
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
                const { setTimeout: setTimeout1 } = await import("node:timers/promises");
                while(!signal.aborted){
                    try {
                        const clients = await this.#listClientsForDevice(transport, deviceId);
                        if (clients.some(({ info })=>info.AppProcessName === packageName || info.bundleId === packageName || info.bundleName === packageName)) break;
                    } catch (err) {
                        src_debug(`openApp ${deviceId} ${packageName} client not found %o`, err);
                    }
                    await setTimeout1(1000);
                }
            }
            async sendMessage(clientId, message) {
                return await this.#sendMessage(clientId, message);
            }
            async sendAppMessage(clientId, method, params) {
                const { port } = this.#resolveClientId(clientId);
                const id = (0, node_crypto__rspack_import_1.randomInt)(10000, 50000);
                return await this.#sendMessage(clientId, {
                    method,
                    params: {
                        ...params
                    }
                }, {
                    input: [
                        new CustomizedRequestTransformStream({
                            type: 'App',
                            port,
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
            async sendCDPMessage(clientId, sessionId, method, params) {
                const { port } = this.#resolveClientId(clientId);
                const id = (0, node_crypto__rspack_import_1.randomInt)(10000, 50000);
                return await this.#sendMessage(clientId, {
                    method,
                    params,
                    sessionId
                }, {
                    input: [
                        new CDPRequestTransformStream(port, id)
                    ],
                    output: [
                        new CDPResponseTransformStream(id),
                        new CDPOutputTransformStream()
                    ]
                });
            }
            async sendListSessionMessage(clientId) {
                const options = this.#resolveClientId(clientId);
                const { data: { data: sessions } } = await this.#sendMessage(clientId, {
                    event: 'Customized',
                    data: {
                        type: 'ListSession',
                        sender: options.port,
                        data: {}
                    }
                }, {
                    input: [],
                    output: [
                        new FilterTransformStream(isListSessionResponse)
                    ]
                });
                return sessions;
            }
            async getGlobalSwitch(clientId, key) {
                const options = this.#resolveClientId(clientId);
                const { data: { data: { message } } } = await this.#sendMessage(clientId, {
                    key
                }, {
                    input: [
                        new GlobalSwitchRequestTransformStream('GetGlobalSwitch', options.port)
                    ],
                    output: []
                });
                if ('object' == typeof message) return message?.global_value === 'true' || message?.global_value === true;
                return 'true' === message || true === message;
            }
            async setGlobalSwitch(clientId, key, value) {
                const options = this.#resolveClientId(clientId);
                await this.#sendMessage(clientId, {
                    key,
                    value
                }, {
                    input: [
                        new GlobalSwitchRequestTransformStream('SetGlobalSwitch', options.port)
                    ],
                    output: []
                });
            }
            async sendStream(clientId, inputStream, { signal }) {
                const { deviceId, port } = this.#resolveClientId(clientId);
                const transport = await this.#findTransportWithDeviceId(deviceId);
                return await this.#connect(transport, {
                    deviceId,
                    port,
                    signal
                }, inputStream, {
                    input: [],
                    output: []
                });
            }
            async sendCDPStream(clientId, inputStream, { signal } = {}) {
                const { deviceId, port } = this.#resolveClientId(clientId);
                const transport = await this.#findTransportWithDeviceId(deviceId);
                return await this.#connect(transport, {
                    deviceId,
                    port,
                    signal
                }, inputStream, {
                    input: [
                        new CDPRequestTransformStream(port)
                    ],
                    output: [
                        new CDPResponseTransformStream()
                    ]
                });
            }
            #resolveClientId(clientId) {
                const parsed = ClientId.deserialize(clientId);
                if (!parsed) throw new Error(`Invalid clientId: ${clientId}`);
                return parsed;
            }
            async #findTransportWithDeviceId(deviceId) {
                return await Promise.any(this.#transports.map(async (t)=>{
                    const devices = await t.listDevices();
                    if (devices.some(({ id })=>id === deviceId)) return t;
                    throw new Error('Not found in this transport');
                })).catch(()=>{
                    throw new Error(`Device with id: ${deviceId} not found`);
                });
            }
            async #connect(transport, options, inputStream, pipeline) {
                const { deviceId, port } = options;
                await takeoverDebugRouterLock();
                const conn = await transport.connect(options);
                [
                    ...pipeline.input,
                    new InspectStream((msg)=>src_debug(`connect ${deviceId}:${port} input stream send %O`, msg)),
                    new MessageToPeertalkTransformStream()
                ].reduce((stream, transform)=>stream.pipeThrough(transform), inputStream).pipeTo(conn.writable, {
                    preventClose: true
                }).catch((err)=>{
                    src_debug(`connect ${deviceId}:${port} input stream err %O`, err);
                    conn[Symbol.asyncDispose]();
                });
                const outputStream = [
                    new PeertalkToMessageTransformStream(),
                    new InspectStream((msg)=>src_debug(`connect ${deviceId}:${port} output stream receive %O`, msg)),
                    ...pipeline.output
                ].reduce((stream, transform)=>stream.pipeThrough(transform), conn.readable);
                return Object.assign(outputStream, {
                    async [Symbol.asyncDispose] () {
                        src_debug(`connect ${deviceId}:${port} close connection`);
                        return await conn[Symbol.asyncDispose]();
                    }
                });
            }
            async #sendMessage(clientId, input, pipeline = {
                input: [],
                output: []
            }) {
                const { deviceId, port } = this.#resolveClientId(clientId);
                const transport = await this.#findTransportWithDeviceId(deviceId);
                const signal = AbortSignal.timeout(5000);
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
                    const outputStream = _ts_add_disposable_resource(env, await this.#connect(transport, options, node_stream_web__rspack_import_2.ReadableStream.from([
                        input
                    ]), pipeline), true);
                    for await (const response of outputStream)return response;
                    const { deviceId, port } = options;
                    throw new Error(`No response found for deviceId: ${deviceId} port: ${port}`);
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
                const results = await Promise.allSettled(PORTS.map(async (port)=>{
                    const { data: { info } } = await this.#sendMessageWithTransport(transport, {
                        deviceId,
                        port,
                        signal: AbortSignal.timeout(5000)
                    }, {
                        event: 'Initialize',
                        data: port
                    }, {
                        input: [],
                        output: [
                            new FilterTransformStream(isInitializeResponse)
                        ]
                    });
                    try {
                        await this.#sendMessageWithTransport(transport, {
                            deviceId,
                            port,
                            signal: AbortSignal.timeout(3000)
                        }, {
                            key: 'enable_devtool',
                            value: true
                        }, {
                            input: [
                                new GlobalSwitchRequestTransformStream('SetGlobalSwitch', port)
                            ],
                            output: []
                        });
                    } catch (err) {
                        src_debug(`listClientsForDevice ${deviceId}:${port} enable_devtool failed %O`, err);
                    }
                    return {
                        id: ClientId.serialize(deviceId, port),
                        info,
                        port
                    };
                }));
                return results.filter((result)=>'fulfilled' === result.status).map((result)=>result.value);
            }
        }
    },
    "../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/rslib-runtime.js" (__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Q: ()=>__nested_rspack_require_65__
        });
        var __webpack_modules__ = {};
        var __webpack_module_cache__ = {};
        function __nested_rspack_require_65__(moduleId) {
            var cachedModule = __webpack_module_cache__[moduleId];
            if (void 0 !== cachedModule) return cachedModule.exports;
            var module = __webpack_module_cache__[moduleId] = {
                exports: {}
            };
            __webpack_modules__[moduleId].call(module.exports, module, module.exports, __nested_rspack_require_65__);
            return module.exports;
        }
        __nested_rspack_require_65__.m = __webpack_modules__;
        (()=>{
            __nested_rspack_require_65__.add = function(modules) {
                Object.assign(__nested_rspack_require_65__.m, modules);
            };
        })();
        (()=>{
            __nested_rspack_require_65__.n = (module)=>{
                var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
                __nested_rspack_require_65__.d(getter, {
                    a: getter
                });
                return getter;
            };
        })();
        (()=>{
            __nested_rspack_require_65__.d = (exports, definition)=>{
                for(var key in definition)if (__nested_rspack_require_65__.o(definition, key) && !__nested_rspack_require_65__.o(exports, key)) Object.defineProperty(exports, key, {
                    enumerable: true,
                    get: definition[key]
                });
            };
        })();
        (()=>{
            __nested_rspack_require_65__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
        })();
    },
    "../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/transport/index.js" (__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            HS: ()=>iOSTransport,
            Ry: ()=>AndroidTransport,
            y4: ()=>DesktopTransport
        });
        var net__rspack_import_0 = __webpack_require__("net");
        var _rslib_runtime_js__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/rslib-runtime.js");
        var node_net__rspack_import_2 = __webpack_require__("node:net");
        var node_stream__rspack_import_3 = __webpack_require__("node:stream");
        __webpack_require__("../../../node_modules/.pnpm/@lynx-js+devtool-connector@0.1.0/node_modules/@lynx-js/devtool-connector/dist/844.js");
        _rslib_runtime_js__rspack_import_1.Q.add({
            "../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/errors.js" (__unused_rspack_module, exports) {
                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                exports.unreachableCheck = exports.UnreachableCheck = exports.StatusError = exports.CustomError = void 0;
                exports.isErrorLike = isErrorLike;
                exports.asErrorLike = asErrorLike;
                function isErrorLike(error) {
                    return error && 'object' == typeof error && (error instanceof Error || error.message || error.code || error.stack);
                }
                function asErrorLike(error) {
                    if (isErrorLike(error)) return error;
                    if (error) return new Error(error.message || error.toString() || '[Unknown error]');
                    return new Error('[Undefined error]');
                }
                class CustomError extends Error {
                    constructor(message, extras = {}){
                        super(message);
                        this.name = new.target.name;
                        Object.setPrototypeOf(this, new.target.prototype);
                        if (void 0 !== extras.code) this.code = extras.code;
                        if (void 0 !== extras.statusCode) this.statusCode = extras.statusCode;
                        if (void 0 !== extras.cause) this.cause = extras.cause;
                    }
                    code;
                    statusCode;
                    cause;
                }
                exports.CustomError = CustomError;
                class StatusError extends CustomError {
                    constructor(statusCode, message, extras = {}){
                        super(message, {
                            ...extras,
                            statusCode: statusCode
                        });
                    }
                }
                exports.StatusError = StatusError;
                class UnreachableCheck extends CustomError {
                    constructor(value, getValue = (x)=>x){
                        super(`Unhandled case value: ${getValue(value)}`);
                    }
                }
                exports.UnreachableCheck = UnreachableCheck;
                const unreachableCheck = (value, getValue = (x)=>x)=>{
                    throw new UnreachableCheck(value, getValue);
                };
                exports.unreachableCheck = unreachableCheck;
            },
            "../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/index.js" (__unused_rspack_module, exports, __webpack_require__) {
                var __createBinding = this && this.__createBinding || (Object.create ? function(o, m, k, k2) {
                    if (void 0 === k2) k2 = k;
                    var desc = Object.getOwnPropertyDescriptor(m, k);
                    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
                        enumerable: true,
                        get: function() {
                            return m[k];
                        }
                    };
                    Object.defineProperty(o, k2, desc);
                } : function(o, m, k, k2) {
                    if (void 0 === k2) k2 = k;
                    o[k2] = m[k];
                });
                var __exportStar = this && this.__exportStar || function(m, exports) {
                    for(var p in m)if ("default" !== p && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
                };
                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                __exportStar((0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/promises.js"), exports);
                __exportStar((0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/errors.js"), exports);
                __exportStar((0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/text.js"), exports);
            },
            "../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/promises.js" (__unused_rspack_module, exports) {
                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                exports.delay = void 0;
                exports.doWhile = doWhile;
                exports.getDeferred = getDeferred;
                exports.combineParallelCalls = combineParallelCalls;
                const delay = (ms, options = {})=>new Promise((resolve)=>{
                        const timer = setTimeout(resolve, ms);
                        if (options.unref && timer.unref) timer.unref();
                    });
                exports.delay = delay;
                async function doWhile(doFn, whileFn) {
                    do await doFn();
                    while (await whileFn());
                }
                function getDeferred() {
                    let resolve;
                    let reject;
                    const promise = new Promise((resolveCb, rejectCb)=>{
                        resolve = resolveCb;
                        reject = rejectCb;
                    });
                    return Object.assign(promise, {
                        resolve,
                        reject,
                        promise
                    });
                }
                function combineParallelCalls(fn) {
                    let pendingPromise;
                    return ()=>{
                        if (void 0 === pendingPromise) pendingPromise = fn().finally(()=>{
                            pendingPromise = void 0;
                        });
                        return pendingPromise;
                    };
                }
            },
            "../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/text.js" (__unused_rspack_module, exports) {
                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                exports.truncateWithEllipsis = truncateWithEllipsis;
                exports.joinAnd = joinAnd;
                exports.aOrAn = aOrAn;
                function truncateWithEllipsis(str, length) {
                    if (str.length <= length) return str;
                    return str.slice(0, length - 3) + "...";
                }
                function joinAnd(val, options = {}) {
                    if (1 === val.length) return val[0];
                    const separator = options.separator ?? ', ';
                    const finalSeparator = options.finalSeparator ?? 'and ';
                    const oxfordComma = options.oxfordComma ?? false;
                    return val.slice(0, -1).join(separator) + (oxfordComma ? separator : ' ') + finalSeparator + val[val.length - 1];
                }
                const VOWEL_ISH = [
                    'a',
                    'e',
                    'i',
                    'o',
                    'u',
                    'y'
                ];
                function aOrAn(value) {
                    if (VOWEL_ISH.includes(value[0].toLowerCase())) return 'an';
                    return 'a';
                }
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/conventions.js" (__unused_rspack_module, exports) {
                function find(list, predicate, ac) {
                    if (void 0 === ac) ac = Array.prototype;
                    if (list && 'function' == typeof ac.find) return ac.find.call(list, predicate);
                    for(var i = 0; i < list.length; i++)if (Object.prototype.hasOwnProperty.call(list, i)) {
                        var item = list[i];
                        if (predicate.call(void 0, item, i, list)) return item;
                    }
                }
                function freeze(object, oc) {
                    if (void 0 === oc) oc = Object;
                    return oc && 'function' == typeof oc.freeze ? oc.freeze(object) : object;
                }
                function assign(target, source) {
                    if (null === target || 'object' != typeof target) throw new TypeError('target is not an object');
                    for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
                    return target;
                }
                var MIME_TYPE = freeze({
                    HTML: 'text/html',
                    isHTML: function(value) {
                        return value === MIME_TYPE.HTML;
                    },
                    XML_APPLICATION: 'application/xml',
                    XML_TEXT: 'text/xml',
                    XML_XHTML_APPLICATION: 'application/xhtml+xml',
                    XML_SVG_IMAGE: 'image/svg+xml'
                });
                var NAMESPACE = freeze({
                    HTML: 'http://www.w3.org/1999/xhtml',
                    isHTML: function(uri) {
                        return uri === NAMESPACE.HTML;
                    },
                    SVG: 'http://www.w3.org/2000/svg',
                    XML: 'http://www.w3.org/XML/1998/namespace',
                    XMLNS: 'http://www.w3.org/2000/xmlns/'
                });
                exports.assign = assign;
                exports.find = find;
                exports.freeze = freeze;
                exports.MIME_TYPE = MIME_TYPE;
                exports.NAMESPACE = NAMESPACE;
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/dom-parser.js" (__unused_rspack_module, exports, __webpack_require__) {
                var conventions = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/conventions.js");
                var dom = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/dom.js");
                var entities = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/entities.js");
                var sax = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/sax.js");
                var DOMImplementation = dom.DOMImplementation;
                var NAMESPACE = conventions.NAMESPACE;
                var ParseError = sax.ParseError;
                var XMLReader = sax.XMLReader;
                function normalizeLineEndings(input) {
                    return input.replace(/\r[\n\u0085]/g, '\n').replace(/[\r\u0085\u2028]/g, '\n');
                }
                function DOMParser(options) {
                    this.options = options || {
                        locator: {}
                    };
                }
                DOMParser.prototype.parseFromString = function(source, mimeType) {
                    var options = this.options;
                    var sax = new XMLReader();
                    var domBuilder = options.domBuilder || new DOMHandler();
                    var errorHandler = options.errorHandler;
                    var locator = options.locator;
                    var defaultNSMap = options.xmlns || {};
                    var isHTML = /\/x?html?$/.test(mimeType);
                    var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
                    if (locator) domBuilder.setDocumentLocator(locator);
                    sax.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
                    sax.domBuilder = options.domBuilder || domBuilder;
                    if (isHTML) defaultNSMap[''] = NAMESPACE.HTML;
                    defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
                    var normalize = options.normalizeLineEndings || normalizeLineEndings;
                    if (source && 'string' == typeof source) sax.parse(normalize(source), defaultNSMap, entityMap);
                    else sax.errorHandler.error('invalid doc source');
                    return domBuilder.doc;
                };
                function buildErrorHandler(errorImpl, domBuilder, locator) {
                    if (!errorImpl) {
                        if (domBuilder instanceof DOMHandler) return domBuilder;
                        errorImpl = domBuilder;
                    }
                    var errorHandler = {};
                    var isCallback = errorImpl instanceof Function;
                    locator = locator || {};
                    function build(key) {
                        var fn = errorImpl[key];
                        if (!fn && isCallback) fn = 2 == errorImpl.length ? function(msg) {
                            errorImpl(key, msg);
                        } : errorImpl;
                        errorHandler[key] = fn && function(msg) {
                            fn('[xmldom ' + key + ']\t' + msg + _locator(locator));
                        } || function() {};
                    }
                    build('warning');
                    build('error');
                    build('fatalError');
                    return errorHandler;
                }
                function DOMHandler() {
                    this.cdata = false;
                }
                function position(locator, node) {
                    node.lineNumber = locator.lineNumber;
                    node.columnNumber = locator.columnNumber;
                }
                DOMHandler.prototype = {
                    startDocument: function() {
                        this.doc = new DOMImplementation().createDocument(null, null, null);
                        if (this.locator) this.doc.documentURI = this.locator.systemId;
                    },
                    startElement: function(namespaceURI, localName, qName, attrs) {
                        var doc = this.doc;
                        var el = doc.createElementNS(namespaceURI, qName || localName);
                        var len = attrs.length;
                        appendElement(this, el);
                        this.currentElement = el;
                        this.locator && position(this.locator, el);
                        for(var i = 0; i < len; i++){
                            var namespaceURI = attrs.getURI(i);
                            var value = attrs.getValue(i);
                            var qName = attrs.getQName(i);
                            var attr = doc.createAttributeNS(namespaceURI, qName);
                            this.locator && position(attrs.getLocator(i), attr);
                            attr.value = attr.nodeValue = value;
                            el.setAttributeNode(attr);
                        }
                    },
                    endElement: function(namespaceURI, localName, qName) {
                        var current = this.currentElement;
                        current.tagName;
                        this.currentElement = current.parentNode;
                    },
                    startPrefixMapping: function(prefix, uri) {},
                    endPrefixMapping: function(prefix) {},
                    processingInstruction: function(target, data) {
                        var ins = this.doc.createProcessingInstruction(target, data);
                        this.locator && position(this.locator, ins);
                        appendElement(this, ins);
                    },
                    ignorableWhitespace: function(ch, start, length) {},
                    characters: function(chars, start, length) {
                        chars = _toString.apply(this, arguments);
                        if (chars) {
                            if (this.cdata) var charNode = this.doc.createCDATASection(chars);
                            else var charNode = this.doc.createTextNode(chars);
                            if (this.currentElement) this.currentElement.appendChild(charNode);
                            else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
                            this.locator && position(this.locator, charNode);
                        }
                    },
                    skippedEntity: function(name) {},
                    endDocument: function() {
                        this.doc.normalize();
                    },
                    setDocumentLocator: function(locator) {
                        if (this.locator = locator) locator.lineNumber = 0;
                    },
                    comment: function(chars, start, length) {
                        chars = _toString.apply(this, arguments);
                        var comm = this.doc.createComment(chars);
                        this.locator && position(this.locator, comm);
                        appendElement(this, comm);
                    },
                    startCDATA: function() {
                        this.cdata = true;
                    },
                    endCDATA: function() {
                        this.cdata = false;
                    },
                    startDTD: function(name, publicId, systemId) {
                        var impl = this.doc.implementation;
                        if (impl && impl.createDocumentType) {
                            var dt = impl.createDocumentType(name, publicId, systemId);
                            this.locator && position(this.locator, dt);
                            appendElement(this, dt);
                            this.doc.doctype = dt;
                        }
                    },
                    warning: function(error) {
                        console1.warn('[xmldom warning]\t' + error, _locator(this.locator));
                    },
                    error: function(error) {
                        console1.error('[xmldom error]\t' + error, _locator(this.locator));
                    },
                    fatalError: function(error) {
                        throw new ParseError(error, this.locator);
                    }
                };
                function _locator(l) {
                    if (l) return '\n@' + (l.systemId || '') + '#[line:' + l.lineNumber + ',col:' + l.columnNumber + ']';
                }
                function _toString(chars, start, length) {
                    if ('string' == typeof chars) return chars.substr(start, length);
                    if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + '';
                    return chars;
                }
                "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
                    DOMHandler.prototype[key] = function() {
                        return null;
                    };
                });
                function appendElement(hander, node) {
                    if (hander.currentElement) hander.currentElement.appendChild(node);
                    else hander.doc.appendChild(node);
                }
                exports.DOMParser = DOMParser;
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/dom.js" (__unused_rspack_module, exports, __webpack_require__) {
                var conventions = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/conventions.js");
                var find = conventions.find;
                var NAMESPACE = conventions.NAMESPACE;
                function notEmptyString(input) {
                    return '' !== input;
                }
                function splitOnASCIIWhitespace(input) {
                    return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
                }
                function orderedSetReducer(current, element) {
                    if (!current.hasOwnProperty(element)) current[element] = true;
                    return current;
                }
                function toOrderedSet(input) {
                    if (!input) return [];
                    var list = splitOnASCIIWhitespace(input);
                    return Object.keys(list.reduce(orderedSetReducer, {}));
                }
                function arrayIncludes(list) {
                    return function(element) {
                        return list && -1 !== list.indexOf(element);
                    };
                }
                function copy(src, dest) {
                    for(var p in src)if (Object.prototype.hasOwnProperty.call(src, p)) dest[p] = src[p];
                }
                function _extends(Class, Super) {
                    var pt = Class.prototype;
                    if (!(pt instanceof Super)) {
                        function t() {}
                        t.prototype = Super.prototype;
                        t = new t();
                        copy(pt, t);
                        Class.prototype = pt = t;
                    }
                    if (pt.constructor != Class) {
                        if ('function' != typeof Class) console1.error("unknown Class:" + Class);
                        pt.constructor = Class;
                    }
                }
                var NodeType = {};
                var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
                var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
                var TEXT_NODE = NodeType.TEXT_NODE = 3;
                var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
                var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
                var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
                var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
                var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
                var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
                var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
                var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
                var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
                var ExceptionCode = {};
                var ExceptionMessage = {};
                ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
                ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
                var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
                ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
                ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
                ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
                ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
                var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
                ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
                var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
                ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
                ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
                ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
                ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
                ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
                function DOMException(code, message) {
                    if (message instanceof Error) var error = message;
                    else {
                        error = this;
                        Error.call(this, ExceptionMessage[code]);
                        this.message = ExceptionMessage[code];
                        if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
                    }
                    error.code = code;
                    if (message) this.message = this.message + ": " + message;
                    return error;
                }
                DOMException.prototype = Error.prototype;
                copy(ExceptionCode, DOMException);
                function NodeList() {}
                NodeList.prototype = {
                    length: 0,
                    item: function(index) {
                        return index >= 0 && index < this.length ? this[index] : null;
                    },
                    toString: function(isHTML, nodeFilter) {
                        for(var buf = [], i = 0; i < this.length; i++)serializeToString(this[i], buf, isHTML, nodeFilter);
                        return buf.join('');
                    },
                    filter: function(predicate) {
                        return Array.prototype.filter.call(this, predicate);
                    },
                    indexOf: function(item) {
                        return Array.prototype.indexOf.call(this, item);
                    }
                };
                function LiveNodeList(node, refresh) {
                    this._node = node;
                    this._refresh = refresh;
                    _updateLiveList(this);
                }
                function _updateLiveList(list) {
                    var inc = list._node._inc || list._node.ownerDocument._inc;
                    if (list._inc !== inc) {
                        var ls = list._refresh(list._node);
                        __set__(list, 'length', ls.length);
                        if (!list.$$length || ls.length < list.$$length) {
                            for(var i = ls.length; i in list; i++)if (Object.prototype.hasOwnProperty.call(list, i)) delete list[i];
                        }
                        copy(ls, list);
                        list._inc = inc;
                    }
                }
                LiveNodeList.prototype.item = function(i) {
                    _updateLiveList(this);
                    return this[i] || null;
                };
                _extends(LiveNodeList, NodeList);
                function NamedNodeMap() {}
                function _findNodeIndex(list, node) {
                    var i = list.length;
                    while(i--)if (list[i] === node) return i;
                }
                function _addNamedNode(el, list, newAttr, oldAttr) {
                    if (oldAttr) list[_findNodeIndex(list, oldAttr)] = newAttr;
                    else list[list.length++] = newAttr;
                    if (el) {
                        newAttr.ownerElement = el;
                        var doc = el.ownerDocument;
                        if (doc) {
                            oldAttr && _onRemoveAttribute(doc, el, oldAttr);
                            _onAddAttribute(doc, el, newAttr);
                        }
                    }
                }
                function _removeNamedNode(el, list, attr) {
                    var i = _findNodeIndex(list, attr);
                    if (i >= 0) {
                        var lastIndex = list.length - 1;
                        while(i < lastIndex)list[i] = list[++i];
                        list.length = lastIndex;
                        if (el) {
                            var doc = el.ownerDocument;
                            if (doc) {
                                _onRemoveAttribute(doc, el, attr);
                                attr.ownerElement = null;
                            }
                        }
                    } else throw new DOMException(NOT_FOUND_ERR, new Error(el.tagName + '@' + attr));
                }
                NamedNodeMap.prototype = {
                    length: 0,
                    item: NodeList.prototype.item,
                    getNamedItem: function(key) {
                        var i = this.length;
                        while(i--){
                            var attr = this[i];
                            if (attr.nodeName == key) return attr;
                        }
                    },
                    setNamedItem: function(attr) {
                        var el = attr.ownerElement;
                        if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
                        var oldAttr = this.getNamedItem(attr.nodeName);
                        _addNamedNode(this._ownerElement, this, attr, oldAttr);
                        return oldAttr;
                    },
                    setNamedItemNS: function(attr) {
                        var el = attr.ownerElement, oldAttr;
                        if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
                        oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
                        _addNamedNode(this._ownerElement, this, attr, oldAttr);
                        return oldAttr;
                    },
                    removeNamedItem: function(key) {
                        var attr = this.getNamedItem(key);
                        _removeNamedNode(this._ownerElement, this, attr);
                        return attr;
                    },
                    removeNamedItemNS: function(namespaceURI, localName) {
                        var attr = this.getNamedItemNS(namespaceURI, localName);
                        _removeNamedNode(this._ownerElement, this, attr);
                        return attr;
                    },
                    getNamedItemNS: function(namespaceURI, localName) {
                        var i = this.length;
                        while(i--){
                            var node = this[i];
                            if (node.localName == localName && node.namespaceURI == namespaceURI) return node;
                        }
                        return null;
                    }
                };
                function DOMImplementation() {}
                DOMImplementation.prototype = {
                    hasFeature: function(feature, version) {
                        return true;
                    },
                    createDocument: function(namespaceURI, qualifiedName, doctype) {
                        var doc = new Document();
                        doc.implementation = this;
                        doc.childNodes = new NodeList();
                        doc.doctype = doctype || null;
                        if (doctype) doc.appendChild(doctype);
                        if (qualifiedName) {
                            var root = doc.createElementNS(namespaceURI, qualifiedName);
                            doc.appendChild(root);
                        }
                        return doc;
                    },
                    createDocumentType: function(qualifiedName, publicId, systemId) {
                        var node = new DocumentType();
                        node.name = qualifiedName;
                        node.nodeName = qualifiedName;
                        node.publicId = publicId || '';
                        node.systemId = systemId || '';
                        return node;
                    }
                };
                function Node() {}
                Node.prototype = {
                    firstChild: null,
                    lastChild: null,
                    previousSibling: null,
                    nextSibling: null,
                    attributes: null,
                    parentNode: null,
                    childNodes: null,
                    ownerDocument: null,
                    nodeValue: null,
                    namespaceURI: null,
                    prefix: null,
                    localName: null,
                    insertBefore: function(newChild, refChild) {
                        return _insertBefore(this, newChild, refChild);
                    },
                    replaceChild: function(newChild, oldChild) {
                        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
                        if (oldChild) this.removeChild(oldChild);
                    },
                    removeChild: function(oldChild) {
                        return _removeChild(this, oldChild);
                    },
                    appendChild: function(newChild) {
                        return this.insertBefore(newChild, null);
                    },
                    hasChildNodes: function() {
                        return null != this.firstChild;
                    },
                    cloneNode: function(deep) {
                        return cloneNode(this.ownerDocument || this, this, deep);
                    },
                    normalize: function() {
                        var child = this.firstChild;
                        while(child){
                            var next = child.nextSibling;
                            if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
                                this.removeChild(next);
                                child.appendData(next.data);
                            } else {
                                child.normalize();
                                child = next;
                            }
                        }
                    },
                    isSupported: function(feature, version) {
                        return this.ownerDocument.implementation.hasFeature(feature, version);
                    },
                    hasAttributes: function() {
                        return this.attributes.length > 0;
                    },
                    lookupPrefix: function(namespaceURI) {
                        var el = this;
                        while(el){
                            var map = el._nsMap;
                            if (map) {
                                for(var n in map)if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) return n;
                            }
                            el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
                        }
                        return null;
                    },
                    lookupNamespaceURI: function(prefix) {
                        var el = this;
                        while(el){
                            var map = el._nsMap;
                            if (map) {
                                if (Object.prototype.hasOwnProperty.call(map, prefix)) return map[prefix];
                            }
                            el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
                        }
                        return null;
                    },
                    isDefaultNamespace: function(namespaceURI) {
                        var prefix = this.lookupPrefix(namespaceURI);
                        return null == prefix;
                    }
                };
                function _xmlEncoder(c) {
                    return '<' == c && '&lt;' || '>' == c && '&gt;' || '&' == c && '&amp;' || '"' == c && '&quot;' || '&#' + c.charCodeAt() + ';';
                }
                copy(NodeType, Node);
                copy(NodeType, Node.prototype);
                function _visitNode(node, callback) {
                    if (callback(node)) return true;
                    if (node = node.firstChild) do if (_visitNode(node, callback)) return true;
                    while (node = node.nextSibling);
                }
                function Document() {
                    this.ownerDocument = this;
                }
                function _onAddAttribute(doc, el, newAttr) {
                    doc && doc._inc++;
                    var ns = newAttr.namespaceURI;
                    if (ns === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ''] = newAttr.value;
                }
                function _onRemoveAttribute(doc, el, newAttr, remove) {
                    doc && doc._inc++;
                    var ns = newAttr.namespaceURI;
                    if (ns === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ''];
                }
                function _onUpdateChild(doc, el, newChild) {
                    if (doc && doc._inc) {
                        doc._inc++;
                        var cs = el.childNodes;
                        if (newChild) cs[cs.length++] = newChild;
                        else {
                            var child = el.firstChild;
                            var i = 0;
                            while(child){
                                cs[i++] = child;
                                child = child.nextSibling;
                            }
                            cs.length = i;
                            delete cs[cs.length];
                        }
                    }
                }
                function _removeChild(parentNode, child) {
                    var previous = child.previousSibling;
                    var next = child.nextSibling;
                    if (previous) previous.nextSibling = next;
                    else parentNode.firstChild = next;
                    if (next) next.previousSibling = previous;
                    else parentNode.lastChild = previous;
                    child.parentNode = null;
                    child.previousSibling = null;
                    child.nextSibling = null;
                    _onUpdateChild(parentNode.ownerDocument, parentNode);
                    return child;
                }
                function hasValidParentNodeType(node) {
                    return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
                }
                function hasInsertableNodeType(node) {
                    return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
                }
                function isDocTypeNode(node) {
                    return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
                }
                function isElementNode(node) {
                    return node && node.nodeType === Node.ELEMENT_NODE;
                }
                function isTextNode(node) {
                    return node && node.nodeType === Node.TEXT_NODE;
                }
                function isElementInsertionPossible(doc, child) {
                    var parentChildNodes = doc.childNodes || [];
                    if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
                    var docTypeNode = find(parentChildNodes, isDocTypeNode);
                    return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
                }
                function isElementReplacementPossible(doc, child) {
                    var parentChildNodes = doc.childNodes || [];
                    function hasElementChildThatIsNotChild(node) {
                        return isElementNode(node) && node !== child;
                    }
                    if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
                    var docTypeNode = find(parentChildNodes, isDocTypeNode);
                    return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
                }
                function assertPreInsertionValidity1to5(parent, node, child) {
                    if (!hasValidParentNodeType(parent)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Unexpected parent node type ' + parent.nodeType);
                    if (child && child.parentNode !== parent) throw new DOMException(NOT_FOUND_ERR, 'child not in parent');
                    if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Unexpected node type ' + node.nodeType + ' for parent node type ' + parent.nodeType);
                }
                function assertPreInsertionValidityInDocument(parent, node, child) {
                    var parentChildNodes = parent.childNodes || [];
                    var nodeChildNodes = node.childNodes || [];
                    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                        var nodeChildElements = nodeChildNodes.filter(isElementNode);
                        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
                        if (1 === nodeChildElements.length && !isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
                    }
                    if (isElementNode(node)) {
                        if (!isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
                    }
                    if (isDocTypeNode(node)) {
                        if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
                        var parentElementChild = find(parentChildNodes, isElementNode);
                        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
                        if (!child && parentElementChild) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can not be appended since element is present');
                    }
                }
                function assertPreReplacementValidityInDocument(parent, node, child) {
                    var parentChildNodes = parent.childNodes || [];
                    var nodeChildNodes = node.childNodes || [];
                    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                        var nodeChildElements = nodeChildNodes.filter(isElementNode);
                        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
                        if (1 === nodeChildElements.length && !isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
                    }
                    if (isElementNode(node)) {
                        if (!isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
                    }
                    if (isDocTypeNode(node)) {
                        function hasDoctypeChildThatIsNotChild(node) {
                            return isDocTypeNode(node) && node !== child;
                        }
                        if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
                        var parentElementChild = find(parentChildNodes, isElementNode);
                        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
                    }
                }
                function _insertBefore(parent, node, child, _inDocumentAssertion) {
                    assertPreInsertionValidity1to5(parent, node, child);
                    if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
                    var cp = node.parentNode;
                    if (cp) cp.removeChild(node);
                    if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
                        var newFirst = node.firstChild;
                        if (null == newFirst) return node;
                        var newLast = node.lastChild;
                    } else newFirst = newLast = node;
                    var pre = child ? child.previousSibling : parent.lastChild;
                    newFirst.previousSibling = pre;
                    newLast.nextSibling = child;
                    if (pre) pre.nextSibling = newFirst;
                    else parent.firstChild = newFirst;
                    if (null == child) parent.lastChild = newLast;
                    else child.previousSibling = newLast;
                    do {
                        newFirst.parentNode = parent;
                        var targetDoc = parent.ownerDocument || parent;
                        _updateOwnerDocument(newFirst, targetDoc);
                    }while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
                    _onUpdateChild(parent.ownerDocument || parent, parent);
                    if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
                    return node;
                }
                function _updateOwnerDocument(node, newOwnerDocument) {
                    if (node.ownerDocument === newOwnerDocument) return;
                    node.ownerDocument = newOwnerDocument;
                    if (node.nodeType === ELEMENT_NODE && node.attributes) for(var i = 0; i < node.attributes.length; i++){
                        var attr = node.attributes.item(i);
                        if (attr) attr.ownerDocument = newOwnerDocument;
                    }
                    var child = node.firstChild;
                    while(child){
                        _updateOwnerDocument(child, newOwnerDocument);
                        child = child.nextSibling;
                    }
                }
                function _appendSingleChild(parentNode, newChild) {
                    if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
                    newChild.parentNode = parentNode;
                    newChild.previousSibling = parentNode.lastChild;
                    newChild.nextSibling = null;
                    if (newChild.previousSibling) newChild.previousSibling.nextSibling = newChild;
                    else parentNode.firstChild = newChild;
                    parentNode.lastChild = newChild;
                    _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
                    var targetDoc = parentNode.ownerDocument || parentNode;
                    _updateOwnerDocument(newChild, targetDoc);
                    return newChild;
                }
                Document.prototype = {
                    nodeName: '#document',
                    nodeType: DOCUMENT_NODE,
                    doctype: null,
                    documentElement: null,
                    _inc: 1,
                    insertBefore: function(newChild, refChild) {
                        if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
                            var child = newChild.firstChild;
                            while(child){
                                var next = child.nextSibling;
                                this.insertBefore(child, refChild);
                                child = next;
                            }
                            return newChild;
                        }
                        _insertBefore(this, newChild, refChild);
                        _updateOwnerDocument(newChild, this);
                        if (null === this.documentElement && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
                        return newChild;
                    },
                    removeChild: function(oldChild) {
                        if (this.documentElement == oldChild) this.documentElement = null;
                        return _removeChild(this, oldChild);
                    },
                    replaceChild: function(newChild, oldChild) {
                        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
                        _updateOwnerDocument(newChild, this);
                        if (oldChild) this.removeChild(oldChild);
                        if (isElementNode(newChild)) this.documentElement = newChild;
                    },
                    importNode: function(importedNode, deep) {
                        return importNode(this, importedNode, deep);
                    },
                    getElementById: function(id) {
                        var rtv = null;
                        _visitNode(this.documentElement, function(node) {
                            if (node.nodeType == ELEMENT_NODE) {
                                if (node.getAttribute('id') == id) {
                                    rtv = node;
                                    return true;
                                }
                            }
                        });
                        return rtv;
                    },
                    getElementsByClassName: function(classNames) {
                        var classNamesSet = toOrderedSet(classNames);
                        return new LiveNodeList(this, function(base) {
                            var ls = [];
                            if (classNamesSet.length > 0) _visitNode(base.documentElement, function(node) {
                                if (node !== base && node.nodeType === ELEMENT_NODE) {
                                    var nodeClassNames = node.getAttribute('class');
                                    if (nodeClassNames) {
                                        var matches = classNames === nodeClassNames;
                                        if (!matches) {
                                            var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                                            matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                                        }
                                        if (matches) ls.push(node);
                                    }
                                }
                            });
                            return ls;
                        });
                    },
                    createElement: function(tagName) {
                        var node = new Element();
                        node.ownerDocument = this;
                        node.nodeName = tagName;
                        node.tagName = tagName;
                        node.localName = tagName;
                        node.childNodes = new NodeList();
                        var attrs = node.attributes = new NamedNodeMap();
                        attrs._ownerElement = node;
                        return node;
                    },
                    createDocumentFragment: function() {
                        var node = new DocumentFragment();
                        node.ownerDocument = this;
                        node.childNodes = new NodeList();
                        return node;
                    },
                    createTextNode: function(data) {
                        var node = new Text();
                        node.ownerDocument = this;
                        node.appendData(data);
                        return node;
                    },
                    createComment: function(data) {
                        var node = new Comment();
                        node.ownerDocument = this;
                        node.appendData(data);
                        return node;
                    },
                    createCDATASection: function(data) {
                        var node = new CDATASection();
                        node.ownerDocument = this;
                        node.appendData(data);
                        return node;
                    },
                    createProcessingInstruction: function(target, data) {
                        var node = new ProcessingInstruction();
                        node.ownerDocument = this;
                        node.tagName = node.nodeName = node.target = target;
                        node.nodeValue = node.data = data;
                        return node;
                    },
                    createAttribute: function(name) {
                        var node = new Attr();
                        node.ownerDocument = this;
                        node.name = name;
                        node.nodeName = name;
                        node.localName = name;
                        node.specified = true;
                        return node;
                    },
                    createEntityReference: function(name) {
                        var node = new EntityReference();
                        node.ownerDocument = this;
                        node.nodeName = name;
                        return node;
                    },
                    createElementNS: function(namespaceURI, qualifiedName) {
                        var node = new Element();
                        var pl = qualifiedName.split(':');
                        var attrs = node.attributes = new NamedNodeMap();
                        node.childNodes = new NodeList();
                        node.ownerDocument = this;
                        node.nodeName = qualifiedName;
                        node.tagName = qualifiedName;
                        node.namespaceURI = namespaceURI;
                        if (2 == pl.length) {
                            node.prefix = pl[0];
                            node.localName = pl[1];
                        } else node.localName = qualifiedName;
                        attrs._ownerElement = node;
                        return node;
                    },
                    createAttributeNS: function(namespaceURI, qualifiedName) {
                        var node = new Attr();
                        var pl = qualifiedName.split(':');
                        node.ownerDocument = this;
                        node.nodeName = qualifiedName;
                        node.name = qualifiedName;
                        node.namespaceURI = namespaceURI;
                        node.specified = true;
                        if (2 == pl.length) {
                            node.prefix = pl[0];
                            node.localName = pl[1];
                        } else node.localName = qualifiedName;
                        return node;
                    }
                };
                _extends(Document, Node);
                function Element() {
                    this._nsMap = {};
                }
                Element.prototype = {
                    nodeType: ELEMENT_NODE,
                    hasAttribute: function(name) {
                        return null != this.getAttributeNode(name);
                    },
                    getAttribute: function(name) {
                        var attr = this.getAttributeNode(name);
                        return attr && attr.value || '';
                    },
                    getAttributeNode: function(name) {
                        return this.attributes.getNamedItem(name);
                    },
                    setAttribute: function(name, value) {
                        var attr = this.ownerDocument.createAttribute(name);
                        attr.value = attr.nodeValue = "" + value;
                        this.setAttributeNode(attr);
                    },
                    removeAttribute: function(name) {
                        var attr = this.getAttributeNode(name);
                        attr && this.removeAttributeNode(attr);
                    },
                    appendChild: function(newChild) {
                        if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) return this.insertBefore(newChild, null);
                        return _appendSingleChild(this, newChild);
                    },
                    setAttributeNode: function(newAttr) {
                        return this.attributes.setNamedItem(newAttr);
                    },
                    setAttributeNodeNS: function(newAttr) {
                        return this.attributes.setNamedItemNS(newAttr);
                    },
                    removeAttributeNode: function(oldAttr) {
                        return this.attributes.removeNamedItem(oldAttr.nodeName);
                    },
                    removeAttributeNS: function(namespaceURI, localName) {
                        var old = this.getAttributeNodeNS(namespaceURI, localName);
                        old && this.removeAttributeNode(old);
                    },
                    hasAttributeNS: function(namespaceURI, localName) {
                        return null != this.getAttributeNodeNS(namespaceURI, localName);
                    },
                    getAttributeNS: function(namespaceURI, localName) {
                        var attr = this.getAttributeNodeNS(namespaceURI, localName);
                        return attr && attr.value || '';
                    },
                    setAttributeNS: function(namespaceURI, qualifiedName, value) {
                        var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
                        attr.value = attr.nodeValue = "" + value;
                        this.setAttributeNode(attr);
                    },
                    getAttributeNodeNS: function(namespaceURI, localName) {
                        return this.attributes.getNamedItemNS(namespaceURI, localName);
                    },
                    getElementsByTagName: function(tagName) {
                        return new LiveNodeList(this, function(base) {
                            var ls = [];
                            _visitNode(base, function(node) {
                                if (node !== base && node.nodeType == ELEMENT_NODE && ('*' === tagName || node.tagName == tagName)) ls.push(node);
                            });
                            return ls;
                        });
                    },
                    getElementsByTagNameNS: function(namespaceURI, localName) {
                        return new LiveNodeList(this, function(base) {
                            var ls = [];
                            _visitNode(base, function(node) {
                                if (node !== base && node.nodeType === ELEMENT_NODE && ('*' === namespaceURI || node.namespaceURI === namespaceURI) && ('*' === localName || node.localName == localName)) ls.push(node);
                            });
                            return ls;
                        });
                    }
                };
                Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
                Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
                _extends(Element, Node);
                function Attr() {}
                Attr.prototype.nodeType = ATTRIBUTE_NODE;
                _extends(Attr, Node);
                function CharacterData() {}
                CharacterData.prototype = {
                    data: '',
                    substringData: function(offset, count) {
                        return this.data.substring(offset, offset + count);
                    },
                    appendData: function(text) {
                        text = this.data + text;
                        this.nodeValue = this.data = text;
                        this.length = text.length;
                    },
                    insertData: function(offset, text) {
                        this.replaceData(offset, 0, text);
                    },
                    appendChild: function(newChild) {
                        throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
                    },
                    deleteData: function(offset, count) {
                        this.replaceData(offset, count, "");
                    },
                    replaceData: function(offset, count, text) {
                        var start = this.data.substring(0, offset);
                        var end = this.data.substring(offset + count);
                        text = start + text + end;
                        this.nodeValue = this.data = text;
                        this.length = text.length;
                    }
                };
                _extends(CharacterData, Node);
                function Text() {}
                Text.prototype = {
                    nodeName: "#text",
                    nodeType: TEXT_NODE,
                    splitText: function(offset) {
                        var text = this.data;
                        var newText = text.substring(offset);
                        text = text.substring(0, offset);
                        this.data = this.nodeValue = text;
                        this.length = text.length;
                        var newNode = this.ownerDocument.createTextNode(newText);
                        if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
                        return newNode;
                    }
                };
                _extends(Text, CharacterData);
                function Comment() {}
                Comment.prototype = {
                    nodeName: "#comment",
                    nodeType: COMMENT_NODE
                };
                _extends(Comment, CharacterData);
                function CDATASection() {}
                CDATASection.prototype = {
                    nodeName: "#cdata-section",
                    nodeType: CDATA_SECTION_NODE
                };
                _extends(CDATASection, CharacterData);
                function DocumentType() {}
                DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
                _extends(DocumentType, Node);
                function Notation() {}
                Notation.prototype.nodeType = NOTATION_NODE;
                _extends(Notation, Node);
                function Entity() {}
                Entity.prototype.nodeType = ENTITY_NODE;
                _extends(Entity, Node);
                function EntityReference() {}
                EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
                _extends(EntityReference, Node);
                function DocumentFragment() {}
                DocumentFragment.prototype.nodeName = "#document-fragment";
                DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
                _extends(DocumentFragment, Node);
                function ProcessingInstruction() {}
                ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
                _extends(ProcessingInstruction, Node);
                function XMLSerializer() {}
                XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter) {
                    return nodeSerializeToString.call(node, isHtml, nodeFilter);
                };
                Node.prototype.toString = nodeSerializeToString;
                function nodeSerializeToString(isHtml, nodeFilter) {
                    var buf = [];
                    var refNode = 9 == this.nodeType && this.documentElement || this;
                    var prefix = refNode.prefix;
                    var uri = refNode.namespaceURI;
                    if (uri && null == prefix) {
                        var prefix = refNode.lookupPrefix(uri);
                        if (null == prefix) var visibleNamespaces = [
                            {
                                namespace: uri,
                                prefix: null
                            }
                        ];
                    }
                    serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces);
                    return buf.join('');
                }
                function needNamespaceDefine(node, isHTML, visibleNamespaces) {
                    var prefix = node.prefix || '';
                    var uri = node.namespaceURI;
                    if (!uri) return false;
                    if ("xml" === prefix && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
                    var i = visibleNamespaces.length;
                    while(i--){
                        var ns = visibleNamespaces[i];
                        if (ns.prefix === prefix) return ns.namespace !== uri;
                    }
                    return true;
                }
                function addSerializedAttribute(buf, qualifiedName, value) {
                    buf.push(' ', qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
                }
                function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
                    if (!visibleNamespaces) visibleNamespaces = [];
                    if (nodeFilter) {
                        node = nodeFilter(node);
                        if (!node) return;
                        if ('string' == typeof node) return void buf.push(node);
                    }
                    switch(node.nodeType){
                        case ELEMENT_NODE:
                            var attrs = node.attributes;
                            var len = attrs.length;
                            var child = node.firstChild;
                            var nodeName = node.tagName;
                            isHTML = NAMESPACE.isHTML(node.namespaceURI) || isHTML;
                            var prefixedNodeName = nodeName;
                            if (!isHTML && !node.prefix && node.namespaceURI) {
                                var defaultNS;
                                for(var ai = 0; ai < attrs.length; ai++)if ('xmlns' === attrs.item(ai).name) {
                                    defaultNS = attrs.item(ai).value;
                                    break;
                                }
                                if (!defaultNS) for(var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--){
                                    var namespace = visibleNamespaces[nsi];
                                    if ('' === namespace.prefix && namespace.namespace === node.namespaceURI) {
                                        defaultNS = namespace.namespace;
                                        break;
                                    }
                                }
                                if (defaultNS !== node.namespaceURI) for(var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--){
                                    var namespace = visibleNamespaces[nsi];
                                    if (namespace.namespace === node.namespaceURI) {
                                        if (namespace.prefix) prefixedNodeName = namespace.prefix + ':' + nodeName;
                                        break;
                                    }
                                }
                            }
                            buf.push('<', prefixedNodeName);
                            for(var i = 0; i < len; i++){
                                var attr = attrs.item(i);
                                if ('xmlns' == attr.prefix) visibleNamespaces.push({
                                    prefix: attr.localName,
                                    namespace: attr.value
                                });
                                else if ('xmlns' == attr.nodeName) visibleNamespaces.push({
                                    prefix: '',
                                    namespace: attr.value
                                });
                            }
                            for(var i = 0; i < len; i++){
                                var attr = attrs.item(i);
                                if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
                                    var prefix = attr.prefix || '';
                                    var uri = attr.namespaceURI;
                                    addSerializedAttribute(buf, prefix ? 'xmlns:' + prefix : "xmlns", uri);
                                    visibleNamespaces.push({
                                        prefix: prefix,
                                        namespace: uri
                                    });
                                }
                                serializeToString(attr, buf, isHTML, nodeFilter, visibleNamespaces);
                            }
                            if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
                                var prefix = node.prefix || '';
                                var uri = node.namespaceURI;
                                addSerializedAttribute(buf, prefix ? 'xmlns:' + prefix : "xmlns", uri);
                                visibleNamespaces.push({
                                    prefix: prefix,
                                    namespace: uri
                                });
                            }
                            if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
                                buf.push('>');
                                if (isHTML && /^script$/i.test(nodeName)) while(child){
                                    if (child.data) buf.push(child.data);
                                    else serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
                                    child = child.nextSibling;
                                }
                                else while(child){
                                    serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
                                    child = child.nextSibling;
                                }
                                buf.push('</', prefixedNodeName, '>');
                            } else buf.push('/>');
                            return;
                        case DOCUMENT_NODE:
                        case DOCUMENT_FRAGMENT_NODE:
                            var child = node.firstChild;
                            while(child){
                                serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
                                child = child.nextSibling;
                            }
                            return;
                        case ATTRIBUTE_NODE:
                            return addSerializedAttribute(buf, node.name, node.value);
                        case TEXT_NODE:
                            return buf.push(node.data.replace(/[<&>]/g, _xmlEncoder));
                        case CDATA_SECTION_NODE:
                            return buf.push('<![CDATA[', node.data, ']]>');
                        case COMMENT_NODE:
                            return buf.push("<!--", node.data, "-->");
                        case DOCUMENT_TYPE_NODE:
                            var pubid = node.publicId;
                            var sysid = node.systemId;
                            buf.push('<!DOCTYPE ', node.name);
                            if (pubid) {
                                buf.push(' PUBLIC ', pubid);
                                if (sysid && '.' != sysid) buf.push(' ', sysid);
                                buf.push('>');
                            } else if (sysid && '.' != sysid) buf.push(' SYSTEM ', sysid, '>');
                            else {
                                var sub = node.internalSubset;
                                if (sub) buf.push(" [", sub, "]");
                                buf.push(">");
                            }
                            return;
                        case PROCESSING_INSTRUCTION_NODE:
                            return buf.push("<?", node.target, " ", node.data, "?>");
                        case ENTITY_REFERENCE_NODE:
                            return buf.push('&', node.nodeName, ';');
                        default:
                            buf.push('??', node.nodeName);
                    }
                }
                function importNode(doc, node, deep) {
                    var node2;
                    switch(node.nodeType){
                        case ELEMENT_NODE:
                            node2 = node.cloneNode(false);
                            node2.ownerDocument = doc;
                        case DOCUMENT_FRAGMENT_NODE:
                            break;
                        case ATTRIBUTE_NODE:
                            deep = true;
                            break;
                    }
                    if (!node2) node2 = node.cloneNode(false);
                    node2.ownerDocument = doc;
                    node2.parentNode = null;
                    if (deep) {
                        var child = node.firstChild;
                        while(child){
                            node2.appendChild(importNode(doc, child, deep));
                            child = child.nextSibling;
                        }
                    }
                    return node2;
                }
                function cloneNode(doc, node, deep) {
                    var node2 = new node.constructor();
                    for(var n in node)if (Object.prototype.hasOwnProperty.call(node, n)) {
                        var v = node[n];
                        if ("object" != typeof v) {
                            if (v != node2[n]) node2[n] = v;
                        }
                    }
                    if (node.childNodes) node2.childNodes = new NodeList();
                    node2.ownerDocument = doc;
                    switch(node2.nodeType){
                        case ELEMENT_NODE:
                            var attrs = node.attributes;
                            var attrs2 = node2.attributes = new NamedNodeMap();
                            var len = attrs.length;
                            attrs2._ownerElement = node2;
                            for(var i = 0; i < len; i++)node2.setAttributeNode(cloneNode(doc, attrs.item(i), true));
                            break;
                        case ATTRIBUTE_NODE:
                            deep = true;
                    }
                    if (deep) {
                        var child = node.firstChild;
                        while(child){
                            node2.appendChild(cloneNode(doc, child, deep));
                            child = child.nextSibling;
                        }
                    }
                    return node2;
                }
                function __set__(object, key, value) {
                    object[key] = value;
                }
                try {
                    if (Object.defineProperty) {
                        Object.defineProperty(LiveNodeList.prototype, 'length', {
                            get: function() {
                                _updateLiveList(this);
                                return this.$$length;
                            }
                        });
                        Object.defineProperty(Node.prototype, 'textContent', {
                            get: function() {
                                return getTextContent(this);
                            },
                            set: function(data) {
                                switch(this.nodeType){
                                    case ELEMENT_NODE:
                                    case DOCUMENT_FRAGMENT_NODE:
                                        while(this.firstChild)this.removeChild(this.firstChild);
                                        if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
                                        break;
                                    default:
                                        this.data = data;
                                        this.value = data;
                                        this.nodeValue = data;
                                }
                            }
                        });
                        function getTextContent(node) {
                            switch(node.nodeType){
                                case ELEMENT_NODE:
                                case DOCUMENT_FRAGMENT_NODE:
                                    var buf = [];
                                    node = node.firstChild;
                                    while(node){
                                        if (7 !== node.nodeType && 8 !== node.nodeType) buf.push(getTextContent(node));
                                        node = node.nextSibling;
                                    }
                                    return buf.join('');
                                default:
                                    return node.nodeValue;
                            }
                        }
                        __set__ = function(object, key, value) {
                            object['$$' + key] = value;
                        };
                    }
                } catch (e) {}
                exports.DocumentType = DocumentType;
                exports.DOMException = DOMException;
                exports.DOMImplementation = DOMImplementation;
                exports.Element = Element;
                exports.Node = Node;
                exports.NodeList = NodeList;
                exports.XMLSerializer = XMLSerializer;
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/entities.js" (__unused_rspack_module, exports, __webpack_require__) {
                var freeze = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/conventions.js").freeze;
                exports.XML_ENTITIES = freeze({
                    amp: '&',
                    apos: "'",
                    gt: '>',
                    lt: '<',
                    quot: '"'
                });
                exports.HTML_ENTITIES = freeze({
                    Aacute: '\u00C1',
                    aacute: '\u00E1',
                    Abreve: '\u0102',
                    abreve: '\u0103',
                    ac: '\u223E',
                    acd: '\u223F',
                    acE: '\u223E\u0333',
                    Acirc: '\u00C2',
                    acirc: '\u00E2',
                    acute: '\u00B4',
                    Acy: '\u0410',
                    acy: '\u0430',
                    AElig: '\u00C6',
                    aelig: '\u00E6',
                    af: '\u2061',
                    Afr: '\uD835\uDD04',
                    afr: '\uD835\uDD1E',
                    Agrave: '\u00C0',
                    agrave: '\u00E0',
                    alefsym: '\u2135',
                    aleph: '\u2135',
                    Alpha: '\u0391',
                    alpha: '\u03B1',
                    Amacr: '\u0100',
                    amacr: '\u0101',
                    amalg: '\u2A3F',
                    AMP: '\u0026',
                    amp: '\u0026',
                    And: '\u2A53',
                    and: '\u2227',
                    andand: '\u2A55',
                    andd: '\u2A5C',
                    andslope: '\u2A58',
                    andv: '\u2A5A',
                    ang: '\u2220',
                    ange: '\u29A4',
                    angle: '\u2220',
                    angmsd: '\u2221',
                    angmsdaa: '\u29A8',
                    angmsdab: '\u29A9',
                    angmsdac: '\u29AA',
                    angmsdad: '\u29AB',
                    angmsdae: '\u29AC',
                    angmsdaf: '\u29AD',
                    angmsdag: '\u29AE',
                    angmsdah: '\u29AF',
                    angrt: '\u221F',
                    angrtvb: '\u22BE',
                    angrtvbd: '\u299D',
                    angsph: '\u2222',
                    angst: '\u00C5',
                    angzarr: '\u237C',
                    Aogon: '\u0104',
                    aogon: '\u0105',
                    Aopf: '\uD835\uDD38',
                    aopf: '\uD835\uDD52',
                    ap: '\u2248',
                    apacir: '\u2A6F',
                    apE: '\u2A70',
                    ape: '\u224A',
                    apid: '\u224B',
                    apos: '\u0027',
                    ApplyFunction: '\u2061',
                    approx: '\u2248',
                    approxeq: '\u224A',
                    Aring: '\u00C5',
                    aring: '\u00E5',
                    Ascr: '\uD835\uDC9C',
                    ascr: '\uD835\uDCB6',
                    Assign: '\u2254',
                    ast: '\u002A',
                    asymp: '\u2248',
                    asympeq: '\u224D',
                    Atilde: '\u00C3',
                    atilde: '\u00E3',
                    Auml: '\u00C4',
                    auml: '\u00E4',
                    awconint: '\u2233',
                    awint: '\u2A11',
                    backcong: '\u224C',
                    backepsilon: '\u03F6',
                    backprime: '\u2035',
                    backsim: '\u223D',
                    backsimeq: '\u22CD',
                    Backslash: '\u2216',
                    Barv: '\u2AE7',
                    barvee: '\u22BD',
                    Barwed: '\u2306',
                    barwed: '\u2305',
                    barwedge: '\u2305',
                    bbrk: '\u23B5',
                    bbrktbrk: '\u23B6',
                    bcong: '\u224C',
                    Bcy: '\u0411',
                    bcy: '\u0431',
                    bdquo: '\u201E',
                    becaus: '\u2235',
                    Because: '\u2235',
                    because: '\u2235',
                    bemptyv: '\u29B0',
                    bepsi: '\u03F6',
                    bernou: '\u212C',
                    Bernoullis: '\u212C',
                    Beta: '\u0392',
                    beta: '\u03B2',
                    beth: '\u2136',
                    between: '\u226C',
                    Bfr: '\uD835\uDD05',
                    bfr: '\uD835\uDD1F',
                    bigcap: '\u22C2',
                    bigcirc: '\u25EF',
                    bigcup: '\u22C3',
                    bigodot: '\u2A00',
                    bigoplus: '\u2A01',
                    bigotimes: '\u2A02',
                    bigsqcup: '\u2A06',
                    bigstar: '\u2605',
                    bigtriangledown: '\u25BD',
                    bigtriangleup: '\u25B3',
                    biguplus: '\u2A04',
                    bigvee: '\u22C1',
                    bigwedge: '\u22C0',
                    bkarow: '\u290D',
                    blacklozenge: '\u29EB',
                    blacksquare: '\u25AA',
                    blacktriangle: '\u25B4',
                    blacktriangledown: '\u25BE',
                    blacktriangleleft: '\u25C2',
                    blacktriangleright: '\u25B8',
                    blank: '\u2423',
                    blk12: '\u2592',
                    blk14: '\u2591',
                    blk34: '\u2593',
                    block: '\u2588',
                    bne: '\u003D\u20E5',
                    bnequiv: '\u2261\u20E5',
                    bNot: '\u2AED',
                    bnot: '\u2310',
                    Bopf: '\uD835\uDD39',
                    bopf: '\uD835\uDD53',
                    bot: '\u22A5',
                    bottom: '\u22A5',
                    bowtie: '\u22C8',
                    boxbox: '\u29C9',
                    boxDL: '\u2557',
                    boxDl: '\u2556',
                    boxdL: '\u2555',
                    boxdl: '\u2510',
                    boxDR: '\u2554',
                    boxDr: '\u2553',
                    boxdR: '\u2552',
                    boxdr: '\u250C',
                    boxH: '\u2550',
                    boxh: '\u2500',
                    boxHD: '\u2566',
                    boxHd: '\u2564',
                    boxhD: '\u2565',
                    boxhd: '\u252C',
                    boxHU: '\u2569',
                    boxHu: '\u2567',
                    boxhU: '\u2568',
                    boxhu: '\u2534',
                    boxminus: '\u229F',
                    boxplus: '\u229E',
                    boxtimes: '\u22A0',
                    boxUL: '\u255D',
                    boxUl: '\u255C',
                    boxuL: '\u255B',
                    boxul: '\u2518',
                    boxUR: '\u255A',
                    boxUr: '\u2559',
                    boxuR: '\u2558',
                    boxur: '\u2514',
                    boxV: '\u2551',
                    boxv: '\u2502',
                    boxVH: '\u256C',
                    boxVh: '\u256B',
                    boxvH: '\u256A',
                    boxvh: '\u253C',
                    boxVL: '\u2563',
                    boxVl: '\u2562',
                    boxvL: '\u2561',
                    boxvl: '\u2524',
                    boxVR: '\u2560',
                    boxVr: '\u255F',
                    boxvR: '\u255E',
                    boxvr: '\u251C',
                    bprime: '\u2035',
                    Breve: '\u02D8',
                    breve: '\u02D8',
                    brvbar: '\u00A6',
                    Bscr: '\u212C',
                    bscr: '\uD835\uDCB7',
                    bsemi: '\u204F',
                    bsim: '\u223D',
                    bsime: '\u22CD',
                    bsol: '\u005C',
                    bsolb: '\u29C5',
                    bsolhsub: '\u27C8',
                    bull: '\u2022',
                    bullet: '\u2022',
                    bump: '\u224E',
                    bumpE: '\u2AAE',
                    bumpe: '\u224F',
                    Bumpeq: '\u224E',
                    bumpeq: '\u224F',
                    Cacute: '\u0106',
                    cacute: '\u0107',
                    Cap: '\u22D2',
                    cap: '\u2229',
                    capand: '\u2A44',
                    capbrcup: '\u2A49',
                    capcap: '\u2A4B',
                    capcup: '\u2A47',
                    capdot: '\u2A40',
                    CapitalDifferentialD: '\u2145',
                    caps: '\u2229\uFE00',
                    caret: '\u2041',
                    caron: '\u02C7',
                    Cayleys: '\u212D',
                    ccaps: '\u2A4D',
                    Ccaron: '\u010C',
                    ccaron: '\u010D',
                    Ccedil: '\u00C7',
                    ccedil: '\u00E7',
                    Ccirc: '\u0108',
                    ccirc: '\u0109',
                    Cconint: '\u2230',
                    ccups: '\u2A4C',
                    ccupssm: '\u2A50',
                    Cdot: '\u010A',
                    cdot: '\u010B',
                    cedil: '\u00B8',
                    Cedilla: '\u00B8',
                    cemptyv: '\u29B2',
                    cent: '\u00A2',
                    CenterDot: '\u00B7',
                    centerdot: '\u00B7',
                    Cfr: '\u212D',
                    cfr: '\uD835\uDD20',
                    CHcy: '\u0427',
                    chcy: '\u0447',
                    check: '\u2713',
                    checkmark: '\u2713',
                    Chi: '\u03A7',
                    chi: '\u03C7',
                    cir: '\u25CB',
                    circ: '\u02C6',
                    circeq: '\u2257',
                    circlearrowleft: '\u21BA',
                    circlearrowright: '\u21BB',
                    circledast: '\u229B',
                    circledcirc: '\u229A',
                    circleddash: '\u229D',
                    CircleDot: '\u2299',
                    circledR: '\u00AE',
                    circledS: '\u24C8',
                    CircleMinus: '\u2296',
                    CirclePlus: '\u2295',
                    CircleTimes: '\u2297',
                    cirE: '\u29C3',
                    cire: '\u2257',
                    cirfnint: '\u2A10',
                    cirmid: '\u2AEF',
                    cirscir: '\u29C2',
                    ClockwiseContourIntegral: '\u2232',
                    CloseCurlyDoubleQuote: '\u201D',
                    CloseCurlyQuote: '\u2019',
                    clubs: '\u2663',
                    clubsuit: '\u2663',
                    Colon: '\u2237',
                    colon: '\u003A',
                    Colone: '\u2A74',
                    colone: '\u2254',
                    coloneq: '\u2254',
                    comma: '\u002C',
                    commat: '\u0040',
                    comp: '\u2201',
                    compfn: '\u2218',
                    complement: '\u2201',
                    complexes: '\u2102',
                    cong: '\u2245',
                    congdot: '\u2A6D',
                    Congruent: '\u2261',
                    Conint: '\u222F',
                    conint: '\u222E',
                    ContourIntegral: '\u222E',
                    Copf: '\u2102',
                    copf: '\uD835\uDD54',
                    coprod: '\u2210',
                    Coproduct: '\u2210',
                    COPY: '\u00A9',
                    copy: '\u00A9',
                    copysr: '\u2117',
                    CounterClockwiseContourIntegral: '\u2233',
                    crarr: '\u21B5',
                    Cross: '\u2A2F',
                    cross: '\u2717',
                    Cscr: '\uD835\uDC9E',
                    cscr: '\uD835\uDCB8',
                    csub: '\u2ACF',
                    csube: '\u2AD1',
                    csup: '\u2AD0',
                    csupe: '\u2AD2',
                    ctdot: '\u22EF',
                    cudarrl: '\u2938',
                    cudarrr: '\u2935',
                    cuepr: '\u22DE',
                    cuesc: '\u22DF',
                    cularr: '\u21B6',
                    cularrp: '\u293D',
                    Cup: '\u22D3',
                    cup: '\u222A',
                    cupbrcap: '\u2A48',
                    CupCap: '\u224D',
                    cupcap: '\u2A46',
                    cupcup: '\u2A4A',
                    cupdot: '\u228D',
                    cupor: '\u2A45',
                    cups: '\u222A\uFE00',
                    curarr: '\u21B7',
                    curarrm: '\u293C',
                    curlyeqprec: '\u22DE',
                    curlyeqsucc: '\u22DF',
                    curlyvee: '\u22CE',
                    curlywedge: '\u22CF',
                    curren: '\u00A4',
                    curvearrowleft: '\u21B6',
                    curvearrowright: '\u21B7',
                    cuvee: '\u22CE',
                    cuwed: '\u22CF',
                    cwconint: '\u2232',
                    cwint: '\u2231',
                    cylcty: '\u232D',
                    Dagger: '\u2021',
                    dagger: '\u2020',
                    daleth: '\u2138',
                    Darr: '\u21A1',
                    dArr: '\u21D3',
                    darr: '\u2193',
                    dash: '\u2010',
                    Dashv: '\u2AE4',
                    dashv: '\u22A3',
                    dbkarow: '\u290F',
                    dblac: '\u02DD',
                    Dcaron: '\u010E',
                    dcaron: '\u010F',
                    Dcy: '\u0414',
                    dcy: '\u0434',
                    DD: '\u2145',
                    dd: '\u2146',
                    ddagger: '\u2021',
                    ddarr: '\u21CA',
                    DDotrahd: '\u2911',
                    ddotseq: '\u2A77',
                    deg: '\u00B0',
                    Del: '\u2207',
                    Delta: '\u0394',
                    delta: '\u03B4',
                    demptyv: '\u29B1',
                    dfisht: '\u297F',
                    Dfr: '\uD835\uDD07',
                    dfr: '\uD835\uDD21',
                    dHar: '\u2965',
                    dharl: '\u21C3',
                    dharr: '\u21C2',
                    DiacriticalAcute: '\u00B4',
                    DiacriticalDot: '\u02D9',
                    DiacriticalDoubleAcute: '\u02DD',
                    DiacriticalGrave: '\u0060',
                    DiacriticalTilde: '\u02DC',
                    diam: '\u22C4',
                    Diamond: '\u22C4',
                    diamond: '\u22C4',
                    diamondsuit: '\u2666',
                    diams: '\u2666',
                    die: '\u00A8',
                    DifferentialD: '\u2146',
                    digamma: '\u03DD',
                    disin: '\u22F2',
                    div: '\u00F7',
                    divide: '\u00F7',
                    divideontimes: '\u22C7',
                    divonx: '\u22C7',
                    DJcy: '\u0402',
                    djcy: '\u0452',
                    dlcorn: '\u231E',
                    dlcrop: '\u230D',
                    dollar: '\u0024',
                    Dopf: '\uD835\uDD3B',
                    dopf: '\uD835\uDD55',
                    Dot: '\u00A8',
                    dot: '\u02D9',
                    DotDot: '\u20DC',
                    doteq: '\u2250',
                    doteqdot: '\u2251',
                    DotEqual: '\u2250',
                    dotminus: '\u2238',
                    dotplus: '\u2214',
                    dotsquare: '\u22A1',
                    doublebarwedge: '\u2306',
                    DoubleContourIntegral: '\u222F',
                    DoubleDot: '\u00A8',
                    DoubleDownArrow: '\u21D3',
                    DoubleLeftArrow: '\u21D0',
                    DoubleLeftRightArrow: '\u21D4',
                    DoubleLeftTee: '\u2AE4',
                    DoubleLongLeftArrow: '\u27F8',
                    DoubleLongLeftRightArrow: '\u27FA',
                    DoubleLongRightArrow: '\u27F9',
                    DoubleRightArrow: '\u21D2',
                    DoubleRightTee: '\u22A8',
                    DoubleUpArrow: '\u21D1',
                    DoubleUpDownArrow: '\u21D5',
                    DoubleVerticalBar: '\u2225',
                    DownArrow: '\u2193',
                    Downarrow: '\u21D3',
                    downarrow: '\u2193',
                    DownArrowBar: '\u2913',
                    DownArrowUpArrow: '\u21F5',
                    DownBreve: '\u0311',
                    downdownarrows: '\u21CA',
                    downharpoonleft: '\u21C3',
                    downharpoonright: '\u21C2',
                    DownLeftRightVector: '\u2950',
                    DownLeftTeeVector: '\u295E',
                    DownLeftVector: '\u21BD',
                    DownLeftVectorBar: '\u2956',
                    DownRightTeeVector: '\u295F',
                    DownRightVector: '\u21C1',
                    DownRightVectorBar: '\u2957',
                    DownTee: '\u22A4',
                    DownTeeArrow: '\u21A7',
                    drbkarow: '\u2910',
                    drcorn: '\u231F',
                    drcrop: '\u230C',
                    Dscr: '\uD835\uDC9F',
                    dscr: '\uD835\uDCB9',
                    DScy: '\u0405',
                    dscy: '\u0455',
                    dsol: '\u29F6',
                    Dstrok: '\u0110',
                    dstrok: '\u0111',
                    dtdot: '\u22F1',
                    dtri: '\u25BF',
                    dtrif: '\u25BE',
                    duarr: '\u21F5',
                    duhar: '\u296F',
                    dwangle: '\u29A6',
                    DZcy: '\u040F',
                    dzcy: '\u045F',
                    dzigrarr: '\u27FF',
                    Eacute: '\u00C9',
                    eacute: '\u00E9',
                    easter: '\u2A6E',
                    Ecaron: '\u011A',
                    ecaron: '\u011B',
                    ecir: '\u2256',
                    Ecirc: '\u00CA',
                    ecirc: '\u00EA',
                    ecolon: '\u2255',
                    Ecy: '\u042D',
                    ecy: '\u044D',
                    eDDot: '\u2A77',
                    Edot: '\u0116',
                    eDot: '\u2251',
                    edot: '\u0117',
                    ee: '\u2147',
                    efDot: '\u2252',
                    Efr: '\uD835\uDD08',
                    efr: '\uD835\uDD22',
                    eg: '\u2A9A',
                    Egrave: '\u00C8',
                    egrave: '\u00E8',
                    egs: '\u2A96',
                    egsdot: '\u2A98',
                    el: '\u2A99',
                    Element: '\u2208',
                    elinters: '\u23E7',
                    ell: '\u2113',
                    els: '\u2A95',
                    elsdot: '\u2A97',
                    Emacr: '\u0112',
                    emacr: '\u0113',
                    empty: '\u2205',
                    emptyset: '\u2205',
                    EmptySmallSquare: '\u25FB',
                    emptyv: '\u2205',
                    EmptyVerySmallSquare: '\u25AB',
                    emsp: '\u2003',
                    emsp13: '\u2004',
                    emsp14: '\u2005',
                    ENG: '\u014A',
                    eng: '\u014B',
                    ensp: '\u2002',
                    Eogon: '\u0118',
                    eogon: '\u0119',
                    Eopf: '\uD835\uDD3C',
                    eopf: '\uD835\uDD56',
                    epar: '\u22D5',
                    eparsl: '\u29E3',
                    eplus: '\u2A71',
                    epsi: '\u03B5',
                    Epsilon: '\u0395',
                    epsilon: '\u03B5',
                    epsiv: '\u03F5',
                    eqcirc: '\u2256',
                    eqcolon: '\u2255',
                    eqsim: '\u2242',
                    eqslantgtr: '\u2A96',
                    eqslantless: '\u2A95',
                    Equal: '\u2A75',
                    equals: '\u003D',
                    EqualTilde: '\u2242',
                    equest: '\u225F',
                    Equilibrium: '\u21CC',
                    equiv: '\u2261',
                    equivDD: '\u2A78',
                    eqvparsl: '\u29E5',
                    erarr: '\u2971',
                    erDot: '\u2253',
                    Escr: '\u2130',
                    escr: '\u212F',
                    esdot: '\u2250',
                    Esim: '\u2A73',
                    esim: '\u2242',
                    Eta: '\u0397',
                    eta: '\u03B7',
                    ETH: '\u00D0',
                    eth: '\u00F0',
                    Euml: '\u00CB',
                    euml: '\u00EB',
                    euro: '\u20AC',
                    excl: '\u0021',
                    exist: '\u2203',
                    Exists: '\u2203',
                    expectation: '\u2130',
                    ExponentialE: '\u2147',
                    exponentiale: '\u2147',
                    fallingdotseq: '\u2252',
                    Fcy: '\u0424',
                    fcy: '\u0444',
                    female: '\u2640',
                    ffilig: '\uFB03',
                    fflig: '\uFB00',
                    ffllig: '\uFB04',
                    Ffr: '\uD835\uDD09',
                    ffr: '\uD835\uDD23',
                    filig: '\uFB01',
                    FilledSmallSquare: '\u25FC',
                    FilledVerySmallSquare: '\u25AA',
                    fjlig: '\u0066\u006A',
                    flat: '\u266D',
                    fllig: '\uFB02',
                    fltns: '\u25B1',
                    fnof: '\u0192',
                    Fopf: '\uD835\uDD3D',
                    fopf: '\uD835\uDD57',
                    ForAll: '\u2200',
                    forall: '\u2200',
                    fork: '\u22D4',
                    forkv: '\u2AD9',
                    Fouriertrf: '\u2131',
                    fpartint: '\u2A0D',
                    frac12: '\u00BD',
                    frac13: '\u2153',
                    frac14: '\u00BC',
                    frac15: '\u2155',
                    frac16: '\u2159',
                    frac18: '\u215B',
                    frac23: '\u2154',
                    frac25: '\u2156',
                    frac34: '\u00BE',
                    frac35: '\u2157',
                    frac38: '\u215C',
                    frac45: '\u2158',
                    frac56: '\u215A',
                    frac58: '\u215D',
                    frac78: '\u215E',
                    frasl: '\u2044',
                    frown: '\u2322',
                    Fscr: '\u2131',
                    fscr: '\uD835\uDCBB',
                    gacute: '\u01F5',
                    Gamma: '\u0393',
                    gamma: '\u03B3',
                    Gammad: '\u03DC',
                    gammad: '\u03DD',
                    gap: '\u2A86',
                    Gbreve: '\u011E',
                    gbreve: '\u011F',
                    Gcedil: '\u0122',
                    Gcirc: '\u011C',
                    gcirc: '\u011D',
                    Gcy: '\u0413',
                    gcy: '\u0433',
                    Gdot: '\u0120',
                    gdot: '\u0121',
                    gE: '\u2267',
                    ge: '\u2265',
                    gEl: '\u2A8C',
                    gel: '\u22DB',
                    geq: '\u2265',
                    geqq: '\u2267',
                    geqslant: '\u2A7E',
                    ges: '\u2A7E',
                    gescc: '\u2AA9',
                    gesdot: '\u2A80',
                    gesdoto: '\u2A82',
                    gesdotol: '\u2A84',
                    gesl: '\u22DB\uFE00',
                    gesles: '\u2A94',
                    Gfr: '\uD835\uDD0A',
                    gfr: '\uD835\uDD24',
                    Gg: '\u22D9',
                    gg: '\u226B',
                    ggg: '\u22D9',
                    gimel: '\u2137',
                    GJcy: '\u0403',
                    gjcy: '\u0453',
                    gl: '\u2277',
                    gla: '\u2AA5',
                    glE: '\u2A92',
                    glj: '\u2AA4',
                    gnap: '\u2A8A',
                    gnapprox: '\u2A8A',
                    gnE: '\u2269',
                    gne: '\u2A88',
                    gneq: '\u2A88',
                    gneqq: '\u2269',
                    gnsim: '\u22E7',
                    Gopf: '\uD835\uDD3E',
                    gopf: '\uD835\uDD58',
                    grave: '\u0060',
                    GreaterEqual: '\u2265',
                    GreaterEqualLess: '\u22DB',
                    GreaterFullEqual: '\u2267',
                    GreaterGreater: '\u2AA2',
                    GreaterLess: '\u2277',
                    GreaterSlantEqual: '\u2A7E',
                    GreaterTilde: '\u2273',
                    Gscr: '\uD835\uDCA2',
                    gscr: '\u210A',
                    gsim: '\u2273',
                    gsime: '\u2A8E',
                    gsiml: '\u2A90',
                    Gt: '\u226B',
                    GT: '\u003E',
                    gt: '\u003E',
                    gtcc: '\u2AA7',
                    gtcir: '\u2A7A',
                    gtdot: '\u22D7',
                    gtlPar: '\u2995',
                    gtquest: '\u2A7C',
                    gtrapprox: '\u2A86',
                    gtrarr: '\u2978',
                    gtrdot: '\u22D7',
                    gtreqless: '\u22DB',
                    gtreqqless: '\u2A8C',
                    gtrless: '\u2277',
                    gtrsim: '\u2273',
                    gvertneqq: '\u2269\uFE00',
                    gvnE: '\u2269\uFE00',
                    Hacek: '\u02C7',
                    hairsp: '\u200A',
                    half: '\u00BD',
                    hamilt: '\u210B',
                    HARDcy: '\u042A',
                    hardcy: '\u044A',
                    hArr: '\u21D4',
                    harr: '\u2194',
                    harrcir: '\u2948',
                    harrw: '\u21AD',
                    Hat: '\u005E',
                    hbar: '\u210F',
                    Hcirc: '\u0124',
                    hcirc: '\u0125',
                    hearts: '\u2665',
                    heartsuit: '\u2665',
                    hellip: '\u2026',
                    hercon: '\u22B9',
                    Hfr: '\u210C',
                    hfr: '\uD835\uDD25',
                    HilbertSpace: '\u210B',
                    hksearow: '\u2925',
                    hkswarow: '\u2926',
                    hoarr: '\u21FF',
                    homtht: '\u223B',
                    hookleftarrow: '\u21A9',
                    hookrightarrow: '\u21AA',
                    Hopf: '\u210D',
                    hopf: '\uD835\uDD59',
                    horbar: '\u2015',
                    HorizontalLine: '\u2500',
                    Hscr: '\u210B',
                    hscr: '\uD835\uDCBD',
                    hslash: '\u210F',
                    Hstrok: '\u0126',
                    hstrok: '\u0127',
                    HumpDownHump: '\u224E',
                    HumpEqual: '\u224F',
                    hybull: '\u2043',
                    hyphen: '\u2010',
                    Iacute: '\u00CD',
                    iacute: '\u00ED',
                    ic: '\u2063',
                    Icirc: '\u00CE',
                    icirc: '\u00EE',
                    Icy: '\u0418',
                    icy: '\u0438',
                    Idot: '\u0130',
                    IEcy: '\u0415',
                    iecy: '\u0435',
                    iexcl: '\u00A1',
                    iff: '\u21D4',
                    Ifr: '\u2111',
                    ifr: '\uD835\uDD26',
                    Igrave: '\u00CC',
                    igrave: '\u00EC',
                    ii: '\u2148',
                    iiiint: '\u2A0C',
                    iiint: '\u222D',
                    iinfin: '\u29DC',
                    iiota: '\u2129',
                    IJlig: '\u0132',
                    ijlig: '\u0133',
                    Im: '\u2111',
                    Imacr: '\u012A',
                    imacr: '\u012B',
                    image: '\u2111',
                    ImaginaryI: '\u2148',
                    imagline: '\u2110',
                    imagpart: '\u2111',
                    imath: '\u0131',
                    imof: '\u22B7',
                    imped: '\u01B5',
                    Implies: '\u21D2',
                    in: '\u2208',
                    incare: '\u2105',
                    infin: '\u221E',
                    infintie: '\u29DD',
                    inodot: '\u0131',
                    Int: '\u222C',
                    int: '\u222B',
                    intcal: '\u22BA',
                    integers: '\u2124',
                    Integral: '\u222B',
                    intercal: '\u22BA',
                    Intersection: '\u22C2',
                    intlarhk: '\u2A17',
                    intprod: '\u2A3C',
                    InvisibleComma: '\u2063',
                    InvisibleTimes: '\u2062',
                    IOcy: '\u0401',
                    iocy: '\u0451',
                    Iogon: '\u012E',
                    iogon: '\u012F',
                    Iopf: '\uD835\uDD40',
                    iopf: '\uD835\uDD5A',
                    Iota: '\u0399',
                    iota: '\u03B9',
                    iprod: '\u2A3C',
                    iquest: '\u00BF',
                    Iscr: '\u2110',
                    iscr: '\uD835\uDCBE',
                    isin: '\u2208',
                    isindot: '\u22F5',
                    isinE: '\u22F9',
                    isins: '\u22F4',
                    isinsv: '\u22F3',
                    isinv: '\u2208',
                    it: '\u2062',
                    Itilde: '\u0128',
                    itilde: '\u0129',
                    Iukcy: '\u0406',
                    iukcy: '\u0456',
                    Iuml: '\u00CF',
                    iuml: '\u00EF',
                    Jcirc: '\u0134',
                    jcirc: '\u0135',
                    Jcy: '\u0419',
                    jcy: '\u0439',
                    Jfr: '\uD835\uDD0D',
                    jfr: '\uD835\uDD27',
                    jmath: '\u0237',
                    Jopf: '\uD835\uDD41',
                    jopf: '\uD835\uDD5B',
                    Jscr: '\uD835\uDCA5',
                    jscr: '\uD835\uDCBF',
                    Jsercy: '\u0408',
                    jsercy: '\u0458',
                    Jukcy: '\u0404',
                    jukcy: '\u0454',
                    Kappa: '\u039A',
                    kappa: '\u03BA',
                    kappav: '\u03F0',
                    Kcedil: '\u0136',
                    kcedil: '\u0137',
                    Kcy: '\u041A',
                    kcy: '\u043A',
                    Kfr: '\uD835\uDD0E',
                    kfr: '\uD835\uDD28',
                    kgreen: '\u0138',
                    KHcy: '\u0425',
                    khcy: '\u0445',
                    KJcy: '\u040C',
                    kjcy: '\u045C',
                    Kopf: '\uD835\uDD42',
                    kopf: '\uD835\uDD5C',
                    Kscr: '\uD835\uDCA6',
                    kscr: '\uD835\uDCC0',
                    lAarr: '\u21DA',
                    Lacute: '\u0139',
                    lacute: '\u013A',
                    laemptyv: '\u29B4',
                    lagran: '\u2112',
                    Lambda: '\u039B',
                    lambda: '\u03BB',
                    Lang: '\u27EA',
                    lang: '\u27E8',
                    langd: '\u2991',
                    langle: '\u27E8',
                    lap: '\u2A85',
                    Laplacetrf: '\u2112',
                    laquo: '\u00AB',
                    Larr: '\u219E',
                    lArr: '\u21D0',
                    larr: '\u2190',
                    larrb: '\u21E4',
                    larrbfs: '\u291F',
                    larrfs: '\u291D',
                    larrhk: '\u21A9',
                    larrlp: '\u21AB',
                    larrpl: '\u2939',
                    larrsim: '\u2973',
                    larrtl: '\u21A2',
                    lat: '\u2AAB',
                    lAtail: '\u291B',
                    latail: '\u2919',
                    late: '\u2AAD',
                    lates: '\u2AAD\uFE00',
                    lBarr: '\u290E',
                    lbarr: '\u290C',
                    lbbrk: '\u2772',
                    lbrace: '\u007B',
                    lbrack: '\u005B',
                    lbrke: '\u298B',
                    lbrksld: '\u298F',
                    lbrkslu: '\u298D',
                    Lcaron: '\u013D',
                    lcaron: '\u013E',
                    Lcedil: '\u013B',
                    lcedil: '\u013C',
                    lceil: '\u2308',
                    lcub: '\u007B',
                    Lcy: '\u041B',
                    lcy: '\u043B',
                    ldca: '\u2936',
                    ldquo: '\u201C',
                    ldquor: '\u201E',
                    ldrdhar: '\u2967',
                    ldrushar: '\u294B',
                    ldsh: '\u21B2',
                    lE: '\u2266',
                    le: '\u2264',
                    LeftAngleBracket: '\u27E8',
                    LeftArrow: '\u2190',
                    Leftarrow: '\u21D0',
                    leftarrow: '\u2190',
                    LeftArrowBar: '\u21E4',
                    LeftArrowRightArrow: '\u21C6',
                    leftarrowtail: '\u21A2',
                    LeftCeiling: '\u2308',
                    LeftDoubleBracket: '\u27E6',
                    LeftDownTeeVector: '\u2961',
                    LeftDownVector: '\u21C3',
                    LeftDownVectorBar: '\u2959',
                    LeftFloor: '\u230A',
                    leftharpoondown: '\u21BD',
                    leftharpoonup: '\u21BC',
                    leftleftarrows: '\u21C7',
                    LeftRightArrow: '\u2194',
                    Leftrightarrow: '\u21D4',
                    leftrightarrow: '\u2194',
                    leftrightarrows: '\u21C6',
                    leftrightharpoons: '\u21CB',
                    leftrightsquigarrow: '\u21AD',
                    LeftRightVector: '\u294E',
                    LeftTee: '\u22A3',
                    LeftTeeArrow: '\u21A4',
                    LeftTeeVector: '\u295A',
                    leftthreetimes: '\u22CB',
                    LeftTriangle: '\u22B2',
                    LeftTriangleBar: '\u29CF',
                    LeftTriangleEqual: '\u22B4',
                    LeftUpDownVector: '\u2951',
                    LeftUpTeeVector: '\u2960',
                    LeftUpVector: '\u21BF',
                    LeftUpVectorBar: '\u2958',
                    LeftVector: '\u21BC',
                    LeftVectorBar: '\u2952',
                    lEg: '\u2A8B',
                    leg: '\u22DA',
                    leq: '\u2264',
                    leqq: '\u2266',
                    leqslant: '\u2A7D',
                    les: '\u2A7D',
                    lescc: '\u2AA8',
                    lesdot: '\u2A7F',
                    lesdoto: '\u2A81',
                    lesdotor: '\u2A83',
                    lesg: '\u22DA\uFE00',
                    lesges: '\u2A93',
                    lessapprox: '\u2A85',
                    lessdot: '\u22D6',
                    lesseqgtr: '\u22DA',
                    lesseqqgtr: '\u2A8B',
                    LessEqualGreater: '\u22DA',
                    LessFullEqual: '\u2266',
                    LessGreater: '\u2276',
                    lessgtr: '\u2276',
                    LessLess: '\u2AA1',
                    lesssim: '\u2272',
                    LessSlantEqual: '\u2A7D',
                    LessTilde: '\u2272',
                    lfisht: '\u297C',
                    lfloor: '\u230A',
                    Lfr: '\uD835\uDD0F',
                    lfr: '\uD835\uDD29',
                    lg: '\u2276',
                    lgE: '\u2A91',
                    lHar: '\u2962',
                    lhard: '\u21BD',
                    lharu: '\u21BC',
                    lharul: '\u296A',
                    lhblk: '\u2584',
                    LJcy: '\u0409',
                    ljcy: '\u0459',
                    Ll: '\u22D8',
                    ll: '\u226A',
                    llarr: '\u21C7',
                    llcorner: '\u231E',
                    Lleftarrow: '\u21DA',
                    llhard: '\u296B',
                    lltri: '\u25FA',
                    Lmidot: '\u013F',
                    lmidot: '\u0140',
                    lmoust: '\u23B0',
                    lmoustache: '\u23B0',
                    lnap: '\u2A89',
                    lnapprox: '\u2A89',
                    lnE: '\u2268',
                    lne: '\u2A87',
                    lneq: '\u2A87',
                    lneqq: '\u2268',
                    lnsim: '\u22E6',
                    loang: '\u27EC',
                    loarr: '\u21FD',
                    lobrk: '\u27E6',
                    LongLeftArrow: '\u27F5',
                    Longleftarrow: '\u27F8',
                    longleftarrow: '\u27F5',
                    LongLeftRightArrow: '\u27F7',
                    Longleftrightarrow: '\u27FA',
                    longleftrightarrow: '\u27F7',
                    longmapsto: '\u27FC',
                    LongRightArrow: '\u27F6',
                    Longrightarrow: '\u27F9',
                    longrightarrow: '\u27F6',
                    looparrowleft: '\u21AB',
                    looparrowright: '\u21AC',
                    lopar: '\u2985',
                    Lopf: '\uD835\uDD43',
                    lopf: '\uD835\uDD5D',
                    loplus: '\u2A2D',
                    lotimes: '\u2A34',
                    lowast: '\u2217',
                    lowbar: '\u005F',
                    LowerLeftArrow: '\u2199',
                    LowerRightArrow: '\u2198',
                    loz: '\u25CA',
                    lozenge: '\u25CA',
                    lozf: '\u29EB',
                    lpar: '\u0028',
                    lparlt: '\u2993',
                    lrarr: '\u21C6',
                    lrcorner: '\u231F',
                    lrhar: '\u21CB',
                    lrhard: '\u296D',
                    lrm: '\u200E',
                    lrtri: '\u22BF',
                    lsaquo: '\u2039',
                    Lscr: '\u2112',
                    lscr: '\uD835\uDCC1',
                    Lsh: '\u21B0',
                    lsh: '\u21B0',
                    lsim: '\u2272',
                    lsime: '\u2A8D',
                    lsimg: '\u2A8F',
                    lsqb: '\u005B',
                    lsquo: '\u2018',
                    lsquor: '\u201A',
                    Lstrok: '\u0141',
                    lstrok: '\u0142',
                    Lt: '\u226A',
                    LT: '\u003C',
                    lt: '\u003C',
                    ltcc: '\u2AA6',
                    ltcir: '\u2A79',
                    ltdot: '\u22D6',
                    lthree: '\u22CB',
                    ltimes: '\u22C9',
                    ltlarr: '\u2976',
                    ltquest: '\u2A7B',
                    ltri: '\u25C3',
                    ltrie: '\u22B4',
                    ltrif: '\u25C2',
                    ltrPar: '\u2996',
                    lurdshar: '\u294A',
                    luruhar: '\u2966',
                    lvertneqq: '\u2268\uFE00',
                    lvnE: '\u2268\uFE00',
                    macr: '\u00AF',
                    male: '\u2642',
                    malt: '\u2720',
                    maltese: '\u2720',
                    Map: '\u2905',
                    map: '\u21A6',
                    mapsto: '\u21A6',
                    mapstodown: '\u21A7',
                    mapstoleft: '\u21A4',
                    mapstoup: '\u21A5',
                    marker: '\u25AE',
                    mcomma: '\u2A29',
                    Mcy: '\u041C',
                    mcy: '\u043C',
                    mdash: '\u2014',
                    mDDot: '\u223A',
                    measuredangle: '\u2221',
                    MediumSpace: '\u205F',
                    Mellintrf: '\u2133',
                    Mfr: '\uD835\uDD10',
                    mfr: '\uD835\uDD2A',
                    mho: '\u2127',
                    micro: '\u00B5',
                    mid: '\u2223',
                    midast: '\u002A',
                    midcir: '\u2AF0',
                    middot: '\u00B7',
                    minus: '\u2212',
                    minusb: '\u229F',
                    minusd: '\u2238',
                    minusdu: '\u2A2A',
                    MinusPlus: '\u2213',
                    mlcp: '\u2ADB',
                    mldr: '\u2026',
                    mnplus: '\u2213',
                    models: '\u22A7',
                    Mopf: '\uD835\uDD44',
                    mopf: '\uD835\uDD5E',
                    mp: '\u2213',
                    Mscr: '\u2133',
                    mscr: '\uD835\uDCC2',
                    mstpos: '\u223E',
                    Mu: '\u039C',
                    mu: '\u03BC',
                    multimap: '\u22B8',
                    mumap: '\u22B8',
                    nabla: '\u2207',
                    Nacute: '\u0143',
                    nacute: '\u0144',
                    nang: '\u2220\u20D2',
                    nap: '\u2249',
                    napE: '\u2A70\u0338',
                    napid: '\u224B\u0338',
                    napos: '\u0149',
                    napprox: '\u2249',
                    natur: '\u266E',
                    natural: '\u266E',
                    naturals: '\u2115',
                    nbsp: '\u00A0',
                    nbump: '\u224E\u0338',
                    nbumpe: '\u224F\u0338',
                    ncap: '\u2A43',
                    Ncaron: '\u0147',
                    ncaron: '\u0148',
                    Ncedil: '\u0145',
                    ncedil: '\u0146',
                    ncong: '\u2247',
                    ncongdot: '\u2A6D\u0338',
                    ncup: '\u2A42',
                    Ncy: '\u041D',
                    ncy: '\u043D',
                    ndash: '\u2013',
                    ne: '\u2260',
                    nearhk: '\u2924',
                    neArr: '\u21D7',
                    nearr: '\u2197',
                    nearrow: '\u2197',
                    nedot: '\u2250\u0338',
                    NegativeMediumSpace: '\u200B',
                    NegativeThickSpace: '\u200B',
                    NegativeThinSpace: '\u200B',
                    NegativeVeryThinSpace: '\u200B',
                    nequiv: '\u2262',
                    nesear: '\u2928',
                    nesim: '\u2242\u0338',
                    NestedGreaterGreater: '\u226B',
                    NestedLessLess: '\u226A',
                    NewLine: '\u000A',
                    nexist: '\u2204',
                    nexists: '\u2204',
                    Nfr: '\uD835\uDD11',
                    nfr: '\uD835\uDD2B',
                    ngE: '\u2267\u0338',
                    nge: '\u2271',
                    ngeq: '\u2271',
                    ngeqq: '\u2267\u0338',
                    ngeqslant: '\u2A7E\u0338',
                    nges: '\u2A7E\u0338',
                    nGg: '\u22D9\u0338',
                    ngsim: '\u2275',
                    nGt: '\u226B\u20D2',
                    ngt: '\u226F',
                    ngtr: '\u226F',
                    nGtv: '\u226B\u0338',
                    nhArr: '\u21CE',
                    nharr: '\u21AE',
                    nhpar: '\u2AF2',
                    ni: '\u220B',
                    nis: '\u22FC',
                    nisd: '\u22FA',
                    niv: '\u220B',
                    NJcy: '\u040A',
                    njcy: '\u045A',
                    nlArr: '\u21CD',
                    nlarr: '\u219A',
                    nldr: '\u2025',
                    nlE: '\u2266\u0338',
                    nle: '\u2270',
                    nLeftarrow: '\u21CD',
                    nleftarrow: '\u219A',
                    nLeftrightarrow: '\u21CE',
                    nleftrightarrow: '\u21AE',
                    nleq: '\u2270',
                    nleqq: '\u2266\u0338',
                    nleqslant: '\u2A7D\u0338',
                    nles: '\u2A7D\u0338',
                    nless: '\u226E',
                    nLl: '\u22D8\u0338',
                    nlsim: '\u2274',
                    nLt: '\u226A\u20D2',
                    nlt: '\u226E',
                    nltri: '\u22EA',
                    nltrie: '\u22EC',
                    nLtv: '\u226A\u0338',
                    nmid: '\u2224',
                    NoBreak: '\u2060',
                    NonBreakingSpace: '\u00A0',
                    Nopf: '\u2115',
                    nopf: '\uD835\uDD5F',
                    Not: '\u2AEC',
                    not: '\u00AC',
                    NotCongruent: '\u2262',
                    NotCupCap: '\u226D',
                    NotDoubleVerticalBar: '\u2226',
                    NotElement: '\u2209',
                    NotEqual: '\u2260',
                    NotEqualTilde: '\u2242\u0338',
                    NotExists: '\u2204',
                    NotGreater: '\u226F',
                    NotGreaterEqual: '\u2271',
                    NotGreaterFullEqual: '\u2267\u0338',
                    NotGreaterGreater: '\u226B\u0338',
                    NotGreaterLess: '\u2279',
                    NotGreaterSlantEqual: '\u2A7E\u0338',
                    NotGreaterTilde: '\u2275',
                    NotHumpDownHump: '\u224E\u0338',
                    NotHumpEqual: '\u224F\u0338',
                    notin: '\u2209',
                    notindot: '\u22F5\u0338',
                    notinE: '\u22F9\u0338',
                    notinva: '\u2209',
                    notinvb: '\u22F7',
                    notinvc: '\u22F6',
                    NotLeftTriangle: '\u22EA',
                    NotLeftTriangleBar: '\u29CF\u0338',
                    NotLeftTriangleEqual: '\u22EC',
                    NotLess: '\u226E',
                    NotLessEqual: '\u2270',
                    NotLessGreater: '\u2278',
                    NotLessLess: '\u226A\u0338',
                    NotLessSlantEqual: '\u2A7D\u0338',
                    NotLessTilde: '\u2274',
                    NotNestedGreaterGreater: '\u2AA2\u0338',
                    NotNestedLessLess: '\u2AA1\u0338',
                    notni: '\u220C',
                    notniva: '\u220C',
                    notnivb: '\u22FE',
                    notnivc: '\u22FD',
                    NotPrecedes: '\u2280',
                    NotPrecedesEqual: '\u2AAF\u0338',
                    NotPrecedesSlantEqual: '\u22E0',
                    NotReverseElement: '\u220C',
                    NotRightTriangle: '\u22EB',
                    NotRightTriangleBar: '\u29D0\u0338',
                    NotRightTriangleEqual: '\u22ED',
                    NotSquareSubset: '\u228F\u0338',
                    NotSquareSubsetEqual: '\u22E2',
                    NotSquareSuperset: '\u2290\u0338',
                    NotSquareSupersetEqual: '\u22E3',
                    NotSubset: '\u2282\u20D2',
                    NotSubsetEqual: '\u2288',
                    NotSucceeds: '\u2281',
                    NotSucceedsEqual: '\u2AB0\u0338',
                    NotSucceedsSlantEqual: '\u22E1',
                    NotSucceedsTilde: '\u227F\u0338',
                    NotSuperset: '\u2283\u20D2',
                    NotSupersetEqual: '\u2289',
                    NotTilde: '\u2241',
                    NotTildeEqual: '\u2244',
                    NotTildeFullEqual: '\u2247',
                    NotTildeTilde: '\u2249',
                    NotVerticalBar: '\u2224',
                    npar: '\u2226',
                    nparallel: '\u2226',
                    nparsl: '\u2AFD\u20E5',
                    npart: '\u2202\u0338',
                    npolint: '\u2A14',
                    npr: '\u2280',
                    nprcue: '\u22E0',
                    npre: '\u2AAF\u0338',
                    nprec: '\u2280',
                    npreceq: '\u2AAF\u0338',
                    nrArr: '\u21CF',
                    nrarr: '\u219B',
                    nrarrc: '\u2933\u0338',
                    nrarrw: '\u219D\u0338',
                    nRightarrow: '\u21CF',
                    nrightarrow: '\u219B',
                    nrtri: '\u22EB',
                    nrtrie: '\u22ED',
                    nsc: '\u2281',
                    nsccue: '\u22E1',
                    nsce: '\u2AB0\u0338',
                    Nscr: '\uD835\uDCA9',
                    nscr: '\uD835\uDCC3',
                    nshortmid: '\u2224',
                    nshortparallel: '\u2226',
                    nsim: '\u2241',
                    nsime: '\u2244',
                    nsimeq: '\u2244',
                    nsmid: '\u2224',
                    nspar: '\u2226',
                    nsqsube: '\u22E2',
                    nsqsupe: '\u22E3',
                    nsub: '\u2284',
                    nsubE: '\u2AC5\u0338',
                    nsube: '\u2288',
                    nsubset: '\u2282\u20D2',
                    nsubseteq: '\u2288',
                    nsubseteqq: '\u2AC5\u0338',
                    nsucc: '\u2281',
                    nsucceq: '\u2AB0\u0338',
                    nsup: '\u2285',
                    nsupE: '\u2AC6\u0338',
                    nsupe: '\u2289',
                    nsupset: '\u2283\u20D2',
                    nsupseteq: '\u2289',
                    nsupseteqq: '\u2AC6\u0338',
                    ntgl: '\u2279',
                    Ntilde: '\u00D1',
                    ntilde: '\u00F1',
                    ntlg: '\u2278',
                    ntriangleleft: '\u22EA',
                    ntrianglelefteq: '\u22EC',
                    ntriangleright: '\u22EB',
                    ntrianglerighteq: '\u22ED',
                    Nu: '\u039D',
                    nu: '\u03BD',
                    num: '\u0023',
                    numero: '\u2116',
                    numsp: '\u2007',
                    nvap: '\u224D\u20D2',
                    nVDash: '\u22AF',
                    nVdash: '\u22AE',
                    nvDash: '\u22AD',
                    nvdash: '\u22AC',
                    nvge: '\u2265\u20D2',
                    nvgt: '\u003E\u20D2',
                    nvHarr: '\u2904',
                    nvinfin: '\u29DE',
                    nvlArr: '\u2902',
                    nvle: '\u2264\u20D2',
                    nvlt: '\u003C\u20D2',
                    nvltrie: '\u22B4\u20D2',
                    nvrArr: '\u2903',
                    nvrtrie: '\u22B5\u20D2',
                    nvsim: '\u223C\u20D2',
                    nwarhk: '\u2923',
                    nwArr: '\u21D6',
                    nwarr: '\u2196',
                    nwarrow: '\u2196',
                    nwnear: '\u2927',
                    Oacute: '\u00D3',
                    oacute: '\u00F3',
                    oast: '\u229B',
                    ocir: '\u229A',
                    Ocirc: '\u00D4',
                    ocirc: '\u00F4',
                    Ocy: '\u041E',
                    ocy: '\u043E',
                    odash: '\u229D',
                    Odblac: '\u0150',
                    odblac: '\u0151',
                    odiv: '\u2A38',
                    odot: '\u2299',
                    odsold: '\u29BC',
                    OElig: '\u0152',
                    oelig: '\u0153',
                    ofcir: '\u29BF',
                    Ofr: '\uD835\uDD12',
                    ofr: '\uD835\uDD2C',
                    ogon: '\u02DB',
                    Ograve: '\u00D2',
                    ograve: '\u00F2',
                    ogt: '\u29C1',
                    ohbar: '\u29B5',
                    ohm: '\u03A9',
                    oint: '\u222E',
                    olarr: '\u21BA',
                    olcir: '\u29BE',
                    olcross: '\u29BB',
                    oline: '\u203E',
                    olt: '\u29C0',
                    Omacr: '\u014C',
                    omacr: '\u014D',
                    Omega: '\u03A9',
                    omega: '\u03C9',
                    Omicron: '\u039F',
                    omicron: '\u03BF',
                    omid: '\u29B6',
                    ominus: '\u2296',
                    Oopf: '\uD835\uDD46',
                    oopf: '\uD835\uDD60',
                    opar: '\u29B7',
                    OpenCurlyDoubleQuote: '\u201C',
                    OpenCurlyQuote: '\u2018',
                    operp: '\u29B9',
                    oplus: '\u2295',
                    Or: '\u2A54',
                    or: '\u2228',
                    orarr: '\u21BB',
                    ord: '\u2A5D',
                    order: '\u2134',
                    orderof: '\u2134',
                    ordf: '\u00AA',
                    ordm: '\u00BA',
                    origof: '\u22B6',
                    oror: '\u2A56',
                    orslope: '\u2A57',
                    orv: '\u2A5B',
                    oS: '\u24C8',
                    Oscr: '\uD835\uDCAA',
                    oscr: '\u2134',
                    Oslash: '\u00D8',
                    oslash: '\u00F8',
                    osol: '\u2298',
                    Otilde: '\u00D5',
                    otilde: '\u00F5',
                    Otimes: '\u2A37',
                    otimes: '\u2297',
                    otimesas: '\u2A36',
                    Ouml: '\u00D6',
                    ouml: '\u00F6',
                    ovbar: '\u233D',
                    OverBar: '\u203E',
                    OverBrace: '\u23DE',
                    OverBracket: '\u23B4',
                    OverParenthesis: '\u23DC',
                    par: '\u2225',
                    para: '\u00B6',
                    parallel: '\u2225',
                    parsim: '\u2AF3',
                    parsl: '\u2AFD',
                    part: '\u2202',
                    PartialD: '\u2202',
                    Pcy: '\u041F',
                    pcy: '\u043F',
                    percnt: '\u0025',
                    period: '\u002E',
                    permil: '\u2030',
                    perp: '\u22A5',
                    pertenk: '\u2031',
                    Pfr: '\uD835\uDD13',
                    pfr: '\uD835\uDD2D',
                    Phi: '\u03A6',
                    phi: '\u03C6',
                    phiv: '\u03D5',
                    phmmat: '\u2133',
                    phone: '\u260E',
                    Pi: '\u03A0',
                    pi: '\u03C0',
                    pitchfork: '\u22D4',
                    piv: '\u03D6',
                    planck: '\u210F',
                    planckh: '\u210E',
                    plankv: '\u210F',
                    plus: '\u002B',
                    plusacir: '\u2A23',
                    plusb: '\u229E',
                    pluscir: '\u2A22',
                    plusdo: '\u2214',
                    plusdu: '\u2A25',
                    pluse: '\u2A72',
                    PlusMinus: '\u00B1',
                    plusmn: '\u00B1',
                    plussim: '\u2A26',
                    plustwo: '\u2A27',
                    pm: '\u00B1',
                    Poincareplane: '\u210C',
                    pointint: '\u2A15',
                    Popf: '\u2119',
                    popf: '\uD835\uDD61',
                    pound: '\u00A3',
                    Pr: '\u2ABB',
                    pr: '\u227A',
                    prap: '\u2AB7',
                    prcue: '\u227C',
                    prE: '\u2AB3',
                    pre: '\u2AAF',
                    prec: '\u227A',
                    precapprox: '\u2AB7',
                    preccurlyeq: '\u227C',
                    Precedes: '\u227A',
                    PrecedesEqual: '\u2AAF',
                    PrecedesSlantEqual: '\u227C',
                    PrecedesTilde: '\u227E',
                    preceq: '\u2AAF',
                    precnapprox: '\u2AB9',
                    precneqq: '\u2AB5',
                    precnsim: '\u22E8',
                    precsim: '\u227E',
                    Prime: '\u2033',
                    prime: '\u2032',
                    primes: '\u2119',
                    prnap: '\u2AB9',
                    prnE: '\u2AB5',
                    prnsim: '\u22E8',
                    prod: '\u220F',
                    Product: '\u220F',
                    profalar: '\u232E',
                    profline: '\u2312',
                    profsurf: '\u2313',
                    prop: '\u221D',
                    Proportion: '\u2237',
                    Proportional: '\u221D',
                    propto: '\u221D',
                    prsim: '\u227E',
                    prurel: '\u22B0',
                    Pscr: '\uD835\uDCAB',
                    pscr: '\uD835\uDCC5',
                    Psi: '\u03A8',
                    psi: '\u03C8',
                    puncsp: '\u2008',
                    Qfr: '\uD835\uDD14',
                    qfr: '\uD835\uDD2E',
                    qint: '\u2A0C',
                    Qopf: '\u211A',
                    qopf: '\uD835\uDD62',
                    qprime: '\u2057',
                    Qscr: '\uD835\uDCAC',
                    qscr: '\uD835\uDCC6',
                    quaternions: '\u210D',
                    quatint: '\u2A16',
                    quest: '\u003F',
                    questeq: '\u225F',
                    QUOT: '\u0022',
                    quot: '\u0022',
                    rAarr: '\u21DB',
                    race: '\u223D\u0331',
                    Racute: '\u0154',
                    racute: '\u0155',
                    radic: '\u221A',
                    raemptyv: '\u29B3',
                    Rang: '\u27EB',
                    rang: '\u27E9',
                    rangd: '\u2992',
                    range: '\u29A5',
                    rangle: '\u27E9',
                    raquo: '\u00BB',
                    Rarr: '\u21A0',
                    rArr: '\u21D2',
                    rarr: '\u2192',
                    rarrap: '\u2975',
                    rarrb: '\u21E5',
                    rarrbfs: '\u2920',
                    rarrc: '\u2933',
                    rarrfs: '\u291E',
                    rarrhk: '\u21AA',
                    rarrlp: '\u21AC',
                    rarrpl: '\u2945',
                    rarrsim: '\u2974',
                    Rarrtl: '\u2916',
                    rarrtl: '\u21A3',
                    rarrw: '\u219D',
                    rAtail: '\u291C',
                    ratail: '\u291A',
                    ratio: '\u2236',
                    rationals: '\u211A',
                    RBarr: '\u2910',
                    rBarr: '\u290F',
                    rbarr: '\u290D',
                    rbbrk: '\u2773',
                    rbrace: '\u007D',
                    rbrack: '\u005D',
                    rbrke: '\u298C',
                    rbrksld: '\u298E',
                    rbrkslu: '\u2990',
                    Rcaron: '\u0158',
                    rcaron: '\u0159',
                    Rcedil: '\u0156',
                    rcedil: '\u0157',
                    rceil: '\u2309',
                    rcub: '\u007D',
                    Rcy: '\u0420',
                    rcy: '\u0440',
                    rdca: '\u2937',
                    rdldhar: '\u2969',
                    rdquo: '\u201D',
                    rdquor: '\u201D',
                    rdsh: '\u21B3',
                    Re: '\u211C',
                    real: '\u211C',
                    realine: '\u211B',
                    realpart: '\u211C',
                    reals: '\u211D',
                    rect: '\u25AD',
                    REG: '\u00AE',
                    reg: '\u00AE',
                    ReverseElement: '\u220B',
                    ReverseEquilibrium: '\u21CB',
                    ReverseUpEquilibrium: '\u296F',
                    rfisht: '\u297D',
                    rfloor: '\u230B',
                    Rfr: '\u211C',
                    rfr: '\uD835\uDD2F',
                    rHar: '\u2964',
                    rhard: '\u21C1',
                    rharu: '\u21C0',
                    rharul: '\u296C',
                    Rho: '\u03A1',
                    rho: '\u03C1',
                    rhov: '\u03F1',
                    RightAngleBracket: '\u27E9',
                    RightArrow: '\u2192',
                    Rightarrow: '\u21D2',
                    rightarrow: '\u2192',
                    RightArrowBar: '\u21E5',
                    RightArrowLeftArrow: '\u21C4',
                    rightarrowtail: '\u21A3',
                    RightCeiling: '\u2309',
                    RightDoubleBracket: '\u27E7',
                    RightDownTeeVector: '\u295D',
                    RightDownVector: '\u21C2',
                    RightDownVectorBar: '\u2955',
                    RightFloor: '\u230B',
                    rightharpoondown: '\u21C1',
                    rightharpoonup: '\u21C0',
                    rightleftarrows: '\u21C4',
                    rightleftharpoons: '\u21CC',
                    rightrightarrows: '\u21C9',
                    rightsquigarrow: '\u219D',
                    RightTee: '\u22A2',
                    RightTeeArrow: '\u21A6',
                    RightTeeVector: '\u295B',
                    rightthreetimes: '\u22CC',
                    RightTriangle: '\u22B3',
                    RightTriangleBar: '\u29D0',
                    RightTriangleEqual: '\u22B5',
                    RightUpDownVector: '\u294F',
                    RightUpTeeVector: '\u295C',
                    RightUpVector: '\u21BE',
                    RightUpVectorBar: '\u2954',
                    RightVector: '\u21C0',
                    RightVectorBar: '\u2953',
                    ring: '\u02DA',
                    risingdotseq: '\u2253',
                    rlarr: '\u21C4',
                    rlhar: '\u21CC',
                    rlm: '\u200F',
                    rmoust: '\u23B1',
                    rmoustache: '\u23B1',
                    rnmid: '\u2AEE',
                    roang: '\u27ED',
                    roarr: '\u21FE',
                    robrk: '\u27E7',
                    ropar: '\u2986',
                    Ropf: '\u211D',
                    ropf: '\uD835\uDD63',
                    roplus: '\u2A2E',
                    rotimes: '\u2A35',
                    RoundImplies: '\u2970',
                    rpar: '\u0029',
                    rpargt: '\u2994',
                    rppolint: '\u2A12',
                    rrarr: '\u21C9',
                    Rrightarrow: '\u21DB',
                    rsaquo: '\u203A',
                    Rscr: '\u211B',
                    rscr: '\uD835\uDCC7',
                    Rsh: '\u21B1',
                    rsh: '\u21B1',
                    rsqb: '\u005D',
                    rsquo: '\u2019',
                    rsquor: '\u2019',
                    rthree: '\u22CC',
                    rtimes: '\u22CA',
                    rtri: '\u25B9',
                    rtrie: '\u22B5',
                    rtrif: '\u25B8',
                    rtriltri: '\u29CE',
                    RuleDelayed: '\u29F4',
                    ruluhar: '\u2968',
                    rx: '\u211E',
                    Sacute: '\u015A',
                    sacute: '\u015B',
                    sbquo: '\u201A',
                    Sc: '\u2ABC',
                    sc: '\u227B',
                    scap: '\u2AB8',
                    Scaron: '\u0160',
                    scaron: '\u0161',
                    sccue: '\u227D',
                    scE: '\u2AB4',
                    sce: '\u2AB0',
                    Scedil: '\u015E',
                    scedil: '\u015F',
                    Scirc: '\u015C',
                    scirc: '\u015D',
                    scnap: '\u2ABA',
                    scnE: '\u2AB6',
                    scnsim: '\u22E9',
                    scpolint: '\u2A13',
                    scsim: '\u227F',
                    Scy: '\u0421',
                    scy: '\u0441',
                    sdot: '\u22C5',
                    sdotb: '\u22A1',
                    sdote: '\u2A66',
                    searhk: '\u2925',
                    seArr: '\u21D8',
                    searr: '\u2198',
                    searrow: '\u2198',
                    sect: '\u00A7',
                    semi: '\u003B',
                    seswar: '\u2929',
                    setminus: '\u2216',
                    setmn: '\u2216',
                    sext: '\u2736',
                    Sfr: '\uD835\uDD16',
                    sfr: '\uD835\uDD30',
                    sfrown: '\u2322',
                    sharp: '\u266F',
                    SHCHcy: '\u0429',
                    shchcy: '\u0449',
                    SHcy: '\u0428',
                    shcy: '\u0448',
                    ShortDownArrow: '\u2193',
                    ShortLeftArrow: '\u2190',
                    shortmid: '\u2223',
                    shortparallel: '\u2225',
                    ShortRightArrow: '\u2192',
                    ShortUpArrow: '\u2191',
                    shy: '\u00AD',
                    Sigma: '\u03A3',
                    sigma: '\u03C3',
                    sigmaf: '\u03C2',
                    sigmav: '\u03C2',
                    sim: '\u223C',
                    simdot: '\u2A6A',
                    sime: '\u2243',
                    simeq: '\u2243',
                    simg: '\u2A9E',
                    simgE: '\u2AA0',
                    siml: '\u2A9D',
                    simlE: '\u2A9F',
                    simne: '\u2246',
                    simplus: '\u2A24',
                    simrarr: '\u2972',
                    slarr: '\u2190',
                    SmallCircle: '\u2218',
                    smallsetminus: '\u2216',
                    smashp: '\u2A33',
                    smeparsl: '\u29E4',
                    smid: '\u2223',
                    smile: '\u2323',
                    smt: '\u2AAA',
                    smte: '\u2AAC',
                    smtes: '\u2AAC\uFE00',
                    SOFTcy: '\u042C',
                    softcy: '\u044C',
                    sol: '\u002F',
                    solb: '\u29C4',
                    solbar: '\u233F',
                    Sopf: '\uD835\uDD4A',
                    sopf: '\uD835\uDD64',
                    spades: '\u2660',
                    spadesuit: '\u2660',
                    spar: '\u2225',
                    sqcap: '\u2293',
                    sqcaps: '\u2293\uFE00',
                    sqcup: '\u2294',
                    sqcups: '\u2294\uFE00',
                    Sqrt: '\u221A',
                    sqsub: '\u228F',
                    sqsube: '\u2291',
                    sqsubset: '\u228F',
                    sqsubseteq: '\u2291',
                    sqsup: '\u2290',
                    sqsupe: '\u2292',
                    sqsupset: '\u2290',
                    sqsupseteq: '\u2292',
                    squ: '\u25A1',
                    Square: '\u25A1',
                    square: '\u25A1',
                    SquareIntersection: '\u2293',
                    SquareSubset: '\u228F',
                    SquareSubsetEqual: '\u2291',
                    SquareSuperset: '\u2290',
                    SquareSupersetEqual: '\u2292',
                    SquareUnion: '\u2294',
                    squarf: '\u25AA',
                    squf: '\u25AA',
                    srarr: '\u2192',
                    Sscr: '\uD835\uDCAE',
                    sscr: '\uD835\uDCC8',
                    ssetmn: '\u2216',
                    ssmile: '\u2323',
                    sstarf: '\u22C6',
                    Star: '\u22C6',
                    star: '\u2606',
                    starf: '\u2605',
                    straightepsilon: '\u03F5',
                    straightphi: '\u03D5',
                    strns: '\u00AF',
                    Sub: '\u22D0',
                    sub: '\u2282',
                    subdot: '\u2ABD',
                    subE: '\u2AC5',
                    sube: '\u2286',
                    subedot: '\u2AC3',
                    submult: '\u2AC1',
                    subnE: '\u2ACB',
                    subne: '\u228A',
                    subplus: '\u2ABF',
                    subrarr: '\u2979',
                    Subset: '\u22D0',
                    subset: '\u2282',
                    subseteq: '\u2286',
                    subseteqq: '\u2AC5',
                    SubsetEqual: '\u2286',
                    subsetneq: '\u228A',
                    subsetneqq: '\u2ACB',
                    subsim: '\u2AC7',
                    subsub: '\u2AD5',
                    subsup: '\u2AD3',
                    succ: '\u227B',
                    succapprox: '\u2AB8',
                    succcurlyeq: '\u227D',
                    Succeeds: '\u227B',
                    SucceedsEqual: '\u2AB0',
                    SucceedsSlantEqual: '\u227D',
                    SucceedsTilde: '\u227F',
                    succeq: '\u2AB0',
                    succnapprox: '\u2ABA',
                    succneqq: '\u2AB6',
                    succnsim: '\u22E9',
                    succsim: '\u227F',
                    SuchThat: '\u220B',
                    Sum: '\u2211',
                    sum: '\u2211',
                    sung: '\u266A',
                    Sup: '\u22D1',
                    sup: '\u2283',
                    sup1: '\u00B9',
                    sup2: '\u00B2',
                    sup3: '\u00B3',
                    supdot: '\u2ABE',
                    supdsub: '\u2AD8',
                    supE: '\u2AC6',
                    supe: '\u2287',
                    supedot: '\u2AC4',
                    Superset: '\u2283',
                    SupersetEqual: '\u2287',
                    suphsol: '\u27C9',
                    suphsub: '\u2AD7',
                    suplarr: '\u297B',
                    supmult: '\u2AC2',
                    supnE: '\u2ACC',
                    supne: '\u228B',
                    supplus: '\u2AC0',
                    Supset: '\u22D1',
                    supset: '\u2283',
                    supseteq: '\u2287',
                    supseteqq: '\u2AC6',
                    supsetneq: '\u228B',
                    supsetneqq: '\u2ACC',
                    supsim: '\u2AC8',
                    supsub: '\u2AD4',
                    supsup: '\u2AD6',
                    swarhk: '\u2926',
                    swArr: '\u21D9',
                    swarr: '\u2199',
                    swarrow: '\u2199',
                    swnwar: '\u292A',
                    szlig: '\u00DF',
                    Tab: '\u0009',
                    target: '\u2316',
                    Tau: '\u03A4',
                    tau: '\u03C4',
                    tbrk: '\u23B4',
                    Tcaron: '\u0164',
                    tcaron: '\u0165',
                    Tcedil: '\u0162',
                    tcedil: '\u0163',
                    Tcy: '\u0422',
                    tcy: '\u0442',
                    tdot: '\u20DB',
                    telrec: '\u2315',
                    Tfr: '\uD835\uDD17',
                    tfr: '\uD835\uDD31',
                    there4: '\u2234',
                    Therefore: '\u2234',
                    therefore: '\u2234',
                    Theta: '\u0398',
                    theta: '\u03B8',
                    thetasym: '\u03D1',
                    thetav: '\u03D1',
                    thickapprox: '\u2248',
                    thicksim: '\u223C',
                    ThickSpace: '\u205F\u200A',
                    thinsp: '\u2009',
                    ThinSpace: '\u2009',
                    thkap: '\u2248',
                    thksim: '\u223C',
                    THORN: '\u00DE',
                    thorn: '\u00FE',
                    Tilde: '\u223C',
                    tilde: '\u02DC',
                    TildeEqual: '\u2243',
                    TildeFullEqual: '\u2245',
                    TildeTilde: '\u2248',
                    times: '\u00D7',
                    timesb: '\u22A0',
                    timesbar: '\u2A31',
                    timesd: '\u2A30',
                    tint: '\u222D',
                    toea: '\u2928',
                    top: '\u22A4',
                    topbot: '\u2336',
                    topcir: '\u2AF1',
                    Topf: '\uD835\uDD4B',
                    topf: '\uD835\uDD65',
                    topfork: '\u2ADA',
                    tosa: '\u2929',
                    tprime: '\u2034',
                    TRADE: '\u2122',
                    trade: '\u2122',
                    triangle: '\u25B5',
                    triangledown: '\u25BF',
                    triangleleft: '\u25C3',
                    trianglelefteq: '\u22B4',
                    triangleq: '\u225C',
                    triangleright: '\u25B9',
                    trianglerighteq: '\u22B5',
                    tridot: '\u25EC',
                    trie: '\u225C',
                    triminus: '\u2A3A',
                    TripleDot: '\u20DB',
                    triplus: '\u2A39',
                    trisb: '\u29CD',
                    tritime: '\u2A3B',
                    trpezium: '\u23E2',
                    Tscr: '\uD835\uDCAF',
                    tscr: '\uD835\uDCC9',
                    TScy: '\u0426',
                    tscy: '\u0446',
                    TSHcy: '\u040B',
                    tshcy: '\u045B',
                    Tstrok: '\u0166',
                    tstrok: '\u0167',
                    twixt: '\u226C',
                    twoheadleftarrow: '\u219E',
                    twoheadrightarrow: '\u21A0',
                    Uacute: '\u00DA',
                    uacute: '\u00FA',
                    Uarr: '\u219F',
                    uArr: '\u21D1',
                    uarr: '\u2191',
                    Uarrocir: '\u2949',
                    Ubrcy: '\u040E',
                    ubrcy: '\u045E',
                    Ubreve: '\u016C',
                    ubreve: '\u016D',
                    Ucirc: '\u00DB',
                    ucirc: '\u00FB',
                    Ucy: '\u0423',
                    ucy: '\u0443',
                    udarr: '\u21C5',
                    Udblac: '\u0170',
                    udblac: '\u0171',
                    udhar: '\u296E',
                    ufisht: '\u297E',
                    Ufr: '\uD835\uDD18',
                    ufr: '\uD835\uDD32',
                    Ugrave: '\u00D9',
                    ugrave: '\u00F9',
                    uHar: '\u2963',
                    uharl: '\u21BF',
                    uharr: '\u21BE',
                    uhblk: '\u2580',
                    ulcorn: '\u231C',
                    ulcorner: '\u231C',
                    ulcrop: '\u230F',
                    ultri: '\u25F8',
                    Umacr: '\u016A',
                    umacr: '\u016B',
                    uml: '\u00A8',
                    UnderBar: '\u005F',
                    UnderBrace: '\u23DF',
                    UnderBracket: '\u23B5',
                    UnderParenthesis: '\u23DD',
                    Union: '\u22C3',
                    UnionPlus: '\u228E',
                    Uogon: '\u0172',
                    uogon: '\u0173',
                    Uopf: '\uD835\uDD4C',
                    uopf: '\uD835\uDD66',
                    UpArrow: '\u2191',
                    Uparrow: '\u21D1',
                    uparrow: '\u2191',
                    UpArrowBar: '\u2912',
                    UpArrowDownArrow: '\u21C5',
                    UpDownArrow: '\u2195',
                    Updownarrow: '\u21D5',
                    updownarrow: '\u2195',
                    UpEquilibrium: '\u296E',
                    upharpoonleft: '\u21BF',
                    upharpoonright: '\u21BE',
                    uplus: '\u228E',
                    UpperLeftArrow: '\u2196',
                    UpperRightArrow: '\u2197',
                    Upsi: '\u03D2',
                    upsi: '\u03C5',
                    upsih: '\u03D2',
                    Upsilon: '\u03A5',
                    upsilon: '\u03C5',
                    UpTee: '\u22A5',
                    UpTeeArrow: '\u21A5',
                    upuparrows: '\u21C8',
                    urcorn: '\u231D',
                    urcorner: '\u231D',
                    urcrop: '\u230E',
                    Uring: '\u016E',
                    uring: '\u016F',
                    urtri: '\u25F9',
                    Uscr: '\uD835\uDCB0',
                    uscr: '\uD835\uDCCA',
                    utdot: '\u22F0',
                    Utilde: '\u0168',
                    utilde: '\u0169',
                    utri: '\u25B5',
                    utrif: '\u25B4',
                    uuarr: '\u21C8',
                    Uuml: '\u00DC',
                    uuml: '\u00FC',
                    uwangle: '\u29A7',
                    vangrt: '\u299C',
                    varepsilon: '\u03F5',
                    varkappa: '\u03F0',
                    varnothing: '\u2205',
                    varphi: '\u03D5',
                    varpi: '\u03D6',
                    varpropto: '\u221D',
                    vArr: '\u21D5',
                    varr: '\u2195',
                    varrho: '\u03F1',
                    varsigma: '\u03C2',
                    varsubsetneq: '\u228A\uFE00',
                    varsubsetneqq: '\u2ACB\uFE00',
                    varsupsetneq: '\u228B\uFE00',
                    varsupsetneqq: '\u2ACC\uFE00',
                    vartheta: '\u03D1',
                    vartriangleleft: '\u22B2',
                    vartriangleright: '\u22B3',
                    Vbar: '\u2AEB',
                    vBar: '\u2AE8',
                    vBarv: '\u2AE9',
                    Vcy: '\u0412',
                    vcy: '\u0432',
                    VDash: '\u22AB',
                    Vdash: '\u22A9',
                    vDash: '\u22A8',
                    vdash: '\u22A2',
                    Vdashl: '\u2AE6',
                    Vee: '\u22C1',
                    vee: '\u2228',
                    veebar: '\u22BB',
                    veeeq: '\u225A',
                    vellip: '\u22EE',
                    Verbar: '\u2016',
                    verbar: '\u007C',
                    Vert: '\u2016',
                    vert: '\u007C',
                    VerticalBar: '\u2223',
                    VerticalLine: '\u007C',
                    VerticalSeparator: '\u2758',
                    VerticalTilde: '\u2240',
                    VeryThinSpace: '\u200A',
                    Vfr: '\uD835\uDD19',
                    vfr: '\uD835\uDD33',
                    vltri: '\u22B2',
                    vnsub: '\u2282\u20D2',
                    vnsup: '\u2283\u20D2',
                    Vopf: '\uD835\uDD4D',
                    vopf: '\uD835\uDD67',
                    vprop: '\u221D',
                    vrtri: '\u22B3',
                    Vscr: '\uD835\uDCB1',
                    vscr: '\uD835\uDCCB',
                    vsubnE: '\u2ACB\uFE00',
                    vsubne: '\u228A\uFE00',
                    vsupnE: '\u2ACC\uFE00',
                    vsupne: '\u228B\uFE00',
                    Vvdash: '\u22AA',
                    vzigzag: '\u299A',
                    Wcirc: '\u0174',
                    wcirc: '\u0175',
                    wedbar: '\u2A5F',
                    Wedge: '\u22C0',
                    wedge: '\u2227',
                    wedgeq: '\u2259',
                    weierp: '\u2118',
                    Wfr: '\uD835\uDD1A',
                    wfr: '\uD835\uDD34',
                    Wopf: '\uD835\uDD4E',
                    wopf: '\uD835\uDD68',
                    wp: '\u2118',
                    wr: '\u2240',
                    wreath: '\u2240',
                    Wscr: '\uD835\uDCB2',
                    wscr: '\uD835\uDCCC',
                    xcap: '\u22C2',
                    xcirc: '\u25EF',
                    xcup: '\u22C3',
                    xdtri: '\u25BD',
                    Xfr: '\uD835\uDD1B',
                    xfr: '\uD835\uDD35',
                    xhArr: '\u27FA',
                    xharr: '\u27F7',
                    Xi: '\u039E',
                    xi: '\u03BE',
                    xlArr: '\u27F8',
                    xlarr: '\u27F5',
                    xmap: '\u27FC',
                    xnis: '\u22FB',
                    xodot: '\u2A00',
                    Xopf: '\uD835\uDD4F',
                    xopf: '\uD835\uDD69',
                    xoplus: '\u2A01',
                    xotime: '\u2A02',
                    xrArr: '\u27F9',
                    xrarr: '\u27F6',
                    Xscr: '\uD835\uDCB3',
                    xscr: '\uD835\uDCCD',
                    xsqcup: '\u2A06',
                    xuplus: '\u2A04',
                    xutri: '\u25B3',
                    xvee: '\u22C1',
                    xwedge: '\u22C0',
                    Yacute: '\u00DD',
                    yacute: '\u00FD',
                    YAcy: '\u042F',
                    yacy: '\u044F',
                    Ycirc: '\u0176',
                    ycirc: '\u0177',
                    Ycy: '\u042B',
                    ycy: '\u044B',
                    yen: '\u00A5',
                    Yfr: '\uD835\uDD1C',
                    yfr: '\uD835\uDD36',
                    YIcy: '\u0407',
                    yicy: '\u0457',
                    Yopf: '\uD835\uDD50',
                    yopf: '\uD835\uDD6A',
                    Yscr: '\uD835\uDCB4',
                    yscr: '\uD835\uDCCE',
                    YUcy: '\u042E',
                    yucy: '\u044E',
                    Yuml: '\u0178',
                    yuml: '\u00FF',
                    Zacute: '\u0179',
                    zacute: '\u017A',
                    Zcaron: '\u017D',
                    zcaron: '\u017E',
                    Zcy: '\u0417',
                    zcy: '\u0437',
                    Zdot: '\u017B',
                    zdot: '\u017C',
                    zeetrf: '\u2128',
                    ZeroWidthSpace: '\u200B',
                    Zeta: '\u0396',
                    zeta: '\u03B6',
                    Zfr: '\u2128',
                    zfr: '\uD835\uDD37',
                    ZHcy: '\u0416',
                    zhcy: '\u0436',
                    zigrarr: '\u21DD',
                    Zopf: '\u2124',
                    zopf: '\uD835\uDD6B',
                    Zscr: '\uD835\uDCB5',
                    zscr: '\uD835\uDCCF',
                    zwj: '\u200D',
                    zwnj: '\u200C'
                });
                exports.entityMap = exports.HTML_ENTITIES;
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/index.js" (__unused_rspack_module, exports, __webpack_require__) {
                var dom = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/dom.js");
                exports.DOMImplementation = dom.DOMImplementation;
                exports.XMLSerializer = dom.XMLSerializer;
                exports.DOMParser = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/dom-parser.js").DOMParser;
            },
            "../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/sax.js" (__unused_rspack_module, exports, __webpack_require__) {
                var NAMESPACE = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/conventions.js").NAMESPACE;
                var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
                var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
                var tagNamePattern = new RegExp('^' + nameStartChar.source + nameChar.source + '*(?:\:' + nameStartChar.source + nameChar.source + '*)?$');
                var S_TAG = 0;
                var S_ATTR = 1;
                var S_ATTR_SPACE = 2;
                var S_EQ = 3;
                var S_ATTR_NOQUOT_VALUE = 4;
                var S_ATTR_END = 5;
                var S_TAG_SPACE = 6;
                var S_TAG_CLOSE = 7;
                function ParseError(message, locator) {
                    this.message = message;
                    this.locator = locator;
                    if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
                }
                ParseError.prototype = new Error();
                ParseError.prototype.name = ParseError.name;
                function XMLReader() {}
                XMLReader.prototype = {
                    parse: function(source, defaultNSMap, entityMap) {
                        var domBuilder = this.domBuilder;
                        domBuilder.startDocument();
                        _copy(defaultNSMap, defaultNSMap = {});
                        parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
                        domBuilder.endDocument();
                    }
                };
                function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
                    function fixedFromCharCode(code) {
                        if (!(code > 0xffff)) return String.fromCharCode(code);
                        code -= 0x10000;
                        var surrogate1 = 0xd800 + (code >> 10), surrogate2 = 0xdc00 + (0x3ff & code);
                        return String.fromCharCode(surrogate1, surrogate2);
                    }
                    function entityReplacer(a) {
                        var k = a.slice(1, -1);
                        if (Object.hasOwnProperty.call(entityMap, k)) return entityMap[k];
                        if ('#' === k.charAt(0)) return fixedFromCharCode(parseInt(k.substr(1).replace('x', '0x')));
                        errorHandler.error('entity not found:' + a);
                        return a;
                    }
                    function appendText(end) {
                        if (end > start) {
                            var xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
                            locator && position(start);
                            domBuilder.characters(xt, 0, end - start);
                            start = end;
                        }
                    }
                    function position(p, m) {
                        while(p >= lineEnd && (m = linePattern.exec(source))){
                            lineStart = m.index;
                            lineEnd = lineStart + m[0].length;
                            locator.lineNumber++;
                        }
                        locator.columnNumber = p - lineStart + 1;
                    }
                    var lineStart = 0;
                    var lineEnd = 0;
                    var linePattern = /.*(?:\r\n?|\n)|.*$/g;
                    var locator = domBuilder.locator;
                    var parseStack = [
                        {
                            currentNSMap: defaultNSMapCopy
                        }
                    ];
                    var closeMap = {};
                    var start = 0;
                    while(true){
                        try {
                            var tagStart = source.indexOf('<', start);
                            if (tagStart < 0) {
                                if (!source.substr(start).match(/^\s*$/)) {
                                    var doc = domBuilder.doc;
                                    var text = doc.createTextNode(source.substr(start));
                                    doc.appendChild(text);
                                    domBuilder.currentElement = text;
                                }
                                return;
                            }
                            if (tagStart > start) appendText(tagStart);
                            switch(source.charAt(tagStart + 1)){
                                case '/':
                                    var end = source.indexOf('>', tagStart + 3);
                                    var tagName = source.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, '');
                                    var config = parseStack.pop();
                                    if (end < 0) {
                                        tagName = source.substring(tagStart + 2).replace(/[\s<].*/, '');
                                        errorHandler.error("end tag name: " + tagName + ' is not complete:' + config.tagName);
                                        end = tagStart + 1 + tagName.length;
                                    } else if (tagName.match(/\s</)) {
                                        tagName = tagName.replace(/[\s<].*/, '');
                                        errorHandler.error("end tag name: " + tagName + ' maybe not complete');
                                        end = tagStart + 1 + tagName.length;
                                    }
                                    var localNSMap = config.localNSMap;
                                    var endMatch = config.tagName == tagName;
                                    var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();
                                    if (endIgnoreCaseMach) {
                                        domBuilder.endElement(config.uri, config.localName, tagName);
                                        if (localNSMap) {
                                            for(var prefix in localNSMap)if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
                                        }
                                        if (!endMatch) errorHandler.fatalError("end tag name: " + tagName + ' is not match the current start tagName:' + config.tagName);
                                    } else parseStack.push(config);
                                    end++;
                                    break;
                                case '?':
                                    locator && position(tagStart);
                                    end = parseInstruction(source, tagStart, domBuilder);
                                    break;
                                case '!':
                                    locator && position(tagStart);
                                    end = parseDCC(source, tagStart, domBuilder, errorHandler);
                                    break;
                                default:
                                    locator && position(tagStart);
                                    var el = new ElementAttributes();
                                    var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
                                    var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
                                    var len = el.length;
                                    if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
                                        el.closed = true;
                                        if (!entityMap.nbsp) errorHandler.warning('unclosed xml attribute');
                                    }
                                    if (locator && len) {
                                        var locator2 = copyLocator(locator, {});
                                        for(var i = 0; i < len; i++){
                                            var a = el[i];
                                            position(a.offset);
                                            a.locator = copyLocator(locator, {});
                                        }
                                        domBuilder.locator = locator2;
                                        if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
                                        domBuilder.locator = locator;
                                    } else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
                                    if (NAMESPACE.isHTML(el.uri) && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
                                    else end++;
                            }
                        } catch (e) {
                            if (e instanceof ParseError) throw e;
                            errorHandler.error('element parse error: ' + e);
                            end = -1;
                        }
                        if (end > start) start = end;
                        else appendText(Math.max(tagStart, start) + 1);
                    }
                }
                function copyLocator(f, t) {
                    t.lineNumber = f.lineNumber;
                    t.columnNumber = f.columnNumber;
                    return t;
                }
                function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
                    function addAttribute(qname, value, startIndex) {
                        if (el.attributeNames.hasOwnProperty(qname)) errorHandler.fatalError('Attribute ' + qname + ' redefined');
                        el.addValue(qname, value.replace(/[\t\n\r]/g, ' ').replace(/&#?\w+;/g, entityReplacer), startIndex);
                    }
                    var attrName;
                    var value;
                    var p = ++start;
                    var s = S_TAG;
                    while(true){
                        var c = source.charAt(p);
                        switch(c){
                            case '=':
                                if (s === S_ATTR) {
                                    attrName = source.slice(start, p);
                                    s = S_EQ;
                                } else if (s === S_ATTR_SPACE) s = S_EQ;
                                else throw new Error('attribute equal must after attrName');
                                break;
                            case '\'':
                            case '"':
                                if (s === S_EQ || s === S_ATTR) {
                                    if (s === S_ATTR) {
                                        errorHandler.warning('attribute value must after "="');
                                        attrName = source.slice(start, p);
                                    }
                                    start = p + 1;
                                    p = source.indexOf(c, start);
                                    if (p > 0) {
                                        value = source.slice(start, p);
                                        addAttribute(attrName, value, start - 1);
                                        s = S_ATTR_END;
                                    } else throw new Error('attribute value no end \'' + c + '\' match');
                                } else if (s == S_ATTR_NOQUOT_VALUE) {
                                    value = source.slice(start, p);
                                    addAttribute(attrName, value, start);
                                    errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ')!!');
                                    start = p + 1;
                                    s = S_ATTR_END;
                                } else throw new Error('attribute value must after "="');
                                break;
                            case '/':
                                switch(s){
                                    case S_TAG:
                                        el.setTagName(source.slice(start, p));
                                    case S_ATTR_END:
                                    case S_TAG_SPACE:
                                    case S_TAG_CLOSE:
                                        s = S_TAG_CLOSE;
                                        el.closed = true;
                                    case S_ATTR_NOQUOT_VALUE:
                                    case S_ATTR:
                                        break;
                                    case S_ATTR_SPACE:
                                        el.closed = true;
                                        break;
                                    default:
                                        throw new Error("attribute invalid close char('/')");
                                }
                                break;
                            case '':
                                errorHandler.error('unexpected end of input');
                                if (s == S_TAG) el.setTagName(source.slice(start, p));
                                return p;
                            case '>':
                                switch(s){
                                    case S_TAG:
                                        el.setTagName(source.slice(start, p));
                                    case S_ATTR_END:
                                    case S_TAG_SPACE:
                                    case S_TAG_CLOSE:
                                        break;
                                    case S_ATTR_NOQUOT_VALUE:
                                    case S_ATTR:
                                        value = source.slice(start, p);
                                        if ('/' === value.slice(-1)) {
                                            el.closed = true;
                                            value = value.slice(0, -1);
                                        }
                                    case S_ATTR_SPACE:
                                        if (s === S_ATTR_SPACE) value = attrName;
                                        if (s == S_ATTR_NOQUOT_VALUE) {
                                            errorHandler.warning('attribute "' + value + '" missed quot(")!');
                                            addAttribute(attrName, value, start);
                                        } else {
                                            if (!NAMESPACE.isHTML(currentNSMap['']) || !value.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                                            addAttribute(value, value, start);
                                        }
                                        break;
                                    case S_EQ:
                                        throw new Error('attribute value missed!!');
                                }
                                return p;
                            case '\u0080':
                                c = ' ';
                            default:
                                if (c <= ' ') switch(s){
                                    case S_TAG:
                                        el.setTagName(source.slice(start, p));
                                        s = S_TAG_SPACE;
                                        break;
                                    case S_ATTR:
                                        attrName = source.slice(start, p);
                                        s = S_ATTR_SPACE;
                                        break;
                                    case S_ATTR_NOQUOT_VALUE:
                                        var value = source.slice(start, p);
                                        errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                                        addAttribute(attrName, value, start);
                                    case S_ATTR_END:
                                        s = S_TAG_SPACE;
                                        break;
                                }
                                else switch(s){
                                    case S_ATTR_SPACE:
                                        el.tagName;
                                        if (!NAMESPACE.isHTML(currentNSMap['']) || !attrName.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                                        addAttribute(attrName, attrName, start);
                                        start = p;
                                        s = S_ATTR;
                                        break;
                                    case S_ATTR_END:
                                        errorHandler.warning('attribute space is required"' + attrName + '"!!');
                                    case S_TAG_SPACE:
                                        s = S_ATTR;
                                        start = p;
                                        break;
                                    case S_EQ:
                                        s = S_ATTR_NOQUOT_VALUE;
                                        start = p;
                                        break;
                                    case S_TAG_CLOSE:
                                        throw new Error("elements closed character '/' and '>' must be connected to");
                                }
                        }
                        p++;
                    }
                }
                function appendElement(el, domBuilder, currentNSMap) {
                    var tagName = el.tagName;
                    var localNSMap = null;
                    var i = el.length;
                    while(i--){
                        var a = el[i];
                        var qName = a.qName;
                        var value = a.value;
                        var nsp = qName.indexOf(':');
                        if (nsp > 0) {
                            var prefix = a.prefix = qName.slice(0, nsp);
                            var localName = qName.slice(nsp + 1);
                            var nsPrefix = 'xmlns' === prefix && localName;
                        } else {
                            localName = qName;
                            prefix = null;
                            nsPrefix = 'xmlns' === qName && '';
                        }
                        a.localName = localName;
                        if (false !== nsPrefix) {
                            if (null == localNSMap) {
                                localNSMap = {};
                                _copy(currentNSMap, currentNSMap = {});
                            }
                            currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
                            a.uri = NAMESPACE.XMLNS;
                            domBuilder.startPrefixMapping(nsPrefix, value);
                        }
                    }
                    var i = el.length;
                    while(i--){
                        a = el[i];
                        var prefix = a.prefix;
                        if (prefix) {
                            if ('xml' === prefix) a.uri = NAMESPACE.XML;
                            if ('xmlns' !== prefix) a.uri = currentNSMap[prefix || ''];
                        }
                    }
                    var nsp = tagName.indexOf(':');
                    if (nsp > 0) {
                        prefix = el.prefix = tagName.slice(0, nsp);
                        localName = el.localName = tagName.slice(nsp + 1);
                    } else {
                        prefix = null;
                        localName = el.localName = tagName;
                    }
                    var ns = el.uri = currentNSMap[prefix || ''];
                    domBuilder.startElement(ns, localName, tagName, el);
                    if (el.closed) {
                        domBuilder.endElement(ns, localName, tagName);
                        if (localNSMap) {
                            for(prefix in localNSMap)if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
                        }
                    } else {
                        el.currentNSMap = currentNSMap;
                        el.localNSMap = localNSMap;
                        return true;
                    }
                }
                function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
                    if (/^(?:script|textarea)$/i.test(tagName)) {
                        var elEndStart = source.indexOf('</' + tagName + '>', elStartEnd);
                        var text = source.substring(elStartEnd + 1, elEndStart);
                        if (/[&<]/.test(text)) {
                            if (/^script$/i.test(tagName)) {
                                domBuilder.characters(text, 0, text.length);
                                return elEndStart;
                            }
                            text = text.replace(/&#?\w+;/g, entityReplacer);
                            domBuilder.characters(text, 0, text.length);
                            return elEndStart;
                        }
                    }
                    return elStartEnd + 1;
                }
                function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
                    var pos = closeMap[tagName];
                    if (null == pos) {
                        pos = source.lastIndexOf('</' + tagName + '>');
                        if (pos < elStartEnd) pos = source.lastIndexOf('</' + tagName);
                        closeMap[tagName] = pos;
                    }
                    return pos < elStartEnd;
                }
                function _copy(source, target) {
                    for(var n in source)if (Object.prototype.hasOwnProperty.call(source, n)) target[n] = source[n];
                }
                function parseDCC(source, start, domBuilder, errorHandler) {
                    var next = source.charAt(start + 2);
                    switch(next){
                        case '-':
                            if ('-' === source.charAt(start + 3)) {
                                var end = source.indexOf('-->', start + 4);
                                if (end > start) {
                                    domBuilder.comment(source, start + 4, end - start - 4);
                                    return end + 3;
                                }
                                errorHandler.error("Unclosed comment");
                            }
                            break;
                        default:
                            if ('CDATA[' == source.substr(start + 3, 6)) {
                                var end = source.indexOf(']]>', start + 9);
                                domBuilder.startCDATA();
                                domBuilder.characters(source, start + 9, end - start - 9);
                                domBuilder.endCDATA();
                                return end + 3;
                            }
                            var matchs = split(source, start);
                            var len = matchs.length;
                            if (len > 1 && /!doctype/i.test(matchs[0][0])) {
                                var name = matchs[1][0];
                                var pubid = false;
                                var sysid = false;
                                if (len > 3) {
                                    if (/^public$/i.test(matchs[2][0])) {
                                        pubid = matchs[3][0];
                                        sysid = len > 4 && matchs[4][0];
                                    } else if (/^system$/i.test(matchs[2][0])) sysid = matchs[3][0];
                                }
                                var lastMatch = matchs[len - 1];
                                domBuilder.startDTD(name, pubid, sysid);
                                domBuilder.endDTD();
                                return lastMatch.index + lastMatch[0].length;
                            }
                    }
                    return -1;
                }
                function parseInstruction(source, start, domBuilder) {
                    var end = source.indexOf('?>', start);
                    if (end) {
                        var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
                        if (match) {
                            match[0].length;
                            domBuilder.processingInstruction(match[1], match[2]);
                            return end + 2;
                        }
                    }
                    return -1;
                }
                function ElementAttributes() {
                    this.attributeNames = {};
                }
                ElementAttributes.prototype = {
                    setTagName: function(tagName) {
                        if (!tagNamePattern.test(tagName)) throw new Error('invalid tagName:' + tagName);
                        this.tagName = tagName;
                    },
                    addValue: function(qName, value, offset) {
                        if (!tagNamePattern.test(qName)) throw new Error('invalid attribute:' + qName);
                        this.attributeNames[qName] = this.length;
                        this[this.length++] = {
                            qName: qName,
                            value: value,
                            offset: offset
                        };
                    },
                    length: 0,
                    getLocalName: function(i) {
                        return this[i].localName;
                    },
                    getLocator: function(i) {
                        return this[i].locator;
                    },
                    getQName: function(i) {
                        return this[i].qName;
                    },
                    getURI: function(i) {
                        return this[i].uri;
                    },
                    getValue: function(i) {
                        return this[i].value;
                    }
                };
                function split(source, start) {
                    var match;
                    var buf = [];
                    var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
                    reg.lastIndex = start;
                    reg.exec(source);
                    while(match = reg.exec(source)){
                        buf.push(match);
                        if (match[1]) return buf;
                    }
                }
                exports.XMLReader = XMLReader;
                exports.ParseError = ParseError;
            },
            "../../../node_modules/.pnpm/base64-js@1.5.1/node_modules/base64-js/index.js" (__unused_rspack_module, exports) {
                exports.byteLength = byteLength;
                exports.toByteArray = toByteArray;
                exports.fromByteArray = fromByteArray;
                var lookup = [];
                var revLookup = [];
                var Arr = "u" > typeof Uint8Array ? Uint8Array : Array;
                var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                for(var i = 0, len = code.length; i < len; ++i){
                    lookup[i] = code[i];
                    revLookup[code.charCodeAt(i)] = i;
                }
                revLookup['-'.charCodeAt(0)] = 62;
                revLookup['_'.charCodeAt(0)] = 63;
                function getLens(b64) {
                    var len = b64.length;
                    if (len % 4 > 0) throw new Error('Invalid string. Length must be a multiple of 4');
                    var validLen = b64.indexOf('=');
                    if (-1 === validLen) validLen = len;
                    var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
                    return [
                        validLen,
                        placeHoldersLen
                    ];
                }
                function byteLength(b64) {
                    var lens = getLens(b64);
                    var validLen = lens[0];
                    var placeHoldersLen = lens[1];
                    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
                }
                function _byteLength(b64, validLen, placeHoldersLen) {
                    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
                }
                function toByteArray(b64) {
                    var tmp;
                    var lens = getLens(b64);
                    var validLen = lens[0];
                    var placeHoldersLen = lens[1];
                    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
                    var curByte = 0;
                    var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
                    var i;
                    for(i = 0; i < len; i += 4){
                        tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
                        arr[curByte++] = tmp >> 16 & 0xFF;
                        arr[curByte++] = tmp >> 8 & 0xFF;
                        arr[curByte++] = 0xFF & tmp;
                    }
                    if (2 === placeHoldersLen) {
                        tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
                        arr[curByte++] = 0xFF & tmp;
                    }
                    if (1 === placeHoldersLen) {
                        tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
                        arr[curByte++] = tmp >> 8 & 0xFF;
                        arr[curByte++] = 0xFF & tmp;
                    }
                    return arr;
                }
                function tripletToBase64(num) {
                    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[0x3F & num];
                }
                function encodeChunk(uint8, start, end) {
                    var tmp;
                    var output = [];
                    for(var i = start; i < end; i += 3){
                        tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (0xFF & uint8[i + 2]);
                        output.push(tripletToBase64(tmp));
                    }
                    return output.join('');
                }
                function fromByteArray(uint8) {
                    var tmp;
                    var len = uint8.length;
                    var extraBytes = len % 3;
                    var parts = [];
                    var maxChunkLength = 16383;
                    for(var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength)parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
                    if (1 === extraBytes) {
                        tmp = uint8[len - 1];
                        parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
                    } else if (2 === extraBytes) {
                        tmp = (uint8[len - 2] << 8) + uint8[len - 1];
                        parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
                    }
                    return parts.join('');
                }
            },
            "../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/index.js" (__unused_rspack_module, exports, __webpack_require__) {
                var parserFunctions = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/lib/parse.js");
                Object.keys(parserFunctions).forEach(function(k) {
                    exports[k] = parserFunctions[k];
                });
                var builderFunctions = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/lib/build.js");
                Object.keys(builderFunctions).forEach(function(k) {
                    exports[k] = builderFunctions[k];
                });
            },
            "../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/lib/build.js" (__unused_rspack_module, exports, __webpack_require__) {
                var base64 = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/base64-js@1.5.1/node_modules/base64-js/index.js");
                var xmlbuilder = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/index.js");
                exports.build = build;
                function ISODateString(d) {
                    function pad(n) {
                        return n < 10 ? '0' + n : n;
                    }
                    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
                }
                var toString = Object.prototype.toString;
                function type(obj) {
                    var m = toString.call(obj).match(/\[object (.*)\]/);
                    return m ? m[1] : m;
                }
                function build(obj, opts) {
                    var XMLHDR = {
                        version: '1.0',
                        encoding: 'UTF-8'
                    };
                    var XMLDTD = {
                        pubid: '-//Apple//DTD PLIST 1.0//EN',
                        sysid: 'http://www.apple.com/DTDs/PropertyList-1.0.dtd'
                    };
                    var doc = xmlbuilder.create('plist');
                    doc.dec(XMLHDR.version, XMLHDR.encoding, XMLHDR.standalone);
                    doc.dtd(XMLDTD.pubid, XMLDTD.sysid);
                    doc.att('version', '1.0');
                    walk_obj(obj, doc);
                    if (!opts) opts = {};
                    opts.pretty = false !== opts.pretty;
                    return doc.end(opts);
                }
                function walk_obj(next, next_child) {
                    var tag_type, i, prop;
                    var name = type(next);
                    if ('Undefined' == name) return;
                    if (Array.isArray(next)) {
                        next_child = next_child.ele('array');
                        for(i = 0; i < next.length; i++)walk_obj(next[i], next_child);
                    } else if (Buffer.isBuffer(next)) next_child.ele('data').raw(next.toString('base64'));
                    else if ('Object' == name) {
                        next_child = next_child.ele('dict');
                        for(prop in next)if (next.hasOwnProperty(prop)) {
                            next_child.ele('key').txt(prop);
                            walk_obj(next[prop], next_child);
                        }
                    } else if ('Number' == name) {
                        tag_type = next % 1 === 0 ? 'integer' : 'real';
                        next_child.ele(tag_type).txt(next.toString());
                    } else if ('BigInt' == name) next_child.ele('integer').txt(next);
                    else if ('Date' == name) next_child.ele('date').txt(ISODateString(new Date(next)));
                    else if ('Boolean' == name) next_child.ele(next ? 'true' : 'false');
                    else if ('String' == name) next_child.ele('string').txt(next);
                    else if ('ArrayBuffer' == name) next_child.ele('data').raw(base64.fromByteArray(next));
                    else if (next && next.buffer && 'ArrayBuffer' == type(next.buffer)) next_child.ele('data').raw(base64.fromByteArray(new Uint8Array(next.buffer), next_child));
                    else if ('Null' === name) next_child.ele('null').txt('');
                }
            },
            "../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/lib/parse.js" (__unused_rspack_module, exports, __webpack_require__) {
                const { DOMParser } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@xmldom+xmldom@0.8.11/node_modules/@xmldom/xmldom/lib/index.js");
                exports.parse = parse;
                var TEXT_NODE = 3;
                var CDATA_NODE = 4;
                var COMMENT_NODE = 8;
                function shouldIgnoreNode(node) {
                    return node.nodeType === TEXT_NODE || node.nodeType === COMMENT_NODE || node.nodeType === CDATA_NODE;
                }
                function isEmptyNode(node) {
                    if (!node.childNodes || 0 === node.childNodes.length) return true;
                    return false;
                }
                function invariant(test, message) {
                    if (!test) throw new Error(message);
                }
                function parse(xml) {
                    var doc = new DOMParser().parseFromString(xml);
                    invariant('plist' === doc.documentElement.nodeName, 'malformed document. First element should be <plist>');
                    var plist = parsePlistXML(doc.documentElement);
                    if (1 == plist.length) plist = plist[0];
                    return plist;
                }
                function parsePlistXML(node) {
                    var i, new_obj, key, new_arr, res, counter, type;
                    if (!node) return null;
                    if ('plist' === node.nodeName) {
                        new_arr = [];
                        if (isEmptyNode(node)) return new_arr;
                        for(i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) new_arr.push(parsePlistXML(node.childNodes[i]));
                        return new_arr;
                    }
                    if ('dict' === node.nodeName) {
                        new_obj = {};
                        key = null;
                        counter = 0;
                        if (isEmptyNode(node)) return new_obj;
                        for(i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) {
                            if (counter % 2 === 0) {
                                invariant('key' === node.childNodes[i].nodeName, 'Missing key while parsing <dict/>.');
                                key = parsePlistXML(node.childNodes[i]);
                            } else {
                                invariant('key' !== node.childNodes[i].nodeName, 'Unexpected key "' + parsePlistXML(node.childNodes[i]) + '" while parsing <dict/>.');
                                new_obj[key] = parsePlistXML(node.childNodes[i]);
                            }
                            counter += 1;
                        }
                        if (counter % 2 === 1) new_obj[key] = '';
                        return new_obj;
                    }
                    if ('array' === node.nodeName) {
                        new_arr = [];
                        if (isEmptyNode(node)) return new_arr;
                        for(i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) {
                            res = parsePlistXML(node.childNodes[i]);
                            if (null != res) new_arr.push(res);
                        }
                        return new_arr;
                    }
                    if ('#text' === node.nodeName) ;
                    else if ('key' === node.nodeName) {
                        if (isEmptyNode(node)) return '';
                        invariant('__proto__' !== node.childNodes[0].nodeValue, '__proto__ keys can lead to prototype pollution. More details on CVE-2022-22912');
                        return node.childNodes[0].nodeValue;
                    } else if ('string' === node.nodeName) {
                        res = '';
                        if (isEmptyNode(node)) return res;
                        for(i = 0; i < node.childNodes.length; i++){
                            var type = node.childNodes[i].nodeType;
                            if (type === TEXT_NODE || type === CDATA_NODE) res += node.childNodes[i].nodeValue;
                        }
                        return res;
                    } else if ('integer' === node.nodeName) {
                        invariant(!isEmptyNode(node), 'Cannot parse "" as integer.');
                        return parseInt(node.childNodes[0].nodeValue, 10);
                    } else if ('real' === node.nodeName) {
                        invariant(!isEmptyNode(node), 'Cannot parse "" as real.');
                        res = '';
                        for(i = 0; i < node.childNodes.length; i++)if (node.childNodes[i].nodeType === TEXT_NODE) res += node.childNodes[i].nodeValue;
                        return parseFloat(res);
                    } else if ('data' === node.nodeName) {
                        res = '';
                        if (isEmptyNode(node)) return Buffer.from(res, 'base64');
                        for(i = 0; i < node.childNodes.length; i++)if (node.childNodes[i].nodeType === TEXT_NODE) res += node.childNodes[i].nodeValue.replace(/\s+/g, '');
                        return Buffer.from(res, 'base64');
                    } else if ('date' === node.nodeName) {
                        invariant(!isEmptyNode(node), 'Cannot parse "" as Date.');
                        return new Date(node.childNodes[0].nodeValue);
                    } else if ('null' === node.nodeName) return null;
                    else if ('true' === node.nodeName) return true;
                    else if ('false' === node.nodeName) return false;
                    else throw new Error('Invalid PLIST tag ' + node.nodeName);
                }
            },
            "../../../node_modules/.pnpm/usbmux-client@0.2.1/node_modules/usbmux-client/dist/index.js" (__unused_rspack_module, exports, __webpack_require__) {
                exports.UsbmuxClient = void 0;
                const net = (0, _rslib_runtime_js__rspack_import_1.Q)("net");
                const plist = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/plist@3.1.0/node_modules/plist/index.js");
                const util_1 = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/@httptoolkit+util@0.1.9/node_modules/@httptoolkit/util/dist/index.js");
                const stream_utils_1 = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/usbmux-client@0.2.1/node_modules/usbmux-client/dist/stream-utils.js");
                const DEFAULT_ADDRESS = 'win32' === process.platform ? {
                    port: 27015,
                    autoSelectFamily: true
                } : {
                    path: '/var/run/usbmuxd'
                };
                const CLIENT_VERSION = 'usbmux-client';
                const PROG_NAME = 'usbmux-client';
                function plistSerialize(value) {
                    const plistString = plist.build(value);
                    const plistBuffer = Buffer.from(plistString, 'utf8');
                    const length = 16 + plistBuffer.byteLength;
                    const version = 1;
                    const messageType = 8;
                    const tag = 1;
                    const messageHeader = Buffer.alloc(16);
                    messageHeader.writeUInt32LE(length, 0);
                    messageHeader.writeUInt32LE(version, 4);
                    messageHeader.writeUInt32LE(messageType, 8);
                    messageHeader.writeUInt32LE(tag, 12);
                    return Buffer.concat([
                        messageHeader,
                        plistBuffer
                    ], length);
                }
                const swap16bitEndianness = (port)=>{
                    const buffer = Buffer.alloc(2);
                    buffer.writeUint16LE(port);
                    return buffer.readUint16BE();
                };
                function requestTunnelMessage(deviceId, port) {
                    return plistSerialize({
                        MessageType: 'Connect',
                        ClientVersionString: CLIENT_VERSION,
                        ProgName: PROG_NAME,
                        DeviceID: deviceId,
                        PortNumber: swap16bitEndianness(port)
                    });
                }
                const readUsbmuxdMessageFromStream = async (stream)=>{
                    if (stream.closed) return null;
                    const header = await (0, stream_utils_1.readBytes)(stream, 16);
                    const payloadLength = header.readUInt32LE(0) - 16;
                    return (0, stream_utils_1.readBytes)(stream, payloadLength);
                };
                const readPlistMessageFromStream = async (stream)=>{
                    const payload = await readUsbmuxdMessageFromStream(stream);
                    if (!payload) return null;
                    return plist.parse(payload.toString('utf8'));
                };
                function lockdowndMessage(value) {
                    const plistString = plist.build(value);
                    const plistBuffer = Buffer.from(plistString, 'utf8');
                    const length = plistBuffer.byteLength;
                    const message = Buffer.alloc(4 + length);
                    message.writeUInt32BE(length, 0);
                    plistBuffer.copy(message, 4);
                    return message;
                }
                const readMessageFromLockdowndStream = async (stream)=>{
                    if (stream.closed) return null;
                    const header = await (0, stream_utils_1.readBytes)(stream, 4);
                    const payloadLength = header.readUInt32BE(0);
                    const payload = await (0, stream_utils_1.readBytes)(stream, payloadLength);
                    const data = plist.parse(payload.toString('utf8'));
                    if (data.Error) throw new Error(`Received lockdown error: ${data.Error.toString()}`);
                    return data;
                };
                const connectSocket = async (options)=>{
                    const conn = net.connect(options);
                    await new Promise((resolve, reject)=>{
                        conn.once('connect', resolve);
                        conn.once('error', reject);
                    });
                    return conn;
                };
                class UsbmuxError extends util_1.CustomError {
                    constructor(operation, response){
                        const failureType = null === response ? 'usbmux-connection-failure' : 'Result' !== response.MessageType ? `usbmux-unexpected-${response.MessageType}-message` : `usbmux-unexpected-${response.Number}-result`;
                        super(`Usbmux ${operation} request failed: ${failureType}`, {
                            code: failureType
                        });
                    }
                }
                class UsbmuxClient {
                    constructor(connectionOptions = DEFAULT_ADDRESS){
                        this.connectionOptions = connectionOptions;
                        this.deviceData = {};
                        this.openTunnels = [];
                    }
                    async startListeningForDevices() {
                        if (this.deviceMonitorConnection instanceof net.Socket) return;
                        if (this.deviceMonitorConnection?.then) return this.deviceMonitorConnection;
                        const connectionDeferred = (0, util_1.getDeferred)();
                        this.deviceMonitorConnection = connectionDeferred.promise;
                        connectionDeferred.promise.catch(()=>{});
                        try {
                            const conn = await connectSocket(this.connectionOptions);
                            conn.write(plistSerialize({
                                MessageType: 'Listen',
                                ClientVersionString: CLIENT_VERSION,
                                ProgName: PROG_NAME
                            }));
                            const response = await readPlistMessageFromStream(conn);
                            if (null === response || 'Result' !== response.MessageType || 0 !== response.Number) throw new UsbmuxError('listen', response);
                            this.listenToMessages(conn);
                            await (0, util_1.delay)(10);
                            connectionDeferred.resolve(conn);
                            this.deviceMonitorConnection = conn;
                            conn.on('close', ()=>{
                                this.deviceMonitorConnection = void 0;
                                this.deviceData = {};
                            });
                        } catch (e) {
                            this.deviceMonitorConnection = void 0;
                            connectionDeferred.reject(e);
                            throw e;
                        }
                    }
                    async listenToMessages(socket) {
                        while(true){
                            const message = await readPlistMessageFromStream(socket);
                            if (null === message) return void this.close();
                            if ('Attached' === message.MessageType) this.deviceData[message.DeviceID] = message.Properties;
                            else if ('Detached' === message.MessageType) delete this.deviceData[message.DeviceID];
                        }
                    }
                    async getDevices() {
                        await this.startListeningForDevices();
                        return this.deviceData;
                    }
                    async close() {
                        if (this.deviceMonitorConnection instanceof net.Socket) this.deviceMonitorConnection?.end();
                        else if (this.deviceMonitorConnection?.then) await this.deviceMonitorConnection.then((conn)=>conn.destroy()).catch(()=>{});
                        await Promise.all(this.openTunnels.map((tunnel)=>tunnel.destroy()));
                        this.deviceData = {};
                    }
                    async createDeviceTunnel(deviceId, port) {
                        const conn = await connectSocket(this.connectionOptions);
                        this.openTunnels.push(conn);
                        conn.on('close', ()=>{
                            const index = this.openTunnels.indexOf(conn);
                            if (-1 === index) return;
                            this.openTunnels.splice(index, 1);
                        });
                        conn.write(requestTunnelMessage(Number(deviceId), Number(port)));
                        const response = await readPlistMessageFromStream(conn);
                        if (null === response || 'Result' !== response.MessageType || 0 !== response.Number) throw new UsbmuxError('tunnel', response);
                        return conn;
                    }
                    async getLockdownTunnel(deviceId) {
                        const tunnel = await this.createDeviceTunnel(deviceId, 62078);
                        tunnel.write(lockdowndMessage({
                            Label: 'usbmux-client',
                            Request: 'QueryType'
                        }));
                        const response = await readMessageFromLockdowndStream(tunnel);
                        if (response?.Type !== 'com.apple.mobile.lockdown') throw new Error(`Unexpected lockdown response: ${response}`);
                        return tunnel;
                    }
                    async queryDeviceValue(deviceId, key) {
                        const tunnel = await this.getLockdownTunnel(deviceId);
                        tunnel.write(lockdowndMessage({
                            Label: 'usbmux-client',
                            Request: 'GetValue',
                            Key: key
                        }));
                        const message = await readMessageFromLockdowndStream(tunnel);
                        tunnel.end();
                        return message.Value;
                    }
                    async queryAllDeviceValues(deviceId) {
                        const tunnel = await this.getLockdownTunnel(deviceId);
                        tunnel.write(lockdowndMessage({
                            Label: 'usbmux-client',
                            Request: 'GetValue'
                        }));
                        const message = await readMessageFromLockdowndStream(tunnel);
                        tunnel.end();
                        return message.Value;
                    }
                }
                exports.UsbmuxClient = UsbmuxClient;
            },
            "../../../node_modules/.pnpm/usbmux-client@0.2.1/node_modules/usbmux-client/dist/stream-utils.js" (__unused_rspack_module, exports) {
                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                exports.readBytes = void 0;
                const isReadablePromise = (input)=>new Promise((resolve, reject)=>{
                        input.once('readable', resolve);
                        input.once('close', resolve);
                        input.once('error', reject);
                    });
                async function readBytes(input, bytesToRead) {
                    const data = input.read(bytesToRead);
                    if (!data) {
                        await isReadablePromise(input);
                        return readBytes(input, bytesToRead);
                    }
                    if (data.byteLength > bytesToRead) {
                        input.unshift(data.subarray(bytesToRead));
                        return data.subarray(0, bytesToRead);
                    }
                    return data;
                }
                exports.readBytes = readBytes;
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/DocumentPosition.js" (module) {
                (function() {
                    module.exports = {
                        Disconnected: 1,
                        Preceding: 2,
                        Following: 4,
                        Contains: 8,
                        ContainedBy: 16,
                        ImplementationSpecific: 32
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js" (module) {
                (function() {
                    module.exports = {
                        Element: 1,
                        Attribute: 2,
                        Text: 3,
                        CData: 4,
                        EntityReference: 5,
                        EntityDeclaration: 6,
                        ProcessingInstruction: 7,
                        Comment: 8,
                        Document: 9,
                        DocType: 10,
                        DocumentFragment: 11,
                        NotationDeclaration: 12,
                        Declaration: 201,
                        Raw: 202,
                        AttributeDeclaration: 203,
                        ElementDeclaration: 204,
                        Dummy: 205
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js" (module) {
                (function() {
                    var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
                    assign = function(target, ...sources) {
                        var i, key, len, source;
                        if (isFunction(Object.assign)) Object.assign.apply(null, arguments);
                        else for(i = 0, len = sources.length; i < len; i++){
                            source = sources[i];
                            if (null != source) {
                                for(key in source)if (hasProp.call(source, key)) target[key] = source[key];
                            }
                        }
                        return target;
                    };
                    isFunction = function(val) {
                        return !!val && '[object Function]' === Object.prototype.toString.call(val);
                    };
                    isObject = function(val) {
                        var ref;
                        return !!val && ('function' === (ref = typeof val) || 'object' === ref);
                    };
                    isArray = function(val) {
                        if (isFunction(Array.isArray)) return Array.isArray(val);
                        return '[object Array]' === Object.prototype.toString.call(val);
                    };
                    isEmpty = function(val) {
                        var key;
                        if (isArray(val)) return !val.length;
                        for(key in val)if (hasProp.call(val, key)) return false;
                        return true;
                    };
                    isPlainObject = function(val) {
                        var ctor, proto;
                        return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && 'function' == typeof ctor && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
                    };
                    getValue = function(obj) {
                        if (isFunction(obj.valueOf)) return obj.valueOf();
                        return obj;
                    };
                    module.exports.assign = assign;
                    module.exports.isFunction = isFunction;
                    module.exports.isObject = isObject;
                    module.exports.isArray = isArray;
                    module.exports.isEmpty = isEmpty;
                    module.exports.isPlainObject = isPlainObject;
                    module.exports.getValue = getValue;
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js" (module) {
                (function() {
                    module.exports = {
                        None: 0,
                        OpenTag: 1,
                        InsideTag: 2,
                        CloseTag: 3
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    module.exports = (function() {
                        class XMLAttribute {
                            constructor(parent, name, value){
                                this.parent = parent;
                                if (this.parent) {
                                    this.options = this.parent.options;
                                    this.stringify = this.parent.stringify;
                                }
                                if (null == name) throw new Error("Missing attribute name. " + this.debugInfo(name));
                                this.name = this.stringify.name(name);
                                this.value = this.stringify.attValue(value);
                                this.type = NodeType.Attribute;
                                this.isId = false;
                                this.schemaTypeInfo = null;
                            }
                            clone() {
                                return Object.create(this);
                            }
                            toString(options) {
                                return this.options.writer.attribute(this, this.options.writer.filterOptions(options));
                            }
                            debugInfo(name) {
                                name = name || this.name;
                                if (null == name) return "parent: <" + this.parent.name + ">";
                                return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
                            }
                            isEqualNode(node) {
                                if (node.namespaceURI !== this.namespaceURI) return false;
                                if (node.prefix !== this.prefix) return false;
                                if (node.localName !== this.localName) return false;
                                if (node.value !== this.value) return false;
                                return true;
                            }
                        }
                        Object.defineProperty(XMLAttribute.prototype, 'nodeType', {
                            get: function() {
                                return this.type;
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'ownerElement', {
                            get: function() {
                                return this.parent;
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'textContent', {
                            get: function() {
                                return this.value;
                            },
                            set: function(value) {
                                return this.value = value || '';
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'namespaceURI', {
                            get: function() {
                                return '';
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'prefix', {
                            get: function() {
                                return '';
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'localName', {
                            get: function() {
                                return this.name;
                            }
                        });
                        Object.defineProperty(XMLAttribute.prototype, 'specified', {
                            get: function() {
                                return true;
                            }
                        });
                        return XMLAttribute;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLCharacterData;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLCharacterData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
                    module.exports = class extends XMLCharacterData {
                        constructor(parent, text){
                            super(parent);
                            if (null == text) throw new Error("Missing CDATA text. " + this.debugInfo());
                            this.name = "#cdata-section";
                            this.type = NodeType.CData;
                            this.value = this.stringify.cdata(text);
                        }
                        clone() {
                            return Object.create(this);
                        }
                        toString(options) {
                            return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var XMLNode;
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    module.exports = (function() {
                        class XMLCharacterData extends XMLNode {
                            constructor(parent){
                                super(parent);
                                this.value = '';
                            }
                            clone() {
                                return Object.create(this);
                            }
                            substringData(offset, count) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            appendData(arg) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            insertData(offset, arg) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            deleteData(offset, count) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            replaceData(offset, count, arg) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            isEqualNode(node) {
                                if (!super.isEqualNode(node)) return false;
                                if (node.data !== this.data) return false;
                                return true;
                            }
                        }
                        Object.defineProperty(XMLCharacterData.prototype, 'data', {
                            get: function() {
                                return this.value;
                            },
                            set: function(value) {
                                return this.value = value || '';
                            }
                        });
                        Object.defineProperty(XMLCharacterData.prototype, 'length', {
                            get: function() {
                                return this.value.length;
                            }
                        });
                        Object.defineProperty(XMLCharacterData.prototype, 'textContent', {
                            get: function() {
                                return this.value;
                            },
                            set: function(value) {
                                return this.value = value || '';
                            }
                        });
                        return XMLCharacterData;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLCharacterData;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLCharacterData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
                    module.exports = class extends XMLCharacterData {
                        constructor(parent, text){
                            super(parent);
                            if (null == text) throw new Error("Missing comment text. " + this.debugInfo());
                            this.name = "#comment";
                            this.type = NodeType.Comment;
                            this.value = this.stringify.comment(text);
                        }
                        clone() {
                            return Object.create(this);
                        }
                        toString(options) {
                            return this.options.writer.comment(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMConfiguration.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var XMLDOMErrorHandler, XMLDOMStringList;
                    XMLDOMErrorHandler = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js");
                    XMLDOMStringList = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMStringList.js");
                    module.exports = (function() {
                        class XMLDOMConfiguration {
                            constructor(){
                                this.defaultParams = {
                                    "canonical-form": false,
                                    "cdata-sections": false,
                                    comments: false,
                                    "datatype-normalization": false,
                                    "element-content-whitespace": true,
                                    entities: true,
                                    "error-handler": new XMLDOMErrorHandler(),
                                    infoset: true,
                                    "validate-if-schema": false,
                                    namespaces: true,
                                    "namespace-declarations": true,
                                    "normalize-characters": false,
                                    "schema-location": '',
                                    "schema-type": '',
                                    "split-cdata-sections": true,
                                    validate: false,
                                    "well-formed": true
                                };
                                this.params = Object.create(this.defaultParams);
                            }
                            getParameter(name) {
                                if (this.params.hasOwnProperty(name)) return this.params[name];
                                return null;
                            }
                            canSetParameter(name, value) {
                                return true;
                            }
                            setParameter(name, value) {
                                if (null != value) return this.params[name] = value;
                                return delete this.params[name];
                            }
                        }
                        Object.defineProperty(XMLDOMConfiguration.prototype, 'parameterNames', {
                            get: function() {
                                return new XMLDOMStringList(Object.keys(this.defaultParams));
                            }
                        });
                        return XMLDOMConfiguration;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js" (module) {
                (function() {
                    module.exports = class {
                        handleError(error) {
                            throw new Error(error);
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js" (module) {
                (function() {
                    module.exports = class {
                        hasFeature(feature, version) {
                            return true;
                        }
                        createDocumentType(qualifiedName, publicId, systemId) {
                            throw new Error("This DOM method is not implemented.");
                        }
                        createDocument(namespaceURI, qualifiedName, doctype) {
                            throw new Error("This DOM method is not implemented.");
                        }
                        createHTMLDocument(title) {
                            throw new Error("This DOM method is not implemented.");
                        }
                        getFeature(feature, version) {
                            throw new Error("This DOM method is not implemented.");
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMStringList.js" (module) {
                (function() {
                    module.exports = (function() {
                        class XMLDOMStringList {
                            constructor(arr){
                                this.arr = arr || [];
                            }
                            item(index) {
                                return this.arr[index] || null;
                            }
                            contains(str) {
                                return -1 !== this.arr.indexOf(str);
                            }
                        }
                        Object.defineProperty(XMLDOMStringList.prototype, 'length', {
                            get: function() {
                                return this.arr.length;
                            }
                        });
                        return XMLDOMStringList;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode;
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = class extends XMLNode {
                        constructor(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue){
                            super(parent);
                            if (null == elementName) throw new Error("Missing DTD element name. " + this.debugInfo());
                            if (null == attributeName) throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
                            if (!attributeType) throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
                            if (!defaultValueType) throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
                            if (0 !== defaultValueType.indexOf('#')) defaultValueType = '#' + defaultValueType;
                            if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                            if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                            this.elementName = this.stringify.name(elementName);
                            this.type = NodeType.AttributeDeclaration;
                            this.attributeName = this.stringify.name(attributeName);
                            this.attributeType = this.stringify.dtdAttType(attributeType);
                            if (defaultValue) this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
                            this.defaultValueType = defaultValueType;
                        }
                        toString(options) {
                            return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode;
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = class extends XMLNode {
                        constructor(parent, name, value){
                            super(parent);
                            if (null == name) throw new Error("Missing DTD element name. " + this.debugInfo());
                            if (!value) value = '(#PCDATA)';
                            if (Array.isArray(value)) value = '(' + value.join(',') + ')';
                            this.name = this.stringify.name(name);
                            this.type = NodeType.ElementDeclaration;
                            this.value = this.stringify.dtdElementValue(value);
                        }
                        toString(options) {
                            return this.options.writer.dtdElement(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode, isObject;
                    ({ isObject } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = (function() {
                        class XMLDTDEntity extends XMLNode {
                            constructor(parent, pe, name, value){
                                super(parent);
                                if (null == name) throw new Error("Missing DTD entity name. " + this.debugInfo(name));
                                if (null == value) throw new Error("Missing DTD entity value. " + this.debugInfo(name));
                                this.pe = !!pe;
                                this.name = this.stringify.name(name);
                                this.type = NodeType.EntityDeclaration;
                                if (isObject(value)) {
                                    if (!value.pubID && !value.sysID) throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
                                    if (value.pubID && !value.sysID) throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
                                    this.internal = false;
                                    if (null != value.pubID) this.pubID = this.stringify.dtdPubID(value.pubID);
                                    if (null != value.sysID) this.sysID = this.stringify.dtdSysID(value.sysID);
                                    if (null != value.nData) this.nData = this.stringify.dtdNData(value.nData);
                                    if (this.pe && this.nData) throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
                                } else {
                                    this.value = this.stringify.dtdEntityValue(value);
                                    this.internal = true;
                                }
                            }
                            toString(options) {
                                return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(options));
                            }
                        }
                        Object.defineProperty(XMLDTDEntity.prototype, 'publicId', {
                            get: function() {
                                return this.pubID;
                            }
                        });
                        Object.defineProperty(XMLDTDEntity.prototype, 'systemId', {
                            get: function() {
                                return this.sysID;
                            }
                        });
                        Object.defineProperty(XMLDTDEntity.prototype, 'notationName', {
                            get: function() {
                                return this.nData || null;
                            }
                        });
                        Object.defineProperty(XMLDTDEntity.prototype, 'inputEncoding', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDTDEntity.prototype, 'xmlEncoding', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDTDEntity.prototype, 'xmlVersion', {
                            get: function() {
                                return null;
                            }
                        });
                        return XMLDTDEntity;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode;
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = (function() {
                        class XMLDTDNotation extends XMLNode {
                            constructor(parent, name, value){
                                super(parent);
                                if (null == name) throw new Error("Missing DTD notation name. " + this.debugInfo(name));
                                if (!value.pubID && !value.sysID) throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
                                this.name = this.stringify.name(name);
                                this.type = NodeType.NotationDeclaration;
                                if (null != value.pubID) this.pubID = this.stringify.dtdPubID(value.pubID);
                                if (null != value.sysID) this.sysID = this.stringify.dtdSysID(value.sysID);
                            }
                            toString(options) {
                                return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(options));
                            }
                        }
                        Object.defineProperty(XMLDTDNotation.prototype, 'publicId', {
                            get: function() {
                                return this.pubID;
                            }
                        });
                        Object.defineProperty(XMLDTDNotation.prototype, 'systemId', {
                            get: function() {
                                return this.sysID;
                            }
                        });
                        return XMLDTDNotation;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode, isObject;
                    ({ isObject } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = class extends XMLNode {
                        constructor(parent, version, encoding, standalone){
                            super(parent);
                            if (isObject(version)) ({ version, encoding, standalone } = version);
                            if (!version) version = '1.0';
                            this.type = NodeType.Declaration;
                            this.version = this.stringify.xmlVersion(version);
                            if (null != encoding) this.encoding = this.stringify.xmlEncoding(encoding);
                            if (null != standalone) this.standalone = this.stringify.xmlStandalone(standalone);
                        }
                        toString(options) {
                            return this.options.writer.declaration(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLNamedNodeMap, XMLNode, isObject;
                    ({ isObject } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLDTDAttList = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
                    XMLDTDEntity = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
                    XMLDTDElement = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
                    XMLDTDNotation = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
                    XMLNamedNodeMap = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
                    module.exports = (function() {
                        class XMLDocType extends XMLNode {
                            constructor(parent, pubID, sysID){
                                var child, i, len, ref;
                                super(parent);
                                this.type = NodeType.DocType;
                                if (parent.children) {
                                    ref = parent.children;
                                    for(i = 0, len = ref.length; i < len; i++){
                                        child = ref[i];
                                        if (child.type === NodeType.Element) {
                                            this.name = child.name;
                                            break;
                                        }
                                    }
                                }
                                this.documentObject = parent;
                                if (isObject(pubID)) ({ pubID, sysID } = pubID);
                                if (null == sysID) [sysID, pubID] = [
                                    pubID,
                                    sysID
                                ];
                                if (null != pubID) this.pubID = this.stringify.dtdPubID(pubID);
                                if (null != sysID) this.sysID = this.stringify.dtdSysID(sysID);
                            }
                            element(name, value) {
                                var child;
                                child = new XMLDTDElement(this, name, value);
                                this.children.push(child);
                                return this;
                            }
                            attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                                var child;
                                child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
                                this.children.push(child);
                                return this;
                            }
                            entity(name, value) {
                                var child;
                                child = new XMLDTDEntity(this, false, name, value);
                                this.children.push(child);
                                return this;
                            }
                            pEntity(name, value) {
                                var child;
                                child = new XMLDTDEntity(this, true, name, value);
                                this.children.push(child);
                                return this;
                            }
                            notation(name, value) {
                                var child;
                                child = new XMLDTDNotation(this, name, value);
                                this.children.push(child);
                                return this;
                            }
                            toString(options) {
                                return this.options.writer.docType(this, this.options.writer.filterOptions(options));
                            }
                            ele(name, value) {
                                return this.element(name, value);
                            }
                            att(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                                return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
                            }
                            ent(name, value) {
                                return this.entity(name, value);
                            }
                            pent(name, value) {
                                return this.pEntity(name, value);
                            }
                            not(name, value) {
                                return this.notation(name, value);
                            }
                            up() {
                                return this.root() || this.documentObject;
                            }
                            isEqualNode(node) {
                                if (!super.isEqualNode(node)) return false;
                                if (node.name !== this.name) return false;
                                if (node.publicId !== this.publicId) return false;
                                if (node.systemId !== this.systemId) return false;
                                return true;
                            }
                        }
                        Object.defineProperty(XMLDocType.prototype, 'entities', {
                            get: function() {
                                var child, i, len, nodes, ref;
                                nodes = {};
                                ref = this.children;
                                for(i = 0, len = ref.length; i < len; i++){
                                    child = ref[i];
                                    if (child.type === NodeType.EntityDeclaration && !child.pe) nodes[child.name] = child;
                                }
                                return new XMLNamedNodeMap(nodes);
                            }
                        });
                        Object.defineProperty(XMLDocType.prototype, 'notations', {
                            get: function() {
                                var child, i, len, nodes, ref;
                                nodes = {};
                                ref = this.children;
                                for(i = 0, len = ref.length; i < len; i++){
                                    child = ref[i];
                                    if (child.type === NodeType.NotationDeclaration) nodes[child.name] = child;
                                }
                                return new XMLNamedNodeMap(nodes);
                            }
                        });
                        Object.defineProperty(XMLDocType.prototype, 'publicId', {
                            get: function() {
                                return this.pubID;
                            }
                        });
                        Object.defineProperty(XMLDocType.prototype, 'systemId', {
                            get: function() {
                                return this.sysID;
                            }
                        });
                        Object.defineProperty(XMLDocType.prototype, 'internalSubset', {
                            get: function() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        return XMLDocType;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLDOMConfiguration, XMLDOMImplementation, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject;
                    ({ isPlainObject } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLDOMImplementation = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js");
                    XMLDOMConfiguration = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMConfiguration.js");
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLStringifier = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js");
                    XMLStringWriter = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
                    module.exports = (function() {
                        class XMLDocument extends XMLNode {
                            constructor(options){
                                super(null);
                                this.name = "#document";
                                this.type = NodeType.Document;
                                this.documentURI = null;
                                this.domConfig = new XMLDOMConfiguration();
                                options || (options = {});
                                if (!options.writer) options.writer = new XMLStringWriter();
                                this.options = options;
                                this.stringify = new XMLStringifier(options);
                            }
                            end(writer) {
                                var writerOptions;
                                writerOptions = {};
                                if (writer) {
                                    if (isPlainObject(writer)) {
                                        writerOptions = writer;
                                        writer = this.options.writer;
                                    }
                                } else writer = this.options.writer;
                                return writer.document(this, writer.filterOptions(writerOptions));
                            }
                            toString(options) {
                                return this.options.writer.document(this, this.options.writer.filterOptions(options));
                            }
                            createElement(tagName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createDocumentFragment() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createTextNode(data) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createComment(data) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createCDATASection(data) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createProcessingInstruction(target, data) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createAttribute(name) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createEntityReference(name) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagName(tagname) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            importNode(importedNode, deep) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createElementNS(namespaceURI, qualifiedName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createAttributeNS(namespaceURI, qualifiedName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagNameNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementById(elementId) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            adoptNode(source) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            normalizeDocument() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            renameNode(node, namespaceURI, qualifiedName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByClassName(classNames) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createEvent(eventInterface) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createRange() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createNodeIterator(root, whatToShow, filter) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            createTreeWalker(root, whatToShow, filter) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        }
                        Object.defineProperty(XMLDocument.prototype, 'implementation', {
                            value: new XMLDOMImplementation()
                        });
                        Object.defineProperty(XMLDocument.prototype, 'doctype', {
                            get: function() {
                                var child, i, len, ref;
                                ref = this.children;
                                for(i = 0, len = ref.length; i < len; i++){
                                    child = ref[i];
                                    if (child.type === NodeType.DocType) return child;
                                }
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'documentElement', {
                            get: function() {
                                return this.rootObject || null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'inputEncoding', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'strictErrorChecking', {
                            get: function() {
                                return false;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'xmlEncoding', {
                            get: function() {
                                if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return this.children[0].encoding;
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'xmlStandalone', {
                            get: function() {
                                if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return 'yes' === this.children[0].standalone;
                                return false;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'xmlVersion', {
                            get: function() {
                                if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return this.children[0].version;
                                return "1.0";
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'URL', {
                            get: function() {
                                return this.documentURI;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'origin', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'compatMode', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'characterSet', {
                            get: function() {
                                return null;
                            }
                        });
                        Object.defineProperty(XMLDocument.prototype, 'contentType', {
                            get: function() {
                                return null;
                            }
                        });
                        return XMLDocument;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocumentCB.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, WriterState, XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocument, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
                    ({ isObject, isFunction, isPlainObject, getValue } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLDocument = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js");
                    XMLElement = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
                    XMLCData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
                    XMLComment = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
                    XMLRaw = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
                    XMLText = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
                    XMLProcessingInstruction = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
                    XMLDeclaration = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
                    XMLDocType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
                    XMLDTDAttList = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
                    XMLDTDEntity = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
                    XMLDTDElement = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
                    XMLDTDNotation = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
                    XMLAttribute = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js");
                    XMLStringifier = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js");
                    XMLStringWriter = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
                    WriterState = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
                    module.exports = class {
                        constructor(options, onData, onEnd){
                            var writerOptions;
                            this.name = "?xml";
                            this.type = NodeType.Document;
                            options || (options = {});
                            writerOptions = {};
                            if (options.writer) {
                                if (isPlainObject(options.writer)) {
                                    writerOptions = options.writer;
                                    options.writer = new XMLStringWriter();
                                }
                            } else options.writer = new XMLStringWriter();
                            this.options = options;
                            this.writer = options.writer;
                            this.writerOptions = this.writer.filterOptions(writerOptions);
                            this.stringify = new XMLStringifier(options);
                            this.onDataCallback = onData || function() {};
                            this.onEndCallback = onEnd || function() {};
                            this.currentNode = null;
                            this.currentLevel = -1;
                            this.openTags = {};
                            this.documentStarted = false;
                            this.documentCompleted = false;
                            this.root = null;
                        }
                        createChildNode(node) {
                            var att, attName, attributes, child, i, len, ref, ref1;
                            switch(node.type){
                                case NodeType.CData:
                                    this.cdata(node.value);
                                    break;
                                case NodeType.Comment:
                                    this.comment(node.value);
                                    break;
                                case NodeType.Element:
                                    attributes = {};
                                    ref = node.attribs;
                                    for(attName in ref)if (hasProp.call(ref, attName)) {
                                        att = ref[attName];
                                        attributes[attName] = att.value;
                                    }
                                    this.node(node.name, attributes);
                                    break;
                                case NodeType.Dummy:
                                    this.dummy();
                                    break;
                                case NodeType.Raw:
                                    this.raw(node.value);
                                    break;
                                case NodeType.Text:
                                    this.text(node.value);
                                    break;
                                case NodeType.ProcessingInstruction:
                                    this.instruction(node.target, node.value);
                                    break;
                                default:
                                    throw new Error("This XML node type is not supported in a JS object: " + node.constructor.name);
                            }
                            ref1 = node.children;
                            for(i = 0, len = ref1.length; i < len; i++){
                                child = ref1[i];
                                this.createChildNode(child);
                                if (child.type === NodeType.Element) this.up();
                            }
                            return this;
                        }
                        dummy() {
                            return this;
                        }
                        node(name, attributes, text) {
                            if (null == name) throw new Error("Missing node name.");
                            if (this.root && -1 === this.currentLevel) throw new Error("Document can only have one root node. " + this.debugInfo(name));
                            this.openCurrent();
                            name = getValue(name);
                            if (null == attributes) attributes = {};
                            attributes = getValue(attributes);
                            if (!isObject(attributes)) [text, attributes] = [
                                attributes,
                                text
                            ];
                            this.currentNode = new XMLElement(this, name, attributes);
                            this.currentNode.children = false;
                            this.currentLevel++;
                            this.openTags[this.currentLevel] = this.currentNode;
                            if (null != text) this.text(text);
                            return this;
                        }
                        element(name, attributes, text) {
                            var child, i, len, oldValidationFlag, ref, root;
                            if (this.currentNode && this.currentNode.type === NodeType.DocType) this.dtdElement(...arguments);
                            else if (Array.isArray(name) || isObject(name) || isFunction(name)) {
                                oldValidationFlag = this.options.noValidation;
                                this.options.noValidation = true;
                                root = new XMLDocument(this.options).element('TEMP_ROOT');
                                root.element(name);
                                this.options.noValidation = oldValidationFlag;
                                ref = root.children;
                                for(i = 0, len = ref.length; i < len; i++){
                                    child = ref[i];
                                    this.createChildNode(child);
                                    if (child.type === NodeType.Element) this.up();
                                }
                            } else this.node(name, attributes, text);
                            return this;
                        }
                        attribute(name, value) {
                            var attName, attValue;
                            if (!this.currentNode || this.currentNode.children) throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
                            if (null != name) name = getValue(name);
                            if (isObject(name)) {
                                for(attName in name)if (hasProp.call(name, attName)) {
                                    attValue = name[attName];
                                    this.attribute(attName, attValue);
                                }
                            } else {
                                if (isFunction(value)) value = value.apply();
                                if (this.options.keepNullAttributes && null == value) this.currentNode.attribs[name] = new XMLAttribute(this, name, "");
                                else if (null != value) this.currentNode.attribs[name] = new XMLAttribute(this, name, value);
                            }
                            return this;
                        }
                        text(value) {
                            var node;
                            this.openCurrent();
                            node = new XMLText(this, value);
                            this.onData(this.writer.text(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        cdata(value) {
                            var node;
                            this.openCurrent();
                            node = new XMLCData(this, value);
                            this.onData(this.writer.cdata(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        comment(value) {
                            var node;
                            this.openCurrent();
                            node = new XMLComment(this, value);
                            this.onData(this.writer.comment(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        raw(value) {
                            var node;
                            this.openCurrent();
                            node = new XMLRaw(this, value);
                            this.onData(this.writer.raw(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        instruction(target, value) {
                            var i, insTarget, insValue, len, node;
                            this.openCurrent();
                            if (null != target) target = getValue(target);
                            if (null != value) value = getValue(value);
                            if (Array.isArray(target)) for(i = 0, len = target.length; i < len; i++){
                                insTarget = target[i];
                                this.instruction(insTarget);
                            }
                            else if (isObject(target)) {
                                for(insTarget in target)if (hasProp.call(target, insTarget)) {
                                    insValue = target[insTarget];
                                    this.instruction(insTarget, insValue);
                                }
                            } else {
                                if (isFunction(value)) value = value.apply();
                                node = new XMLProcessingInstruction(this, target, value);
                                this.onData(this.writer.processingInstruction(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            }
                            return this;
                        }
                        declaration(version, encoding, standalone) {
                            var node;
                            this.openCurrent();
                            if (this.documentStarted) throw new Error("declaration() must be the first node.");
                            node = new XMLDeclaration(this, version, encoding, standalone);
                            this.onData(this.writer.declaration(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        doctype(root, pubID, sysID) {
                            this.openCurrent();
                            if (null == root) throw new Error("Missing root node name.");
                            if (this.root) throw new Error("dtd() must come before the root node.");
                            this.currentNode = new XMLDocType(this, pubID, sysID);
                            this.currentNode.rootNodeName = root;
                            this.currentNode.children = false;
                            this.currentLevel++;
                            this.openTags[this.currentLevel] = this.currentNode;
                            return this;
                        }
                        dtdElement(name, value) {
                            var node;
                            this.openCurrent();
                            node = new XMLDTDElement(this, name, value);
                            this.onData(this.writer.dtdElement(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                            var node;
                            this.openCurrent();
                            node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
                            this.onData(this.writer.dtdAttList(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        entity(name, value) {
                            var node;
                            this.openCurrent();
                            node = new XMLDTDEntity(this, false, name, value);
                            this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        pEntity(name, value) {
                            var node;
                            this.openCurrent();
                            node = new XMLDTDEntity(this, true, name, value);
                            this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        notation(name, value) {
                            var node;
                            this.openCurrent();
                            node = new XMLDTDNotation(this, name, value);
                            this.onData(this.writer.dtdNotation(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                            return this;
                        }
                        up() {
                            if (this.currentLevel < 0) throw new Error("The document node has no parent.");
                            if (this.currentNode) {
                                if (this.currentNode.children) this.closeNode(this.currentNode);
                                else this.openNode(this.currentNode);
                                this.currentNode = null;
                            } else this.closeNode(this.openTags[this.currentLevel]);
                            delete this.openTags[this.currentLevel];
                            this.currentLevel--;
                            return this;
                        }
                        end() {
                            while(this.currentLevel >= 0)this.up();
                            return this.onEnd();
                        }
                        openCurrent() {
                            if (this.currentNode) {
                                this.currentNode.children = true;
                                return this.openNode(this.currentNode);
                            }
                        }
                        openNode(node) {
                            var att, chunk, name, ref;
                            if (!node.isOpen) {
                                if (!this.root && 0 === this.currentLevel && node.type === NodeType.Element) this.root = node;
                                chunk = '';
                                if (node.type === NodeType.Element) {
                                    this.writerOptions.state = WriterState.OpenTag;
                                    chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<' + node.name;
                                    ref = node.attribs;
                                    for(name in ref)if (hasProp.call(ref, name)) {
                                        att = ref[name];
                                        chunk += this.writer.attribute(att, this.writerOptions, this.currentLevel);
                                    }
                                    chunk += (node.children ? '>' : '/>') + this.writer.endline(node, this.writerOptions, this.currentLevel);
                                    this.writerOptions.state = WriterState.InsideTag;
                                } else {
                                    this.writerOptions.state = WriterState.OpenTag;
                                    chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<!DOCTYPE ' + node.rootNodeName;
                                    if (node.pubID && node.sysID) chunk += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                                    else if (node.sysID) chunk += ' SYSTEM "' + node.sysID + '"';
                                    if (node.children) {
                                        chunk += ' [';
                                        this.writerOptions.state = WriterState.InsideTag;
                                    } else {
                                        this.writerOptions.state = WriterState.CloseTag;
                                        chunk += '>';
                                    }
                                    chunk += this.writer.endline(node, this.writerOptions, this.currentLevel);
                                }
                                this.onData(chunk, this.currentLevel);
                                return node.isOpen = true;
                            }
                        }
                        closeNode(node) {
                            var chunk;
                            if (!node.isClosed) {
                                chunk = '';
                                this.writerOptions.state = WriterState.CloseTag;
                                chunk = node.type === NodeType.Element ? this.writer.indent(node, this.writerOptions, this.currentLevel) + '</' + node.name + '>' + this.writer.endline(node, this.writerOptions, this.currentLevel) : this.writer.indent(node, this.writerOptions, this.currentLevel) + ']>' + this.writer.endline(node, this.writerOptions, this.currentLevel);
                                this.writerOptions.state = WriterState.None;
                                this.onData(chunk, this.currentLevel);
                                return node.isClosed = true;
                            }
                        }
                        onData(chunk, level) {
                            this.documentStarted = true;
                            return this.onDataCallback(chunk, level + 1);
                        }
                        onEnd() {
                            this.documentCompleted = true;
                            return this.onEndCallback();
                        }
                        debugInfo(name) {
                            if (null == name) return "";
                            return "node: <" + name + ">";
                        }
                        ele() {
                            return this.element(...arguments);
                        }
                        nod(name, attributes, text) {
                            return this.node(name, attributes, text);
                        }
                        txt(value) {
                            return this.text(value);
                        }
                        dat(value) {
                            return this.cdata(value);
                        }
                        com(value) {
                            return this.comment(value);
                        }
                        ins(target, value) {
                            return this.instruction(target, value);
                        }
                        dec(version, encoding, standalone) {
                            return this.declaration(version, encoding, standalone);
                        }
                        dtd(root, pubID, sysID) {
                            return this.doctype(root, pubID, sysID);
                        }
                        e(name, attributes, text) {
                            return this.element(name, attributes, text);
                        }
                        n(name, attributes, text) {
                            return this.node(name, attributes, text);
                        }
                        t(value) {
                            return this.text(value);
                        }
                        d(value) {
                            return this.cdata(value);
                        }
                        c(value) {
                            return this.comment(value);
                        }
                        r(value) {
                            return this.raw(value);
                        }
                        i(target, value) {
                            return this.instruction(target, value);
                        }
                        att() {
                            if (this.currentNode && this.currentNode.type === NodeType.DocType) return this.attList(...arguments);
                            return this.attribute(...arguments);
                        }
                        a() {
                            if (this.currentNode && this.currentNode.type === NodeType.DocType) return this.attList(...arguments);
                            return this.attribute(...arguments);
                        }
                        ent(name, value) {
                            return this.entity(name, value);
                        }
                        pent(name, value) {
                            return this.pEntity(name, value);
                        }
                        not(name, value) {
                            return this.notation(name, value);
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode;
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    module.exports = class extends XMLNode {
                        constructor(parent){
                            super(parent);
                            this.type = NodeType.Dummy;
                        }
                        clone() {
                            return Object.create(this);
                        }
                        toString(options) {
                            return '';
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLAttribute, XMLNamedNodeMap, XMLNode, getValue, isFunction, isObject, hasProp = {}.hasOwnProperty;
                    ({ isObject, isFunction, getValue } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLAttribute = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js");
                    XMLNamedNodeMap = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
                    module.exports = (function() {
                        class XMLElement extends XMLNode {
                            constructor(parent, name, attributes){
                                var child, j, len, ref;
                                super(parent);
                                if (null == name) throw new Error("Missing element name. " + this.debugInfo());
                                this.name = this.stringify.name(name);
                                this.type = NodeType.Element;
                                this.attribs = {};
                                this.schemaTypeInfo = null;
                                if (null != attributes) this.attribute(attributes);
                                if (parent.type === NodeType.Document) {
                                    this.isRoot = true;
                                    this.documentObject = parent;
                                    parent.rootObject = this;
                                    if (parent.children) {
                                        ref = parent.children;
                                        for(j = 0, len = ref.length; j < len; j++){
                                            child = ref[j];
                                            if (child.type === NodeType.DocType) {
                                                child.name = this.name;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            clone() {
                                var att, attName, clonedSelf, ref;
                                clonedSelf = Object.create(this);
                                if (clonedSelf.isRoot) clonedSelf.documentObject = null;
                                clonedSelf.attribs = {};
                                ref = this.attribs;
                                for(attName in ref)if (hasProp.call(ref, attName)) {
                                    att = ref[attName];
                                    clonedSelf.attribs[attName] = att.clone();
                                }
                                clonedSelf.children = [];
                                this.children.forEach(function(child) {
                                    var clonedChild;
                                    clonedChild = child.clone();
                                    clonedChild.parent = clonedSelf;
                                    return clonedSelf.children.push(clonedChild);
                                });
                                return clonedSelf;
                            }
                            attribute(name, value) {
                                var attName, attValue;
                                if (null != name) name = getValue(name);
                                if (isObject(name)) {
                                    for(attName in name)if (hasProp.call(name, attName)) {
                                        attValue = name[attName];
                                        this.attribute(attName, attValue);
                                    }
                                } else {
                                    if (isFunction(value)) value = value.apply();
                                    if (this.options.keepNullAttributes && null == value) this.attribs[name] = new XMLAttribute(this, name, "");
                                    else if (null != value) this.attribs[name] = new XMLAttribute(this, name, value);
                                }
                                return this;
                            }
                            removeAttribute(name) {
                                var attName, j, len;
                                if (null == name) throw new Error("Missing attribute name. " + this.debugInfo());
                                name = getValue(name);
                                if (Array.isArray(name)) for(j = 0, len = name.length; j < len; j++){
                                    attName = name[j];
                                    delete this.attribs[attName];
                                }
                                else delete this.attribs[name];
                                return this;
                            }
                            toString(options) {
                                return this.options.writer.element(this, this.options.writer.filterOptions(options));
                            }
                            att(name, value) {
                                return this.attribute(name, value);
                            }
                            a(name, value) {
                                return this.attribute(name, value);
                            }
                            getAttribute(name) {
                                if (this.attribs.hasOwnProperty(name)) return this.attribs[name].value;
                                return null;
                            }
                            setAttribute(name, value) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getAttributeNode(name) {
                                if (this.attribs.hasOwnProperty(name)) return this.attribs[name];
                                return null;
                            }
                            setAttributeNode(newAttr) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            removeAttributeNode(oldAttr) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagName(name) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getAttributeNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            setAttributeNS(namespaceURI, qualifiedName, value) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            removeAttributeNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getAttributeNodeNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            setAttributeNodeNS(newAttr) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagNameNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            hasAttribute(name) {
                                return this.attribs.hasOwnProperty(name);
                            }
                            hasAttributeNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            setIdAttribute(name, isId) {
                                if (this.attribs.hasOwnProperty(name)) return this.attribs[name].isId;
                                return isId;
                            }
                            setIdAttributeNS(namespaceURI, localName, isId) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            setIdAttributeNode(idAttr, isId) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagName(tagname) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByTagNameNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getElementsByClassName(classNames) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            isEqualNode(node) {
                                var i, j, ref;
                                if (!super.isEqualNode(node)) return false;
                                if (node.namespaceURI !== this.namespaceURI) return false;
                                if (node.prefix !== this.prefix) return false;
                                if (node.localName !== this.localName) return false;
                                if (node.attribs.length !== this.attribs.length) return false;
                                for(i = j = 0, ref = this.attribs.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j)if (!this.attribs[i].isEqualNode(node.attribs[i])) return false;
                                return true;
                            }
                        }
                        Object.defineProperty(XMLElement.prototype, 'tagName', {
                            get: function() {
                                return this.name;
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'namespaceURI', {
                            get: function() {
                                return '';
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'prefix', {
                            get: function() {
                                return '';
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'localName', {
                            get: function() {
                                return this.name;
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'id', {
                            get: function() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'className', {
                            get: function() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'classList', {
                            get: function() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        Object.defineProperty(XMLElement.prototype, 'attributes', {
                            get: function() {
                                if (!this.attributeMap || !this.attributeMap.nodes) this.attributeMap = new XMLNamedNodeMap(this.attribs);
                                return this.attributeMap;
                            }
                        });
                        return XMLElement;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js" (module) {
                (function() {
                    module.exports = (function() {
                        class XMLNamedNodeMap {
                            constructor(nodes){
                                this.nodes = nodes;
                            }
                            clone() {
                                return this.nodes = null;
                            }
                            getNamedItem(name) {
                                return this.nodes[name];
                            }
                            setNamedItem(node) {
                                var oldNode;
                                oldNode = this.nodes[node.nodeName];
                                this.nodes[node.nodeName] = node;
                                return oldNode || null;
                            }
                            removeNamedItem(name) {
                                var oldNode;
                                oldNode = this.nodes[name];
                                delete this.nodes[name];
                                return oldNode || null;
                            }
                            item(index) {
                                return this.nodes[Object.keys(this.nodes)[index]] || null;
                            }
                            getNamedItemNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented.");
                            }
                            setNamedItemNS(node) {
                                throw new Error("This DOM method is not implemented.");
                            }
                            removeNamedItemNS(namespaceURI, localName) {
                                throw new Error("This DOM method is not implemented.");
                            }
                        }
                        Object.defineProperty(XMLNamedNodeMap.prototype, 'length', {
                            get: function() {
                                return Object.keys(this.nodes).length || 0;
                            }
                        });
                        return XMLNamedNodeMap;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var DocumentPosition, NodeType, XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLNodeList, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, hasProp = {}.hasOwnProperty, splice = [].splice;
                    ({ isObject, isFunction, isEmpty, getValue } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLElement = null;
                    XMLCData = null;
                    XMLComment = null;
                    XMLDeclaration = null;
                    XMLDocType = null;
                    XMLRaw = null;
                    XMLText = null;
                    XMLProcessingInstruction = null;
                    XMLDummy = null;
                    NodeType = null;
                    XMLNodeList = null;
                    DocumentPosition = null;
                    module.exports = (function() {
                        class XMLNode {
                            constructor(parent1){
                                this.parent = parent1;
                                if (this.parent) {
                                    this.options = this.parent.options;
                                    this.stringify = this.parent.stringify;
                                }
                                this.value = null;
                                this.children = [];
                                this.baseURI = null;
                                if (!XMLElement) {
                                    XMLElement = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
                                    XMLCData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
                                    XMLComment = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
                                    XMLDeclaration = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
                                    XMLDocType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
                                    XMLRaw = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
                                    XMLText = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
                                    XMLProcessingInstruction = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
                                    XMLDummy = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js");
                                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                                    XMLNodeList = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNodeList.js");
                                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
                                    DocumentPosition = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/DocumentPosition.js");
                                }
                            }
                            setParent(parent) {
                                var child, j, len, ref1, results;
                                this.parent = parent;
                                if (parent) {
                                    this.options = parent.options;
                                    this.stringify = parent.stringify;
                                }
                                ref1 = this.children;
                                results = [];
                                for(j = 0, len = ref1.length; j < len; j++){
                                    child = ref1[j];
                                    results.push(child.setParent(this));
                                }
                                return results;
                            }
                            element(name, attributes, text) {
                                var childNode, item, j, k, key, lastChild, len, len1, val;
                                lastChild = null;
                                if (null === attributes && null == text) [attributes, text] = [
                                    {},
                                    null
                                ];
                                if (null == attributes) attributes = {};
                                attributes = getValue(attributes);
                                if (!isObject(attributes)) [text, attributes] = [
                                    attributes,
                                    text
                                ];
                                if (null != name) name = getValue(name);
                                if (Array.isArray(name)) for(j = 0, len = name.length; j < len; j++){
                                    item = name[j];
                                    lastChild = this.element(item);
                                }
                                else if (isFunction(name)) lastChild = this.element(name.apply());
                                else if (isObject(name)) {
                                    for(key in name)if (hasProp.call(name, key)) {
                                        val = name[key];
                                        if (isFunction(val)) val = val.apply();
                                        if (!this.options.ignoreDecorators && this.stringify.convertAttKey && 0 === key.indexOf(this.stringify.convertAttKey)) lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
                                        else if (!this.options.separateArrayItems && Array.isArray(val) && isEmpty(val)) lastChild = this.dummy();
                                        else if (isObject(val) && isEmpty(val)) lastChild = this.element(key);
                                        else if (this.options.keepNullNodes || null != val) if (!this.options.separateArrayItems && Array.isArray(val)) for(k = 0, len1 = val.length; k < len1; k++){
                                            item = val[k];
                                            childNode = {};
                                            childNode[key] = item;
                                            lastChild = this.element(childNode);
                                        }
                                        else if (isObject(val)) if (!this.options.ignoreDecorators && this.stringify.convertTextKey && 0 === key.indexOf(this.stringify.convertTextKey)) lastChild = this.element(val);
                                        else {
                                            lastChild = this.element(key);
                                            lastChild.element(val);
                                        }
                                        else lastChild = this.element(key, val);
                                        else lastChild = this.dummy();
                                    }
                                } else lastChild = this.options.keepNullNodes || null !== text ? !this.options.ignoreDecorators && this.stringify.convertTextKey && 0 === name.indexOf(this.stringify.convertTextKey) ? this.text(text) : !this.options.ignoreDecorators && this.stringify.convertCDataKey && 0 === name.indexOf(this.stringify.convertCDataKey) ? this.cdata(text) : !this.options.ignoreDecorators && this.stringify.convertCommentKey && 0 === name.indexOf(this.stringify.convertCommentKey) ? this.comment(text) : !this.options.ignoreDecorators && this.stringify.convertRawKey && 0 === name.indexOf(this.stringify.convertRawKey) ? this.raw(text) : !this.options.ignoreDecorators && this.stringify.convertPIKey && 0 === name.indexOf(this.stringify.convertPIKey) ? this.instruction(name.substr(this.stringify.convertPIKey.length), text) : this.node(name, attributes, text) : this.dummy();
                                if (null == lastChild) throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
                                return lastChild;
                            }
                            insertBefore(name, attributes, text) {
                                var child, i, newChild, refChild, removed;
                                if (null != name ? name.type : void 0) {
                                    newChild = name;
                                    refChild = attributes;
                                    newChild.setParent(this);
                                    if (refChild) {
                                        i = children.indexOf(refChild);
                                        removed = children.splice(i);
                                        children.push(newChild);
                                        Array.prototype.push.apply(children, removed);
                                    } else children.push(newChild);
                                    return newChild;
                                }
                                if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i);
                                child = this.parent.element(name, attributes, text);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return child;
                            }
                            insertAfter(name, attributes, text) {
                                var child, i, removed;
                                if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i + 1);
                                child = this.parent.element(name, attributes, text);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return child;
                            }
                            remove() {
                                var i;
                                if (this.isRoot) throw new Error("Cannot remove the root element. " + this.debugInfo());
                                i = this.parent.children.indexOf(this);
                                splice.apply(this.parent.children, [
                                    i,
                                    i - i + 1
                                ].concat([]));
                                return this.parent;
                            }
                            node(name, attributes, text) {
                                var child;
                                if (null != name) name = getValue(name);
                                attributes || (attributes = {});
                                attributes = getValue(attributes);
                                if (!isObject(attributes)) [text, attributes] = [
                                    attributes,
                                    text
                                ];
                                child = new XMLElement(this, name, attributes);
                                if (null != text) child.text(text);
                                this.children.push(child);
                                return child;
                            }
                            text(value) {
                                var child;
                                if (isObject(value)) this.element(value);
                                child = new XMLText(this, value);
                                this.children.push(child);
                                return this;
                            }
                            cdata(value) {
                                var child;
                                child = new XMLCData(this, value);
                                this.children.push(child);
                                return this;
                            }
                            comment(value) {
                                var child;
                                child = new XMLComment(this, value);
                                this.children.push(child);
                                return this;
                            }
                            commentBefore(value) {
                                var i, removed;
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i);
                                this.parent.comment(value);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return this;
                            }
                            commentAfter(value) {
                                var i, removed;
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i + 1);
                                this.parent.comment(value);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return this;
                            }
                            raw(value) {
                                var child;
                                child = new XMLRaw(this, value);
                                this.children.push(child);
                                return this;
                            }
                            dummy() {
                                var child;
                                child = new XMLDummy(this);
                                return child;
                            }
                            instruction(target, value) {
                                var insTarget, insValue, instruction, j, len;
                                if (null != target) target = getValue(target);
                                if (null != value) value = getValue(value);
                                if (Array.isArray(target)) for(j = 0, len = target.length; j < len; j++){
                                    insTarget = target[j];
                                    this.instruction(insTarget);
                                }
                                else if (isObject(target)) {
                                    for(insTarget in target)if (hasProp.call(target, insTarget)) {
                                        insValue = target[insTarget];
                                        this.instruction(insTarget, insValue);
                                    }
                                } else {
                                    if (isFunction(value)) value = value.apply();
                                    instruction = new XMLProcessingInstruction(this, target, value);
                                    this.children.push(instruction);
                                }
                                return this;
                            }
                            instructionBefore(target, value) {
                                var i, removed;
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i);
                                this.parent.instruction(target, value);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return this;
                            }
                            instructionAfter(target, value) {
                                var i, removed;
                                i = this.parent.children.indexOf(this);
                                removed = this.parent.children.splice(i + 1);
                                this.parent.instruction(target, value);
                                Array.prototype.push.apply(this.parent.children, removed);
                                return this;
                            }
                            declaration(version, encoding, standalone) {
                                var doc, xmldec;
                                doc = this.document();
                                xmldec = new XMLDeclaration(doc, version, encoding, standalone);
                                if (0 === doc.children.length) doc.children.unshift(xmldec);
                                else if (doc.children[0].type === NodeType.Declaration) doc.children[0] = xmldec;
                                else doc.children.unshift(xmldec);
                                return doc.root() || doc;
                            }
                            dtd(pubID, sysID) {
                                var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
                                doc = this.document();
                                doctype = new XMLDocType(doc, pubID, sysID);
                                ref1 = doc.children;
                                for(i = j = 0, len = ref1.length; j < len; i = ++j){
                                    child = ref1[i];
                                    if (child.type === NodeType.DocType) {
                                        doc.children[i] = doctype;
                                        return doctype;
                                    }
                                }
                                ref2 = doc.children;
                                for(i = k = 0, len1 = ref2.length; k < len1; i = ++k){
                                    child = ref2[i];
                                    if (child.isRoot) {
                                        doc.children.splice(i, 0, doctype);
                                        return doctype;
                                    }
                                }
                                doc.children.push(doctype);
                                return doctype;
                            }
                            up() {
                                if (this.isRoot) throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
                                return this.parent;
                            }
                            root() {
                                var node;
                                node = this;
                                while(node)if (node.type === NodeType.Document) return node.rootObject;
                                else {
                                    if (node.isRoot) return node;
                                    node = node.parent;
                                }
                            }
                            document() {
                                var node;
                                node = this;
                                while(node)if (node.type === NodeType.Document) return node;
                                else node = node.parent;
                            }
                            end(options) {
                                return this.document().end(options);
                            }
                            prev() {
                                var i;
                                i = this.parent.children.indexOf(this);
                                if (i < 1) throw new Error("Already at the first node. " + this.debugInfo());
                                return this.parent.children[i - 1];
                            }
                            next() {
                                var i;
                                i = this.parent.children.indexOf(this);
                                if (-1 === i || i === this.parent.children.length - 1) throw new Error("Already at the last node. " + this.debugInfo());
                                return this.parent.children[i + 1];
                            }
                            importDocument(doc) {
                                var child, clonedRoot, j, len, ref1;
                                clonedRoot = doc.root().clone();
                                clonedRoot.parent = this;
                                clonedRoot.isRoot = false;
                                this.children.push(clonedRoot);
                                if (this.type === NodeType.Document) {
                                    clonedRoot.isRoot = true;
                                    clonedRoot.documentObject = this;
                                    this.rootObject = clonedRoot;
                                    if (this.children) {
                                        ref1 = this.children;
                                        for(j = 0, len = ref1.length; j < len; j++){
                                            child = ref1[j];
                                            if (child.type === NodeType.DocType) {
                                                child.name = clonedRoot.name;
                                                break;
                                            }
                                        }
                                    }
                                }
                                return this;
                            }
                            debugInfo(name) {
                                var ref1, ref2;
                                name = name || this.name;
                                if (null == name && !(null != (ref1 = this.parent) ? ref1.name : void 0)) return "";
                                if (null == name) return "parent: <" + this.parent.name + ">";
                                if (!(null != (ref2 = this.parent) ? ref2.name : void 0)) return "node: <" + name + ">";
                                return "node: <" + name + ">, parent: <" + this.parent.name + ">";
                            }
                            ele(name, attributes, text) {
                                return this.element(name, attributes, text);
                            }
                            nod(name, attributes, text) {
                                return this.node(name, attributes, text);
                            }
                            txt(value) {
                                return this.text(value);
                            }
                            dat(value) {
                                return this.cdata(value);
                            }
                            com(value) {
                                return this.comment(value);
                            }
                            ins(target, value) {
                                return this.instruction(target, value);
                            }
                            doc() {
                                return this.document();
                            }
                            dec(version, encoding, standalone) {
                                return this.declaration(version, encoding, standalone);
                            }
                            e(name, attributes, text) {
                                return this.element(name, attributes, text);
                            }
                            n(name, attributes, text) {
                                return this.node(name, attributes, text);
                            }
                            t(value) {
                                return this.text(value);
                            }
                            d(value) {
                                return this.cdata(value);
                            }
                            c(value) {
                                return this.comment(value);
                            }
                            r(value) {
                                return this.raw(value);
                            }
                            i(target, value) {
                                return this.instruction(target, value);
                            }
                            u() {
                                return this.up();
                            }
                            importXMLBuilder(doc) {
                                return this.importDocument(doc);
                            }
                            attribute(name, value) {
                                throw new Error("attribute() applies to element nodes only.");
                            }
                            att(name, value) {
                                return this.attribute(name, value);
                            }
                            a(name, value) {
                                return this.attribute(name, value);
                            }
                            removeAttribute(name) {
                                throw new Error("attribute() applies to element nodes only.");
                            }
                            replaceChild(newChild, oldChild) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            removeChild(oldChild) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            appendChild(newChild) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            hasChildNodes() {
                                return 0 !== this.children.length;
                            }
                            cloneNode(deep) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            normalize() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            isSupported(feature, version) {
                                return true;
                            }
                            hasAttributes() {
                                return 0 !== this.attribs.length;
                            }
                            compareDocumentPosition(other) {
                                var ref, res;
                                ref = this;
                                if (ref === other) return 0;
                                if (this.document() !== other.document()) {
                                    res = DocumentPosition.Disconnected | DocumentPosition.ImplementationSpecific;
                                    if (Math.random() < 0.5) res |= DocumentPosition.Preceding;
                                    else res |= DocumentPosition.Following;
                                    return res;
                                }
                                if (ref.isAncestor(other)) return DocumentPosition.Contains | DocumentPosition.Preceding;
                                if (ref.isDescendant(other)) return DocumentPosition.Contains | DocumentPosition.Following;
                                if (ref.isPreceding(other)) return DocumentPosition.Preceding;
                                return DocumentPosition.Following;
                            }
                            isSameNode(other) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            lookupPrefix(namespaceURI) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            isDefaultNamespace(namespaceURI) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            lookupNamespaceURI(prefix) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            isEqualNode(node) {
                                var i, j, ref1;
                                if (node.nodeType !== this.nodeType) return false;
                                if (node.children.length !== this.children.length) return false;
                                for(i = j = 0, ref1 = this.children.length - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j)if (!this.children[i].isEqualNode(node.children[i])) return false;
                                return true;
                            }
                            getFeature(feature, version) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            setUserData(key, data, handler) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            getUserData(key) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            contains(other) {
                                if (!other) return false;
                                return other === this || this.isDescendant(other);
                            }
                            isDescendant(node) {
                                var child, isDescendantChild, j, len, ref1;
                                ref1 = this.children;
                                for(j = 0, len = ref1.length; j < len; j++){
                                    child = ref1[j];
                                    if (node === child) return true;
                                    isDescendantChild = child.isDescendant(node);
                                    if (isDescendantChild) return true;
                                }
                                return false;
                            }
                            isAncestor(node) {
                                return node.isDescendant(this);
                            }
                            isPreceding(node) {
                                var nodePos, thisPos;
                                nodePos = this.treePosition(node);
                                thisPos = this.treePosition(this);
                                if (-1 === nodePos || -1 === thisPos) return false;
                                return nodePos < thisPos;
                            }
                            isFollowing(node) {
                                var nodePos, thisPos;
                                nodePos = this.treePosition(node);
                                thisPos = this.treePosition(this);
                                if (-1 === nodePos || -1 === thisPos) return false;
                                return nodePos > thisPos;
                            }
                            treePosition(node) {
                                var found, pos;
                                pos = 0;
                                found = false;
                                this.foreachTreeNode(this.document(), function(childNode) {
                                    pos++;
                                    if (!found && childNode === node) return found = true;
                                });
                                if (found) return pos;
                                return -1;
                            }
                            foreachTreeNode(node, func) {
                                var child, j, len, ref1, res;
                                node || (node = this.document());
                                ref1 = node.children;
                                for(j = 0, len = ref1.length; j < len; j++){
                                    child = ref1[j];
                                    if (res = func(child)) return res;
                                    res = this.foreachTreeNode(child, func);
                                    if (res) return res;
                                }
                            }
                        }
                        Object.defineProperty(XMLNode.prototype, 'nodeName', {
                            get: function() {
                                return this.name;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'nodeType', {
                            get: function() {
                                return this.type;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'nodeValue', {
                            get: function() {
                                return this.value;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'parentNode', {
                            get: function() {
                                return this.parent;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'childNodes', {
                            get: function() {
                                if (!this.childNodeList || !this.childNodeList.nodes) this.childNodeList = new XMLNodeList(this.children);
                                return this.childNodeList;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'firstChild', {
                            get: function() {
                                return this.children[0] || null;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'lastChild', {
                            get: function() {
                                return this.children[this.children.length - 1] || null;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'previousSibling', {
                            get: function() {
                                var i;
                                i = this.parent.children.indexOf(this);
                                return this.parent.children[i - 1] || null;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'nextSibling', {
                            get: function() {
                                var i;
                                i = this.parent.children.indexOf(this);
                                return this.parent.children[i + 1] || null;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'ownerDocument', {
                            get: function() {
                                return this.document() || null;
                            }
                        });
                        Object.defineProperty(XMLNode.prototype, 'textContent', {
                            get: function() {
                                var child, j, len, ref1, str;
                                if (this.nodeType !== NodeType.Element && this.nodeType !== NodeType.DocumentFragment) return null;
                                str = '';
                                ref1 = this.children;
                                for(j = 0, len = ref1.length; j < len; j++){
                                    child = ref1[j];
                                    if (child.textContent) str += child.textContent;
                                }
                                return str;
                            },
                            set: function(value) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        return XMLNode;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNodeList.js" (module) {
                (function() {
                    module.exports = (function() {
                        class XMLNodeList {
                            constructor(nodes){
                                this.nodes = nodes;
                            }
                            clone() {
                                return this.nodes = null;
                            }
                            item(index) {
                                return this.nodes[index] || null;
                            }
                        }
                        Object.defineProperty(XMLNodeList.prototype, 'length', {
                            get: function() {
                                return this.nodes.length || 0;
                            }
                        });
                        return XMLNodeList;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLCharacterData;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLCharacterData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
                    module.exports = class extends XMLCharacterData {
                        constructor(parent, target, value){
                            super(parent);
                            if (null == target) throw new Error("Missing instruction target. " + this.debugInfo());
                            this.type = NodeType.ProcessingInstruction;
                            this.target = this.stringify.insTarget(target);
                            this.name = this.target;
                            if (value) this.value = this.stringify.insValue(value);
                        }
                        clone() {
                            return Object.create(this);
                        }
                        toString(options) {
                            return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(options));
                        }
                        isEqualNode(node) {
                            if (!super.isEqualNode(node)) return false;
                            if (node.target !== this.target) return false;
                            return true;
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLNode;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLNode = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
                    module.exports = class extends XMLNode {
                        constructor(parent, text){
                            super(parent);
                            if (null == text) throw new Error("Missing raw text. " + this.debugInfo());
                            this.type = NodeType.Raw;
                            this.value = this.stringify.raw(text);
                        }
                        clone() {
                            return Object.create(this);
                        }
                        toString(options) {
                            return this.options.writer.raw(this, this.options.writer.filterOptions(options));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStreamWriter.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, WriterState, XMLWriterBase, hasProp = {}.hasOwnProperty;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLWriterBase = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js");
                    WriterState = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
                    module.exports = class extends XMLWriterBase {
                        constructor(stream, options){
                            super(options);
                            this.stream = stream;
                        }
                        endline(node, options, level) {
                            if (node.isLastRootNode && options.state === WriterState.CloseTag) return '';
                            return super.endline(node, options, level);
                        }
                        document(doc, options) {
                            var child, i, j, k, len1, len2, ref, ref1, results;
                            ref = doc.children;
                            for(i = j = 0, len1 = ref.length; j < len1; i = ++j){
                                child = ref[i];
                                child.isLastRootNode = i === doc.children.length - 1;
                            }
                            options = this.filterOptions(options);
                            ref1 = doc.children;
                            results = [];
                            for(k = 0, len2 = ref1.length; k < len2; k++){
                                child = ref1[k];
                                results.push(this.writeChildNode(child, options, 0));
                            }
                            return results;
                        }
                        cdata(node, options, level) {
                            return this.stream.write(super.cdata(node, options, level));
                        }
                        comment(node, options, level) {
                            return this.stream.write(super.comment(node, options, level));
                        }
                        declaration(node, options, level) {
                            return this.stream.write(super.declaration(node, options, level));
                        }
                        docType(node, options, level) {
                            var child, j, len1, ref;
                            level || (level = 0);
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            this.stream.write(this.indent(node, options, level));
                            this.stream.write('<!DOCTYPE ' + node.root().name);
                            if (node.pubID && node.sysID) this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
                            else if (node.sysID) this.stream.write(' SYSTEM "' + node.sysID + '"');
                            if (node.children.length > 0) {
                                this.stream.write(' [');
                                this.stream.write(this.endline(node, options, level));
                                options.state = WriterState.InsideTag;
                                ref = node.children;
                                for(j = 0, len1 = ref.length; j < len1; j++){
                                    child = ref[j];
                                    this.writeChildNode(child, options, level + 1);
                                }
                                options.state = WriterState.CloseTag;
                                this.stream.write(']');
                            }
                            options.state = WriterState.CloseTag;
                            this.stream.write(options.spaceBeforeSlash + '>');
                            this.stream.write(this.endline(node, options, level));
                            options.state = WriterState.None;
                            return this.closeNode(node, options, level);
                        }
                        element(node, options, level) {
                            var att, attLen, child, childNodeCount, firstChildNode, j, len, len1, name, r, ratt, ref, ref1, ref2, rline;
                            level || (level = 0);
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<' + node.name;
                            if (options.pretty && options.width > 0) {
                                len = r.length;
                                ref = node.attribs;
                                for(name in ref)if (hasProp.call(ref, name)) {
                                    att = ref[name];
                                    ratt = this.attribute(att, options, level);
                                    attLen = ratt.length;
                                    if (len + attLen > options.width) {
                                        rline = this.indent(node, options, level + 1) + ratt;
                                        r += this.endline(node, options, level) + rline;
                                        len = rline.length;
                                    } else {
                                        rline = ' ' + ratt;
                                        r += rline;
                                        len += rline.length;
                                    }
                                }
                            } else {
                                ref1 = node.attribs;
                                for(name in ref1)if (hasProp.call(ref1, name)) {
                                    att = ref1[name];
                                    r += this.attribute(att, options, level);
                                }
                            }
                            this.stream.write(r);
                            childNodeCount = node.children.length;
                            firstChildNode = 0 === childNodeCount ? null : node.children[0];
                            if (0 === childNodeCount || node.children.every(function(e) {
                                return (e.type === NodeType.Text || e.type === NodeType.Raw || e.type === NodeType.CData) && '' === e.value;
                            })) if (options.allowEmpty) {
                                this.stream.write('>');
                                options.state = WriterState.CloseTag;
                                this.stream.write('</' + node.name + '>');
                            } else {
                                options.state = WriterState.CloseTag;
                                this.stream.write(options.spaceBeforeSlash + '/>');
                            }
                            else if (options.pretty && 1 === childNodeCount && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && null != firstChildNode.value) {
                                this.stream.write('>');
                                options.state = WriterState.InsideTag;
                                options.suppressPrettyCount++;
                                this.writeChildNode(firstChildNode, options, level + 1);
                                options.suppressPrettyCount--;
                                options.state = WriterState.CloseTag;
                                this.stream.write('</' + node.name + '>');
                            } else {
                                this.stream.write('>' + this.endline(node, options, level));
                                options.state = WriterState.InsideTag;
                                ref2 = node.children;
                                for(j = 0, len1 = ref2.length; j < len1; j++){
                                    child = ref2[j];
                                    this.writeChildNode(child, options, level + 1);
                                }
                                options.state = WriterState.CloseTag;
                                this.stream.write(this.indent(node, options, level) + '</' + node.name + '>');
                            }
                            this.stream.write(this.endline(node, options, level));
                            options.state = WriterState.None;
                            return this.closeNode(node, options, level);
                        }
                        processingInstruction(node, options, level) {
                            return this.stream.write(super.processingInstruction(node, options, level));
                        }
                        raw(node, options, level) {
                            return this.stream.write(super.raw(node, options, level));
                        }
                        text(node, options, level) {
                            return this.stream.write(super.text(node, options, level));
                        }
                        dtdAttList(node, options, level) {
                            return this.stream.write(super.dtdAttList(node, options, level));
                        }
                        dtdElement(node, options, level) {
                            return this.stream.write(super.dtdElement(node, options, level));
                        }
                        dtdEntity(node, options, level) {
                            return this.stream.write(super.dtdEntity(node, options, level));
                        }
                        dtdNotation(node, options, level) {
                            return this.stream.write(super.dtdNotation(node, options, level));
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var XMLWriterBase;
                    XMLWriterBase = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js");
                    module.exports = class extends XMLWriterBase {
                        constructor(options){
                            super(options);
                        }
                        document(doc, options) {
                            var child, i, len, r, ref;
                            options = this.filterOptions(options);
                            r = '';
                            ref = doc.children;
                            for(i = 0, len = ref.length; i < len; i++){
                                child = ref[i];
                                r += this.writeChildNode(child, options, 0);
                            }
                            if (options.pretty && r.slice(-options.newline.length) === options.newline) r = r.slice(0, -options.newline.length);
                            return r;
                        }
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js" (module) {
                (function() {
                    var hasProp = {}.hasOwnProperty;
                    module.exports = (function() {
                        class XMLStringifier {
                            constructor(options){
                                var key, ref, value;
                                this.assertLegalChar = this.assertLegalChar.bind(this);
                                this.assertLegalName = this.assertLegalName.bind(this);
                                options || (options = {});
                                this.options = options;
                                if (!this.options.version) this.options.version = '1.0';
                                ref = options.stringify || {};
                                for(key in ref)if (hasProp.call(ref, key)) {
                                    value = ref[key];
                                    this[key] = value;
                                }
                            }
                            name(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalName('' + val || '');
                            }
                            text(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar(this.textEscape('' + val || ''));
                            }
                            cdata(val) {
                                if (this.options.noValidation) return val;
                                val = '' + val || '';
                                val = val.replace(']]>', ']]]]><![CDATA[>');
                                return this.assertLegalChar(val);
                            }
                            comment(val) {
                                if (this.options.noValidation) return val;
                                val = '' + val || '';
                                if (val.match(/--/)) throw new Error("Comment text cannot contain double-hypen: " + val);
                                return this.assertLegalChar(val);
                            }
                            raw(val) {
                                if (this.options.noValidation) return val;
                                return '' + val || '';
                            }
                            attValue(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar(this.attEscape(val = '' + val || ''));
                            }
                            insTarget(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            insValue(val) {
                                if (this.options.noValidation) return val;
                                val = '' + val || '';
                                if (val.match(/\?>/)) throw new Error("Invalid processing instruction value: " + val);
                                return this.assertLegalChar(val);
                            }
                            xmlVersion(val) {
                                if (this.options.noValidation) return val;
                                val = '' + val || '';
                                if (!val.match(/1\.[0-9]+/)) throw new Error("Invalid version number: " + val);
                                return val;
                            }
                            xmlEncoding(val) {
                                if (this.options.noValidation) return val;
                                val = '' + val || '';
                                if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw new Error("Invalid encoding: " + val);
                                return this.assertLegalChar(val);
                            }
                            xmlStandalone(val) {
                                if (this.options.noValidation) return val;
                                if (val) return "yes";
                                return "no";
                            }
                            dtdPubID(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdSysID(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdElementValue(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdAttType(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdAttDefault(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdEntityValue(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            dtdNData(val) {
                                if (this.options.noValidation) return val;
                                return this.assertLegalChar('' + val || '');
                            }
                            assertLegalChar(str) {
                                var regex, res;
                                if (this.options.noValidation) return str;
                                if ('1.0' === this.options.version) {
                                    regex = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
                                    if (void 0 !== this.options.invalidCharReplacement) str = str.replace(regex, this.options.invalidCharReplacement);
                                    else if (res = str.match(regex)) throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
                                } else if ('1.1' === this.options.version) {
                                    regex = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
                                    if (void 0 !== this.options.invalidCharReplacement) str = str.replace(regex, this.options.invalidCharReplacement);
                                    else if (res = str.match(regex)) throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
                                }
                                return str;
                            }
                            assertLegalName(str) {
                                var regex;
                                if (this.options.noValidation) return str;
                                str = this.assertLegalChar(str);
                                regex = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
                                if (!str.match(regex)) throw new Error(`Invalid character in name: ${str}`);
                                return str;
                            }
                            textEscape(str) {
                                var ampregex;
                                if (this.options.noValidation) return str;
                                ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
                                return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
                            }
                            attEscape(str) {
                                var ampregex;
                                if (this.options.noValidation) return str;
                                ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
                                return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
                            }
                        }
                        XMLStringifier.prototype.convertAttKey = '@';
                        XMLStringifier.prototype.convertPIKey = '?';
                        XMLStringifier.prototype.convertTextKey = '#text';
                        XMLStringifier.prototype.convertCDataKey = '#cdata';
                        XMLStringifier.prototype.convertCommentKey = '#comment';
                        XMLStringifier.prototype.convertRawKey = '#raw';
                        return XMLStringifier;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, XMLCharacterData;
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    XMLCharacterData = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
                    module.exports = (function() {
                        class XMLText extends XMLCharacterData {
                            constructor(parent, text){
                                super(parent);
                                if (null == text) throw new Error("Missing element text. " + this.debugInfo());
                                this.name = "#text";
                                this.type = NodeType.Text;
                                this.value = this.stringify.text(text);
                            }
                            clone() {
                                return Object.create(this);
                            }
                            toString(options) {
                                return this.options.writer.text(this, this.options.writer.filterOptions(options));
                            }
                            splitText(offset) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                            replaceWholeText(content) {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        }
                        Object.defineProperty(XMLText.prototype, 'isElementContentWhitespace', {
                            get: function() {
                                throw new Error("This DOM method is not implemented." + this.debugInfo());
                            }
                        });
                        Object.defineProperty(XMLText.prototype, 'wholeText', {
                            get: function() {
                                var next, prev, str;
                                str = '';
                                prev = this.previousSibling;
                                while(prev){
                                    str = prev.data + str;
                                    prev = prev.previousSibling;
                                }
                                str += this.data;
                                next = this.nextSibling;
                                while(next){
                                    str += next.data;
                                    next = next.nextSibling;
                                }
                                return str;
                            }
                        });
                        return XMLText;
                    }).call(this);
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, WriterState, assign, hasProp = {}.hasOwnProperty;
                    ({ assign } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
                    (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
                    WriterState = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
                    module.exports = class {
                        constructor(options){
                            var key, ref, value;
                            options || (options = {});
                            this.options = options;
                            ref = options.writer || {};
                            for(key in ref)if (hasProp.call(ref, key)) {
                                value = ref[key];
                                this["_" + key] = this[key];
                                this[key] = value;
                            }
                        }
                        filterOptions(options) {
                            var filteredOptions, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
                            options || (options = {});
                            options = assign({}, this.options, options);
                            filteredOptions = {
                                writer: this
                            };
                            filteredOptions.pretty = options.pretty || false;
                            filteredOptions.allowEmpty = options.allowEmpty || false;
                            filteredOptions.indent = null != (ref = options.indent) ? ref : '  ';
                            filteredOptions.newline = null != (ref1 = options.newline) ? ref1 : '\n';
                            filteredOptions.offset = null != (ref2 = options.offset) ? ref2 : 0;
                            filteredOptions.width = null != (ref3 = options.width) ? ref3 : 0;
                            filteredOptions.dontPrettyTextNodes = null != (ref4 = null != (ref5 = options.dontPrettyTextNodes) ? ref5 : options.dontprettytextnodes) ? ref4 : 0;
                            filteredOptions.spaceBeforeSlash = null != (ref6 = null != (ref7 = options.spaceBeforeSlash) ? ref7 : options.spacebeforeslash) ? ref6 : '';
                            if (true === filteredOptions.spaceBeforeSlash) filteredOptions.spaceBeforeSlash = ' ';
                            filteredOptions.suppressPrettyCount = 0;
                            filteredOptions.user = {};
                            filteredOptions.state = WriterState.None;
                            return filteredOptions;
                        }
                        indent(node, options, level) {
                            var indentLevel;
                            if (!options.pretty || options.suppressPrettyCount) ;
                            else if (options.pretty) {
                                indentLevel = (level || 0) + options.offset + 1;
                                if (indentLevel > 0) return new Array(indentLevel).join(options.indent);
                            }
                            return '';
                        }
                        endline(node, options, level) {
                            if (!options.pretty || options.suppressPrettyCount) return '';
                            return options.newline;
                        }
                        attribute(att, options, level) {
                            var r;
                            this.openAttribute(att, options, level);
                            r = options.pretty && options.width > 0 ? att.name + '="' + att.value + '"' : ' ' + att.name + '="' + att.value + '"';
                            this.closeAttribute(att, options, level);
                            return r;
                        }
                        cdata(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<![CDATA[';
                            options.state = WriterState.InsideTag;
                            r += node.value;
                            options.state = WriterState.CloseTag;
                            r += ']]>' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        comment(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<!-- ';
                            options.state = WriterState.InsideTag;
                            r += node.value;
                            options.state = WriterState.CloseTag;
                            r += ' -->' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        declaration(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<?xml';
                            options.state = WriterState.InsideTag;
                            r += ' version="' + node.version + '"';
                            if (null != node.encoding) r += ' encoding="' + node.encoding + '"';
                            if (null != node.standalone) r += ' standalone="' + node.standalone + '"';
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '?>';
                            r += this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        docType(node, options, level) {
                            var child, i, len1, r, ref;
                            level || (level = 0);
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level);
                            r += '<!DOCTYPE ' + node.root().name;
                            if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                            else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                            if (node.children.length > 0) {
                                r += ' [';
                                r += this.endline(node, options, level);
                                options.state = WriterState.InsideTag;
                                ref = node.children;
                                for(i = 0, len1 = ref.length; i < len1; i++){
                                    child = ref[i];
                                    r += this.writeChildNode(child, options, level + 1);
                                }
                                options.state = WriterState.CloseTag;
                                r += ']';
                            }
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '>';
                            r += this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        element(node, options, level) {
                            var att, attLen, child, childNodeCount, firstChildNode, i, j, len, len1, len2, name, prettySuppressed, r, ratt, ref, ref1, ref2, ref3, rline;
                            level || (level = 0);
                            prettySuppressed = false;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<' + node.name;
                            if (options.pretty && options.width > 0) {
                                len = r.length;
                                ref = node.attribs;
                                for(name in ref)if (hasProp.call(ref, name)) {
                                    att = ref[name];
                                    ratt = this.attribute(att, options, level);
                                    attLen = ratt.length;
                                    if (len + attLen > options.width) {
                                        rline = this.indent(node, options, level + 1) + ratt;
                                        r += this.endline(node, options, level) + rline;
                                        len = rline.length;
                                    } else {
                                        rline = ' ' + ratt;
                                        r += rline;
                                        len += rline.length;
                                    }
                                }
                            } else {
                                ref1 = node.attribs;
                                for(name in ref1)if (hasProp.call(ref1, name)) {
                                    att = ref1[name];
                                    r += this.attribute(att, options, level);
                                }
                            }
                            childNodeCount = node.children.length;
                            firstChildNode = 0 === childNodeCount ? null : node.children[0];
                            if (0 === childNodeCount || node.children.every(function(e) {
                                return (e.type === NodeType.Text || e.type === NodeType.Raw || e.type === NodeType.CData) && '' === e.value;
                            })) if (options.allowEmpty) {
                                r += '>';
                                options.state = WriterState.CloseTag;
                                r += '</' + node.name + '>' + this.endline(node, options, level);
                            } else {
                                options.state = WriterState.CloseTag;
                                r += options.spaceBeforeSlash + '/>' + this.endline(node, options, level);
                            }
                            else if (options.pretty && 1 === childNodeCount && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && null != firstChildNode.value) {
                                r += '>';
                                options.state = WriterState.InsideTag;
                                options.suppressPrettyCount++;
                                prettySuppressed = true;
                                r += this.writeChildNode(firstChildNode, options, level + 1);
                                options.suppressPrettyCount--;
                                prettySuppressed = false;
                                options.state = WriterState.CloseTag;
                                r += '</' + node.name + '>' + this.endline(node, options, level);
                            } else {
                                if (options.dontPrettyTextNodes) {
                                    ref2 = node.children;
                                    for(i = 0, len1 = ref2.length; i < len1; i++){
                                        child = ref2[i];
                                        if ((child.type === NodeType.Text || child.type === NodeType.Raw || child.type === NodeType.CData) && null != child.value) {
                                            options.suppressPrettyCount++;
                                            prettySuppressed = true;
                                            break;
                                        }
                                    }
                                }
                                r += '>' + this.endline(node, options, level);
                                options.state = WriterState.InsideTag;
                                ref3 = node.children;
                                for(j = 0, len2 = ref3.length; j < len2; j++){
                                    child = ref3[j];
                                    r += this.writeChildNode(child, options, level + 1);
                                }
                                options.state = WriterState.CloseTag;
                                r += this.indent(node, options, level) + '</' + node.name + '>';
                                if (prettySuppressed) options.suppressPrettyCount--;
                                r += this.endline(node, options, level);
                                options.state = WriterState.None;
                            }
                            this.closeNode(node, options, level);
                            return r;
                        }
                        writeChildNode(node, options, level) {
                            switch(node.type){
                                case NodeType.CData:
                                    return this.cdata(node, options, level);
                                case NodeType.Comment:
                                    return this.comment(node, options, level);
                                case NodeType.Element:
                                    return this.element(node, options, level);
                                case NodeType.Raw:
                                    return this.raw(node, options, level);
                                case NodeType.Text:
                                    return this.text(node, options, level);
                                case NodeType.ProcessingInstruction:
                                    return this.processingInstruction(node, options, level);
                                case NodeType.Dummy:
                                    return '';
                                case NodeType.Declaration:
                                    return this.declaration(node, options, level);
                                case NodeType.DocType:
                                    return this.docType(node, options, level);
                                case NodeType.AttributeDeclaration:
                                    return this.dtdAttList(node, options, level);
                                case NodeType.ElementDeclaration:
                                    return this.dtdElement(node, options, level);
                                case NodeType.EntityDeclaration:
                                    return this.dtdEntity(node, options, level);
                                case NodeType.NotationDeclaration:
                                    return this.dtdNotation(node, options, level);
                                default:
                                    throw new Error("Unknown XML node type: " + node.constructor.name);
                            }
                        }
                        processingInstruction(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<?';
                            options.state = WriterState.InsideTag;
                            r += node.target;
                            if (node.value) r += ' ' + node.value;
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '?>';
                            r += this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        raw(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level);
                            options.state = WriterState.InsideTag;
                            r += node.value;
                            options.state = WriterState.CloseTag;
                            r += this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        text(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level);
                            options.state = WriterState.InsideTag;
                            r += node.value;
                            options.state = WriterState.CloseTag;
                            r += this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        dtdAttList(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<!ATTLIST';
                            options.state = WriterState.InsideTag;
                            r += ' ' + node.elementName + ' ' + node.attributeName + ' ' + node.attributeType;
                            if ('#DEFAULT' !== node.defaultValueType) r += ' ' + node.defaultValueType;
                            if (node.defaultValue) r += ' "' + node.defaultValue + '"';
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        dtdElement(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<!ELEMENT';
                            options.state = WriterState.InsideTag;
                            r += ' ' + node.name + ' ' + node.value;
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        dtdEntity(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<!ENTITY';
                            options.state = WriterState.InsideTag;
                            if (node.pe) r += ' %';
                            r += ' ' + node.name;
                            if (node.value) r += ' "' + node.value + '"';
                            else {
                                if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                                else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                                if (node.nData) r += ' NDATA ' + node.nData;
                            }
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        dtdNotation(node, options, level) {
                            var r;
                            this.openNode(node, options, level);
                            options.state = WriterState.OpenTag;
                            r = this.indent(node, options, level) + '<!NOTATION';
                            options.state = WriterState.InsideTag;
                            r += ' ' + node.name;
                            if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                            else if (node.pubID) r += ' PUBLIC "' + node.pubID + '"';
                            else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                            options.state = WriterState.CloseTag;
                            r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                            options.state = WriterState.None;
                            this.closeNode(node, options, level);
                            return r;
                        }
                        openNode(node, options, level) {}
                        closeNode(node, options, level) {}
                        openAttribute(att, options, level) {}
                        closeAttribute(att, options, level) {}
                    };
                }).call(this);
            },
            "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/index.js" (module, __unused_rspack_exports, __webpack_require__) {
                (function() {
                    var NodeType, WriterState, XMLDOMImplementation, XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction;
                    ({ assign, isFunction } = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
                    XMLDOMImplementation = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js");
                    XMLDocument = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js");
                    XMLDocumentCB = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocumentCB.js");
                    XMLStringWriter = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
                    XMLStreamWriter = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStreamWriter.js");
                    NodeType = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                    WriterState = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
                    module.exports.create = function(name, xmldec, doctype, options) {
                        var doc, root;
                        if (null == name) throw new Error("Root element needs a name.");
                        options = assign({}, xmldec, doctype, options);
                        doc = new XMLDocument(options);
                        root = doc.element(name);
                        if (!options.headless) {
                            doc.declaration(options);
                            if (null != options.pubID || null != options.sysID) doc.dtd(options);
                        }
                        return root;
                    };
                    module.exports.begin = function(options, onData, onEnd) {
                        if (isFunction(options)) {
                            [onData, onEnd] = [
                                options,
                                onData
                            ];
                            options = {};
                        }
                        if (onData) return new XMLDocumentCB(options, onData, onEnd);
                        return new XMLDocument(options);
                    };
                    module.exports.stringWriter = function(options) {
                        return new XMLStringWriter(options);
                    };
                    module.exports.streamWriter = function(stream, options) {
                        return new XMLStreamWriter(stream, options);
                    };
                    module.exports.implementation = new XMLDOMImplementation();
                    module.exports.nodeType = NodeType;
                    module.exports.writerState = WriterState;
                }).call(this);
            },
            net (module) {
                module.exports = net__rspack_import_0;
            }
        });
        class PromiseResolver {
            #promise;
            get promise() {
                return this.#promise;
            }
            #resolve;
            #reject;
            #state = 'running';
            get state() {
                return this.#state;
            }
            constructor(){
                this.#promise = new Promise((resolve, reject)=>{
                    this.#resolve = resolve;
                    this.#reject = reject;
                });
            }
            resolve = (value)=>{
                this.#resolve(value);
                this.#state = 'resolved';
            };
            reject = (reason)=>{
                this.#reject(reason);
                this.#state = 'rejected';
            };
        }
        function getUint64LittleEndian(buffer, offset) {
            return BigInt(buffer[offset]) | BigInt(buffer[offset + 1]) << 8n | BigInt(buffer[offset + 2]) << 16n | BigInt(buffer[offset + 3]) << 24n | BigInt(buffer[offset + 4]) << 32n | BigInt(buffer[offset + 5]) << 40n | BigInt(buffer[offset + 6]) << 48n | BigInt(buffer[offset + 7]) << 56n;
        }
        function getUint64(buffer, offset, littleEndian) {
            return littleEndian ? BigInt(buffer[offset]) | BigInt(buffer[offset + 1]) << 8n | BigInt(buffer[offset + 2]) << 16n | BigInt(buffer[offset + 3]) << 24n | BigInt(buffer[offset + 4]) << 32n | BigInt(buffer[offset + 5]) << 40n | BigInt(buffer[offset + 6]) << 48n | BigInt(buffer[offset + 7]) << 56n : BigInt(buffer[offset]) << 56n | BigInt(buffer[offset + 1]) << 48n | BigInt(buffer[offset + 2]) << 40n | BigInt(buffer[offset + 3]) << 32n | BigInt(buffer[offset + 4]) << 24n | BigInt(buffer[offset + 5]) << 16n | BigInt(buffer[offset + 6]) << 8n | BigInt(buffer[offset + 7]);
        }
        function setUint64(buffer, offset, value, littleEndian) {
            if (littleEndian) {
                buffer[offset] = Number(0xffn & value);
                buffer[offset + 1] = Number(value >> 8n & 0xffn);
                buffer[offset + 2] = Number(value >> 16n & 0xffn);
                buffer[offset + 3] = Number(value >> 24n & 0xffn);
                buffer[offset + 4] = Number(value >> 32n & 0xffn);
                buffer[offset + 5] = Number(value >> 40n & 0xffn);
                buffer[offset + 6] = Number(value >> 48n & 0xffn);
                buffer[offset + 7] = Number(value >> 56n & 0xffn);
            } else {
                buffer[offset] = Number(value >> 56n & 0xffn);
                buffer[offset + 1] = Number(value >> 48n & 0xffn);
                buffer[offset + 2] = Number(value >> 40n & 0xffn);
                buffer[offset + 3] = Number(value >> 32n & 0xffn);
                buffer[offset + 4] = Number(value >> 24n & 0xffn);
                buffer[offset + 5] = Number(value >> 16n & 0xffn);
                buffer[offset + 6] = Number(value >> 8n & 0xffn);
                buffer[offset + 7] = Number(0xffn & value);
            }
        }
        const { AbortController: AbortController } = globalThis;
        const stream_ReadableStream = /* #__PURE__ */ (()=>{
            const { ReadableStream } = globalThis;
            if (!ReadableStream.from) ReadableStream.from = function(iterable) {
                const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
                return new ReadableStream({
                    async pull (controller) {
                        const result = await iterator.next();
                        if (result.done) return void controller.close();
                        controller.enqueue(result.value);
                    },
                    async cancel (reason) {
                        await iterator.return?.(reason);
                    }
                });
            };
            if (!ReadableStream.prototype[Symbol.asyncIterator] || !ReadableStream.prototype.values) {
                ReadableStream.prototype.values = async function*(options) {
                    const reader = this.getReader();
                    try {
                        while(true){
                            const { done, value } = await reader.read();
                            if (done) return;
                            yield value;
                        }
                    } finally{
                        if (!options?.preventCancel) await reader.cancel();
                        reader.releaseLock();
                    }
                };
                ReadableStream.prototype[Symbol.asyncIterator] = ReadableStream.prototype.values;
            }
            return ReadableStream;
        })();
        const { WritableStream: WritableStream, TransformStream: TransformStream } = globalThis;
        const Global = globalThis;
        const TextDecoderStream = Global.TextDecoderStream;
        Global.TextEncoderStream;
        function isPromiseLike(value) {
            return "object" == typeof value && null !== value && "then" in value;
        }
        function advance(iterator, next) {
            while(true){
                const { done, value } = iterator.next(next);
                if (done) return value;
                if (isPromiseLike(value)) return value.then((value)=>advance(iterator, {
                        resolved: value
                    }), (error)=>advance(iterator, {
                        error
                    }));
                next = value;
            }
        }
        function bipedal(fn, bindThis) {
            function result(...args) {
                const iterator = fn.call(this, function*(value) {
                    if (isPromiseLike(value)) {
                        const result = yield value;
                        if ("resolved" in result) return result.resolved;
                        throw result.error;
                    }
                    return value;
                }, ...args);
                return advance(iterator, void 0);
            }
            if (bindThis) return result.bind(bindThis);
            return result;
        }
        function defaultFieldSerializer(serializer) {
            return (source, context)=>{
                if (!("buffer" in context)) return serializer(source, context);
                {
                    const buffer = serializer(source, context);
                    context.buffer.set(buffer, context.index);
                    return buffer.length;
                }
            };
        }
        function byobFieldSerializer(size, serializer) {
            return (source, context)=>{
                if ("buffer" in context) {
                    context.index ??= 0;
                    serializer(source, context);
                    return size;
                }
                {
                    const buffer = new Uint8Array(size);
                    serializer(source, {
                        buffer,
                        index: 0,
                        littleEndian: context.littleEndian
                    });
                    return buffer;
                }
            };
        }
        function _field(size, type, serialize, deserialize, options) {
            const field = {
                size,
                type: type,
                serialize: "default" === type ? defaultFieldSerializer(serialize) : byobFieldSerializer(size, serialize),
                deserialize: bipedal(deserialize),
                omitInit: options?.omitInit
            };
            if (options?.init) field.init = options.init;
            return field;
        }
        const factory_field = _field;
        const EmptyUint8Array = new Uint8Array(0);
        function copyMaybeDifferentLength(dest, source, index, length) {
            if (source.length < length) {
                dest.set(source, index);
                dest.fill(0, index + source.length, index + length);
            } else if (source.length === length) dest.set(source, index);
            else dest.set(source.subarray(0, length), index);
        }
        function buffer_buffer(lengthOrField, converter) {
            if ("number" == typeof lengthOrField) {
                let serialize;
                let deserialize;
                let init;
                if (0 === lengthOrField) {
                    serialize = ()=>{};
                    deserialize = converter ? function*() {
                        return converter.convert(EmptyUint8Array);
                    } : function*() {
                        return EmptyUint8Array;
                    };
                } else {
                    serialize = (value, { buffer, index })=>copyMaybeDifferentLength(buffer, value, index, lengthOrField);
                    if (converter) {
                        deserialize = function*(then, reader) {
                            const array = reader.readExactly(lengthOrField);
                            return converter.convert((yield* then(array)));
                        };
                        init = (value)=>converter.back(value);
                    } else deserialize = function*(_then, reader) {
                        const array = reader.readExactly(lengthOrField);
                        return array;
                    };
                }
                return factory_field(lengthOrField, "byob", serialize, deserialize, {
                    init
                });
            }
            if (("object" == typeof lengthOrField || "function" == typeof lengthOrField) && "serialize" in lengthOrField) {
                let deserialize;
                let init;
                if (converter) {
                    deserialize = function*(then, reader, context) {
                        const length = yield* then(lengthOrField.deserialize(reader, context));
                        const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                        return converter.convert((yield* then(array)));
                    };
                    init = (value)=>converter.back(value);
                } else deserialize = function*(then, reader, context) {
                    const length = yield* then(lengthOrField.deserialize(reader, context));
                    const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                    return array;
                };
                return factory_field(lengthOrField.size, "default", (value, { littleEndian })=>{
                    if ("default" === lengthOrField.type) {
                        const lengthBuffer = lengthOrField.serialize(value.length, {
                            littleEndian
                        });
                        if (0 === value.length) return lengthBuffer;
                        const result = new Uint8Array(lengthBuffer.length + value.length);
                        result.set(lengthBuffer, 0);
                        result.set(value, lengthBuffer.length);
                        return result;
                    }
                    {
                        const result = new Uint8Array(lengthOrField.size + value.length);
                        lengthOrField.serialize(value.length, {
                            buffer: result,
                            index: 0,
                            littleEndian
                        });
                        result.set(value, lengthOrField.size);
                        return result;
                    }
                }, deserialize, {
                    init
                });
            }
            if ("string" == typeof lengthOrField) {
                let deserialize;
                let init;
                if (converter) {
                    deserialize = function*(then, reader, { dependencies }) {
                        const length = dependencies[lengthOrField];
                        const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                        return converter.convert((yield* then(array)));
                    };
                    init = (value, dependencies)=>{
                        const array = converter.back(value);
                        dependencies[lengthOrField] = array.length;
                        return array;
                    };
                } else {
                    deserialize = function*(_then, reader, { dependencies }) {
                        const length = dependencies[lengthOrField];
                        const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                        return array;
                    };
                    init = (value, dependencies)=>{
                        const array = value;
                        dependencies[lengthOrField] = array.length;
                        return array;
                    };
                }
                return factory_field(0, "default", (source)=>source, deserialize, {
                    init
                });
            }
            let deserialize;
            let init;
            if (converter) {
                deserialize = function*(then, reader, { dependencies }) {
                    const rawLength = dependencies[lengthOrField.field];
                    const length = lengthOrField.convert(rawLength);
                    const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                    return converter.convert((yield* then(array)));
                };
                init = (value, dependencies)=>{
                    const array = converter.back(value);
                    dependencies[lengthOrField.field] = lengthOrField.back(array.length);
                    return array;
                };
            } else {
                deserialize = function*(_then, reader, { dependencies }) {
                    const rawLength = dependencies[lengthOrField.field];
                    const length = lengthOrField.convert(rawLength);
                    const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                    return array;
                };
                init = (value, dependencies)=>{
                    const array = value;
                    dependencies[lengthOrField.field] = lengthOrField.back(array.length);
                    return array;
                };
            }
            return factory_field(0, "default", (source)=>source, deserialize, {
                init
            });
        }
        class ConcatStringStream {
            #result = "";
            #resolver = new PromiseResolver();
            #writable = new WritableStream({
                write: (chunk)=>{
                    this.#result += chunk;
                },
                close: ()=>{
                    this.#resolver.resolve(this.#result);
                    this.#readableController.enqueue(this.#result);
                    this.#readableController.close();
                },
                abort: (reason)=>{
                    this.#resolver.reject(reason);
                    this.#readableController.error(reason);
                }
            });
            get writable() {
                return this.#writable;
            }
            #readableController;
            #readable = new stream_ReadableStream({
                start: (controller)=>{
                    this.#readableController = controller;
                }
            });
            get readable() {
                return this.#readable;
            }
            constructor(){
                Object.defineProperties(this.#readable, {
                    then: {
                        get: ()=>this.#resolver.promise.then.bind(this.#resolver.promise)
                    },
                    catch: {
                        get: ()=>this.#resolver.promise.catch.bind(this.#resolver.promise)
                    },
                    finally: {
                        get: ()=>this.#resolver.promise.finally.bind(this.#resolver.promise)
                    }
                });
            }
        }
        class ConcatBufferStream {
            #segments = [];
            #resolver = new PromiseResolver();
            #writable = new WritableStream({
                write: (chunk)=>{
                    this.#segments.push(chunk);
                },
                close: ()=>{
                    let result;
                    let offset = 0;
                    switch(this.#segments.length){
                        case 0:
                            result = EmptyUint8Array;
                            break;
                        case 1:
                            result = this.#segments[0];
                            break;
                        default:
                            result = new Uint8Array(this.#segments.reduce((prev, item)=>prev + item.length, 0));
                            for (const segment of this.#segments){
                                result.set(segment, offset);
                                offset += segment.length;
                            }
                            break;
                    }
                    this.#resolver.resolve(result);
                    this.#readableController.enqueue(result);
                    this.#readableController.close();
                },
                abort: (reason)=>{
                    this.#resolver.reject(reason);
                    this.#readableController.error(reason);
                }
            });
            get writable() {
                return this.#writable;
            }
            #readableController;
            #readable = new stream_ReadableStream({
                start: (controller)=>{
                    this.#readableController = controller;
                }
            });
            get readable() {
                return this.#readable;
            }
            constructor(){
                Object.defineProperties(this.#readable, {
                    then: {
                        get: ()=>this.#resolver.promise.then.bind(this.#resolver.promise)
                    },
                    catch: {
                        get: ()=>this.#resolver.promise.catch.bind(this.#resolver.promise)
                    },
                    finally: {
                        get: ()=>this.#resolver.promise.finally.bind(this.#resolver.promise)
                    }
                });
            }
        }
        const AdbFeature = {
            ShellV2: "shell_v2",
            Cmd: "cmd",
            StatV2: "stat_v2",
            ListV2: "ls_v2",
            FixedPushMkdir: "fixed_push_mkdir",
            Abb: "abb",
            AbbExec: "abb_exec",
            SendReceiveV2: "sendrecv_v2",
            DelayedAck: "delayed_ack"
        };
        class AdbNoneProtocolProcessImpl {
            #socket;
            get stdin() {
                return this.#socket.writable;
            }
            get output() {
                return this.#socket.readable;
            }
            #exited;
            get exited() {
                return this.#exited;
            }
            constructor(socket, signal){
                this.#socket = socket;
                if (signal) {
                    const exited = new PromiseResolver();
                    this.#socket.closed.then(()=>exited.resolve(void 0), (e)=>exited.reject(e));
                    signal.addEventListener("abort", ()=>{
                        exited.reject(signal.reason);
                        this.#socket.close();
                    });
                    this.#exited = exited.promise;
                } else this.#exited = this.#socket.closed;
            }
            kill() {
                return this.#socket.close();
            }
        }
        class ConsumableWritableStream extends WritableStream {
            static async write(writer, value) {
                const consumable = new consumable_Consumable(value);
                await writer.write(consumable);
                await consumable.consumed;
            }
            constructor(sink, strategy){
                let wrappedStrategy;
                if (strategy) {
                    wrappedStrategy = {};
                    if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
                    if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk instanceof consumable_Consumable ? chunk.value : chunk);
                }
                super({
                    start (controller) {
                        return sink.start?.(controller);
                    },
                    write (chunk, controller) {
                        return chunk.tryConsume((chunk)=>sink.write?.(chunk, controller));
                    },
                    abort (reason) {
                        return sink.abort?.(reason);
                    },
                    close () {
                        return sink.close?.();
                    }
                }, wrappedStrategy);
            }
        }
        class ConsumableWrapWritableStream extends WritableStream {
            constructor(stream){
                const writer = stream.getWriter();
                super({
                    write (chunk) {
                        return chunk.tryConsume((chunk)=>writer.write(chunk));
                    },
                    abort (reason) {
                        return writer.abort(reason);
                    },
                    close () {
                        return writer.close();
                    }
                });
            }
        }
        class ConsumableReadableStream extends stream_ReadableStream {
            static async enqueue(controller, chunk) {
                const output = new consumable_Consumable(chunk);
                controller.enqueue(output);
                await output.consumed;
            }
            constructor(source, strategy){
                let wrappedController;
                let wrappedStrategy;
                if (strategy) {
                    wrappedStrategy = {};
                    if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
                    if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk.value);
                }
                super({
                    start (controller) {
                        wrappedController = {
                            enqueue (chunk) {
                                return ConsumableReadableStream.enqueue(controller, chunk);
                            },
                            close () {
                                controller.close();
                            },
                            error (reason) {
                                controller.error(reason);
                            }
                        };
                        return source.start?.(wrappedController);
                    },
                    pull () {
                        return source.pull?.(wrappedController);
                    },
                    cancel (reason) {
                        return source.cancel?.(reason);
                    }
                }, wrappedStrategy);
            }
        }
        class ConsumableWrapByteReadableStream extends stream_ReadableStream {
            constructor(stream, chunkSize, min){
                const reader = stream.getReader({
                    mode: "byob"
                });
                let array = new Uint8Array(chunkSize);
                super({
                    async pull (controller) {
                        const { done, value } = await reader.read(array, {
                            min
                        });
                        if (done) return void controller.close();
                        await ConsumableReadableStream.enqueue(controller, value);
                        array = new Uint8Array(value.buffer);
                    },
                    cancel (reason) {
                        return reader.cancel(reason);
                    }
                });
            }
        }
        const { console: console1 } = globalThis;
        const createTask = /* #__PURE__ */ (()=>console1?.createTask?.bind(console1) ?? (()=>({
                    run (callback) {
                        return callback();
                    }
                })))();
        class consumable_Consumable {
            static WritableStream = ConsumableWritableStream;
            static WrapWritableStream = ConsumableWrapWritableStream;
            static ReadableStream = ConsumableReadableStream;
            static WrapByteReadableStream = ConsumableWrapByteReadableStream;
            #task;
            #resolver;
            value;
            consumed;
            constructor(value){
                this.#task = createTask("Consumable");
                this.value = value;
                this.#resolver = new PromiseResolver();
                this.consumed = this.#resolver.promise;
            }
            consume() {
                this.#resolver.resolve();
            }
            error(error) {
                this.#resolver.reject(error);
            }
            tryConsume(callback) {
                try {
                    let result = this.#task.run(()=>callback(this.value));
                    if (isPromiseLike(result)) result = result.then((value)=>{
                        this.#resolver.resolve();
                        return value;
                    }, (e)=>{
                        this.#resolver.reject(e);
                        throw e;
                    });
                    else this.#resolver.resolve();
                    return result;
                } catch (e) {
                    this.#resolver.reject(e);
                    throw e;
                }
            }
        }
        function tryConsume(value, callback) {
            if (value instanceof consumable_Consumable) return value.tryConsume(callback);
            return callback(value);
        }
        class MaybeConsumableWritableStream extends WritableStream {
            constructor(sink, strategy){
                let wrappedStrategy;
                if (strategy) {
                    wrappedStrategy = {};
                    if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
                    if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk instanceof consumable_Consumable ? chunk.value : chunk);
                }
                super({
                    start (controller) {
                        return sink.start?.(controller);
                    },
                    write (chunk, controller) {
                        return tryConsume(chunk, (chunk)=>sink.write?.(chunk, controller));
                    },
                    abort (reason) {
                        return sink.abort?.(reason);
                    },
                    close () {
                        return sink.close?.();
                    }
                }, wrappedStrategy);
            }
        }
        class AdbNoneProtocolPtyProcess {
            #socket;
            #writer;
            #input;
            get input() {
                return this.#input;
            }
            get output() {
                return this.#socket.readable;
            }
            get exited() {
                return this.#socket.closed;
            }
            constructor(socket){
                this.#socket = socket;
                this.#writer = this.#socket.writable.getWriter();
                this.#input = new MaybeConsumableWritableStream({
                    write: (chunk)=>this.#writer.write(chunk)
                });
            }
            sigint() {
                return this.#writer.write(new Uint8Array([
                    0x03
                ]));
            }
            kill() {
                return this.#socket.close();
            }
        }
        function escapeArg(s) {
            let result = "";
            result += "'";
            let base = 0;
            while(true){
                const found = s.indexOf("'", base);
                if (-1 === found) {
                    result += s.substring(base);
                    break;
                }
                result += s.substring(base, found);
                result += String.raw`'\''`;
                base = found + 1;
            }
            result += "'";
            return result;
        }
        function splitCommand(command) {
            const result = [];
            let quote;
            let isEscaped = false;
            let start = 0;
            for(let i = 0, len = command.length; i < len; i += 1){
                if (isEscaped) {
                    isEscaped = false;
                    continue;
                }
                const char = command.charAt(i);
                switch(char){
                    case " ":
                        if (!quote && i !== start) {
                            result.push(command.substring(start, i));
                            start = i + 1;
                        }
                        break;
                    case "'":
                    case '"':
                        if (quote) {
                            if (char === quote) quote = void 0;
                        } else quote = char;
                        break;
                    case "\\":
                        isEscaped = true;
                        break;
                }
            }
            if (start < command.length) result.push(command.substring(start));
            return result;
        }
        class AdbNoneProtocolSpawner {
            #spawn;
            constructor(spawn){
                this.#spawn = spawn;
            }
            spawn(command, signal) {
                signal?.throwIfAborted();
                if ("string" == typeof command) command = splitCommand(command);
                return this.#spawn(command, signal);
            }
            async spawnWait(command) {
                const process1 = await this.spawn(command);
                return await process1.output.pipeThrough(new ConcatBufferStream());
            }
            async spawnWaitText(command) {
                const process1 = await this.spawn(command);
                return await process1.output.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
            }
        }
        class AdbNoneProtocolSubprocessService extends AdbNoneProtocolSpawner {
            #adb;
            get adb() {
                return this.#adb;
            }
            constructor(adb){
                super(async (command, signal)=>{
                    const socket = await this.#adb.createSocket(`exec:${command.join(" ")}`);
                    if (signal?.aborted) {
                        await socket.close();
                        throw signal.reason;
                    }
                    return new AdbNoneProtocolProcessImpl(socket, signal);
                });
                this.#adb = adb;
            }
            async pty(command) {
                if (void 0 === command) command = "";
                else if (Array.isArray(command)) command = command.join(" ");
                return new AdbNoneProtocolPtyProcess(await this.#adb.createSocket(`shell:${command}`));
            }
        }
        class PushReadableStream extends stream_ReadableStream {
            constructor(source, strategy, logger){
                let waterMarkLow;
                let zeroHighWaterMarkAllowEnqueue = false;
                const abortController = new AbortController();
                super({
                    start: (controller)=>{
                        const result = source({
                            abortSignal: abortController.signal,
                            enqueue: async (chunk)=>{
                                logger?.({
                                    source: "producer",
                                    operation: "enqueue",
                                    value: chunk,
                                    phase: "start"
                                });
                                if (abortController.signal.aborted) return void logger?.({
                                    source: "producer",
                                    operation: "enqueue",
                                    value: chunk,
                                    phase: "ignored"
                                });
                                if (null === controller.desiredSize) return void controller.enqueue(chunk);
                                if (zeroHighWaterMarkAllowEnqueue) {
                                    zeroHighWaterMarkAllowEnqueue = false;
                                    controller.enqueue(chunk);
                                    logger?.({
                                        source: "producer",
                                        operation: "enqueue",
                                        value: chunk,
                                        phase: "complete"
                                    });
                                    return;
                                }
                                if (controller.desiredSize <= 0) {
                                    logger?.({
                                        source: "producer",
                                        operation: "enqueue",
                                        value: chunk,
                                        phase: "waiting"
                                    });
                                    waterMarkLow = new PromiseResolver();
                                    await waterMarkLow.promise;
                                    if (abortController.signal.aborted) return void logger?.({
                                        source: "producer",
                                        operation: "enqueue",
                                        value: chunk,
                                        phase: "ignored"
                                    });
                                }
                                controller.enqueue(chunk);
                                logger?.({
                                    source: "producer",
                                    operation: "enqueue",
                                    value: chunk,
                                    phase: "complete"
                                });
                            },
                            close () {
                                logger?.({
                                    source: "producer",
                                    operation: "close",
                                    explicit: true,
                                    phase: "start"
                                });
                                if (abortController.signal.aborted) return void logger?.({
                                    source: "producer",
                                    operation: "close",
                                    explicit: true,
                                    phase: "ignored"
                                });
                                controller.close();
                                logger?.({
                                    source: "producer",
                                    operation: "close",
                                    explicit: true,
                                    phase: "complete"
                                });
                            },
                            error (e) {
                                logger?.({
                                    source: "producer",
                                    operation: "error",
                                    explicit: true,
                                    phase: "start"
                                });
                                controller.error(e);
                                logger?.({
                                    source: "producer",
                                    operation: "error",
                                    explicit: true,
                                    phase: "complete"
                                });
                            }
                        });
                        if (result && "then" in result) result.then(()=>{
                            logger?.({
                                source: "producer",
                                operation: "close",
                                explicit: false,
                                phase: "start"
                            });
                            try {
                                controller.close();
                                logger?.({
                                    source: "producer",
                                    operation: "close",
                                    explicit: false,
                                    phase: "complete"
                                });
                            } catch  {
                                logger?.({
                                    source: "producer",
                                    operation: "close",
                                    explicit: false,
                                    phase: "ignored"
                                });
                            }
                        }, (e)=>{
                            logger?.({
                                source: "producer",
                                operation: "error",
                                explicit: false,
                                phase: "start"
                            });
                            controller.error(e);
                            logger?.({
                                source: "producer",
                                operation: "error",
                                explicit: false,
                                phase: "complete"
                            });
                        });
                    },
                    pull: ()=>{
                        logger?.({
                            source: "consumer",
                            operation: "pull",
                            phase: "start"
                        });
                        if (waterMarkLow) waterMarkLow.resolve();
                        else if (strategy?.highWaterMark === 0) zeroHighWaterMarkAllowEnqueue = true;
                        logger?.({
                            source: "consumer",
                            operation: "pull",
                            phase: "complete"
                        });
                    },
                    cancel: (reason)=>{
                        logger?.({
                            source: "consumer",
                            operation: "cancel",
                            phase: "start"
                        });
                        abortController.abort(reason);
                        waterMarkLow?.resolve();
                        logger?.({
                            source: "consumer",
                            operation: "cancel",
                            phase: "complete"
                        });
                    }
                }, strategy);
            }
        }
        class ExactReadableEndedError extends Error {
            constructor(){
                super("ExactReadable ended");
            }
        }
        class StructDeserializeError extends Error {
            constructor(message){
                super(message);
            }
        }
        class StructNotEnoughDataError extends StructDeserializeError {
            constructor(){
                super("The underlying readable was ended before the struct was fully deserialized");
            }
        }
        class StructEmptyError extends StructDeserializeError {
            constructor(){
                super("The underlying readable doesn't contain any more struct");
            }
        }
        function struct_struct(fields, options) {
            const fieldList = Object.entries(fields);
            let size = 0;
            let byob = true;
            for (const [, field] of fieldList){
                size += field.size;
                if (byob && "byob" !== field.type) byob = false;
            }
            const littleEndian = options.littleEndian;
            const extra = options.extra ? Object.getOwnPropertyDescriptors(options.extra) : void 0;
            return {
                littleEndian,
                fields,
                extra: options.extra,
                type: byob ? "byob" : "default",
                size,
                serialize (source, bufferOrContext) {
                    const temp = {
                        ...source
                    };
                    for (const [key, field] of fieldList)if (key in temp && "init" in field) {
                        const result = field.init?.(temp[key], temp);
                        temp[key] = result;
                    }
                    const sizes = new Array(fieldList.length);
                    const buffers = new Array(fieldList.length);
                    {
                        const context = {
                            littleEndian
                        };
                        for (const [index, [key, field]] of fieldList.entries())if ("byob" === field.type) sizes[index] = field.size;
                        else {
                            buffers[index] = field.serialize(temp[key], context);
                            sizes[index] = buffers[index].length;
                        }
                    }
                    const size = sizes.reduce((sum, size)=>sum + size, 0);
                    let externalBuffer;
                    let buffer;
                    let index;
                    if (bufferOrContext instanceof Uint8Array) {
                        if (bufferOrContext.length < size) throw new Error("Buffer too small");
                        externalBuffer = true;
                        buffer = bufferOrContext;
                        index = 0;
                    } else if ("object" == typeof bufferOrContext && "buffer" in bufferOrContext) {
                        externalBuffer = true;
                        buffer = bufferOrContext.buffer;
                        index = bufferOrContext.index ?? 0;
                        if (buffer.length - index < size) throw new Error("Buffer too small");
                    } else {
                        externalBuffer = false;
                        buffer = new Uint8Array(size);
                        index = 0;
                    }
                    const context = {
                        buffer,
                        index,
                        littleEndian
                    };
                    for (const [index, [key, field]] of fieldList.entries()){
                        if (buffers[index]) buffer.set(buffers[index], context.index);
                        else field.serialize(temp[key], context);
                        context.index += sizes[index];
                    }
                    if (externalBuffer) return size;
                    return buffer;
                },
                deserialize: bipedal(function*(then, reader) {
                    const startPosition = reader.position;
                    const result = {};
                    const context = {
                        dependencies: result,
                        littleEndian: littleEndian
                    };
                    try {
                        for (const [key, field] of fieldList)result[key] = yield* then(field.deserialize(reader, context));
                    } catch (e) {
                        if (!(e instanceof ExactReadableEndedError)) throw e;
                        if (reader.position === startPosition) throw new StructEmptyError();
                        throw new StructNotEnoughDataError();
                    }
                    if (extra) Object.defineProperties(result, extra);
                    if (options.postDeserialize) return options.postDeserialize.call(result, result);
                    return result;
                })
            };
        }
        function tryClose(controller) {
            try {
                controller.close();
                return true;
            } catch  {
                return false;
            }
        }
        async function tryCancel(stream) {
            try {
                await stream.cancel();
                return true;
            } catch  {
                return false;
            }
        }
        class BufferedReadableStream {
            #buffered;
            #bufferedOffset = 0;
            #bufferedLength = 0;
            #position = 0;
            get position() {
                return this.#position;
            }
            stream;
            reader;
            constructor(stream){
                this.stream = stream;
                this.reader = stream.getReader();
            }
            #readBuffered(length) {
                if (!this.#buffered) return;
                const value = this.#buffered.subarray(this.#bufferedOffset, this.#bufferedOffset + length);
                if (this.#bufferedLength > length) {
                    this.#position += length;
                    this.#bufferedOffset += length;
                    this.#bufferedLength -= length;
                    return value;
                }
                this.#position += this.#bufferedLength;
                this.#buffered = void 0;
                this.#bufferedOffset = 0;
                this.#bufferedLength = 0;
                return value;
            }
            async #readSource(length) {
                const { done, value } = await this.reader.read();
                if (done) throw new ExactReadableEndedError();
                if (value.length > length) {
                    this.#buffered = value;
                    this.#bufferedOffset = length;
                    this.#bufferedLength = value.length - length;
                    this.#position += length;
                    return value.subarray(0, length);
                }
                this.#position += value.length;
                return value;
            }
            iterateExactly(length) {
                let state = this.#buffered ? 0 : 1;
                return {
                    next: ()=>{
                        switch(state){
                            case 0:
                                {
                                    const value = this.#readBuffered(length);
                                    if (value.length === length) state = 2;
                                    else {
                                        length -= value.length;
                                        state = 1;
                                    }
                                    return {
                                        done: false,
                                        value
                                    };
                                }
                            case 1:
                                state = 3;
                                return {
                                    done: false,
                                    value: this.#readSource(length).then((value)=>{
                                        if (value.length === length) state = 2;
                                        else {
                                            length -= value.length;
                                            state = 1;
                                        }
                                        return value;
                                    })
                                };
                            case 2:
                                return {
                                    done: true,
                                    value: void 0
                                };
                            case 3:
                                throw new Error("Can't call `next` before previous Promise resolves");
                            default:
                                throw new Error("unreachable");
                        }
                    }
                };
            }
            readExactly = bipedal(function*(then, length) {
                let result;
                let index = 0;
                const initial = this.#readBuffered(length);
                if (initial) {
                    if (initial.length === length) return initial;
                    result = new Uint8Array(length);
                    result.set(initial, index);
                    index += initial.length;
                    length -= initial.length;
                } else result = new Uint8Array(length);
                while(length > 0){
                    const value = yield* then(this.#readSource(length));
                    result.set(value, index);
                    index += value.length;
                    length -= value.length;
                }
                return result;
            });
            release() {
                if (this.#bufferedLength > 0) return new PushReadableStream(async (controller)=>{
                    const buffered = this.#buffered.subarray(this.#bufferedOffset);
                    await controller.enqueue(buffered);
                    controller.abortSignal.addEventListener("abort", ()=>{
                        tryCancel(this.reader);
                    });
                    while(true){
                        const { done, value } = await this.reader.read();
                        if (done) return;
                        await controller.enqueue(value);
                    }
                });
                this.reader.releaseLock();
                return this.stream;
            }
            async cancel(reason) {
                await this.reader.cancel(reason);
            }
        }
        class BufferedTransformStream {
            #readable;
            get readable() {
                return this.#readable;
            }
            #writable;
            get writable() {
                return this.#writable;
            }
            constructor(transform){
                let bufferedStreamController;
                let writableStreamController;
                const buffered = new BufferedReadableStream(new PushReadableStream((controller)=>{
                    bufferedStreamController = controller;
                }));
                this.#readable = new stream_ReadableStream({
                    async pull (controller) {
                        try {
                            const value = await transform(buffered);
                            controller.enqueue(value);
                        } catch (e) {
                            if (e instanceof StructEmptyError) return void controller.close();
                            throw e;
                        }
                    },
                    cancel: (reason)=>writableStreamController.error(reason)
                });
                this.#writable = new WritableStream({
                    start (controller) {
                        writableStreamController = controller;
                    },
                    async write (chunk) {
                        await bufferedStreamController.enqueue(chunk);
                    },
                    abort () {
                        bufferedStreamController.close();
                    },
                    close () {
                        bufferedStreamController.close();
                    }
                });
            }
        }
        class StructDeserializeStream extends BufferedTransformStream {
            constructor(struct){
                super((stream)=>struct.deserialize(stream));
            }
        }
        function getUint32LittleEndian(buffer, offset) {
            return (buffer[offset] | buffer[offset + 1] << 8 | buffer[offset + 2] << 16 | buffer[offset + 3] << 24) >>> 0;
        }
        function getUint32(buffer, offset, littleEndian) {
            return littleEndian ? (buffer[offset] | buffer[offset + 1] << 8 | buffer[offset + 2] << 16 | buffer[offset + 3] << 24) >>> 0 : (buffer[offset] << 24 | buffer[offset + 1] << 16 | buffer[offset + 2] << 8 | buffer[offset + 3]) >>> 0;
        }
        function setUint32(buffer, offset, value, littleEndian) {
            if (littleEndian) {
                buffer[offset] = value;
                buffer[offset + 1] = value >> 8;
                buffer[offset + 2] = value >> 16;
                buffer[offset + 3] = value >> 24;
            } else {
                buffer[offset] = value >> 24;
                buffer[offset + 1] = value >> 16;
                buffer[offset + 2] = value >> 8;
                buffer[offset + 3] = value;
            }
        }
        function number(size, serialize, deserialize) {
            const fn = ()=>fn;
            Object.assign(fn, factory_field(size, "byob", serialize, deserialize));
            return fn;
        }
        const u8 = number(1, (value, { buffer, index })=>{
            buffer[index] = value;
        }, function*(then, reader) {
            const data = yield* then(reader.readExactly(1));
            return data[0];
        });
        const u32 = number(4, (value, { buffer, index, littleEndian })=>{
            setUint32(buffer, index, value, littleEndian);
        }, function*(then, reader, { littleEndian }) {
            const data = yield* then(reader.readExactly(4));
            return getUint32(data, 0, littleEndian);
        });
        const u64 = number(8, (value, { buffer, index, littleEndian })=>{
            setUint64(buffer, index, value, littleEndian);
        }, function*(then, reader, { littleEndian }) {
            const data = yield* then(reader.readExactly(8));
            return getUint64(data, 0, littleEndian);
        });
        const AdbShellProtocolId = {
            Stdin: 0,
            Stdout: 1,
            Stderr: 2,
            Exit: 3,
            CloseStdin: 4,
            WindowSizeChange: 5
        };
        const AdbShellProtocolPacket = struct_struct({
            id: u8(),
            data: buffer_buffer(u32)
        }, {
            littleEndian: true
        });
        class AdbShellProtocolProcessImpl {
            #socket;
            #writer;
            #stdin;
            get stdin() {
                return this.#stdin;
            }
            #stdout;
            get stdout() {
                return this.#stdout;
            }
            #stderr;
            get stderr() {
                return this.#stderr;
            }
            #exited;
            get exited() {
                return this.#exited;
            }
            constructor(socket, signal){
                this.#socket = socket;
                let stdoutController;
                let stderrController;
                this.#stdout = new PushReadableStream((controller)=>{
                    stdoutController = controller;
                });
                this.#stderr = new PushReadableStream((controller)=>{
                    stderrController = controller;
                });
                const exited = new PromiseResolver();
                this.#exited = exited.promise;
                socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
                    write: async (chunk)=>{
                        switch(chunk.id){
                            case AdbShellProtocolId.Exit:
                                exited.resolve(chunk.data[0]);
                                break;
                            case AdbShellProtocolId.Stdout:
                                await stdoutController.enqueue(chunk.data);
                                break;
                            case AdbShellProtocolId.Stderr:
                                await stderrController.enqueue(chunk.data);
                                break;
                            default:
                                break;
                        }
                    }
                })).then(()=>{
                    stdoutController.close();
                    stderrController.close();
                    exited.reject(new Error("Socket ended without exit message"));
                }, (e)=>{
                    stdoutController.error(e);
                    stderrController.error(e);
                    exited.reject(e);
                });
                if (signal) signal.addEventListener("abort", ()=>{
                    exited.reject(signal.reason);
                    this.#socket.close();
                });
                this.#writer = this.#socket.writable.getWriter();
                this.#stdin = new MaybeConsumableWritableStream({
                    write: async (chunk)=>{
                        await this.#writer.write(AdbShellProtocolPacket.serialize({
                            id: AdbShellProtocolId.Stdin,
                            data: chunk
                        }));
                    },
                    close: ()=>this.#writer.write(AdbShellProtocolPacket.serialize({
                            id: AdbShellProtocolId.CloseStdin,
                            data: EmptyUint8Array
                        }))
                });
            }
            kill() {
                return this.#socket.close();
            }
        }
        const { TextEncoder: TextEncoder1, TextDecoder: TextDecoder1 } = globalThis;
        const SharedEncoder = /* #__PURE__ */ new TextEncoder1();
        const SharedDecoder = /* #__PURE__ */ new TextDecoder1();
        function encodeUtf8(input) {
            return SharedEncoder.encode(input);
        }
        function decodeUtf8(buffer) {
            return SharedDecoder.decode(buffer);
        }
        class AdbShellProtocolPtyProcess {
            #socket;
            #writer;
            #input;
            get input() {
                return this.#input;
            }
            #stdout;
            get output() {
                return this.#stdout;
            }
            #exited = new PromiseResolver();
            get exited() {
                return this.#exited.promise;
            }
            constructor(socket){
                this.#socket = socket;
                let stdoutController;
                this.#stdout = new PushReadableStream((controller)=>{
                    stdoutController = controller;
                });
                socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
                    write: async (chunk)=>{
                        switch(chunk.id){
                            case AdbShellProtocolId.Exit:
                                this.#exited.resolve(chunk.data[0]);
                                break;
                            case AdbShellProtocolId.Stdout:
                                await stdoutController.enqueue(chunk.data);
                                break;
                        }
                    }
                })).then(()=>{
                    stdoutController.close();
                    this.#exited.reject(new Error("Socket ended without exit message"));
                }, (e)=>{
                    stdoutController.error(e);
                    this.#exited.reject(e);
                });
                this.#writer = this.#socket.writable.getWriter();
                this.#input = new MaybeConsumableWritableStream({
                    write: (chunk)=>this.#writeStdin(chunk)
                });
            }
            #writeStdin(chunk) {
                return this.#writer.write(AdbShellProtocolPacket.serialize({
                    id: AdbShellProtocolId.Stdin,
                    data: chunk
                }));
            }
            async resize(rows, cols) {
                await this.#writer.write(AdbShellProtocolPacket.serialize({
                    id: AdbShellProtocolId.WindowSizeChange,
                    data: encodeUtf8(`${rows}x${cols},0x0\0`)
                }));
            }
            sigint() {
                return this.#writeStdin(new Uint8Array([
                    0x03
                ]));
            }
            kill() {
                return this.#socket.close();
            }
        }
        class AdbShellProtocolSpawner {
            #spawn;
            constructor(spawn){
                this.#spawn = spawn;
            }
            spawn(command, signal) {
                signal?.throwIfAborted();
                if ("string" == typeof command) command = splitCommand(command);
                return this.#spawn(command, signal);
            }
            async spawnWait(command) {
                const process1 = await this.spawn(command);
                const [stdout, stderr, exitCode] = await Promise.all([
                    process1.stdout.pipeThrough(new ConcatBufferStream()),
                    process1.stderr.pipeThrough(new ConcatBufferStream()),
                    process1.exited
                ]);
                return {
                    stdout,
                    stderr,
                    exitCode
                };
            }
            async spawnWaitText(command) {
                const process1 = await this.spawn(command);
                const [stdout, stderr, exitCode] = await Promise.all([
                    process1.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
                    process1.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
                    process1.exited
                ]);
                return {
                    stdout,
                    stderr,
                    exitCode
                };
            }
        }
        class AdbShellProtocolSubprocessService extends AdbShellProtocolSpawner {
            #adb;
            get adb() {
                return this.#adb;
            }
            get isSupported() {
                return this.#adb.canUseFeature(AdbFeature.ShellV2);
            }
            constructor(adb){
                super(async (command, signal)=>{
                    const socket = await this.#adb.createSocket(`shell,v2,raw:${command.join(" ")}`);
                    if (signal?.aborted) {
                        await socket.close();
                        throw signal.reason;
                    }
                    return new AdbShellProtocolProcessImpl(socket, signal);
                });
                this.#adb = adb;
            }
            async pty(options) {
                let service = "shell,v2,pty";
                if (options?.terminalType) service += ",TERM=" + options.terminalType;
                service += ":";
                if (options) {
                    if ("string" == typeof options.command) service += options.command;
                    else if (Array.isArray(options.command)) service += options.command.join(" ");
                }
                return new AdbShellProtocolPtyProcess(await this.#adb.createSocket(service));
            }
        }
        class AdbSubprocessService {
            #adb;
            get adb() {
                return this.#adb;
            }
            #noneProtocol;
            get noneProtocol() {
                return this.#noneProtocol;
            }
            #shellProtocol;
            get shellProtocol() {
                return this.#shellProtocol;
            }
            constructor(adb){
                this.#adb = adb;
                this.#noneProtocol = new AdbNoneProtocolSubprocessService(adb);
                if (adb.canUseFeature(AdbFeature.ShellV2)) this.#shellProtocol = new AdbShellProtocolSubprocessService(adb);
            }
        }
        class AutoDisposable {
            #disposables = [];
            constructor(){
                this.dispose = this.dispose.bind(this);
            }
            addDisposable(disposable) {
                this.#disposables.push(disposable);
                return disposable;
            }
            dispose() {
                for (const disposable of this.#disposables)disposable.dispose();
                this.#disposables = [];
            }
        }
        class AdbServiceBase extends AutoDisposable {
            #adb;
            get adb() {
                return this.#adb;
            }
            constructor(adb){
                super();
                this.#adb = adb;
            }
        }
        class AdbPower extends AdbServiceBase {
            reboot(mode = "") {
                return this.adb.createSocketAndWait(`reboot:${mode}`);
            }
            bootloader() {
                return this.reboot("bootloader");
            }
            fastboot() {
                return this.reboot("fastboot");
            }
            recovery() {
                return this.reboot("recovery");
            }
            sideload() {
                return this.reboot("sideload");
            }
            qualcommEdlMode() {
                return this.reboot("edl");
            }
            powerOff() {
                return this.adb.subprocess.noneProtocol.spawnWaitText([
                    "reboot",
                    "-p"
                ]);
            }
            powerButton(longPress = false) {
                const args = [
                    "input",
                    "keyevent"
                ];
                if (longPress) args.push("--longpress");
                args.push("POWER");
                return this.adb.subprocess.noneProtocol.spawnWaitText(args);
            }
            samsungOdin() {
                return this.reboot("download");
            }
        }
        const string = (lengthOrField)=>{
            const field = buffer_buffer(lengthOrField, {
                convert: decodeUtf8,
                back: encodeUtf8
            });
            field.as = ()=>field;
            return field;
        };
        function extend(base, fields, options) {
            return struct_struct(Object.assign({}, base.fields, fields), {
                littleEndian: options?.littleEndian ?? base.littleEndian,
                extra: base.extra,
                postDeserialize: options?.postDeserialize
            });
        }
        function sequenceEqual(a, b) {
            if (a.length !== b.length) return false;
            for(let i = 0; i < a.length; i += 1)if (a[i] !== b[i]) return false;
            return true;
        }
        function hexCharToNumber(char) {
            if (char < 48) throw new TypeError(`Invalid hex char ${char}`);
            if (char < 58) return char - 48;
            if (char < 65) throw new TypeError(`Invalid hex char ${char}`);
            if (char < 71) return char - 55;
            if (char < 97) throw new TypeError(`Invalid hex char ${char}`);
            if (char < 103) return char - 87;
            throw new TypeError(`Invalid hex char ${char}`);
        }
        function hexToNumber(data) {
            let result = 0;
            for(let i = 0; i < data.length; i += 1)result = result << 4 | hexCharToNumber(data[i]);
            return result;
        }
        function write4HexDigits(buffer, index, value) {
            const start = index;
            index += 3;
            while(index >= start && value > 0){
                const digit = 0xf & value;
                value >>= 4;
                if (digit < 10) buffer[index] = digit + 48;
                else buffer[index] = digit + 87;
                index -= 1;
            }
            while(index >= start){
                buffer[index] = 48;
                index -= 1;
            }
        }
        const AdbReverseStringResponse = struct_struct({
            length: string(4),
            content: string({
                field: "length",
                convert (value) {
                    return Number.parseInt(value, 16);
                },
                back (value) {
                    return value.toString(16).padStart(4, "0");
                }
            })
        }, {
            littleEndian: true
        });
        class AdbReverseError extends Error {
            constructor(message){
                super(message);
            }
        }
        class AdbReverseNotSupportedError extends AdbReverseError {
            constructor(){
                super("ADB reverse tunnel is not supported on this device when connected wirelessly.");
            }
        }
        const AdbReverseErrorResponse = extend(AdbReverseStringResponse, {}, {
            postDeserialize (value) {
                if ("more than one device/emulator" === value.content) throw new AdbReverseNotSupportedError();
                throw new AdbReverseError(value.content);
            }
        });
        function decimalToNumber(buffer) {
            let value = 0;
            for (const byte of buffer){
                if (byte < 48 || byte > 57) break;
                value = 10 * value + byte - 48;
            }
            return value;
        }
        const OKAY = encodeUtf8("OKAY");
        class AdbReverseService extends AdbServiceBase {
            #deviceAddressToLocalAddress = new Map();
            async createBufferedStream(service) {
                const socket = await this.adb.createSocket(service);
                return new BufferedReadableStream(socket.readable);
            }
            async sendRequest(service) {
                const stream = await this.createBufferedStream(service);
                const response = await stream.readExactly(4);
                if (!sequenceEqual(response, OKAY)) await AdbReverseErrorResponse.deserialize(stream);
                return stream;
            }
            async list() {
                const stream = await this.createBufferedStream("reverse:list-forward");
                const response = await AdbReverseStringResponse.deserialize(stream);
                return response.content.split("\n").filter((line)=>!!line).map((line)=>{
                    const [deviceSerial, localName, remoteName] = line.split(" ");
                    return {
                        deviceSerial,
                        localName,
                        remoteName
                    };
                });
            }
            async addExternal(deviceAddress, localAddress) {
                const stream = await this.sendRequest(`reverse:forward:${deviceAddress};${localAddress}`);
                if (deviceAddress.startsWith("tcp:")) {
                    const position = stream.position;
                    try {
                        const length = hexToNumber(await stream.readExactly(4));
                        const port = decimalToNumber(await stream.readExactly(length));
                        deviceAddress = `tcp:${port}`;
                    } catch (e) {
                        if (e instanceof ExactReadableEndedError && stream.position === position) ;
                        else throw e;
                    }
                }
                return deviceAddress;
            }
            async add(deviceAddress, handler, localAddress) {
                localAddress = await this.adb.transport.addReverseTunnel(handler, localAddress);
                try {
                    deviceAddress = await this.addExternal(deviceAddress, localAddress);
                    this.#deviceAddressToLocalAddress.set(deviceAddress, localAddress);
                    return deviceAddress;
                } catch (e) {
                    await this.adb.transport.removeReverseTunnel(localAddress);
                    throw e;
                }
            }
            async remove(deviceAddress) {
                const localAddress = this.#deviceAddressToLocalAddress.get(deviceAddress);
                if (localAddress) await this.adb.transport.removeReverseTunnel(localAddress);
                await this.sendRequest(`reverse:killforward:${deviceAddress}`);
            }
            async removeAll() {
                await this.adb.transport.clearReverseTunnels();
                this.#deviceAddressToLocalAddress.clear();
                await this.sendRequest("reverse:killforward-all");
            }
        }
        function parsePort(value) {
            if (!value || "0" === value) return;
            return Number.parseInt(value, 10);
        }
        class AdbTcpIpService extends AdbServiceBase {
            async getListenAddresses() {
                const serviceListenAddresses = await this.adb.getProp("service.adb.listen_addrs");
                const servicePort = await this.adb.getProp("service.adb.tcp.port");
                const persistPort = await this.adb.getProp("persist.adb.tcp.port");
                return {
                    serviceListenAddresses: "" != serviceListenAddresses ? serviceListenAddresses.split(",") : [],
                    servicePort: parsePort(servicePort),
                    persistPort: parsePort(persistPort)
                };
            }
            async setPort(port) {
                if (port <= 0) throw new TypeError(`Invalid port ${port}`);
                const output = await this.adb.createSocketAndWait(`tcpip:${port}`);
                if (output !== `restarting in TCP mode port: ${port}\n`) throw new Error(output);
                return output;
            }
            async disable() {
                const output = await this.adb.createSocketAndWait("usb:");
                if ("restarting in USB mode\n" !== output) throw new Error(output);
                return output;
            }
        }
        const NOOP = ()=>{};
        function unreachable(...args) {
            throw new Error("Unreachable. Arguments:\n" + args.join("\n"));
        }
        function encodeAsciiUnchecked(value) {
            const result = new Uint8Array(value.length);
            for(let i = 0; i < value.length; i += 1)result[i] = value.charCodeAt(i);
            return result;
        }
        function adbSyncEncodeId(value) {
            const buffer = encodeAsciiUnchecked(value);
            return getUint32LittleEndian(buffer, 0);
        }
        const AdbSyncResponseId = {
            Entry: adbSyncEncodeId("DENT"),
            Entry2: adbSyncEncodeId("DNT2"),
            Lstat: adbSyncEncodeId("STAT"),
            Stat: adbSyncEncodeId("STA2"),
            Lstat2: adbSyncEncodeId("LST2"),
            Done: adbSyncEncodeId("DONE"),
            Data: adbSyncEncodeId("DATA"),
            Ok: adbSyncEncodeId("OKAY"),
            Fail: adbSyncEncodeId("FAIL")
        };
        class AdbSyncError extends Error {
        }
        const AdbSyncFailResponse = struct_struct({
            message: string(u32)
        }, {
            littleEndian: true,
            postDeserialize (value) {
                throw new AdbSyncError(value.message);
            }
        });
        async function adbSyncReadResponse(stream, id, type) {
            if ("string" == typeof id) id = adbSyncEncodeId(id);
            const buffer = await stream.readExactly(4);
            switch(getUint32LittleEndian(buffer, 0)){
                case AdbSyncResponseId.Fail:
                    await AdbSyncFailResponse.deserialize(stream);
                    throw new Error("Unreachable");
                case id:
                    return await type.deserialize(stream);
                default:
                    throw new Error(`Expected '${id}', but got '${decodeUtf8(buffer)}'`);
            }
        }
        async function* adbSyncReadResponses(stream, id, type) {
            if ("string" == typeof id) id = adbSyncEncodeId(id);
            while(true){
                const buffer = await stream.readExactly(4);
                switch(getUint32LittleEndian(buffer, 0)){
                    case AdbSyncResponseId.Fail:
                        await AdbSyncFailResponse.deserialize(stream);
                        unreachable();
                    case AdbSyncResponseId.Done:
                        await stream.readExactly(type.size);
                        return;
                    case id:
                        yield await type.deserialize(stream);
                        break;
                    default:
                        throw new Error(`Expected '${id}' or '${AdbSyncResponseId.Done}', but got '${decodeUtf8(buffer)}'`);
                }
            }
        }
        const AdbSyncRequestId = {
            List: adbSyncEncodeId("LIST"),
            ListV2: adbSyncEncodeId("LIS2"),
            Send: adbSyncEncodeId("SEND"),
            SendV2: adbSyncEncodeId("SND2"),
            Lstat: adbSyncEncodeId("STAT"),
            Stat: adbSyncEncodeId("STA2"),
            LstatV2: adbSyncEncodeId("LST2"),
            Data: adbSyncEncodeId("DATA"),
            Done: adbSyncEncodeId("DONE"),
            Receive: adbSyncEncodeId("RECV")
        };
        const AdbSyncNumberRequest = struct_struct({
            id: u32,
            arg: u32
        }, {
            littleEndian: true
        });
        async function adbSyncWriteRequest(writable, id, value) {
            if ("string" == typeof id) id = adbSyncEncodeId(id);
            if ("number" == typeof value) return void await writable.write(AdbSyncNumberRequest.serialize({
                id,
                arg: value
            }));
            if ("string" == typeof value) value = encodeUtf8(value);
            await writable.write(AdbSyncNumberRequest.serialize({
                id,
                arg: value.length
            }));
            await writable.write(value);
        }
        const LinuxFileType = {
            Directory: 4,
            File: 8,
            Link: 10
        };
        const AdbSyncLstatResponse = struct_struct({
            mode: u32,
            size: u32,
            mtime: u32
        }, {
            littleEndian: true,
            extra: {
                get type () {
                    return this.mode >> 12;
                },
                get permission () {
                    return 4095 & this.mode;
                }
            },
            postDeserialize (value) {
                if (0 === value.mode && 0 === value.size && 0 === value.mtime) throw new Error("lstat error");
                return value;
            }
        });
        const AdbSyncStatErrorCode = {
            SUCCESS: 0,
            EACCES: 13,
            EEXIST: 17,
            EFAULT: 14,
            EFBIG: 27,
            EINTR: 4,
            EINVAL: 22,
            EIO: 5,
            EISDIR: 21,
            ELOOP: 40,
            EMFILE: 24,
            ENAMETOOLONG: 36,
            ENFILE: 23,
            ENOENT: 2,
            ENOMEM: 12,
            ENOSPC: 28,
            ENOTDIR: 20,
            EOVERFLOW: 75,
            EPERM: 1,
            EROFS: 30,
            ETXTBSY: 26
        };
        const AdbSyncStatErrorName = /* #__PURE__ */ (()=>Object.fromEntries(Object.entries(AdbSyncStatErrorCode).map(([key, value])=>[
                    value,
                    key
                ])))();
        const AdbSyncStatResponse = struct_struct({
            error: u32(),
            dev: u64,
            ino: u64,
            mode: u32,
            nlink: u32,
            uid: u32,
            gid: u32,
            size: u64,
            atime: u64,
            mtime: u64,
            ctime: u64
        }, {
            littleEndian: true,
            extra: {
                get type () {
                    return this.mode >> 12;
                },
                get permission () {
                    return 4095 & this.mode;
                }
            },
            postDeserialize (value) {
                if (value.error) throw new Error(AdbSyncStatErrorName[value.error]);
                return value;
            }
        });
        async function adbSyncLstat(socket, path, v2) {
            const locked = await socket.lock();
            try {
                if (v2) {
                    await adbSyncWriteRequest(locked, AdbSyncRequestId.LstatV2, path);
                    return await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat2, AdbSyncStatResponse);
                }
                {
                    await adbSyncWriteRequest(locked, AdbSyncRequestId.Lstat, path);
                    const response = await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat, AdbSyncLstatResponse);
                    return {
                        mode: response.mode,
                        size: BigInt(response.size),
                        mtime: BigInt(response.mtime),
                        get type () {
                            return response.type;
                        },
                        get permission () {
                            return response.permission;
                        }
                    };
                }
            } finally{
                locked.release();
            }
        }
        async function adbSyncStat(socket, path) {
            const locked = await socket.lock();
            try {
                await adbSyncWriteRequest(locked, AdbSyncRequestId.Stat, path);
                return await adbSyncReadResponse(locked, AdbSyncResponseId.Stat, AdbSyncStatResponse);
            } finally{
                locked.release();
            }
        }
        const AdbSyncEntryResponse = extend(AdbSyncLstatResponse, {
            name: string(u32)
        });
        const AdbSyncEntry2Response = extend(AdbSyncStatResponse, {
            name: string(u32)
        });
        async function* adbSyncOpenDirV2(socket, path) {
            const locked = await socket.lock();
            try {
                await adbSyncWriteRequest(locked, AdbSyncRequestId.ListV2, path);
                for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry2, AdbSyncEntry2Response))if (item.error === AdbSyncStatErrorCode.SUCCESS) yield item;
            } finally{
                locked.release();
            }
        }
        async function* adbSyncOpenDirV1(socket, path) {
            const locked = await socket.lock();
            try {
                await adbSyncWriteRequest(locked, AdbSyncRequestId.List, path);
                for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry, AdbSyncEntryResponse))yield item;
            } finally{
                locked.release();
            }
        }
        async function* adbSyncOpenDir(socket, path, v2) {
            if (v2) yield* adbSyncOpenDirV2(socket, path);
            else for await (const item of adbSyncOpenDirV1(socket, path))yield {
                mode: item.mode,
                size: BigInt(item.size),
                mtime: BigInt(item.mtime),
                get type () {
                    return item.type;
                },
                get permission () {
                    return item.permission;
                },
                name: item.name
            };
        }
        const AdbSyncDataResponse = struct_struct({
            data: buffer_buffer(u32)
        }, {
            littleEndian: true
        });
        async function* adbSyncPullGenerator(socket, path) {
            const locked = await socket.lock();
            let done = false;
            try {
                await adbSyncWriteRequest(locked, AdbSyncRequestId.Receive, path);
                for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse))yield packet.data;
                done = true;
            } catch (e) {
                done = true;
                throw e;
            } finally{
                if (!done) for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse));
                locked.release();
            }
        }
        function adbSyncPull(socket, path) {
            return stream_ReadableStream.from(adbSyncPullGenerator(socket, path));
        }
        class BufferCombiner {
            #capacity;
            #buffer;
            #offset;
            #available;
            constructor(size){
                this.#capacity = size;
                this.#buffer = new Uint8Array(size);
                this.#offset = 0;
                this.#available = size;
            }
            *push(data) {
                let offset = 0;
                let available = data.length;
                if (0 !== this.#offset) if (available >= this.#available) {
                    this.#buffer.set(data.subarray(0, this.#available), this.#offset);
                    offset += this.#available;
                    available -= this.#available;
                    yield this.#buffer;
                    this.#offset = 0;
                    this.#available = this.#capacity;
                    if (0 === available) return;
                } else {
                    this.#buffer.set(data, this.#offset);
                    this.#offset += available;
                    this.#available -= available;
                    return;
                }
                while(available >= this.#capacity){
                    const end = offset + this.#capacity;
                    yield data.subarray(offset, end);
                    offset = end;
                    available -= this.#capacity;
                }
                if (available > 0) {
                    this.#buffer.set(data.subarray(offset), this.#offset);
                    this.#offset += available;
                    this.#available -= available;
                }
            }
            flush() {
                if (0 === this.#offset) return;
                const output = this.#buffer.subarray(0, this.#offset);
                this.#offset = 0;
                this.#available = this.#capacity;
                return output;
            }
        }
        class DistributionStream extends TransformStream {
            constructor(size, combine = false){
                const combiner = combine ? new BufferCombiner(size) : void 0;
                super({
                    async transform (chunk, controller) {
                        await tryConsume(chunk, async (chunk)=>{
                            if (combiner) for (const buffer of combiner.push(chunk))await consumable_Consumable.ReadableStream.enqueue(controller, buffer);
                            else {
                                let offset = 0;
                                let available = chunk.length;
                                while(available > 0){
                                    const end = offset + size;
                                    await consumable_Consumable.ReadableStream.enqueue(controller, chunk.subarray(offset, end));
                                    offset = end;
                                    available -= size;
                                }
                            }
                        });
                    },
                    flush (controller) {
                        if (combiner) {
                            const data = combiner.flush();
                            if (data) controller.enqueue(data);
                        }
                    }
                });
            }
        }
        const ADB_SYNC_MAX_PACKET_SIZE = 65536;
        const AdbSyncOkResponse = struct_struct({
            unused: u32
        }, {
            littleEndian: true
        });
        async function pipeFileData(locked, file, packetSize, mtime) {
            const abortController = new AbortController();
            file.pipeThrough(new DistributionStream(packetSize, true)).pipeTo(new MaybeConsumableWritableStream({
                write (chunk) {
                    return adbSyncWriteRequest(locked, AdbSyncRequestId.Data, chunk);
                }
            }), {
                signal: abortController.signal
            }).then(async ()=>{
                await adbSyncWriteRequest(locked, AdbSyncRequestId.Done, mtime);
                await locked.flush();
            }, NOOP);
            await adbSyncReadResponse(locked, AdbSyncResponseId.Ok, AdbSyncOkResponse).catch((e)=>{
                abortController.abort();
                throw e;
            });
        }
        async function adbSyncPushV1({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1000 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE }) {
            const locked = await socket.lock();
            try {
                const mode = type << 12 | permission;
                const pathAndMode = `${filename},${mode.toString()}`;
                await adbSyncWriteRequest(locked, AdbSyncRequestId.Send, pathAndMode);
                await pipeFileData(locked, file, packetSize, mtime);
            } finally{
                locked.release();
            }
        }
        const AdbSyncSendV2Flags = {
            None: 0,
            Brotli: 1,
            Lz4: 2,
            Zstd: 4,
            DryRun: 0x80000000
        };
        const AdbSyncSendV2Request = struct_struct({
            id: u32,
            mode: u32,
            flags: u32()
        }, {
            littleEndian: true
        });
        async function adbSyncPushV2({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1000 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE, dryRun = false }) {
            const locked = await socket.lock();
            try {
                await adbSyncWriteRequest(locked, AdbSyncRequestId.SendV2, filename);
                const mode = type << 12 | permission;
                let flags = AdbSyncSendV2Flags.None;
                if (dryRun) flags |= AdbSyncSendV2Flags.DryRun;
                await locked.write(AdbSyncSendV2Request.serialize({
                    id: AdbSyncRequestId.SendV2,
                    mode,
                    flags
                }));
                await pipeFileData(locked, file, packetSize, mtime);
            } finally{
                locked.release();
            }
        }
        function adbSyncPush(options) {
            if (options.v2) return adbSyncPushV2(options);
            if (options.dryRun) throw new Error("dryRun is not supported in v1");
            return adbSyncPushV1(options);
        }
        class AutoResetEvent {
            #set;
            #queue = [];
            constructor(initialSet = false){
                this.#set = initialSet;
            }
            wait() {
                if (!this.#set) {
                    this.#set = true;
                    if (0 === this.#queue.length) return Promise.resolve();
                }
                const resolver = new PromiseResolver();
                this.#queue.push(resolver);
                return resolver.promise;
            }
            notifyOne() {
                if (0 !== this.#queue.length) this.#queue.pop().resolve();
                else this.#set = false;
            }
            dispose() {
                for (const item of this.#queue)item.reject(new Error("The AutoResetEvent has been disposed"));
                this.#queue.length = 0;
            }
        }
        class AdbSyncSocketLocked {
            #writer;
            #readable;
            #socketLock;
            #writeLock = new AutoResetEvent();
            #combiner;
            get position() {
                return this.#readable.position;
            }
            constructor(writer, readable, bufferSize, lock){
                this.#writer = writer;
                this.#readable = readable;
                this.#socketLock = lock;
                this.#combiner = new BufferCombiner(bufferSize);
            }
            #write(buffer) {
                return consumable_Consumable.WritableStream.write(this.#writer, buffer);
            }
            async flush() {
                try {
                    await this.#writeLock.wait();
                    const buffer = this.#combiner.flush();
                    if (buffer) await this.#write(buffer);
                } finally{
                    this.#writeLock.notifyOne();
                }
            }
            async write(data) {
                try {
                    await this.#writeLock.wait();
                    for (const buffer of this.#combiner.push(data))await this.#write(buffer);
                } finally{
                    this.#writeLock.notifyOne();
                }
            }
            async readExactly(length) {
                await this.flush();
                return await this.#readable.readExactly(length);
            }
            release() {
                this.#combiner.flush();
                this.#socketLock.notifyOne();
            }
            async close() {
                await this.#readable.cancel();
            }
        }
        class AdbSyncSocket {
            #lock = new AutoResetEvent();
            #socket;
            #locked;
            constructor(socket, bufferSize){
                this.#socket = socket;
                this.#locked = new AdbSyncSocketLocked(socket.writable.getWriter(), new BufferedReadableStream(socket.readable), bufferSize, this.#lock);
            }
            async lock() {
                await this.#lock.wait();
                return this.#locked;
            }
            async close() {
                await this.#locked.close();
                await this.#socket.close();
            }
        }
        function dirname(path) {
            const end = path.lastIndexOf("/");
            if (-1 === end) throw new Error("Invalid path");
            if (0 === end) return "/";
            return path.substring(0, end);
        }
        class AdbSync {
            _adb;
            _socket;
            #supportsStat;
            #supportsListV2;
            #fixedPushMkdir;
            #supportsSendReceiveV2;
            #needPushMkdirWorkaround;
            get supportsStat() {
                return this.#supportsStat;
            }
            get supportsListV2() {
                return this.#supportsListV2;
            }
            get fixedPushMkdir() {
                return this.#fixedPushMkdir;
            }
            get supportsSendReceiveV2() {
                return this.#supportsSendReceiveV2;
            }
            get needPushMkdirWorkaround() {
                return this.#needPushMkdirWorkaround;
            }
            constructor(adb, socket){
                this._adb = adb;
                this._socket = new AdbSyncSocket(socket, adb.maxPayloadSize);
                this.#supportsStat = adb.canUseFeature(AdbFeature.StatV2);
                this.#supportsListV2 = adb.canUseFeature(AdbFeature.ListV2);
                this.#fixedPushMkdir = adb.canUseFeature(AdbFeature.FixedPushMkdir);
                this.#supportsSendReceiveV2 = adb.canUseFeature(AdbFeature.SendReceiveV2);
                this.#needPushMkdirWorkaround = this._adb.canUseFeature(AdbFeature.ShellV2) && !this.fixedPushMkdir;
            }
            async lstat(path) {
                return await adbSyncLstat(this._socket, path, this.#supportsStat);
            }
            async stat(path) {
                if (!this.#supportsStat) throw new Error("Not supported");
                return await adbSyncStat(this._socket, path);
            }
            async isDirectory(path) {
                try {
                    await this.lstat(path + "/");
                    return true;
                } catch  {
                    return false;
                }
            }
            opendir(path) {
                return adbSyncOpenDir(this._socket, path, this.supportsListV2);
            }
            async readdir(path) {
                const results = [];
                for await (const entry of this.opendir(path))results.push(entry);
                return results;
            }
            read(filename) {
                return adbSyncPull(this._socket, filename);
            }
            async write(options) {
                if (this.needPushMkdirWorkaround) await this._adb.subprocess.noneProtocol.spawnWait([
                    "mkdir",
                    "-p",
                    escapeArg(dirname(options.filename))
                ]);
                await adbSyncPush({
                    v2: this.supportsSendReceiveV2,
                    socket: this._socket,
                    ...options
                });
            }
            lockSocket() {
                return this._socket.lock();
            }
            dispose() {
                return this._socket.close();
            }
        }
        const Version = struct_struct({
            version: u32
        }, {
            littleEndian: true
        });
        const AdbFrameBufferV1 = struct_struct({
            bpp: u32,
            size: u32,
            width: u32,
            height: u32,
            red_offset: u32,
            red_length: u32,
            blue_offset: u32,
            blue_length: u32,
            green_offset: u32,
            green_length: u32,
            alpha_offset: u32,
            alpha_length: u32,
            data: buffer_buffer("size")
        }, {
            littleEndian: true
        });
        const AdbFrameBufferV2 = struct_struct({
            bpp: u32,
            colorSpace: u32,
            size: u32,
            width: u32,
            height: u32,
            red_offset: u32,
            red_length: u32,
            blue_offset: u32,
            blue_length: u32,
            green_offset: u32,
            green_length: u32,
            alpha_offset: u32,
            alpha_length: u32,
            data: buffer_buffer("size")
        }, {
            littleEndian: true
        });
        class AdbFrameBufferError extends Error {
            constructor(message, options){
                super(message, options);
            }
        }
        class AdbFrameBufferUnsupportedVersionError extends AdbFrameBufferError {
            constructor(version){
                super(`Unsupported FrameBuffer version ${version}`);
            }
        }
        class AdbFrameBufferForbiddenError extends AdbFrameBufferError {
            constructor(){
                super("FrameBuffer is disabled by current app");
            }
        }
        async function framebuffer(adb) {
            const socket = await adb.createSocket("framebuffer:");
            const stream = new BufferedReadableStream(socket.readable);
            let version;
            try {
                ({ version } = await Version.deserialize(stream));
            } catch (e) {
                if (e instanceof StructEmptyError) throw new AdbFrameBufferForbiddenError();
                throw e;
            }
            switch(version){
                case 1:
                    return await AdbFrameBufferV1.deserialize(stream);
                case 2:
                    return await AdbFrameBufferV2.deserialize(stream);
                default:
                    throw new AdbFrameBufferUnsupportedVersionError(version);
            }
        }
        class Adb {
            #transport;
            get transport() {
                return this.#transport;
            }
            get serial() {
                return this.#transport.serial;
            }
            get maxPayloadSize() {
                return this.#transport.maxPayloadSize;
            }
            get banner() {
                return this.#transport.banner;
            }
            get disconnected() {
                return this.#transport.disconnected;
            }
            get clientFeatures() {
                return this.#transport.clientFeatures;
            }
            get deviceFeatures() {
                return this.banner.features;
            }
            subprocess;
            power;
            reverse;
            tcpip;
            constructor(transport){
                this.#transport = transport;
                this.subprocess = new AdbSubprocessService(this);
                this.power = new AdbPower(this);
                this.reverse = new AdbReverseService(this);
                this.tcpip = new AdbTcpIpService(this);
            }
            canUseFeature(feature) {
                return this.clientFeatures.includes(feature) && this.deviceFeatures.includes(feature);
            }
            async createSocket(service) {
                return this.#transport.connect(service);
            }
            async createSocketAndWait(service) {
                const socket = await this.createSocket(service);
                return await socket.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
            }
            getProp(key) {
                return this.subprocess.noneProtocol.spawnWaitText([
                    "getprop",
                    key
                ]).then((output)=>output.trim());
            }
            rm(filenames, options) {
                const args = [
                    "rm"
                ];
                if (options?.recursive) args.push("-r");
                if (options?.force) args.push("-f");
                if (Array.isArray(filenames)) for (const filename of filenames)args.push(escapeArg(filename));
                else args.push(escapeArg(filenames));
                args.push("</dev/null");
                return this.subprocess.noneProtocol.spawnWaitText(args);
            }
            async sync() {
                const socket = await this.createSocket("sync:");
                return new AdbSync(this, socket);
            }
            async framebuffer() {
                return framebuffer(this);
            }
            async close() {
                await this.#transport.close();
            }
        }
        const AdbBannerKey = {
            Product: "ro.product.name",
            Model: "ro.product.model",
            Device: "ro.product.device",
            Features: "features"
        };
        class AdbBanner {
            static parse(banner) {
                let product;
                let model;
                let device;
                let features = [];
                const pieces = banner.split("::");
                if (pieces.length > 1) {
                    const props = pieces[1];
                    for (const prop of props.split(";")){
                        if (!prop) continue;
                        const keyValue = prop.split("=");
                        if (2 !== keyValue.length) continue;
                        const [key, value] = keyValue;
                        switch(key){
                            case AdbBannerKey.Product:
                                product = value;
                                break;
                            case AdbBannerKey.Model:
                                model = value;
                                break;
                            case AdbBannerKey.Device:
                                device = value;
                                break;
                            case AdbBannerKey.Features:
                                features = value.split(",");
                                break;
                        }
                    }
                }
                return new AdbBanner(product, model, device, features);
            }
            #product;
            get product() {
                return this.#product;
            }
            #model;
            get model() {
                return this.#model;
            }
            #device;
            get device() {
                return this.#device;
            }
            #features = [];
            get features() {
                return this.#features;
            }
            constructor(product, model, device, features){
                this.#product = product;
                this.#model = model;
                this.#device = device;
                this.#features = features;
            }
        }
        const stream_OKAY = encodeUtf8("OKAY");
        const FAIL = encodeUtf8("FAIL");
        class AdbServerStream {
            #connection;
            #buffered;
            #writer;
            constructor(connection){
                this.#connection = connection;
                this.#buffered = new BufferedReadableStream(connection.readable);
                this.#writer = connection.writable.getWriter();
            }
            readExactly(length) {
                return this.#buffered.readExactly(length);
            }
            readString = bipedal(function*(then) {
                const data = yield* then(this.readExactly(4));
                const length = hexToNumber(data);
                if (0 === length) return "";
                {
                    const decoder = new TextDecoder1();
                    let result = "";
                    const iterator = this.#buffered.iterateExactly(length);
                    while(true){
                        const { done, value } = iterator.next();
                        if (done) break;
                        result += decoder.decode((yield* then(value)), {
                            stream: true
                        });
                    }
                    result += decoder.decode();
                    return result;
                }
            });
            async readOkay() {
                const response = await this.readExactly(4);
                if (sequenceEqual(response, stream_OKAY)) return;
                if (sequenceEqual(response, FAIL)) {
                    const reason = await this.readString();
                    throw new Error(reason);
                }
                throw new Error(`Unexpected response: ${decodeUtf8(response)}`);
            }
            async writeString(value) {
                const encoded = encodeUtf8(value);
                const buffer = new Uint8Array(4 + encoded.length);
                write4HexDigits(buffer, 0, encoded.length);
                buffer.set(encoded, 4);
                await this.#writer.write(buffer);
            }
            release() {
                this.#writer.releaseLock();
                return {
                    readable: this.#buffered.release(),
                    writable: this.#connection.writable,
                    closed: this.#connection.closed,
                    close: ()=>this.#connection.close()
                };
            }
            async dispose() {
                tryCancel(this.#buffered);
                tryClose(this.#writer);
                await this.#connection.close();
            }
        }
        class NetworkError extends Error {
            constructor(message){
                super(message);
                this.name = "NetworkError";
            }
        }
        class UnauthorizedError extends Error {
            constructor(message){
                super(message);
                this.name = "UnauthorizedError";
            }
        }
        class AlreadyConnectedError extends Error {
            constructor(message){
                super(message);
                this.name = "AlreadyConnectedError";
            }
        }
        class WirelessCommands {
            #client;
            constructor(client){
                this.#client = client;
            }
            async pair(address, password) {
                const connection = await this.#client.createConnection(`host:pair:${password}:${address}`);
                try {
                    const response = await connection.readExactly(4);
                    if (sequenceEqual(response, FAIL)) throw new Error(await connection.readString());
                    const length = hexToNumber(response);
                    await connection.readExactly(length);
                } finally{
                    await connection.dispose();
                }
            }
            async connect(address) {
                const connection = await this.#client.createConnection(`host:connect:${address}`);
                try {
                    const response = await connection.readString();
                    switch(response){
                        case `already connected to ${address}`:
                            throw new AlreadyConnectedError(response);
                        case `failed to connect to ${address}`:
                        case `failed to authenticate to ${address}`:
                            throw new UnauthorizedError(response);
                        case `connected to ${address}`:
                            return;
                        default:
                            throw new NetworkError(response);
                    }
                } finally{
                    await connection.dispose();
                }
            }
            async disconnect(address) {
                const connection = await this.#client.createConnection(`host:disconnect:${address}`);
                try {
                    await connection.readString();
                } finally{
                    await connection.dispose();
                }
            }
        }
        class MDnsCommands {
            #client;
            constructor(client){
                this.#client = client;
            }
            async check() {
                const connection = await this.#client.createConnection("host:mdns:check");
                try {
                    const response = await connection.readString();
                    return !response.startsWith("ERROR:");
                } finally{
                    await connection.dispose();
                }
            }
            async getServices() {
                const connection = await this.#client.createConnection("host:mdns:services");
                try {
                    const response = await connection.readString();
                    return response.split("\n").filter(Boolean).map((line)=>{
                        const parts = line.split("\t");
                        return {
                            name: parts[0],
                            service: parts[1],
                            address: parts[2]
                        };
                    });
                } finally{
                    await connection.dispose();
                }
            }
        }
        class EventEmitter {
            listeners = [];
            constructor(){
                this.event = this.event.bind(this);
            }
            addEventListener(info) {
                this.listeners.push(info);
                const remove = ()=>{
                    const index = this.listeners.indexOf(info);
                    if (-1 !== index) this.listeners.splice(index, 1);
                };
                remove.dispose = remove;
                return remove;
            }
            event = (listener, thisArg, ...args)=>{
                const info = {
                    listener: listener,
                    thisArg,
                    args
                };
                return this.addEventListener(info);
            };
            fire(e) {
                for (const info of this.listeners.slice())info.listener.call(info.thisArg, e, ...info.args);
            }
            dispose() {
                this.listeners.length = 0;
            }
        }
        const Undefined = Symbol("undefined");
        class StickyEventEmitter extends EventEmitter {
            #value = Undefined;
            addEventListener(info) {
                if (this.#value !== Undefined) info.listener.call(info.thisArg, this.#value, ...info.args);
                return super.addEventListener(info);
            }
            fire(e) {
                this.#value = e;
                super.fire(e);
            }
        }
        const { setInterval: ref_setInterval, clearInterval: ref_clearInterval } = globalThis;
        class Ref {
            #intervalId;
            constructor(options){
                if (!options?.unref) this.ref();
            }
            ref() {
                this.#intervalId = ref_setInterval(()=>{}, 60000);
            }
            unref() {
                if (this.#intervalId) {
                    ref_clearInterval(this.#intervalId);
                    this.#intervalId = void 0;
                }
            }
        }
        function unorderedRemove(array, index) {
            if (index < 0 || index >= array.length) return;
            array[index] = array[array.length - 1];
            array.length -= 1;
        }
        function filterDeviceStates(devices, states) {
            return devices.filter((device)=>states.includes(device.state));
        }
        class AdbServerDeviceObserverOwner {
            current = [];
            #client;
            #stream;
            #observers = [];
            constructor(client){
                this.#client = client;
            }
            async #receive(stream) {
                const response = await stream.readString();
                const next = AdbServerClient.parseDeviceList(response);
                const removed = this.current.slice();
                const added = [];
                for (const nextDevice of next){
                    const index = removed.findIndex((device)=>device.transportId === nextDevice.transportId);
                    if (-1 === index) {
                        added.push(nextDevice);
                        continue;
                    }
                    unorderedRemove(removed, index);
                }
                this.current = next;
                if (added.length) for (const observer of this.#observers){
                    const filtered = filterDeviceStates(added, observer.includeStates);
                    if (filtered.length) observer.onDeviceAdd.fire(filtered);
                }
                if (removed.length) for (const observer of this.#observers){
                    const filtered = filterDeviceStates(removed, observer.includeStates);
                    if (filtered.length) observer.onDeviceRemove.fire(removed);
                }
                for (const observer of this.#observers){
                    const filtered = filterDeviceStates(this.current, observer.includeStates);
                    observer.onListChange.fire(filtered);
                }
            }
            async #receiveLoop(stream) {
                try {
                    while(true)await this.#receive(stream);
                } catch (e) {
                    this.#stream = void 0;
                    for (const observer of this.#observers)observer.onError.fire(e);
                }
            }
            async #connect() {
                const stream = await this.#client.createConnection("host:track-devices-l", {
                    unref: true
                });
                await this.#receive(stream);
                this.#receiveLoop(stream);
                return stream;
            }
            async #handleObserverStop(stream) {
                if (0 === this.#observers.length) {
                    this.#stream = void 0;
                    await stream.dispose();
                }
            }
            async createObserver(options) {
                options?.signal?.throwIfAborted();
                let current = [];
                const onDeviceAdd = new EventEmitter();
                const onDeviceRemove = new EventEmitter();
                const onListChange = new StickyEventEmitter();
                const onError = new StickyEventEmitter();
                const includeStates = options?.includeStates ?? [
                    "device",
                    "unauthorized"
                ];
                const observer = {
                    includeStates,
                    onDeviceAdd,
                    onDeviceRemove,
                    onListChange,
                    onError
                };
                this.#observers.push(observer);
                onListChange.event((value)=>current = value);
                let stream;
                if (this.#stream) {
                    stream = await this.#stream;
                    onListChange.fire(filterDeviceStates(this.current, includeStates));
                } else {
                    this.#stream = this.#connect();
                    try {
                        stream = await this.#stream;
                    } catch (e) {
                        this.#stream = void 0;
                        throw e;
                    }
                }
                const ref = new Ref(options);
                const stop = async ()=>{
                    unorderedRemove(this.#observers, this.#observers.indexOf(observer));
                    await this.#handleObserverStop(stream);
                    ref.unref();
                };
                if (options?.signal) {
                    if (options.signal.aborted) {
                        await stop();
                        throw options.signal.reason;
                    }
                    options.signal.addEventListener("abort", ()=>void stop());
                }
                return {
                    onDeviceAdd: onDeviceAdd.event,
                    onDeviceRemove: onDeviceRemove.event,
                    onListChange: onListChange.event,
                    onError: onError.event,
                    get current () {
                        return current;
                    },
                    stop
                };
            }
        }
        const ADB_SERVER_DEFAULT_FEATURES = /* #__PURE__ */ (()=>[
                AdbFeature.ShellV2,
                AdbFeature.Cmd,
                AdbFeature.StatV2,
                AdbFeature.ListV2,
                AdbFeature.FixedPushMkdir,
                "apex",
                AdbFeature.Abb,
                "fixed_push_symlink_timestamp",
                AdbFeature.AbbExec,
                "remount_shell",
                "track_app",
                AdbFeature.SendReceiveV2,
                "sendrecv_v2_brotli",
                "sendrecv_v2_lz4",
                "sendrecv_v2_zstd",
                "sendrecv_v2_dry_run_send"
            ])();
        class AdbServerTransport {
            #client;
            serial;
            transportId;
            maxPayloadSize = 1048576;
            banner;
            #sockets = [];
            #closed = new PromiseResolver();
            #disconnected;
            get disconnected() {
                return this.#disconnected;
            }
            get clientFeatures() {
                return ADB_SERVER_DEFAULT_FEATURES;
            }
            constructor(client, serial, banner, transportId, disconnected){
                this.#client = client;
                this.serial = serial;
                this.banner = banner;
                this.transportId = transportId;
                this.#disconnected = Promise.race([
                    this.#closed.promise,
                    disconnected
                ]);
            }
            async connect(service) {
                const socket = await this.#client.createDeviceConnection({
                    transportId: this.transportId
                }, service);
                this.#sockets.push(socket);
                return socket;
            }
            async addReverseTunnel(handler, address) {
                return await this.#client.connector.addReverseTunnel(handler, address);
            }
            async removeReverseTunnel(address) {
                await this.#client.connector.removeReverseTunnel(address);
            }
            async clearReverseTunnels() {
                await this.#client.connector.clearReverseTunnels();
            }
            async close() {
                for (const socket of this.#sockets)await socket.close();
                this.#sockets.length = 0;
                this.#closed.resolve();
            }
        }
        class AdbServerClient {
            static NetworkError = NetworkError;
            static UnauthorizedError = UnauthorizedError;
            static AlreadyConnectedError = AlreadyConnectedError;
            static parseDeviceList(value, includeStates = [
                "device",
                "unauthorized"
            ]) {
                const devices = [];
                for (const line of value.split("\n")){
                    if (!line) continue;
                    const parts = line.split(" ").filter(Boolean);
                    const serial = parts[0];
                    const state = parts[1];
                    if (!includeStates.includes(state)) continue;
                    let product;
                    let model;
                    let device;
                    let transportId;
                    for(let i = 2; i < parts.length; i += 1){
                        const [key, value] = parts[i].split(":");
                        switch(key){
                            case "product":
                                product = value;
                                break;
                            case "model":
                                model = value;
                                break;
                            case "device":
                                device = value;
                                break;
                            case "transport_id":
                                transportId = BigInt(value);
                                break;
                        }
                    }
                    if (!transportId) throw new Error(`No transport id for device ${serial}`);
                    devices.push({
                        serial,
                        state,
                        authenticating: "unauthorized" === state,
                        product,
                        model,
                        device,
                        transportId
                    });
                }
                return devices;
            }
            static formatDeviceService(device, command) {
                if (!device) return `host:${command}`;
                if ("transportId" in device) return `host-transport-id:${device.transportId}:${command}`;
                if ("serial" in device) return `host-serial:${device.serial}:${command}`;
                if ("usb" in device) return `host-usb:${command}`;
                if ("tcp" in device) return `host-local:${command}`;
                throw new TypeError("Invalid device selector");
            }
            connector;
            wireless = new WirelessCommands(this);
            mDns = new MDnsCommands(this);
            #observerOwner = new AdbServerDeviceObserverOwner(this);
            constructor(connector){
                this.connector = connector;
            }
            async createConnection(request, options) {
                const connection = await this.connector.connect(options);
                const stream = new AdbServerStream(connection);
                try {
                    await stream.writeString(request);
                } catch (e) {
                    await stream.dispose();
                    throw e;
                }
                try {
                    await raceSignal(()=>stream.readOkay(), options?.signal);
                    return stream;
                } catch (e) {
                    await stream.dispose();
                    throw e;
                }
            }
            async getVersion() {
                const connection = await this.createConnection("host:version");
                try {
                    const length = hexToNumber(await connection.readExactly(4));
                    const version = hexToNumber(await connection.readExactly(length));
                    return version;
                } finally{
                    await connection.dispose();
                }
            }
            async validateVersion(minimalVersion) {
                const version = await this.getVersion();
                if (version < minimalVersion) throw new Error(`adb server version (${version}) doesn't match this client (${minimalVersion})`);
            }
            async killServer() {
                const connection = await this.createConnection("host:kill");
                await connection.dispose();
            }
            async getServerFeatures() {
                const connection = await this.createConnection("host:host-features");
                try {
                    const response = await connection.readString();
                    return response.split(",");
                } finally{
                    await connection.dispose();
                }
            }
            async getDevices(includeStates = [
                "device",
                "unauthorized"
            ]) {
                const connection = await this.createConnection("host:devices-l");
                try {
                    const response = await connection.readString();
                    return AdbServerClient.parseDeviceList(response, includeStates);
                } finally{
                    await connection.dispose();
                }
            }
            async trackDevices(options) {
                return this.#observerOwner.createObserver(options);
            }
            async reconnectDevice(device) {
                const connection = await this.createConnection("offline" === device ? "host:reconnect-offline" : AdbServerClient.formatDeviceService(device, "reconnect"));
                try {
                    await connection.readString();
                } finally{
                    await connection.dispose();
                }
            }
            async getDeviceFeatures(device) {
                const connection = await this.createDeviceConnection(device, "host:features");
                const stream = new AdbServerStream(connection);
                try {
                    const featuresString = await stream.readString();
                    const features = featuresString.split(",");
                    return {
                        transportId: connection.transportId,
                        features
                    };
                } finally{
                    await stream.dispose();
                }
            }
            async createDeviceConnection(device, service) {
                let switchService;
                let transportId;
                if (device) if ("transportId" in device) {
                    switchService = `host:transport-id:${device.transportId}`;
                    transportId = device.transportId;
                } else if ("serial" in device) {
                    await this.validateVersion(41);
                    switchService = `host:tport:serial:${device.serial}`;
                } else if ("usb" in device) {
                    await this.validateVersion(41);
                    switchService = "host:tport:usb";
                } else if ("tcp" in device) {
                    await this.validateVersion(41);
                    switchService = "host:tport:local";
                } else throw new TypeError("Invalid device selector");
                else {
                    await this.validateVersion(41);
                    switchService = "host:tport:any";
                }
                const connection = await this.createConnection(switchService);
                try {
                    await connection.writeString(service);
                } catch (e) {
                    await connection.dispose();
                    throw e;
                }
                try {
                    if (void 0 === transportId) {
                        const array = await connection.readExactly(8);
                        transportId = getUint64LittleEndian(array, 0);
                    }
                    await connection.readOkay();
                    const socket = connection.release();
                    return {
                        transportId,
                        service,
                        readable: socket.readable,
                        writable: socket.writable,
                        get closed () {
                            return socket.closed;
                        },
                        async close () {
                            await socket.close();
                        }
                    };
                } catch (e) {
                    await connection.dispose();
                    throw e;
                }
            }
            async #waitForUnchecked(device, state, options) {
                let type;
                if (device) if ("transportId" in device) type = "any";
                else if ("serial" in device) type = "any";
                else if ("usb" in device) type = "usb";
                else if ("tcp" in device) type = "local";
                else throw new TypeError("Invalid device selector");
                else type = "any";
                const service = AdbServerClient.formatDeviceService(device, `wait-for-${type}-${state}`);
                const connection = await this.createConnection(service, options);
                try {
                    await connection.readOkay();
                } finally{
                    await connection.dispose();
                }
            }
            async waitFor(device, state, options) {
                if ("disconnect" === state) await this.validateVersion(41);
                return this.#waitForUnchecked(device, state, options);
            }
            async waitForDisconnect(transportId, options) {
                const serverVersion = await this.getVersion();
                if (serverVersion >= 41) return this.#waitForUnchecked({
                    transportId
                }, "disconnect", options);
                {
                    const observer = await this.trackDevices(options);
                    return new Promise((resolve, reject)=>{
                        observer.onDeviceRemove((devices)=>{
                            if (devices.some((device)=>device.transportId === transportId)) {
                                observer.stop();
                                resolve();
                            }
                        });
                        observer.onError((e)=>{
                            observer.stop();
                            reject(e);
                        });
                    });
                }
            }
            async createTransport(device) {
                const { transportId, features } = await this.getDeviceFeatures(device);
                const devices = await this.getDevices();
                const info = devices.find((device)=>device.transportId === transportId);
                const banner = new AdbBanner(info?.product, info?.model, info?.device, features);
                const waitAbortController = new AbortController();
                const disconnected = this.waitForDisconnect(transportId, {
                    unref: true,
                    signal: waitAbortController.signal
                });
                const transport = new AdbServerTransport(this, info?.serial ?? "", banner, transportId, disconnected);
                transport.disconnected.finally(()=>waitAbortController.abort());
                return transport;
            }
            async createAdb(device) {
                const transport = await this.createTransport(device);
                return new Adb(transport);
            }
        }
        async function raceSignal(callback, ...signals) {
            const abortPromise = new PromiseResolver();
            function abort() {
                abortPromise.reject(this.reason);
            }
            try {
                for (const signal of signals)if (signal) {
                    if (signal.aborted) throw signal.reason;
                    signal.addEventListener("abort", abort);
                }
                return await Promise.race([
                    callback(),
                    abortPromise.promise
                ]);
            } finally{
                for (const signal of signals)if (signal) signal.removeEventListener("abort", abort);
            }
        }
        const external_net_ = (0, _rslib_runtime_js__rspack_import_1.Q)("net");
        function nodeSocketToConnection(socket) {
            socket.setNoDelay(true);
            const closed = new Promise((resolve)=>{
                socket.on("close", resolve);
            });
            return {
                readable: new PushReadableStream((controller)=>{
                    socket.on("data", async (data)=>{
                        if (controller.abortSignal.aborted) return;
                        socket.pause();
                        await controller.enqueue(data);
                        socket.resume();
                    });
                    socket.on("end", ()=>{
                        tryClose(controller);
                    });
                }),
                writable: new MaybeConsumableWritableStream({
                    write: (chunk)=>new Promise((resolve, reject)=>{
                            socket.write(chunk, (err)=>{
                                if (err) reject(err);
                                else resolve();
                            });
                        })
                }),
                get closed () {
                    return closed;
                },
                close () {
                    socket.end();
                }
            };
        }
        class AdbServerNodeTcpConnector {
            spec;
            #listeners = new Map();
            constructor(spec){
                this.spec = spec;
            }
            async connect({ unref, signal } = {
                unref: false
            }) {
                const socket = new external_net_.Socket({
                    signal: signal
                });
                if (unref) socket.unref();
                socket.connect(this.spec);
                await new Promise((resolve, reject)=>{
                    socket.once("connect", resolve);
                    socket.once("error", reject);
                });
                return nodeSocketToConnection(socket);
            }
            async addReverseTunnel(handler, address) {
                const server = new external_net_.Server(async (socket)=>{
                    const connection = nodeSocketToConnection(socket);
                    try {
                        await handler({
                            service: address,
                            readable: connection.readable,
                            writable: connection.writable,
                            get closed () {
                                return connection.closed;
                            },
                            async close () {
                                await connection.close();
                            }
                        });
                    } catch  {
                        socket.end();
                    }
                });
                if (address) {
                    const url = new URL(address);
                    if ("tcp:" === url.protocol) server.listen(Number.parseInt(url.port, 10), url.hostname);
                    else if ("unix:" === url.protocol) server.listen(url.pathname);
                    else throw new TypeError(`Unsupported protocol ${url.protocol}`);
                } else server.listen();
                await new Promise((resolve, reject)=>{
                    server.on("listening", ()=>resolve());
                    server.on("error", (e)=>reject(e));
                });
                if (!address) {
                    const info = server.address();
                    address = `tcp:${info.port}`;
                }
                this.#listeners.set(address, server);
                return address;
            }
            removeReverseTunnel(address) {
                const server = this.#listeners.get(address);
                if (!server) return;
                server.close();
                this.#listeners.delete(address);
            }
            clearReverseTunnels() {
                for (const server of this.#listeners.values())server.close();
                this.#listeners.clear();
            }
        }
        const src = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js");
        var src_default = /*#__PURE__*/ _rslib_runtime_js__rspack_import_1.Q.n(src);
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
        function android_ts_dispose_resources(env) {
            var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
                var e = new Error(message);
                return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
            };
            return (android_ts_dispose_resources = function(env) {
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
        const debug = src_default()('devtool-mcp-server:connector:android');
        const KNOWNS_APPS = [
            {
                packageName: 'com.lynx.explorer',
                name: 'Lynx Explorer'
            }
        ];
        class AndroidTransport {
            #client;
            constructor(spec = {
                port: 5037
            }){
                this.#client = new AdbServerClient(new AdbServerNodeTcpConnector(spec));
            }
            async #createAdb(deviceId) {
                const adb = await this.#client.createAdb({
                    serial: deviceId
                });
                return Object.assign(adb, {
                    async [Symbol.asyncDispose] () {
                        await adb.close();
                    }
                });
            }
            close() {
                debug('Android transport closed');
                return Promise.resolve();
            }
            async connect({ deviceId, port, signal }) {
                const adb = await this.#client.createAdb({
                    serial: deviceId
                });
                debug(`connect: create connection to deviceId: ${deviceId}, port: ${port}`);
                signal?.throwIfAborted();
                const service = `tcp:${port}`;
                let socket;
                try {
                    socket = await adb.createSocket(service);
                } catch (err) {
                    await adb.close();
                    debug(`connect: create socket to ${service} failed with err: %o`, err);
                    throw err;
                }
                const abortHandler = ()=>{
                    Promise.resolve(socket.close()).catch((err)=>{
                        debug(`connect: socket ${service} close on abort err: %o`, err);
                    });
                };
                signal?.addEventListener('abort', abortHandler, {
                    once: true
                });
                if (signal?.aborted) {
                    await socket.close();
                    await adb.close();
                    signal.throwIfAborted();
                }
                Promise.resolve(socket.closed).catch((err)=>{
                    debug(`connect: socket ${service} closed with err: %o`, err);
                });
                return {
                    readable: socket.readable,
                    writable: socket.writable,
                    async [Symbol.asyncDispose] () {
                        signal?.removeEventListener('abort', abortHandler);
                        debug(`connect: close connection to deviceId: ${deviceId}, port: ${port}`);
                        try {
                            await socket.close();
                        } finally{
                            await adb.close();
                        }
                    }
                };
            }
            async withConnection(options, callback) {
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    const conn = _ts_add_disposable_resource(env, await this.connect(options), true);
                    return await callback(conn);
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = android_ts_dispose_resources(env);
                    if (result) await result;
                }
            }
            async listDevices() {
                const devices = await this.#client.getDevices();
                debug('listDevices: devices %o', devices);
                return devices.map(({ serial })=>({
                        os: 'Android',
                        id: serial
                    }));
            }
            async listAvailableApps(deviceId) {
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    const adb = _ts_add_disposable_resource(env, await this.#createAdb(deviceId), true);
                    const output = await adb.subprocess.noneProtocol.spawnWaitText([
                        'pm',
                        'list',
                        'packages',
                        '-3'
                    ]);
                    const packages = new Set(output.split('\n').map((line)=>line.replace('package:', '').trim()).filter((i)=>'' !== i));
                    debug("listAvailableApps all packages: %o", packages);
                    return KNOWNS_APPS.filter((app)=>packages.has(app.packageName));
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = android_ts_dispose_resources(env);
                    if (result) await result;
                }
            }
            async openApp(deviceId, packageName, { withDataCleared } = {}) {
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    const apps = await this.listAvailableApps(deviceId);
                    const adb = _ts_add_disposable_resource(env, await this.#createAdb(deviceId), true);
                    if (!apps.some((app)=>app.packageName === packageName)) throw new Error(`package ${packageName} not found`);
                    if (withDataCleared) {
                        const output = await adb.subprocess.noneProtocol.spawnWaitText([
                            'pm',
                            'clear',
                            packageName
                        ]);
                        debug(`openApp clear data output ${output}`);
                    }
                    const output = await adb.subprocess.noneProtocol.spawnWaitText([
                        'monkey',
                        '-p',
                        packageName,
                        '-c',
                        'android.intent.category.LAUNCHER',
                        '1'
                    ]);
                    debug(`openApp LAUNCHER output ${output}`);
                    if (output.includes('No activities found')) throw new Error(`No launchable activity found for package ${packageName}.`);
                    if (output.includes('monkey aborted')) throw new Error(`Failed to open app ${packageName}.`);
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = android_ts_dispose_resources(env);
                    if (result) await result;
                }
            }
        }
        const desktop_debug = src_default()('devtool-mcp-server:connector:desktop');
        class DesktopTransport {
            close() {
                desktop_debug('Desktop transport closed');
                return Promise.resolve();
            }
            listDevices() {
                return Promise.resolve([
                    {
                        id: 'localhost',
                        os: 'Desktop'
                    }
                ]);
            }
            listAvailableApps() {
                return Promise.resolve([]);
            }
            openApp() {
                throw new Error('openApp is not supported on DesktopTransport');
            }
            async connect({ deviceId, port, signal }) {
                if ('localhost' !== deviceId) throw new Error(`DesktopTransport only supports 'localhost' deviceId, got: ${deviceId}`);
                desktop_debug(`connect: connecting to 127.0.0.1:${port}`);
                const socket = node_net__rspack_import_2["default"].createConnection({
                    host: '127.0.0.1',
                    port,
                    signal
                });
                try {
                    if (socket.connecting) await new Promise((resolve, reject)=>{
                        socket.once('connect', resolve);
                        socket.once('error', reject);
                    });
                    desktop_debug(`connect: connected to 127.0.0.1:${port}`);
                    const { readable, writable } = node_stream__rspack_import_3.Duplex.toWeb(socket);
                    return {
                        readable,
                        writable,
                        [Symbol.asyncDispose] () {
                            desktop_debug(`connect: closing connection to 127.0.0.1:${port}`);
                            socket.destroy();
                            return Promise.resolve();
                        }
                    };
                } catch (err) {
                    desktop_debug(`connect: error connecting to 127.0.0.1:${port} %O`, err);
                    socket.destroy();
                    throw err;
                }
            }
        }
        const dist = (0, _rslib_runtime_js__rspack_import_1.Q)("../../../node_modules/.pnpm/usbmux-client@0.2.1/node_modules/usbmux-client/dist/index.js");
        function ios_ts_add_disposable_resource(env, value, async) {
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
        function ios_ts_dispose_resources(env) {
            var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
                var e = new Error(message);
                return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
            };
            return (ios_ts_dispose_resources = function(env) {
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
        const ios_debug = src_default()('devtool-mcp-server:connector:ios');
        class iOSTransport {
            #client;
            constructor(options){
                this.#client = new dist.UsbmuxClient(options);
            }
            async close() {
                await this.#client.close();
                ios_debug('iOS transport closed');
            }
            async connect({ deviceId, port, signal }) {
                ios_debug(`connect: create connection to deviceId: ${deviceId}, port: ${port}`);
                signal?.throwIfAborted();
                const conn = await this.#client.createDeviceTunnel(deviceId, port);
                const abortHandler = ()=>{
                    conn.destroy();
                };
                signal?.addEventListener('abort', abortHandler, {
                    once: true
                });
                if (signal?.aborted) {
                    conn.destroy();
                    signal.throwIfAborted();
                }
                const { readable, writable } = node_stream__rspack_import_3.Duplex.toWeb(conn);
                return {
                    readable,
                    writable: writable,
                    [Symbol.asyncDispose] () {
                        signal?.removeEventListener('abort', abortHandler);
                        ios_debug(`connect: close connection to deviceId: ${deviceId}, port: ${port}`);
                        conn.destroy();
                        return Promise.resolve();
                    }
                };
            }
            async withConnection(options, callback) {
                const env = {
                    stack: [],
                    error: void 0,
                    hasError: false
                };
                try {
                    const conn = ios_ts_add_disposable_resource(env, await this.connect(options), true);
                    return await callback(conn);
                } catch (e) {
                    env.error = e;
                    env.hasError = true;
                } finally{
                    const result = ios_ts_dispose_resources(env);
                    if (result) await result;
                }
            }
            async listDevices() {
                const devices = await this.#client.getDevices();
                ios_debug('listDevices: devices %o', devices);
                return Object.values(devices).map(({ DeviceID })=>({
                        os: 'iOS',
                        id: `${DeviceID}`
                    }));
            }
            listAvailableApps() {
                throw new Error('Not implemented');
            }
            openApp() {
                throw new Error('Not implemented');
            }
        }
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/esm.mjs" (__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            uB: ()=>Command
        });
        var _index_js__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/index.js");
        const { program, createCommand, createArgument, createOption, CommanderError, InvalidArgumentError, InvalidOptionArgumentError, Command, Argument, Option, Help } = _index_js__rspack_import_0;
    },
    "./package.json" (module) {
        module.exports = {
            rE: "0.1.0"
        };
    }
});
__webpack_require__("./src/index.ts");
