# Dual-thread architecture & build output — the model behind the size levers

Before optimizing a Lynx bundle you must understand *why* there are two JS layers and *what* the build actually emits. Every main-thread size finding rests on this model. For the authoritative runtime model see the ReactLynx docs (https://lynxjs.org/react) and the `lynx-stack` source (https://github.com/lynx-family/lynx-stack).

## Why two layers exist (main-thread vs background)

ReactLynx is **React split across two threads**, by design:

| | Main thread | Background thread |
|---|---|---|
| Mental model | "lightweight UI driver" | "logic & state center" |
| Job | first-screen direct render + apply Patches + touch-following MTS | full render + generate Patches + lifecycle |
| Renders | `SnapshotInstance` tree → Element PAPI → `FiberElement` tree (UI) | full Preact renders `BackgroundSnapshotInstance` |
| Patches | **receives & applies** (`insertBefore`/`setAttribute`/`removeChild`) | **Hydrates, diffs, and generates** Patches |
| Lifecycle | **none** (`effect`, mount/update happen on background) | owns `useEffect`/`componentDidMount`/`componentDidUpdate` |
| State | — | `setState → rerender → Patch` |
| Touch | direct style updates for `bindtap` etc. (MTS) | — |

The point of the split: the main thread does the **minimum** needed to paint the first screen fast and respond to touch without a round-trip, while all the heavy logic/lifecycle/state lives on the background thread. In rsdoctor these are the `react:main-thread` and `react:background` **layers**.

**Size consequence (the whole reason this matters for bundle work):** the main-thread layer should stay *lean*. Anything that only the background thread needs (network, jsb, loggers, lifecycle, business logic) is dead weight if it leaks into `main-thread.js` — it bloats both the bundle and the first-screen cost. That is exactly the "main-thread leakage" lever in [three-levers.md](three-levers.md).

## What the build emits: main-thread.js, background.js, .lynx.bundle

Rspeedy uses **Rspack's Layers** capability to build, per Entry, **two** JS artifacts:

```
Entry ──Rspack Layers──> main-thread.js   (react:main-thread layer)
                         background.js     (react:background layer; also generates the CSS)
                                │
            main-thread.js + background.js + cssMap
                                │
                          ┌─────▼─────┐
                          │ tasm encode│   (compile to binary)
                          └─────┬─────┘
                                ▼
                          .lynx.bundle      ← the binary the Lynx engine actually consumes
```

So:

- **`main-thread.js`** — the render-path code (the `react:main-thread` layer). Should be small.
- **`background.js`** — the app-logic code (the `react:background` layer). Also responsible for generating the **CSS**.
- **`cssMap`** — the CSS produced from `background.js`.
- **`.lynx.bundle`** — **the final shipped product**: a *binary* produced by `tasm encode` over `main-thread.js` + `background.js` + `cssMap`. This is what the Lynx engine loads. You don't read it directly. In an open-source rspeedy build the emitted file is named **`<name>.lynx.bundle`** (the Lynx artifact); a build that also targets web emits a sibling **`<name>.web.bundle`**. This skill's size metric is always the **`.lynx.bundle`** — `find output -name '*.lynx.bundle'` after a build; don't assume the path.

### Why you build with DEBUG to see the JS

`.lynx.bundle` is binary, so to inspect the human-readable intermediates you enable debug output:

```bash
DEBUG='rspeedy,rsbuild' pnpm build
# then read dist/.rspeedy/main/main-thread.js  and  dist/.rspeedy/main/background.<hash>.js
```

This is also why size analysis works off a module-level `layer` field (which thread a module lands in) — available in both rsdoctor's `moduleGraph` and rspack's `stats.toJson({ modules: true })` — rather than off the final binary. See [measure-with-rsdoctor.md](measure-with-rsdoctor.md).

## Code elimination (代码裁剪) — the built-in DCE, and how to steer it

ReactLynx **automatically tree-shakes thread-inappropriate code**. By default, `useEffect`, `componentDidMount`, and `bindtap` callbacks are **shaken out of `main-thread.js`** — they only belong on the background thread. This automatic DCE is why a healthy main-thread layer is naturally small.

But the compiler can't always statically decide which thread a piece of code belongs to. When it can't, **the developer must mark it**. The official levers:

| Lever | Form | Meaning |
|---|---|---|
| Compile-time macro | `__BACKGROUND__` (`__JS__` = deprecated alias) | code only for the background thread |
| Compile-time macro | `__MAIN_THREAD__` (`__LEPUS__` = deprecated alias) | code only for the main thread |
| Function directive | `'background only'` | keep this function body **only** on the background thread |

These are the actual mechanism behind the "main-thread leakage" fix: when SDK/app code that should be background-only leaks into `main-thread.js`, the cure is a `'background only'` directive (or a `__BACKGROUND__` guard) **at the definition site**. If that site is inside a library you don't own, you can't fix it from app code — report it as a library ask. See [three-levers.md](three-levers.md) §Lever 3. For the directive's exact semantics and accepted forms, defer to the `reactlynx-best-practices` skill (`detect-background-only` rule).

## How a module ends up on a layer (no filename magic)

The ReactLynx plugin's entry setup (in [lynx-stack](https://github.com/lynx-family/lynx-stack); grep for where entries are added with a `layer`) adds **each user entry twice** — once with `layer: MAIN_THREAD`, once with `layer: BACKGROUND`, both pointing at the same source. Rspack then builds **two module graphs from the same entry**. A module lands in the main-thread layer simply because the main-thread graph reaches it (after the DCE above prunes what shouldn't be there), and likewise for background. The same source file can appear in *both* layers (compiled twice with different transforms) or be shaken out of one.

So there is **no filename-based rule** — reachability + the DCE/directives decide everything. For auditing, just read `module.layer`; don't reason about file extensions.
