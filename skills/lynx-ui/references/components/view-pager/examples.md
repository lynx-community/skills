## Examples

### AutoHeight

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { stories } from './data'
import { PageIndicators } from './PageIndicators'
import { StoryCard } from './StoryCard'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <ViewPager
        ref={pagerRef}
        data={stories}
        getItemKey={story => story.id}
        onPageChange={event => setPageIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {story => <StoryCard story={story} />}
      </ViewPager>
      <PageIndicators
        stories={stories}
        activeIndex={pageIndex}
        onSelect={index => pagerRef.current?.scrollToPage(index)}
      />
    </view>
  )
}

root.render(<App />)

export default App
```

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import { pages } from './data'
import './index.css'

export function App() {
  const [index, setIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <ViewPager
        data={pages}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {(page, index) => (
          <view
            className={index === pages.length - 1 ? 'page last-item' : 'page'}
          >
            <text className='title'>{page.title}</text>
          </view>
        )}
      </ViewPager>
      <text className='status'>
        Page {index + 1} of {pages.length}
      </text>
    </view>
  )
}

root.render(<App />)
```

### DynamicHeight

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerOffsetChangeEvent } from '@lynx-js/lynx-ui'

import { pages } from './data'
import { HeightCard } from './HeightCard'
import './index.css'

function handleOffsetChangeMT(event: ViewPagerOffsetChangeEvent) {
  'main thread'

  const offset = event.detail.offset
  const index = Math.floor(offset)
  if (index < 0 || index >= pages.length - 1) return

  const progress = offset - index
  const height = pages[index].height
    + progress * (pages[index + 1].height - pages[index].height)

  lynx
    .querySelector('#dynamic-height-pager')
    ?.setStyleProperty('height', `${height}px`)
}

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-afterglow'>
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        className='view-pager'
        itemClassName='view-pager-item'
        id='dynamic-height-pager'
        style={{ height: `${pages[0].height}px` }}
        main-thread:onOffsetChange={handleOffsetChangeMT}
      >
        {(page, index) => <HeightCard page={page} index={index} />}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
```

### Gallery

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { destinations } from './data'
import { DestinationCard } from './DestinationCard'
import { PageIndicators } from './PageIndicators'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [index, setIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <ViewPager
        ref={pagerRef}
        data={destinations}
        getItemKey={destination => destination.id}
        lazyOptions={{
          enableLazy: true,
          scene: 'view-pager-gallery',
          exposureLeft: '80px',
          exposureRight: '80px',
        }}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {destination => <DestinationCard destination={destination} />}
      </ViewPager>
      <PageIndicators destinations={destinations} activeIndex={index} />
      <view className='controls'>
        <Button
          className='control'
          disabled={index === 0}
          onClick={() => pagerRef.current?.scrollToPage(index - 1)}
        >
          <text className='control-label'>Previous</text>
        </Button>
        <Button
          className='control'
          disabled={index === destinations.length - 1}
          onClick={() => pagerRef.current?.scrollToPage(index + 1)}
        >
          <text className='control-label'>Next</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### NestedList

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { List, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from './data'
import { ListRow } from './ListRow'
import { SectionTabs } from './SectionTabs'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='header'>
        <text className='instruction'>
          Swipe horizontally between pages and vertically within each list.
        </text>
        <SectionTabs
          sections={sections}
          activeIndex={pageIndex}
          onSelect={index => pagerRef.current?.scrollToPage(index)}
        />
      </view>
      <ViewPager
        ref={pagerRef}
        data={sections}
        getItemKey={section => section.id}
        onPageChange={event => setPageIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
        bounces={false}
      >
        {section => (
          <List
            className='list'
            listId={`view-pager-${section.id}-list`}
            listType='single'
            spanCount={1}
            scrollOrientation='vertical'
            useRefactorList={true}
            bounces={true}
          >
            {section.items.map(item => <ListRow key={item.id} item={item} />)}
          </List>
        )}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
```

### Showcase

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerOffsetChangeEvent } from '@lynx-js/lynx-ui'

import { pages } from './data'
import { ShowcaseCard } from './ShowcaseCard'
import './index.css'

function handleOffsetChangeMT(event: ViewPagerOffsetChangeEvent) {
  'main thread'

  const offset = event.detail.offset
  const index = Math.floor(offset)
  if (index < 0 || index >= pages.length - 1) return

  const progress = offset - index
  const height = pages[index].pagerHeight
    + progress
      * (pages[index + 1].pagerHeight - pages[index].pagerHeight)

  lynx
    .querySelector('#showcase-pager')
    ?.setStyleProperty('height', `${height}px`)
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        initialSelectIndex={0}
        className='view-pager'
        itemClassName='view-pager-item'
        id='showcase-pager'
        style={{ height: `${pages[0].pagerHeight}px` }}
        main-thread:onOffsetChange={handleOffsetChangeMT}
      >
        {page => <ShowcaseCard page={page} />}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
```
