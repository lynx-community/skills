## Examples

### Basic

Origin: oss

Source: `apps/examples/Slider/Basic/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'

import './index.css'

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [variantValue, setVariantValue] = useState(0.68)
  const [rtlValue, setRtlValue] = useState(0.4)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Variant</text>
          <text className='desc'>
            A slider with a bordered thumb and a filled thumb side by side.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(variantValue)}
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.68}
              onValueChange={(value: number) => {
                setVariantValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-pill' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label disabled'>Readonly</text>
            <SliderRoot
              className='slider-root ui-disabled'
              defaultValue={0.45}
              disabled
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>

        <view className='section'>
          <text className='title'>RTL</text>
          <text className='desc'>
            A slider with `enableRTL` and CSS `direction: rtl`. The indicator
            grows from right to left.
          </text>

          <view className='row rtl-card'>
            <text className='slider-label'>
              {formatValue(rtlValue)}
            </text>
            <SliderRoot
              className='slider-root'
              enableRTL
              defaultValue={0.4}
              onValueChange={(value: number) => {
                setRtlValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Controlled

Origin: oss

Source: `apps/examples/Slider/Controlled/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'

import './index.css'

const PRESET_VALUES = [0, 0.25, 0.5, 0.75, 1]

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [value, setValue] = useState(0.32)
  const [primitiveDragging, setPrimitiveDragging] = useState(false)
  const [steppedValue, setSteppedValue] = useState(0.5)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Controlled</text>
          <text className='desc'>
            Pass `value` and `onValueChange` to fully control the slider from
            the outside. Use preset chips to jump to specific values.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {primitiveDragging
                ? 'Dragging...'
                : formatValue(value)}
            </text>
            <SliderRoot
              className='slider-root'
              value={value}
              onDragging={() => {
                setPrimitiveDragging(true)
              }}
              onValueChange={(v: number) => {
                setValue(v)
              }}
              onValueCommit={() => {
                setPrimitiveDragging(false)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>

            <view className='preset-row'>
              {PRESET_VALUES.map((v) => (
                <view
                  key={`preset-${v}`}
                  className='preset-chip'
                  bindtap={() => {
                    setValue(v)
                  }}
                >
                  <text className='preset-label'>
                    {formatValue(v)}
                  </text>
                </view>
              ))}
            </view>
          </view>
        </view>

        <view className='section'>
          <text className='title'>Stepped</text>
          <text className='desc'>
            A slider with `step={0.1}` that snaps to 10% increments.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(steppedValue)} — Step: 10%
            </text>
            <SliderRoot
              className='slider-root'
              value={steppedValue}
              step={0.1}
              onValueChange={(value: number) => {
                setSteppedValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### DynamicWidth

Origin: oss

Source: `apps/examples/Slider/DynamicWidth/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'

import './index.css'

const WIDTHS = [200, 300, 420, 280, 360]

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [widthIndex, setWidthIndex] = useState(2)
  const [value, setValue] = useState(0.5)
  const currentWidth = WIDTHS[widthIndex]

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas' style={{ maxWidth: `${currentWidth}px` }}>
        <view className='section'>
          <text className='title'>Dynamic Width</text>
          <text className='desc'>
            Tap the buttons below to change the slider container width. This
            tests the track layout measurement updating correctly.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(value)} — {currentWidth}px
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.5}
              onValueChange={(v: number) => {
                setValue(v)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>

            <view className='width-row'>
              {WIDTHS.map((w, i) => (
                <view
                  key={`w-${w}`}
                  className={`width-chip${
                    i === widthIndex ? ' width-chip-active' : ''
                  }`}
                  bindtap={() => {
                    setWidthIndex(i)
                  }}
                >
                  <text
                    className={`width-label${
                      i === widthIndex ? ' width-label-active' : ''
                    }`}
                  >
                    {w}px
                  </text>
                </view>
              ))}
            </view>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Facade

Origin: oss

Source: `apps/examples/Slider/Facade/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, root, useState } from '@lynx-js/react'
import type { ForwardedRef, ReactNode } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'
import type { SliderRef, SliderRootProps } from '@lynx-js/lynx-ui'

import './index.css'

interface SliderProps extends Omit<SliderRootProps, 'children'> {
  thumb?: ReactNode
  trackClassName?: string
  indicatorClassName?: string
  thumbWrapperClassName?: string
}

const Slider = memo(
  forwardRef(function Slider(
    props: SliderProps,
    ref: ForwardedRef<SliderRef>,
  ) {
    const {
      thumb,
      trackClassName,
      indicatorClassName,
      thumbWrapperClassName,
      ...rootProps
    } = props

    return (
      <SliderRoot ref={ref} {...rootProps}>
        <SliderTrack className={trackClassName}>
          <SliderIndicator className={indicatorClassName} />
          <SliderThumb className={thumbWrapperClassName}>
            {thumb}
          </SliderThumb>
        </SliderTrack>
      </SliderRoot>
    )
  }),
)

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [defaultValue, setDefaultValue] = useState(0.4)
  const [pillValue, setPillValue] = useState(0.72)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Facade</text>
          <text className='desc'>
            A single-component wrapper built from Slider primitives. This
            example shows how to compose your own facade for simple use cases.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(defaultValue)}
            </text>
            <Slider
              className='slider-root'
              defaultValue={0.4}
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb' />}
              onValueChange={(value: number) => {
                setDefaultValue(value)
              }}
            />
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(pillValue)}
            </text>
            <Slider
              className='slider-root'
              defaultValue={0.72}
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb-pill' />}
              onValueChange={(value: number) => {
                setPillValue(value)
              }}
            />
          </view>

          <view className='row'>
            <text className='slider-label disabled'>Readonly</text>
            <Slider
              className='slider-root'
              defaultValue={0.45}
              disabled
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb' />}
            />
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Progress

Origin: oss

Source: `apps/examples/Slider/Progress/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { SliderIndicator, SliderRoot, SliderTrack } from '@lynx-js/lynx-ui'

import './index.css'

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const downloadTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    downloadTimer.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 1) return 0
        return Math.min(prev + 0.02, 1)
      })
    }, 80)

    uploadTimer.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 1) return 0
        return Math.min(prev + 0.01, 1)
      })
    }, 100)

    return () => {
      if (downloadTimer.current) clearInterval(downloadTimer.current)
      if (uploadTimer.current) clearInterval(uploadTimer.current)
    }
  }, [])

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Progress (No Thumb)</text>
          <text className='desc'>
            SliderRoot + SliderIndicator without SliderThumb, used as a
            read-only progress indicator.
          </text>

          <view className='progress-row'>
            <view className='progress-meta'>
              <text className='progress-label'>Downloading...</text>
              <text className='progress-value'>
                {formatValue(downloadProgress)}
              </text>
            </view>
            <SliderRoot
              className='progress-root'
              value={downloadProgress}
              disabled
            >
              <SliderTrack className='progress-track'>
                <SliderIndicator className='progress-indicator' />
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='progress-row'>
            <view className='progress-meta'>
              <text className='progress-label'>Uploading...</text>
              <text className='progress-value'>
                {formatValue(uploadProgress)}
              </text>
            </view>
            <SliderRoot
              className='progress-root'
              value={uploadProgress}
              disabled
            >
              <SliderTrack className='progress-track'>
                <SliderIndicator className='progress-indicator progress-indicator-secondary' />
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>

        <view className='section'>
          <text className='title'>Static Progress</text>
          <text className='desc'>
            Fixed progress values showing various completion states.
          </text>

          <view className='progress-row'>
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <view key={`static-${v}`} className='static-row'>
                <text className='static-label'>{formatValue(v)}</text>
                <view className='static-bar-wrapper'>
                  <SliderRoot
                    className='progress-root'
                    value={v}
                    disabled
                  >
                    <SliderTrack className='progress-track'>
                      <SliderIndicator className='progress-indicator' />
                    </SliderTrack>
                  </SliderRoot>
                </view>
              </view>
            ))}
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### Shapes

Origin: oss

Source: `apps/examples/Slider/Shapes/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'

import './index.css'

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [fullValue, setFullValue] = useState(0.4)
  const [gradientValue, setGradientValue] = useState(0.55)
  const [secondaryValue, setSecondaryValue] = useState(0.65)
  const [invertedRingValue, setInvertedRingValue] = useState(0.35)
  const [pillValue, setPillValue] = useState(0.5)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Shapes</text>
          <text className='desc'>
            Different visual shapes for thick sliders: full dot, ring, inverted
            ring, and pill.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(fullValue)} — Full
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.4}
              onValueChange={(value: number) => {
                setFullValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-dot' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(gradientValue)} — Gradient
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.55}
              onValueChange={(value: number) => {
                setGradientValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-gradient'>
                <SliderIndicator className='slider-indicator slider-indicator-gradient' />
                <SliderThumb className='slider-thumb-wrapper slider-thumb-wrapper-gradient'>
                  <view className='slider-thumb-dot'>
                    <view className='slider-thumb-dot-ring' />
                  </view>
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(secondaryValue)} — Ring
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.65}
              onValueChange={(value: number) => {
                setSecondaryValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-secondary'>
                <SliderIndicator className='slider-indicator slider-indicator-secondary' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-ring' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(invertedRingValue)} — Inverted Ring
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.35}
              onValueChange={(value: number) => {
                setInvertedRingValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-inverted'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-ring-inverted'>
                    <view className='slider-thumb-dot-ring-inverted' />
                  </view>
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(pillValue)} — Pill
            </text>
            <SliderRoot
              className='slider-root-pill'
              defaultValue={0.5}
              onValueChange={(value: number) => {
                setPillValue(value)
              }}
            >
              <SliderTrack className='slider-track-pill'>
                <SliderIndicator className='slider-indicator-pill' />
                <SliderThumb className='slider-thumb-pill-wrapper'>
                  <view className='slider-thumb-bar' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
```

### WithScrollView

Origin: oss

Source: `apps/examples/Slider/WithScrollView/index.tsx`

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'

import './index.css'

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

const VERTICAL_ITEMS = Array.from({ length: 8 }, (_, i) => i)

function SliderCard({ index }: { index: number }) {
  const [value, setValue] = useState(0.5)

  return (
    <view className='card'>
      <text className='card-title'>Slider {index + 1}</text>
      <text className='card-value'>{formatValue(value)}</text>
      <SliderRoot
        className='slider-root'
        defaultValue={0.5}
        onValueChange={(v: number) => {
          setValue(v)
        }}
      >
        <SliderTrack className='slider-track'>
          <SliderIndicator className='slider-indicator' />
          <SliderThumb className='slider-thumb-wrapper'>
            <view className='slider-thumb' />
          </SliderThumb>
        </SliderTrack>
      </SliderRoot>
    </view>
  )
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <text className='header'>Slider in Nested ScrollView</text>
      <scroll-view
        scroll-orientation='vertical'
        className='vertical-scroll'
      >
        {VERTICAL_ITEMS.map((i) => (
          <view className='horizontal-section' key={`section-${i}`}>
            <text className='section-title'>Section {i + 1}</text>
            <scroll-view
              scroll-orientation='horizontal'
              className='horizontal-scroll'
            >
              <view className='horizontal-content'>
                <SliderCard index={i * 3} />
                <SliderCard index={i * 3 + 1} />
                <SliderCard index={i * 3 + 2} />
              </view>
            </scroll-view>
          </view>
        ))}
      </scroll-view>
    </view>
  )
}

root.render(<App />)

export default App
```
