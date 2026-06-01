## Examples

### Basic

Origin: oss

Source: `apps/examples/Button/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { Heart } from '../shared/Heart'

import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='demo-canvas'>
        {/* Usage 1: render props to read `active` state and toggle `.active` for styling */}
        <Button onClick={() => console.info('clicked')} className='button-root'>
          {({ active = false }) => (
            <view className={clsx('button', { 'active': active })}>
              <text className='button-text'>
                Button
              </text>
            </view>
          )}
        </Button>
        {/* Usage 2: regular children; styles rely on the primitives-injected `ui-active` state class */}
        <Button className='button'>
          <Heart />
          <text className='button-text'>
            Button
          </text>
        </Button>
      </view>
    </view>
  )
}
root.render(<App />)
export default App
```

### Disabled

Origin: oss

Source: `apps/examples/Button/Disabled/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useState } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import './index.css'

function App() {
  const [timer, setTimer] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const disabled = timer < 1

  return (
    <view className='container lunaris-dark'>
      <text className='countdown'>
        This Button will be disabled after{' '}
        <text className='countdown-timer'>{timer}</text> s
      </text>
      <Button
        onClick={() => console.info('clicked')}
        disabled={disabled}
        className='button-root'
      >
        {({ active = false }) => (
          <view
            className={clsx('button', {
              'active': active,
              'disabled': disabled,
            })}
          >
            <text className='text'>
              Click Me!
            </text>
          </view>
        )}
      </Button>
    </view>
  )
}

root.render(<App />)

export default App
```

### PropagateTapEvent

Origin: oss

Source: `apps/examples/Button/PropagateTapEvent/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMemo, useState } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { LogPanel } from './LogPanel'
import { createLogger } from './utils/log'
import type { LogItem } from './utils/log'

import './index.css'

function App() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const logger = useMemo(() => createLogger({ setLogs, max: 8 }), [])

  return (
    <view
      className='container lunaris-dark'
      bindtap={() => {
        console.info('container clicked')
        logger.pushLog('container clicked')
      }}
    >
      <Button
        onClick={() => {
          console.info('button clicked')
          logger.pushLog('button clicked')
        }}
        className='button-root'
      >
        {({ active = false }) => (
          <view className={clsx('button', { 'active': active })}>
            <text className='text'>
              Click Me!
            </text>
          </view>
        )}
      </Button>

      <LogPanel
        logs={logs}
        onClear={() => {
          logger.clearLogs()
          logger.pushLog('log cleared')
        }}
      />
    </view>
  )
}
root.render(<App />)
export default App
```
