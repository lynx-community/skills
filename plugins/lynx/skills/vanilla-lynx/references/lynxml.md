# Lynx XML Artifact

Use this reference after build-free `.lynxml` is selected as the output format. It owns the single-file document envelope and source-block assembly. Runtime behavior remains owned by the focused references linked below; do not duplicate their Element PAPI, event, styling, or external-bundle rules here.

## Minimal Document

```xml
<!doctype lynx>
<lynx engine-version="4.2">
<style>
.page {
  background-color: #f5f5f5;
}
</style>
<script thread="main">
// Main-thread Element PAPI and lifecycle source.
</script>
</lynx>
```

Use the engine version requested by the user or required by the target environment. When neither is known, identify `4.2` as an assumption rather than a discovered requirement.

## Document Contract

- Start with exactly `<!doctype lynx>` and use one lowercase `<lynx>` root.
- Give the root exactly one non-empty, quoted `engine-version` attribute.
- Put source blocks directly inside `<lynx>`. Use the canonical order: optional `<style>`, required `<script thread="main">`, then optional `<script thread="background">`.
- Include at most one block of each kind. `<style>` accepts no attributes; each `<script>` accepts only its quoted `thread` attribute.
- Keep JavaScript and CSS source text raw. Do not wrap it in CDATA or XML-escape it.
- Write closing tags without internal whitespace (`</style>`, `</script>`, `</lynx>`) for Web preview compatibility, and do not place a literal `</script>` or `</style>` closing tag (including optional whitespace before `>`, such as `</script >`, which native LynxML treats as a closing tag) inside the matching source block, even inside a string or comment.
- Do not put UI markup or other top-level elements inside the root. Element PAPI in the main-thread script creates the rendered tree.
- Do not add an XML declaration or a `<config>` block.

## Assemble the Artifact

1. Read [`main-thread.md`](main-thread.md) for Element PAPI rendering and lifecycle source, then place the result in `<script thread="main">`.
2. Read [`style.md`](style.md) when styles are needed, then place the CSS in `<style>`.
3. Read [`background.md`](background.md) and [`event.md`](event.md) only when heavier work or cross-thread communication is needed, then add `<script thread="background">`.
4. Read [`external-build.md`](external-build.md) and [`external-runtime.md`](external-runtime.md) only when the artifact loads a separately built background bundle.
5. Run the [Pre-delivery Check](#pre-delivery-check) on the complete `.lynxml` document before writing or returning it inline. Do not introduce an app build step merely to assemble the source blocks.

## Pre-delivery Check

Before delivering a complete `.lynxml` artifact (written to disk or returned inline) or concluding a `.lynxml` review, run the bundled static checker on the full document (`SKILL_DIR` is the directory containing `SKILL.md`):

```bash
# Validate a file on disk:
node "$SKILL_DIR/scripts/check-lynxml.mjs" path/to/artifact.lynxml

# Validate an inline document via stdin before returning it:
node "$SKILL_DIR/scripts/check-lynxml.mjs" - <<'EOF'
<!doctype lynx>
...
EOF
```

Add `--json` when structured `{ ok, files }` output is needed. Interpret the result as follows:

- **Exit `0`** (`OK <target>` on `stdout`, or `"ok": true`): static validation passed; proceed to the manual checks below.
- **Exit `1`**: prints `<target>:<line>:<column> error [<code>[/<thread>]] <message>` and optional `Hint:` lines to `stderr` (or `"ok": false` with `issues[]` in `--json` mode), where `<code>` is:
  - `envelope-error`: invalid `<!doctype lynx>` / `<lynx engine-version="...">` envelope, block order or attributes, CDATA/XML declaration, literal closing tag inside a block, or unreadable input path.
  - `syntax-error`: invalid JavaScript syntax, unbalanced `}` in `<script thread="background">`, or top-level lexical redeclaration of an `app-service.js` wrapper parameter.
  - `unsupported-syntax`: ESM `import`/`export`, dynamic `import()`, or `with` inside raw `.lynxml` scripts.
  - `forbidden-api`: compiler-only or legacy Element PAPI global (`__AddEvent`, `__CreateFor`, `__CreateIf`, `__SetStyleObject`, etc.).
  - `wrong-thread-global`: main-thread Element PAPI used on `background`, or background-only `NativeModules`/`fetch` used on `main`.
  - `undeclared-global`: browser, Node, or unsupported JS/Lynx global, or an `app-service.js` wrapper parameter read via `globalThis` instead of as a bare identifier.
- When authoring or modifying a `.lynxml` document, fix every reported issue using its `line:column` and `Hint`, then re-run `check-lynxml.mjs` until it exits `0` before delivering. When reviewing without modifying, report each emitted issue in your findings. If the host environment cannot execute `node`, perform the manual checks below directly and state that static CLI validation could not be run.

Dynamic evaluation, computed property lookups, handler wiring, and runtime control flow remain outside static checks, so also verify on the complete document (and check all five items manually if `node` cannot run):

- The document closes every source block and ends with `</lynx>`.
- Main and optional background JavaScript are syntactically complete and reference only globals supported on that thread.
- Every lifecycle and node-event handler referenced by name is declared on the expected thread.
- Later UI mutation paths call `__FlushElementTree()` after their final mutation.
- No source block contains the literal closing sequence for its own tag.

## Examples

Read only the smallest matching complete artifact and adapt it; never return only its path:

| Scenario                                    | Example                                     |
| ------------------------------------------- | ------------------------------------------- |
| Main-thread rendering and a local UI update | `assets/examples/counter.lynxml`            |
| Main/background cross-thread communication  | `assets/examples/ping-pong.lynxml`          |
| Background external-bundle loading          | `assets/examples/external-bundle.lynxml`    |

Do not combine the examples by default. Canvas and WebGL examples are intentionally outside this public skill.
