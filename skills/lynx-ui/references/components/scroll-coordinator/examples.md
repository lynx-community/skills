## Examples

### List

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { ScrollCoordinator } from '@lynx-js/lynx-ui'
import type { ScrollCoordinatorRef } from '@lynx-js/lynx-ui'

import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [offset, setOffset] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Collapsible collection'
      controls={
        <CoordinatorControls
          enabled={enabled}
          onExpand={() => coordinator.current?.scrollToTop(true)}
          onCollapse={() => coordinator.current?.scrollToSticky(true)}
          onShowDetails={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
          onToggleEnabled={() => setEnabled(value => !value)}
        />
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onOffsetChange={event => setOffset(Math.round(event.offset))}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        toolbar={
          <Toolbar
            status={`${sticky ? 'Pinned' : `${offset}px`}${
              enabled ? '' : ' · locked'
            }`}
          />
        }
        headers={<Cover status='Latest stories' />}
        slot={<StoryList listId='collection-list' />}
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
```

### RefreshCoordinator

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { ScrollCoordinator } from '@lynx-js/lynx-ui'
import type {
  ScrollCoordinatorRef,
  ScrollCoordinatorRefreshOptions,
} from '@lynx-js/lynx-ui'

import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  RefreshControls,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [count, setCount] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [refreshEnabled, setRefreshEnabled] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [source, setSource] = useState('none')
  const [sticky, setSticky] = useState(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  const refreshOptions: ScrollCoordinatorRefreshOptions = {
    enableRefresh: refreshEnabled,
    headerContent: (
      <view className='sc-refresh-content'>
        <text className='sc-refresh-label'>
          {refreshing
            ? 'Refreshing collection...'
            : `Pull to refresh collection · ${progress}%`}
        </text>
      </view>
    ),
    onRefreshOffsetChange: ({ offset, headerSize, isDragging }) => {
      if (isDragging && headerSize > 0) {
        setProgress(Math.round(offset / headerSize * 100))
      }
    },
    onStartRefresh: ({ triggeredBy }) => {
      clearTimeout(timer.current)
      setSource(triggeredBy)
      setRefreshing(true)
      timer.current = setTimeout(() => {
        setCount(value => value + 1)
        setProgress(0)
        setRefreshing(false)
        coordinator.current?.finishRefresh()
      }, 1400)
    },
  }

  return (
    <DemoLayout
      title='Whole-page refresh'
      controls={
        <>
          <CoordinatorControls
            enabled={enabled}
            onExpand={() => coordinator.current?.scrollToTop(true)}
            onCollapse={() => coordinator.current?.scrollToSticky(true)}
            onShowDetails={() =>
              coordinator.current?.scrollIntoView('collection-details', true)}
            onToggleEnabled={() => setEnabled(value => !value)}
          />
          <RefreshControls
            enabled={refreshEnabled}
            onRefresh={() => coordinator.current?.startRefresh()}
            onToggleEnabled={() => setRefreshEnabled(value => !value)}
          />
        </>
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        refreshOptions={refreshOptions}
        toolbar={<Toolbar status={sticky ? 'Pinned' : 'Explore'} />}
        headers={<Cover status={`${count} updates · ${source}`} />}
        slot={
          <StoryList
            listId='collection-list'
            bounces={false}
          />
        }
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
```

### RefreshPage

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import {
  Button,
  FeedList,
  ScrollCoordinator,
  ViewPager,
} from '@lynx-js/lynx-ui'
import type {
  FeedListRef,
  ScrollCoordinatorRef,
  ScrollCoordinatorRefreshOptions,
  ViewPagerRef,
} from '@lynx-js/lynx-ui'

import { sections } from '../shared/data'
import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  Toolbar,
  renderStories,
} from '../shared/Demo'

function RefreshPage({ section, index }: { section: string, index: number }) {
  const feedList = useRef<FeedListRef>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [count, setCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const listId = `refresh-page-list-${index}`

  useEffect(() => () => clearTimeout(timer.current), [])

  const refreshOptions: ScrollCoordinatorRefreshOptions = {
    enableRefresh: true,
    headerContent: (
      <view className='sc-refresh-content'>
        <text className='sc-refresh-label'>
          {refreshing
            ? `Refreshing ${section}...`
            : `Pull to refresh ${section} · ${progress}%`}
        </text>
      </view>
    ),
    onRefreshOffsetChange: ({ offset, headerSize, isDragging }) => {
      if (isDragging && headerSize > 0) {
        setProgress(Math.round(offset / headerSize * 100))
      }
    },
    onStartRefresh: () => {
      clearTimeout(timer.current)
      setRefreshing(true)
      timer.current = setTimeout(() => {
        setCount(value => value + 1)
        setProgress(0)
        setRefreshing(false)
        feedList.current?.finishRefresh()
      }, 1400)
    },
  }

  return (
    <view className='sc-page'>
      <view className='sc-page-status'>
        <text className='sc-caption'>
          {`${section} · updates: ${count}`}
        </text>
      </view>
      <view className='sc-page-refresh'>
        <FeedList
          ref={feedList}
          className='sc-list'
          listId={listId}
          listType='single'
          spanCount={1}
          scrollOrientation='vertical'
          useRefactorList
          bounces
          refreshOptions={{ ...refreshOptions, mode: 'native' }}
        >
          {renderStories(listId)}
        </FeedList>
      </view>
    </view>
  )
}

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const pager = useRef<ViewPagerRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Refresh per section'
      controls={
        <CoordinatorControls
          enabled={enabled}
          onExpand={() => coordinator.current?.scrollToTop(true)}
          onCollapse={() => coordinator.current?.scrollToSticky(true)}
          onShowDetails={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
          onToggleEnabled={() => setEnabled(value => !value)}
        />
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        refreshInSlot
        toolbar={
          <Toolbar
            status={`${sections[pageIndex]} · ${sticky ? 'Pinned' : 'Explore'}`}
          />
        }
        headers={<Cover status='Latest stories' />}
        slot={
          <view className='sc-page'>
            <scroll-coordinator-slot-drag
              className='sc-tabs'
              enable-drag={false}
            >
              {sections.map((section, index) => (
                <Button
                  key={section}
                  className='sc-tab'
                  onClick={() => pager.current?.scrollToPage(index)}
                >
                  <text
                    className={index === pageIndex
                      ? 'sc-tab-label sc-selected'
                      : 'sc-tab-label'}
                  >
                    {section}
                  </text>
                  {index === pageIndex && <view className='sc-tab-indicator' />}
                </Button>
              ))}
            </scroll-coordinator-slot-drag>
            <ViewPager
              ref={pager}
              id='collection-pages'
              className='sc-pager'
              itemClassName='sc-pager-item'
              data={sections}
              getItemKey={section => section}
              onPageChange={event => setPageIndex(event.detail.index)}
            >
              {(section, index) => (
                <RefreshPage section={section} index={index} />
              )}
            </ViewPager>
          </view>
        }
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
```

### ViewPager

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ScrollCoordinator, ViewPager } from '@lynx-js/lynx-ui'
import type { ScrollCoordinatorRef, ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from '../shared/data'
import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const pager = useRef<ViewPagerRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Coordinated pages'
      controls={
        <CoordinatorControls
          enabled={enabled}
          onExpand={() => coordinator.current?.scrollToTop(true)}
          onCollapse={() => coordinator.current?.scrollToSticky(true)}
          onShowDetails={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
          onToggleEnabled={() => setEnabled(value => !value)}
        />
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        toolbar={
          <Toolbar
            status={`${sections[pageIndex]} · ${sticky ? 'Pinned' : 'Explore'}`}
          />
        }
        headers={<Cover status='Latest stories' />}
        slot={
          <view className='sc-page'>
            <scroll-coordinator-slot-drag
              className='sc-tabs'
              enable-drag={false}
            >
              {sections.map((section, index) => (
                <Button
                  key={section}
                  className='sc-tab'
                  onClick={() => pager.current?.scrollToPage(index)}
                >
                  <text
                    className={index === pageIndex
                      ? 'sc-tab-label sc-selected'
                      : 'sc-tab-label'}
                  >
                    {section}
                  </text>
                  {index === pageIndex && <view className='sc-tab-indicator' />}
                </Button>
              ))}
            </scroll-coordinator-slot-drag>
            <ViewPager
              ref={pager}
              id='collection-pages'
              className='sc-pager'
              itemClassName='sc-pager-item'
              data={sections}
              getItemKey={section => section}
              onPageChange={event => setPageIndex(event.detail.index)}
            >
              {(_, index) => (
                <StoryList
                  listId={`collection-list-${index}`}
                />
              )}
            </ViewPager>
          </view>
        }
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
```

### ViewPagerList

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  List,
  ScrollCoordinator,
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
  ViewPager,
} from '@lynx-js/lynx-ui'
import type { TabsRootRef, ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from './data'
import './index.css'

function App() {
  const pager = useRef<ViewPagerRef>(null)
  const tabsRoot = useRef<TabsRootRef>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='sc-frame'>
        <ScrollCoordinator
          className='sc-coordinator'
          onSticky={() => setSticky(true)}
          onLeaveSticky={() => setSticky(false)}
          toolbar={
            <view className='sc-toolbar'>
              <text className='sc-toolbar-title'>The reading room</text>
              <text className='sc-toolbar-status'>
                {`${sections[pageIndex].title} · ${
                  sticky ? 'Pinned' : 'Explore'
                }`}
              </text>
            </view>
          }
          headers={
            <view className='sc-cover'>
              <view className='sc-hero'>
                <text className='sc-hero-title'>Reading room</text>
              </view>
            </view>
          }
          slot={
            <view className='sc-page'>
              <scroll-coordinator-slot-drag
                className='sc-tabs'
                enable-drag={false}
              >
                <TabsRoot
                  ref={tabsRoot}
                  onClickItem={index => pager.current?.scrollToPage(index)}
                >
                  <TabsBar
                    className='sc-composed-tabs'
                    tabsItemWrapperClass='sc-composed-tabs-items'
                    data={sections}
                    getTabKey={section => section.id}
                    renderTabItem={section => (
                      <TabsItem className='sc-tab'>
                        <text
                          className={section.id === sections[pageIndex].id
                            ? 'sc-tab-label sc-selected'
                            : 'sc-tab-label'}
                        >
                          {section.title}
                        </text>
                      </TabsItem>
                    )}
                  >
                    <TabsIndicator className='sc-composed-tabs-indicator'>
                      <view className='sc-composed-tabs-indicator-line' />
                    </TabsIndicator>
                  </TabsBar>
                </TabsRoot>
              </scroll-coordinator-slot-drag>
              <ViewPager
                ref={pager}
                className='sc-pager'
                itemClassName='sc-pager-item'
                data={sections}
                getItemKey={section => section.id}
                bounces={false}
                onPageChange={event => {
                  const index = event.detail.index
                  setPageIndex(index)
                  // Synchronize selection without triggering another pager command.
                  tabsRoot.current?.selectTab(index, true)
                }}
              >
                {section => (
                  <List
                    className='sc-list'
                    listId={`reading-room-${section.id}`}
                    listType='single'
                    spanCount={1}
                    scrollOrientation='vertical'
                    useRefactorList
                    bounces
                  >
                    {section.items.map(item => (
                      <list-item key={item.id} item-key={item.id}>
                        <view className='sc-story'>
                          <view className='sc-story-number'>
                            <text className='sc-number'>{item.number}</text>
                          </view>
                          <view className='sc-story-copy'>
                            <text className='sc-story-title'>{item.title}</text>
                          </view>
                        </view>
                      </list-item>
                    ))}
                  </List>
                )}
              </ViewPager>
            </view>
          }
        />
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```
