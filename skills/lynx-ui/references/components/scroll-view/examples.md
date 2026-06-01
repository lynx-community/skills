## Examples

### Basic

Origin: oss

Source: `apps/examples/ScrollView/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { CircleLetterCard } from './CircleLetterCard'
import './index.css'

const LETTERS = ['L', 'Y', 'N', 'X', 'U', 'I', 'L', 'Y', 'N', 'X', 'J', 'S']

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ScrollView scrollOrientation='horizontal' className='scroll-view'>
        <view className='scroll-view-content'>
          {LETTERS.map((letter, i) => (
            <CircleLetterCard letter={letter} key={`circle-${i}`} />
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```

### Horizontal

Origin: oss

Source: `apps/examples/ScrollView/Horizontal/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

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

function BounceTag(props: { label: string, variant: 'upper' | 'lower' }) {
  const { label, variant } = props
  const lines = label.split(' ')

  return (
    <view className='bounce-slot'>
      <view className={`bounce-slot__text bounce-slot__text--${variant}`}>
        {lines.map((line, index) => (
          <text className='bounce-slot__line' key={`${line}-${index}`}>
            {line}
          </text>
        ))}
      </view>
    </view>
  )
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
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
            <view className='card' key={`${letter}-${index}`}>
              <view className='circle'>
                <text className='letter'>{letter}</text>
                <text className='title'>ScrollView Horizontal</text>
                <text className='subtitle'>direction: ltr + useBounce</text>
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

### HorizontalRTL

Origin: oss

Source: `apps/examples/ScrollView/HorizontalRTL/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

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

function BounceTag(props: { label: string }) {
  const { label } = props
  const lines = label.split(' ')

  return (
    <view className='bounce-slot'>
      <view className='bounce-slot__text'>
        {lines.map((line, index) => (
          <text className='bounce-slot__line' key={`${line}-${index}`}>
            {line}
          </text>
        ))}
      </view>
    </view>
  )
}

function App() {
  return (
    <view className='demo-container lunaris-dark rtl-scope'>
      <ScrollView
        scrollOrientation='horizontal'
        enableRTL={true}
        className='scroll-view'
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          upperBounceItem: <BounceTag label='Start Bounce' />,
          lowerBounceItem: <BounceTag label='End Bounce' />,
        }}
      >
        <view className='scroll-view-content'>
          {LETTERS.map((letter, index) => (
            <view className='card' key={`${letter}-${index}`}>
              <view className='circle'>
                <text className='letter'>{letter}</text>
                <text className='title'>ScrollView RTL</text>
                <text className='subtitle'>direction: rtl + useBounce</text>
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

### InnerFlex

Origin: oss

Source: `apps/examples/ScrollView/InnerFlex/index.tsx`

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

### ZIndex

Origin: oss

Source: `apps/examples/ScrollView/ZIndex/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import './index.css'

const CARDS = [
  { key: 'card-1', title: 'Base Layer', badge: 'z-index: 1' },
  { key: 'card-2', title: 'Raised Layer', badge: 'z-index: 3' },
  { key: 'card-3', title: 'Normal Layer', badge: 'z-index: 1' },
  { key: 'card-4', title: 'Content Layer', badge: 'z-index: 1' },
]

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ScrollView className='scroll-view'>
        <view className='scroll-view-content'>
          {CARDS.map((card, index) => (
            <view
              className={`layer-card ${
                index === 1 ? 'layer-card--raised' : ''
              }`}
              key={card.key}
            >
              <view
                className={`layer-card__badge ${
                  index === 1 ? 'layer-card__badge--raised' : ''
                }`}
              >
                <text className='layer-card__badge-text'>{card.badge}</text>
              </view>
              <text className='layer-card__title'>{card.title}</text>
              <text className='layer-card__subtitle'>
                Scroll the list and check the overlapping badge.
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
