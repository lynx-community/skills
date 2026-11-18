# Triage at scale — picking which projects/levers to measure first across many repos

The core workflow is **measure-first per project** (build → rsdoctor/stats → three-layer split). But when you're handed *many* projects (a fleet dashboard, a monorepo of 50+ apps, "optimize our Lynx bundles"), you cannot build all of them to decide where to look — a full build is minutes each and many fail. You need a **cheap source-level triage** that ranks where a real measure will pay off, *then* you measure-first the winners.

This is a triage, not a verdict. A source hit means "worth a real build+measure here," **not** "confirmed bloat." Never report a triage signal as a finding — it's a prioritizer for the expensive, accurate step.

## The scanner: `scan-levers.mjs`

A reusable static scanner lives at [assets/scan-levers.mjs](assets/scan-levers.mjs). It walks every project's *source* (node_modules excluded) and emits, per project + aggregated:

- **mt-leak** — background-only API surfaces referenced in app source: the jsb-backed ones (always background-only) `NativeModules`, `getJSModule(`, jsb bridge (`.bridge.`/`jsbCall`/`requestAdapter`), native event emitters (`GlobalEventEmitter`/`subscribeEvent`); plus monitor/telemetry calls (background-only **only when jsb-backed** — customize these to your stack). A real leak must *also* appear in `main-thread.js` — source presence is the gate, not proof.
- **guard ratio** — of the files with leak signal, how many already use `__BACKGROUND__`/`__MAIN_THREAD__`/`'background only'`. **Low guard ratio = high opportunity** (unguarded background-only code is the leak candidate).
- **media** — inline base64 data-URIs (>5 kB) and large committed images (>50 kB).
- **sideEffects** — whether `package.json` declares `sideEffects` (tree-shaking enabler).
- **dupPkg** — (installed repos only) same dep resolved at multiple versions in `node_modules/.pnpm`.

Run it from the analysis repo: `node scripts/scan-levers.mjs` → writes `lever-scan.json` + prints the aggregate. It points you at the 5–10 projects worth a real build, instead of building 90.

## How to read the output (and its traps)

Ranking signal, in priority order:

1. **Unguarded main-thread leak** — projects with many `leakFiles` and a **low `guardRatio`** (≪0.5). These are the best Lever 3 candidates: background-only APIs all over the source with no thread guards. Cross-reference the project's *baseline main-thread.js size* — a big main-thread bundle + unguarded leaks = measure here first.
2. **Missing `sideEffects`** — near-universal in practice (see below); cheap to flag but the actual win still needs a build (the minifier may already handle it).
3. **Media** — large committed images / inline base64. But **media plugins are usually CI-only** (see gotchas §6) — a project flagged for "big images" may already compress them in CI. Confirm against a CI-equivalent build before promising a number.
4. **Duplicate deps** — see the trap below; treat the raw count as noise.

### ⚠️ Trap 1: the duplicate-dep count is dominated by the dev toolchain

The `.pnpm` scan counts **every** package at multiple versions — including `esbuild`, `commander`, `typescript`, `@babel/core`, `postcss`, `type-fest`, `fs-extra`. These are **build-time deps that never ship in the bundle**, so a repo showing "1305 duplicate packages" is almost entirely irrelevant to size. The skill's dedup lever (three-levers §Lever 2) is about **runtime** libs shipped into `.lynx.bundle`: UI component libraries, lodash, the ReactLynx runtime, business SDKs. Filter the dup list to runtime/UI/util packages before treating any of it as a lever — and even then, confirm the package is actually in the *shipped* bundle (rsdoctor duplicates), because a duplicated dev/SSR-only dep is free.

### ⚠️ Trap 2: source presence ≠ main-thread presence

A file that references `NativeModules` may be a background-only module that ReactLynx already shakes out of `main-thread.js`. The scan cannot know — it reads source, not the post-shake bundle. So a high `leakFiles` count tells you *this project does a lot of native/jsb/telemetry work*, which **correlates** with main-thread leakage, but the byte win only exists if those APIs survive into `main-thread.js`. Always confirm with a readable `main-thread.js` build (three-levers §Lever 3 ⭐) before editing.

### ⚠️ Trap 3: a telemetry signature over-counts a property name

A telemetry-client signature can match a *property name* too (e.g. a `webXxxLogger` member), which is often a *guarded* logger client (`if(__BACKGROUND__) webXxxLogger...`). A high count ≠ leak. It's a "look here," nothing more.

## Empirical baseline — what a real fleet looks like

Scanning a real fleet (~370 ReactLynx projects across ~80 monorepos) gave the prevalence below. Use it to calibrate expectations — these are *signals*, deflated by the traps above:

| Signal | Prevalence | Read |
|---|---|---|
| Source has any background-only leak signal | **~74%** (274/372) | leak work is broadly *relevant*, rarely *clean* |
| …and mostly **unguarded** (guardRatio<0.5) | **~62%** (230/372) | most projects don't thread-guard telemetry/jsb — the systemic opportunity |
| Missing `sideEffects` in package.json | **~99%** (367/372) | near-universal; but minifier often covers it — needs a build to value |
| Has large committed images | **~33%** (124/372) | media lever candidates — but verify CI compression first |
| Has >5 kB inline base64 | **~3%** (12/372) | rare; when present, easy externalize win |
| Repos with any duplicate runtime+dev deps | 32 repos | **dominated by dev toolchain — mostly noise** (Trap 1) |

Most-referenced background-only API across the fleet (file counts): **telemetry client 220 · native events 147 · NativeModules 130 · getJSModule 127 · jsb bridge 101 · monitor 89 · other telemetry 74**. The headline: **telemetry + jsb/native glue is referenced in app source almost everywhere, almost always unguarded.** That makes the *jsb-backed telemetry strip* (next section) a broadly-applicable Lever-3 move across a fleet — and the reason it's worth a reusable asset rather than a per-project hand-edit.

## Reusable lever: main-thread jsb-backed telemetry strip

Because a **jsb-backed** telemetry/logger client isn't exposed to the main/lepus thread, stripping those *calls* from the main-thread layer is behavior-neutral. **⚠️ This holds ONLY for jsb-backed methods** — a console-backed logger (`console.*`) runs on the main thread too, so stripping it would lose real main-thread logs (a behavior change). Confirm each method's underlying impl (jsb vs console), then list only the jsb-backed ones in the loader's `METHODS`. Two drop-in files:

- [assets/strip-mt-telemetry-loader.cjs](assets/strip-mt-telemetry-loader.cjs) — a babel loader that replaces a **configurable** set of telemetry methods (e.g. `x.reportEvent(...)` / `.track(...)` — any position: statement, `a && x.report()`, optional chain) with `void 0`. The `METHODS` set is yours to fill with confirmed jsb-backed names. Fast-path skips files with no match. Never throws (returns source on parse error).
- [assets/plugin-strip-mt-telemetry.ts](assets/plugin-strip-mt-telemetry.ts) — an rsbuild plugin that registers the loader **only on the `react:main-thread` layer** (so background telemetry is untouched), running after swc.

Wire it by adding `pluginStripMtTelemetry()` to the rspeedy `plugins` array. The background layer keeps full telemetry; the main-thread layer loses the dead calls, and any telemetry import whose *last* main-thread reference was a stripped call then shakes out (the "remove every reference" rule from three-levers §Lever 3).

**Scope discipline (why this asset is telemetry-only):** a more aggressive variant of this loader *also* removed `componentDidMount/WillUnmount/DidUpdate` from main-thread — a bigger win but a **behavior change** (needs real-device verification). The reusable asset here is deliberately telemetry-only so it stays a safe default for an unfamiliar project. If you want the lifecycle strip too, do it as a separate, explicitly-flagged change with device verification — don't fold it into the "safe" pass.

**Still measure.** Even a behavior-safe lever can move ~0 bytes if telemetry wasn't actually leaking into main-thread on that project, or if other unguarded references keep the import alive. Build `.lynx.bundle` before/after and report the real delta.
