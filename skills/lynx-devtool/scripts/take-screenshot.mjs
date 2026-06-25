import { promises_setTimeout, ReadableStream, promises } from "./786.mjs";
import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "./utils.mjs";
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
function take_screenshot_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (take_screenshot_ts_dispose_resources = function(env) {
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
function registerTakeScreenshotCommand(program, context) {
    program.command('take-screenshot').description('Take a screenshot of the current page').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--fullscreen', 'Capture the fullscreen screenshot instead of the lynxview').option('-o, --output <path>', 'Output file path (default: screenshot-<timestamp>.jpeg)').action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const { output, fullscreen } = options;
            const numericSessionId = Number(sessionId);
            const signal = AbortSignal.timeout(10000);
            const { promise: framePromise, resolve: resolveFrame } = Promise.withResolvers();
            const { promise: ackPromise, resolve: resolveAck } = Promise.withResolvers();
            const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, numericSessionId, new ReadableStream({
                async start (controller) {
                    controller.enqueue({
                        method: 'Page.startScreencast',
                        params: {
                            format: 'jpeg',
                            quality: 80,
                            mode: fullscreen ? 'fullscreen' : 'lynxview'
                        }
                    });
                    const hasFrame = await Promise.race([
                        framePromise.then(()=>true),
                        promises_setTimeout(10000, false, {
                            ref: false
                        })
                    ]);
                    if (hasFrame) controller.enqueue({
                        method: 'Page.screencastFrameAck'
                    });
                    controller.close();
                    resolveAck();
                }
            }), {
                signal
            }), true);
            for await (const { method, params: eventParams } of stream)if ('Page.screencastFrame' === method) {
                const { data } = eventParams;
                if (data) {
                    resolveFrame();
                    await ackPromise;
                    const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
                    await promises.writeFile(fileName, Buffer.from(data, 'base64'));
                    console.log(`Screenshot saved to ${fileName}`);
                    return;
                }
            }
            throw new Error('Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.');
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = take_screenshot_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
export { registerTakeScreenshotCommand };
