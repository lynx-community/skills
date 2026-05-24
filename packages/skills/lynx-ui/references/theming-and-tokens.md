# Theming and Tokens

Read this file when the task involves Luna themes, semantic tokens, or consistent design values across a Lynx UI screen or flow.

## Official docs

- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`

## Default recommendation

Prefer Luna themes/tokens over ad hoc styling when the task is about consistency, shared visual language, or screen-level theming.

## Built-in themes

- `luna-light`
- `luna-dark`
- `lunaris-light`
- `lunaris-dark`

Use the official theme names when discussing theme selection. Keep custom themes as an override path, not the default path.

## Starter token set

For most screens, start from this semantic set:
- surfaces: `canvas`, `paper`, `paper-clear`
- text: `content`, `content-2`, `content-muted`
- actions: `primary`, `primary-2`, `primary-content`
- structure: `neutral-faint`, `line`, `rule`
- overlays: `backdrop`, `backdrop-heavy`

## Token families

- surface: `canvas`, `canvas-ambient`, `paper`, `paper-clear`, `paper-veil`, `paper-film`
- content: `content`, `content-2`, `content-muted`, `content-subtle`, `content-faint`, `content-faded`
- primary: `primary`, `primary-2`, `primary-muted`, `primary-content`, `primary-content-faded`
- secondary: `secondary`, `secondary-2`, `secondary-content`, `secondary-content-faded`
- neutral: `neutral`, `neutral-2`, `neutral-subtle`, `neutral-faint`, `neutral-ambient`, `neutral-content`, `neutral-content-faded`, `neutral-veil`, `neutral-film`
- lines/backdrop: `line`, `rule`, `backdrop-subtle`, `backdrop`, `backdrop-heavy`
- gradients for Lunaris: `gradient-a`, `gradient-b`, `gradient-c`, `gradient-d`, `gradient-content`, `gradient-content-faded`, `gradient-content-trace`

## CSS variable example

```css
.card {
  color: var(--content);
  background-color: var(--paper);
  border: 1px solid var(--line);
}
```

## Tailwind or className-style example

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

## Custom theme example

```css
.my-brand-dark {
  --primary: #ff4f8b;
  --primary-content: #ffffff;
  --paper: #141414;
  --content: #f8f8f8;
}
```

## Guidance rules

- Prefer semantic roles like `paper`, `content`, `primary`, and `line` instead of raw hex values.
- Keep Luna as the default recommendation unless the user explicitly wants a custom local theme system.
- If the user asks for consistency across multiple surfaces, reach for tokens before proposing one-off style props.
- Explain the smallest token set that solves the task instead of dumping every token.

## Avoid

- replacing Luna with hard-coded colors unless the user asks for that tradeoff
- inventing a parallel theming system when Lynx UI already covers the need
- flattening semantic tokens into generic style constants without a reason
