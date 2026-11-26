var modules = {};
var moduleCache = {};
function rspackRequire(moduleId) {
    var cachedModule = moduleCache[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = moduleCache[moduleId] = {
        exports: {}
    };
    modules[moduleId](module, module.exports, rspackRequire);
    return module.exports;
}
var moduleFactories = modules;
moduleFactories.add = function(modules) {
    Object.assign(moduleFactories, modules);
};
export { rspackRequire, moduleFactories };
