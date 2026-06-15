## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Input, TextArea } from '@lynx-js/lynx-ui'
import type { InputRef } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const controlledInputRef = useRef<InputRef>(null)
  const uncontrolledInputRef = useRef<InputRef>(null)

  const [controlledValue, setControlledValue] = useState<string>(
    'controlledValue',
  )
  const uncontrolledValueRef = useRef<string>('demo-uncontrolledValue')

  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='demo-canvas'>
        {/* Input */}
        <view className='section'>
          <text className='title'>Input</text>

          <view className='field'>
            <text className='label'>Basic</text>
            <Input className='input' placeholder='Type here' />
          </view>

          <view className='field'>
            <text className='label'>Uncontrolled</text>
            <Input
              ref={uncontrolledInputRef}
              className='input'
              placeholder='Uncontrolled'
              defaultValue={uncontrolledValueRef.current}
            />
          </view>

          <view className='field'>
            <text className='label'>Controlled</text>
            <Input
              ref={controlledInputRef}
              className='input'
              placeholder='Controlled'
              value={controlledValue}
              onInput={setControlledValue}
            />
          </view>
        </view>

        {/* TextArea */}
        <view className='section'>
          <text className='title'>TextArea</text>

          <view className='textarea-wrap'>
            <TextArea
              className='textarea'
              placeholder='Write something...'
            />
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### KeyboardAwareInScrollView

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root } from '@lynx-js/react'

import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  TextArea,
} from '@lynx-js/lynx-ui'

import './index.css'

type Item = 'block' | 'input' | 'textarea'

const BLOCKS: Item[] = [
  ...Array.from({ length: 5 }, () => ['block', 'input'] as const).flat(),
  'block',
  'textarea',
  'block',
  'input',
]

function App() {
  return (
    <view className='container lunaris-dark luna-gradient-rose'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <KeyboardAwareResponder as='ScrollView' className='canvas'>
          {BLOCKS.map((item, index) => {
            if (item === 'input') {
              return (
                <KeyboardAwareTrigger key={`input-${index}`} offset={0}>
                  <view className='card'>
                    <text className='label'>Input</text>
                    <Input className='input' placeholder='Type here' />
                  </view>
                </KeyboardAwareTrigger>
              )
            }

            if (item === 'textarea') {
              return (
                <KeyboardAwareTrigger key={`textarea-${index}`} offset={0}>
                  <view className='card'>
                    <text className='label'>TextArea</text>
                    <view className='textarea-wrap'>
                      <TextArea
                        className='textarea'
                        placeholder='Write something...'
                        maxLength={600}
                        maxLines={20}
                      />
                    </view>
                  </view>
                </KeyboardAwareTrigger>
              )
            }

            return <view key={`block-${index}`} className='block' />
          })}
        </KeyboardAwareResponder>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### KeyboardAwareView

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  TextArea,
} from '@lynx-js/lynx-ui'
import type { InputRef } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const input2Ref = useRef<InputRef>(null)

  return (
    <view className='container lunaris-dark luna-gradient-rose'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <KeyboardAwareResponder className='canvas' style={{ height: 'auto' }}>
          <view className='section'>
            <text className='title'>Keyboard Aware</text>
            <text className='subtitle'>
              Type <text className='code'>next</text> to jump focus.
            </text>
          </view>

          <KeyboardAwareTrigger offset={0}>
            <view className='card'>
              <text className='label'>Input 0</text>
              <Input
                className='input'
                placeholder="inputId: 'input0'"
                onInput={(value: string) => {
                  if (value === 'next') input2Ref.current?.focus()
                }}
              />
            </view>
          </KeyboardAwareTrigger>

          <KeyboardAwareTrigger>
            <view className='card'>
              <text className='label'>Input 1</text>
              <Input
                className='input'
                placeholder="Type 'next' to focus input2"
                onInput={(value: string) => {
                  if (value === 'next') input2Ref.current?.focus()
                }}
              />
            </view>
          </KeyboardAwareTrigger>

          <KeyboardAwareTrigger>
            <view className='card'>
              <text className='label'>Input 2</text>
              <Input
                ref={input2Ref}
                className='input'
                placeholder='Input'
              />
            </view>
          </KeyboardAwareTrigger>

          <KeyboardAwareTrigger offset={0}>
            <view className='card'>
              <text className='label'>TextArea</text>
              <view className='textarea-wrap'>
                <TextArea
                  className='textarea'
                  placeholder='Write something...'
                />
              </view>
            </view>
          </KeyboardAwareTrigger>
        </KeyboardAwareResponder>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)

export default App
```
