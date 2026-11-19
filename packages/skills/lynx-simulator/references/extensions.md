# Simulator extensions: usage

`simulator run` selects packages for a host process. `open --page-env` supplies
data and mocks for each page in that process. For package implementation, read
[Package development](extension-development.md).

## Defaults

The public host has no default JSB or native-extension packages. Use page-env
for page-local mocks and add packages for reusable bridge or native capabilities.
Agent Lynx Simulator currently runs on Linux x64 (windowless) and macOS arm64/x64;
a package supporting additional platforms does not extend that host matrix.

## Add packages and open a page

Replace the package placeholders with versions published to the public npm
registry:

```sh
agent-lynx simulator run \
  --jsb <base-jsb-package@version> \
  --jsb <business-jsb-package@version> \
  --native-extension <host-elements-package@version> \
  --native-extension <another-native-package@version>

agent-lynx open '/absolute/path/template.js' --client <clientId> \
  --page-env ./page-env.mjs --simulator-windowless
agent-lynx list-sessions --client <clientId>
```

Use the `clientId` returned by `run`, then select the intended page session.
Packages run in the Lynxtron Node host, while the bundle runs in the Lynx runtime.
Adding a JSB package registers bridge methods; it does not register a host element.
Native packages register native capabilities through `setUp()`.

- Both flags accept npm names with optional versions, ranges, or tags. Local
  paths, tarballs, Git URLs, and package subpaths are not accepted.
- Exact duplicate specs within a category are loaded once.
- Within the effective JSB list, later registrations override earlier names.
  Put business handlers after general handlers. Native extensions load in order;
  native tag conflicts are the packages' responsibility, not a JSB override rule.
- `--lynxtron-version <exact-version>` selects the native host. Native artifacts
  and peer dependencies must be compatible. The flag does not change the pinned Core.
- The dependency cache includes Core, host version, and ordered effective package
  lists. Tags/unversioned specs resolve on first installation and are then cached.
  Use a new exact version after publishing changes. Starting a new process alone
  does not refresh an existing package cache.
- The `run`/`get` responses show `coreVersion`, `lynxtronVersion`, `jsb`,
  `nativeExtensions`, and `logPath`. Package lists are effective requested specs,
  not a lockfile of resolved transitive versions.

## Per-page data and dispatch

The complete generic [page-env example](../examples/extensions/page-env.mjs)
works with the [example JSB package](../examples/extensions/jsb-package/index.mjs).
All top-level fields are optional:

| Field          | Consumer                                                             |
| -------------- | -------------------------------------------------------------------- |
| `templateData` | Lynx page initial data                                               |
| `globalProps`  | Lynx page global properties                                          |
| `context`      | Package handlers as `handlerContext.context`                         |
| `nativeData`   | Each native package's optional `createContext(nativeData)`           |
| `jsb`          | Per-page bridge rules or a JavaScript handler that can call `next()` |

`context` and `nativeData` are separate from `templateData` and `globalProps`.
The host does not automatically turn global props into business JSB context.
Each native extension gets a separate clone of the entire `nativeData` object
(or `{}`); use package-specific keys when several extensions consume it.

JSON and local JavaScript factories are supported. In JavaScript, each data field
can be an async function returning an object; the factory/data functions are
evaluated once per open, before native contexts are created. See
[Page environments](page-env.md) for source-relative fixtures and mock matching.

For a JSON `jsb.bridge` rule, a matching mock wins; otherwise a package handler
runs. A JavaScript `jsb(name, params, context)` function decides whether to return
a result or call `context.next()`. Returning `undefined` is a result, not fallback.
Unknown methods can still fail. Creating a fresh page gives it fresh page-env and
native contexts; package module-level state can be shared.

## Native lifecycle

`setUp()` runs during startup before pages open. Packages that export
`createContext()` get a context for every open, even without native data:

```text
evaluate page-env → createContext → activate → Core opens window → deactivate
                                               ↓
                                    close / load failure → dispose
```

Opens are serialized to associate an active native context with the correct
LynxView. Deactivation ends that creation scope; it must not destroy data needed
by the live view. Failure and shutdown also release contexts. Opening a new page
loads new data; the CLI exposes no native-context `patch`/`replace` command.

## Verify and troubleshoot

Use `simulator get --client <clientId>` and `simulator logs --client <clientId>`
to confirm the effective packages and inspect startup/page errors. Then verify
the actual bridge reply or element rendering using the `lynx-devtool` Skill.

| Symptom                                        | Check                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| npm resolution or peer dependency error        | Published package version and compatibility with the selected host                         |
| JSB factory / `setUp` export error             | Root exports and role-specific contract in [Package development](extension-development.md) |
| Missing `.node`, library, or symbol            | OS/architecture prebuild, dependent system libraries, and runtime ABI                      |
| Handler returns default or wrong business data | `page-env.context`, same-name override order, and mock precedence                          |
| Host element is blank                          | Tag registration, element props, `nativeData` shape, resource URLs, and platform support   |

Finish with `simulator stop --client <clientId>`. Opening a page successfully
does not by itself establish native element behavior.
