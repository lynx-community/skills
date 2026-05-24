Yes — Luna tokens are the recommended path here if the goal is consistent theming across a Lynx UI screen.

Closest official anchor: Lynx UI Luna themes/tokens (`https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`)
Relevant local references: `/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/theming-and-tokens.md` and `/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/screen-recipes.md`

I’d recommend keeping the screen structure as-is, then normalizing shared surfaces and text onto a small Luna semantic token set instead of introducing screen-specific color constants.

Good starting token set for a screen:
- Surfaces: `canvas`, `paper`, `paper-clear`
- Text: `content`, `content-muted`
- Actions: `primary`, `primary-content`
- Structure: `line`, `rule`
- Overlays if needed: `backdrop`

A typical screen-level application would look like this:

```tsx
<view className="bg-canvas">
  <view className="bg-paper border border-line">
    <text className="text-content">Screen title</text>
    <text className="text-content-muted">Supporting description</text>
  </view>

  <view className="bg-paper-clear border-t border-rule">
    <text className="text-content">Section label</text>
  </view>

  <view className="bg-primary">
    <text className="text-primary-content">Primary action</text>
  </view>
</view>
```

What I would do in practice:
1. Put the full screen background on `canvas`.
2. Put cards, sections, and grouped content on `paper` or `paper-clear`.
3. Convert all primary text to `content` and secondary/help text to `content-muted`.
4. Replace divider/border colors with `line` or `rule`.
5. Use `primary` + `primary-content` for the main CTA rather than a custom accent color.

Why this is the right default:
- It stays aligned with official Lynx UI semantics.
- It gives you light/dark theme compatibility without reworking each component.
- It avoids inventing a parallel theming layer when Luna already solves screen consistency.

I would avoid hard-coded hex colors unless you already have a brand requirement that Luna cannot express. If brand customization is needed later, it’s better to override Luna theme variables than to scatter raw colors through the screen.

If you want, I can next help map a specific screen into Luna tokens section by section and suggest the minimal className/style changes needed.