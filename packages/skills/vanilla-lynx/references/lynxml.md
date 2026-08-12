# Lynx XML Artifact

Default to a `.lynxml` artifact. For Rspeedy or build output, use [`rspeedy-project.md`](rspeedy-project.md) instead; otherwise, do not add build configuration or dependencies.

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
// Main-thread Element PAPI and lifecycle logic.
</script>
</lynx>
```

Use the engine version requested by the user or required by the project. If neither is known, state the version assumption instead of presenting it as a discovered project requirement.

## Document Rules

- Start with exactly `<!doctype lynx>` and use one lowercase `<lynx>` root.
- Quote every attribute value and close every start tag explicitly.
- Put source blocks directly inside `<lynx>` and preserve their order.
- Use `<style>` without attributes for Lynx CSS.
- Use `<script thread="main">` for main-thread code and `<script thread="background">` for optional background-thread code.
- Keep source text raw. Do not wrap JavaScript or CSS in CDATA and do not XML-escape it.
- Do not place a literal `</script>` or `</style>` sequence inside the matching source block, including inside a string or comment.
- Treat unsupported elements and attributes as errors. Do not add an XML declaration or a `<config>` block.

Attributes on the `<lynx>` root become page configuration. Add attributes other than `engine-version` only when the consumer defines the corresponding PageConfig key.

## Authoring Workflow

1. Read `main-thread.md` for Element PAPI rendering and lifecycle logic, then place the resulting code in `<script thread="main">`.
2. Read `style.md` when styles are required, then place the Lynx CSS in `<style>`.
3. Read `background.md` and `event.md` only when heavier work or cross-thread communication is required, then place the background code in `<script thread="background">`.
4. Deliver the document with the `.lynxml` suffix. Do not introduce a build step merely to assemble these source blocks.

Source blocks may repeat or be interleaved. A runnable UI artifact normally needs at least one main-thread script; add a background script only when the runtime logic requires it.

## Lynx XML Examples

Read only the smallest matching complete artifact, then adapt its styles, event names, and app logic:

| Scenario                                    | Example                           |
| ------------------------------------------- | --------------------------------- |
| Main-thread rendering and a local UI update | `examples/counter.lynxml`         |
| Main/background cross-thread communication  | `examples/ping-pong.lynxml`       |
| Background external-bundle loading          | `examples/external-bundle.lynxml` |

Do not combine every example by default. Start from `counter.lynxml`; use the other examples only when the requested runtime feature requires them.
