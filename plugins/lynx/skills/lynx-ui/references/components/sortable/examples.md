## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    createDemoData,
  )

  return (
    <view
      className='sortable-root lunaris-dark'
      id='sortableContainer'
      // Required: establish a stacking context for sortable drag layers
      style={{ zIndex: '0' }}
    >
      <SortableRoot
        data={data}
        boundaryId='sortableContainer'
        onSortEnd={(sortedData: SortableData<SortableDemoItem>[]) =>
          setData(sortedData)}
      >
        {(item: SortableData<SortableDemoItem>) => {
          const { id, tone } = item.dataItem

          return (
            <SortableItem
              key={item.getSortingKey()}
              as='DraggableRoot'
              className={`sortable-item sortable-item--${id}`}
              sortingKey={item.getSortingKey()}
            >
              <SortableItemArea className='sortable-item-area'>
                <text className={`drag-here-text drag-here-text--${tone}`}>
                  Drag Here
                </text>
              </SortableItemArea>
            </SortableItem>
          )
        }}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
```

### DisableItems

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useMemo, useState } from '@lynx-js/react'

import './index.css'

import {
  Button,
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

// Items that are locked from sorting. These rows cannot be dragged themselves
// and they always keep their absolute positions in the result.
const LOCKED_KEYS = new Set(['0', '5', '7', '10', '11'])

function scrollShortBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#disableItemsScrollView')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(18),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const lockedKeys = useMemo(() => LOCKED_KEYS, [])

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6
      const isLocked = lockedKeys.has(item.getSortingKey())

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
          disabled={isLocked}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex} ${
              isLocked ? 'sortable-item-surface--locked' : ''
            }`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Row ${numericId + 1}`}
              </text>
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                {isLocked
                  ? 'Locked in this position'
                  : 'Drag to reorder around locked rows'}
              </text>
            </view>
            {isLocked
              ? (
                <view className='sortable-item-area sortable-item-area--locked'>
                  <text className='drag-here-text drag-here-text--locked'>
                    Locked
                  </text>
                </view>
              )
              : (
                <SortableItemArea className='sortable-item-area'>
                  <text className={`drag-here-text drag-here-text--${tone}`}>
                    Drag Here
                  </text>
                </SortableItemArea>
              )}
          </view>
        </SortableItem>
      )
    },
    [lockedKeys],
  )

  const handleScrollUpTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(-160)
  }, [])

  const handleScrollDownTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(160)
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>Locked Items</text>
        <text className='scroll-boundary-info-description'>
          Rows 1, 6, 8, 11, and 12 stay fixed while unlocked rows move around
          them.
        </text>
      </view>

      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': handleScrollUpTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': handleScrollDownTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
      </view>

      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='disableItemsSortableRoot'
        as='ScrollView'
        scrollableBoundaryId='disableItemsScrollView'
        scrollableClassName='short-scroll-view'
        scrollableContentClassName='sortable-root short-sortable-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>

      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>Sorting Behavior</text>
        <text className='scroll-boundary-info-description'>
          Drag an unlocked row across a locked row. The locked row stays in
          place while unlocked rows reorder around it.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
```

### DisableSorting

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    createDemoData,
  )

  return (
    <view
      className='sortable-root lunaris-dark'
      id='sortableContainer'
      // Required: establish a stacking context for sortable drag layers
      style={{ zIndex: '0' }}
    >
      <SortableRoot
        data={data}
        boundaryId='sortableContainer'
        onSortEnd={(sortedData: SortableData<SortableDemoItem>[]) =>
          setData(sortedData)}
        enableSorting={false}
      >
        {(item: SortableData<SortableDemoItem>) => {
          const { id, tone } = item.dataItem

          return (
            <SortableItem
              key={item.getSortingKey()}
              className={`sortable-item sortable-item--${id}`}
              sortingKey={item.getSortingKey()}
            >
              <text className={`drag-here-text drag-here-text--${tone}`}>
                {id}
              </text>
            </SortableItem>
          )
        }}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
```

### NoBoundary

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    createDemoData,
  )

  return (
    <view className='sortable-root lunaris-dark'>
      <SortableRoot
        data={data}
        onSortEnd={(sortedData: SortableData<SortableDemoItem>[]) => {
          setData(sortedData)
        }}
      >
        {(item: SortableData<SortableDemoItem>) => {
          const { id, tone } = item.dataItem
          return (
            <SortableItem
              key={item.getSortingKey()}
              className={`sortable-item sortable-item--${id}`}
              sortingKey={item.getSortingKey()}
            >
              <text className={`drag-here-text drag-here-text--${tone}`}>
                {id}
              </text>
            </SortableItem>
          )
        }}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
```

### Performance

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useEffect, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import { ITEM_COUNT, createPerformanceData } from './data'
import type { OrderItem } from './data'

let renderItemCalls = 0
let activeDragFlowId: number | undefined

function isProfiling() {
  return lynx.performance?.isProfileRecording?.() === true
}

function markMountedProfile() {
  if (!isProfiling()) return

  lynx.performance.profileMark('Sortable90::mounted', {
    args: {
      dataItems: String(ITEM_COUNT),
      renderItemCalls: String(renderItemCalls),
    },
  })
}

function startDragProfile() {
  if (!isProfiling()) return

  activeDragFlowId = lynx.performance.profileFlowId()
  const option = {
    flowId: activeDragFlowId,
    args: {
      dataItems: String(ITEM_COUNT),
      renderItemCalls: String(renderItemCalls),
    },
  }
  lynx.performance.profileStart('Sortable90::dragGesture', option)
  lynx.performance.profileMark('Sortable90::dragStart', option)
}

function endDragProfile(changedPositions: number) {
  if (!isProfiling()) return

  lynx.performance.profileMark('Sortable90::sortCommit', {
    flowId: activeDragFlowId,
    args: {
      changedPositions: String(changedPositions),
      renderItemCallsBeforeCommit: String(renderItemCalls),
    },
  })
  lynx.performance.profileEnd()
  activeDragFlowId = undefined
}

function countChangedPositions(
  previous: SortableData<OrderItem>[],
  next: SortableData<OrderItem>[],
) {
  let changedPositions = 0
  for (let index = 0; index < next.length; index++) {
    if (
      previous[index]?.getSortingKey() !== next[index]?.getSortingKey()
    ) {
      changedPositions++
    }
  }
  return changedPositions
}

interface Sortable90CardProps {
  item: OrderItem
}

function Sortable90Card({ item }: Sortable90CardProps) {
  return (
    <view className='order-card-content'>
      <view className='order-card-copy'>
        <text className='order-eyebrow'>
          {item.id} · {item.region}
        </text>
        <text className='order-title'>{item.title}</text>
        <text className='order-assignee'>◉ {item.assignee}</text>
        <view className='order-code-row'>
          <text className='order-code'>{item.trackingCode}</text>
          <text className='order-tag'>COD</text>
        </view>
      </view>
      <SortableItemArea className='drag-handle'>
        <text className='drag-handle-icon'>≡</text>
      </SortableItemArea>
    </view>
  )
}

Sortable90Card.displayName = 'Sortable90Card'

export function App() {
  const [data, setData] = useState<SortableData<OrderItem>[]>(
    createPerformanceData,
  )

  useEffect(() => {
    markMountedProfile()
  }, [])

  const handleSortStart = useCallback(() => {
    startDragProfile()
  }, [])

  const handleSortEnd = useCallback(
    (sortedData: SortableData<OrderItem>[]) => {
      const changedPositions = countChangedPositions(data, sortedData)
      endDragProfile(changedPositions)
      setData(sortedData)
    },
    [data],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<OrderItem>) => {
      renderItemCalls++
      const sortingKey = item.getSortingKey()

      return (
        <SortableItem
          key={sortingKey}
          as='DraggableRoot'
          className='order-card'
          sortingKey={sortingKey}
        >
          <Sortable90Card item={item.dataItem} />
        </SortableItem>
      )
    },
    [],
  )

  return (
    <view className='demo-container luna-light'>
      <view className='header'>
        <text className='item-count'>{ITEM_COUNT} items</text>
        <text className='instruction'>
          Drag the handle; hold near an edge to auto-scroll
        </text>
      </view>

      <view className='trace-hint'>
        <text className='trace-hint-text'>
          Trace markers: Sortable90::dragStart → Sortable90::sortCommit
        </text>
      </view>

      <SortableRoot
        as='ScrollView'
        data={data}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}
        scrollableClassName='sortable-scroll'
        scrollableContentClassName='sortable-list'
        scrollableStickyUpperOffset={24}
        scrollableStickyLowerOffset={24}
      >
        {renderSortableItem}
      </SortableRoot>
    </view>
  )
}

App.displayName = 'Sortable90PerformanceApp'

export default App

root.render(<App />)
```

### ScrollableBoundary

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import {
  Button,
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

function scrollBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#sortableScrollableBoundary')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(16),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex}`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Option ${numericId + 1}`}
              </text>
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                Drag near the edge
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag Here
              </text>
            </SortableItemArea>
          </view>
        </SortableItem>
      )
    },
    [],
  )

  return (
    <view className='demo-container lunaris-dark'>
      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollBoundaryBy(-160)
            },
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollBoundaryBy(160)
            },
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
      </view>
      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='sortableRoot'
        as='ScrollView'
        scrollableBoundaryId='sortableScrollableBoundary'
        scrollableClassName='scroll-view'
        scrollableContentClassName='sortable-root scrollable-boundary-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
```

### ShortScrollView

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import {
  Button,
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

function scrollShortBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#shortSortableScrollView')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(18),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex}`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Row ${numericId + 1}`}
              </text>
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                Drag within this short scroll area
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag Here
              </text>
            </SortableItemArea>
          </view>
        </SortableItem>
      )
    },
    [],
  )

  const handleScrollUpTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(-160)
  }, [])

  const handleScrollDownTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(160)
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>
          Above the Scroll Boundary
        </text>
        <text className='scroll-boundary-info-description'>
          This panel sits outside the sortable scroll area below.
        </text>
      </view>

      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': handleScrollUpTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': handleScrollDownTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
      </view>

      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='shortSortableRoot'
        as='ScrollView'
        scrollableBoundaryId='shortSortableScrollView'
        scrollableClassName='short-scroll-view'
        scrollableContentClassName='sortable-root short-sortable-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>

      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>
          Below the Scroll Boundary
        </text>
        <text className='scroll-boundary-info-description'>
          Dragging near this panel should not trigger sortable auto-scroll.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
```

### WithScrollView

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    createDemoData,
  )
  const [enableScroll, setEnableScroll] = useState(true)

  const handleSortStart = useCallback(() => {
    setEnableScroll(false)
  }, [])

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setEnableScroll(true)
      setData(sortedData)
    },
    [],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className={`sortable-item sortable-item--${id}`}
          sortingKey={item.getSortingKey()}
        >
          <SortableItemArea className='sortable-item-area'>
            <text className={`drag-here-text drag-here-text--${tone}`}>
              Drag Here
            </text>
          </SortableItemArea>
        </SortableItem>
      )
    },
    [],
  )

  return (
    <scroll-view
      id='sortableScrollView'
      className='scroll-view lunaris-dark luna-gradient-berry'
      enable-scroll={enableScroll}
      scroll-orientation='vertical'
    >
      <view
        className='sortable-root'
        id='sortableRoot'
        // Required: establish a stacking context for sortable drag layers
        style={{ zIndex: '0' }}
      >
        <SortableRoot
          data={data}
          onSortStart={handleSortStart}
          onSortEnd={handleSortEnd}
          boundaryId='sortableRoot'
          scrollableBoundaryId='sortableScrollView'
        >
          {renderSortableItem}
        </SortableRoot>
      </view>
    </scroll-view>
  )
}

root.render(<App />)
```
