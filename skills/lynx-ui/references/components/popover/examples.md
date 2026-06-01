## Examples

### Backdrop

Origin: oss

Source: `apps/examples/Popover/Backdrop/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  PopoverBackdrop,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  const [internalVisible, setInternalVisible] = useState(true)

  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot
        show={internalVisible}
        onVisibleChange={visible => setInternalVisible(visible)}
      >
        <PopoverTrigger className='popover-trigger'>
          <EllipsisIcon />
          <PopoverPositioner
            placement='bottom'
            placementOffset={12}
            autoAdjust='shift'
            className='popover-positioner'
          >
            {
              /*
              Workaround for issue #90: the default `fixed` PopoverBackdrop can stack above
              PopoverContent in this layout, so we use `position: absolute` and oversize
              with viewport units to keep the backdrop under the content while still
              covering the screen.
            */
            }
            <PopoverBackdrop
              className='popover-backdrop'
              style={{
                position: 'absolute',
                top: '-100vh',
                left: '-100vw',
                width: '300vw',
                height: '300vh',
              }}
            />
            <PopoverContent className='popover-content'>
              <OptionsMenu description='Moments persist. Actions are transient. Tap outside to close.' />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Basic

Origin: oss

Source: `apps/examples/Popover/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot
        defaultShow={true}
        onClose={() => console.info('dismissed!')}
        onOpen={() => console.info('shown!')}
      >
        <PopoverTrigger className='popover-trigger'>
          <EllipsisIcon />
          <PopoverPositioner
            placement='bottom'
            placementOffset={12}
            autoAdjust='shift'
            className='popover-positioner'
          >
            <PopoverContent className='popover-content'>
              <OptionsMenu />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### BasicTailwind

Origin: oss

Source: `apps/examples/Popover/BasicTailwind/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { OptionsMenu } from '../shared/index.js'

import './index.css'

function App() {
  return (
    <view className='lunaris-dark size-full pb-[160px] px-[48px] flex flex-col justify-center items-center bg-primary-muted'>
      <PopoverRoot
        onClose={() => console.info('dismissed!')}
        onOpen={() => console.info('shown!')}
      >
        <PopoverTrigger className='trigger w-[168px] h-[48px] self-end flex flex-col justify-center items-center bg-primary rounded-[24px] transition-all ui-active:bg-primary-2'>
          <text className='text-primary-content font-semibold text-base'>
            Show Popover
          </text>
          <PopoverPositioner
            placement='bottom-end'
            placementOffset={12}
            autoAdjust='shift'
            className='w-max h-max'
          >
            <PopoverContent
              className={clsx(
                'flex flex-col items-start justify-start w-[264px] min-h-[192px] h-auto px-[36px] py-[24px] gap-[12px] rounded-[24px] bg-canvas shadow-lg',
                'ui-open:animate-popover-in ui-closed:animate-popover-out origin-top-right',
              )}
            >
              <OptionsMenu />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Controlled

Origin: oss

Source: `apps/examples/Popover/Controlled/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useState } from '@lynx-js/react'

import {
  PopoverAnchor,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

const flipDuration = 2000

function App() {
  const [internalVisibleControlled, setInternalVisibleControlled] = useState(
    true,
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setInternalVisibleControlled(pre => !pre)
    }, flipDuration)
    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot
        show={internalVisibleControlled}
        onVisibleChange={setInternalVisibleControlled}
      >
        <view className='info-panel'>
          <text className='info-panel-text'>
            Visible changed to {internalVisibleControlled ? 'true' : 'false'}
            {' '}
            in every {flipDuration}ms
          </text>

          {/* use trigger style but function as an anchor */}
          <PopoverAnchor className='popover-trigger'>
            <EllipsisIcon />
            <PopoverPositioner
              placement='bottom'
              placementOffset={12}
              autoAdjust='shift'
              className='popover-positioner'
            >
              <PopoverContent className='popover-content'>
                <OptionsMenu description='Moments persist. Actions are transient.' />
              </PopoverContent>
            </PopoverPositioner>
          </PopoverAnchor>
        </view>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### CustomArrow

Origin: oss

Source: `apps/examples/Popover/CustomArrow/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverArrow,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'
import './index.css'

function App() {
  return (
    <view className='demo-container'>
      <PopoverRoot
        onClose={() => console.info('dismissed!!!!')}
        onOpen={() => console.info('shown!!!! ')}
      >
        <PopoverTrigger className='trigger'>
          <text>Click me to show Popover</text>
          <PopoverPositioner
            placement='right'
            placementOffset={5}
            className='popover-positioner'
            transition={true}
          >
            <PopoverContent className='popover-content'>
              <text style={{ wordBreak: 'normal' }}>
                Popover Content
              </text>
              <PopoverArrow
                size={{ width: 20, height: 30 }}
                color='navajowhite'
              >
                <view
                  style={{
                    width: '20px',
                    height: '30px',
                    background:
                      'linear-gradient(180deg, red 0%, PeachPuff 100%)',
                  }}
                >
                </view>
              </PopoverArrow>
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### ExtraAnchor

Origin: oss

Source: `apps/examples/Popover/ExtraAnchor/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverAnchor,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot
        onClose={() => console.info('dismissed!')}
        onOpen={() => console.info('shown!')}
        defaultShow={true}
      >
        <PopoverTrigger className='popover-trigger'>
          <EllipsisIcon />
        </PopoverTrigger>
        <PopoverAnchor className='popover-anchor'>
          <text className='popover-anchor-text'>Anchor</text>
          <PopoverPositioner
            placement='bottom-start'
            placementOffset={12}
            autoAdjust='shift'
            className='popover-positioner'
          >
            <PopoverContent className='popover-content'>
              {
                /* In ExtraAnchor scenario, PopoverContent is not wrapped by PopoverTrigger,
               *  so tap-to-close is not supported. Use a different description accordingly.
               */
              }
              <OptionsMenu description='Only the trigger dismisses this popover. Tapping the anchor or content has no effect.' />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverAnchor>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### OffsetAdjustment

Origin: oss

Source: `apps/examples/Popover/OffsetAdjustment/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot
        onClose={() => console.info('dismissed!')}
        onOpen={() => console.info('shown!')}
        defaultShow={true}
      >
        <PopoverTrigger className='popover-trigger'>
          <EllipsisIcon />
          <PopoverPositioner
            placement='bottom'
            placementOffset={12}
            crossAxisOffset={40}
            autoAdjust='shift'
            className='popover-positioner'
          >
            <PopoverContent className='popover-content'>
              <OptionsMenu />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### WithScrollView

Origin: oss

Source: `apps/examples/Popover/WithScrollView/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
  ScrollView,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ScrollView
        scrollOrientation='vertical'
        className='scroll-view'
        style={{ zIndex: '1000' }}
      >
        <view className='scroll-view-content'>
          <PopoverRoot
            onClose={() => console.info('dismissed!')}
            onOpen={() => console.info('shown!')}
            defaultShow={true}
          >
            <PopoverTrigger className='popover-trigger'>
              <EllipsisIcon />
              <PopoverPositioner
                placement='bottom'
                placementOffset={12}
                autoAdjust='shift'
                className='popover-positioner'
                style={{ zIndex: '1000' }}
              >
                <PopoverContent className='popover-content'>
                  <OptionsMenu />
                </PopoverContent>
              </PopoverPositioner>
            </PopoverTrigger>
          </PopoverRoot>
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```
