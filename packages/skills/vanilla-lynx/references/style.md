# Vanilla Lynx Style Reference

Use this reference when writing or reviewing styles for a Vanilla Lynx app. Treat the rules below as a strict authoring surface, not as a catalog of everything the Lynx parser may accept.

## Runtime Style Application

- Apply classes with `__SetClasses()` or `__AddClass()`. Reserve `__SetInlineStyles()` for runtime-computed values; browser DOM and CSSOM style APIs are unavailable.
- Encode state, hierarchy, and item position in explicit class names so styles never depend on structural selectors.

## Strict Authoring Rules

- Use only syntax supported by Lynx. If support is uncertain, omit it.
- Put all visible text in `text` nodes. Never place raw text in container nodes.
- Use simple class selectors only. Do not use pseudo-classes, pseudo-elements, descendant, child, or sibling selectors, or broad tag selectors. Any occurrence of selectors such as `:first-child`, `:last-child`, `:nth-child()`, `:nth-of-type()`, `::before`, or `::after` is invalid output even if the CSS parser accepts it. Use explicit classes for state or item position and real Element PAPI nodes for generated content.
- Do not rely on browser assumptions: there is no DOM, CSSOM, HTML default semantics, Web block flow, body behavior, or margin collapsing.
- Do not use `@media`, `@supports`, `@layer`, `@keyframes`, CSS variables, vendor-prefixed properties, or invented properties.
- Do not use `z-index`.
- Lynx uses column Linear layout by default, but declare layout explicitly with `display: linear` or `display: flex` whenever layout behavior matters. Inline flow is unavailable.
- Treat the default box model as `border-box`; set `box-sizing` explicitly when exact parity matters.
- The default `position` is `relative`. Do not use `position: static`.
- Text does not wrap by default. Use only `white-space: normal` or `white-space: nowrap`.
- Do not use `text-transform`; output the final text casing directly.
- For ellipsis, use exactly `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.

## Web Margin Collapse Migration — High Priority

Web can collapse adjacent vertical margins instead of adding them. Lynx never collapses margins, so copied Web margins can add together and cause offset errors.

When migrating, prefer `position: relative` with `left` and `top` for visual offsets, or `padding` for spacing that should affect normal layout. Relative offsets do not reserve extra layout space, so check for overlap.

## CSS Property Allowlist

Emit only the properties below. This allowlist is an upper bound: a listed property does not make every value or shorthand combination valid, so omit any syntax whose Lynx support is uncertain.

```text
display, position, top, right, bottom, left,
width, height, min-width, min-height, max-width, max-height,
box-sizing, overflow, visibility, opacity,
flex, flex-grow, flex-shrink, flex-basis, flex-direction, flex-wrap,
align-items, align-self, align-content, justify-content, gap,
margin, margin-top, margin-right, margin-bottom, margin-left,
padding, padding-top, padding-right, padding-bottom, padding-left,
background, background-color, background-image, background-position,
background-size, background-repeat,
border, border-width, border-style, border-color,
border-top, border-right, border-bottom, border-left,
border-radius, border-top-left-radius, border-top-right-radius,
border-bottom-left-radius, border-bottom-right-radius,
box-shadow, color, font-family, font-size, font-weight, font-style,
line-height, letter-spacing, text-align, text-overflow, text-decoration,
text-shadow, white-space, transform, transform-origin
```

Never emit these properties:

```text
object-fit, object-position, text-transform, user-select, appearance,
float, clear, inset, overflow-wrap, word-wrap, mix-blend-mode,
backdrop-filter, will-change, z-index
```

## Responsive Sizing

Do not use CSS at-rules for responsive behavior. Apply a class to the root node, set a viewport-based root font size with `vw`, and express component dimensions and spacing in `rem`:

```css
.page-root {
  font-size: calc(100vw / 23.4375);
}

.card {
  width: 21.4rem;
  padding: 1rem;
}
```

When that pattern does not fit the layout, use `vw` or `vh` directly, or calculate breakpoints in JavaScript and apply explicit classes. `rpx` is Lynx-specific.

## Images

- Set explicit `width` and `height` on every image.
- To crop an image, give its wrapper explicit dimensions and `overflow: hidden`. Do not use `object-fit` or `object-position`.

## Source Documentation

For detailed rules, see `skills/using-lynx-api-docs/lynx-vs-web/css-differences.md` and `skills/using-lynx-api-docs/lynx-vs-web/unsupported-features.md` in [`@lynx-js/lynx-api-docs`](https://www.npmjs.com/package/@lynx-js/lynx-api-docs).
