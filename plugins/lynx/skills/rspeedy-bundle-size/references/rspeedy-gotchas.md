# Rspeedy/Lynx gotchas that bite bundle-size work

Things that will produce wrong findings or broken builds if you treat a Lynx app like a generic webpack project. Read before editing config or asserting a finding. The behaviors below live in **lynx-stack** (https://github.com/lynx-family/lynx-stack) — when in doubt, grep the source and confirm rather than guessing.

## 1. The two threads ship at different, fixed ES targets — don't "fix" them for size

rspeedy compiles the two layers to **different ES baselines**, and this is a deliberate platform decision people normally don't touch:

- **Main thread (`react:main-thread`): fixed ES2019.** The ReactLynx plugin's per-layer swc loader pins the main-thread `env` to a fixed ES2019 baseline regardless of dev/prod — the source comment: "the main thread targets an es2019 engine, so its baseline is a platform constant."
- **Background thread (`react:background`): ES2015 in production** (ES2019 in dev). From the `getESVersionTarget(isProd)` util (`isProd ? 'es2015' : 'es2019'`), applied via rspeedy's swc plugin.
- **Both threads lower `let`/`const` → `var`** (`transform-block-scoping`), on purpose — "QuickJS parses `var` faster." So seeing `var` everywhere is not a missed optimization.

**Why it matters for size work:** these targets are fixed and engine-driven; **don't propose retargeting to a newer ES version to save bytes.** The output is already es2015/es2019 (arrow functions, shorthand, etc. are *kept*), so the realistic byte savings are tiny, and you'd be fighting a platform constant. The one syntax that *is* down-leveled (`let`/`const`→`var`) is a parse-time choice, not a bug.

**Some projects go lower on purpose (do NOT generalize):** a project may additionally pin `tools.rspack.output.environment` to **full ES5** (`arrowFunction:false, templateLiteral:false, destructuring:false, optionalChaining:false, ...`), going *below* the es2015/es2019 defaults — typically to match an older bundler's output shape or shave engine parse time. Full-ES5 output is slightly *larger* in bytes (modern syntax is more compact), so it's a size-vs-parse-time tradeoff. If you encounter such a config, treat it as a deliberate exception, not the norm — the norm is main=es2019 / background=es2015 above.

## 2. rsdoctor data can be sharded — reconstruct it correctly

If the build emits a `.rsdoctor/` directory (manifest + shards) instead of a single `rsdoctor-data.json`, a multi-shard domain is **one zlib stream split across files**. Concatenate the base64 TEXT of the shards in order, then base64-decode and inflate **once**. Inflating shards independently fails. Details in [measure-with-rsdoctor.md](measure-with-rsdoctor.md). Get this wrong and every size number you report is garbage.

## 3. Use the pinned Node version

Builds require the project's pinned Node (commonly `20.19.0`):

```bash
# via your Node version manager — fnm:
fnm exec --using=20.19.0 -- pnpm build
# or nvm:
nvm exec 20.19.0 pnpm build
```

Node 24+ breaks rspeedy config loading (strip-types runs inside `node_modules` and chokes). If a build fails with a config-parse error on a machine with a newer default Node, this is almost always the cause.

## 4. macOS shell traps during builds

- **No `timeout` command** on stock macOS — commands using it fail with `timeout: command not found`. Run without it, or install coreutils (`gtimeout`).
- **`.DS_Store` race**: `npm run clean` / `rm -rf output` can report `Directory not empty` because Finder/Spotlight just wrote `.DS_Store`. Re-run, or `rm -rf output` manually (which removes the `.DS_Store` too), then build.

## 5. Don't manually wire rsdoctor

rspeedy owns the rsdoctor integration via `tools.rsdoctor` + `RSDOCTOR=true`. Do **not** `pnpm add @rsdoctor/rspack-plugin` and push a plugin into `tools.rspack.plugins`, and don't reverse-engineer any internal rsdoctor fork. The config path is the supported one and respects the project's schema (which rejects unknown keys). See [measure-with-rsdoctor.md](measure-with-rsdoctor.md).

## 6. Image-optimization plugins are often CI-only — a local build ships uncompressed media

Projects frequently gate image plugins on a CI flag, e.g. `pluginCompressImage({ open: IS_CI })` and `pluginRankImg({ open: IS_CI })` where `IS_CI` is derived from a CI env var. So a **plain local `npm run build` does NOT compress/downscale images** — the emitted assets are the raw originals (e.g. multi-MB PNGs). **Don't judge shipped media size from a local build**: you'll wildly overstate it and "discover" a WebP/compression lever that CI already applies. To assess real media size + remaining headroom, build CI-equivalent (set the project's CI flag) or inspect a CI artifact. (JS minify is usually gated on prod-mode, not CI, so `.lynx.bundle`/JS measurements from a local prod build are still valid — but media isn't.)

## 7. The first cold build is ~2.4% bigger than warm — warm the cache before measuring before/after

Measured on a real project: the **first build after a cold rspack/build cache** produced `.lynx.bundle` = 5611.3 kB, while **every subsequent warm build** produced 5479.8 kB (≈ the published baseline) — a stable **~2.4% cold-cache premium**. The byte difference is real and reproducible, not noise.

**Why it ruins before/after work:** the natural script is `build baseline → patch → build optimized → measure`. The baseline build runs cold, the optimized build runs warm — so the optimized chunk looks ~2.4% smaller **purely from cache warmup**, and you credit the lever for a win it didn't produce. (This silently inflated an earlier `extractStr` fleet measurement.)

**Discipline:** before measuring a lever, **warm the cache** — build once and discard, *then* measure baseline (warm) and optimized (warm). Or build each variant twice and take the second. A `.lynx.bundle` delta under ~3% is inside the cold-cache band and must be re-measured warm before you believe it. (The published baseline in a dashboard is a *warm* number; a single fresh clone+build won't reproduce it on the first try.)

## 8. An anomalously huge page is often a whole directory swept in by `webpackContext`/glob — quantify it, but don't assume it's a bug

Found on a real app whose page was **71 MB**: an i18n `import.meta.webpackContext('../locales', …)` had pulled **all 57 languages' full help-article content** into the chunk (verified by grepping a distinctive Burmese/Thai string — present). main-thread.js 36 MB + background.js 37 MB ≈ 71 MB. Replacing the context with an explicit single import (`import en from '../locales/en.json'`) measured **71 MB → 1.5 MB (−97.8%)**.

**But treat this as a *quantified tradeoff*, not a defect — the all-languages bundle may be deliberate.** On that app the **prod** regExp was `/\.json$/` (matches *all*) while **dev** was the *restricted* one — i.e. prod intentionally bundles more, and the source comment said the localizations are static so they're "available at the initial screen" (instant any-language first screen, no async fetch). That's a real product choice (offline/any-language/language-switch without a round-trip) whose price just happens to be large. **Your job is to make the price visible — "keeping all 57 languages costs ~70 MB/user; per-language loading would be ~1.5 MB" — and let the team decide.** Don't call it a bug or ship the en-only hardcode (it breaks non-active-language first screen): the production-correct version keeps the **active** language synchronous (it's first-screen content) and loads the rest at runtime (server/host), which is the i18n lever's first-screen caveat (three-levers §i18n) at extreme scale.

Lesson: when a page is anomalously huge, grep the built chunk for whole directories of content (locales, all-icon sets, data JSON) a `webpackContext`/glob may have swept in — it's often the biggest number on the table. Quantify the per-item-needed alternative, present it as an option with its first-screen/UX cost, and let the owner weigh it.

## 9. Measure before asserting; report the wall honestly

The recurring lesson from real audits: an already-optimized project has **no cheap JS wins left**. Tree-shaking is done, `sideEffects` is correct, DCE nets ~0 at the bundle level, and the main-thread leak lives in SDK libraries you can't edit from app code. When that's the state, **say it** — the value is an accurate map (media is the lever; main-thread leak needs a library change), not a pile of marginal diffs that look like progress.

## 10. The init-time singleton is a structural floor — gating call-sites can't shake it

When a module **constructs an object/class at load time** (`const bridge = new BridgeCore()`, a registered singleton, an engine instance), that instance — and every method body it carries — is referenced by the module's top-level code, so it survives DCE **no matter how you guard the call-sites**. Tree-shaking removes *unreferenced* declarations; an eagerly-constructed singleton is referenced by construction.

Concretely (measured on one real jsb bridge SDK): selectively prepending `if(__MAIN_THREAD__)return;` to the top-level **jsb wrapper functions** (those delegating to the bridge singleton) shook their bodies out of main-thread (−30.1 KB), but the residual `this.bridge.call/on/off` + `NativeModules` lived in an **ES6 class instantiated at module-init**. Those are class methods reached through the singleton, not top-level functions — so call-site gating left them untouched. This is the same shape as a first-screen render engine that's `new`'d at init (a Pixi-like draw engine): code referenced at load time is a floor.

**Implication for the main-thread leak lever:** the shakeable part of a jsb/SDK leak is the **leaf wrappers**; the **core** (the constructed singleton) only shakes if you gate the *instantiation itself* — wrap the `new`/registration in `if (__BACKGROUND__)`, or split the constructed object into a background-only module. On a single app that means a deep library patch (fragile, version-specific, app-wide blast radius for a core jsb lib). The clean fix is **upstream in the library** — ship the `.lynx.js` build with the bridge core `__BACKGROUND__`-gated at construction. Quantify the leaf win first: if it's ~0.4% and the rest is this floor, recommend the upstream gate rather than a local patch.

## 11. de-concat also disables `__split__` code-splitting — it inflates already-split components back into main-thread

Beyond JSON tree-shaking and scope-hoist DCE (§10, three-levers anchor 2), a `concatenateModules:false` (de-concat) build also **defeats a build-level component-split directive** (some toolchains provide a `<Comp __split__="X" />` directive that splits heavy/interaction-only components — popups, modals, secondary cards — off the first-screen main thread). On de-concat those split components get **inlined back into `main-thread.js`**, so a per-module/per-package aggregation of a de-concat build will show, e.g., discount/coupon popups as a huge first-screen chunk that *looks* like a juicy lazy-load lever — when in the real build they're already `__split__`'d to the background thread (`grep -c DiscountPopup main-thread.js` = 0).

**Before recommending "lazy-load these popups," check the REAL build**: `grep` the component name in the production `main-thread.js` (0 ⇒ already off main-thread) and `grep -rl __split__ src libs` (the codebase may already use it). The de-concat treemap is for finding importer *edges*, never for first-screen *share* of anything that might be split. Real first-screen share comes from the statoscope/rsdoctor stats of the optimized build, or the `__main-thread` entry treemap — not de-concat.

**And `lazy(() => import())` does NOT remove bytes from `.lynx.bundle` by default — it can REGRESS it.** Measured: converting one tap-triggered popup to `lazy(() => import('../SomePopup'))` (ReactLynx's `lazy` works standalone — `Suspense` is *not* exported from the runtime, so don't import it) built fine and emitted a separate `output/static/js/SomePopup-react__*.js` chunk — but `.lynx.bundle` went **+223 KB**, not −155. Because **a Lynx page's `.lynx.bundle` is a self-contained bundle that packages its async chunks**; `import()` emits the separate (external) copy *and* keeps the content in `.lynx.bundle` → duplication + lazy-loader overhead + loss of any prior split dedup. The separate file only *replaces* the in-template copy when the build is configured to **externalize async chunks** (CDN upload via an async-chunk externalization plugin + the container loading them via a `loadLazyBundle`/`requireModule`-style API on demand). That externalization + the on-device runtime verification is **infra, not a source edit** — the same wall as externalizing the bundle. So: the deferral *prize* is real (stub the component to measure it), but neither `lazy(import)` nor `__split__` realizes it without the externalization infra turned on; a naive `lazy(import)` regresses `.lynx.bundle`. Don't ship it as a "lazy win" without measuring `.lynx.bundle` and confirming the chunk actually left it.

**BUT — `__split__` (and "main-thread = 0") does NOT mean the code left `.lynx.bundle`.** Critical correction: `__split__` defers a component's *render* to the background thread, but its **code still ships in `.lynx.bundle`** (it lands in `background.js`, which is part of `.lynx.bundle = main-thread + background + css`). So "the popup is already split" is NOT "the popup is already removed from the first-screen bundle." To actually remove the bytes you need a **true dynamic/lazy component** — a separate Lynx bundle loaded on demand by the container (`@lynx-js/react/experimental/lazy/import`, or a platform dynamic-component API that ships ~0 in `.lynx.bundle`). **Measure the prize by stubbing the component at its consumer (`const X:any=()=>null`) and rebuilding — the `.lynx.bundle` drop is what a lazy bundle would save.** Real measured example: stubbing one tap-triggered fee/discount popup (`{hasFMP && <FeeDetailPopup __split__=...>}` — mounts after first paint) cut `.lynx.bundle` **−155.7 KB**, despite it already being split. A page's ~10 interaction-only popovers (UseRule, GoodsDetail, fee/discount, alerts) can hold **hundreds of KB** of deferrable first-screen weight that `__split__` alone does not remove. The cost is lazy-bundle infra (build each as a separate bundle + container loads on first tap = small latency), set up once then reused. **When `__split__` is in use, don't conclude "lazy lever applied" — `__split__` ≠ dynamic component; verify whether the bytes actually left `.lynx.bundle`.**
