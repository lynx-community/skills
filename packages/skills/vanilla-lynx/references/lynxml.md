# Lynx XML Artifact

Use this reference to author or review the single-file `.lynxml` envelope. Runtime behavior remains owned by the focused references linked below; do not duplicate their Element PAPI, event, styling, or external-bundle rules here.

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
- Do not place a literal `</script>` or `</style>` sequence inside the matching source block, including inside a string or comment.
- Do not put UI markup or other top-level elements inside the root. Element PAPI in the main-thread script creates the rendered tree.
- Do not add an XML declaration or a `<config>` block.

## Assemble the Artifact

1. Read [`main-thread.md`](main-thread.md) for Element PAPI rendering and lifecycle source, then place the result in `<script thread="main">`.
2. Read [`style.md`](style.md) when styles are needed, then place the CSS in `<style>`.
3. Read [`background.md`](background.md) and [`event.md`](event.md) only when heavier work or cross-thread communication is needed, then add `<script thread="background">`.
4. Read [`external-build.md`](external-build.md) and [`external-runtime.md`](external-runtime.md) only when the artifact loads a separately built background bundle.
5. Deliver the complete `.lynxml` document. Do not introduce an app build step merely to assemble the source blocks.

## Pre-delivery Check

Verify the complete document rather than only its fragments:

- The document closes every source block and ends with `</lynx>`.
- Main and optional background JavaScript are syntactically complete.
- Every lifecycle and node-event handler referenced by name is declared.
- Later UI mutation paths flush after their final mutation.
- No source block contains the literal closing sequence for its own tag.

## Examples

Read only the smallest matching complete artifact and adapt it; never return only its path:

| Scenario                                    | Example                                     |
| ------------------------------------------- | ------------------------------------------- |
| Main-thread rendering and a local UI update | `assets/examples/counter.lynxml`            |
| Main/background cross-thread communication  | `assets/examples/ping-pong.lynxml`          |
| Background external-bundle loading          | `assets/examples/external-bundle.lynxml`    |

Do not combine the examples by default. Canvas and WebGL examples are intentionally outside this public skill.
