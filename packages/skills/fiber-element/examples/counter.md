# FiberElement Counter App Example

This example builds a minimal counter app directly with `@lynx-js/type-element-api`.

Read `../references/template-webpack-build.md` for `package.json`, `tsconfig.json`, `src/rspeedy-env.d.ts`, `lynx.config.js`, `plugin.js`, and run commands.

## src/main-thread.ts

```typescript
import type { RawTextElementRef } from "@lynx-js/type-element-api";

const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

let counterText: RawTextElementRef | undefined;

function createText(parentId: number, className: string, value: string) {
  const text = __CreateText(parentId);
  __SetClasses(text, className);
  const raw = __CreateRawText(value);
  __AppendElement(text, raw);
  return { text, raw };
}

function renderPage(data: Record<string, unknown>): void {
  const title = createText(pageId, "title", "FiberElement Counter");
  __AppendElement(page, title.text);

  const button = __CreateView(pageId);
  __SetClasses(button, "button");
  __AddEvent(button, "bindEvent", "tap", "increment");

  const label = createText(pageId, "button-label", "Tap");
  __AppendElement(button, label.text);
  __AppendElement(page, button);

  const counter = createText(pageId, "counter", "0");
  counterText = counter.raw;
  __AppendElement(page, counter.text);
}

function updatePage(data: Record<string, unknown>): void {
  if (!counterText) return;
  __SetAttribute(counterText, "text", String(data["count"] ?? 0));
  __FlushElementTree();
}

function getPageData(): Record<string, unknown> {
  return {};
}

function processData(data: Record<string, unknown>): Record<string, unknown> {
  return data;
}

Object.assign(globalThis, {
  renderPage,
  updatePage,
  getPageData,
  processData,
});
```

## src/background.ts

```typescript
let count = 0;

function increment(): void {
  count += 1;
  lynx.getNativeApp().callLepusMethod("updatePage", { count });
}

const previousPublishEvent = lynxCoreInject.tt.publishEvent;

lynxCoreInject.tt.publishEvent = (handlerName: string, data: EventDataType) => {
  if (handlerName === "increment") {
    increment();
    return;
  }

  previousPublishEvent?.call(lynxCoreInject.tt, handlerName, data);
};
```

## src/style.css

```css
:root {
  background-color: #101114;
  --color-text: #ffffff;
}

text {
  color: var(--color-text);
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 36px;
  font-weight: 700;
}

.button {
  margin-top: 24px;
  padding: 16px 28px;
  border-radius: 8px;
  background-color: #ff351a;
}

.button-label {
  font-size: 24px;
  font-weight: 600;
}

.counter {
  margin-top: 20px;
  font-size: 48px;
  font-weight: 700;
}
```
