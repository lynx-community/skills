You can build this pretty cleanly with the official Lynx UI primitives rather than introducing a custom settings abstraction.

I’d compose it as:
- `ScrollView` for the page content
- `Switch` + `SwitchThumb` for notification toggles
- `RadioGroupRoot`, `Radio`, and `RadioIndicator` for theme selection
- `Button` for the save action
- Luna semantic tokens like `paper`, `content`, `content-muted`, `line`, `primary`, and `primary-content` for styling

A straightforward Lynx UI version would look like this:

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

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('system');

  const saveSettings = () => {
    console.log('save settings', {
      pushEnabled,
      emailEnabled,
      marketingEnabled,
      theme,
    });
  };

  return (
    <ScrollView className="bg-canvas" style={{ height: '100%' }}>
      <view style={{ padding: 16, gap: 16 }}>
        <view
          className="bg-paper border border-line"
          style={{ borderRadius: 16, padding: 16, gap: 12 }}
        >
          <text className="text-content" style={{ fontSize: 18, fontWeight: '600' }}>
            Notifications
          </text>
          <text className="text-content-muted" style={{ fontSize: 14 }}>
            Choose which updates you want to receive.
          </text>

          <SettingSwitchRow
            label="Push notifications"
            description="Alerts for account activity and reminders"
            checked={pushEnabled}
            onChange={setPushEnabled}
          />
          <SettingSwitchRow
            label="Email notifications"
            description="Weekly summaries and important updates"
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />
          <SettingSwitchRow
            label="Marketing updates"
            description="Product tips, offers, and announcements"
            checked={marketingEnabled}
            onChange={setMarketingEnabled}
          />
        </view>

        <view
          className="bg-paper border border-line"
          style={{ borderRadius: 16, padding: 16, gap: 12 }}
        >
          <text className="text-content" style={{ fontSize: 18, fontWeight: '600' }}>
            Theme
          </text>
          <text className="text-content-muted" style={{ fontSize: 14 }}>
            Pick how the app should appear.
          </text>

          <RadioGroupRoot value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <ThemeOption value="light" label="Light" description="Always use the light theme" />
            <ThemeOption value="dark" label="Dark" description="Always use the dark theme" />
            <ThemeOption value="system" label="System" description="Match the device setting" />
          </RadioGroupRoot>
        </view>

        <Button onClick={saveSettings}>
          {({ active, disabled }) => (
            <view
              className="bg-primary"
              style={{
                minHeight: 48,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.5 : active ? 0.85 : 1,
              }}
            >
              <text className="text-primary-content" style={{ fontSize: 16, fontWeight: '600' }}>
                Save settings
              </text>
            </view>
          )}
        </Button>
      </view>
    </ScrollView>
  );
}

type SettingSwitchRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingSwitchRow({ label, description, checked, onChange }: SettingSwitchRowProps) {
  return (
    <view
      className="border border-line"
      style={{
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <view style={{ flex: 1, gap: 4 }}>
        <text className="text-content" style={{ fontSize: 16, fontWeight: '500' }}>
          {label}
        </text>
        <text className="text-content-muted" style={{ fontSize: 13 }}>
          {description}
        </text>
      </view>

      <Switch checked={checked} onChange={onChange}>
        <SwitchThumb />
      </Switch>
    </view>
  );
}

type ThemeOptionProps = {
  value: ThemeMode;
  label: string;
  description: string;
};

function ThemeOption({ value, label, description }: ThemeOptionProps) {
  return (
    <Radio value={value}>
      <view
        className="border border-line"
        style={{
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
        }}
      >
        <RadioIndicator />
        <view style={{ gap: 4 }}>
          <text className="text-content" style={{ fontSize: 16, fontWeight: '500' }}>
            {label}
          </text>
          <text className="text-content-muted" style={{ fontSize: 13 }}>
            {description}
          </text>
        </view>
      </view>
    </Radio>
  );
}
```

Why this stays close to the official Lynx UI way:
- It uses the documented primitives directly instead of wrapping everything in a custom design system.
- `Switch` owns the toggle behavior, `RadioGroupRoot` owns single-selection state, and `Button` uses the official render-prop state for pressed/disabled styling.
- Styling leans on Luna semantic tokens so the screen fits Lynx UI theming without hard-coding a bespoke palette.

If you want, I can also turn this into a `Form`-based Lynx UI version, but for a settings screen like this, the direct `Switch` + `RadioGroup` composition is the simplest official-fit approach.
