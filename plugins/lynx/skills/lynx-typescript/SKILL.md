---
name: lynx-typescript
description: |
  This Skill summarizes common TypeScript issues and their solutions in Lynx development, mainly covering environment configuration, type extending, event handling, components, and ReactLynx advanced usages.

  Trigger Scenarios:
  - User inputs TypeScript error messages related to Lynx and seeks fix suggestions
  - LSP diagnoses Lynx-related TypeScript errors, proactively invoke query to get fix solutions
  - User asks about TypeScript best practices or common errors related to Lynx, proactively invoke query to provide guidance
  - User requests to configure the TypeScript environment of the current project to support Lynx development, proactively invoke query to provide configuration steps
---

# TypeScript @ Lynx

This Skill summarizes common TypeScript issues and their solutions in Lynx development, mainly covering environment configuration, type extending, event handling, components, and ReactLynx advanced usages.

## 1. Configuration (Environment Configuration)

### 1.1 `tsconfig.json` Configuration

Rspeedy reads the `tsconfig.json` in the root directory by default. Since Rspeedy uses SWC for transpilation, it is recommended to enable the `isolatedModules` option to avoid cross-file type reference errors.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 1.2 Type Packages Installation

Ensure the correct type packages are installed. **@lynx-js/types** is the core type package for Lynx.

- **ReactLynx**: Install `@lynx-js/types` and `@lynx-js/react`.

### 1.3 Type Declaration File `rspeedy-env.d.ts`

To allow TypeScript to recognize Rspeedy's built-in features (such as CSS Modules, static resource imports), you need to create a `src/rspeedy-env.d.ts` file in the project:

```typescript title="src/rspeedy-env.d.ts"
/// <reference types="@rspeedy/core/client" />
```

*(Note: The actual package might depend on your Rspeedy setup, typically `@rspeedy/core` or similar for open source)*

### 1.4 ReactLynx JSX Configuration

For ReactLynx projects, you need to configure `jsxImportSource` as `@lynx-js/react` in `tsconfig.json` to ensure JSX is compiled correctly and gets type support.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@lynx-js/react"
  }
}
```

## 2. Extending Lynx Types

Lynx provides default type definitions, but you usually need to extend them to suit business needs.

### 2.1 GlobalProps

Extend the type of `lynx.__globalProps`:

```typescript title="src/global-props.d.ts"
declare module '@lynx-js/types' {
  interface GlobalProps {
    appTheme: string;
    title: string;
    // Add other custom global properties
  }
}
export {};
```
This way, there will be type hints when using `lynx.__globalProps.appTheme`.

### 2.2 InitData

Extend the return value type of the ReactLynx Hook `useInitData()`:

```typescript title="src/init-data.d.ts"
declare module '@lynx-js/react' {
  interface InitData {
    userInfo: {
      name: string;
      id: number;
    };
    // Add other initialization data properties
  }
}
export {};
```
This way, there will be type hints when using `useInitData().userInfo`.

### 2.3 IntrinsicElements (Custom Native Components)

If custom native components are used, you need to extend `IntrinsicElements` to get JSX type checking:

```typescript title="src/intrinsic-element.d.ts"
import type * as Lynx from '@lynx-js/types';
import type { CSSProperties } from '@lynx-js/types';

declare module '@lynx-js/types' {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    'custom-input': {
      'bindcustom-event'?: (e: { type: 'custom-event'; detail: { value: string } }) => void;
      value?: string;
      class?: string;
      className?: string;
      style?: string | CSSProperties;
    };
  }
}
```

### 2.4 NativeModules

Extend the `NativeModules` type to support custom Native Module calls:

```typescript title="src/native-modules.d.ts"
declare module '@lynx-js/types' {
  interface NativeModules {
    NativeLocalStorageModule: {
      getStorageItem(key: string): string | null;
      setStorageItem(key: string, value: string): void;
    };
  }
}
export {};
```

### 2.5 Lynx Global Object

Extend the type of the `lynx` global object (e.g., adding a custom method `lynx.myMethod`):

```typescript title="src/lynx-global.d.ts"
declare module '@lynx-js/types' {
  interface Lynx {
    myMethod(param: string): void;
    customProperty: number;
  }
}
export {};
```
This way, there will be type hints when using `lynx.myMethod('test')`.

## 3. Event Handling

When handling events, you should avoid using the `any` type. Lynx provides standard event types.

### 3.1 Basic Events and Touch Events

For touch events (like `bindtap`, `bindtouchstart`), the event object contains properties like `detail`, `touches`, `changedTouches`.

```typescript
// Example: Handling a tap event
const handleTap = (event: any) => { // Using any is not recommended
  console.log(event);
};

// Recommended approach: Define event interfaces or use inferred types
import type { TouchEvent } from '@lynx-js/types';

// Usage example
const handleButtonTap = (e: TouchEvent) => {
  const { dataset } = e.currentTarget;
  console.log('Tapped!', dataset);
};
```

## 4. ReactLynx & LynxUI Types

### 4.1 LynxUI Component Types

LynxUI components usually export the type definitions for their Props and Ref. When using components from `@lynx-js/lynx-ui` (or its sub-packages like `@lynx-js/lynx-ui-button`, `@lynx-js/lynx-ui-scroll-view`, etc.), you should use these exported types.

**Best Practices:**
1. Explicitly import Props and Ref types.
2. Specify the Ref type when using `useRef`.

```typescript
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view';
import type { ScrollViewRef, ScrollViewProps } from '@lynx-js/lynx-ui-scroll-view';
import { useRef } from '@lynx-js/react';

function App() {
  // Explicitly specify the Ref type
  const scrollViewRef = useRef<ScrollViewRef>(null);

  const handleScroll: ScrollViewProps['onScroll'] = (e) => {
    console.log('Scrolled:', e.detail);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      // ...
    />
  );
}
```

### 4.2 MainThreadRef and Multi-threading APIs

ReactLynx provides dedicated APIs for handling main thread state.

```typescript
import { useMainThreadRef, runOnMainThread } from '@lynx-js/react';

function AnimationComponent() {
  // Define the data type stored in MainThreadRef
  const widthRef = useMainThreadRef<number>(0);

  const handleTap = () => {
    // Call main thread logic from the background thread
    runOnMainThread(widthRef, (ref) => {
      // This callback executes on the main thread
      ref.current += 10;
      console.log('New width:', ref.current);
    });
  };

  return <view bindtap={handleTap} />;
}
```

### 4.3 Lynx Global Object

The `lynx` global object provides methods like `querySelector`.

```typescript
// Select element
const element = lynx.querySelector('#my-id');
// The type of element is Element | null

// Register data processors (functional)
lynx.registerDataProcessors({
  defaultDataProcessor: (data) => {
    return data;
  }
});
```

## 5. Common Error Fix Guide

- **Error: Property '...' does not exist on type 'GlobalProps'**
  -> Refer to [2.1 GlobalProps](#21-globalprops) for type extension.

- **Error: Property '...' does not exist on type 'InitData'**
  -> Refer to [2.2 InitData](#22-initdata) for type extension.

- **Error: Property '...' does not exist on type 'JSX.IntrinsicElements'**
  -> Refer to [2.3 IntrinsicElements (Custom Native Components)](#23-intrinsicelements-custom-native-components) for type extension.
  -> Also check if conflicting type packages are installed.

- **Error: Property 'cancelAnimationFrame' does not exist on type 'UnsafeLynx'** or **CSSProperties not assignable**
  -> **Cause**: Usually caused by installing multiple conflicting Lynx type packages.
  -> **Solution**: Check `package.json`, remove unnecessary type packages, ensuring only `@lynx-js/types` along with `@lynx-js/react` are kept.

- **Error: Cannot find module '...' or its corresponding type declarations**
  -> Check if `paths` is configured (refer to [1.1](#11-tsconfigjson-configuration)) or if `d.ts` definitions are missing.

- **Error: 'lynx' is not defined**
  -> Ensure the project contains the reference `import {} from "@lynx-js/react"`.

- When using `declare module '@lynx-js/types'` in a `d.ts` file, make sure to export an empty object `export {}` to avoid global pollution.