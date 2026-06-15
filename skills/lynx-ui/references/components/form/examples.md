## Examples

### Basic

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  CheckboxIndicator,
  FormField,
  FormRoot,
  FormSubmitButton,
  Radio,
  RadioIndicator,
  ScrollView,
} from '@lynx-js/lynx-ui'

import { formPageData } from './data'

import './index.css'

function App() {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <ScrollView scrollOrientation='vertical' className='demo-canvas'>
        <FormRoot
          onChanged={(values: Record<string, unknown>) => {
            setFormValues(values)
            setSubmitted(false)
          }}
          initialValues={{
            workspaceType: formPageData.workspaceTypeOptions[0]?.value ?? '',
            workspaceName: 'My Workspace',
            description: 'A place for collaboration',
          }}
        >
          <view className='form-container'>
            <text className='form-title'>{formPageData.title}</text>
            <text className='form-subtitle'>{formPageData.subtitle}</text>

            <view className='form-divider' />

            <text className='form-section-title'>Workspace type</text>
            <FormField as='RadioGroupRoot' name='workspaceType'>
              <view className='radio-group-container'>
                {formPageData.workspaceTypeOptions.map(({ label, value }) => (
                  <Radio className='radio-item' key={value} value={value}>
                    <RadioIndicator className='radio-indicator'>
                      <view className='radio-indicator-checked-item' />
                    </RadioIndicator>
                    <text className='form-label'>{label}</text>
                  </Radio>
                ))}
              </view>
            </FormField>

            <view className='form-divider' />

            <text className='form-section-title'>Workspace name</text>
            <view className='input-container'>
              <FormField
                as='Input'
                name='workspaceName'
                className='form-input'
              />
            </view>

            <text className='form-section-title'>Description</text>
            <view className='input-container'>
              <FormField as='Input' name='description' className='form-input' />
            </view>

            <view className='form-divider' />

            <FormField as='Checkbox' name='agreement' className='checkbox-item'>
              <CheckboxIndicator className='checkbox-indicator'>
                <view className='checkbox-indicator-checked-item' />
              </CheckboxIndicator>
              <text className='form-label'>
                I agree to the terms and conditions
              </text>
            </FormField>

            <FormSubmitButton
              onSubmit={(e) => {
                console.info(e)
                setSubmitted(true)
              }}
              className='submit-button'
            >
              <text className='submit-button-text'>Submit</text>
            </FormSubmitButton>

            <view className='form-divider' />

            {submitted && (
              <text className='form-submitted-hint'>Submitted ✓</text>
            )}
            <text className='form-values-display'>
              {JSON.stringify(formValues, null, 2)}
            </text>
          </view>
        </FormRoot>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
```

### KeyboardAware

```tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  FormField,
  FormRoot,
  FormSubmitButton,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
} from '@lynx-js/lynx-ui'

import { demoItems } from './data'

import './index.css'

const initialValues = Object.fromEntries(
  demoItems
    .filter(
      (item) => item.type === 'input' || item.type === 'textarea',
    )
    .map((item) => [item.name, '']),
) as Record<string, string>

function App() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(
    null,
  )

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <FormRoot
          initialValues={initialValues}
        >
          <KeyboardAwareResponder as='ScrollView' className='demo-canvas'>
            <view className='form-container'>
              <text className='form-title'>Keyboard-aware Form</text>
              <text className='form-subtitle'>
                Form fields stay visible while typing in a long scroll.
              </text>

              <view className='form-divider' />

              {demoItems.map((item) => {
                if (item.type === 'block') {
                  return <view key={item.key} className='block' />
                }

                if (item.type === 'input') {
                  return (
                    <KeyboardAwareTrigger key={item.key} offset={0}>
                      <view className='form-card'>
                        <text className='form-label'>{item.label}</text>
                        <view className='input-container'>
                          <FormField
                            as='Input'
                            name={item.name}
                            className='form-input'
                            placeholder={item.placeholder}
                          />
                        </view>
                      </view>
                    </KeyboardAwareTrigger>
                  )
                }

                return (
                  <KeyboardAwareTrigger key={item.key} offset={0}>
                    <view className='form-card'>
                      <text className='form-label'>{item.label}</text>
                      <view className='form-textarea-wrap'>
                        <FormField
                          as='TextArea'
                          name={item.name}
                          className='form-textarea'
                          placeholder={item.placeholder}
                          maxLines={12}
                          maxLength={600}
                        />
                      </view>
                    </view>
                  </KeyboardAwareTrigger>
                )
              })}

              <view className='form-divider' />

              <FormSubmitButton
                className='submit-button'
                onSubmit={(values) => setSubmitted(values)}
              >
                <text className='submit-button-text'>Submit</text>
              </FormSubmitButton>

              {submitted
                ? (
                  <view className='form-values-display'>
                    <text className='form-values-text'>
                      {JSON.stringify(submitted, null, 2)}
                    </text>
                  </view>
                )
                : null}

              <view className='bottom-spacer' />
            </view>
          </KeyboardAwareResponder>
        </FormRoot>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)
export default App
```
