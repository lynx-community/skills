---
name: InputOTP
description: Build headless, configurable-length OTP, PIN, and verification-code inputs with lynx-ui InputOTP.
---

# lynx-ui InputOTP

## Requirements

InputOTP requires Lynx SDK 4.0 or newer.

## Core capabilities

InputOTP owns value and keyboard behavior through one hidden native input.
Consumers compose the visible interface with InputOTPSlot. It supports:

- A configurable positive number of numeric, alphabetic, or alphanumeric ASCII
  characters.
- Controlled and uncontrolled values.
- Completion, focus, and blur callbacks.
- Imperative focus, blur, set, clear, and read methods.
- Consumer-defined slot layout, separators, masking, caret, themes, and RTL.
- Typed `ui-*` state variants and render props without visible package CSS.

## Minimal example

```tsx
import { useState } from '@lynx-js/react'
import { InputOTP, InputOTPSlot } from '@lynx-js/lynx-ui'

function VerificationCode() {
  const [code, setCode] = useState('')

  return (
    <InputOTP
      autoFocus
      length={6}
      value={code}
      onChange={setCode}
      onComplete={(completeCode) => {
        console.log('verify', completeCode)
      }}
    >
      {Array.from(
        { length: 6 },
        (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className='otp-slot'
          />
        ),
      )}
    </InputOTP>
  )
}
```

## Usage guidance

- Render one InputOTPSlot for every configured index.
- Pass a positive integer to `length`; invalid values fall back to six slots.
- Use `inputType="numeric"`, `"alphabetic"`, or `"alphanumeric"` to choose
  both the native keyboard and accepted ASCII characters.
- Prefer controlled mode when a parent submits, validates, or resets the
  value.
- Use `InputOTPRef.clear()` to reset an uncontrolled field. In controlled
  mode, update the value prop from `onChange`.
- Treat `onComplete` as a readiness signal and keep network submission in the
  parent.
- Implement masking with the InputOTPSlot render function. The original value
  remains available to InputOTP callbacks.
- Insert separator nodes directly between InputOTPSlot children.
- Use `className` and `style` for base slot styling. On the root, target
  `ui-focused`, `ui-complete`, `ui-disabled`, and `ui-invalid`. On slots,
  target `ui-focused`, `ui-filled`, `ui-complete`, `ui-disabled`, and
  `ui-invalid`. Use the slot render function when custom character or caret
  nodes need their own presentation.
- Apply `direction: rtl` to the outer container and let descendants inherit it.

## Masked slot example

```tsx
<InputOTPSlot index={0}>
  {({ filled }) =>
    filled ? <text>•</text> : null}
</InputOTPSlot>
```

## Component roles

- `InputOTP`: owns the native input, normalized value, callbacks, and context.
- `InputOTPSlot`: consumes a zero-based character index and renders either the
  default character/caret nodes or custom render-prop content.
