Yes — if your goal is consistent theming across a Lynx UI screen, Luna tokens are the recommended path.

I’d avoid introducing one-off colors or a parallel theme layer unless you already have a strong custom brand system that Luna can’t cover.

A good default approach is:

- use Luna semantic surface tokens for the screen background and cards, like `canvas`, `paper`, and `paper-clear`
- use semantic text tokens like `content`, `content-2`, and `content-muted`
- use structural tokens like `line` or `rule` for borders and separators
- use action tokens like `primary` and `primary-content` for CTAs and selected states

For example, a screen shell can usually start with something like:

```tsx
<view className="bg-canvas">
  <view className="bg-paper border border-line">
    <text className="text-content">Title</text>
    <text className="text-content-muted">Supporting text</text>
  </view>
</view>
```

If this is a multi-section screen, I’d keep the theming strategy simple and consistent:

- `bg-canvas` for the page background
- `bg-paper` for elevated sections/cards
- `text-content` for primary labels
- `text-content-muted` for secondary copy
- `border-line` for dividers and card outlines
- `bg-primary text-primary-content` for main actions

That gives you a screen that stays visually coherent in both supported Luna theme modes, instead of baking in fixed colors.

If you want, I can next help map a specific screen into a small Luna token palette and show exactly which Lynx UI primitives to use for each section.