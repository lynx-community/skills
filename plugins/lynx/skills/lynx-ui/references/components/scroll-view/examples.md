## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { CircleCard } from '../shared/CircleCard'
import './index.css'

const LETTERS = ['L', 'Y', 'N', 'X', 'U', 'I', 'L', 'Y', 'N', 'X', 'J', 'S']

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ScrollView scrollOrientation='horizontal' className='scroll-view'>
        <view className='scroll-view-content'>
          {LETTERS.map((letter, i) => (
            <CircleCard
              letter={letter}
              title='ScrollView'
              subtitle='@lynx-js/lynx-ui'
              key={`circle-${i}`}
            />
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```

### Bounces

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { BounceTag } from '../shared/BounceTag'
import { CircleCard } from '../shared/CircleCard'
import './index.css'

const LETTERS = [
  'L',
  'Y',
  'N',
  'X',
  'L',
  'T',
  'R',
  'B',
  'O',
  'U',
  'N',
  'C',
  'E',
]

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='demo-scroll-region'>
        <ScrollView
          scrollOrientation='horizontal'
          className='scroll-view'
          bounceableOptions={{
            enableBounces: true,
            alwaysBouncing: true,
            upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
            lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
          }}
        >
          <view className='scroll-view-content'>
            {LETTERS.map((letter, index) => (
              <CircleCard
                letter={letter}
                title='ScrollView Bounces'
                subtitle='@lynx-js/lynx-ui'
                key={`${letter}-${index}`}
              />
            ))}
          </view>
        </ScrollView>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### BouncesRTL

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { BounceTag } from '../shared/BounceTag'
import { CircleCard } from '../shared/CircleCard'
import './index.css'

const LETTERS = [
  'L',
  'Y',
  'N',
  'X',
  'R',
  'T',
  'L',
  'B',
  'O',
  'U',
  'N',
  'C',
  'E',
]

function App() {
  return (
    <view className='demo-container lunaris-dark rtl-scope'>
      <view className='demo-scroll-region'>
        <ScrollView
          scrollOrientation='horizontal'
          enableRTL={true}
          className='scroll-view'
          bounceableOptions={{
            enableBounces: true,
            alwaysBouncing: true,
            upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
            lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
          }}
        >
          <view className='scroll-view-content'>
            {LETTERS.map((letter, index) => (
              <CircleCard
                letter={letter}
                title='Bounces RTL'
                subtitle='@lynx-js/lynx-ui'
                subtitleDirection='ltr'
                key={`${letter}-${index}`}
              />
            ))}
          </view>
        </ScrollView>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### InnerFlex

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { FlexItemCard } from './FlexItemCard'

import './index.css'

const LETTERS = 'L Y N X U I R E A C T L Y N X'.split(' ')

// This example demonstrates how flex-grow consumes remaining space
// inside a scrollable content container.

function App() {
  return (
    <view className='container lunaris-dark'>
      <ScrollView scrollOrientation='horizontal' className='scroll-view'>
        <view className='scroll-view-content'>
          <FlexItemCard variant='auto' />
          {LETTERS.map((letter, i) => (
            <FlexItemCard
              key={`${letter}-${i}`}
              letter={letter}
              variant='fixed'
            />
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```

### NativeUseBounces

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'
import type { ScrollEvent } from '@lynx-js/types'

import './index.css'

const VIEWPORT_HEIGHT = 420
const TRIGGER_DISTANCE = 48
const ITEMS = Array.from({ length: 12 }, (_, index) => index + 1)

interface Metrics {
  bounceCount: number
  lastBounce: 'none' | 'upper' | 'lower'
  maxLowerDistance: number
  maxUpperDistance: number
  minScrollTop: number
  scrollHeight: number
  scrollTop: number
}

function BounceItem(props: {
  direction: 'upper' | 'lower'
  label: string
}) {
  const { direction, label } = props
  return (
    <view className={`bounce-item bounce-item--${direction}`}>
      <text className='bounce-item__label'>{label}</text>
      <text className='bounce-item__hint'>Threshold: 48px</text>
    </view>
  )
}

function formatMetric(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '--'
}

function App() {
  const [metrics, setMetrics] = useState<Metrics>({
    bounceCount: 0,
    lastBounce: 'none',
    maxLowerDistance: 0,
    maxUpperDistance: 0,
    minScrollTop: 0,
    scrollHeight: 0,
    scrollTop: 0,
  })

  const handleScroll = (event: ScrollEvent) => {
    const { scrollHeight, scrollTop } = event.detail
    const upperDistance = Math.max(0, -scrollTop)
    const lowerDistance = Math.max(0, scrollTop - scrollHeight)

    setMetrics(previous => ({
      ...previous,
      maxLowerDistance: Math.max(
        previous.maxLowerDistance,
        lowerDistance,
      ),
      maxUpperDistance: Math.max(
        previous.maxUpperDistance,
        upperDistance,
      ),
      minScrollTop: Math.min(previous.minScrollTop, scrollTop),
      scrollHeight,
      scrollTop,
    }))
  }

  return (
    <view className='demo-container lunaris-dark'>
      <view className='header'>
        <text className='title'>Native useBounces</text>
        <text className='description'>
          Pull beyond both edges and watch bindscroll metrics.
        </text>
        <view className='metrics'>
          <text className='metric'>
            {`scrollTop: ${formatMetric(metrics.scrollTop)}`}
          </text>
          <text className='metric'>
            {`min scrollTop: ${formatMetric(metrics.minScrollTop)}`}
          </text>
          <text className='metric'>
            {`max upper: ${formatMetric(metrics.maxUpperDistance)}`}
          </text>
          <text className='metric'>
            {`max lower: ${formatMetric(metrics.maxLowerDistance)}`}
          </text>
          <text className='metric'>
            {`scrollHeight: ${formatMetric(metrics.scrollHeight)}`}
          </text>
          <text className='metric metric--event'>
            {`bounce event: ${metrics.lastBounce} (${metrics.bounceCount})`}
          </text>
        </view>
      </view>

      <ScrollView
        enableNewArch={true}
        scrollOrientation='vertical'
        className='scroll-view'
        style={{
          width: '100%',
          height: `${VIEWPORT_HEIGHT}px`,
          borderRadius: '20px',
        }}
        onScroll={handleScroll}
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          singleSidedBounce: 'both',
          startBounceTriggerDistance: TRIGGER_DISTANCE,
          endBounceTriggerDistance: TRIGGER_DISTANCE,
          upperBounceItem: (
            <BounceItem direction='upper' label='Native upper bounce' />
          ),
          lowerBounceItem: (
            <BounceItem direction='lower' label='Native lower bounce' />
          ),
          onScrollToBounces: ({ direction }) => {
            setMetrics(previous => ({
              ...previous,
              bounceCount: previous.bounceCount + 1,
              lastBounce: direction,
            }))
          },
        }}
      >
        <view className='scroll-content'>
          {ITEMS.map(item => (
            <view className='card' key={`native-bounce-card-${item}`}>
              <text className='card__index'>{`${item}`}</text>
              <view className='card__copy'>
                <text className='card__title'>Native ScrollView</text>
                <text className='card__subtitle'>
                  scroll-view-new-arch=true
                </text>
              </view>
            </view>
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```

### ScrollBy

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'

import './index.css'

const ITEMS = Array.from({ length: 24 }, (_, index) => index + 1)

function scrollByOffset(offset: number) {
  'main thread'
  lynx.querySelector('#scrollByDemoView')?.invoke('scrollBy', {
    offset,
  })
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='toolbar'>
        <Button
          className='button'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollByOffset(-160)
            },
          }}
        >
          <text className='button-text'>Scroll Up</text>
        </Button>
        <Button
          className='button button--primary'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollByOffset(160)
            },
          }}
        >
          <text className='button-text'>Scroll Down</text>
        </Button>
      </view>

      <scroll-view
        id='scrollByDemoView'
        className='scroll-view'
        scroll-orientation='vertical'
        enable-scroll={false}
      >
        <view className='scroll-view-content'>
          {ITEMS.map(item => (
            <view className='card' key={`scroll-by-card-${item}`}>
              <text className='card-title'>{`Item ${item}`}</text>
              <text className='card-subtitle'>scrollBy target content</text>
            </view>
          ))}
        </view>
      </scroll-view>
    </view>
  )
}

root.render(<App />)

export default App
```

### ZIndex

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { CARDS } from './data'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <ScrollView className='scroll-view'>
        <view className='scroll-view-content'>
          {CARDS.map((card) => (
            <view
              className={clsx(
                'layer-card',
                card.surfaceClassName,
                card.raised && 'layer-card--raised',
              )}
              key={card.key}
            >
              <view
                className={clsx(
                  'layer-card__badge',
                  card.raised && 'layer-card__badge--raised',
                )}
              >
                <text className='layer-card__badge-text'>{card.badge}</text>
              </view>
              <text className='layer-card__title'>{card.title}</text>
              <text className='layer-card__subtitle'>
                {card.subtitle}
              </text>
            </view>
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```
