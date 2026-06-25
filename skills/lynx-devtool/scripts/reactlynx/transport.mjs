import { ReadableStream } from "../786.mjs";
import { readUntilIdle } from "../utils.mjs";
import { node_createDebug } from "../182.mjs";
import { createRendererState, applyRootOrder, applyOperationV2 } from "./protocol.mjs";
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
function transport_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (transport_ts_dispose_resources = function(env) {
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
const debug = node_createDebug('devtool-mcp-server:reactlynx');
const PREACT_EVENT = 'PreactDevtools';
const SOURCE_PAGE_HOOK = 'preact-page-hook';
const SOURCE_DEVTOOLS_TO_CLIENT = 'preact-devtools-to-client';
const DEFAULT_IDLE_MS = 700;
const DEFAULT_MAX_MS = 5000;
function buildOutboundFrame(type, data) {
    return {
        method: 'Lynx.sendVMEvent',
        params: {
            vmType: 'JSContext',
            event: PREACT_EVENT,
            data: JSON.stringify({
                source: SOURCE_DEVTOOLS_TO_CLIENT,
                type,
                data: data ?? null
            })
        }
    };
}
async function runReactLynxSession(options) {
    const env = {
        stack: [],
        error: void 0,
        hasError: false
    };
    try {
        const { connector, clientId, sessionId, outbound, sendInit = true, onEnvelope = ()=>'continue', idleMs = DEFAULT_IDLE_MS, maxMs = DEFAULT_MAX_MS, signal } = options;
        let stopRequested = false;
        let cancelInput = ()=>{};
        const input = new ReadableStream({
            start (controller) {
                if (sendInit) controller.enqueue(buildOutboundFrame('init'));
                for (const frame of outbound)controller.enqueue(frame);
                cancelInput = ()=>{
                    try {
                        controller.close();
                    } catch  {}
                };
            }
        });
        const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, sessionId, input, signal ? {
            signal
        } : void 0), true);
        const state = createRendererState();
        let framesSeen = 0;
        let operationFrames = 0;
        let rootOrderFrames = 0;
        const envelopeTypes = new Set();
        try {
            for await (const value of readUntilIdle(stream, {
                idleMs,
                maxMs
            })){
                if ('object' != typeof value || null === value) continue;
                const method = value.method;
                if ('Lynx.onVMEvent' !== method) continue;
                const params = value.params ?? {};
                if (params.event !== PREACT_EVENT) continue;
                let envelope;
                try {
                    envelope = JSON.parse(params.data ?? 'null');
                } catch  {
                    continue;
                }
                if (envelope.source === SOURCE_PAGE_HOOK) {
                    framesSeen += 1;
                    envelopeTypes.add(envelope.type);
                    debug('frame %d: type=%s dataSize=%s', framesSeen, envelope.type, Array.isArray(envelope.data) ? envelope.data.length : typeof envelope.data);
                    switch(envelope.type){
                        case 'operation_v2':
                            if (Array.isArray(envelope.data)) {
                                operationFrames += 1;
                                applyOperationV2(state, envelope.data);
                            }
                            break;
                        case 'root-order':
                            if (Array.isArray(envelope.data)) {
                                rootOrderFrames += 1;
                                applyRootOrder(state, envelope.data);
                            }
                            break;
                    }
                    if ('stop' === onEnvelope(envelope)) {
                        stopRequested = true;
                        break;
                    }
                }
            }
        } finally{
            cancelInput();
        }
        debug('session done: stop=%s frames=%d op=%d root=%d types=%o', stopRequested, framesSeen, operationFrames, rootOrderFrames, [
            ...envelopeTypes
        ]);
        return {
            state,
            framesSeen,
            operationFrames,
            rootOrderFrames,
            envelopeTypes
        };
    } catch (e) {
        env.error = e;
        env.hasError = true;
    } finally{
        const result = transport_ts_dispose_resources(env);
        if (result) await result;
    }
}
function emptyTreeDiagnostic(result) {
    if (0 === result.framesSeen) return "saw 0 frames -- the App is silent on the PreactDevtools channel. Most likely `@lynx-js/preact-devtools` is not installed, the bundle is a production build (`setupReactLynx()` is stripped from `react-lynx/index.ts:3`), or `setupReactLynx()` has not run yet. Look for `[PREACT DEVTOOLS] Devtools initialized successfully` in the device console.";
    if (0 === result.operationFrames) return `saw ${result.framesSeen} frame(s) but no \`operation_v2\` -- \`@lynx-js/preact-devtools\` is loaded but does not honor \`refresh\`. Upgrade to a build that includes the PR #2 (\`document.body\`) and PR #5 (\`preactDevtoolsCtx.Node\`) fixes from \`lynx-family/preact-devtools\`.`;
    return `saw ${result.framesSeen} frame(s) including ${result.operationFrames} \`operation_v2\` but the resulting tree is empty (every node was unmounted). This is unusual -- rerun with \`DEBUG=devtool-mcp-server:reactlynx\` to inspect each frame's payload.`;
}
var transport_DEFAULT_IDLE_MS = void 0;
var transport_DEFAULT_MAX_MS = void 0;
export { buildOutboundFrame, emptyTreeDiagnostic, runReactLynxSession, transport_DEFAULT_IDLE_MS as DEFAULT_IDLE_MS, transport_DEFAULT_MAX_MS as DEFAULT_MAX_MS };
