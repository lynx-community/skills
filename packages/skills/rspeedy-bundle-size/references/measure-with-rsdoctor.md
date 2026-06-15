# Measuring a rspeedy bundle with rsdoctor

The official, supported way to get a per-module breakdown of a rspeedy build. See the rspeedy guides on using rsdoctor and bundle analysis (https://lynxjs.org / https://github.com/lynx-family/lynx-stack).

## Enable rsdoctor via config (do NOT install a plugin manually)

rspeedy ships rsdoctor support behind `tools.rsdoctor`. You do **not** `pnpm add @rsdoctor/rspack-plugin`, and you do **not** wire any rsdoctor fork by hand. Just add config:

```ts
// lynx.config.ts
export default defineConfig({
  // ...
  tools: {
    rsdoctor: {
      disableClientServer: true,        // headless, don't open the browser UI
      brief: { writeDataJson: true },   // emit machine-readable data
    },
  },
})
```

Then build with the env flag:

```bash
RSDOCTOR=true rspeedy build
# or via the project's package script:
RSDOCTOR=true pnpm build
```

### Allowed config fields (the schema is strict)

rspeedy validates `tools.rsdoctor` and **rejects unknown keys** with errors like
`Unknown property '$input.tools.rsdoctor.disableTOSUpload'`. Known-good fields:

- `disableClientServer: boolean` — headless mode, no UI server
- `brief.reportHtmlName: string`
- `brief.writeDataJson: boolean`

Fields that are **rejected** (don't use them, they're from a different rsdoctor API surface): `disableTOSUpload`, `output`, `mode`.

If you hit a validation error, read the generated validator function in the rspeedy package to see the exact allowed shape rather than guessing.

## The output: single JSON vs sharded `.rsdoctor/`

There are two possible output shapes depending on version/config:

### A. Single `rsdoctor-data.json`
Shape: `{ data: SDK.BuilderStoreData, clientRoutes }`. The `data` object holds the domains you care about.

### B. Sharded `.rsdoctor/` directory
A `manifest.json` plus per-domain shard files. Each shard is **base64 of zlib-compressed** data. Critically:

> A multi-shard domain is **ONE zlib stream split across files**, not N independent streams.

So to reconstruct a multi-shard domain you must **concatenate the base64 TEXT of the shards in order, THEN base64-decode and inflate once**. Inflating each shard independently fails with `unexpected end of file`. (Verified on the `chunkGraph` domain.)

```js
// pseudo-code for reconstructing one sharded domain
const b64 = shardPaths.map(p => fs.readFileSync(p, 'utf8')).join('')   // concat TEXT first
const buf = zlib.inflateSync(Buffer.from(b64, 'base64'))               // then decode + inflate ONCE
const domain = JSON.parse(buf.toString('utf8'))
```

Note: a single `rsdoctor-data.json` is **not** always auto-produced; if you only see `.rsdoctor/`, use approach B.

## What's in the data (the domains)

`SDK.BuilderStoreData` domains: `moduleGraph`, `chunkGraph`, `packageGraph`, `summary`, `errors`, `loader`, etc.

The one that matters most for size work is **`moduleGraph.modules`**. Each module:

| Field | Meaning |
|---|---|
| `path` | source path |
| `layer` | **`react:main-thread` or `react:background`** (stats.json exposes this too — see below) |
| `size.sourceSize` | raw source bytes |
| `size.parsedSize` | bytes in the bundle (post-transform) |
| `size.gzipSize` | gzipped bytes (what actually ships over the wire) |
| `dependencies` / `imported` | edges for tracing why a module is included |
| `chunks` | which chunks it lands in |
| `kind` | import kind |

**Use `gzipSize` for "what does this cost the user", `parsedSize` for "how much code is this".**

## Getting stats.json (the official way)

rspeedy emits `stats.json` for you — no custom plugin needed. The built-in `lynx:stats-json` plugin writes `<distPath>/stats.json` (e.g. `output/stats.json`) in `onAfterBuild`, gated on `config.performance.profile`. Two ways to turn it on:

> **Heads-up: a resource-merge / move plugin may relocate it.** Some projects add a plugin that moves output around, so `stats.json` and the shipped `.lynx.bundle` can end up under a nested dir rather than the top of `output/`. Don't assume the path — `find output -name stats.json` / `find output -name '*.lynx.bundle'` after the build.

```ts
// 1. config — lynx.config.ts
export default defineConfig({
  performance: { profile: true },
})
```

```bash
# 2. env var — DEBUG containing rspeedy, rsbuild, or *
DEBUG=rspeedy pnpm build      # defaults.ts sets performance.profile = true when isDebug()
```

(Source: `@lynx-js/rspeedy` in [lynx-stack](https://github.com/lynx-family/lynx-stack) — grep for the stats-json plugin, the config defaults, and the `isDebug` util.) The plugin calls `stats.toJson({})` — the **default preset**, which already includes `modules` with `layer`.

## rsdoctor vs stats.json

| | rsdoctor data | stats.json |
|---|---|---|
| How to get | `tools.rsdoctor` + `RSDOCTOR=true` | `performance.profile: true` **or** `DEBUG=rspeedy` → `output/stats.json` |
| Has `layer` (thread) | **yes** | **yes** — rspack `KnownStatsModule.layer`, values `react:main-thread` / `react:background` |
| Per-module `gzipSize` / `parsedSize` | **yes** (built in) | no — `size` only; no gzip |
| Duplicate-package / tree-shaking analysis | **yes** (domains + agent-cli) | you compute it yourself |
| Size of the file | manageable | default preset is moderate (~16 MB on the tiny demo); `all: true` is the ~1GB monster |

They are **independent** — stats.json is not "contained in" rsdoctor data; rsdoctor reconstructs its own graphs.

**Verified empirically** (a minimal rspeedy app, Rspeedy 0.14.5 / Rspack 1.7.11): the official `DEBUG=rspeedy` `output/stats.json` carries `layer` on nearly every module with exactly `react:main-thread` / `react:background`. So **stats.json separates the two threads out of the box** — the reason to prefer rsdoctor is not the layer field but that rsdoctor gives gzip sizes and duplicate/tree-shaking analysis for free, whereas stats.json gives you raw `size` and you do the rest.

Precision note: `layer` sits on the **concatenated module group** (e.g. `./src/index.tsx + 90 modules`) and its top-level members; nested child modules inherit it and don't repeat the key, and a few runtime/global modules carry no `layer` at all. Group by the top-level module's `layer` when sizing by thread.

### If stats.json is too big to read

The official `performance.profile` output uses the **default preset** and is moderate (~16 MB on the tiny demo; bigger on a real app, but not pathological). The ~1GB blowup only happens if you deliberately customize stats to **`all: true`** (it inlines every module's `source` plus the full graph). If you've done that and the file exceeds V8's ~512MB string limit, `readFileSync` as a string throws `ERR_STRING_TOO_LONG` — stream it line-by-line (`readline`), or just don't use `all: true` (the default preset already has `modules` + `layer` + `size`, which is all you need for layer-based sizing).

## The `@rsdoctor/agent-cli` querying tool

`rsdoctor-agent` = the `@rsdoctor/agent-cli` package (repo `web-infra-dev/rsdoctor`, `packages/agent-cli`). It's a cac-based CLI that reads a JSON file and answers queries. Useful commands:

```bash
rsdoctor-agent tree-shaking retained-modules --category barrel,cjs,side-effects --sort gzipSize
rsdoctor-agent packages duplicates
rsdoctor-agent build summary
```

Caveat: it reads a plain JSON via `readFileSync` and does **not** resolve the sharded-manifest external references — feed it a reconstructed single JSON, not a `.rsdoctor/` manifest.

## Environment gotcha

Builds require the project's pinned Node (via fnm/nvm, e.g. `fnm exec --using=20.19.0 -- pnpm build` or `nvm exec 20.19.0 pnpm build`). Newer Node (24+) breaks rspeedy config loading via `strip-types` inside `node_modules`. macOS has no `timeout` command, and a `.DS_Store` race can make `rm -rf output` report "Directory not empty" — re-run or remove `.DS_Store` first.

**A normal production build may upload sourcemaps and stats to monitoring/perf services.** A real app's build printed an `Upload sourcemap url is https://...` line during the build. For repeated analysis builds, find the project's **offline / upload-disabled** mode (an env flag, a `--no-upload`-style script, or a local build target) so you're not pushing artifacts on every run — it's slower and has side effects you don't want from an analysis loop.

**Tip: the sourcemap-upload / monitoring plugin can simply be commented out for analysis builds.** It noticeably slows the build (sourcemap generation + upload) but has **negligible bundle-size impact** — it only injects a small runtime banner. So when you're iterating on before/after size measurements, comment out the monitoring/upload plugin in `lynx.config.ts` (and similar plugins) to speed up the loop; the `.lynx.bundle` size delta you measure stays valid. Restore it afterward.

## Importer tracing needs a non-concatenated build

If you'll do **reverse-import / dominator analysis** on the main-thread graph (see [three-levers.md](three-levers.md) §Lever 3), build with `tools.rspack.optimization.concatenateModules: false` first. Production scope-hoisting collapses each module's `reasons` to the concatenated-group root, so the importer edges are wrong and the analysis produces false positives. Revert the config after. (rsdoctor's graph is captured pre-hoist and doesn't need this.)
