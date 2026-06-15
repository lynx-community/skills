## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(true)

  return (
    <view className='demo-container lunaris-dark'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={show}
        onShowChange={setShow}
      >
        <DialogTrigger className='dialog-trigger'>
          <text className='dialog-trigger-text'>Show Dialog</text>
        </DialogTrigger>

        <DialogView className='dialog-viewport'>
          <DialogBackdrop className='dialog-backdrop' />

          <DialogContent className='dialog-content'>
            <view className='dialog-body'>
              <text className='dialog-title'>Step into the next phase</text>
              <text className='dialog-desc'>
                This action will shift your current state. Nothing drastic, just
                a subtle drift, like moonlight sliding across a quiet surface.
              </text>
            </view>

            <DialogClose className='dialog-close'>
              <text className='dialog-close-text'>Proceed</text>
            </DialogClose>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### BasicTailwind

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import './index.css'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(true)

  return (
    <view className='lunaris-dark bg-primary-muted size-full flex flex-col items-center justify-center'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={show}
        onShowChange={setShow}
      >
        <DialogTrigger
          className={clsx(
            'w-[240px] h-[48px] flex justify-center items-center rounded-full',
            'bg-neutral active:bg-neutral-2 transition-colors',
          )}
        >
          <text className='text-neutral-content font-semibold text-base'>
            Show Dialog
          </text>
        </DialogTrigger>
        <DialogView className='absolute size-full flex flex-col items-center justify-center px-[24px] overflow-hidden'>
          <DialogBackdrop
            className={clsx(
              'bg-backdrop ui-open:opacity-100 ui-closed:opacity-0',
              'transition-opacity duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            )}
          />
          <DialogContent
            className={clsx(
              'w-full flex flex-col items-center p-[24px] rounded-[24px]',
              'bg-canvas border-line border',
              'ui-open:opacity-100 ui-closed:opacity-0 ',
              'transition-opacity duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            )}
          >
            <view className='w-full h-[250px] flex flex-col items-start justify-center px-[32px] gap-[12px]'>
              <text className='text-content text-lg font-semibold'>
                Step into the next phase
              </text>
              <text className='text-content-muted text-base'>
                This action will shift your current state. Nothing drastic, just
                a subtle drift, like moonlight sliding across a quiet surface.
              </text>
            </view>
            <DialogClose
              className={clsx(
                'w-4/5 h-[48px] flex justify-center items-center rounded-full',
                'bg-primary ui-active:bg-primary-2 transition-colors',
              )}
            >
              <text className='text-primary-content font-semibold text-base'>
                Proceed
              </text>
            </DialogClose>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### DifferentAnimation

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'
import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'
import type { PresenceAnimationStatus } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

// This demo is shown how to use different animation in entering and leaving.
// In this demo, we use shorter fade in animation when dialog is shown, and longer fade out animation when dialog is dismissed.

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(false)
  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={show}
        onShowChange={(show: boolean) => {
          setShow(show)
        }}
      >
        {(
          { leaving = false, entering = false, closed = false, open = false }:
            PresenceAnimationStatus,
        ) => {
          return (
            <>
              <DialogTrigger className='dialog-trigger'>
                <text className='dialog-trigger-text'>
                  click to display dialog
                </text>
              </DialogTrigger>
              <DialogView
                className={clsx('dialog-viewport', {
                  'closed': closed,
                  'open': open,
                })}
              >
                <DialogBackdrop
                  className={clsx(
                    'dialog-backdrop',
                    {
                      'longer-fade-out': leaving,
                      'shorter-fade-in': entering,
                    },
                  )}
                />
                <DialogContent
                  className={clsx(
                    'dialog-content',
                    {
                      'shorter-fade-out': leaving,
                      'longer-fade-in': entering,
                    },
                  )}
                >
                  <view className='dialog-item'>
                    <text>Dialog Content</text>
                  </view>
                  <DialogClose className='dialog-close'>
                    <text style={{ color: 'white' }}>Close dialog</text>
                  </DialogClose>
                </DialogContent>
              </DialogView>
            </>
          )
        }}
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### DynamicallyChangeLevel

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(false)
  const [level, setLevel] = useState(2)

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Changing overlayLevel from 2 to 3')
      setLevel(3)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={show}
        onShowChange={(show: boolean) => {
          setShow(show)
        }}
      >
        <DialogTrigger className='dialog-trigger'>
          <text className='dialog-trigger-text'>
            click to display dialog
          </text>
        </DialogTrigger>
        <DialogView
          className='dialog-viewport'
          container='window'
          overlayLevel={level}
        >
          <DialogBackdrop className='dialog-backdrop' />
          <DialogContent className='dialog-content animation'>
            <view className='dialog-item'>
              <text>Dialog Content</text>
            </view>
            <DialogClose className='dialog-close'>
              <text style={{ color: 'white' }}>Close dialog</text>
            </DialogClose>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### ForceMount

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'
import type { PresenceAnimationStatus } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(false)
  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        forceMount={true}
        show={show}
        onShowChange={(show: boolean) => {
          setShow(show)
        }}
      >
        {(
          { open = false, closed = false }: PresenceAnimationStatus,
        ) => {
          return (
            <>
              <DialogTrigger className='dialog-trigger'>
                <text className='dialog-trigger-text'>
                  click to display dialog
                </text>
              </DialogTrigger>
              <DialogView
                className={clsx('dialog-viewport', {
                  'open': open,
                  'closed': closed,
                })}
              >
                <DialogBackdrop className='dialog-backdrop' />
                <DialogContent
                  className={clsx(
                    'dialog-content',
                    'animation',
                    {
                      'open': show,
                      'closed': !show,
                    },
                  )}
                >
                  <view className='dialog-item'>
                    <text>Dialog Content</text>
                  </view>
                  <DialogClose className='dialog-close'>
                    <text style={{ color: 'white' }}>Close dialog</text>
                  </DialogClose>
                </DialogContent>
              </DialogView>
            </>
          )
        }}
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### ForceMountUIVariants

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(false)
  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        forceMount={true}
        show={show}
        onShowChange={(show: boolean) => {
          setShow(show)
        }}
      >
        <DialogTrigger className='dialog-trigger'>
          <text className='dialog-trigger-text'>
            click to display dialog
          </text>
        </DialogTrigger>
        <DialogView className='dialog-viewport'>
          <DialogBackdrop className='dialog-backdrop' />
          <DialogContent className='dialog-content animation'>
            <view className='dialog-item'>
              <text>Dialog Content</text>
            </view>
            <DialogClose className='dialog-close'>
              <text style={{ color: 'white' }}>Close dialog</text>
            </DialogClose>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### InScrollView

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
  ScrollView,
} from '@lynx-js/lynx-ui'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [show, setShow] = useState(false)
  return (
    <ScrollView scrollOrientation='vertical' className='scrollview'>
      <view
        className='container'
        bindtap={() => {
          console.info('tap!')
        }}
      >
        <DialogRoot
          onClose={handleDismissed}
          onOpen={handleShowed}
          show={show}
          onShowChange={(show: boolean) => {
            setShow(show)
            console.info('showChange')
          }}
        >
          <DialogTrigger className='dialog-trigger'>
            <text className='dialog-trigger-text'>
              click to display dialog
            </text>
          </DialogTrigger>
          <DialogView className='dialog-viewport'>
            <DialogBackdrop className='dialog-backdrop' />
            <DialogContent className='dialog-content animation'>
              <view className='dialog-item'>
                <text>Dialog Content</text>
              </view>
              <DialogClose className='dialog-close'>
                <text style={{ color: 'white' }}>Close dialog</text>
              </DialogClose>
            </DialogContent>
          </DialogView>
        </DialogRoot>
      </view>
    </ScrollView>
  )
}

root.render(<App />)

export default App
```

### MultipleDialogLevel

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  const [showLevel3, setShowLevel3] = useState(false)
  const [showLevel4, setShowLevel4] = useState(false)
  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={showLevel3}
        onShowChange={(show: boolean) => {
          setShowLevel3(show)
        }}
      >
        <DialogTrigger className='dialog-trigger'>
          <text className='dialog-trigger-text'>
            click to display dialog in level 3
          </text>
        </DialogTrigger>
        <DialogView
          className='dialog-viewport'
          overlayLevel={3}
        >
          <DialogBackdrop className='dialog-backdrop' />
          <DialogContent className='dialog-content animation level-3'>
            <view className='dialog-item'>
              <text>Dialog Content 3</text>
            </view>
            <DialogClose className='dialog-close'>
              <text style={{ color: 'white' }}>Close dialog</text>
            </DialogClose>
          </DialogContent>
        </DialogView>

        {/* This dialog is non modal, it will not block the higher level dialogs */}
      </DialogRoot>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        show={showLevel4}
        onShowChange={(show: boolean) => {
          setShowLevel4(show)
        }}
      >
        <DialogTrigger className='dialog-trigger'>
          <text className='dialog-trigger-text'>
            click to display dialog in level 4
          </text>
        </DialogTrigger>
        <DialogView
          className='dialog-viewport-level-3'
          overlayLevel={4}
        >
          <DialogContent className='dialog-content animation level-4'>
            <view className='dialog-item'>
              <text>Dialog Content 4</text>
            </view>
            <DialogClose className='dialog-close'>
              <text style={{ color: 'white' }}>Close dialog</text>
            </DialogClose>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### TimingRace

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

const REOPEN_DELAY = 200

function App() {
  const [show, setShow] = useState(false)
  const [pageTaps, setPageTaps] = useState(0)
  const [events, setEvents] = useState<string[]>(['Ready'])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const eventCountRef = useRef(0)

  const pushEvent = (message: string) => {
    eventCountRef.current += 1
    setEvents(prev =>
      [
        `${eventCountRef.current}. ${message}`,
        ...prev,
      ].slice(0, 8)
    )
  }

  const clearTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
  }

  const schedule = (delay: number, callback: () => void) => {
    const timer = setTimeout(() => {
      timersRef.current = timersRef.current.filter(item => item !== timer)
      callback()
    }, delay)
    timersRef.current.push(timer)
  }

  const requestShow = (nextShow: boolean, source: string) => {
    pushEvent(`${source}: show=${String(nextShow)}`)
    setShow(nextShow)
  }

  const handleShowChange = (nextShow: boolean) => {
    pushEvent(`onShowChange: show=${String(nextShow)}`)
    setShow(nextShow)
  }

  const runCloseReopen = () => {
    clearTimers()
    requestShow(false, 'close')
    schedule(REOPEN_DELAY, () => requestShow(true, 'reopen after 200ms'))
  }

  const runOverlayProbe = () => {
    clearTimers()
    pushEvent('overlay probe started')
    setPageTaps(0)
    requestShow(true, 'probe open')
    schedule(120, () => requestShow(false, 'probe close before enter'))
    schedule(320, () => requestShow(true, 'probe reopen'))
    schedule(430, () => requestShow(false, 'probe final close'))
    schedule(760, () => pushEvent('tap page probe now'))
  }

  const handlePageProbe = () => {
    setPageTaps(count => count + 1)
    pushEvent('page probe tapped')
  }

  useEffect(() => clearTimers, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='toolbar'>
        <DialogRoot
          onClose={() => pushEvent('onClose')}
          onOpen={() => pushEvent('onOpen')}
          show={show}
          onShowChange={handleShowChange}
        >
          <DialogTrigger className='demo-button'>
            <text className='demo-button-text'>Open</text>
          </DialogTrigger>

          <DialogView className='dialog-viewport'>
            <DialogBackdrop className='dialog-backdrop' />

            <DialogContent className='dialog-content'>
              <view className='dialog-body'>
                <text className='dialog-title'>Dialog timing probes</text>
                <text className='dialog-desc'>
                  Use these actions to interrupt enter and exit transitions.
                </text>
              </view>

              <view className='dialog-actions'>
                <view className='dialog-action' bindtap={runCloseReopen}>
                  <text className='dialog-action-text'>
                    Option: reopen 200ms
                  </text>
                </view>
                <DialogClose className='dialog-action dialog-action-muted'>
                  <text className='dialog-action-text'>Close</text>
                </DialogClose>
              </view>
            </DialogContent>
          </DialogView>
        </DialogRoot>

        <view className='demo-button' bindtap={runCloseReopen}>
          <text className='demo-button-text'>Close/reopen</text>
        </view>

        <view className='demo-button' bindtap={runOverlayProbe}>
          <text className='demo-button-text'>Overlay probe</text>
        </view>

        <view className='probe-button' bindtap={handlePageProbe}>
          <text className='probe-button-text'>Page taps: {pageTaps}</text>
        </view>
      </view>

      <view className='event-log'>
        {events.map(event => (
          <text className='event-text' key={event}>{event}</text>
        ))}
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Uncontrolled

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'
import type { PresenceAnimationStatus } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

function App() {
  const handleDismissed = () => {
    console.log('dismissed!')
  }
  const handleShowed = () => {
    console.log('showed!')
  }
  return (
    <view className='container'>
      <DialogRoot
        onClose={handleDismissed}
        onOpen={handleShowed}
        defaultShow={false}
      >
        {(
          { leaving = false, entering = false, closed = false }:
            PresenceAnimationStatus,
        ) => {
          return (
            <>
              <DialogTrigger>
                <view className='dialog-trigger'>
                  <text className='dialog-trigger-text'>open</text>
                </view>
              </DialogTrigger>
              <DialogView
                className={clsx('dialog-viewport', { 'closed': closed })}
              >
                <DialogBackdrop
                  className={clsx(
                    'dialog-backdrop',
                    {
                      'closed': closed,
                      'longer-fade-out': leaving,
                      'shorter-fade-in': entering,
                    },
                  )}
                />
                <DialogContent
                  className={clsx(
                    'dialog-content',
                    {
                      'closed': closed,
                      'shorter-fade-out': leaving,
                      'longer-fade-in': entering,
                    },
                  )}
                >
                  <view className='dialog-item'>
                    <text>Dialog Content</text>
                  </view>
                  <DialogClose>
                    <view className='dialog-close'>
                      <text style={{ color: 'white' }}>Close dialog</text>
                    </view>
                  </DialogClose>
                </DialogContent>
              </DialogView>
            </>
          )
        }}
      </DialogRoot>
    </view>
  )
}

root.render(<App />)

export default App
```
