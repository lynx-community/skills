var __webpack_modules__ = {};
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}
__webpack_require__.m = __webpack_modules__;
(()=>{
    __webpack_require__.add = function(modules) {
        Object.assign(__webpack_require__.m, modules);
    };
})();
(()=>{
    var hasSymbol = "function" == typeof Symbol;
    var rspackQueues = hasSymbol ? Symbol("rspack queues") : "__rspack_queues";
    var rspackExports = __webpack_require__.aE = hasSymbol ? Symbol("rspack exports") : "__webpack_exports__";
    var rspackError = hasSymbol ? Symbol("rspack error") : "__rspack_error";
    var rspackDone = hasSymbol ? Symbol("rspack done") : "__rspack_done";
    var rspackDefer = __webpack_require__.zS = hasSymbol ? Symbol("rspack defer") : "__rspack_defer";
    var resolveQueue = (queue)=>{
        if (queue && queue.d < 1) {
            queue.d = 1;
            queue.forEach((fn)=>fn.r--);
            queue.forEach((fn)=>fn.r-- ? fn.r++ : fn());
        }
    };
    var wrapDeps = (deps)=>deps.map((dep)=>{
            if (null !== dep && "object" == typeof dep) {
                if (!dep[rspackQueues] && dep[rspackDefer]) {
                    var asyncDeps = dep[rspackDefer];
                    var hasUnresolvedAsyncSubgraph = asyncDeps.some((id)=>{
                        var cache = __webpack_module_cache__[id];
                        return !cache || false === cache[rspackDone];
                    });
                    if (!hasUnresolvedAsyncSubgraph) return dep;
                    var d = dep;
                    dep = {
                        then (callback) {
                            Promise.all(asyncDeps.map(__webpack_require__)).then(()=>callback(d));
                        }
                    };
                }
                if (dep[rspackQueues]) return dep;
                if (dep.then) {
                    var queue = [];
                    queue.d = 0;
                    dep.then((r)=>{
                        obj[rspackExports] = r;
                        resolveQueue(queue);
                    }, (e)=>{
                        obj[rspackError] = e;
                        resolveQueue(queue);
                    });
                    var obj = {};
                    obj[rspackDefer] = false;
                    obj[rspackQueues] = (fn)=>fn(queue);
                    return obj;
                }
            }
            var ret = {};
            ret[rspackQueues] = ()=>{};
            ret[rspackExports] = dep;
            return ret;
        });
    __webpack_require__.a = (module, body, hasAwait)=>{
        var queue;
        hasAwait && ((queue = []).d = -1);
        var depQueues = new Set();
        var exports = module.exports;
        var currentDeps;
        var outerResolve;
        var reject;
        var promise = new Promise((resolve, rej)=>{
            reject = rej;
            outerResolve = resolve;
        });
        promise[rspackExports] = exports;
        promise[rspackQueues] = (fn)=>{
            queue && fn(queue), depQueues.forEach(fn), promise["catch"](()=>{});
        };
        module.exports = promise;
        var handle = (deps)=>{
            currentDeps = wrapDeps(deps);
            var fn;
            var getResult = ()=>currentDeps.map((d)=>{
                    if (d[rspackDefer]) return d;
                    if (d[rspackError]) throw d[rspackError];
                    return d[rspackExports];
                });
            var promise = new Promise((resolve)=>{
                fn = ()=>resolve(getResult);
                fn.r = 0;
                var fnQueue = (q)=>q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn)));
                currentDeps.map((dep)=>dep[rspackDefer] || dep[rspackQueues](fnQueue));
            });
            return fn.r ? promise : getResult();
        };
        var done = (err)=>(err ? reject(promise[rspackError] = err) : outerResolve(exports), resolveQueue(queue), promise[rspackDone] = true);
        body(handle, done);
        queue && queue.d < 0 && (queue.d = 0);
    };
})();
(()=>{
    __webpack_require__.d = (exports, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports)=>{
        if ("u" > typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
    };
})();
export { __webpack_require__ };
