// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Packages execute in the native host, never in the connector daemon.
export async function createExtensions({ loadPackage, runtime, createPageEnvironmentManager, packages }) {
  const extensions = [];
  const handlers = new Map();
  const subscriptions = [];
  const sessions = new Map();
  let opening;
  let queue = Promise.resolve();
  let disposed = false;
  let environments;
  const deactivate = session => {
    let failure;
    for (const context of session.activated.splice(0).reverse()) {
      try {
        context.deactivate?.();
      } catch (error) {
        failure ??= error;
      }
    }
    if (failure) throw failure;
  };
  const cleanup = session => {
    if (session.disposed) return;
    session.disposed = true;
    if (session.id) sessions.delete(session.id);
    try {
      deactivate(session);
    } catch (error) {
      console.error("Failed to deactivate native extension context", error);
    }
    for (const context of [...session.contexts].reverse()) {
      try {
        context.dispose();
      } catch (error) {
        console.error("Failed to dispose native extension context", error);
      }
    }
  };
  const unsubscribe = runtime.addWindowEventListener(event => {
    if (event.type === "created" && opening) {
      opening.id = event.window.id;
      sessions.set(event.window.id, opening);
    }
    if (event.type === "failed" || event.type === "closed") {
      const session = sessions.get(event.window.id);
      if (session === opening && session) session.releaseRequested = true;
      else if (session) cleanup(session);
    }
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    for (const unsubscribe of subscriptions.splice(0)) unsubscribe();
    environments?.dispose();
    if (opening) cleanup(opening);
    for (const session of sessions.values()) cleanup(session);
  };
  // These methods provide a small host contract for JSB factories, including
  // createApplicationJSBHandlers exported by the Search Simulator JSB package.
  const host = new Proxy(runtime, {
    get(target, key) {
      if (key === "open") return open;
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  try {
    for (const [i, spec] of packages.nativeExtensions.entries()) {
      const module = await loadPackage(`agent-lynx-native-${i}`);
      const extension = module.default ?? module;
      if (typeof extension.setUp !== "function") throw new Error(`${spec} must export setUp().`);
      if (extension.createContext !== undefined && typeof extension.createContext !== "function") {
        throw new Error(`${spec}.createContext must be a function.`);
      }
      await runtime.registerNativeExtension(extension);
      extensions.push(extension);
    }
    for (const [i, spec] of packages.jsb.entries()) {
      const module = await loadPackage(`agent-lynx-jsb-${i}`);
      const factory = module.createJSBHandlers ?? module.createApplicationJSBHandlers ?? module.default;
      if (typeof factory !== "function") throw new Error(`${spec} must export a JSB handler factory.`);
      const registrations = await factory({
        runtime: host,
        cwd: process.cwd(),
        fetch: globalThis.fetch,
        xbridge: {
          event: {
            host: {
              sendGlobalEvent: (id, name, params) => runtime.getWindow(id)?.getLynxWindow()?.sendGlobalEvent(name, params),
              addWindowCloseListener: listener => {
                const unsubscribe = runtime.addWindowEventListener(event => {
                  if (event.type === "closed") listener(event.window.id);
                });
                subscriptions.push(unsubscribe);
                return unsubscribe;
              },
            },
          },
        },
        getBackgroundColor: () => "#ffffff",
        resolveSize: input => {
          const device = input?.device === undefined ? undefined : runtime.getDevice(input.device);
          if (input?.device !== undefined && !device) return { error: `Unknown device: ${input.device}` };
          const [width, height] = typeof input?.size === "string" ? input.size.split("x").map(Number) : [];
          const size = device?.size ?? {
            width: input?.width ?? width ?? 390,
            height: input?.height ?? height ?? 844,
          };
          return Object.values(size).every(value => Number.isFinite(value) && value > 0)
            ? { size }
            : { error: "Window dimensions must be positive numbers." };
        },
      });
      if (!Array.isArray(registrations)) throw new Error(`${spec} must return an array of JSB handlers.`);
      for (const registration of registrations) {
        if (!registration || typeof registration.name !== "string" || typeof registration.handler !== "function") {
          throw new Error(`${spec} returned an invalid JSB handler.`);
        }
        handlers.set(registration.name, registration);
      }
    }
    environments = createPageEnvironmentManager({ runtime, realHandlers: [...handlers.values()] });
  } catch (error) {
    dispose();
    throw error;
  }

  async function open(options) {
    // The extension API binds the active native context in OnLynxViewCreate.
    // Serialize opens so overlapping asynchronous loads cannot cross-bind data.
    const task = queue.then(async () => {
      if (disposed) throw new Error("Simulator extensions have been disposed.");
      const session = { contexts: [], activated: [], id: undefined, disposed: false, releaseRequested: false };
      let ref;
      try {
        try {
          const cwd = options.cwd ?? process.cwd();
          const environment = await readEnvironment(options.pageEnvironment, {
            cwd,
            target: options.target,
            windowOptions: options.window,
            context: options.context,
          });
          if (disposed) throw new Error("Simulator extensions have been disposed.");
          const { nativeData, context, ...pageEnvironment } = environment;
          for (const extension of extensions) {
            if (!extension.createContext) continue;
            const nativeContext = extension.createContext(structuredClone(nativeData ?? {}));
            if (!nativeContext || typeof nativeContext.dispose !== "function") {
              throw new Error("Native extension createContext() must return a disposable context.");
            }
            session.contexts.push(nativeContext);
            session.activated.push(nativeContext);
            nativeContext.activate?.();
          }
          opening = session;
          ref = await environments.open({
            ...options,
            cwd,
            window: { windowless: process.platform === "linux", ...options.window },
            context: { ...options.context, ...context },
            pageEnvironment,
          });
          session.id ??= ref.id;
          if (!session.disposed) sessions.set(ref.id, session);
          if (session.releaseRequested || ref.getInfo()?.error || disposed) cleanup(session);
          return ref;
        } finally {
          opening = undefined;
          deactivate(session);
        }
      } catch (error) {
        cleanup(session);
        const window = ref ?? (session.id ? runtime.getWindow(session.id) : undefined);
        await window?.close().catch(console.error);
        throw error;
      }
    });
    queue = task.catch(() => {});
    return task;
  }
  return { open, dispose };
}

async function readEnvironment(source, context) {
  let definition = source ?? {};
  if (typeof source === "string") {
    const url = path.isAbsolute(source) || !URL.canParse(source)
      ? pathToFileURL(path.resolve(context.cwd, source))
      : new URL(source);
    context = { ...context, source: url.href };
    if (/\.(mjs|js)$/i.test(url.pathname)) {
      if (url.protocol !== "file:") throw new Error("JavaScript page environments must be local files.");
      definition = (await import(url.href)).default;
      if (typeof definition !== "function") throw new Error("Page environment must default-export a factory.");
    } else if (url.protocol === "file:") definition = JSON.parse(await readFile(url, "utf8"));
    else if (url.protocol === "http:" || url.protocol === "https:") {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Page environment fetch failed: ${response.status}`);
      definition = await response.json();
    } else throw new Error(`Unsupported page environment protocol: ${url.protocol}`);
  }
  if (typeof definition === "function") definition = await definition(context);
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    throw new Error("Page environment must be an object.");
  }
  // Evaluate once, before native view creation, retaining the source context
  // for factories that resolve fixtures relative to the page-env module.
  const result = { ...definition };
  for (const key of ["templateData", "globalProps", "nativeData", "context"]) {
    if (typeof result[key] === "function") result[key] = await result[key](context);
    if (result[key] !== undefined && (!result[key] || typeof result[key] !== "object" || Array.isArray(result[key]))) {
      throw new Error(`pageEnvironment.${key} must be an object.`);
    }
  }
  if (typeof result.jsb === "function") {
    const invoke = result.jsb;
    result.jsb = (name, params, callContext) => invoke(name, params, { ...context, ...callContext, source: context.source });
  }
  return result;
}
