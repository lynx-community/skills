## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Checkbox, CheckboxIndicator } from '@lynx-js/lynx-ui'

import { CheckMark } from '../shared/Checkmark'
import { hitSlop } from '../shared/hitSlop'
import './index.css'

function App() {
  const [checked, setChecked] = useState(false)

  return (
    <view className='demo-container lunaris-dark luna-gradient-ocean'>
      <view className='demo-canvas'>
        {/* Uncontrolled */}
        <view className='section'>
          <text className='title'>Uncontrolled</text>
          <view className='row'>
            <Checkbox
              className='checkbox'
              defaultChecked={true}
              onChange={(value) => console.log('Uncontrolled changed:', value)}
              checkboxProps={hitSlop}
            >
              <CheckboxIndicator className='checkbox-indicator'>
                <CheckMark />
              </CheckboxIndicator>
            </Checkbox>
            <text className='label'>Uncontrolled Checkbox</text>
          </view>
        </view>

        {/* Controlled */}
        <view className='section'>
          <text className='title'>Controlled</text>
          <view className='row'>
            <Checkbox
              className='checkbox'
              checked={checked}
              onChange={(value) => {
                console.log('Controlled changed:', value)
                setChecked(value)
              }}
              checkboxProps={hitSlop}
            >
              <CheckboxIndicator className='checkbox-indicator'>
                <CheckMark />
              </CheckboxIndicator>
            </Checkbox>
            <text className='label'>{checked ? 'Checked' : 'Unchecked'}</text>
          </view>
        </view>

        {/* Disabled */}
        <view className='section'>
          <text className='title'>Disabled</text>
          <view className='row'>
            <Checkbox disabled className='checkbox'>
              <CheckboxIndicator className='checkbox-indicator'>
                <CheckMark />
              </CheckboxIndicator>
            </Checkbox>
            <text className='label disabled'>Disabled</text>
          </view>
          <view className='row'>
            <Checkbox disabled checked className='checkbox'>
              <CheckboxIndicator className='checkbox-indicator'>
                <CheckMark />
              </CheckboxIndicator>
            </Checkbox>
            <text className='label disabled'>Disabled & Checked</text>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Indeterminate

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Checkbox, CheckboxIndicator } from '@lynx-js/lynx-ui'

import { CheckMark } from '../shared/Checkmark'
import { hitSlop } from '../shared/hitSlop'
import './index.css'

const FRUITS = ['Apple', 'Banana', 'Orange']

function IndeterminateMark() {
  return <view className='indeterminate-mark' />
}

function App() {
  const [selected, setSelected] = useState<string[]>([FRUITS[0]])

  const allSelected = selected.length === FRUITS.length
  const noneSelected = selected.length === 0
  const indeterminate = !noneSelected && !allSelected

  const handleSelectAll = (checked: boolean) => {
    console.log('Select All changed:', checked)
    setSelected(checked ? FRUITS : [])
  }

  const handleItem = (item: string, checked: boolean) => {
    console.log(`Item "${item}" Changed:`, checked)
    setSelected((prev) => {
      if (checked) return prev.includes(item) ? prev : [...prev, item]
      return prev.filter((x) => x !== item)
    })
  }

  return (
    <view className='demo-container lunaris-dark luna-gradient-ocean'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Indeterminate</text>

          <view className='row'>
            <Checkbox
              className='checkbox'
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={handleSelectAll}
              checkboxProps={hitSlop}
            >
              <CheckboxIndicator className='checkbox-indicator'>
                {indeterminate ? <IndeterminateMark /> : <CheckMark />}
              </CheckboxIndicator>
            </Checkbox>
            <text className='label'>Select All</text>
          </view>

          <view className='fruits'>
            {FRUITS.map((fruit) => (
              <view key={fruit} className='row'>
                <Checkbox
                  className='checkbox'
                  checked={selected.includes(fruit)}
                  onChange={(checked) => handleItem(fruit, checked)}
                  checkboxProps={hitSlop}
                >
                  <CheckboxIndicator className='checkbox-indicator'>
                    <CheckMark />
                  </CheckboxIndicator>
                </Checkbox>
                <text className='label'>{fruit}</text>
              </view>
            ))}
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)
export default App
```
