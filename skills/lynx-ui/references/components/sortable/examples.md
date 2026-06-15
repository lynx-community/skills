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

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
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
              <text className='sortable-item-subtitle'>
                {isLocked
                  ? 'Locked · cannot be dragged or displaced'
                  : 'Drag handle on the right to reorder'}
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
                    Drag
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
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='outside-panel outside-panel--top'>
        <text className='outside-panel-title'>Locked rows demo</text>
        <text className='outside-panel-copy'>
          Rows 1, 6, 8 and 12 are locked. They never move and are never
          displaced, but other rows can freely cross over them while sorting.
        </text>
      </view>

      <view className='scroll-by-actions'>
        <view
          className='scroll-by-button'
          main-thread:bindtap={handleScrollUpTap}
        >
          <text className='scroll-by-button-text'>Scroll Up</text>
        </view>
        <view
          className='scroll-by-button scroll-by-button--primary'
          main-thread:bindtap={handleScrollDownTap}
        >
          <text className='scroll-by-button-text'>Scroll Down</text>
        </view>
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

      <view className='outside-panel outside-panel--bottom'>
        <text className='outside-panel-title'>Behavior</text>
        <text className='outside-panel-copy'>
          Locked rows always keep their absolute positions. Other rows are
          reordered around them, sliding past at a higher speed so the gap stays
          in sync with the dragged item.
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

### ScrollableBoundary

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
              <text className='sortable-item-subtitle'>
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
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='scroll-by-actions'>
        <view
          className='scroll-by-button'
          main-thread:bindtap={() => {
            'main thread'
            scrollBoundaryBy(-160)
          }}
        >
          <text className='scroll-by-button-text'>Scroll Up</text>
        </view>
        <view
          className='scroll-by-button scroll-by-button--primary'
          main-thread:bindtap={() => {
            'main thread'
            scrollBoundaryBy(160)
          }}
        >
          <text className='scroll-by-button-text'>Scroll Down</text>
        </view>
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

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
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
              <text className='sortable-item-subtitle'>
                Middle scroll-view boundary
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag
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
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='outside-panel outside-panel--top'>
        <text className='outside-panel-title'>Content Above</text>
        <text className='outside-panel-copy'>
          The sortable scroll-view below is intentionally shorter than the
          screen.
        </text>
      </view>

      <view className='scroll-by-actions'>
        <view
          className='scroll-by-button'
          main-thread:bindtap={handleScrollUpTap}
        >
          <text className='scroll-by-button-text'>Scroll Up</text>
        </view>
        <view
          className='scroll-by-button scroll-by-button--primary'
          main-thread:bindtap={handleScrollDownTap}
        >
          <text className='scroll-by-button-text'>Scroll Down</text>
        </view>
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

      <view className='outside-panel outside-panel--bottom'>
        <text className='outside-panel-title'>Content Below</text>
        <text className='outside-panel-copy'>
          Dragging near the panel edge should not react to this outside area.
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
