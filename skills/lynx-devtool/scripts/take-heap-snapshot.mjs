import { node_path, ReadableStream, promises, randomInt, tmpdir } from "./786.mjs";
import { CDPResponseTransformStream } from "./347.mjs";
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
function take_heap_snapshot_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (take_heap_snapshot_ts_dispose_resources = function(env) {
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
function registerTakeHeapSnapshotCommand(program, context) {
    program.command('take-heap-snapshot').description('Take a heap snapshot and save it to a .heapsnapshot file').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--thread <thread>', 'VM thread to target: background or main', 'background').option('-o, --output <path>', 'Output file path (default: <tmpdir>/heap-<thread>-<timestamp>.heapsnapshot)').action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { output, thread = 'background' } = options;
            if ('background' !== thread && 'main' !== thread) throw new Error(`Invalid thread: ${thread}. Expected 'background' or 'main'.`);
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const expectedSessionId = 'main' === thread ? 'Main' : void 0;
            const extraParams = expectedSessionId ? {
                sessionId: expectedSessionId
            } : {};
            const timeoutSignal = AbortSignal.timeout(60000);
            const requestId = randomInt(10000, 50000);
            const stream = _ts_add_disposable_resource(env, await connector.sendStream(clientId, ReadableStream.from([
                {
                    event: 'Customized',
                    data: {
                        type: 'CDP',
                        data: {
                            session_id: Number(sessionId),
                            message: {
                                id: requestId - 1,
                                method: 'HeapProfiler.enable',
                                params: {},
                                ...extraParams
                            }
                        }
                    }
                },
                {
                    event: 'Customized',
                    data: {
                        type: 'CDP',
                        data: {
                            session_id: Number(sessionId),
                            message: {
                                id: requestId,
                                method: 'HeapProfiler.takeHeapSnapshot',
                                params: {
                                    reportProgress: true,
                                    treatGlobalObjectsAsRoots: true,
                                    captureNumericValue: false
                                },
                                ...extraParams
                            }
                        }
                    }
                }
            ]), {
                signal: timeoutSignal,
                pipeline: {
                    input: [],
                    output: [
                        new CDPResponseTransformStream()
                    ]
                }
            }), true);
            const chunks = [];
            let didReceiveSnapshotResponse = false;
            const fileName = output ?? node_path.join(tmpdir(), `heap-${thread}-${Date.now()}.heapsnapshot`);
            for await (const value of readUntilIdle(stream, {
                idleMs: 15000,
                maxMs: 60000
            })){
                const { method, params: eventParams, id, sessionId: responseSessionId } = value;
                if ('HeapProfiler.addHeapSnapshotChunk' === method) {
                    if (responseSessionId !== expectedSessionId) continue;
                    const chunk = eventParams?.chunk;
                    if (!chunk) continue;
                    chunks.push(chunk);
                    if (didReceiveSnapshotResponse) break;
                } else if ('HeapProfiler.reportHeapSnapshotProgress' === method) ;
                else if (id === requestId) {
                    didReceiveSnapshotResponse = true;
                    if (chunks.length > 0) break;
                }
            }
            if (0 === chunks.length) throw new Error('Failed to capture heap snapshot, no chunks received or timed out.');
            await promises.writeFile(fileName, chunks.join(''));
            console.log(`Heap snapshot saved to ${fileName}`);
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = take_heap_snapshot_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
export { registerTakeHeapSnapshotCommand };
