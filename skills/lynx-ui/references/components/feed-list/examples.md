## Examples

### Basic

Origin: oss

Source: `apps/examples/FeedList/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMemo, useRef, useState } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'
import type { FeedListRef } from '@lynx-js/lynx-ui'

import { FEED_INITIAL, FEED_MORE, FEED_REFRESH } from './data'
import type { LetterItem } from './data'
import { RectangleCard } from '../shared/RectangleCard'
import { RefreshHeader } from '../shared/RefreshHeader'

import './index.css'

function App() {
  const feedListRef = useRef<FeedListRef>(null)
  const [items, setItems] = useState<LetterItem[]>(FEED_INITIAL)
  const noMoreData = useRef(false)
  const isLoadingMore = useRef(false)

  const renderRefreshHeader = useMemo(
    () => <RefreshHeader />,
    [],
  )

  const renderLoadMoreFooter = useMemo(
    () => (
      <list-item key='footer' item-key='footer' full-span>
        <view className='load-more-footer'>
          <image
            src='https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/plugin/static/loading.gif'
            className='load-more-footer__spinner'
          />
        </view>
      </list-item>
    ),
    [],
  )

  const renderNoMoreFooter = useMemo(
    () => (
      <list-item key='noMore' item-key='noMore' full-span>
        <text className='no-more-data-footer'>
          That's everything!
        </text>
      </list-item>
    ),
    [],
  )

  const handleRefresh = () => {
    setTimeout(() => {
      // Reset so load-more can fire again after refresh
      noMoreData.current = false
      isLoadingMore.current = false
      setItems(prev =>
        prev[0]?.key.startsWith('refresh-') ? FEED_INITIAL : FEED_REFRESH
      )
      feedListRef.current?.changeHasMoreStatus(true)
      feedListRef.current?.finishRefresh()
    }, 2000)
  }

  const handleLoadMore = () => {
    if (noMoreData.current || isLoadingMore.current) return
    isLoadingMore.current = true
    setTimeout(() => {
      noMoreData.current = true
      setItems(prev => [...prev, ...FEED_MORE])
      feedListRef.current?.changeHasMoreStatus(false)
      isLoadingMore.current = false
    }, 2000)
  }

  return (
    <view className='lunaris-dark demo-container'>
      <FeedList
        className='feed-list'
        listId='feedListBasic'
        ref={feedListRef}
        listType='single'
        spanCount={1}
        scrollOrientation='vertical'
        refreshOptions={{
          enableRefresh: true,
          headerContent: renderRefreshHeader,
          onStartRefresh: handleRefresh,
        }}
        loadMoreFooter={renderLoadMoreFooter}
        noMoreDataFooter={renderNoMoreFooter}
        useRefactorList={true}
        bounces={false}
        upperThresholdItemCount={1}
        lowerThresholdItemCount={1}
        onScrollToLower={handleLoadMore}
      >
        <list-item item-key='demo-header'>
          <view className='demo-header' />
        </list-item>
        {items.map((item: LetterItem) => (
          <list-item key={item.key} item-key={item.key}>
            <RectangleCard
              letter={item.letter}
              height={500}
            />
          </list-item>
        ))}
        <list-item item-key='demo-footer'>
          <view className='demo-footer' />
        </list-item>
      </FeedList>
    </view>
  )
}

root.render(<App />)
export default App
```

### Horizontal

Origin: oss

Source: `apps/examples/FeedList/Horizontal/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'

import './index.css'

const ITEMS = ['H', 'O', 'R', 'I', 'Z', 'O', 'N', 'T', 'A', 'L']

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
      <FeedList
        className='feed-list'
        style={{ width: '100%', height: '520px' }}
        listId='feedListHorizontal'
        listType='single'
        spanCount={1}
        scrollOrientation='horizontal'
        useRefactorList={true}
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
          lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
        }}
      >
        <list-item item-key='feed-start-gap'>
          <view className='edge-gap' />
        </list-item>
        {ITEMS.map((letter, index) => (
          <list-item item-key={`card-${index}`} key={`card-${index}`}>
            <view className='card-shell'>
              <view className='rectangle-card'>
                <text className='rectangle-card__letter'>{letter}</text>
                <text className='rectangle-card__title'>
                  FeedList Horizontal
                </text>
                <text className='rectangle-card__subtitle'>
                  direction: ltr + useBounce
                </text>
              </view>
            </view>
          </list-item>
        ))}
        <list-item item-key='feed-end-gap'>
          <view className='edge-gap' />
        </list-item>
      </FeedList>
    </view>
  )
}

root.render(<App />)

export default App
```

### HorizontalRTL

Origin: oss

Source: `apps/examples/FeedList/HorizontalRTL/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'

import './index.css'

const ITEMS = ['F', 'E', 'E', 'D', 'L', 'I', 'S', 'T', 'R', 'T', 'L']

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
    <view className='demo-container lunaris-dark rtl-scope'>
      <FeedList
        className='feed-list'
        style={{ width: '100%', height: '520px' }}
        listId='feedListHorizontalRTL'
        listType='single'
        spanCount={1}
        scrollOrientation='horizontal'
        enableRTL={true}
        useRefactorList={true}
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
          lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
        }}
      >
        <list-item item-key='feed-start-gap'>
          <view className='edge-gap' />
        </list-item>
        {ITEMS.map((letter, index) => (
          <list-item item-key={`card-${index}`} key={`card-${index}`}>
            <view className='card-shell'>
              <view className='rectangle-card'>
                <text className='rectangle-card__letter'>{letter}</text>
                <text className='rectangle-card__title'>FeedList RTL</text>
                <text className='rectangle-card__subtitle'>
                  direction: rtl + useBounce
                </text>
              </view>
            </view>
          </list-item>
        ))}
        <list-item item-key='feed-end-gap'>
          <view className='edge-gap' />
        </list-item>
      </FeedList>
    </view>
  )
}

root.render(<App />)

export default App
```

### Refresh

Origin: oss

Source: `apps/examples/FeedList/Refresh/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useMemo, useRef, useState } from '@lynx-js/react'

import { Button, FeedList } from '@lynx-js/lynx-ui'
import type { FeedListRef } from '@lynx-js/lynx-ui'

import { FEED_INITIAL, FEED_REFRESH } from './data'
import type { LetterItem } from './data'
import { RectangleCard } from '../shared/RectangleCard'
import { RefreshHeader } from '../shared/RefreshHeader'
import './index.css'

function App() {
  const feedListRef = useRef<FeedListRef>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshing = useRef(false)
  const showRefreshSet = useRef(false)

  const [items, setItems] = useState<LetterItem[]>(FEED_INITIAL)

  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
    }
  }, [])

  const refreshHeader = useMemo(
    () => <RefreshHeader text='Refreshing' />,
    [],
  )

  const startRefresh = () => {
    if (refreshing.current) {
      return
    }

    feedListRef.current?.startRefresh()
  }

  const handleStartRefresh = (
    _event: { triggeredBy: 'startRefresh' | 'drag' },
  ) => {
    refreshing.current = true

    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current)
    }

    refreshTimer.current = setTimeout(() => {
      showRefreshSet.current = !showRefreshSet.current
      const nextItems = showRefreshSet.current ? FEED_REFRESH : FEED_INITIAL
      setItems(nextItems)

      feedListRef.current?.finishRefresh()
      refreshing.current = false
    }, 1500)
  }

  return (
    <view className='lunaris-dark demo-container'>
      <FeedList
        className='feed-list'
        listId='feedListRefresh'
        ref={feedListRef}
        listType='single'
        spanCount={1}
        scrollOrientation='vertical'
        refreshOptions={{
          enableRefresh: true,
          headerContent: refreshHeader,
          onStartRefresh: handleStartRefresh,
        }}
        useRefactorList={true}
        bounces={false}
      >
        <list-item item-key='demo-header'>
          <view className='demo-header' />
        </list-item>
        {items.map((item: LetterItem) => (
          <list-item key={item.key} item-key={item.key}>
            <RectangleCard
              letter={item.letter}
              height={500}
            />
          </list-item>
        ))}
        <list-item item-key='demo-footer'>
          <view className='demo-footer' />
        </list-item>
      </FeedList>
      <view className='demo-actions'>
        <Button
          className='action-button'
          onClick={() => {
            startRefresh()
          }}
        >
          <text className='action-button__text'>Refresh</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)
export default App
```
