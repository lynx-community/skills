# Develop simulator extension packages

Use a page-env factory for one case's mocks. Use an npm package for reusable
bridge handlers (`--jsb`) or native capabilities such as host elements
(`--native-extension`). They have separate contracts and can be developed
independently. Both load into the Lynxtron Node host, not into the page's JS VM.

## JSB package

Copy the complete [example package](../examples/extensions/jsb-package/package.json)
and [index.mjs](../examples/extensions/jsb-package/index.mjs). It implements
`demo.greet` using page context and `demo.increment` with per-window counters.
It has no runtime dependencies or build step. The matching
[page-env.mjs](../examples/extensions/page-env.mjs) supplies context and one
page-local mock.

The loader selects the first available root export in this order:

1. `createJSBHandlers(options)` (preferred).
2. `createApplicationJSBHandlers(options)` (compatibility with existing apps).
3. A default-exported factory; CommonJS `module.exports = factory` also works.

The factory may be async and must return an array of `{ name, handler }`.
An import-only ESM root export is supported. Keep the factory free of page-specific
assumptions: it runs once per simulator process, before any window exists.

```ts
// Minimal view of Core's JSBHandlerRegistration contract.
type Registration = {
  name: string;
  handler(params: unknown, context: {
    window: {
      id: string;
      target: string;
      size: { width: number; height: number };
    };
    context?: Record<string, unknown>;
  }): unknown | Promise<unknown>;
};
```

Handlers receive the actual bridge parameters. Match the consumer's envelope and
return its full callback result, for example `{ code: 1, data: ... }` for a
bridge that expects that shape. The dispatcher does not add a universal success
wrapper. A package handler has no `next()`; `next()` belongs to the page-env JSB
interceptor. Missing handlers and thrown errors use Core's error handling.

### Factory options supplied by Agent Lynx

| Option                                                       | Contract                                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `runtime`                                                    | Core runtime with methods bound to their owner; `open(options)` also applies page-env and native-context lifecycle |
| `cwd`                                                        | Host process working directory, not necessarily the directory of the CLI call that opened a page                   |
| `fetch`                                                      | Host `globalThis.fetch`                                                                                            |
| `resolveSize(input)`                                         | `{ size }` or `{ error }`; accepts `device`, `size: "WIDTHxHEIGHT"`, or `width`/`height`; defaults to 390 × 844    |
| `getBackgroundColor()`                                       | Returns `"#ffffff"`; it does not infer the page's business theme                                                   |
| `xbridge.event.host.sendGlobalEvent(windowId, name, params)` | Sends an event through the target native window                                                                    |
| `xbridge.event.host.addWindowCloseListener(listener)`        | Calls `listener(windowId)` on close, returns an unsubscribe function; host shutdown removes tracked listeners      |

To open a page from a handler, call `runtime.open({ target, window, context,
pageEnvironment })`. Pass an absolute target or an explicit `cwd`. Business
context, native data, mocks, and theme are not inherited automatically. Do not
open a window during factory initialization, before the loader is ready.

Keep window state keyed by `handlerContext.window.id`, and remove it on close as
the example does. Module/factory-level state without a window key is shared.
There is no general JSB-package `dispose()` hook: release long-lived resources
through explicit service ownership/window-close subscriptions rather than
returning a disposer instead of the required array.

## Native-extension package

The [native package manifest](../examples/extensions/native-package/package.json)
and [index.cjs loader](../examples/extensions/native-package/index.cjs) show the
host-facing half of a native package. They require your compiled addon under
`prebuilds/<platform>-<arch>/host_elements.node`; no native binary or element
implementation is bundled with this example.

At the package root, export `setUp()` as a named export or as a method of the
default-exported object. CommonJS `module.exports = { setUp }` works. `setUp()`
receives no arguments, may be async, and registers capabilities before the first
window opens. Make registration idempotent. The loader does not call a global
extension `dispose()` method.

The example follows the Extension Module loader pattern: its addon exports `getExtensionConfig()`, returning native
creator metadata for `process._linkedBinding('lynx_extension').registerGlobalEnvModule`.
`getExtensionConfig()` is an API implemented by that addon, not a built-in method
on every `.node` file. The creator and opaque values must be native handles from
the matching Lynxtron SDK. Adapt `setUp()` to your library's registration model.
If an existing native library registers itself when loaded, `setUp()` may only
need to require its host entry.

For implementing and building the actual native module/host element, start with
[Lynx Native Libraries](https://lynxjs.org/lynxtron/Native-Libraries/Lynx-Native-Libraries.md)
and [Custom Element](https://lynxjs.org/guide/custom-native-component.md).
Use the headers and build tools for the selected Lynxtron release. Agent Lynx
loads the package's root `setUp()`; it provides no native compilation or application
AutoLink pipeline. Ship compatible prebuilds or a package-owned installer.

### Optional per-window native data

For native components that need host-owned data, add a synchronous
`createContext(nativeData)` export with this contract:

```ts
type NativeContext = {
  activate?(): void;
  deactivate?(): void;
  dispose(): void;
};

declare function createContext(
  nativeData: Record<string, unknown>,
): NativeContext;
```

- The host evaluates page-env, clones `nativeData`, and calls `createContext` for
  each extension. Missing data becomes `{}`. No window ID is available yet.
- `activate` selects the context used during native view creation. The native
  view must capture its own context rather than look up a mutable global on every
  render. Opening windows is serialized by the host for this reason.
- `deactivate` ends the creation scope. The open view must keep its data alive.
- `dispose` releases context data, observers, and async work after close, load
  failure, or shutdown. It can follow partial initialization; make cleanup
  idempotent and tolerate it while a failed native view still exists.
- All context methods are synchronous; their returned promises are not awaited.
  Evaluate asynchronous data in page-env before `createContext`. If context
  creation throws after allocating native state, roll back within the package.

This is a lifecycle protocol, not a requirement to expose native IDs to callers.
Additional methods such as `patch`/`replace` may exist on a package context, but
the CLI does not invoke them automatically.

## Package, publish, and consume

The example names use `@example`; replace them with your team's owned package
names. Keep `exports`/`main` pointed at shipped JavaScript and include the needed
files. For TypeScript packages, emit JavaScript and declarations before packing.
Declare runtime imports as dependencies and native ABI requirements as peers.
The native example pins the peer to 0.0.31; update it with your verified ABI range.

Run from the package directory:

```sh
npm pack --dry-run
npm pack
```

Inspect the tarball for its root entry, dependencies, and each supported native
prebuild. JSB-only code can be inspected locally before publication:

```sh
node --input-type=module -e '
  import { createJSBHandlers } from "./index.mjs";
  const handlers = createJSBHandlers({
    xbridge: { event: { host: { addWindowCloseListener: () => () => {} } } },
  });
  const greet = handlers.find(item => item.name === "demo.greet");
  console.log(await greet.handler({ name: "Ada" }, {
    window: { id: "preview" }, context: { greeting: "Hello" },
  }));
'
```

When publishing the package is part of the task, publish a version to the registry
used by Agent Lynx (`https://registry.npmjs.org`). Then consume the published name:

```sh
agent-lynx simulator run --jsb <your-jsb-package@version> \
  --native-extension <your-native-package@version>
agent-lynx open '/absolute/path/template.js' --client <clientId> \
  --page-env ./page-env.mjs --simulator-windowless
```

The flags install registry packages; `--jsb ./local-package` and local `.tgz`
inputs are not supported. A page-env module may import a local handler for
JS-only iteration, but that does not verify package resolution or native setup.
Use a new exact version to exercise published updates instead of reusing a
cached tag. Dependencies are installed under aliases; resolve assets relative
to the package entry (`import.meta.url` / `__dirname`), not a hard-coded npm path.

Manually check a real bridge call, page-env override and `next()` fallback, two
windows with different data, load failure/close cleanup, and the actual native
element rendering on each supported host. A successful `run` only proves startup.

For the example JSB package and page-env, select the opened page's session and
invoke the documented direct-params protocol from the Lynx background VM:

```sh
agent-lynx evaluate \
  'new Promise(resolve => NativeModules.bridge.call("demo.greet", {name: "Ada"}, resolve))' \
  --await-promise --client <clientId> --session <sessionId>
```

The reply contains `"Hello from this page, Ada"`. `demo.fixture` is handled by
page-env, and `demo.increment` starts at 1 independently in each window.
Finish with `agent-lynx simulator stop --client <clientId>`.
