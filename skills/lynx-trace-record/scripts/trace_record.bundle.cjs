/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 5317
(module) {

module.exports = require("child_process");

/***/ },

/***/ 4434
(module) {

module.exports = require("events");

/***/ },

/***/ 9896
(module) {

module.exports = require("fs");

/***/ },

/***/ 9278
(module) {

module.exports = require("net");

/***/ },

/***/ 7598
(module) {

module.exports = require("node:crypto");

/***/ },

/***/ 3024
(module) {

module.exports = require("node:fs");

/***/ },

/***/ 1455
(module) {

module.exports = require("node:fs/promises");

/***/ },

/***/ 7030
(module) {

module.exports = require("node:net");

/***/ },

/***/ 8161
(module) {

module.exports = require("node:os");

/***/ },

/***/ 6760
(module) {

module.exports = require("node:path");

/***/ },

/***/ 7075
(module) {

module.exports = require("node:stream");

/***/ },

/***/ 7830
(module) {

module.exports = require("node:stream/web");

/***/ },

/***/ 8500
(module) {

module.exports = require("node:timers/promises");

/***/ },

/***/ 857
(module) {

module.exports = require("os");

/***/ },

/***/ 6928
(module) {

module.exports = require("path");

/***/ },

/***/ 932
(module) {

module.exports = require("process");

/***/ },

/***/ 2018
(module) {

module.exports = require("tty");

/***/ },

/***/ 9023
(module) {

module.exports = require("util");

/***/ },

/***/ 2818
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6760);
/* harmony import */ var node_stream__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7075);
/* harmony import */ var node_stream_web__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7830);
/* harmony import */ var _lynx_js_devtool_connector__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6936);
/* harmony import */ var _lynx_js_devtool_connector_transport__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(782);
/* harmony import */ var commander__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(8655);
//#!/usr/bin/env node
var __addDisposableResource = (undefined && undefined.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (undefined && undefined.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});








async function listClients(connector) {
    const clients = await connector.listClients();
    return clients.map((client) => ({
        id: client.id,
        info: client.info,
    }));
}
function createIOReadStream(handle) {
    let requestId = 0;
    let eof = false;
    let controller = null;
    const stream = new node_stream_web__WEBPACK_IMPORTED_MODULE_4__.ReadableStream({
        start(c) {
            controller = c;
            sendReadRequest();
        },
    });
    function sendReadRequest() {
        if (!controller || eof)
            return;
        requestId++;
        controller.enqueue({
            id: requestId,
            method: 'IO.read',
            params: {
                handle,
                size: 5 * 1024 * 1024,
            },
            sessionId: -1,
        });
    }
    function onResponse(ioResult) {
        if (ioResult.eof) {
            eof = true;
            requestId++;
            controller?.enqueue({
                id: requestId,
                method: 'IO.close',
                params: {
                    handle,
                },
                sessionId: -1,
            });
            controller?.close();
        }
        else {
            sendReadRequest();
        }
    }
    return { stream, onResponse };
}
const transports = [new _lynx_js_devtool_connector_transport__WEBPACK_IMPORTED_MODULE_6__/* .AndroidTransport */ .Ry(), new _lynx_js_devtool_connector_transport__WEBPACK_IMPORTED_MODULE_6__/* .DesktopTransport */ .y4(), new _lynx_js_devtool_connector_transport__WEBPACK_IMPORTED_MODULE_6__/* .iOSTransport */ .HS()];
async function main() {
    const program = new commander__WEBPACK_IMPORTED_MODULE_7__/* .Command */ .uB();
    program.version('0.0.1').description('Trace Record CLI Tool');
    program
        .command('list-clients')
        .description('List available clients (connected apps)')
        .action(async () => {
        const connector = new _lynx_js_devtool_connector__WEBPACK_IMPORTED_MODULE_5__/* .Connector */ .Wi(transports);
        try {
            const clients = await listClients(connector);
            if (clients.length === 0) {
                console.log(JSON.stringify({
                    success: true,
                    message: 'No available clients found.',
                    clients: [],
                }));
            }
            else {
                console.log(JSON.stringify({
                    success: true,
                    message: `Found ${clients.length} client(s):`,
                    clients: clients,
                }));
            }
            await Promise.allSettled(transports.map((t) => t.close()));
        }
        catch (error) {
            console.error(JSON.stringify({ success: false, error: error.message }));
            process.exit(1);
        }
    });
    program
        .command('start')
        .description('Start trace events collection')
        .requiredOption('-c, --client <clientId>', 'Client ID')
        .option('--enable-systrace', 'Enable systrace', true)
        .option('--js-profile-interval <interval>', 'JS profile interval', '-1')
        .option('--js-profile-type <type>', 'JS profile type', 'sampling')
        .action(async (options) => {
        const connector = new _lynx_js_devtool_connector__WEBPACK_IMPORTED_MODULE_5__/* .Connector */ .Wi(transports);
        const clientId = options.client;
        try {
            const config = {
                recordMode: 'recordContinuously',
                includedCategories: ['*'],
                excludedCategories: ['*'],
                enableSystrace: options.enableSystrace,
                bufferSize: 200 * 1024,
                JSProfileInterval: Number(options.jsProfileInterval),
                JSProfileType: options.jsProfileType,
                enableCompress: true,
            };
            await connector.sendCDPMessage(clientId, -1, 'Tracing.start', {
                traceConfig: config,
            });
            console.log(JSON.stringify({ success: true, message: 'Tracing started successfully' }));
            await Promise.allSettled(transports.map((t) => t.close()));
        }
        catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('Failed to get trace controller') ||
                errorMessage.includes('Not implemented:') ||
                errorMessage.includes('Tracing not enabled') ||
                errorMessage.includes('Failed to start tracing')) {
                errorMessage = 'Tracing functionality is not supported in the current version.';
            }
            else {
                errorMessage = `Trace command error: ${errorMessage}`;
            }
            console.error(JSON.stringify({ success: false, error: errorMessage }));
            process.exit(1);
        }
    });
    program
        .command('end')
        .description('Stop trace events collection')
        .requiredOption('-c, --client <clientId>', 'Client ID')
        .action(async (options) => {
        const connector = new _lynx_js_devtool_connector__WEBPACK_IMPORTED_MODULE_5__/* .Connector */ .Wi(transports);
        const clientId = options.client;
        const signal = AbortSignal.timeout(30_000);
        try {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const stream = __addDisposableResource(env_1, await connector.sendCDPStream(clientId, node_stream_web__WEBPACK_IMPORTED_MODULE_4__.ReadableStream.from([{ method: 'Tracing.end', sessionId: -1 }]), { signal }), true);
                for await (const { method, params: eventParams } of stream) {
                    if (method === 'Tracing.tracingComplete') {
                        const streamResult = eventParams;
                        console.log(JSON.stringify({
                            success: true,
                            message: 'Tracing completed successfully',
                            stream: streamResult.stream,
                        }));
                        await Promise.allSettled(transports.map((t) => t.close()));
                        return;
                    }
                }
                throw new Error('Failed to stop tracing, no Tracing.tracingComplete event received within 30 seconds.');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                const result_1 = __disposeResources(env_1);
                if (result_1)
                    await result_1;
            }
        }
        catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('Failed to get trace controller')) {
                errorMessage =
                    'Tracing functionality is not supported in the current version. Please integrate the Lynx development version (with -dev suffix) to enable tracing. For more information, visit: https://lynxjs.org/en/guide/start/integrate-lynx-dev-version.html';
            }
            else if (errorMessage.includes('Tracing is not started')) {
                errorMessage = 'Tracing is not started, please start tracing first.';
            }
            console.error(JSON.stringify({ success: false, error: errorMessage }));
            process.exit(1);
        }
    });
    program
        .command('readData')
        .description('Read data from a trace stream')
        .requiredOption('-s, --stream <stream>', 'Stream handle')
        .requiredOption('-c, --client <clientId>', 'Client ID')
        .option('-o, --output <path>', 'Output file path. If not provided, saves to temporary directory')
        .action(async (options) => {
        const connector = new _lynx_js_devtool_connector__WEBPACK_IMPORTED_MODULE_5__/* .Connector */ .Wi(transports);
        const clientId = options.client;
        const streamHandle = Number(options.stream);
        let outputFilePath = '';
        if (options.output) {
            outputFilePath = options.output;
        }
        else {
            const tempDir = node_os__WEBPACK_IMPORTED_MODULE_1__.tmpdir();
            const timestamp = Date.now();
            const tempFileName = `trace-${timestamp}.pftrace`;
            outputFilePath = node_path__WEBPACK_IMPORTED_MODULE_2__.join(tempDir, tempFileName);
        }
        const writeStream = node_fs__WEBPACK_IMPORTED_MODULE_0__.createWriteStream(outputFilePath);
        const fileWritable = node_stream__WEBPACK_IMPORTED_MODULE_3__.Writable.toWeb(writeStream);
        try {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { stream: ioReadStream, onResponse } = createIOReadStream(streamHandle);
                const stream = __addDisposableResource(env_2, await connector.sendCDPStream(clientId, ioReadStream, {
                    signal: AbortSignal.timeout(30000),
                }), true);
                let eofReceived = false;
                for await (const message of stream) {
                    if ('error' in message) {
                        const errorMsg = message.error?.message || 'Unknown CDP error';
                        console.error(JSON.stringify({ success: false, error: errorMsg }));
                        process.exit(1);
                    }
                    if ('id' in message && 'result' in message) {
                        const ioResult = message.result;
                        if (ioResult.data) {
                            const buffer = Buffer.from(ioResult.data, 'base64');
                            const writer = fileWritable.getWriter();
                            await writer.write(buffer);
                            writer.releaseLock();
                        }
                        if (ioResult.eof) {
                            eofReceived = true;
                            await fileWritable.close();
                            onResponse(ioResult);
                            console.log(JSON.stringify({
                                success: true,
                                message: 'Data read successfully',
                                filePath: outputFilePath,
                            }));
                            await Promise.allSettled(transports.map((t) => t.close()));
                            return;
                        }
                        else {
                            onResponse(ioResult);
                        }
                    }
                }
                if (!eofReceived) {
                    const errorMessage = 'Failed to read data, no EOF received within 30 seconds.';
                    console.error(JSON.stringify({ success: false, error: errorMessage }));
                    process.exit(1);
                }
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                const result_2 = __disposeResources(env_2);
                if (result_2)
                    await result_2;
            }
        }
        catch (error) {
            console.error(JSON.stringify({ success: false, error: error.message }));
            process.exit(1);
        }
    });
    await program.parseAsync(process.argv);
}
main().catch((error) => {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
});


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, [804], () => (__webpack_require__(2818)))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and chunks that the entrypoint depends on
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + "shared" + ".bundle.cjs";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 294;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			294: 1
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.O.require = (chunkId) => (installedChunks[chunkId]);
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 			__webpack_require__.O();
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					var installedChunk = require("./" + __webpack_require__.u(chunkId));
/******/ 					if (!installedChunks[chunkId]) {
/******/ 						installChunk(installedChunk);
/******/ 					}
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			__webpack_require__.e(804);
/******/ 			return next();
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=trace_record.bundle.cjs.map