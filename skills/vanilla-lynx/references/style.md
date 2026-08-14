# Vanilla Lynx Style Reference

Use this reference when writing or reviewing styles for a Vanilla Lynx app.

## Runtime Style Application

- Apply classes with `__SetClasses()` or `__AddClass()`. Reserve `__SetInlineStyles()` for runtime-computed values; browser DOM style APIs are unavailable.

## Lynx-Specific Rules

- Lynx uses column Linear layout by default. Use an explicit `display: linear`, `flex`, `grid`, or `relative` when layout behavior matters; inline flow is unavailable.
- The default `box-sizing` is `auto`, which usually behaves like `border-box`. Margins do not collapse.
- The default `position` is `relative`; `static` is unsupported. Pair `z-index` with `position`.
- Text content must be created under a text node. Text does not wrap by default; set `white-space: normal` when wrapping is required. Only `normal` and `nowrap` are supported.
- Prefer class selectors. Structural pseudo-classes such as `:first-child` and `:nth-child()`, and pseudo-elements such as `::before` and `::after`, may parse but do not match; use explicit classes or Element PAPI nodes instead.
- CSS `@media` rules do not take effect at runtime. For the preferred responsive pattern, set the root font size from the viewport width with `vw`, then express component dimensions and spacing in `rem`. Direct viewport units or JavaScript-driven layout changes are alternatives. `rpx` is Lynx-specific.
- Do not infer support from successful CSS parsing. Check the current Lynx API docs before using an unfamiliar property, value, selector, unit, or at-rule.

## Responsive Sizing

Set a viewport-based root font size, then use `rem` for component widths, heights, padding, margins, and font sizes so they scale from that root value:

```css
page {
  font-size: calc(100vw / 23.4375);
}

.card {
  width: 21.4rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}
```

When this pattern does not fit the layout, use `vw` or `vh` directly for fluid dimensions, or calculate breakpoints in JavaScript and apply explicit layout classes. Do not replace these approaches with `@media`.

## Source Documentation

For detailed rules, see `skills/using-lynx-api-docs/lynx-vs-web/css-differences.md` and `skills/using-lynx-api-docs/lynx-vs-web/unsupported-features.md` in [`@lynx-js/lynx-api-docs`](https://www.npmjs.com/package/@lynx-js/lynx-api-docs).
