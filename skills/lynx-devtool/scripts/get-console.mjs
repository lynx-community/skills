import { ReadableStream } from "./786.mjs";
import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, readUntilIdle, SESSION_OPTION } from "./utils.mjs";
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
function get_console_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (get_console_ts_dispose_resources = function(env) {
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
function formatConsoleMessage({ type, args, stackTrace, consoleTag }) {
    return `- [${type}/${'Lepus' === consoleTag ? 'main-thread' : 'background'}]: ${args.map((arg)=>{
        if (arg.objectId) return `<${arg.description || arg.className || 'Object'} (objectId:${arg.objectId})>`;
        return arg.value;
    }).join(' ')}${stackTrace ? '\n' + stackTrace.callFrames.map(({ url, lineNumber, columnNumber })=>`    at ${url}:${lineNumber}:${columnNumber}`).join('\n') : ''}`;
}
function registerGetConsoleCommand(program, context) {
    program.command('get-console').description('Capture console logs from the device').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--offset <number>', 'The number of console messages to skip before returning results.', parseInt).option('--limit <number>', 'The maximum number of console messages to return.', parseInt).option('--include-stack-traces', 'By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.').option('--level <levels>', "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']", (value)=>value.split(',').map((s)=>s.trim())).option('--thread <thread...>', 'VM thread to target: background or main', [
        'background',
        'main'
    ]).option('-w, --watch', 'Stream console logs as they arrive, printing each message immediately, until interrupted (Ctrl+C) or --limit is reached', false).action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { offset = 0, includeStackTraces, level, watch } = options;
            let { limit, thread } = options;
            if (!Array.isArray(thread)) thread = [
                thread
            ];
            if (!thread.every((t)=>'background' === t || 'main' === t)) throw new Error(`Invalid thread: ${thread}. Expected 'background' or 'main'.`);
            if (limit) limit = Math.max(1, Math.min(100, limit));
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, Number(sessionId), ReadableStream.from([
                {
                    method: 'Page.enable'
                },
                {
                    method: 'Page.getResourceTree'
                },
                ...thread.map((t)=>({
                        method: 'Debugger.enable',
                        sessionId: 'main' === t ? 'Main' : void 0
                    })),
                ...thread.map((t)=>({
                        method: 'Runtime.enable',
                        sessionId: 'main' === t ? 'Main' : void 0
                    }))
            ])), true);
            const defaultLevels = [
                'info',
                'log',
                'warning',
                'error'
            ];
            const allowedLevels = level || defaultLevels;
            let skipped = 0;
            let produced = 0;
            if (watch) {
                const reader = stream.getReader();
                let aborted = false;
                const onSigint = ()=>{
                    aborted = true;
                    reader.cancel().catch(()=>{});
                };
                process.once('SIGINT', onSigint);
                try {
                    while(!aborted){
                        const { done, value } = await reader.read();
                        if (done) break;
                        if ('Runtime.consoleAPICalled' !== value.method) continue;
                        const params = value.params;
                        if (!allowedLevels.includes(params.type)) continue;
                        if (skipped < offset) {
                            skipped++;
                            continue;
                        }
                        if (!includeStackTraces && 'error' !== params.type) delete params.stackTrace;
                        console.log(formatConsoleMessage(params));
                        produced++;
                        if (limit && produced >= limit) {
                            await reader.cancel();
                            break;
                        }
                    }
                } finally{
                    process.off('SIGINT', onSigint);
                    reader.releaseLock();
                }
                return;
            }
            const messages = [];
            for await (const value of readUntilIdle(stream, {
                idleMs: 500,
                maxMs: 5000
            })){
                if ('Runtime.consoleAPICalled' !== value.method) continue;
                const params = value.params;
                if (allowedLevels.includes(params.type)) {
                    if (skipped < offset) {
                        skipped++;
                        continue;
                    }
                    if (!includeStackTraces && 'error' !== params.type) delete params.stackTrace;
                    messages.push(params);
                    if (limit && messages.length >= limit) break;
                }
            }
            console.log(messages.map(formatConsoleMessage).join('\n'));
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = get_console_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
export { registerGetConsoleCommand };
