Here’s a Lynx UI-first settings screen that stays close to the official component patterns. It uses `ScrollView` for the screen layout, `Switch` for notification toggles, `RadioGroup` for theme selection, and a `Button` render-prop for the save action, while keeping styling on Luna semantic tokens instead of inventing a separate design system.

```tsx
import { useState } from 'react';
import {
  Button,
  Radio,
  RadioGroupRoot,
  RadioIndicator,
  ScrollView,
  Switch,
  SwitchThumb,
} from '@lynx-js/lynx-ui';

type ThemeMode = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState({
    marketing: false,
    updates: true,
    reminders: true,
  });
  const [theme, setTheme] = useState<ThemeMode>('system');

  const saveSettings = () => {
    console.log('save settings', { notifications, theme });
  };

  return (
    <ScrollView>
      <view className="min-h-screen bg-canvas px-16 py-20">
        <view className="mb-20">
          <text className="text-2xl font-semibold text-content">Settings</text>
          <text className="mt-4 text-sm text-content-muted">
            Manage notifications and choose your preferred theme.
          </text>
        </view>

        <view className="rounded-2xl border border-line bg-paper px-16 py-12">
          <text className="mb-12 text-base font-medium text-content">
            Notifications
          </text>

          <view className="flex-row items-center justify-between py-10 border-b border-rule">
            <view>
              <text className="text-base text-content">Product updates</text>
              <text className="mt-2 text-sm text-content-muted">
                Important changes and release notes.
              </text>
            </view>
            <Switch
              checked={notifications.updates}
              onChange={(checked) =>
                setNotifications((current) => ({ ...current, updates: checked }))
              }
            >
              <SwitchThumb />
            </Switch>
          </view>

          <view className="flex-row items-center justify-between py-10 border-b border-rule">
            <view>
              <text className="text-base text-content">Reminders</text>
              <text className="mt-2 text-sm text-content-muted">
                Helpful nudges for unfinished tasks.
              </text>
            </view>
            <Switch
              checked={notifications.reminders}
              onChange={(checked) =>
                setNotifications((current) => ({ ...current, reminders: checked }))
              }
            >
              <SwitchThumb />
            </Switch>
          </view>

          <view className="flex-row items-center justify-between py-10">
            <view>
              <text className="text-base text-content">Marketing</text>
              <text className="mt-2 text-sm text-content-muted">
                Occasional tips, offers, and feature highlights.
              </text>
            </view>
            <Switch
              checked={notifications.marketing}
              onChange={(checked) =>
                setNotifications((current) => ({ ...current, marketing: checked }))
              }
            >
              <SwitchThumb />
            </Switch>
          </view>
        </view>

        <view className="mt-16 rounded-2xl border border-line bg-paper px-16 py-12">
          <text className="mb-12 text-base font-medium text-content">Theme</text>

          <RadioGroupRoot value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <view className="gap-10">
              <view className="flex-row items-center justify-between rounded-xl border border-line px-12 py-10">
                <text className="text-base text-content">System</text>
                <Radio value="system">
                  <RadioIndicator />
                </Radio>
              </view>

              <view className="flex-row items-center justify-between rounded-xl border border-line px-12 py-10">
                <text className="text-base text-content">Light</text>
                <Radio value="light">
                  <RadioIndicator />
                </Radio>
              </view>

              <view className="flex-row items-center justify-between rounded-xl border border-line px-12 py-10">
                <text className="text-base text-content">Dark</text>
                <Radio value="dark">
                  <RadioIndicator />
                </Radio>
              </view>
            </view>
          </RadioGroupRoot>
        </view>

        <view className="mt-20">
          <Button onClick={saveSettings}>
            {({ active, disabled }) => (
              <view
                className={`items-center rounded-2xl bg-primary px-16 py-12 ${
                  active ? 'ui-active' : ''
                } ${disabled ? 'ui-disabled' : ''}`}
              >
                <text className="text-base font-medium text-primary-content">Save settings</text>
              </view>
            )}
          </Button>
        </view>
      </view>
    </ScrollView>
  );
}
```

Why this is close to the official Lynx UI way:

- `ScrollView` is used as the top-level container for a settings-style screen.
- Each notification control uses the documented `Switch` plus `SwitchThumb` structure.
- Theme selection uses `RadioGroupRoot` with `Radio` and `RadioIndicator`, keeping selection state at the group level.
- The save action keeps the official `Button` render-prop shape instead of replacing it with a custom pressable wrapper.
- Colors stay on Luna semantic tokens like `bg-canvas`, `bg-paper`, `text-content`, `text-content-muted`, `border-line`, `border-rule`, `bg-primary`, and `text-primary-content`.

If you want, I can also turn this into a `Form`-based Lynx UI version, but for this screen the direct `Switch` + `RadioGroup` composition is the closest fit.