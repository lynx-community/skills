# Vanilla Lynx Style Reference

Use this reference before writing a vanilla Lynx CSS entry, reviewing a style change, or migrating Web CSS. Lynx is not a browser: verify its CSS behavior instead of assuming Web defaults or feature support.

## Contents

- [Apply Styles](#apply-styles)
- [Choose a Layout](#choose-a-layout)
- [Size Flex Items and Boxes](#size-flex-items-and-boxes)
- [Style Text](#style-text)
- [Position and Stack Elements](#position-and-stack-elements)
- [Build Responsive Styles](#build-responsive-styles)
- [Use Supported Selectors](#use-supported-selectors)
- [Replace Unsupported Web CSS](#replace-unsupported-web-css)
- [Check Transforms and Animations](#check-transforms-and-animations)
- [Review Checklist](#review-checklist)
- [Source Documentation](#source-documentation)

## Apply Styles

Keep reusable styles in the entry's `style.css`. Apply classes to Element PAPI nodes on the main thread with `__SetClasses()` or `__AddClass()`.

```javascript
const card = __CreateView(pageId);
__SetClasses(card, "card card-featured");
```

```css
.card {
  display: linear;
  linear-direction: column;
  padding: 16px;
}

.card-featured {
  background-color: #f5f5f5;
}
```

Use `__SetInlineStyles()` only for small runtime-computed values. Do not use browser DOM APIs such as `classList` or `HTMLElement.style`.

## Choose a Layout

- Lynx defaults to `display: linear` with `linear-direction: column`; the Web defaults to block flow.
- Prefer an explicit `display: linear`, `flex`, `grid`, or `relative` when the layout contract matters.
- Treat `display: block` as a compatibility value. It can fall back to the default layout outside W3C standards mode.
- Do not use `inline`, `inline-block`, `table*`, `list-item`, `run-in`, or `contents`.
- Replace inline layout with `<text>` and replace table, float, or clear layouts with Flex, Grid, or Linear layout.

In a column Linear layout, an unsized child stretches across a definite cross-axis width but does not automatically fill the main-axis height. Give empty or full-size containers explicit dimensions or `linear-weight`.

Avoid cyclic percentage sizing. A percentage beneath an `auto`, `fit-content`, or `max-content` ancestor may not be remeasured in Linear layout. Give key ancestors definite dimensions or allocate remaining space with `linear-weight`, `flex-grow`, and `flex-shrink`.

## Size Flex Items and Boxes

- Lynx uses `box-sizing: border-box` by default; the Web defaults to `content-box`.
- Lynx does not collapse margins. Adjacent vertical margins are added, so keep spacing on one side or use `gap` or padding.
- Do not use negative padding. Lynx may accept it even though Web CSS rejects it, producing incompatible layout.
- Lynx flex items can shrink below their content size. Set `flex-shrink: 0`, `min-width`, or `min-height` when content must be protected.
- `max-content` is supported, `min-content` is not, and `fit-content` has positioning limitations.

## Style Text

- Create text with `__CreateText()` and `__CreateRawText()`; do not place raw text directly in a view.
- Lynx text does not wrap by default. Set `white-space: normal` when wrapping is required.
- Use only `white-space: normal` or `nowrap`.
- Prefer `text-overflow: clip` or `ellipsis`; do not rely on `fade`.
- Do not rely on Web-only text properties such as `text-transform`, `word-spacing`, `overflow-wrap`, `hyphens`, `writing-mode`, or `text-orientation`.

## Position and Stack Elements

- `position: static` is unsupported; `relative` is the default.
- Always give fixed-position elements explicit `left` and `top` values. Omitted values resolve to the viewport's top-left rather than the Web static position.
- Pair `z-index` with `position`.
- A child with `z-index` inside a scroll container may be promoted to a layer that does not follow scrolling. Add `position: relative; z-index: 0` to the scrolling parent when its stacked children must move with it.

## Build Responsive Styles

- Do not use `@media`; it has no runtime effect in Lynx.
- Prefer `rem` with `vw`, or use `vw` and `vh` directly. Use JavaScript when the style must switch at a discrete breakpoint.
- `rpx` works in Lynx but is not Web-compatible.
- Only `env(safe-area-inset-top|right|bottom|left)` is supported.
- Do not use physical units (`cm`, `mm`, `in`, `pt`, `pc`) or `ch` and `ex`. Treat `vmin` and `vmax` as partially supported.
- Do not use `min()`, `max()`, or `clamp()`.
- Use `calc()` only with supported length properties such as dimensions, offsets, padding, margins, gaps, `flex-basis`, `font-size`, and `text-indent`. Do not use it for colors, enums, transforms, opacity, or `z-index`.

## Use Supported Selectors

Prefer class selectors for variants and state. The reliably implemented pseudo selectors are `:not()`, `:active`, `:focus`, `:root`, `::placeholder`, and `::selection`; `:hover` is platform-dependent.

Many selectors parse without errors but never match, including:

- structural selectors such as `:first-child`, `:last-child`, `:nth-child()`, and `:empty`;
- functional selectors such as `:is()`, `:where()`, and `:has()`;
- form and link states such as `:checked`, `:enabled`, `:disabled`, and `:visited`;
- pseudo-elements such as `::before`, `::after`, `::first-line`, and `::first-letter`.

Use explicit classes or real Element PAPI nodes instead. Treat prefix, suffix, and substring attribute selectors as partially supported.

## Replace Unsupported Web CSS

Do not use:

- generated content, counters, list styles, or table properties;
- `@layer`, `@supports`, `@charset`, or `@namespace`;
- `cursor`, `resize`, `scroll-behavior`, `scroll-snap-*`, `overscroll-behavior`, or `transform-style`;
- `content`, `quotes`, `counter-*`, or `list-style-*`.

Map a Web document background deliberately: use `page` for the full-page surface and the root view for a separate content-container background. Reproduce relevant `body` spacing on `page`; Lynx has no browser user-agent body margin.

## Check Transforms and Animations

- Replace `scale3d()` with `scale()` or `matrix3d()`.
- Replace `rotate3d()` with `rotateX()`, `rotateY()`, `rotateZ()`, or `matrix3d()`.
- `translate3d()` and `matrix3d()` are supported.
- Give `steps()` an explicit step position, such as `steps(4, end)`. The Web-only shorthand `steps(4)` is invalid in Lynx.

## Review Checklist

- Choose the layout mode explicitly when its behavior matters.
- Protect flex content that must not shrink and avoid cyclic percentages.
- Account for `border-box` sizing and non-collapsing margins.
- Wrap text in text nodes and choose wrapping explicitly.
- Replace unsupported selectors, pseudo-elements, at-rules, units, and functions.
- Verify fixed positioning, `z-index`, scroll layers, transforms, and animation timing.
- Check current Lynx documentation for any property or value not covered here.

## Source Documentation

This reference summarizes these files from `@lynx-js/lynx-api-docs`:

- `skills/using-lynx-api-docs/lynx-vs-web/css-differences.md`
- `skills/using-lynx-api-docs/lynx-vs-web/unsupported-features.md`

Consult the current upstream files when exact syntax, platform behavior, or newly added support matters.
