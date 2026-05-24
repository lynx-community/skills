---
name: lynx-ui
description: |
  Use this skill whenever the user wants to install, adopt, troubleshoot, or generate code with the official Lynx UI library in a ReactLynx project. Use it for Lynx UI components, headless composition, Luna themes/tokens, motion, motion-mini, or adapting examples from the official Lynx UI docs, even if the user does not explicitly ask for "Lynx UI best practices." Prefer this skill over generic React UI guidance whenever the task touches Lynx UI in any meaningful way.
---

# Lynx UI

Use this skill to help AI agents work with the official Lynx UI library in ReactLynx projects. Prefer the official Lynx UI way of building things unless the user explicitly requests a different implementation style.

## Core Rules

- Start from the closest official Lynx UI docs page before generating code.
- Unless the user asks otherwise, keep the implementation close to the official Lynx UI example shape.
- Adapt naming, file layout, and surrounding app structure minimally.
- Preserve Lynx UI semantics instead of rewriting examples into generic React abstractions.
- Prefer Luna semantic tokens over ad hoc colors when the task is about theming.
- Choose motion vs motion-mini deliberately instead of defaulting to a generic animation library.
- If a needed component or API is missing from this skill package, check the official Lynx UI website first for newer docs or recently added components before inventing a local pattern.
- When the problem crosses into ReactLynx architecture or Lynx TypeScript issues, consult the related local skills listed below.

## Default Workflow

1. Identify the closest official Lynx UI docs page.
2. Classify the task as setup/install, components/composition, theming/tokens, motion, troubleshooting, or screen-level composition.
3. Load only the relevant reference files before generating code.
4. For component work, go straight to [`references/components.md`](./references/components.md) and start from the closest documented component section.
5. If the task needs a concrete multi-component example, open [`references/example/counter-app.tsx`](./references/example/counter-app.tsx) and reuse only the parts that match the request.
6. Reuse the nearest official snippet and adapt it minimally.
7. Explain only the adaptations that were necessary for the user’s codebase.
8. If the request is a multi-part screen or flow, compose it from the closest official Lynx UI primitives instead of inventing a generic abstraction first.
9. If the relevant component is not covered in local markdown, check the official Lynx UI docs for the latest component guidance and use that as the source of truth.

## Reading Order

1. For overall routing, setup, adaptation, and troubleshooting boundaries, read [`references/foundation.md`](./references/foundation.md).
2. For component-specific official links, code style, examples, and component-family selection, read [`references/components.md`](./references/components.md).
3. For Luna themes/tokens, read [`references/theming-and-tokens.md`](./references/theming-and-tokens.md).
4. For choosing and applying motion or motion-mini, read [`references/motion.md`](./references/motion.md).
5. For composing a full screen or multi-part flow from Lynx UI primitives, read [`references/screen-recipes.md`](./references/screen-recipes.md).

## Reference Groups

- **Foundation** — `foundation.md`
- **Component lookup** — `components.md`
- **Theming** — `theming-and-tokens.md`
- **Motion** — `motion.md`
- **Screen recipes** — `screen-recipes.md`
- **Example screen** — `example/counter-app.tsx`

This structure keeps `SKILL.md` as the orchestrator and pushes dense, task-specific guidance into a small reference set, which matches Anthropic's progressive-disclosure skill pattern.

## Examples

**Install and import**

```bash
npm i @lynx-js/lynx-ui
```

```tsx
import { Button } from '@lynx-js/lynx-ui';

export default function App() {
  return (
    <view>
      <Button />
    </view>
  );
}
```

**Existing-app adoption**

- Start from the nearest official example from `https://lynxjs.org/next/lynx-ui/introduction` or the component docs.
- Keep the Lynx UI component structure intact.
- Change only names, surrounding layout, and local data wiring.

**Luna-token themed surface**

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

**Motion choice**

- Use full motion when the task needs richer value types, derived styles, or a higher-level motion workflow.
- Use motion-mini when the task is a small numeric transition and smaller runtime matters more than convenience.

## Task Modes

- **Setup/install** — use [`references/foundation.md`](./references/foundation.md) for package shape, imports, config, and setup troubleshooting.
- **Existing-app adoption** — use [`references/foundation.md`](./references/foundation.md) for adaptation rules, then pair with the closest specific reference.
- **New-flow implementation** — build a new component or interaction from the closest official Lynx UI pattern.
- **Components/composition** — go to [`references/components.md`](./references/components.md), choose the nearest component section, and stay close to the official structure.
- **Theming/tokens** — use Luna themes/tokens instead of ad hoc styling when appropriate.
- **Motion** — choose between motion and motion-mini and adapt the correct official pattern.
- **Screen-level composition** — use [`references/screen-recipes.md`](./references/screen-recipes.md) to assemble multi-part screens from the closest documented primitives.
- **Reference example reuse** — when a request is close to a simple interactive demo or a small composed screen, consult [`references/example/counter-app.tsx`](./references/example/counter-app.tsx) for a concrete one-file example that combines several Lynx UI primitives with comments.
- **Troubleshooting** — start in [`references/foundation.md`](./references/foundation.md), then hand off if the issue belongs to another local Lynx skill.

## Related Local Skills

- `reactlynx-best-practices` — use when ReactLynx architecture, thread-sensitive behavior, or ReactLynx-specific patterns become central.
- `lynx-typescript` — use when the task is blocked by Lynx-specific TypeScript configuration or type errors.

## Verification

After generating or modifying Lynx UI guidance:

1. Check that the chosen pattern matches the closest official Lynx UI docs page.
2. Check that the result stays close to official Lynx UI semantics instead of drifting into generic React abstractions.
3. Check that theming guidance prefers Luna tokens when the task is about shared design values.
4. Check that motion guidance explicitly chooses between motion and motion-mini.
5. Check whether ReactLynx architecture or Lynx TypeScript constraints require consulting local skills.
