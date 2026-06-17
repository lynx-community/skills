---
name: rspeedy-bundle-size
description: Analyze and reduce the bundle size of rspeedy/Lynx (ReactLynx) apps — the size / `.lynx.bundle` lever (not runtime perf, types, or CI). Use when the user wants to optimize 包体积 / bundle size, find what is making a rspeedy bundle large, decide which size lever to pull, or shrink `main-thread.js` by stripping background-only code (jsb / telemetry / request / monitor SDKs) out of the render path via `__BACKGROUND__` / `'background only'` gating. Covers media, JS-background, and main-thread layers, plus mangle/eval-poisoning bloat, i18n-locale duplication, duplicate-package dedup, extractStr/compile knobs, and lazy/dynamic-component splitting (first-screen vs total size). Measure-first and evidence-based — produces a prioritized report; changes code only when asked.
---

# Rspeedy Bundle Optimization

A measure-first workflow for shrinking the bundle of a rspeedy/Lynx app. The central discipline: **don't guess where the bytes are — measure, then attack the biggest lever first.** Most "optimize the bundle" requests fail by starting with micro-tree-shaking when the real weight is media assets or main-thread leakage.

## Verify against source — do not guess

The rspeedy / ReactLynx build behaves in non-obvious ways, and guessing is how you end up confidently wrong. **When you're unsure how the build, the layers, the ES targets, or stats/rsdoctor output actually behave, read the source — don't infer from naming or memory.** The whole toolchain is open source; clone or browse it and grep for the relevant plugin/util:

The toolchain layers as **Rspack → Rsbuild → Rspeedy** (each builds on the one before), so a behavior may live in any layer — follow it down:

- **rspeedy + ReactLynx plugins** (the `lynx-stack` monorepo): https://github.com/lynx-family/lynx-stack
- **rsbuild** (the Rsbuild layer rspeedy is built on): https://github.com/web-infra-dev/rsbuild
- **rspack** (the underlying bundler; stats/module types, layers, `output.environment`): https://github.com/web-infra-dev/rspack
- **rsdoctor**: https://github.com/web-infra-dev/rsdoctor

(Exact file paths aren't pinned here — they move between versions. Search by symbol, e.g. the ES-target util, the stats-json plugin, the entry/layer setup.) Several facts in this skill — main=ES2019 / background=ES2015, stats.json carrying `layer`, the entry→two-layer split — were each confirmed by reading the source or running a real build, not assumed. Hold new claims to the same bar.

### NO GUESS — trace the real module graph, never narrate an import chain

When the question is **"why is X bundled / who imports Y / what's the chain from the entry to Z"**, you must **trace the actual module graph — never describe a plausible chain** from `package.json`, intuition, or a half-answer like *"it comes in via the dependency tree, scope-hoisted into `./entry.tsx + 4630 modules`."* That `+ N modules` is the bundler hiding the edge from you, not an answer. To get the real edges:

1. Build with `tools.rspack` setting **`optimization.moduleIds: 'named'`** AND **`optimization.concatenateModules: false`**. Scope-hoisting (`concatenateModules: true`, the prod default) **collapses importer edges** — every hoisted module's importer is reported as the whole concatenated group (`"./entry.tsx + N modules"`), so you literally cannot see who imports what. Disabling it is mandatory for chain tracing (it inflates size substantially — ~+70% observed on one project, varies by module graph — so it's analysis-only; revert after). **De-concat also disables `__split__`**, so components already split off the main thread reappear inflated in `main-thread.js` — cross-check any "huge popup/modal" against the real build before calling it a lazy-load candidate (see [rspeedy-gotchas.md §11](references/rspeedy-gotchas.md)).
2. Read the **actual importer edges** from `stats.json`'s `reasons[].moduleName` (each module lists the modules that import it). On a big multi-entry build this file can reach **hundreds of MB to ~1 GB — too big for `readFileSync`** (`ERR_STRING_TOO_LONG`); stream it (`grep` / `readline`). (A single-page build with the default stats preset is far smaller — only `stats: { all: true }` or a many-page merge blows it up; see [measure-with-rsdoctor.md](references/measure-with-rsdoctor.md).)
3. Walk the chain hop by hop and **report the exact file at each hop**. If you can't back a hop with a real reason edge, **you don't have the chain — say so, don't invent it.**

Real example this rule comes from: an app's 1388-icon bloat *looked like* "app → business component lib → UI lib → icon barrel" — but the app imported **none** of those packages directly (0 hits in `src/`); only the de-concat `reasons` revealed the true edges. A narrated chain would have pointed the owner at the wrong file. **A dependency chain without real reason-edges behind it is a guess; do not present guesses as chains.**

## When to use this skill

- "帮我优化一下包体积" / "reduce the bundle size of this rspeedy app"
- "为什么我的包这么大" / "what is making this bundle large"
- After a build, the user wants the size broken down and a prioritized plan
- Deciding whether tree-shaking is even worth it, vs media compression vs main-thread cleanup

A distinct cause of an oversized bundle is **mangle failure** — readable module-prefixed names (`common_EVENT_NAME`, `utils_toSomething`) surviving in the production chunk, usually from `eval()` poisoning under ModuleConcatenation. It's covered as part of the JS lever in [references/three-levers.md](references/three-levers.md) §Lever 2.

## When NOT to use this skill

This is the **bundle-size / `.lynx.bundle`** lever only — it optimizes *shipped bytes*, not anything else. Route elsewhere for:
- **Runtime / render performance** (jank, slow first paint, frame drops) — a different concern; this skill doesn't touch execution speed.
- **JS memory / heap leaks** — use `lynx-js-heap-snapshot-analysis`.
- **Directive *semantics*** (`'background only'` accepted forms / behavior) — defer to `reactlynx-best-practices`; this skill only *applies* the directive as a size lever.
- **Deep `rsdoctor-data.json` forensics** (per-module retained-set, duplicate trees) — use `rsdoctor-analysis`; this skill only summarizes it.
- **TS types / tsconfig** → `lynx-typescript`. **Decoding the tasm binary format** → `lynx-tasm-codec`.

## Related skills

If you have access to them, they go deeper on adjacent problems:

- **`rsdoctor-analysis`** — deep analysis of `rsdoctor-data.json` (tree-shaking retained-modules, duplicate packages, side-effects). Use it for the heavy rsdoctor querying this skill only summarizes. Public: https://github.com/rstackjs/agent-skills/tree/main/skills/rsdoctor-analysis
- **`reactlynx-best-practices`** — the authority on the dual-thread directives, incl. the `'background only'` / `'background-only'` function directive (see its `detect-background-only` rule). Defer to it for directive semantics and accepted forms rather than re-deriving them here.
- **`rushstack-best-practices`** — use in Rush monorepos (detect `rush.json` / `common/config/rush`). Rush repos should normally use `rush`, `rushx`, or `rush-pnpm`, not raw `pnpm`. Public: https://github.com/microsoft/rushstack/blob/main/skills/rushstack-best-practices/SKILL.md

## Build-system awareness

Before measuring, identify the repo's build orchestrator and use its native command surface rather than assuming `pnpm build`:

1. **Rush monorepo** — if `rush.json` or `common/config/rush/` exists, use the Rush skill. Run project scripts with `rushx <script>` from the project dir, or scoped repo commands such as `rush build --to .`; use `rush-pnpm` only when a pnpm command is truly necessary.
2. **Custom wrapper tooling** — if scripts or config wrap `rspeedy` behind a company/monorepo CLI, prefer that documented entrypoint over calling `rspeedy`/`pnpm` directly.
3. **Plain pnpm/npm project** — fall back to `pnpm` / `npm` directly when the repo is not Rush-managed and has no wrapper.

Do not blindly run `pnpm build`. First read `package.json`, root workspace files, and any existing project docs; then choose the narrowest command that builds the target rspeedy app while preserving the repo's environment setup. If the project pins Node, use that version via your Node version manager (e.g. `fnm exec --using=<version> -- ...` or `nvm exec <version> ...`).

## Triage first when you have many projects (don't build a whole fleet)

The per-project workflow below is measure-first — but if you're handed a *fleet* ("optimize our Lynx bundles", a dashboard of 50+ apps), you can't build them all to decide where to look. Run a cheap **source-level triage** to rank which projects/levers deserve a real build, then measure-first the winners. A triage hit means "measure here", **not** "confirmed bloat".

The scanner [references/assets/scan-levers.mjs](references/assets/scan-levers.mjs) walks each project's source (no build) and ranks by unguarded background-only leak, missing `sideEffects`, inline/large media, and duplicate deps:

```bash
node references/assets/scan-levers.mjs --glob <reposRoot>        # rank a fleet
node references/assets/scan-levers.mjs <projectDir> --json out.json
```

Read [references/cross-project-triage.md](references/cross-project-triage.md) for how to interpret it and its traps (duplicate-dep counts are dominated by the dev toolchain and mostly noise; source presence ≠ main-thread presence; a telemetry signature over-counts a property name). Empirically across a real ~370-project fleet: **~74% have background-only leak signal in source, ~62% mostly unguarded, ~99% miss `sideEffects`** — telemetry + jsb/native glue is referenced almost everywhere and almost always unguarded.

Telemetry/logging is background-only **only when it's jsb-backed** — a console-backed logger (`console.*`) runs on the main thread too, so confirm the underlying impl before treating a telemetry call as strippable. When it *is* jsb-backed it's a broadly-*relevant* Lever-3 signal — but measure before acting on it. The blind strip ([plugin-strip-mt-telemetry.ts](references/assets/plugin-strip-mt-telemetry.ts) + [loader](references/assets/strip-mt-telemetry-loader.cjs), method list customizable) netted only **−3.9 kB (−0.08%)** on a real project because the logger *imports* survived (the last-reference rule), so treat it as a **measurement aid, not the fix** (see [three-levers.md](references/three-levers.md) §Lever 3) — not a "drop it in and win" lever. By contrast one config line — `extractStr: true` — netted **−1.88% to −5.99%** across a 6-project fleet round (up to **−1.29 MB** on a 64-page string-heavy app; ~0 on thin demos or apps with little duplicated string content). **So on a string-heavy app not already using `extractStr`, just turning it on is the highest-ROI first move — far above hand-chasing telemetry leaks.** (Just set `extractStr: true`; tuning the `strLength` threshold is generally not recommended.)

## The mental model: three layers, three levers

A Lynx app bundle splits across two threads, plus non-JS assets. Size lives in three places, and the optimization technique is **different for each** — confusing them is the most common mistake.

| Lever | What it is | Typical size | Who can fix it |
|---|---|---|---|
| **Media assets** | images/fonts inlined or shipped | often the single biggest chunk (multi-MB) | app code — usually highest ROI |
| **JS — background thread** | `react:background` layer, app logic | varies | app code — tree-shaking, dedup |
| **JS — main thread** | `react:main-thread` layer, first-screen render path | should be small; leaks happen | trace → **module split** (markers ≈ 0); big chains are **library asks** |

See [references/three-levers.md](references/three-levers.md) for how to size and attack each.

**Read [references/dual-thread-architecture.md](references/dual-thread-architecture.md) before optimizing if you don't already know why there are two JS layers** — it has the full model and the `代码裁剪` macro table that every Lever-3 fix relies on. In short: the **main thread** does first-screen direct render and must stay lean; the **background thread** carries logic / lifecycle / state. The build emits a `main-thread.js` + `background.js`, compiled into the binary **`.lynx.bundle`** the engine ships. ReactLynx auto-shakes `useEffect`/`componentDidMount`/`bindtap` callbacks out of `main-thread.js`; when it can't decide, steer it with `'background only'` or the `__BACKGROUND__`/`__MAIN_THREAD__` macros — that mechanism *is* the main-thread-leakage lever.

## Core workflow

### Step 1 — Measure (never skip)

Get a real per-module breakdown before proposing anything. **This holds even when the user already hands you rough sizes (e.g. "images ~10MB, JS ~4MB") or asks you to just do a specific change** — a glance at output sizes is a starting hypothesis, not a per-module measurement. **Always confirm the breakdown with rsdoctor (or `stats.json`) and lead with the prioritized recommendation *before* committing to — or implementing — any lever**, including a change the user explicitly requested. If the asked-for change is the wrong (low-ROI) lever, say so first; only proceed with it after the measured breakdown confirms it's worth it.

The official way for rspeedy is rsdoctor via config — **do not manually install `@rsdoctor/rspack-plugin`**, and do not reverse-engineer internal forks. Add to `lynx.config.ts`:

```ts
tools: {
  rsdoctor: {
    disableClientServer: true,
    brief: { writeDataJson: true },
  },
}
```

Then build with `RSDOCTOR=true`. Full details, allowed config fields, and the sharded-data reconstruction trick are in [references/measure-with-rsdoctor.md](references/measure-with-rsdoctor.md).

Use the build-system-aware command from the previous section:

```bash
# Rush project script
RSDOCTOR=true rushx build

# Wrapper-tooling project (example; prefer the repo's documented command)
RSDOCTOR=true <wrapper> build

# Plain package script
RSDOCTOR=true pnpm build
```

A lighter alternative for a quick first look is rspeedy's built-in `stats.json` — turn it on with `performance.profile: true` in the config, or just build with `DEBUG=rspeedy` (it writes `output/stats.json`). It **does** carry a `layer` field per module (`react:main-thread` / `react:background`, verified on the demo), so it *can* separate the two threads. Prefer rsdoctor when you want per-module **gzip** sizes and duplicate/tree-shaking analysis for free; reach for stats.json for a fast layer-vs-size split with zero extra setup. Details in [references/measure-with-rsdoctor.md](references/measure-with-rsdoctor.md).

### Step 2 — Classify the weight into the three layers

From the rsdoctor `moduleGraph`, group `module.size.parsedSize` (and `gzipSize`) by:

1. **Media / assets** — non-JS modules, or asset modules
2. **JS `react:background`** — `module.layer` contains background
3. **JS `react:main-thread`** — `module.layer` contains main-thread

Report the three totals **first**. That number alone usually decides the whole engagement — e.g. "10MB of your 14MB is images; JS tree-shaking can win you ~50KB, so start with media."

### Step 3 — Pick the lever by ROI, attack in order

Default priority (override if the numbers say otherwise):

```
1. Media assets        → biggest, easiest wins (compress, dedup, format)
2. JS background       → tree-shaking, duplicate packages, deep imports
3. Main-thread leak    → background-only code that leaked into render path
4. Compile-layer knobs → extractStr, CSS minify, debug-info, lazy bundle — often beats the JS tail
```

For each lever's concrete techniques and decision points, see [references/three-levers.md](references/three-levers.md) (Levers 1–4).

### Step 4 — Know when to stop

A well-optimized project hits a wall: tree-shaking is effectively exhausted (`sideEffects` set correctly — or, since ~99% of fleet projects omit the flag, the minifier already did the equivalent DCE), code-level DCE yields ~0 at the bundle level, and the remaining main-thread leak lives inside SDK libraries you can't edit. **Say so plainly.** Don't manufacture marginal changes to look busy — report the wall and what would move it (a library-side `'background only'` directive, an asset pipeline change in CI, etc.).

**The structural-duplication wall (the most common shape on big pages — verified by deep-diving two real big apps).** A large `.lynx.bundle` is usually dominated not by leaks or dead code but by a **heavy resource the first-screen direct render genuinely needs, carried in BOTH layers** (main-thread *and* background each bundle their own copy under the dual-thread model). Two real examples: one app's page was **87% i18n locale JSON** (all 57 languages, in both layers); another was **62% a Pixi-like render engine** (~1.4 MB in *each* layer) that draws the first screen. When you see this, the usual app-side levers **all fail by construction**, and saying why is the deliverable:
- **Can't lazy-split it** — it's first-screen-direct-render content; deferring it makes the first screen load a chunk mid-render (slower / FOUC). (This is the lazy-bundle rule applied: never lazy what first-screen needs.)
- **Strip/DCE/dedup don't apply** — it's neither dead code nor a duplicate *package*; it's the same needed resource legitimately present on two threads.
- **`extractStr` only helps the string-shaped case** — it dedups duplicated **string literals** across the two layers (i18n locale text, class names — that's why string-heavy apps shrink a lot under it), but it does **not** dedup duplicated **code** (a render engine), so it won't touch the engine case.

So the real lever for these is **library/framework-level**, not app-side: a lighter library, a framework feature to share code across the two threads, or a host that injects the resource (e.g. the active locale) synchronously so the bundle needn't carry it. Measure the dominant chunk, name it, say which of these it needs — don't grind app-side config for a page whose weight is structural.

## Gotchas specific to rspeedy/Lynx

Several things will bite you if you treat this like a generic webpack project. Read [references/rspeedy-gotchas.md](references/rspeedy-gotchas.md) before editing config or asserting a finding. The headline traps:

- **The two threads ship at fixed ES targets** — main-thread = ES2019, background = ES2015 (prod); both lower `let`/`const`→`var` for parse speed. These are engine-driven platform constants; don't propose retargeting to save bytes. (Some projects pin `output.environment` even lower, to full ES5, for parse time — a deliberate tradeoff, not the norm.)
- **rsdoctor data may be sharded** (`.rsdoctor/` dir, not a single JSON) — reconstruct correctly or your numbers are wrong.
- **builds need the pinned Node** (via fnm/nvm, e.g. `fnm exec --using=20.19.0` or `nvm exec 20.19.0`) — newer Node can break rspeedy config loading.

## Logging convention — every optimization gets a `.bundle-opt-log/` entry

**Required for any optimization (analysis or applied):** write a log entry under a hidden **`.bundle-opt-log/`** directory at the root of the project being optimized (e.g. `apps/<app>/.bundle-opt-log/`). The log's primary metric is **`.lynx.bundle` size before → after** (the shipped binary), per page.

Each entry (one Markdown file per round, named by date + lever, e.g. `2026-06-04-icon-treeshake.md`) records:
- **project / page**, and `.lynx.bundle` **before** and **after** (kB), with the **Δ and %**
- the **lever** applied (one line), and whether it's **applied / proposed / wall**
- the **verification build command** (so the number is reproducible), and the **Node version** if pinned
- the **measurement caveat** if any (e.g. warm-cache vs cold — see gotchas §7; a delta under ~3% needs a warm re-measure)

**Also maintain ONE consolidated tracking table** (e.g. `.bundle-opt-log/优化记录表.md` / `SUMMARY.md`): a single Markdown table with **one row per optimization** — `优化项 | .lynx.bundle 前 | 后 | Δ | 机制 | commit` — plus a cumulative total row, and a second table for investigated-but-not-shipped levers (with their measured Δ, often ~0, and the reason). Append a row every time you land an optimization; chain the before/after so each row's "before" = previous row's "after". This is the at-a-glance ledger; the per-round files hold the detail. Owners specifically ask for this table — keep it current.

Keep it `.lynx.bundle`-centric: intermediate `main-thread.js`/`background.js` numbers are supporting detail, but the headline is always the shipped `.lynx.bundle` before/after. Put build *artifacts* (intermediates, analysis de-concat dumps) under the gitignored build output dir (`output/` or `dist/`), **never** in a new top-level dir — only the `.bundle-opt-log/` markdown is meant to live in the repo. Confirm with the owner whether `.bundle-opt-log/` should be committed or gitignored before creating it.

## Stance: report-first, read-only by default

Like the other analysis skills here, default to **producing a prioritized report, not editing code**. Present findings + options + tradeoffs; let the user choose what to change. Only modify app code when explicitly asked, and keep changes surgical.

## Response format

1. **Measured breakdown** — the three-layer totals (media / bg JS / main JS), biggest modules in each
2. **Biggest lever** — which layer dominates and why
3. **Prioritized actions** — table of action → est. savings → effort → who can do it (app vs library vs CI)
4. **Main-thread leakage trace** — if any leak exists, include the suspicious module plus its upstream importer path / owner; don't only report the leaked API string
5. **Compile-layer quick wins** — `extractStr` / CSS minify / debug-info / lazy-bundle knobs tried or proposed (Lever 4)
6. **The wall** — what's already optimal and what external change would be needed to go further
7. **Log entry** — write the `.bundle-opt-log/` entry and append to the tracking table (see Logging convention)
