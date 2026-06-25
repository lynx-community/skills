import { node_os, node_path, ReadableStream, promises } from "./786.mjs";
import { recordingOutputPath, analyzeRecordingBuffer } from "./recorder-analysis.mjs";
import { CLIENT_OPTION, CLIENT_NAME_OPTION, isAbortError, resolveClient } from "./utils.mjs";
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
function recorder_end_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (recorder_end_ts_dispose_resources = function(env) {
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
const IO_READ_CHUNK_SIZE = 1048576;
const RECORDING_END_TIMEOUT_MS = 60000;
function registerEndCommand(parent, context) {
    parent.command('end').description('Stop TestBench recording and save the replay file').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option('-o, --output <path>', 'Output file or directory path (defaults to ~/.lynx-devtool/files/lynxrecorder/recording-<clientId>-<timestamp>.json)').action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const { output } = options;
        const result = await runRecordingEnd(connector, clientId, output);
        console.log(JSON.stringify({
            success: true,
            message: 'Recording ended successfully.',
            ...result
        }));
    });
}
async function runRecordingEnd(connector, clientId, output) {
    const recordingComplete = await readRecordingCompleteEvent(connector, clientId);
    const savedFiles = [];
    const diagnostics = [];
    const baseOutputPath = await resolveRecordingBaseOutputPath(output, clientId);
    const streams = recordingComplete['stream'];
    const sessionIDs = recordingComplete['sessionIDs'];
    if (!Array.isArray(streams) || 0 === streams.length) throw new Error("Recording.recordingComplete did not include any streams. If recording was never started, run `recorder start` first.");
    for (const [index, streamHandle] of streams.entries()){
        const sessionId = sessionIDs?.[index];
        if (void 0 === sessionId) throw new Error("Recording.recordingComplete returned mismatched `stream` and `sessionIDs` lengths. Reconnect and retry `recorder end`.");
        if (-1 === sessionId) continue;
        const signal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
        const data = await readStreamFully(connector, clientId, streamHandle, signal);
        const filePath = recordingOutputPath(baseOutputPath, sessionId, savedFiles.length);
        await promises.mkdir(node_path.dirname(filePath), {
            recursive: true
        });
        await promises.writeFile(filePath, data);
        savedFiles.push(filePath);
        diagnostics.push(analyzeRecordingBuffer(filePath, data));
    }
    if (0 === savedFiles.length) throw new Error(buildNoPageRecordingMessage(clientId, recordingComplete, streams, sessionIDs));
    const unhealthy = diagnostics.filter((d)=>!d.healthy);
    if (unhealthy.length > 0) console.warn('Recording saved, but the following file(s) may be unusable:\n' + unhealthy.map((d)=>`  - ${d.file}: ${d.verdict}`).join('\n'));
    const noTemplate = diagnostics.filter((d)=>d.healthy && !d.hasTemplate);
    if (noTemplate.length > 0) console.warn("Note: the following file(s) have no `loadTemplate` action and cannot be replayed,\nbut may still be useful for inspecting recorded behavior:\n" + noTemplate.map((d)=>`  - ${d.file}: ${d.verdict}`).join('\n'));
    return {
        savedFiles,
        recordingComplete,
        diagnostics
    };
}
function buildNoPageRecordingMessage(clientId, recordingComplete, streams, sessionIDs) {
    const filenames = recordingComplete['filenames'];
    const nativeFiles = Array.isArray(filenames) && filenames.length > 0 ? ` Native filenames: ${JSON.stringify(filenames)}.` : '';
    return [
        'Recording ended, but no page recording was produced.',
        `Native returned sessionIDs=${JSON.stringify(sessionIDs ?? [])}, streams=${streams.length}.${nativeFiles}`,
        'This usually means no Lynx page session was opened or reloaded after `recorder start`.',
        'To produce a replayable file:',
        `1. Run \`list-sessions --client ${clientId}\` and confirm there is a Lynx session.`,
        '2. After `recorder start`, open or reload the target page.',
        `   Example: \`cdp --client ${clientId} --session <sessionId> -m Page.reload '{"ignoreCache":true}'\``,
        '3. Interact with the page, then run `recorder end` again.'
    ].join('\n');
}
async function readRecordingCompleteEvent(connector, clientId) {
    const timeoutSignal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
    const isTimeoutError = (err)=>isAbortError(err) || err instanceof Error && 'TimeoutError' === err.name;
    try {
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, -1, ReadableStream.from([
                {
                    method: 'Recording.end',
                    params: {}
                }
            ]), {
                signal: timeoutSignal
            }), true);
            for await (const value of stream){
                if ('Recording.recordingComplete' === value.method) return value.params ?? {};
                if (value.error) throw new Error(`Recording.end failed: ${value.error.message}. If recording was never started, run \`recorder start\` first.`);
            }
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = recorder_end_ts_dispose_resources(env);
            if (result) await result;
        }
    } catch (err) {
        if (!isTimeoutError(err)) throw err;
        throw new Error("Recording.end timed out before receiving Recording.recordingComplete. Make sure recording was started with `recorder start` and the device is still connected.", {
            cause: err
        });
    }
    throw new Error("Recording.end stream closed before Recording.recordingComplete was received. Make sure recording was started with `recorder start` and the device is still connected.");
}
async function readStreamFully(connector, clientId, handle, signal) {
    const chunks = [];
    try {
        while(true){
            const chunk = await abortable(connector.sendCDPMessage(clientId, -1, 'IO.read', {
                handle,
                size: IO_READ_CHUNK_SIZE
            }), signal, `IO.read timed out reading recording stream handle ${handle}. The device may have stalled; reconnect and retry \`recorder end\`.`);
            if (chunk.data) chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf-8'));
            if (chunk.eof) break;
        }
        return Buffer.concat(chunks);
    } finally{
        await abortable(connector.sendCDPMessage(clientId, -1, 'IO.close', {
            handle
        }), AbortSignal.timeout(5000), `IO.close timed out closing recording stream handle ${handle}. Proceeding with local cleanup.`).catch(()=>{});
    }
}
function abortable(promise, signal, message) {
    if (signal.aborted) return Promise.reject(new Error(message));
    return new Promise((resolve, reject)=>{
        const onAbort = ()=>reject(new Error(message));
        signal.addEventListener('abort', onAbort, {
            once: true
        });
        promise.then((v)=>{
            signal.removeEventListener('abort', onAbort);
            resolve(v);
        }, (e)=>{
            signal.removeEventListener('abort', onAbort);
            reject(e);
        });
    });
}
async function resolveRecordingBaseOutputPath(output, clientId) {
    const defaultFileName = `recording-${clientId.replace(/[<>:"/\\|?*()]/g, '_')}-${Date.now()}.json`;
    if (!output) return node_path.resolve(node_os.homedir(), '.lynx-devtool', 'files', 'lynxrecorder', defaultFileName);
    const resolvedOutput = node_path.resolve(output);
    const outputLooksLikeDirectory = output.endsWith(node_path.sep) || output.endsWith('/') || output.endsWith('\\');
    const outputIsDirectory = outputLooksLikeDirectory || await promises.stat(resolvedOutput).then((stats)=>stats.isDirectory()).catch(()=>false);
    if (outputIsDirectory) {
        await promises.mkdir(resolvedOutput, {
            recursive: true
        });
        return node_path.join(resolvedOutput, defaultFileName);
    }
    return resolvedOutput;
}
var recorder_end_runRecordingEnd = void 0;
export { recorder_end_runRecordingEnd as runRecordingEnd, registerEndCommand };
