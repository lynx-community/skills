## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Basic tab selection</text>
      <TabsRoot
        onClickItem={index => console.info('tabs click', index)}
        onTabChanged={index => {
          setSelectedIndex(index)
          console.info('tabs changed', index)
        }}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
```

### ImperativeSelection

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
} from '@lynx-js/lynx-ui'
import type { TabsRootRef } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const tabsRootRef = useRef<TabsRootRef>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Imperative selection</text>
      <TabsRoot
        ref={tabsRootRef}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
      <Button
        className='button'
        onClick={() => tabsRootRef.current?.selectTab(1, true)}
      >
        <text className='button-label'>Select Waxing Crescent smoothly</text>
      </Button>
      <Button
        className='button'
        onClick={() => tabsRootRef.current?.selectTab(4, false)}
      >
        <text className='button-label'>Select Full Moon instantly</text>
      </Button>
    </view>
  )
}

root.render(<App />)
```

### IndicatorMotion

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

const springAnimation = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 1,
} as const

type IndicatorMode = 'spring' | 'instant'

function TabStrip(
  { caption, mode, initialSelectIndex }: {
    caption: string
    mode: IndicatorMode
    initialSelectIndex: number
  },
) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectIndex)

  return (
    <view className='example-section'>
      <text className='caption'>{caption}</text>
      <TabsRoot
        initialSelectIndex={initialSelectIndex}
        selectBehavior={mode === 'instant' ? 'instant' : 'smooth'}
        indicatorAnimation={mode === 'spring' ? springAnimation : undefined}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

export function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <TabStrip
        caption='Custom spring animation'
        mode='spring'
        initialSelectIndex={1}
      />
      <TabStrip
        caption='Instant movement'
        mode='instant'
        initialSelectIndex={0}
      />
    </view>
  )
}

root.render(<App />)
```

### InitialSelection

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(2)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Initial selection: First Quarter</text>
      <TabsRoot
        initialSelectIndex={2}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
```

### Panel

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsPanel,
  TabsRoot,
} from '@lynx-js/lynx-ui'

import { pages, tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <TabsRoot
        initialSelectIndex={0}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          tabsItemWrapperClass='tab-row'
          renderTabItem={item => {
            const selected = item.id === pages[selectedIndex]?.id

            return (
              <TabsItem className='tab-item'>
                <text
                  className={selected
                    ? 'tab-label selected'
                    : 'tab-label'}
                >
                  {item.label}
                </text>
              </TabsItem>
            )
          }}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
        <view className='panel'>
          <TabsPanel
            data={pages}
            getItemKey={page => page.id}
            className='view-pager'
            itemClassName='view-pager-item'
            style={{ width: '100%', height: '100%' }}
          >
            {page => (
              <view className={page.className}>
                <view className='page-copy'>
                  <text className='page-title'>TabGroup</text>
                  <text className='page-package'>@lynx-js/lynx-ui</text>
                </view>
              </view>
            )}
          </TabsPanel>
        </view>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
```

### Sizing

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

type TabSizing = 'equal' | 'content'

function TabStrip(
  { caption, sizing }: { caption: string, sizing: TabSizing },
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='example-section'>
      <text className='caption'>{caption}</text>
      <TabsRoot onTabChanged={setSelectedIndex}>
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem
              className={sizing === 'equal'
                ? 'tab-item tab-item-equal'
                : 'tab-item'}
            >
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

export function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <TabStrip caption='Equal width' sizing='equal' />
      <TabStrip caption='Content width' sizing='content' />
    </view>
  )
}

root.render(<App />)
```
