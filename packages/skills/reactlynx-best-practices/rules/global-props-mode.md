---
title: globalPropsMode
ruleId: global-props-mode
impact: MEDIUM
impactDescription: prevents stale lynx.__globalProps state and unexpected lynx.__globalProps update behavior
tags: rspeedy, global-props, configuration, update, events
---

## globalPropsMode

`lynx.__globalProps` is Host-injected cross-page/global data updated through
`updateGlobalProps`. It is similar to data mounted on `window` on the Web.

`globalPropsMode` is an option of `PluginReactLynxOptions` from
`@lynx-js/react-rsbuild-plugin`. It controls the rendering update mode for
changes to `lynx.__globalProps`.

### Modes

| Mode         | Behavior                                                                             | Use when                                                                               |
| ------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `'reactive'` | `UpdateGlobalProps` triggers framework `forceUpdate` from the root component         | Direct `lynx.__globalProps` reads should participate in the framework-driven re-render |
| `'event'`    | `UpdateGlobalProps` triggers an event, but the framework does not drive re-rendering | Code should explicitly update state with `useGlobalPropsChanged`                       |

The default value is `'reactive'`.

### Why It Matters

`lynx.__globalProps` can be read from many places in an app. In `'reactive'`
mode, components that directly read `lynx.__globalProps` can re-render after
`UpdateGlobalProps` because the framework starts `forceUpdate` from the root
component.

In `'event'` mode, `UpdateGlobalProps` no longer causes that framework-driven
re-render. Code that needs to respond to changed `lynx.__globalProps` should
subscribe with `useGlobalPropsChanged` and update local state, context, or the
relevant store explicitly.

`useGlobalPropsChanged` itself can respond to `lynx.__globalProps` changes regardless of
`globalPropsMode`. The mode controls whether the framework also triggers
automatic React updates.

### Migration From Reactive to Event

When a change actively sets `globalPropsMode: 'event'` in a project that
previously omitted `globalPropsMode` or used `globalPropsMode: 'reactive'`, scan
every `lynx.__globalProps` usage before accepting the change.

```bash
rg "lynx\\.__globalProps" <project>
```

For each `lynx.__globalProps` usage, report whether the value needs to respond to later
`UpdateGlobalProps` calls:

- If it needs to respond to updates, refactor the code to subscribe with
  `useGlobalPropsChanged` and update local state, context, or the relevant store
  from the callback data.
- If it does not need to respond to updates, keep the direct read but note that
  this code will not be automatically re-rendered by the framework after
  `UpdateGlobalProps` in `'event'` mode.

Do not treat a config-only migration from default or `'reactive'` to `'event'`
as complete until all `lynx.__globalProps` reads have been classified.

### Event Mode Example

Set `globalPropsMode: 'event'` when updates should be handled explicitly.

```ts
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";

export default {
  plugins: [
    pluginReactLynx({
      globalPropsMode: "event",
    }),
  ],
};
```

Use `useGlobalPropsChanged` in components or hooks that need to update when
`lynx.__globalProps` changes.

```tsx
import { useGlobalPropsChanged, useState } from "@lynx-js/react";

export function App() {
  const [theme, setTheme] = useState(lynx.__globalProps.appTheme);

  useGlobalPropsChanged((globalProps) => {
    setTheme(globalProps.appTheme);
  });

  return <view className={theme} />;
}
```

### Reactive Mode Example

Omitting `globalPropsMode` keeps the default `'reactive'` mode.

```ts
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";

export default {
  plugins: [pluginReactLynx()],
};
```

### Review Checklist

- Check Rspeedy config for `globalPropsMode`.
- In `'reactive'` mode, direct `lynx.__globalProps` reads can rely on framework
  `forceUpdate` from the root component.
- In `'event'` mode, verify state derived from `lynx.__globalProps` is
  refreshed with `useGlobalPropsChanged`.
- If a project changes from omitted/`'reactive'` to `'event'`, scan all
  `lynx.__globalProps` usages and warn that direct reads not moved behind
  `useGlobalPropsChanged` will no longer get framework `forceUpdate` re-renders
  from the root component after future updates.
- Do not assume components re-render automatically in `'event'` mode.

### Reference

- https://lynxjs.org/next/api/lynx-api/lynx/lynx-global-props.html
- https://lynxjs.org/next/zh/api/rspeedy/react-rsbuild-plugin.pluginreactlynxoptions.globalpropsmode.html
- https://lynxjs.org/next/zh/api/react/Function.useGlobalPropsChanged.html
