## Examples

### Basic

Origin: oss

Source: `apps/examples/Swiper/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import './styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

const INITIAL_INDEX = 2

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(1)
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_INDEX)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={INITIAL_INDEX}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex],
            spaceBetween: 16,
          }}
          autoPlay={false}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text={'Change Item Width'}
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        >
        </Button>
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text={'Change Align Type'}
          subText={`AlignType: ${alignArr[alignIndex]}`}
        >
        </Button>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### BasicDynamic

Origin: oss

Source: `apps/examples/Swiper/BasicDynamic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const DEFAULT_ITEM_ARR: number[] = [1, 2, 3, 4, 5, 6, 7, 8]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']
const INITIAL_INDEX = 0

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(1)
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_INDEX)
  const swiperRef = useRef<SwiperRef>(null)
  const [itemArr, setItemArr] = useState<number[]>([])

  useEffect(() => {
    setTimeout(() => {
      setItemArr(DEFAULT_ITEM_ARR.slice(0, 4))
    }, 1000)
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          itemHeight={250}
          duration={500}
          initialIndex={INITIAL_INDEX}
          onChange={setCurrentIndex}
          mode='normal'
          loop={true}
          autoPlay={true}
          modeConfig={{
            align: alignArr[alignIndex] ?? 'center',
            spaceBetween: 16,
          }}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
        <Button
          onClick={() => {
            setItemArr(prev => DEFAULT_ITEM_ARR.slice(0, prev.length + 1))
          }}
          text='Add List Item'
          subText={`Current Length: ${itemArr.length}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### BasicUpdateSize

Origin: oss

Source: `apps/examples/Swiper/BasicUpdateSize/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const DEFAULT_ITEM_ARR: number[] = [1, 2, 3, 4, 5, 6, 7, 8]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']
const INITIAL_INDEX = 0

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(1)
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_INDEX)
  const swiperRef = useRef<SwiperRef>(null)
  const [itemArr, setItemArr] = useState<number[]>([])

  useEffect(() => {
    setTimeout(() => {
      setItemArr(DEFAULT_ITEM_ARR.slice(0, 4))
    }, 1000)
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          containerWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          duration={500}
          initialIndex={INITIAL_INDEX}
          onChange={setCurrentIndex}
          mode='normal'
          loop={true}
          autoPlay={false}
          modeConfig={{
            align: alignArr[alignIndex] ?? 'center',
            spaceBetween: 16,
          }}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Update Container Width'
          subText={`Width: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
        <Button
          onClick={() => {
            setItemArr(prev => DEFAULT_ITEM_ARR.slice(0, prev.length + 1))
          }}
          text='Add List Item'
          subText={`Current Length: ${itemArr.length}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### Bounces

Origin: oss

Source: `apps/examples/Swiper/Bounces/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'
import './styles.css'

const itemArr: number[] = [1, 2, 3, 4]
const CONTAINER_PADDING = 32
const BOUNCE_WIDTH = 96
const ITEM_GAP = 16
const ITEM_HEIGHT = 220

const getScreenWidth = () =>
  lynx.__globalProps.screenWidth
  || SystemInfo.pixelWidth / SystemInfo.pixelRatio

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerWidth = getScreenWidth() - CONTAINER_PADDING
  const itemWidth = Math.min(300, containerWidth - 48)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area bounces-content-area'>
        <Swiper
          data={itemArr}
          itemWidth={itemWidth}
          itemHeight={ITEM_HEIGHT}
          containerWidth={containerWidth}
          loop={false}
          duration={500}
          initialIndex={2}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: ITEM_GAP,
          }}
          style={{
            overflow: 'hidden',
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItemWidth: BOUNCE_WIDTH,
            endBounceItem: (
              <view className='bounce-loading'>
                <view className='bounce-loading-dot bounce-loading-dot--first' />
                <view className='bounce-loading-dot bounce-loading-dot--second' />
                <view className='bounce-loading-dot bounce-loading-dot--third' />
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          onChange={setCurrentIndex}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### Custom

Origin: oss

Source: `apps/examples/Swiper/Custom/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Swiper,
  SwiperItem,
  interpolate,
  interpolateJS,
} from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

function customAnimation(value: number, _index: number) {
  'main thread'

  const scale = interpolate(value, [-1, 0, 1], [0.5, 1, 0.5])

  return {
    transform: `scale(${scale})`,
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const scale = interpolateJS(value, [-1, 0, 1], [0.5, 1, 0.5])

  return {
    transform: `scale(${scale})`,
  }
}

function SwiperEntry(): JSX.Element {
  const swiperRef = useRef<SwiperRef>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={250}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'center',
          }}
          onChange={setCurrentIndex}
          main-thread:customAnimation={customAnimation}
          customAnimationFirstScreen={customAnimationFirstScreen}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator current={currentIndex} count={itemArr.length} />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          Custom animation scales each slide around the active item.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### CustomScale

Origin: oss

Source: `apps/examples/Swiper/CustomScale/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Swiper,
  SwiperItem,
  interpolate,
  interpolateJS,
} from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

const ITEM_WIDTH = 250

function customAnimation(value: number, _index: number) {
  'main thread'

  const scale = interpolate(value, [-1, 0, 1], [0.8, 1, 0.8])
  // const scale = 1

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolate(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const scale = interpolateJS(value, [-1, 0, 1], [0.8, 1, 0.8])
  // const scale = 1
  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolateJS(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  console.log(
    'customAnimationFirstScreen',
    value,
    scale,
    translateX,
    centerOffset,
  )
  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function SwiperEntry(): JSX.Element {
  const swiperRef = useRef<SwiperRef>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={ITEM_WIDTH}
          itemHeight={250}
          duration={500}
          initialIndex={0}
          mode='custom'
          modeConfig={{
            align: 'center',
          }}
          onChange={setCurrentIndex}
          main-thread:customAnimation={customAnimation}
          customAnimationFirstScreen={customAnimationFirstScreen}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator current={currentIndex} count={itemArr.length} />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          Custom mode keeps the active slide centered while scaling neighbors.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### CustomTinder

Origin: oss

Source: `apps/examples/Swiper/CustomTinder/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Swiper,
  SwiperItem,
  interpolate,
  interpolateJS,
} from '@lynx-js/lynx-ui'

import { Card } from './Card'

import './styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const ITEM_WIDTH = 220
const ITEM_HEIGHT = 330

const customAnimation = (value: number) => {
  'main thread'
  const translateX = interpolate(value, [-1, 0], [-ITEM_WIDTH, 0], 'clamp')
  const translateY = interpolate(value, [0, 1], [0, -18], 'extend')
  const rotate = interpolate(value, [-1, 0], [-15, 0], 'clamp')
  const scale = interpolate(value, [0, 1], [1, 0.95], 'extend')
  const opacity = interpolate(value, [-1, -0.8, 0, 1], [0, 0.9, 1, 1], 'clamp')

  return {
    transform:
      `translate(${translateX}px, ${translateY}px) rotateZ(${rotate}deg) scale(${scale})`,
    opacity: opacity,
    'transform-origin': 'center',
  }
}

const customAnimationFirstScreen = (value: number, _index: number) => {
  const translateX = interpolateJS(value, [-1, 0], [-ITEM_WIDTH, 0], 'clamp')
  const translateY = interpolateJS(value, [0, 1], [0, -18], 'extend')
  const rotate = interpolateJS(value, [-1, 0], [-15, 0], 'clamp')
  const zIndex = interpolateJS(
    value,
    itemArr.map((_, index) => index),
    itemArr.map((_, index) => (itemArr.length - index) * 10),
    'extend',
  )

  const scale = interpolateJS(
    value,
    [0, 1, 0],
    [1, 0.95, 1],
    'extend',
  )
  const opacity = interpolateJS(
    value,
    [-1, -0.8, 0, 1],
    [0, 0.9, 1, 1],
    'clamp',
  )

  return {
    transform:
      `translate(${translateX}px, ${translateY}px) rotateZ(${rotate}deg) scale(${scale})`,
    opacity: opacity,
    'transform-origin': 'center',
    zIndex: zIndex,
  }
}

function SwiperEntry() {
  return (
    <view className='demo-container lunaris-dark'>
      <Swiper
        data={itemArr}
        itemWidth={ITEM_WIDTH}
        itemHeight={ITEM_HEIGHT}
        containerWidth={ITEM_WIDTH}
        duration={500}
        initialIndex={0}
        mode='custom'
        main-thread:customAnimation={customAnimation}
        customAnimationFirstScreen={customAnimationFirstScreen}
        style={{
          overflow: 'visible',
        }}
      >
        {({ index }) => (
          <SwiperItem>
            <view
              class='block-view'
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Card index={index} />
            </view>
          </SwiperItem>
        )}
      </Swiper>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### DifferentHeight

Origin: oss

Source: `apps/examples/Swiper/DifferentHeight/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import './styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

const itemWidths = [250, 350, 400]
const itemHeights = [200, 300, 350]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

const INITIAL_INDEX = 2

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, _setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, _setAlignIndex] = useState<number>(1)
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_INDEX)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view class='container lunaris-dark'>
      <view class='top-area' />
      <view class='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={INITIAL_INDEX}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex],
            spaceBetween: 16,
          }}
          autoPlay={false}
          style={{
            overflow: 'visible',
          }}
          trackStyle={{
            alignItems: 'end',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: `${itemHeights[index % itemHeights.length]}px`,
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view class='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### Direction

Origin: oss

Source: `apps/examples/Swiper/Direction/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4]

function renderCard({
  index,
}: {
  index: number
}) {
  return (
    <SwiperItem>
      <Card
        index={index}
        style={{
          height: '200px',
        }}
      />
    </SwiperItem>
  )
}

function SwiperEntry() {
  return (
    <scroll-view
      className='demo-scroll-container lunaris-dark'
      scroll-orientation='vertical'
    >
      <view className='top-area' />
      <view className='demo-section'>
        <text className='demo-section-title'>Horizontal Swipe Only</text>
        <text className='demo-section-description'>
          Swiper stays horizontal while the parent scroll-view moves vertically.
        </text>
      </view>
      <view className='content-area content-area--compact'>
        <Swiper
          data={itemArr}
          itemWidth={250}
          itemHeight={200}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {renderCard}
        </Swiper>
        <Swiper
          data={itemArr}
          itemWidth={250}
          itemHeight={200}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {renderCard}
        </Swiper>
      </view>
    </scroll-view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### EmptyDataBug

Origin: oss

Source: `apps/examples/Swiper/EmptyDataBug/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * This example reproduces the "calcBounceOffset: invalid offset" error.
 *
 * The bug occurs when:
 * 1. Swiper is initialized with empty data (data=[])
 * 2. autoPlay is enabled
 * 3. Data is updated later
 *
 * Root cause: getCurrentIndex() returns NaN when dataCount is 0
 * because (x % 0) = NaN in JavaScript
 */

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'

import '../Common/Demo/styles.css'
import './styles.css'

const DEFAULT_DATA: number[] = [1, 2, 3, 4, 5]

// Container padding (16px) + Section padding (16px) = 32px on each side = 64px total
const CONTAINER_PADDING = 64
const getContainerWidth = () => {
  const screenWidth = lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio
  return screenWidth - CONTAINER_PADDING
}

/**
 * Scenario 1: Empty data with autoPlay enabled
 * REPRODUCES: Swipe the empty swiper before data loads (within 1 second)
 * Result: Swiper shows wrong position (index -1, -2 loop placeholders instead of starting at 0)
 */
function EmptyDataWithAutoPlay(): JSX.Element {
  const [data, setData] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [onChangeLog, setOnChangeLog] = useState<string[]>([])
  const swiperRef = useRef<SwiperRef>(null)

  const handleChange = (index: number) => {
    console.log('[Scenario 1] onChange:', index, 'isNaN:', isNaN(index))
    setCurrentIndex(index)
    setOnChangeLog(
      prev => [
        ...prev.slice(-4),
        `onChange(${index}) ${isNaN(index) ? '⚠️ NaN!' : ''}`,
      ],
    )
  }

  const handleSwipeStop = (index: number) => {
    console.log('[Scenario 1] onSwipeStop:', index, 'isNaN:', isNaN(index))
    setOnChangeLog(
      prev => [
        ...prev.slice(-4),
        `onSwipeStop(${index}) ${isNaN(index) ? '⚠️ NaN!' : ''}`,
      ],
    )
  }

  useEffect(() => {
    // Simulate async data loading
    // User should SWIPE before this timer fires to reproduce the bug
    setTimeout(() => {
      console.log('[Scenario 1] Loading data after 1 second...')
      setData(DEFAULT_DATA)
    }, 1000)
  }, [])

  return (
    <view class='section'>
      <text class='title'>
        Scenario 1: Empty Data + Swipe Before Load (REPRODUCES)
      </text>
      <text class='description'>
        ⚠️ To reproduce: SWIPE the empty area within 1 second (before data
        loads). Result: Swiper shows wrong position (loop placeholders -1, -2
        visible instead of index 0)
      </text>
      <Swiper
        ref={swiperRef}
        data={data}
        containerWidth={getContainerWidth()}
        itemWidth={300}
        itemHeight={200}
        duration={500}
        initialIndex={0}
        onChange={handleChange}
        onSwipeStop={handleSwipeStop}
        mode='normal'
        loop={true}
        autoPlay={true}
        autoPlayInterval={2000}
        modeConfig={{ align: 'center' }}
      >
        {({ index }) => (
          <SwiperItem>
            <Card index={index} style={{ height: '200px' }} />
          </SwiperItem>
        )}
      </Swiper>
      <view class='info'>
        <text>
          Current Index: {currentIndex} {isNaN(currentIndex) ? '⚠️ NaN!' : ''}
        </text>
        <text>Data Length: {data.length}</text>
        <text class='log-title'>Callback Log:</text>
        {onChangeLog.map((log, i) => <text key={i} class='log-item'>{log}
        </text>)}
      </view>
    </view>
  )
}

/**
 * Scenario 2: Empty data with swipe gesture
 * REPRODUCES: SWIPE the empty area, then click "Load Data"
 * Note: Just clicking SwipeNext button doesn't reproduce - must use swipe gesture
 * Observe: Visual shows wrong position, but callbacks report correct values
 */
function EmptyDataWithManualSwipe(): JSX.Element {
  const [data, setData] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [onChangeLog, setOnChangeLog] = useState<string[]>([])
  const [swipeStartCount, setSwipeStartCount] = useState<number>(0)
  const [swipeStopCount, setSwipeStopCount] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  const handleChange = (index: number) => {
    console.log('[Scenario 2] onChange:', index, 'isNaN:', isNaN(index))
    setCurrentIndex(index)
    setOnChangeLog(
      prev => [
        ...prev.slice(-4),
        `onChange(${index}) ${isNaN(index) ? '⚠️ NaN!' : ''}`,
      ],
    )
  }

  const handleSwipeStart = () => {
    console.log('[Scenario 2] onSwipeStart')
    setSwipeStartCount(prev => prev + 1)
  }

  const handleSwipeStop = (index: number) => {
    console.log('[Scenario 2] onSwipeStop:', index, 'isNaN:', isNaN(index))
    setSwipeStopCount(prev => prev + 1)
    setOnChangeLog(
      prev => [
        ...prev.slice(-4),
        `onSwipeStop(${index}) ${isNaN(index) ? '⚠️ NaN!' : ''}`,
      ],
    )
  }

  return (
    <view class='section'>
      <text class='title'>
        Scenario 2: Empty Data + Swipe Gesture (REPRODUCES)
      </text>
      <text class='description'>
        ⚠️ Steps to reproduce: 1) SWIPE the empty area (not just button click)
        2) Click "Load Data". Note: Callbacks report correct values, but visual
        is wrong.
      </text>
      <Swiper
        ref={swiperRef}
        data={data}
        containerWidth={getContainerWidth()}
        itemWidth={300}
        itemHeight={200}
        duration={500}
        mode='normal'
        loop={true}
        autoPlay={false}
        modeConfig={{ align: 'center' }}
        onChange={handleChange}
        onSwipeStart={handleSwipeStart}
        onSwipeStop={handleSwipeStop}
      >
        {({ index }) => (
          <SwiperItem>
            <Card index={index} style={{ height: '200px' }} />
          </SwiperItem>
        )}
      </Swiper>
      <view class='buttons'>
        <Button
          onClick={() => {
            console.log('[Scenario 2] Calling swipeNext() on empty swiper')
            swiperRef.current?.swipeNext()
          }}
          text='1. SwipeNext (empty)'
        />
        <Button
          onClick={() => {
            console.log('[Scenario 2] Loading data...')
            setData(DEFAULT_DATA)
          }}
          text='2. Load Data'
          type='primary'
        />
        <Button
          onClick={() => {
            setData([])
            setOnChangeLog([])
            setSwipeStartCount(0)
            setSwipeStopCount(0)
          }}
          text='Reset'
        />
      </view>
      <view class='info'>
        <text>
          Current Index: {currentIndex} {isNaN(currentIndex) ? '⚠️ NaN!' : ''}
        </text>
        <text>Data Length: {data.length}</text>
        <text>SwipeStart Count: {swipeStartCount}</text>
        <text>SwipeStop Count: {swipeStopCount}</text>
        <text class='log-title'>Callback Log:</text>
        {onChangeLog.map((log, i) => <text key={i} class='log-item'>{log}
        </text>)}
      </view>
    </view>
  )
}

/**
 * Scenario 3: Data becomes empty during use
 */
function DataBecomesEmpty(): JSX.Element {
  const [data, setData] = useState<number[]>(DEFAULT_DATA)
  const [_currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view class='section'>
      <text class='title'>
        Scenario 3: Data Becomes Empty During Use (Does NOT reproduce)
      </text>
      <text class='description'>
        Starts with data, then data becomes empty, then data returns.
      </text>
      <Swiper
        ref={swiperRef}
        data={data}
        containerWidth={getContainerWidth()}
        itemWidth={300}
        itemHeight={200}
        duration={500}
        onChange={setCurrentIndex}
        mode='normal'
        loop={true}
        autoPlay={true}
        autoPlayInterval={3000}
        modeConfig={{ align: 'center' }}
      >
        {({ index }) => (
          <SwiperItem>
            <Card index={index} style={{ height: '200px' }} />
          </SwiperItem>
        )}
      </Swiper>
      <view class='buttons'>
        <Button
          onClick={() => {
            console.log('Clearing data...')
            setData([])
            // After a short delay, restore data - this can trigger the bug
            setTimeout(() => {
              console.log('Restoring data...')
              setData(DEFAULT_DATA)
            }, 500)
          }}
          text='Clear then Restore'
          type='primary'
        />
      </view>
      <view class='info'>
        <text>Data Length: {data.length}</text>
      </view>
    </view>
  )
}

/**
 * Scenario 4: Reset with corrupted prevIndexRef
 */
function ResetWithCorruptedIndex(): JSX.Element {
  const [data, setData] = useState<number[]>([])
  const [swiperKey, setSwiperKey] = useState<string>('key-1')
  const swiperRef = useRef<SwiperRef>(null)

  useEffect(() => {
    // First, let swiper initialize with empty data
    // Then load data
    setTimeout(() => {
      setData(DEFAULT_DATA)
    }, 500)
  }, [])

  return (
    <view class='section'>
      <text class='title'>
        Scenario 4: Reset After Empty Init (Does NOT reproduce)
      </text>
      <text class='description'>
        Swiper resets (via swiperKey change) after being initialized empty. The
        prevIndexRef may contain NaN from the empty state.
      </text>
      <Swiper
        ref={swiperRef}
        swiperKey={swiperKey}
        data={data}
        containerWidth={getContainerWidth()}
        itemWidth={300}
        itemHeight={200}
        duration={500}
        mode='normal'
        loop={true}
        autoPlay={false}
        modeConfig={{ align: 'center' }}
      >
        {({ index }) => (
          <SwiperItem>
            <Card index={index} style={{ height: '200px' }} />
          </SwiperItem>
        )}
      </Swiper>
      <view class='buttons'>
        <Button
          onClick={() => {
            // Change swiperKey to trigger reset
            // This may use the corrupted prevIndexRef
            setSwiperKey(`key-${Date.now()}`)
          }}
          text='Reset Swiper'
          type='primary'
        />
      </view>
    </view>
  )
}

function EmptyDataBugExample(): JSX.Element {
  return (
    <scroll-view class='container lunaris-dark' scroll-orientation='vertical'>
      <text class='main-title'>Empty Data Bug Reproduction</text>
      <text class='main-description'>
        These examples demonstrate the "calcBounceOffset: invalid offset" error
        that occurs when Swiper is initialized with empty data.
      </text>
      <EmptyDataWithAutoPlay />
      <EmptyDataWithManualSwipe />
      <DataBecomesEmpty />
      <ResetWithCorruptedIndex />
    </scroll-view>
  )
}

root.render(<EmptyDataBugExample />)

export default EmptyDataBugExample
```

### Indicator

Origin: oss

Source: `apps/examples/Swiper/Indicator/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4]

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          data={itemArr}
          itemWidth={300}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'center',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 100,
            startBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>Start</text>
              </view>
            ),
          }}
          onChange={setCurrentIndex}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### Lazy

Origin: oss

Source: `apps/examples/Swiper/Lazy/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { LazyComponent, Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7]

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          data={itemArr}
          itemWidth={250}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>Show More</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          onChange={setCurrentIndex}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <LazyComponent
                scene='scene'
                pid={`pid_${index}`}
                estimatedStyle={{ width: '100%', height: '100%' }}
              >
                <Card
                  index={index}
                  style={{
                    height: '250px',
                  }}
                />
              </LazyComponent>
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          Each slide body is mounted through LazyComponent.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### Loop

Origin: oss

Source: `apps/examples/Swiper/Loop/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4]

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const SwiperItemGap = 8
  const screenWidth = lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio
  const containWidth = (screenWidth || 375) - SwiperItemGap * 2
  const itemWidth = ((screenWidth || 375) / 375) * 315

  console.log(
    'screenWidth, itemWidth, containWidth',
    screenWidth,
    itemWidth,
    containWidth,
  )
  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          data={itemArr}
          itemWidth={itemWidth + SwiperItemGap}
          itemHeight={250}
          containerWidth={containWidth}
          loop={true}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            spaceBetween: SwiperItemGap,
          }}
          autoPlay={true}
          onChange={setCurrentIndex}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          Loop mode keeps autoplay continuous across the boundary.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### RTL

Origin: oss

Source: `apps/examples/Swiper/RTL/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex] ?? 'start',
            spaceBetween: 16,
          }}
          RTL={true}
          style={{
            overflow: 'visible',
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 100,
            endBounceItemWidth: 100,
            startBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>Start</text>
              </view>
            ),
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### RTLCustom

Origin: oss

Source: `apps/examples/Swiper/RTLCustom/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Swiper,
  SwiperItem,
  interpolate,
  interpolateJS,
} from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

const ITEM_WIDTH = 250

function customAnimation(value: number, _index: number) {
  'main thread'

  const RTL = true
  const sign = RTL ? -1 : 1

  const scale = interpolate(value, [-1, 0, 1], [0.8, 1, 0.8])

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolate(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  return {
    transform: `translateX(${sign * translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const RTL = true
  const sign = RTL ? -1 : 1

  const scale = interpolateJS(value, [-1, 0, 1], [0.8, 1, 0.8])

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolateJS(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  return {
    transform: `translateX(${sign * translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function SwiperEntry(): JSX.Element {
  const swiperRef = useRef<SwiperRef>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={ITEM_WIDTH}
          itemHeight={250}
          duration={500}
          initialIndex={0}
          mode='custom'
          modeConfig={{
            align: 'center',
          }}
          RTL={true}
          onChange={setCurrentIndex}
          main-thread:customAnimation={customAnimation}
          customAnimationFirstScreen={customAnimationFirstScreen}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator current={currentIndex} count={itemArr.length} />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          RTL custom mode mirrors the same centered scale animation.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### RTLLoop

Origin: oss

Source: `apps/examples/Swiper/RTLLoop/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex] ?? 'start',
            spaceBetween: 16,
          }}
          RTL={true}
          loop={true}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### RTLLoopLynxRTL

Origin: oss

Source: `apps/examples/Swiper/RTLLoopLynxRTL/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex] ?? 'start',
            spaceBetween: 16,
          }}
          RTL={'lynx-rtl'}
          loop={true}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```

### WithGap

Origin: oss

Source: `apps/examples/Swiper/WithGap/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7, 8]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          onChange={setCurrentIndex}
          mode='normal'
          loop={false}
          autoPlay={true}
          modeConfig={{
            align: alignArr[alignIndex] ?? 'start',
            spaceBetween: 16,
          }}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
```
