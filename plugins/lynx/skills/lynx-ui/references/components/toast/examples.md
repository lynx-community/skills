## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastPositioner,
  ToastRoot,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [showToast, setShowToast] = useState<boolean>(false)
  const handleShowToast = () => {
    setShowToast(true)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>

      <ToastRoot
        show={showToast}
        onClose={() => {
          setShowToast(false)
          console.log('dismissed')
        }}
        onOpen={() => {
          setShowToast(true)
          console.log('showed')
        }}
      >
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent
            className='toast-item'
            duration={200}
            swipeDirection='top'
          >
            <text className='toast-message'>Toast is ready</text>
          </ToastContent>
        </ToastPositioner>
      </ToastRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Custom

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastPositioner,
  ToastRoot,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [showToast, setShowToast] = useState<boolean>(false)
  const handleShowToast = () => {
    setShowToast(true)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>

      <ToastRoot
        show={showToast}
        onClose={() => {
          setShowToast(false)
          console.log('dismissed')
        }}
        onOpen={() => {
          setShowToast(true)
          console.log('showed')
        }}
      >
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent
            useDefaultAnimation={false}
            className='toast-item animation'
          >
            <text className='toast-message'>Custom animation toast</text>
          </ToastContent>
        </ToastPositioner>
      </ToastRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Draggable

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  ToastDraggableContent,
  ToastPositioner,
  ToastRoot,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [showToast, setShowToast] = useState<boolean>(false)
  const handleShowToast = () => {
    setShowToast(true)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>

      <ToastRoot
        show={showToast}
        onClose={() => {
          setShowToast(false)
          console.log('dismissed')
        }}
        onOpen={() => {
          setShowToast(true)
          console.log('showed')
        }}
      >
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastDraggableContent
            className='toast-item'
            duration={200}
            swipeDirection='top'
          >
            <text className='toast-message'>Swipe up to dismiss</text>
          </ToastDraggableContent>
        </ToastPositioner>
      </ToastRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### DraggableStaticBasic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Button,
  ToastDraggableContent,
  ToastMountPoint,
  ToastPositioner,
  toast,
} from '@lynx-js/lynx-ui'
import type { StaticToastConfig } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const toastConfig: StaticToastConfig = {
    root: {
      onClose: () => {
        console.info(
          'Toast Close.',
        )
      },
      onOpen: () => {
        console.info(
          'Toast Open.',
        )
      },
      children: (
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastDraggableContent className='toast-item'>
            <text className='toast-message'>Swipe up to dismiss</text>
          </ToastDraggableContent>
        </ToastPositioner>
      ),
    },
    duration: 3000,
  }
  const handleShowToast = () => {
    toast.open(toastConfig)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>
      <ToastMountPoint />
    </view>
  )
}

root.render(<App />)

export default App
```

### StaticBasic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastMountPoint,
  ToastPositioner,
  toast,
} from '@lynx-js/lynx-ui'
import type { StaticToastConfig } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const toastConfig: StaticToastConfig = {
    root: {
      onClose: () => {
        console.info(
          'Toast Close.',
        )
      },
      onOpen: () => {
        console.info(
          'Toast Open.',
        )
      },
      children: (
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent className='toast-item'>
            <text className='toast-message'>Toast opened imperatively</text>
          </ToastContent>
        </ToastPositioner>
      ),
    },
    duration: 3000,
  }
  const handleShowToast = () => {
    toast.open(toastConfig)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>
      <ToastMountPoint />
    </view>
  )
}

root.render(<App />)

export default App
```

### StaticCustomAnimation

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastMountPoint,
  ToastPositioner,
  toast,
} from '@lynx-js/lynx-ui'
import type { StaticToastConfig } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const toastConfig: StaticToastConfig = {
    root: {
      onClose: () => {
        console.info(
          'Toast Close.',
        )
      },
      onOpen: () => {
        console.info(
          'Toast Open.',
        )
      },
      children: (
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent
            useDefaultAnimation={false}
            className='toast-item animation'
          >
            <text className='toast-message'>Custom static animation</text>
          </ToastContent>
        </ToastPositioner>
      ),
    },
    duration: 3000,
  }
  const handleShowToast = () => {
    toast.open(toastConfig)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>

      <ToastMountPoint />
    </view>
  )
}

root.render(<App />)

export default App
```
