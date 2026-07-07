# Capturing and analyzing dual-thread logs

To find the root cause you need the two threads' traffic: the `OnLifecycleEvent` (`rLynxFirstScreen`) **SnapshotInstance tree** (main -> background, used by hydrate), the `rLynxChange` **snapshotPatch** (background -> main), and optionally every main-thread **Element PAPI** call.

There are two ways to get this. **Prefer Method A** (built-in, maintained by the framework). Use Method B only as a fallback.

## Method A (preferred): built-in ALog macros

ReactLynx has a native logging channel (ALog) gated by build-time macros. See `lynx-website` `docs/en/react/build-time-macros.mdx` (the "Logging macros" section). Both are **off by default** — enable them at build time via env vars:

| Env var | Macro | Emits |
| --- | --- | --- |
| `REACT_ALOG=true` | `__ALOG__` | detailed `[ReactLynxDebug]` diagnostics on **both threads** — the framework's own trace of hydrate and the snapshotPatch flow. |
| `REACT_ALOG_ELEMENT_API=true` | `__ALOG_ELEMENT_API__` | every [Element PAPI](https://lynxjs.org/api/engine/element-api.html) call (create / append / update). Very noisy; enable only when you need to see how the element tree is built. |

```bash
# rebuild (or dev) with the framework diagnostics on
REACT_ALOG=true rspeedy dev
# add Element PAPI tracing when you need the low-level tree ops
REACT_ALOG=true REACT_ALOG_ELEMENT_API=true rspeedy build
```

The `[ReactLynxDebug]` tag is the same one the manual snippet below prints — `REACT_ALOG=true` is the built-in equivalent of hand-instrumenting the runtime, so reach for it first. It emits the same signals: `MTS -> BTS OnLifecycleEvent`, the SnapshotInstance tree for first-screen hydration, the background tree before/after hydration, and `BTS -> MTS updateMainThread` (the snapshotPatch).

### Version requirements (check the project's `@lynx-js/react` first)

| Feature | Available since | Introduced by |
| --- | --- | --- |
| `REACT_ALOG` / `__ALOG__` (`[ReactLynxDebug]` dual-thread diagnostics) | `@lynx-js/react` **0.111.2** (needs `@lynx-js/react-webpack-plugin` >= 0.6.19) | [#1164](https://github.com/lynx-family/lynx-stack/pull/1164), 2025-07-17 |
| `REACT_ALOG_ELEMENT_API` / `__ALOG_ELEMENT_API__` as a **separate** toggle | `@lynx-js/react` **0.116.3** | [#2192](https://github.com/lynx-family/lynx-stack/pull/2192) |

Notes:

- On **0.111.2 – 0.116.2**, Element PAPI calls were logged together with `REACT_ALOG=true` (there was no separate env var; #2192 later split them out and made element-api logging off-by-default).
- On **`@lynx-js/react` < 0.111.2** there is no built-in ALog — that is the *only* case that needs the manual snippet (Method B).

Check the project's version with `cat node_modules/@lynx-js/react/package.json | grep version` (or your lockfile) before deciding.

## Dump and analyze the logs yourself with lynx-devtool

Once ALog is on, you do not have to ask the user to copy logs around. **With the user's consent**, drive the [`lynx-devtool`](../../lynx-devtool/SKILL.md) skill to dump both threads directly and analyze the root cause yourself:

1. Confirm the app is running with `REACT_ALOG=true` (and, if needed, `REACT_ALOG_ELEMENT_API=true`) and a device/emulator is connected.
2. Find the target: `list-clients`, then `list-sessions`.
3. Reload to capture the first-screen hydrate (the critical window): `cdp --session <id> -m Page.reload '{}'` (or reopen the page).
4. Dump each thread, filtering for the framework tag:
   ```bash
   node <lynx-devtool>/scripts/index.mjs get-console --thread main       # main-thread.js / lepus.js
   node <lynx-devtool>/scripts/index.mjs get-console --thread background  # JS runtime
   ```
   Grep the output for `[ReactLynxDebug]` (and `[ReactLynxDebug-Element]` when Element API logging is on).
5. Analyze the dump using "How to read the output" below and the per-error playbooks, then report the root cause.

> Always get the user's agreement before connecting to their device and reloading their page — a reload restarts their session. See the `lynx-devtool` skill for the full command surface (`get-console` levels/threads, CDP, component tree, etc.).

### Worked walkthrough (lynx-devtool, `ctx not found`)

App rebuilt with `REACT_ALOG=true`, device connected. `<dt>` = the `lynx-devtool` skill's `scripts/index.mjs`.

1. Find the client and session:
   ```bash
   node <dt> list-clients
   # → clientId 1  (com.example.app)
   node <dt> list-sessions --client 1
   # → sessionId 42  (…/template.js)
   ```
2. Reload to capture first-screen hydrate (with the user's consent — it restarts their page):
   ```bash
   node <dt> cdp --session 42 -m Page.reload '{}'
   ```
3. Dump both threads and keep only the framework lines:
   ```bash
   node <dt> get-console --thread main       | grep -iA2 'ReactLynxDebug\|not a function\|exception'
   node <dt> get-console --thread background | grep -iA2 'ReactLynxDebug\|cannot read'
   ```
4. Read the dump — a typical `ctx not found` chain looks like:
   ```text
   [main-thread]  ReportError: TypeError: not a function            ← the real root cause, fires first
   [main-thread]  [ReactLynxDebug] SnapshotInstance tree for first screen hydration:
   [main-thread]  | -1(root): null                                 ← empty tree: main thread crashed before createSnapshot
   [background]   [ReactLynxDebug] MTS -> BTS OnLifecycleEvent: rLynxFirstScreen …
   [background]   TypeError: cannot read property '0' of undefined  ← hydrate throws on the empty tree
   [background]   [ReactLynxDebug] BTS -> MTS updateMainThread: patchList:[{ snapshotPatch:[ InsertBefore … __snapshot_d9459_61989_1 … ] }]
   [main-thread]  snapshotPatchApply failed: ctx not found, snapshot type: '__Card__:__snapshot_d9459_61989_1'
   ```
5. Conclusion: the `snapshotPatchApply` line is the *last* symptom, not the cause. The main-thread `not a function` fired first and left the SnapshotInstance tree empty (`| -1(root)` only), so hydrate threw and the follow-up patch referenced a `__snapshot_…` the main thread never created. **Fix the main-thread `not a function`** (see `error-ctx-not-found.md` / `diagnosis-workflow.md`), then re-dump: the tree should now hydrate with real children and the error is gone.

## Method B (fallback): manual instrumentation

Use this only when the project's `@lynx-js/react` is **< 0.111.2** (no built-in ALog), or when you truly cannot rebuild with the env vars. On any version that supports `REACT_ALOG`, prefer Method A. Install this snippet at the **very top** of your entry file (`index.tsx`), before `root.render()`.

Source: <https://gist.github.com/upupming/9f8c5d006dbfaccc225ca6b2ad32e8b5>.

> **Import path**: `__root` comes from the ReactLynx runtime internal entry, `@lynx-js/react/internal`. If your project uses a different alias for the `@lynx-js/react` package, adjust the import accordingly.

```tsx
import { __root } from '@lynx-js/react/internal';

// Add this before your `root.render()` statement in your entry tsx file
{
  const SnapshotOperation = {
    CreateElement: 0,
    InsertBefore: 1,
    RemoveChild: 2,
    SetAttribute: 3,
    SetAttributes: 4,
    DEV_ONLY_AddSnapshot: 100,
    DEV_ONLY_RegisterWorklet: 101,
  };
  const SnapshotOperationParams = /* @__PURE__ */ {
    [SnapshotOperation.CreateElement]: { name: 'CreateElement', params: ['type', /* string */ 'id' /* number */] },
    [SnapshotOperation.InsertBefore]: {
      name: 'InsertBefore',
      params: ['parentId', /* number */ 'childId', /* number */ 'beforeId' /* number | undefined */],
    },
    [SnapshotOperation.RemoveChild]: { name: 'RemoveChild', params: ['parentId', /* number */ 'childId' /* number */] },
    [SnapshotOperation.SetAttribute]: {
      name: 'SetAttribute',
      params: ['id', /* number */ 'dynamicPartIndex', /* number */ 'value' /* any */],
    },
    [SnapshotOperation.SetAttributes]: { name: 'SetAttributes', params: ['id', /* number */ 'values' /* any */] },
    [SnapshotOperation.DEV_ONLY_AddSnapshot]: {
      name: 'DEV_ONLY_AddSnapshot',
      params: [
        'uniqID', /* string */
        'create', /* string */
        'update', /* string[] */
        'slot', /* [DynamicPartType, number][] */
        'cssId', /* number | undefined */
        'entryName', /* string | undefined */
      ],
    },
    [SnapshotOperation.DEV_ONLY_RegisterWorklet]: {
      name: 'DEV_ONLY_RegisterWorklet',
      params: ['hash', /* string */ 'fnStr' /* string */],
    },
  };

  function prettyFormatSnapshotPatch(snapshotPatch) {
    if (!snapshotPatch) {
      return [];
    }
    const result = [];
    for (let i = 0; i < snapshotPatch.length;) {
      const op = snapshotPatch[i];
      const config = SnapshotOperationParams[op];
      if (config) {
        const formattedOp = { op: config.name };
        config.params.forEach((param, index) => {
          formattedOp[param] = snapshotPatch[i + 1 + index];
        });
        result.push(formattedOp);
        i += 1 + config.params.length;
      } else {
        throw new Error(`Unknown snapshot operation: ${op}`);
      }
    }
    return result;
  }

  function printSnapshotInstance(instance, log = console.alog) {
    const impl = (instance, level) => {
      let msg = '';
      for (let i = 0; i < level; ++i) {
        msg += '  ';
      }
      msg += `| ${instance.id ?? instance.__id}(${instance.type}): ${JSON.stringify(instance.values ?? instance.__values)}`;
      log(msg);
      for (const c of (instance.childNodes ?? instance.children ?? [])) {
        impl(c, level + 1);
      }
    };
    impl(instance, 0);
  }

  if (__JS__) {
    const oldOnLifecycleEvent = lynxCoreInject.tt.OnLifecycleEvent;
    lynxCoreInject.tt.OnLifecycleEvent = (...args) => {
      const printArgs = [...args];
      if (args[0][0] === 'rLynxFirstScreen') {
        if (typeof args[0][1].root === 'string') {
          printArgs[0] = args[0].slice();
          const root = JSON.parse(args[0][1].root);
          printArgs[0][1] = { ...args[0][1], root };
          console.alog('[ReactLynxDebug] SnapshotInstance tree for first screen hydration:');
          printSnapshotInstance(root);
        }
      }
      console.alog('[ReactLynxDebug] OnLifecycleEvent', JSON.stringify(printArgs, null, 2));

      if (args[0][0] === 'rLynxFirstScreen') {
        console.alog('[ReactLynxDebug] BackgroundSnapshotInstance tree before hydrate:');
        printSnapshotInstance(__root);
      }

      oldOnLifecycleEvent(...args);

      if (args[0][0] === 'rLynxFirstScreen') {
        console.alog('[ReactLynxDebug] BackgroundSnapshotInstance tree after hydrate:');
        printSnapshotInstance(__root);
      }
    };
  } else {
    console.alog('[ReactLynxDebug] globalThis.rLynxChange', globalThis.rLynxChange, typeof globalThis.rLynxChange);
    const oldRLynxChange = globalThis.rLynxChange;
    globalThis.rLynxChange = (...args) => {
      const printArgs = [...args];
      if (typeof args[0].data === 'string') {
        const parsedData = JSON.parse(args[0].data);
        printArgs[0] = {
          ...args[0],
          data: {
            ...parsedData,
            patchList: parsedData.patchList.map(patch => ({
              ...patch,
              snapshotPatch: prettyFormatSnapshotPatch(patch.snapshotPatch),
            })),
          },
        };
      }
      console.alog('[ReactLynxDebug] rLynxChange', JSON.stringify(printArgs, null, 2));
      oldRLynxChange(...args);
    };

    const api = [
      '__CreatePage', '__CreateElement', '__CreateWrapperElement', '__CreateText',
      '__CreateImage', '__CreateView', '__CreateRawText', '__CreateList',
      '__AppendElement', '__InsertElementBefore', '__RemoveElement', '__ReplaceElement',
      '__FirstElement', '__LastElement', '__NextElement', '__GetPageElement',
      '__GetTemplateParts', '__AddDataset', '__SetDataset', '__GetDataset',
      '__SetAttribute', '__GetAttributes', '__GetAttributeByName', '__GetAttributeNames',
      '__SetClasses', '__SetCSSId', '__AddInlineStyle', '__SetInlineStyles',
      '__AddEvent', '__SetID', '__GetElementUniqueID', '__GetTag',
      '__FlushElementTree', '__UpdateListCallbacks', '__OnLifecycleEvent',
      '__QueryComponent', '__SetGestureDetector',
    ];

    let count = 0;
    api.forEach(api => {
      const old = globalThis[api];
      globalThis[api] = (...args) => {
        const printArgs = [...args];
        if (
          api === '__AppendElement' || api === '__InsertElementBefore'
          || api === '__ReplaceElement' || api === '__RemoveElement'
        ) {
          printArgs[0] = __GetTag(args[0]);
          printArgs[1] = __GetTag(args[1]);
        }
        if (api === '__InsertElementBefore') {
          printArgs[2] = __GetTag(args[2]);
        }

        console.alog('[ReactLynxDebug-Element] API', ++count, api, ...printArgs);

        lynx.performance.profileStart(api, { args: { args: JSON.stringify(args) } });
        const ans = old(...args);
        lynx.performance.profileEnd();
        return ans;
      };
    });
  }
}
```

## How to read the output

Applies to both methods (`[ReactLynxDebug]` lines from ALog or the snippet):

- **`SnapshotInstance tree for first screen hydration`** — the main thread's tree at hydrate time. If it is just `| -1(root): ...` with no children, the main thread crashed before creating its snapshots — go fix that crash (see `diagnosis-workflow.md`).
- **`BackgroundSnapshotInstance tree before/after hydrate`** — the background tree. Compare the two: after a healthy hydrate it should mirror the main-thread tree. If hydrate threw, "after" is incomplete.
- **`rLynxChange` / `snapshotPatch`** — the operations the background is asking the main thread to apply. Search it for the `type` in your error message (e.g. `__snapshot_d9459_61989_1`). If a patch tries to `InsertBefore` into an id whose `CreateElement` never happened (because hydrate aborted), you get `ctx not found`.
- **`[ReactLynxDebug-Element]`** — the exact Element PAPI sequence executed on the main thread, useful to confirm what actually rendered.

`console.alog` is the async log channel; view it via `lynx-devtool get-console` or the client's log console.
