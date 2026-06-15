## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Switch, SwitchThumb, SwitchTrack } from '@lynx-js/lynx-ui'

import { hitSlop } from '../shared/hitSlop'
import './index.css'

function App() {
  const [checked, setChecked] = useState(true)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        {/* Uncontrolled */}
        <view className='section'>
          <view className='row'>
            <Switch className='switch' switchProps={hitSlop}>
              <SwitchTrack className='switch-track' />
              <SwitchThumb className='switch-thumb' />
            </Switch>
            <text className='label'>Uncontrolled</text>
          </view>
        </view>

        {/* Controlled */}
        <view className='section'>
          <view className='row'>
            <Switch
              className='switch'
              checked={checked}
              onChange={setChecked}
              switchProps={hitSlop}
            >
              <SwitchTrack className='switch-track' />
              <SwitchThumb className='switch-thumb' />
            </Switch>
            <text className='label'>Controlled</text>
          </view>
        </view>

        {/* Disabled */}
        <view className='section'>
          <view className='row'>
            <Switch
              className='switch'
              disabled
              defaultChecked
              switchProps={hitSlop}
            >
              <SwitchTrack className='switch-track' />
              <SwitchThumb className='switch-thumb' />
            </Switch>
            <text className='label disabled'>Disabled</text>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### BasicTailwind

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { StyledSwitch } from './styled-switch'
import './index.css'

function App() {
  const [checked, setChecked] = useState(true)

  return (
    <view className='lunaris-dark luna-gradient-berry size-full flex flex-col justify-center px-[48px] py-[72px]'>
      <view className='flex flex-col gap-[24px] px-[48px] py-[64px] rounded-[16px] overflow-hidden text-content bg-canvas'>
        {/* Uncontrolled */}
        <view className='flex flex-col gap-[10px]'>
          <view className='flex flex-row items-center justify-start gap-[16px] w-full'>
            <StyledSwitch />
            <text className='text-lg text-content-2'>Uncontrolled</text>
          </view>
        </view>

        {/* Controlled */}
        <view className='flex flex-col gap-[10px]'>
          <view className='flex flex-row items-center justify-start gap-[16px] w-full'>
            <StyledSwitch
              checked={checked}
              onChange={setChecked}
            />
            <text className='text-lg text-content-2'>Controlled</text>
          </view>
        </view>

        {/* Disabled */}
        <view className='flex flex-col gap-[10px]'>
          <view className='flex flex-row items-center justify-start gap-[16px] w-full shadow'>
            <StyledSwitch disabled defaultChecked />
            <text className='text-lg text-content-2 opacity-40'>Disabled</text>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Themed

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { clsx } from 'clsx'

import {
  ThemedSwitch,
  ThemedSwitchRoot,
  ThemedSwitchThumb,
  ThemedSwitchTrack,
} from './themed-switch'
import './index.css'

function App() {
  const [outerDark, setOuterDark] = useState(true)
  const [innerLight, setInnerLight] = useState(false)

  return (
    <view
      className={clsx(
        'size-full flex flex-col justify-center px-[48px] py-[72px]',
        'luna-gradient-berry',
        outerDark ? 'lunaris-dark' : 'lunaris-light',
      )}
    >
      <view className='flex flex-col gap-[24px] px-[48px] py-[64px] rounded-[16px] overflow-hidden text-content bg-canvas'>
        <text className='text-lg text-content-2'>Theme Switching</text>

        {/* 1) Outer container theme toggle (uses composed component) */}
        <view className='flex flex-row items-center gap-[16px] w-full'>
          <ThemedSwitch checked={outerDark} onChange={setOuterDark} />
          <text className='text-base text-content-2'>
            {outerDark ? 'lunaris-dark' : 'lunaris-light'}
          </text>
        </view>

        <view
          className={clsx(
            'flex flex-col mt-[16px] gap-[10px] py-[16px] px-[16px] rounded-[16px] overflow-hidden bg-canvas border border-line',
            innerLight ? 'lunaris-light' : 'lunaris-dark',
          )}
        >
          {/* 3) Inner container theme toggle (uses themed Primitives)*/}
          <view className='flex flex-row items-center gap-[16px] w-full pt-[8px]'>
            <ThemedSwitchRoot
              defaultChecked={innerLight}
              onChange={setInnerLight}
            >
              <ThemedSwitchTrack />
              <ThemedSwitchThumb />
            </ThemedSwitchRoot>
            <text className='text-base text-content-2'>
              {innerLight ? 'lunaris-light' : 'lunaris-dark'}
            </text>
          </view>
          {/* 3) Inner disabled sample */}
          <view className='flex flex-row items-center gap-[16px] w-full pt-[8px]'>
            <ThemedSwitch disabled checked={innerLight} />
            <text className='text-base text-content-2 opacity-50'>
              Disabled
            </text>
          </view>
        </view>
        {/* 4) Outer disabled sample */}
        <view className='flex flex-row items-center gap-[16px] w-full pt-[8px]'>
          <ThemedSwitch disabled checked={outerDark} />
          <text className='text-base text-content-2 opacity-50'>Disabled</text>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)
export default App
```
