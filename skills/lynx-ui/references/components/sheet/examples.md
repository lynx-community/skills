## Examples

### AutoHeight

Origin: oss

Source: `apps/examples/Sheet/AutoHeight/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

const fitSnapPoints = ['fit']
const fitAndPercentSnapPoints = ['fit', '80%']
const claimedGestureAngles: [number, number][] = [[-135, -45], [45, 135]]

const longText =
  'The Sheet component supports autoHeight mode, where the height is dynamically calculated based on its content. '
    .repeat(10)

function App() {
  const fitSheetRef = useRef<SheetRootRef>(null)
  const fitAndPercentSheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Sheet Auto Height</text>

      <view className='button-group'>
        <TriggerButton
          onClick={() => fitSheetRef.current?.open()}
          text='Open Fit Sheet'
        />
        <TriggerButton
          onClick={() => fitAndPercentSheetRef.current?.open()}
          text='Open Fit + 80% Sheet'
        />
      </view>

      <SheetRoot
        ref={fitSheetRef}
        onShowChange={(show) => {
          console.log('fit show change', show)
        }}
        onOpen={() => {
          console.log('fit open change')
        }}
        onClose={() => {
          console.log('fit close change')
        }}
        snapPoints={fitSnapPoints}
        initialSnap={0}
        claimedGestureAngles={claimedGestureAngles}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('fit snap change', snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Fit Sheet with Long Content
              </text>
              <text className='info-text'>snapPoints=["fit"]</text>
              <text className='info-text'>{longText}</text>
              <ActionButton
                onClick={() => fitSheetRef.current?.close()}
                text='Close via Ref'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={fitAndPercentSheetRef}
        snapPoints={fitAndPercentSnapPoints}
        initialSnap={0}
        claimedGestureAngles={claimedGestureAngles}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('fit + 80% snap change', snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Fit Sheet with Percent Snap
              </text>
              <text className='info-text'>snapPoints=["fit", "80%"]</text>
              <text className='info-text'>
                The fit snap uses measured content height, while 80% resolves
                against the viewport height.
              </text>
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.snapTo(0)}
                text='Snap to fit'
              />
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.snapTo(1)}
                text='Snap to 80%'
              />
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.close()}
                text='Close via Ref'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Basic

Origin: oss

Source: `apps/examples/Sheet/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

const snapPoints = ['50%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Basic Sheet</text>
      <TriggerButton
        onClick={() => sheetRef.current?.open()}
        text='Open Sheet'
      />
      <SheetRoot
        ref={sheetRef}
        snapPoints={snapPoints}
        initialSnap={0}
        onOpen={() => console.log('Sheet opened')}
        onClose={() => console.log('Sheet closed')}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>Basic Sheet</text>
              <text className='info-text'>
                Simple uncontrolled sheet. Drag or tap backdrop to dismiss.
              </text>
              <ActionButton
                onClick={() => sheetRef.current?.close()}
                text='Close'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Controlled

Origin: oss

Source: `apps/examples/Sheet/Controlled/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef, useState } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, SnapButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['40%', '80%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  // Fully controlled state - parent manages show/hide
  const [show, setShow] = useState(false)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Controlled Sheet</text>
      <text className='subtitle-text'>
        show: {show ? 'true' : 'false'}
      </text>
      <TriggerButton
        onClick={() => setShow(s => !s)}
        text={show ? 'Opened' : 'Open (setShow(true))'}
      />
      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={(newShow) => {
          console.log('onShowChange:', newShow)
          setShow(newShow)
        }}
        onOpen={() => {
          console.log('onOpen - sheet fully opened')
        }}
        onClose={() => {
          console.log('onClose - sheet fully closed')
        }}
        snapPoints={snapPoints}
        initialSnap={0}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('onSnapChange:', snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Controlled Sheet
              </text>
              <text className='info-text'>
                The parent component manages the `show` state. Backdrop taps and
                gestures trigger `onShowChange`.
              </text>
              <view className='button-group'>
                <SnapButton
                  onClick={() => sheetRef.current?.snapTo(0)}
                  text='Snap to 40%'
                />
                <SnapButton
                  onClick={() => sheetRef.current?.snapTo(1)}
                  text='Snap to 80%'
                />
              </view>

              <ActionButton
                onClick={() => setShow(false)}
                text='Close (setShow(false))'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### ControlledOpen

Origin: oss

Source: `apps/examples/Sheet/ControlledOpen/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef, useState } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['50%', '80%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  // Controlled mode with initial show={true}
  const [show, setShow] = useState(true)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Sheet Controlled Open</text>
      <text className='subtitle-text'>
        State: {show ? 'OPEN' : 'CLOSED'}
      </text>

      <TriggerButton
        onClick={() => setShow(s => !s)}
        text={show ? 'Close (setShow(false))' : 'Open (setShow(true))'}
      />

      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={(newShow) => {
          console.log('onShowChange:', newShow)
          setShow(newShow)
        }}
        onOpen={() => console.log('onOpen')}
        onClose={() => console.log('onClose')}
        snapPoints={snapPoints}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Controlled Open
              </text>
              <text className='info-text'>
                This sheet starts with show=true in controlled mode.
              </text>

              <ActionButton
                onClick={() => setShow(false)}
                text='Close (via state)'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### DefaultOpen

Origin: oss

Source: `apps/examples/Sheet/DefaultOpen/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef, useState } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['50%', '80%']

const defaultShow = true

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  // Uncontrolled example: we still mirror open state to sync other UI
  const [show, setShow] = useState(defaultShow)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Sheet Default Open</text>

      <TriggerButton
        disabled={show}
        onClick={() => sheetRef.current?.open()}
        text={show ? 'Opened' : 'Open (via ref)'}
      />

      <SheetRoot
        ref={sheetRef}
        defaultShow={defaultShow}
        onShowChange={(newShow) => {
          console.log('onShowChange:', newShow)
          setShow(newShow)
        }}
        onOpen={() => console.log('onOpen')}
        onClose={() => console.log('onClose')}
        snapPoints={snapPoints}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Default Open
              </text>
              <text className='info-text'>
                This sheet starts with defaultShow=true in uncontrolled mode.
              </text>
              <ActionButton
                onClick={() => sheetRef.current?.close()}
                text='Close (via ref)'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Directional

Origin: oss

Source: `apps/examples/Sheet/Directional/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'

import './index.css'

function DrawerSection(
  props: {
    title: string
    description: string
    note: string
    close: () => void
    surfaceClassName: string
    innerClassName: string
  },
) {
  const {
    title,
    description,
    note,
    close,
    surfaceClassName,
    innerClassName,
  } = props

  return (
    <SheetContent
      className={surfaceClassName}
      innerClassName={innerClassName}
    >
      <view className='drawer-panel'>
        <text className='header-text'>{title}</text>
        <text className='info-text'>{description}</text>
        <text className='info-text'>{note}</text>
        <ActionButton onClick={close} text='Close Drawer' />
      </view>
    </SheetContent>
  )
}

function App() {
  const leftDrawerRef = useRef<SheetRootRef>(null)
  const rightDrawerRef = useRef<SheetRootRef>(null)
  const startDrawerRef = useRef<SheetRootRef>(null)
  const endDrawerRef = useRef<SheetRootRef>(null)
  const rtlLeftDrawerRef = useRef<SheetRootRef>(null)
  const rtlRightDrawerRef = useRef<SheetRootRef>(null)
  const topSheetRef = useRef<SheetRootRef>(null)
  const bottomSheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Directional Sheet</text>
      <text className='subtitle-text'>
        Left and right are physical sides. Start and end are logical sides that
        can flip with enableRTL.
      </text>
      <view className='button-group'>
        <TriggerButton
          onClick={() => leftDrawerRef.current?.open()}
          text='Open Left Drawer'
        />
        <TriggerButton
          onClick={() => rightDrawerRef.current?.open()}
          text='Open Right Drawer'
        />
        <TriggerButton
          onClick={() => startDrawerRef.current?.open()}
          text='Open Start Drawer'
        />
        <TriggerButton
          onClick={() => endDrawerRef.current?.open()}
          text='Open End Drawer'
        />
        <TriggerButton
          onClick={() => rtlLeftDrawerRef.current?.open()}
          text='Open RTL Left Drawer'
        />
        <TriggerButton
          onClick={() => rtlRightDrawerRef.current?.open()}
          text='Open RTL Right Drawer'
        />
        <TriggerButton
          onClick={() => topSheetRef.current?.open()}
          text='Open Top Sheet'
        />
        <TriggerButton
          onClick={() => bottomSheetRef.current?.open()}
          text='Open Bottom Sheet'
        />
      </view>

      <SheetRoot
        ref={leftDrawerRef}
        side='left'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Left Drawer'
            description='This drawer uses side="left" with snapPoints=["fit"].'
            note='Use physical sides when the panel should stay on that edge in both LTR and RTL.'
            close={() => leftDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-left'
            innerClassName='drawer-inner-content drawer-inner-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={rightDrawerRef}
        side='right'
        snapPoints={['72%']}
        initialSnap={0}
        rubberBand={true}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Right Drawer'
            description='This drawer uses side="right" with a percentage snap point.'
            note='The 72% snap point resolves against viewport width instead of viewport height.'
            close={() => rightDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-percent'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={startDrawerRef}
        side='start'
        enableRTL={true}
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Start Drawer'
            description='This drawer uses side="start" with snapPoints=["fit"].'
            note='This example sets enableRTL, so start resolves to right. Disable it to make start resolve to left.'
            close={() => startDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={endDrawerRef}
        side='end'
        snapPoints={['72%']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='End Drawer'
            description='This drawer uses side="end" with a percentage snap point.'
            note='Without enableRTL, end resolves to right. Turn enableRTL on to make end resolve to left.'
            close={() => endDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-percent'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={rtlLeftDrawerRef}
        side='left'
        enableRTL={true}
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='RTL Left Drawer'
            description='This drawer uses side="left" with enableRTL.'
            note='Physical left stays left, while the Sheet viewport direction becomes RTL.'
            close={() => rtlLeftDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-left'
            innerClassName='drawer-inner-content drawer-inner-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={rtlRightDrawerRef}
        side='right'
        enableRTL={true}
        snapPoints={['72%']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='RTL Right Drawer'
            description='This drawer uses side="right" with enableRTL.'
            note='Physical right stays right, while the Sheet viewport direction becomes RTL.'
            close={() => rtlRightDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-percent'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={topSheetRef}
        side='top'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='top-sheet-shell'
            innerClassName='top-sheet-content'
          >
            <view className='top-sheet-panel'>
              <text className='header-text'>Top Sheet</text>
              <text className='info-text'>
                This sheet uses side="top". Its fit snap point resolves from
                measured height.
              </text>
              <ActionButton
                onClick={() => topSheetRef.current?.close()}
                text='Close Top Sheet'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={bottomSheetRef}
        side='bottom'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='bottom-sheet-shell'
            innerClassName='bottom-sheet-content'
          >
            <SheetHandle className='bottom-sheet-handle' />
            <view className='bottom-sheet-panel'>
              <text className='header-text'>Bottom Sheet</text>
              <text className='info-text'>
                This sheet uses the default bottom side. Its fit snap point
                resolves from measured height.
              </text>
              <ActionButton
                onClick={() => bottomSheetRef.current?.close()}
                text='Close Bottom Sheet'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Imperative

Origin: oss

Source: `apps/examples/Sheet/Imperative/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, SnapButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['40%', '60%', '90%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Imperative Sheet</text>

      <TriggerButton
        text='Open Sheet (via ref)'
        onClick={() => sheetRef.current?.open()}
      />

      <SheetRoot
        ref={sheetRef}
        onShowChange={(show) => {
          console.log('show change', show)
        }}
        onOpen={() => {
          console.log('open change')
        }}
        onClose={() => {
          console.log('close change')
        }}
        snapPoints={snapPoints}
        initialSnap={0}
        onSnapChange={(snapIndex, snapValue) => {
          console.log(snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Imperative Methods
              </text>

              <view className='button-group'>
                <SnapButton
                  text='40%'
                  onClick={() => sheetRef.current?.snapTo(0)}
                />
                <SnapButton
                  text='60%'
                  onClick={() => sheetRef.current?.snapTo(1)}
                />
                <SnapButton
                  text='90%'
                  onClick={() => sheetRef.current?.snapTo(2)}
                />
                <SnapButton
                  text='Expand (Max)'
                  onClick={() => sheetRef.current?.expand()}
                />
                <SnapButton
                  text='Collapse (Min)'
                  onClick={() => sheetRef.current?.collapse()}
                />
              </view>

              <ActionButton
                text='Close'
                onClick={() => sheetRef.current?.close()}
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### InternalTest

Origin: oss

Source: `apps/examples/Sheet/InternalTest/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, SnapButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['25%', '50%', '75%']

/**
 * Internal Testing Example
 *
 * This example is designed to test various edge cases and state transitions:
 * 1. Rapid open/close calls
 * 2. Drag resurrection (drag during close animation)
 * 3. Controlled vs uncontrolled mode switching
 * 4. Multiple snap points
 * 5. Callbacks timing
 */
function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [controlled, setControlled] = useState(false)
  const [show, setShow] = useState(false)

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    console.log(`[${time}] ${msg}`)
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 9)])
  }

  // Test: Rapid open/close
  const testRapidOpenClose = () => {
    log('TEST: Rapid open/close')
    sheetRef.current?.open()
    setTimeout(() => sheetRef.current?.close(), 100)
    setTimeout(() => sheetRef.current?.open(), 200)
    setTimeout(() => sheetRef.current?.close(), 300)
    setTimeout(() => sheetRef.current?.open(), 400)
  }

  // Test: Double open
  const testDoubleOpen = () => {
    log('TEST: Double open (should ignore second)')
    sheetRef.current?.open()
    setTimeout(() => sheetRef.current?.open(), 50)
  }

  // Test: Double close
  const testDoubleClose = () => {
    log('TEST: Double close (should ignore second)')
    sheetRef.current?.close()
    setTimeout(() => sheetRef.current?.close(), 50)
  }

  // Test: Snap during entry
  const testSnapDuringEntry = () => {
    log('TEST: snapTo during entry animation')
    sheetRef.current?.open()
    setTimeout(() => sheetRef.current?.snapTo(2), 100)
  }

  // Test: Close during entry
  const testCloseDuringEntry = () => {
    log('TEST: close during entry animation')
    sheetRef.current?.open()
    setTimeout(() => sheetRef.current?.close(), 150)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Internal Testing</text>

      <view className='mode-toggle'>
        <text className='mode-text'>
          Mode: {controlled ? 'CONTROLLED' : 'UNCONTROLLED'}
        </text>
        <view
          className='toggle-button'
          bindtap={() => setControlled(c => !c)}
        >
          <text className='toggle-text'>Toggle Mode</text>
        </view>
      </view>

      <view className='button-row'>
        <Button
          className='small-button'
          onClick={() => {
            if (controlled) {
              setShow(true)
            } else {
              sheetRef.current?.open()
            }
          }}
        >
          <text className='small-button-text'>Open</text>
        </Button>
        <Button
          className='small-button'
          onClick={() => {
            if (controlled) {
              setShow(false)
            } else {
              sheetRef.current?.close()
            }
          }}
        >
          <text className='small-button-text'>Close</text>
        </Button>
      </view>

      <text className='section-title'>Edge Case Tests</text>

      <view className='button-row'>
        <Button className='test-button' onClick={testRapidOpenClose}>
          <text className='test-button-text'>Rapid Open/Close</text>
        </Button>
        <Button className='test-button' onClick={testDoubleOpen}>
          <text className='test-button-text'>Double Open</text>
        </Button>
      </view>

      <view className='button-row'>
        <Button className='test-button' onClick={testDoubleClose}>
          <text className='test-button-text'>Double Close</text>
        </Button>
        <Button className='test-button' onClick={testSnapDuringEntry}>
          <text className='test-button-text'>Snap During Entry</text>
        </Button>
      </view>

      <view className='button-row'>
        <Button className='test-button' onClick={testCloseDuringEntry}>
          <text className='test-button-text'>Close During Entry</text>
        </Button>
      </view>

      <text className='section-title'>Event Log</text>
      <view className='log-container'>
        {logs.map((logEntry, i) => (
          <text key={i} className='log-entry'>{logEntry}</text>
        ))}
      </view>

      <SheetRoot
        ref={sheetRef}
        show={controlled ? show : undefined}
        onShowChange={(newShow) => {
          log(`onShowChange: ${newShow}`)
          if (controlled) {
            setShow(newShow)
          }
        }}
        onOpen={() => log('onOpen')}
        onClose={() => log('onClose')}
        snapPoints={snapPoints}
        initialSnap={1}
        onSnapChange={(index, value) => {
          log(`onSnapChange: index=${index} value=${Math.round(value)}`)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>Test Sheet</text>
              <text className='info-text'>
                Try dragging during close animation to test resurrection. Also
                test rapid snap point changes.
              </text>

              <view className='button-group'>
                <SnapButton
                  text='25%'
                  onClick={() => sheetRef.current?.snapTo(0)}
                />
                <SnapButton
                  text='50%'
                  onClick={() => sheetRef.current?.snapTo(1)}
                />
                <SnapButton
                  text='75%'
                  onClick={() => sheetRef.current?.snapTo(2)}
                />
                <SnapButton
                  text='Expand'
                  onClick={() => sheetRef.current?.expand()}
                />
                <SnapButton
                  text='Collapse'
                  onClick={() => sheetRef.current?.collapse()}
                />
              </view>

              <ActionButton
                text='Close Sheet'
                onClick={() => {
                  if (controlled) {
                    setShow(false)
                  } else {
                    sheetRef.current?.close()
                  }
                }}
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```

### Tablet

Origin: oss

Source: `apps/examples/Sheet/Tablet/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['fit']
const claimedGestureAngles: [number, number][] = [[-135, -45], [45, 135]]

const longText =
  'This example demonstrates a tablet-friendly Sheet layout. The content is constrained with a max-width so it stays readable on larger screens. '
    .repeat(10)

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Sheet Tablet</text>
      <TriggerButton
        onClick={() => sheetRef.current?.open()}
        text='Open Sheet (via ref)'
      />

      <SheetRoot
        ref={sheetRef}
        onShowChange={(show) => {
          console.log('show change', show)
        }}
        onOpen={() => {
          console.log('open change')
        }}
        onClose={() => {
          console.log('close change')
        }}
        snapPoints={snapPoints}
        initialSnap={0}
        claimedGestureAngles={claimedGestureAngles}
        onSnapChange={(snapIndex, snapValue) => {
          console.log(snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>Sheet with Long Content</text>
              <text className='info-text'>{longText}</text>
              <ActionButton
                onClick={() => sheetRef.current?.close()}
                text='Close via Ref'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
```
