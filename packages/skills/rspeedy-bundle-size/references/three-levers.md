# The three size levers, and how to attack each

After measuring (see [measure-with-rsdoctor.md](measure-with-rsdoctor.md)), the weight falls into three buckets. The technique is different for each. Always size all three first, then attack the biggest.

## Contents

- **[Lever 1 — Media assets](#lever-1--media-assets-usually-the-biggest-highest-roi)** — sizing, WebP/dedup/subset techniques, who fixes it (often CI).
- **[Lever 2 — JS background thread](#lever-2--js-background-thread-tree-shaking-dedup)** — tree-shaking enablers, duplicate packages, **mangle failure / eval-poisoning**, the DCE≈0 reality check.
- **[Lever 3 — Main-thread leakage](#lever-3--main-thread-leakage-background-only-code-in-the-render-path)** — jsb is background-only; the readable-`main-thread.js` finder; **trace on `concatenateModules:false`**; classify leaf/barrel/init/mixed/multi-importer; **macro-guard vs `import()`**; **`async`+es2015 *buries* `'background only'` → non-async wrapper**; **top-level fire-and-forget native call → `__BACKGROUND__`-guard**; runtime→compile-time macro; the last-reference rule; `pnpm patch` a library leak.
- **[Lever 4 — Template / compile-layer knobs](#lever-4--template--compile-layer-knobs-lynx-specific-often-higher-roi-than-the-js-tail)** — `minify.css`, `extractStr`, debug-info; emitted-asset dedup; **i18n all-locales bloat** (don't lazy the active locale); font subset; **lazy bundle = first-screen lever, not total-size**.
- **[Putting it together](#putting-it-together-a-prioritized-report)** — the prioritized three-layer report.

> Quick rule of thumb: **media → background JS → main-thread leak → compile knobs**, but let the measured numbers reorder it. The single biggest measured bucket decides the engagement.

---

## Lever 1 — Media assets (usually the biggest, highest ROI)

In real Lynx apps the single largest contributor is frequently **images**, not JS. Check this first.

### How to size it
Sum non-JS / asset modules from the moduleGraph, or inspect the output dir for image files. Look for:
- Large PNGs that should be **WebP** (often 50–80% smaller at equal quality)
- **Duplicated assets** — e.g. the same artwork shipped twice (a classic: an iOS and a non-iOS variant of one image that are near-identical)
- Assets inlined as base64 that are large enough they should be external (or vice-versa)

### Techniques
| Problem | Fix |
|---|---|
| Big PNG/JPG | convert to WebP; quantize PNGs (pngquant) |
| Same image twice | dedup; pick one variant or load conditionally at runtime |
| Inline threshold wrong | tune the asset inline size limit |
| Fonts shipped whole | subset to used glyphs |

### Who fixes it
Often the **CI/asset pipeline**, not app source — e.g. a build step that compresses/transcodes. Flag it as a pipeline change with an estimated saving; verify actual compressed sizes before promising a number.

---

## Lever 2 — JS background thread (tree-shaking, dedup)

The `react:background` layer is app logic. This is where classic JS bundle optimization applies — but on a well-maintained project these wells are often **already dry**.

### Tree-shaking enablers (check whether they're already done)
- **`sideEffects: false`** in workspace libs that are actually side-effect-free. If a lib that should be tree-shakeable has `sideEffects: true`, whole modules survive unused.
- **No `export *` barrels.** Barrel files (`index.ts` re-exporting everything) defeat tree-shaking and pull in the whole module. Prefer deep imports (`import { x } from 'lib/feature/x'`) over barrel imports (`import { x } from 'lib'`).
- **`const enum` over `enum`** — `const enum` is inlined and leaves no runtime object; plain `enum` ships a lookup object. (Caveat: under `isolatedModules: true` — common in rspeedy/SWC projects, verified set in real repos — SWC does **not** inline `const enum` across files; it helps only same-file usages, so don't rely on it cross-module.)
- **Free functions over class methods** when only one method is used — a class drags all its methods in.

### Duplicate packages — often the single biggest JS lever in a monorepo
The same library bundled at two versions doubles its cost; in a big monorepo this is frequently **tens of KB gzip** (a real project saw ~−40 KB gzip from one dedupe). Detect with `rsdoctor-agent packages duplicates`, or scan the lockfile / output for the same package name at two versions. Fix by **forcing a single copy via `resolve.alias`**:
- Same/compatible version → `resolve.alias` the package to one resolved dir.
- Multi-version where you must pin a specific one → a helper that locates the wanted version in the pnpm store and aliases to it (e.g. the project's `dedupAliasesAt({ 'pkg': '3.127.0' })` pattern). **Reuse the project's existing alias/dedupe helpers** rather than inventing new ones.
- Risk: aliasing across a minor/major can break API or drop bundled resources the other version shipped — build + smoke-test after. Some dedupes get reverted for resource-compat reasons; check the project's history before re-enabling a commented-out one.

### Mangle failure (eval poisoning) — a distinct size cause
Sometimes the JS layer is large not because of *what* is included but because **names weren't compressed**. Symptom: a prettier-formatted production chunk (`dist/.rspeedy/main/background.<hash>.js`, `main-thread.js`) visibly contains readable **module-prefixed** names like `common_EVENT_NAME`, `utils_toSomething`, `foo_ExportedClass` — ModuleConcatenation artifacts that should have been mangled away.

**Cause:** a single `eval()` anywhere inside a ModuleConcatenation (scope-hoisting) scope forces SWC to preserve *every* top-level name in that scope and its ancestors. With `optimization.concatenateModules: true` (rspack's production default), hundreds of modules share one scope, so one `eval()` de-mangles the whole bundle. Common offenders: `@protobufjs/inquire` (often via a protobuf wrapper lib), `js-md5`'s `nodeWrap`, `amdefine`, old `crypto-js`.

**How to spot it fast:** grep the debug chunk for `eval(` — `0` is healthy, `>=1` is suspect. To prove it, minify the chunk twice (once with `eval(` replaced by `null&&(`) and compare sizes; a big drop confirms eval is the cause.

**Fix directions (present as options, don't apply unilaterally):**
- Remove the value import of the offender at the source (best when usages are few and app-local)
- Alias the eval module to a shim (e.g. an `inquire` that `return null`) when it's shared across packages
- Set `optimization.concatenateModules: false` to unblock immediately (+3–8% size, so it's a fallback not a fix)

This is a deep topic; the above is enough to recognize, prove, and route it. If a chunk shows eval-poisoning, that usually dwarfs the structural tree-shaking wins above — check it before spending effort on barrels/dedup.

### Reality check
On an already-optimized project, code-level DCE (deleting unreachable code) typically nets **~0 at the bundle level** — the minifier already dropped it. `ts-prune` will report hundreds of "unused exports" but most are either entrypoints, type-only, or already shaken. Don't churn source for it. The wins here are structural (barrels, dedup, sideEffects), not line-by-line deletion.

---

## Lever 3 — Main-thread leakage (background-only code in the render path)

The `react:main-thread` layer should be small — it's the first-screen render path. When background-only logic leaks into it, it inflates the main-thread bundle and the render cost. For *why* the main thread must stay lean (it does first-screen direct render + applies Patches; all logic/lifecycle/state lives on the background thread), see [dual-thread-architecture.md](dual-thread-architecture.md).

### jsb is background-thread-ONLY — so ALL jsb in main-thread is dead, and its upper layer with it

**Foundational fact (verify against the Lynx runtime, but treat as the default): JSB — `NativeModules`, the `.bridge.` object, `getJSModule(...)`, native `GlobalEventEmitter` — can only be called on the BACKGROUND thread.** The main/lepus thread has no JSB. Therefore **any jsb code that ends up in `main-thread.js` is dead by construction** — it can never run there — and so is **the upper-layer code that exists only to reach it** (the request/SDK/service glue that wraps a bridge call, the component logic whose only main-thread purpose was to set up a jsb call). That whole subtree is removable from main-thread; trace it and delete/guard it.

**Stubbing the jsb imports on the main-thread layer (a build loader that swaps `import {...} from '<jsb-bridge-pkg>'` for no-op stubs) is a BAND-AID, not the fix — don't lead with it.** It removes the bytes (and is a fine way to *measure* the prize quickly), but it treats the symptom: the source code still imports and "calls" jsb on a thread where it can't run, and you've hidden that with a stub. The real fix is **dependency analysis: trace each jsb import chain to the source module that pulls it into the render path, and cut it there** — `__BACKGROUND__`-guard the jsb call/subscription, or move the jsb-using logic into a background-only module — so the subtree shakes *by construction* and the code honestly reflects that jsb is background-only. Use the stub-loader to quantify; ship the source-level cut. (This applies to the telemetry-strip loader in [assets/](assets/) too — measurement aid, not the principled fix.)

This means a heavy jsb SDK sitting in `main-thread.js` is **not "render-needed, library-locked"** — it's a leak, even when the SDK ships a `*.lynx.js` build and is imported by many render components. Do NOT excuse it as "the main thread needs jsb" — it doesn't. Measured example (one real jsb bridge SDK): a `*.lynx.js` build (~137 KB, dozens of `.bridge.` + `NativeModules` + `getJSModule` calls, **zero `__BACKGROUND__` guards**) sat ~87 KB in main-thread, pulled in by render cards — all of it dead on the main thread. The fix is to background-gate it (patch the library so the bridge/jsb is `__BACKGROUND__`-only, or guard the importing upper layer), which DCEs the whole subtree from main-thread while the background thread keeps the real bridge. (Patching node_modules is fair game — `pnpm patch`.) The only caveat is the *contagion* the rest of this lever describes: you must remove **every** main-thread reference, and guard top-level consumers so a now-`undefined` bridge doesn't crash a main-thread module — but since jsb never worked on main-thread anyway, those consumers were already dead paths.

**⭐ Verified empirical anchor (the gate works — gate it *selectively*, and know where it caps).** On a real app I library-gated the jsb SDKs by prepending `if(__MAIN_THREAD__)return;` to jsb functions and shipped it as `pnpm patch`es. Four things were proven:

- **The macro substitutes inside `node_modules`.** A `MT_GATE_PROOF` sentinel confirmed `__MAIN_THREAD__` → `true` on the main-thread layer and `false` on background, *for library code* (0 raw `__MAIN_THREAD__` left in `main-thread.js`). So `if(__MAIN_THREAD__)return;` genuinely DCEs a library function's body on main-thread and keeps it on background — the gate is real (background `.bridge.` unchanged, 0 build errors).

- **GATE SELECTIVELY — a jsb barrel is not all jsb.** A jsb bridge SDK's `*.lynx.js` build typically mixes jsb wrappers (each `return core.pipeCall({method:...})` — delegating to the bridge singleton) with **pure helpers** (`getRuntimeEnv` reads `lynx.__globalProps`, `canIUse`, `parseEnv`, version checks, babel-runtime `_extends`…). The pure helpers are **NOT jsb and run fine on main-thread**; gating them to `return;` would make first-screen env/feature checks return `undefined` — **a runtime bug a build with 0 errors will not catch.** Classify by whether the function body touches the bridge (`core.` / `.bridge` / `NativeModules` / `getJSModule` / `GlobalEventEmitter`); gate only those. A function-boundary-aware transform is in [assets/gate.awk](assets/gate.awk) (no babel needed) — but **prettier-expand the lib first** (it gates per-function *by line*; a compact `function f(){…}` on one line gates almost nothing and just warns). ⚠️ **run prettier outside the project dir** — the project's own prettier config (`.prettierrc` / `.prettierignore`) can silently skip or reflow the file when run in-tree; copy it out and pass `--no-config`: `cp lib.lynx.js /tmp/lib.js && prettier --no-config --write /tmp/lib.js`. (Real-tested on a real jsb bridge lib: raw = all-WARN compact; after prettier → **77 gated / 10 pure helpers kept, output valid JS**.) Blanket-gating a whole barrel measured a larger drop but was **unsafe**; the **safe selective** gate (jsb-only) measured **~−0.4%** — the gap is exactly the pure helpers, which must not be touched. **`gate.awk` only sees top-level `function foo(){}` — a `GATED=0` is NOT proof the lib is jsb-free.** Libs that wrap jsb in **class methods or arrow exports** are invisible to it (real-tested: a class-method jsb lib gated **0/4** while calling `.bridge` / `getJSModule` / `NativeModules` — the script now warns "references jsb but GATED=0" in this case). For class/arrow-style libs, gate via a babel/SWC visitor (see [assets/plugin-strip-mt-telemetry.ts](assets/plugin-strip-mt-telemetry.ts) for the AST pattern), not the awk. Confirm the style first: `grep -c '^function ' lib.lynx.js` — near-zero means awk won't help.

- **It caps at the wrappers; the bridge-core class is a floor.** The residual main-thread jsb (`this.bridge.call/on/off`, `NativeModules`) lives in an **ES6 class instantiated at module-init as a singleton** — a structural floor, same shape as a render engine referenced at init (see [rspeedy-gotchas §10](rspeedy-gotchas.md)). Gating call-site wrappers can't DCE a class the module constructs eagerly; you'd have to gate the **instantiation** (`__BACKGROUND__`-guard the `new`), cleanest done upstream. The de-concat's ~83 KB estimate was inflated (same over-attribution as icons: 870 KB est vs 441 KB real).

- **Formalizing is version-fan-out, not one patch.** Several versions of one bridge lib (different libs pin different versions) were bundled into *one page's* main-thread → **multiple version-specific `pnpm patch`es**, each fragile (a dep bump can bundle a new unpatched version → half-gated, or drop the patched one → dead patch). The patches are small (only the ~220 changed signature lines, ~16 KB each), but the maintenance is real.

**Takeaways:** the principled gate is viable and macros work in libraries, but (1) **gate selectively** — never blanket-gate a jsb barrel, it contains main-thread-safe helpers; (2) the leaf win is **small and capped** (~0.4% here) because the bridge singleton is a structural floor; (3) local patching is **version-fan-out + fragile**. Land the local patches for the immediate win if asked, but the durable fix is **upstream**: `__BACKGROUND__`-gate the bridge core at construction in the lib's `.lynx.js`, which shakes the whole subtree (class included) for every consumer at once.

### What "leak" means
Code that only needs to run on the background thread (network/jsb calls, loggers, heavy SDK glue) but got pulled into the main-thread layer because a render-path module imports it without a `'background only'` boundary. Note ReactLynx already auto-shakes `useEffect`/`componentDidMount`/`bindtap` callbacks out of `main-thread.js` — a leak is code the compiler *couldn't* statically attribute to one thread.

### Best finder: read the readable prod `main-thread.js` and grep by module
The most precise way to find leaks is to look at what's *actually* in the shipped main-thread bundle, with readable names and module paths:
1. Build prod with **readable names + module paths**: `output.minify.mangle: false` (keep variable names — many projects already set this) **and** `tools.rspack.optimization.moduleIds: 'named'` (annotate each module with its source path). Add `DEBUG='rspeedy,rsbuild'` so the intermediate `main-thread.js` is kept (otherwise only the binary `.lynx.bundle` survives) — it lands at e.g. `output/.rspeedy/<page>/main-thread.js` (`find output -name main-thread.js` if a plugin relocated it).
2. `prettier --no-config --write <main-thread.js>` to expand it to readable lines.
3. Each module appears as `"(react:main-thread)/<source-path>"( __webpack_require__... ) { ... }`. **grep for background-only signatures and attribute each hit to its enclosing module** (the nearest `"(react:main-thread)/..."` above it): `NativeModules`, `GlobalEventEmitter`, `getJSModule`, `jsb`, `bridge` (the jsb-backed ones — always background-only), plus jsb-backed `sendReport`/`reportError`/logger calls, `\.request(`/`fetch(`, `mmkv`/`storage` (verify these aren't console-backed). A module full of these (e.g. `events.ts` = `ctx.getJSModule("GlobalEventEmitter").addListener(...)`) **should not be in main-thread at all** — it's a leak; trace its render importer and put it behind `'background only'`.

> **Tools (automate steps 2–3):** [assets/mt-leak-analyzer.mjs](assets/mt-leak-analyzer.mjs) lists the de-concat `main-thread.js` modules with sizes, background-only flags, and importer edges (who pulls each in); [assets/mt-cutpoint-analyzer.mjs](assets/mt-cutpoint-analyzer.mjs) groups bytes by `"(react:main-thread)/<path>"` header to rank the heaviest leaked modules. **Both need the named-module debug format** (`(react:main-thread)/<path>` headers). A normal **production `main-thread.js` is concatenated + minified** (real-tested: 42 KB on **2 lines**, zero `react:main-thread` headers) → the analyzers report **`0 modules, 0 kB` and do NOT warn** — a false "no leak". You MUST feed them a `concatenateModules:false` build (then prettier it from step 1); verify with `grep -c react:main-thread main-thread.js` (0 = wrong input, re-build de-concat). (Fix side: [assets/gate.awk](assets/gate.awk) selectively gates jsb wrapper functions — see *GATE SELECTIVELY* above.)

This beats stats analysis because it shows the *actual* main-thread content (post-shake, post-concat), not the pre-shake graph — you see exactly which background-only APIs survived into render, by module. A real audit found ~25 such modules: a render component that inlined a whole jsb/ad-video SDK (`bridge×126, jsb×26, NativeModules×6`), library loggers (a jsb logger client ×27), and small app utils (`events.ts`, `service.ts` request, `storage.ts`, a tracking call).

### How to find it (alternative)
From the moduleGraph (or `stats.json`), filter `layer === 'react:main-thread'`, drop asset modules (`.png/.zip/.m4a/...` — that's Lever 1), and keep code (`.ts/.tsx/.js/...`). Sort by `parsedSize`/`gzipSize`. Flag modules whose **basename** matches a background-only signature: `jsb`, `bridge`, `logger`/`report`/`monitor`/`track` (background-only when jsb-backed), `request`/`fetch`/`http`, `storage`/`mmkv`, `getJSModule`, `NativeModules`, `GlobalEventEmitter`, `protobuf`/`crypto`/`md5`. **Match the basename, not the full path** — every module under a `*-sdk/` dir contains "sdk" and will false-positive otherwise.

> **stats.json is often too big to `readFileSync`.** A multi-entry app's merged `stats.json` can exceed 512 MB (V8's string limit) — a real one measured ~989 MB. It's pretty-printed (2-space indent), so stream it with `readline`: detect the root `"modules": [` line, then capture each top-level array element (lines starting at 4-space indent `    {` … `    }`), `JSON.parse` each independently, and recurse into its nested `modules`. Bounded memory, no giant string. (rsdoctor sharded data avoids this; see [measure-with-rsdoctor.md](measure-with-rsdoctor.md).)

### ⚠️ Trace on a `concatenateModules: false` build — production edges lie
**This is the make-or-break caveat.** rspack's production default scope-hoisting (`optimization.concatenateModules: true`) **collapses the `reasons`/importer edges**: a hoisted module's importer is reported as the whole concatenated group (`"./pages/x/index.tsx + 699 modules"`), not the actual file inside it. So on a production `stats.json` the importer graph is **wrong for every concatenated module**, and reachability/dominator analysis produces **false positives**. In a real audit `lodash.mergewith` (49.5 KB) looked like removable main-thread code; rebuilding with `optimization.concatenateModules: false` (via `tools.rspack`) restored the real edges and it correctly showed as render-reachable → **dropped out**. Always do importer tracing on a `concatenateModules:false` build (or on rsdoctor's graph, which is captured pre-hoist). Revert the config after.

### Quantify first — set expectations before digging
Before tracing, compute one number: **background-only code as a share of main-thread code.** On a real, already-optimized app (edge-accurate, no-concat build): cleanly-background-only modules reachable in main-thread were **~0.9% (~75 KB parsed of ~8 MB)** — and of that, the "bonus" non-signature code that *only* the trace finds (a utils barrel, a perf logger) was just **~11 KB**, with **0 KB cleanly app-deletable** (everything was `[also in background layer]`, i.e. fixable only at the definition site, usually an SDK lib). Looser path-based signatures inflate this to several percent but sweep in render code — don't. Expect **~1% of main-thread code on a tidy app, mostly library-gated**: quantify it, state it plainly, and don't oversell the lever.

**Verify before claiming removable.** A module can look like a leak but actually be read during render. Typical pattern: a large shared-services module sits in the main-thread layer and *looks* removable, but tracing its importers shows many components render-read it → not removable. Often only some of its submodules (e.g. the `jsb`/`logger` parts) are truly dead on the main thread. Always trace before recommending a deletion.

### Importer tracing is the real value

The direct leaked API can be tiny (`getJSModule("GlobalEventEmitter")`, `NativeModules.bridge`, a logger, a request helper), but it is a **line of inquiry**, not just a byte count. Follow its callers/importers upward until you reach the render-path module that made the background-only code reachable from `react:main-thread`. That often reveals a larger pattern: a component imports a broad service/index module for one render-safe helper, and that service module also statically imports JSB, logging, storage, request, or SDK initialization code that main-thread will never execute.

Do this as a small reverse-dependency audit:

1. Pick suspicious main-thread modules by name/signature: `jsb`, `bridge`, `logger`, `request`, `storage`, `service`, `init`, `sdk`, `GlobalEventEmitter`, `NativeModules`, `getJSModule`.
2. In `moduleGraph`, walk `imported` / reverse edges from that module toward entry modules. Stop when you hit app components, custom hooks, store setup, or SDK package entrypoints.
3. Classify each edge:
   - **render-read** — the component really reads the value during render; not removable wholesale.
   - **handler/hook callback** — likely background-only if only triggered after interaction/effect; candidate for `'background only'`.
   - **broad barrel/service import** — candidate for splitting imports or moving JSB/logger/request behind a background-only boundary.
   - **library static import** — business app may not be able to fix it; route to library owners.
4. Report both the immediate leak and the upstream owner/import path. A useful finding says "main-thread contains X because A → B → C imports it", not only "X appears in main-thread".

**What the trace reveals: barrel re-exports** (the mechanism, even when the bytes are small). On the edge-accurate build, a clean chain was e.g. `src/common/utils/utils/index.ts` (a generic utils barrel, render-safe on its face) sitting in main-thread *only* because `request.ts` imports it, which is imported by an api barrel, imported by `reportPopupAck.ts` — i.e. a **report→api→request** chain ending at a barrel. The highest-leverage fix is **at the barrel**: deep-import the render-safe helper directly, or put the background-only exports behind a `'background only'` boundary, which removes the whole subtree from main-thread at once.

Honest caveat from the same audit: this mechanism is real but the *measured* subtree was small (~11 KB beyond the signature modules) and `[also bg]`. The "small leak → large win" story is the upside to look for, not the expected outcome — on a tidy app you usually find the gate code itself plus a thin tail, not a giant hidden tree. Report what the bytes actually are.

### Heuristic: event/lifecycle callbacks run on the background thread — mark them `'background only'` freely

In Lynx, **events are triggered on the main thread but regular JS event handlers execute on the background thread** (the whole reason the two-thread split exists — see [Main Thread Script](https://lynxjs.org/react/main-thread-script.html)). So when you see a `handleXXX` / `onXXX` callback, an event-emitter listener (`addListener('exposure', this.handleExposure)`), or a lifecycle method (`componentDidMount`/`componentWillUnmount`) whose body is tracking/jsb/request/logger work, you can **boldly add `'background only'` as its first statement** — it's background-only by construction, so the marker is correctness-neutral and lets its background-only imports shake from main-thread. **One exception: if that function imports widely-*shared / cross-page* modules, use the `__MAIN_THREAD__`/`__BACKGROUND__` macro instead of the directive** — the directive adds a layer constraint that can de-concatenate those shared modules and *regress other pages* (measured +37.6 KB on a sibling page; see the ⚠️ on shared imports below).

**The one exception: main-thread script (MTS).** A function declared with the `'main thread'` directive (first line) and bound via the `main-thread:bindXXX` attribute (e.g. `<view main-thread:bindscroll={onScroll} />`) runs *synchronously on the main thread* — for smooth animation / gesture handling. **Never mark an MTS function `'background only'`** (and the compiler won't let you call it from background). If a handler has `'main thread'` at the top or is bound through a `main-thread:` attribute, leave it alone. Everything else in the `handleXXX`/`onXXX` family is fair game. Full MTS reference: https://lynxjs.org/react/main-thread-script.html

> Measured: marking the whole `handleExposure` exposure-listener `'background only'` held the **raw byte-identical** `.lynx.bundle` as wrapping its tracking block in `if (__BACKGROUND__)` — the directive removes the function's main-thread references just like the guard does. The byte win still only lands once the *last* reference to a given import is gone (see "The real rule" under the classification table) — directive vs guard is a style choice, not a strength difference.

### ⚠️ The directive must survive compilation — `async` + a low syntax target *buries* `'background only'`

`'background only'` only works when it stays the **first statement of a real function body the main-thread transform can see**. Two source shapes silently defeat that — the source still has the directive, the build has 0 errors, and the jsb import **stays in `main-thread.js` anyway** (a silent no-op that looks like "the lever didn't help"):

1. **`async` function built to `es2015` (or lower).** A workspace lib compiled at `es2015` (the background-thread baseline; shared libs commonly pin it for the Lepus VM) lowers `async` to `__awaiter(..., function* () { ... })`, carrying the directive **into the inner generator** where the main-thread transform can't see it → no stub, no shake. **The tell:** in the *same* file a **non-`async`** function's directive works (its jsb shakes) while an `async` sibling's doesn't — that contrast proves the directive was buried, not that the lever is weak. **Fix — route the jsb call through a plain (non-`async`) `'background only'` wrapper**, and have every async helper call the wrapper:
   ```ts
   // ❌ es2015 build buries the directive in the __awaiter generator → jsb stays in main-thread
   export const openPoiSchema = async (...args) => { 'background only'; return jsb.searchOpenSchema(...args); };
   // ✅ plain non-async wrapper keeps the directive at the top of a real body → import shakes
   const callSearchOpenSchema = (...args: Parameters<typeof jsb.searchOpenSchema>) => {
     'background only';
     return jsb.searchOpenSchema(...args);
   };
   // every async helper: jsb.searchOpenSchema(...) → callSearchOpenSchema(...)
   ```
   The wrapper is still *referenced* by main-thread-reachable async helpers, but its **body is stubbed**, so the jsb import drops. Same fix collapses a **transitive third-party** chain reached only via async callers (a real case also wrapped an `openShortLink` helper → shook its `shortlink` SDK → that SDK's `utils` dep). **App source built at the app's higher target keeps `async` + directive working — this trap is specific to the `es2015`-built *lib dist***, so library fixes go in the lib's `src/` then rebuild the lib before the app consumes them.
2. **Expression-body arrow** (`async () => jsb.foo()`) has nowhere to host a leading statement. Convert to a block body with the directive first and an explicit `return`: `async () => { 'background only'; return jsb.foo(); }`.

### A top-level fire-and-forget native call leaks its *whole transitive chain* — `__BACKGROUND__`-guard it

A bare module-top-level side-effect call to a native/monitor registrar — `void registerPage({...})`, page/perf registration, reporters — runs at import time on **both** threads, dragging its **transitive** jsb chain into `main-thread.js` even though **there is no jsb-bridge import at the call site** (the jsb is several hops down: a real case had `registerPage` → a shared registration helper → a hybrid SDK → its jsb core). This is exactly the class a **signature grep on `main-thread.js` misses** — the leaked *module* is the jsb core, but the *fix point* is the unguarded top-level call, so a finder keyed on bridge/`NativeModules` at the call site won't flag it. Fix: move the call inside the module's existing `if (__BACKGROUND__) { ... }` block (the real fix moved the registration into the `__BACKGROUND__` guard already wrapping the page's other init). **Manual finder:** grep app entry/page modules for top-level `void someRegister(...)` / `initXxx()` not already under a `__BACKGROUND__` guard.

### Classify the leak, then pick the matching fix — and remove *every* reference

**⭐ Empirical anchor 2 — `__MAIN_THREAD__`-guard the CONSUMER functions; never use `import()` to "move" background-only code.** On a real app a de-concat + named build showed **232 KB of background-only modules in main-thread** (a network/request SDK incl a bundled 21 KB `package.json`, a btm SDK ~20 KB, monitors, loggers, `md5`, app `requester`/`monitor`/`reporter` glue). First mistake: I converted one btm-SDK use (in a `schema/index.ts` barrel imported by dozens of cards) to a **dynamic `import()`** → measured **.lynx.bundle +12.4 KB (WORSE)** and the SDK *stayed* in main-thread, because (a) `import()` adds a lazy-chunk + runtime overhead, and (b) the SDK had **other** main-thread references so it didn't shake (last-reference rule).

**The right tool is `if (__MAIN_THREAD__) return;` on every consumer function** (the same gate as the jsb lever, applied *upward* to the app/lib code that calls the SDK). It DCEs the body on the main-thread layer — **zero added bytes, strictly cannot worsen the bundle** (no lazy chunk) — and once *all* main-thread references to the SDK are gated, the whole subtree shakes. Redoing the btm case that way: guarded the 2 consumer fns (the get-token + init-SDK helpers) → **.lynx.bundle −31.9 KB**, the SDK's jump-position helper gone from main-thread, intact in background, 0 errors. (`__MAIN_THREAD__`/`__BACKGROUND__` are real DefinePlugin macros, typed in `@lynx-js/react`; lint may need `// eslint-disable-next-line no-undef` and the codebase may spell it `__LEPUS__`.)

**Three rules this teaches:** (1) to relocate background-only work off main-thread, **guard with the macro, don't `import()`** — dynamic import is for genuinely-lazy *render* code, and it *adds* bytes; (2) the **last-reference rule is absolute** — enumerate *every* main-thread consumer of the SDK and gate them all, or nothing shakes (use the de-concat importer graph to find them); (3) watch for the **init-time singleton** (`const requester = createRequester({...})` at module top-level) — gating the call-site functions won't shake it; you'd have to guard the construction too (`__MAIN_THREAD__ ? undefined : createRequester(...)`).

**When the singleton is NOT safely gateable — and you must recognize this.** The same request SDK was the counter-example: gating its construction is **unsafe**, because (a) the module has **top-level side effects that access the singleton at import time** — `requester.interceptors.request.use(...)` runs on module load on *both* threads, so `undefined` on main-thread → **crash at page load**; (b) the singleton is **exported and accessed directly in 3 other modules across 2 more shared libs**; (c) callers rely on a `RetType.abort()` contract, so even a no-op stub must honor it. Safely gating it would need a hand-built stub (which *adds* bytes) plus guarding ~6 sites across 3 libs, with an **app-wide request-crash risk TypeScript can't catch** (the `undefined as Requester` cast hides every missed access). `~30 KB ≪ that blast radius` → **don't; fix it upstream** (lib shouldn't eager-construct + register interceptors at module top-level). The "strictly can't get worse" property of the macro guard holds for **pure leaf consumer functions** (btm) but **NOT** for a singleton woven with module-level side effects.

**⭐ The cleanest gate of all — turn a RUNTIME thread-check into a COMPILE-TIME macro (zero behavior change, no stub).** Background-only singletons are often *already* guarded by a **runtime** check that happens to be thread-equivalent — e.g. `const Monitor = typeof NativeModules !== 'undefined' ? createMonitorInstance({...}) : null`. `NativeModules` is jsb, so it's `undefined` on the main thread → `Monitor` is **already `null` there at runtime** — but rspack can't *prove* the runtime check, so it bundles `createMonitorInstance` + its logger plugins into main-thread anyway. Add a compile-time macro to the condition — `__BACKGROUND__ && typeof NativeModules !== 'undefined'` — and rspack statically DCEs the SDK branch on the main-thread layer. **Runtime behavior is byte-for-byte identical** (still `null` on MT, unchanged on BG), there's no stub, and consumers already `Monitor?.x`-optional-chain. Measured −12.9 KB, correctness-neutral. **Always grep background-only SDK modules for `typeof NativeModules`, `if (!__LEPUS__)`, `if (__BACKGROUND__)`, `lynx.__globalProps`-based runtime thread/host checks gating a heavy construct — promoting them to a compile-time macro is the safest win on the board.** Do this *before* reaching for a stub.

**Shared dependencies need ALL referencing SDKs gated (last-reference rule, at the dependency level).** One logger plugin was referenced by *both* the monitor config *and* the request config. Gating only one left the plugin in main-thread; the request stub alone moved only −1–3.7 KB, but **combined** with the monitor DCE it shook the logger plugin too — a super-additive −20.4 KB extra. When a shake "should" work but barely moves, grep the surviving symbol for its *other* importers and gate those too.

**When you must stub a singleton (no existing runtime check), the stub must cover EVERY access form — grep-exhaustively.** Replacing `createRequester({...})` with a no-op stub on the `__MAIN_THREAD__` branch shook the request SDK safely — but only after the stub covered `interceptors / request / get / post / updateConfig` (the first version missed `get`/`post`, which `traffic.ts` calls at module level → would have crashed on MT). Grep every `<singleton>.<member>` across app+libs before trusting the stub; prefer the compile-time-macro or optional-chaining route when available because a missed method crashes at module load.

**And the de-concat map systematically OVER-counts what's shakeable.** `concatenateModules:false` disables JSON tree-shaking, scope-hoist DCE, etc., so de-concat module sizes are inflated — repeatedly confirmed on one app: icons de-concat 870 KB vs real 441 KB; a request SDK's bundled `package.json` showed 21 KB in de-concat but removing it measured **Δ0** (prod already tree-shakes the JSON to its one used key); "background-only in MT" totaled 232 KB de-concat but the only clean realizable cut was the btm consumer gate (−31.9 KB). **Use de-concat to find importer edges and candidates, but quote only production `.lynx.bundle` before/after deltas as wins** — never the de-concat byte sizes. The realizable main-thread prize on a tidy app stays ~1%, and the rest needs upstream/architectural changes.

**Empirical anchor (reversible experiment on a real app).** Tagging individual functions with `'background only'` — lifecycle callbacks, exposure/reach handlers, a data-fetch function, emitter on/off, etc. — moved `main-thread.js` only **~812 B raw / ~355 B gzip** (2,020,884 → 2,020,072 raw). It *looked* like the marker "doesn't cut the import graph" — but a later experiment proved otherwise: marking one whole callback (`handleExposure`) shook a whole bridge SDK (−33 KB gzip), raw byte-identical to a `__BACKGROUND__` guard. The reconciliation: in the 355 B run the tagged functions were **not the complete set of references** to the SDK imports they used — other unguarded render-path references (a sibling `throttle()` const, a util, a second component) kept the same imports alive, so nothing shook and only the body strings dropped. **The lesson is not "markers are weak" — it's "an import only shakes when its LAST main-thread reference is gone."** Tag/guard a few scattered functions and you'll see noise; enumerate and remove *all* references to a given import and the whole subtree drops. Always verify with a `.lynx.bundle` build, and don't report a single marker as a win until the import actually shook.

So the trace's job is to **classify what kind of leak each finding is**, because the fix differs and only some are worth it:

| Leak shape | What you see | Fix | Yield |
|---|---|---|---|
| **Leaf function** | one background-only fn inside a render module | `'background only'` directive (or `__BACKGROUND__` guard) | tiny (~hundreds of B) — usually not worth it alone |
| **Barrel import** | render module deep-imports a barrel that also re-exports request/jsb/logger | split the import / deep-import the render-safe symbol directly | removes the subtree — the real win |
| **Side-effect init** | a module run for its top-level effects (`initSdk()` at module scope), side-effect-imported by the app root | exported-fn + static binding import + top-level `if (__BACKGROUND__) { runInit() }` (see ✅ recipe below) | **real — measured ~−21 KB raw / ~−5.3 KB gzip** for one module; a naive `require()` guard *regresses* (see ⚠️) |
| **render+lifecycle mixed module** | one React component module carries both render *and* background orchestration (requests, reach, listeners, popup init in `componentDidMount`) | **move the background orchestration into a separate module** | same — real fix is a refactor; verify with `.lynx.bundle` |
| **multi-importer SDK** | a background-only library (jsb/bridge/logger SDK) shows up in main-thread because **several** render-path modules reference it (in handlers, exposure listeners, module-top `throttle(fn)` consts) | remove **every** main-thread reference — `if (__BACKGROUND__)` guard on the block, OR `'background only'` on a whole background callback (both remove the references; see rule below) — so DCE drops the named import everywhere → the whole SDK shakes | **the biggest single win measured — ~−72.6 KB raw / −33.0 KB gzip** for one bridge SDK (3 importers), control byte-identical. **Only feasible if you can enumerate+remove ALL main-thread references** — an SDK with ~30 importers (e.g. a core jsb bridge) is not app-side fixable; it needs the library itself to split by thread |

> **The real rule (reconciles the two measurements below): an import shakes from main-thread iff you remove ALL of its main-thread references — and both a `'background only'` directive on a whole background function and an `if (__BACKGROUND__)` guard remove the references inside them (measured byte-identical: marking `handleExposure` `'background only'` shook a bridge SDK exactly as well as guarding its block — raw byte-identical).** The earlier "markers only saved ~355 B" result (below) was NOT the directive failing to cut the graph — it was tagging *some* functions while *other* unguarded references kept the same SDK imports alive, so nothing shook and only the body strings dropped. So: mark/guard freely, but you only get the byte win once the *last* reference to a given import is gone. Use a `__BACKGROUND__` guard when the surrounding function also has main-thread-needed code; use the `'background only'` directive when the **whole** function is background (cleaner, and the idiomatic Lynx way for `handleXXX`/`onXXX`/listeners/lifecycle — see the callback heuristic above).

**Critical constraint: you cannot `import 'background-only'` from a main-thread module** — the build fails with *"background-only cannot be imported from a main-thread module."* So **side-effect-init and mixed-module leaks can't be marker-fixed; they must be split.** Typical pattern: an SDK-init module that runs `initSdk()/initOther()` at module top level and is side-effect-imported by the app root drags request/logger/popup/reach into main-thread — the fix is to separate the render-safe init from the background init, not to slap a directive on it.

### Fixing a leak that lives in a `node_modules` library — measure first, then `pnpm patch`

When the leaking module is a third-party/SDK package, you don't have to "route to the owner and wait" — you can patch the installed package directly: **`pnpm patch <pkg>@<ver>`** (or your monorepo's `pnpm patch` passthrough) opens an editable copy, you add the `'background only'` directive / `__BACKGROUND__` guard to the offending function, then **`pnpm patch-commit <dir>`** writes a `.patch` and registers it in `patchedDependencies`. One patch fixes the leak for **all** importers at once — the library-split the multi-importer row says you "need" can be done locally. (Measured: patching one logger SDK's unguarded `sendLog`/`init` methods to `'background only'` → −6.5 KB raw / −3.0 KB gzip, control byte-identical. Persistence in a monorepo can be tooling-specific — some setups store the `.patch` under a gitignored temp dir and rewrite the lock to a hash ref — so confirm the team's patch-commit flow before relying on it across clones.)

**But measure the per-package main-thread footprint BEFORE patching — most heavy `node_modules` in main-thread are NOT leaks.** Build the readable `main-thread.js` (mangle:false + moduleIds:'named'), then sum bytes between consecutive `"(react:main-thread)/<path>"` markers, grouped by package. What this reveals on a real app:
- The scary "core SDK imported by 500+ modules" (e.g. a jsb bridge) is often **already tree-shaken out of main-thread** — it doesn't even appear in the top-N. Importer count ≠ main-thread weight. The jsb wrappers are reached only from background, so they're already gone; patching them buys nothing.
- A logger SDK may **already guard its heavy client** with `if (!__LEPUS__)` / `if (__BACKGROUND__)` in its constructor — no leak to fix (and watch out: a naïve signature grep counts a `webXxxLogger` *property name* as a logger leak — a false positive).
- The genuinely-heavy main-thread `node_modules` are usually **render UI component libraries** (countdown, modal, rolling-number, button…), generic utils, and lodash — these are *legitimately* on the main thread because they render, so they're **not** background-only-patchable. The lever for them is dedup (multi-version lodash) or lazy-loading (first-screen), not `'background only'`.
- Beware the **concatenation attribution trap**: a scope-hoisting group root (e.g. `tslib.es6.mjs`) can show an absurd size (1 MB+) because inlined modules with no own marker get credited to it. Cross-check suspicious giants against a `concatenateModules:false` build before believing them.

Net: the `pnpm patch` lever is real but its *upside is small on a tidy app*, because the big main-thread `node_modules` are render UI, not leaked background code. Confirm a package is both heavy in main-thread **and** genuinely background-only before spending a patch on it.

> ⚠️ **The naive "split" can make the shipped binary BIGGER — measured.** A tempting quick fix is to replace the static side-effect `import './initSdk'` with a guarded runtime require: `if (!__LEPUS__) { require('./initSdk') }`. It *does* DCE the subtree out of the main-thread layer — but a runtime `require()` **defeats ModuleConcatenation (scope-hoisting)**: the subtree that was hoisted/minified into the entry scope becomes individually-wrapped modules on the *background* side. In a real reversible experiment this made one page's `.lynx.bundle` go **1,705,232 → 1,728,170 gzip (+22.9 KB gzip)** — a net **regression**, because `.lynx.bundle` ships both layers and the de-concatenation cost outweighed the main-thread removal. Always measure `.lynx.bundle` before/after; "removed it from main-thread.js" is not the same as "shrank the shipped bundle."

> ⚠️⚠️ **The `'background only'` DIRECTIVE can de-concatenate shared modules across OTHER pages — use a `__MAIN_THREAD__`/`__BACKGROUND__` macro instead. Measured both ways.** Marking a module that imports **widely-shared utilities** with the `'background only'` directive (or IIFE) adds a *layer constraint* that forces those shared modules out of scope-hoisting in **every** page bundle that uses them — even pages that don't import your module (they're coupled through the shared module + global ModuleConcatenation). The macro ternary is plain define-substitution → DCE, with **no layer tag**, so concatenation survives.
>
> Real measured case — 4 redux **effect** defs (`defineEffects(atom, {...})` at module top, all consumers background):
> | form | target page (task) gzip | sibling page (sign, doesn't import effects) gzip |
> |---|---|---|
> | `(() => { 'background only'; return defineEffects(...) })()` (directive IIFE) | −4.2 KB | **+37.6 KB** ❌ |
> | `__MAIN_THREAD__ ? (undefined as never) : defineEffects(...)` (macro) | **−5.7 KB** ✅ | **−12.0 KB** ✅ |
>
> The directive→macro swing on the sibling page was **−49.7 KB gzip**. The macro form improved *both* pages (−17.7 KB total). The `(undefined as never)` keeps the type clean (`never | T` collapses to `T`, callers need no cast), and it's a one-line edit (no IIFE close).
>
> **Rules:** (1) To strip a module's main-thread footprint when it imports **shared/cross-page** code, use `__BACKGROUND__ ? value : undefined` / `__MAIN_THREAD__ ? undefined : value` (pure DCE) — **never** the `'background only'` directive. (2) Always measure **every** page, not just the target: a previously byte-stable control page suddenly moving is the de-concatenation tell. (3) The `'background only'` directive is still fine for code importing **page-local / genuinely-isolated** SDKs (that's why the page-local bridge SDK and `handleExposure` cases were clean — control byte-identical); the danger is specifically shared imports. When unsure which, the macro is the safe default — it never adds a layer constraint.

> ✅ **The recipe that works — static ESM + `__BACKGROUND__`, no `require()` (measured ~−21 KB raw / ~−5.3 KB gzip for one init module).** Keep concatenation intact by never introducing a runtime require. Two steps:
> 1. **Wrap the module's top-level side effects in an exported function** so the module body is side-effect-free: `export function runInit() { initSdk(); initOther(); }` (no top-level execution left).
> 2. In the consuming render module, switch the bare `import './initSdk'` to a **binding import** and **call it from a top-level `if (__BACKGROUND__)` guard**: `import { runInit } from './initSdk'` … then at module top level `if (__BACKGROUND__) { runInit(); }`.
>
> Main-thread: `__BACKGROUND__` is `false` → the guarded call is DCE'd → the binding is unused → and because step 1 made the module body side-effect-free, rspack's `optimization.sideEffects` (on by default in prod) **auto-detects** it and shakes the whole subtree from main-thread. Background: `__BACKGROUND__` is `true` → init runs at module-eval time, same as the original (no behavior change). All imports stay static ESM, so concatenation is preserved — no de-hoisting penalty.
>
> Notes: **Step 1 is the load-bearing part** — `sideEffects:false` alone, *without* extracting the init, would just drop the side effects on background too (breaks it). And once the module *is* side-effect-free, you usually **don't need an explicit `sideEffects` flag** — verified byte-identical with and without a `tools.rspack.module.rules: [{test:/initSdk\.ts$/, sideEffects:false}]` entry. (Keep the explicit flag only if auto-detection is conservative for a stubborn module, e.g. a re-export barrel.) Prefer the **top-level `if (__BACKGROUND__)` guard over `componentDidMount`** — the lifecycle defers init past first render (a behavior change); the top-level guard preserves import-time timing for the same byte win. Use the canonical macro `__BACKGROUND__` / `__MAIN_THREAD__` (the `__JS__` / `__LEPUS__` forms are deprecated aliases — verified in lynx-stack `packages/react/runtime/types`).

> ✅ **Variant — a top-level singleton (`export const x = new Service()`).** Same problem (the `new` is a top-level side effect that pins the module + class in main-thread even when `x` is only used in background), same cure. Wrap just the construction in a `'background only'` IIFE so it strips on main-thread:
> ```ts
> export const reachService = (() => {
>   'background only';
>   return new ReachService();
> })();
> ```
> Main-thread strips the IIFE body → `new` and the `ReachService` class shake out; background constructs it normally. The IIFE form keeps the return **type** (`ReachService`) with no cast — cleaner than `export const x = (__BACKGROUND__ ? new Service() : undefined) as Service`. Measured ~−10 KB raw / ~−4.5 KB gzip for one singleton (control page byte-identical). Prerequisite, as always: every use of `x` must already be in a background context (lifecycle/handlers) — if render reads it, it stays. **And if `ReachService` (or anything it imports) pulls in a widely-shared / cross-page module, the `'background only'` IIFE will de-concatenate it across other pages (the +37.6 KB regression above) — use the macro form `(__BACKGROUND__ ? new ReachService() : undefined) as ReachService` there instead.**

The compile-time macros `__BACKGROUND__` and `__MAIN_THREAD__` (the older `__JS__` / `__LEPUS__` are deprecated aliases) guard a block the compiler can't attribute on its own (details in [dual-thread-architecture.md](dual-thread-architecture.md) §代码裁剪). A `__BACKGROUND__` guard and a `'background only'` directive both **remove the references inside them** from the main-thread graph — the import they fed shakes once *every* reference to it is gone (see "The real rule" above). Guard a *block* when the surrounding function still has main-thread work; mark the *whole function* `'background only'` when it's entirely background (the idiom for `handleXXX`/`onXXX`/listeners); guard a *top-level import-driving call / construction* (the init/singleton recipes above) to shake a whole subtree at module scope.

### `'background only'` is contagious — and that's the lever
Marking one thing background-only **propagates**: everything it imports becomes background-shakeable, and every place that *uses* it must itself be in a background context (or it pins the thing back into main-thread). So the productive loop is to **follow the chain upward and mark layer by layer** — a background-only service → its background-only callers → their background-only modules — each marking lets the next subtree shake out of `react:main-thread`. The wins compound across layers far more than any single guard. Practical loop: from the main-thread `stats.json`, find a background-only seed (jsb/request/logger/report/reach/a service singleton), confirm all its main-thread uses are already background, mark it, **measure `.lynx.bundle`**, then move one layer up the importer chain and repeat until a real render consumer blocks you.

> ⚠️ **Guarding a value to background-only forces you to guard its top-level consumers too — this is correctness, not just optimization.** If you do `export const svc = (() => { 'background only'; return new Svc() })()`, then on the main thread `svc` is **`undefined`**. Any *top-level* code that uses it (e.g. a sibling `Object.entries(map).forEach(([k,cb]) => svc.register(k, cb))` registration block) will run on the main thread and **crash** with `undefined.register(...)`. So you must wrap that consumer block in `if (__BACKGROUND__) { ... }` as well. This (a) removes the crash and (b) shakes the consumer block *and the functions it references* (the registration callbacks, their imports) out of main-thread too — the recursive "mark one layer, the next layer falls" win in action. Always grep the module for *other top-level uses* of anything you just made background-only, and guard them in the same change.

**The biggest chains are third-party.** The heaviest leaks usually trace into shared SDK libraries (jsb/request/logger glue) reached via a handful of entry components (widgets, promotion entries, reach HOCs). Real removal needs the **library** to split a render-safe entry from its background entry — app-side single-point edits can't fix it. Report it as a library ask with the entry component named.

For the directive's semantics and accepted forms, defer to the `reactlynx-best-practices` skill (`detect-background-only` rule) — don't re-derive them here.

### This lever is a trace workflow, not a "see leakage → add `'background only'`" reflex
1. From main-thread stats/product, find JSB / logger / request / storage modules.
2. Reverse-trace to the business caller (on a `concatenateModules:false` build — see the ⚠️ above).
3. Classify the leak: leaf function · barrel import · side-effect init · render/lifecycle-mixed module.
4. Apply the matching fix from the table — markers for leaves (rarely worth it), import-split or module-split for the rest.
5. **Verify the byte delta with one build.** Never report the marker/edit as a win without before/after numbers.

---

## Lever 4 — Template / compile-layer knobs (Lynx-specific, often higher ROI than the JS tail)

`.lynx.bundle` = `tasm encode(main-thread.js + background.js + cssMap)`. Beyond the JS graph there are **compile-layer knobs** that shrink the binary directly. These are usually a few config lines and frequently beat grinding the main-thread-leakage tail. Each is a candidate to **measure** (estimates below are rough — verify with a build):

- **CSS minify — `output.minify.css`.** Lynx projects often set `minify: { css: false }` (fear of breaking the scoped-CSS / tasm pipeline). CSS is encoded into `.lynx.bundle`; if unminified, all whitespace/comments/long class names ship. Flipping to `true` can be a large win on CSS-heavy pages (est. tens of KB gzip). **Risk: style breakage** — measure bytes *and* verify rendering. Note `pluginReactLynx` may also force `minify.css:false` when `enableRemoveCSSScope:false` (a guard) — check that interaction.
- **String extraction — `pluginReactLynx({ extractStr: true })`.** Duplicated string literals are hoisted into a **shared table** (stored once, referenced from both main-thread and background) → fewer duplicates in `.lynx.bundle`. **Just set `extractStr: true`** — tuning the `strLength` threshold is generally **not** recommended (the default is already tuned; lowering it has diminishing returns and can regress from index overhead). Low risk; measure the before/after.
- **Debug info — `debugInfoOutside` / debug-info level.** Debug metadata can be large; placing it outside the template (or trimming its level) reduces shipped size. Confirm the project's setting.
- **ES target (`output.environment`)** — covered in [rspeedy-gotchas.md](rspeedy-gotchas.md) §1: a project forced to full ES5 pays a size premium vs es2015/es2019 (one project estimated ~+143 KB raw / ~+12 KB gzip for full-ES5). Engine-driven, usually not movable, but quantify it before assuming it's free.

### Duplicate emitted resources (images/lotties) in the output
Even when media is served from a CDN (external to `.lynx.bundle`), the **build can emit the same image content as multiple files**, and the same asset is often duplicated across an app + the SDKs it bundles (e.g. a sign-in-modal background present in several sign-in SDKs, animation frames in the app + multiple shared static-asset SDKs). To find it: hash (`md5`) every emitted image under the output dir, group by content hash, rank duplicate groups by `size × (copies-1)`. Real audits found ~tens of MB of source-side duplicate copies. Caveats: (1) contenthash asset pipelines often auto-dedupe identical content — **verify in the *output*, not just source**, since source dups may collapse; (2) if the dups are external CDN assets, deduping shrinks download/CDN footprint and runtime fetches, not `.lynx.bundle` itself — still a real "perceived bundle" win, just be precise about which number moves.

### ⭐ i18n: all-locales statically bundled into the render path (often the single biggest app-side chunk)

A recurring, high-value leak in Lynx apps: the i18n setup **statically bundles every language** into the bundle — and because i18n is used in render, the locale JSON lands in **`main-thread.js` AND `background.js`** (duplicated → shipped ~twice in `.lynx.bundle`). The tell in source:

```ts
const localesContext = import.meta.webpackContext('./locales', { regExp: /\.json$/ });  // eager → all 57 langs bundled
// ... resources: Object.fromEntries(localesContext.keys().map(...))   // registers every locale
```

**How to spot it:** (1) grep app source for `import.meta.webpackContext(` / `import.meta.glob(` pointing at a `locales` dir, or a `locales/` dir with many `.json`; (2) build readable `main-thread.js` (moduleIds:'named') and group module bytes by path — if `src/i18n/locales/*` dominates, this is it. On a real app **`src/i18n/locales/*` was 2.34 MB = 87% of a 2.64 MB `main-thread.js`**, and the same ~2.3 MB was *also* in `background.js`.

**Measured win** (build with only the `en` locale to approximate active-locale-only, warm cache): one app dropped **−1093 kB / −12.9%** of `.lynx.bundle` across 5 pages (one page 5479.8 → 4981.5). This is usually the **largest single app-side lever** on an i18n-heavy app — far bigger than any leakage/config tail.

**⚠️ Do NOT "fix" this by lazy-loading the locales — the active locale is first-screen-direct-render content.** The tempting fix (switch the context to lazy mode, `await import` the active language) is **wrong**: the main thread renders translated text on the **first-screen direct render**, so the active locale is needed *synchronously at first paint*. Lazy-splitting it forces a dynamic chunk load *during* first-screen render → the first screen gets **slower** (or flashes untranslated text). This is the general rule (see the lazy-bundle lever below): **never lazy-split anything the first-screen direct render needs** — and i18n's active locale is exactly that. (An "only `en` bundled" build is a useful way to *measure the prize* — it showed the −1093 kB above — but it is **not a shippable fix**; it just deletes the other languages.)

**So what IS first-screen-safe?** The bloat is the *duplication* (every language, in *both* layers), not the active locale itself. First-screen-safe ways to claim it:
- **`extractStr`** dedups the duplicated main/background locale strings into one shared table — **no defer, no first-screen cost** (strings stay synchronously available, stored once). This is precisely its job and the cleanest fix *when it's permitted*.
- **Host-injected active locale:** some containers can hand the active locale's resource to the page synchronously via globalProps; then no languages need to ship in the bundle and first screen stays synchronous. This is an **architecture change** (needs host cooperation), not an app-only edit.
- The 56 *non-active* languages are first-screen-irrelevant, but you **can't statically pick which one is active** (it's runtime `appLocale`), so you can't selectively keep "the active one" eager while lazying the rest.

Net: **quantify the i18n bloat (it's often the biggest single chunk — found in ~5–6 projects of one fleet, each 57 locales, one with an anomalously huge baseline), but realize it via `extractStr`/host-injection, NOT lazy.** Without one of those, it's an honest wall — report the size and the required change, don't ship a first-screen regression.

### Font subsetting — `pluginFontmin`
Inlined/subsetted fonts can be sizable. An over-broad subset inlines a big `.ttf`; an under-broad `text` set white-boxes glyphs. Check whether fonts are inlined into the template and whether the subset is right-sized.

### Lazy bundle / dynamic components — a FIRST-SCREEN lever, NOT a total-size lever
ReactLynx 3 supports a dynamic loader (`IS_RL3_DYNAMIC_LOADER`) + lazy components. Splitting **non-first-screen surface** (popups, modals, drawers, secondary-activity SDKs) out of the initial `.lynx.bundle` makes the **first-screen download smaller** and load faster. First screen typically needs only header + primary content + main list; everything triggered later can be lazy.

> ⚠️ **Measured: lazy bundle shrinks the initial template but INCREASES total download.** The lazy API works — `import { lazy } from '@lynx-js/react/experimental/lazy/import'`, `const X = lazy(() => import('./X'))`, used **standalone** (`Suspense` is **not** exported by the ReactLynx runtime — verified against `@lynx-js/react`, whose main entry exports neither `Suspense` nor `lazy`; don't wrap it, see [rspeedy-gotchas.md §11](rspeedy-gotchas.md)) — and produces a real loadable lazy template at a separate lazy bundle under `output/.../async/<path>/`. On a real app, lazy-splitting **one** component: initial page `.lynx.bundle` **−204 KB raw / −85 KB gzip**, but a new lazy bundle **+382 KB raw / +144 KB gzip** appeared → **total +177 KB raw / +59 KB gzip**. The lazy bundle is a **standalone template that re-includes framework runtime/wrapper overhead** (~178 KB raw / ~59 KB gzip of it in that experiment), so it's *bigger* than what left the main template. **So: if the goal is total/whole-app size, lazy bundle is the wrong tool (it makes total worse). If the goal is first-screen render/initial download, it's a strong lever.** Be explicit which metric you're optimizing before reaching for it.
>
> **Consolidate into FEW BIG lazy bundles, not many small ones.** The overhead is roughly *fixed per lazy bundle* (the framework runtime re-inclusion), independent of component size. So splitting one 200 KB component costs ~the same overhead as splitting a 600 KB cluster — splitting N small components pays the overhead N times. Find the **single biggest deferrable cluster** (the component/barrel with the largest *exclusive subtree* — compute it: for each candidate the main entry imports, exclusive-subtree = modules reachable normally minus modules still reachable with that candidate cut) and split *that* as one bundle. On a real app the biggest deferrable single entry was the **popups barrel (645 KB parsed exclusive)** — ~3× a single popup component — but note a side-effect-registration barrel needs the on-demand registration (dialog manager) to lazy-load per component, more work than lazy-loading a single rendered component.

> **Lazy a LOCAL default-export component, not a package named-export that shares the package with static imports.** Measured: splitting a clean local component (`const X = lazy(() => import('./X'))`) moved its full exclusive subtree (−204 KB raw). Splitting a package named-export — `const NewTaskWidget = lazy(() => import('@pkg').then(m => ({default: m.NewTaskWidget})))` — moved only ~82 KB raw (vs 301 KB estimated), because another static `import { RewardTypeEnum } from '@pkg'` kept most of `@pkg` in the main template; only the part *exclusive to that one export* moved. So when a candidate is a package named-export, either (a) split the whole package's import site, or (b) expect a much smaller move than the cluster size suggests. Combined first-screen for two rendered components: **−110 KB gzip off `.lynx.bundle`, +79 KB gzip total** (two lazy bundles' overhead).

**Size the deferrable surface before anything else — it's usually the headline number.** Method: from the build `stats.json`, take all code modules (main + background), drop `node_modules` (framework, hard to defer), and bucket the business modules by path into **deferrable** (name/path matches `popup|modal|drawer|dialog|treasure|fission|share|reward|coupon|appointment|redpack|lottery|sign-in|watch-video|widget|cross-zone|new-user|prize|giftbox|...`) vs **core**. Sum each; rank the deferrable clusters by size. On a real already-JS-optimized app this came out to **framework 49% / business-core 24% / business-deferrable 26% (~5.3 MB parsed)** — i.e. a quarter of the code was non-first-screen UI, dwarfing the ~tens-of-KB from every leakage/config lever combined. Biggest clusters were sign-in / generic popups / watch-video / widget / treasure-box.

**That's the size of the prize; realizing it is architectural, not a quick win.** Hard caveats:
1. **"Deferrable by name" ≠ truly non-first-screen** — some modals auto-pop on load. You must confirm each cluster is only rendered after interaction (product/runtime knowledge, not static analysis — don't guess; lazy-loading a first-screen modal breaks UX).
2. **`lazy(() => import('./X'))` does work in ReactLynx** (verified — emits a separate lazy bundle under `output/.../async/<path>/`, loaded on demand by the dynamic loader). Import `lazy` from `@lynx-js/react/experimental/lazy/import` and use it **standalone** — `Suspense` is **not** exported by the ReactLynx runtime (see [rspeedy-gotchas.md §11](rspeedy-gotchas.md)). (`experimental_isLazyBundle` is the separate *standalone* lazy-bundle mode for cross-build/CDN-published components — not needed for in-app splits.)
3. **Watch for fake lazy.** A `lazy(() => Promise.resolve({ default: AlreadyImported }))` defers *rendering*, not *loading* — the component is still statically bundled, so it saves **zero** bytes. If that's the only `lazy()` in the repo, there's no real code-split precedent, but real `lazy(() => import())` still works.
4. Shared SDKs imported wholesale need their import site split.

So: quantify the surface early (cheap — sets expectations and is often the headline number), but treat realization as an infra/architecture project gated on (a) a real per-cluster "is this first-screen?" answer and (b) a working lazy-bundle+CDN path — not an autonomous code tweak.

---

## Putting it together: a prioritized report

After sizing all three:

```
Total: 14.2 MB
├─ Media        10.1 MB  ← attack first (WebP + dedup → est. -6 MB)
├─ JS bg         3.0 MB  ← already tree-shaken; dedup nets ~-50 KB
└─ JS main       1.1 MB  ← ~65 KB is app-side leak (fixable), rest is in SDK libs (library ask)
```

Lead with the table. The biggest lever decides the engagement; everything else is secondary.
