## Examples

### Basic

Origin: oss

Source: `apps/examples/List/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, List } from '@lynx-js/lynx-ui'
import type { ListRef } from '@lynx-js/lynx-ui'

import { ListItemCard } from '../shared/ListItemCard'
import './index.css'

const itemData = Array.from({ length: 16 }, (_, i) => ({
  id: String(i),
  label: String(i),
}))
const orientation = 'vertical'
const scrollToIndex = 7

function App() {
  const listRef = useRef<ListRef>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)

  const handleAutoScrollClick = () => {
    setIsAutoScrolling(prev => !prev)
    listRef.current?.autoScroll('60px', !isAutoScrolling, true)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <List
        className='list-container'
        listId='ListBasic'
        ref={listRef}
        listType='single'
        spanCount={1}
        scrollOrientation={orientation}
        useRefactorList={true}
        bounces={false}
      >
        <list-item item-key='demo-header'>
          <view className='demo-header' />
        </list-item>
        {itemData.map((item) => (
          <list-item key={item.id} item-key={item.id}>
            <ListItemCard
              letter={item.label}
              height={300}
            />
          </list-item>
        ))}
        <list-item item-key='demo-footer'>
          <view className='demo-footer' />
        </list-item>
      </List>
      <view className='button-container'>
        <Button
          className='button'
          onClick={() =>
            listRef.current?.scrollTo(true, 'middle', scrollToIndex, 0)}
        >
          <text className='button-text'>
            {`scrollTo(index ${scrollToIndex})`}
          </text>
        </Button>
        <Button
          className='button neutral'
          onClick={handleAutoScrollClick}
        >
          <text className='button-text neutral'>autoScroll()</text>
        </Button>
        <Button
          className='button subtle'
          onClick={() => console.log(listRef.current?.getVisibleCells())}
        >
          <text className='button-text subtle'>getVisibleCells()</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### MaxSize

Origin: oss

Source: `apps/examples/List/MaxSize/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { List } from '@lynx-js/lynx-ui'

import { ListItemCard } from '../shared/ListItemCard'
import './index.css'

const data = ['L', 'Y', 'N', 'X', 'U', 'I']

function App() {
  return (
    <view className='container lunaris-dark'>
      <List
        className='list-container'
        listId='listBasic'
        listType='single'
        spanCount={1}
        listMaxSize={500}
        scrollOrientation='vertical'
      >
        {data.map((char, index) => (
          <list-item
            item-key={char}
            id={char}
            key={char}
          >
            <ListItemCard
              letter={char}
              height={index % 2 === 0 ? 360 : 240}
            />
          </list-item>
        ))}
        <list-item item-key='footer' id='footer'>
          <ListItemCard
            letter='footer'
            height={200}
          />
        </list-item>
      </List>
    </view>
  )
}

root.render(<App />)

export default App
```
