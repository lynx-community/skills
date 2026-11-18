## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Draggable } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <Draggable
        className='draggable'
        resetOnEnd={true}
        trigger='immediate'
      />
    </view>
  )
}

root.render(<App />)

export default App
```

### WithArea

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { DraggableArea, DraggableRoot } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  return (
    <view className='container lunaris-dark'>
      <DraggableRoot
        className='draggable-root'
        resetOnEnd={true}
        trigger='immediate'
      >
        <DraggableArea className='draggable-area'>
          <text className='draggable-area-text'>Drag Here</text>
        </DraggableArea>
      </DraggableRoot>
    </view>
  )
}

root.render(<App />)
```

### WithBounds

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Draggable } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  return (
    <view className='container lunaris-dark'>
      <view className='draggable-area'>
        <Draggable
          className='draggable'
          resetOnEnd={true}
          minTranslateX={-100}
          minTranslateY={-100}
          maxTranslateX={100}
          maxTranslateY={100}
          trigger='immediate'
        />
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```
