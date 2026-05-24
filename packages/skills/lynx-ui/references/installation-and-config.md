# Installation and Config

Read this file when the user needs to install Lynx UI, choose package shape, import components, or verify project setup.

## Official docs

- Index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`

## Default install path

Start from the official install path unless the user gives a concrete reason to optimize package boundaries.

```bash
npm i @lynx-js/lynx-ui
```

The docs position `@lynx-js/lynx-ui` as the default entrypoint. Prefer that by default because it keeps guidance close to the official examples while still allowing tree-shaking.

## Import example

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

## Narrower package choice

If the user explicitly wants per-component installation, the docs also show a narrower package style such as:

```bash
npm install @lynx-js/lynx-ui-button
```

Use that only when the user has a clear package-boundary or distribution reason. Otherwise keep the full-library install because that matches the official getting-started path more closely.

## Config snippet

If the project setup is being created or repaired, align with the official ReactLynx config shape before inventing custom wiring.

```ts
export default defineConfig({
  plugins: [
    pluginReactLynx({
      enableNewGesture: true,
    }),
  ],
})
```

## Setup checklist

- Confirm the project is a ReactLynx project.
- Confirm the chosen package matches the intended usage.
- Confirm imports come from the same package strategy used elsewhere in the answer.
- If setup or types are unclear, escalate to `lynx-typescript` only for the type/config issue itself.

## Adaptation guidance

You may change:
- file names
- nearby layout wrappers
- surrounding app structure

You should keep close to the docs for:
- package choice
- import shape
- component entrypoint usage
- config assumptions that come from official setup
