# FiberElement Counter App Example

This example shows the smallest counter app built with `@lynx-js/type-element-api`.

Read `../references/template-webpack-build.md` for the project scaffold.

## src/main-thread.ts

```javascript
const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

let counterText = undefined;

function processData(data) {
  return {
    count: typeof data.count === "number" ? data.count : 0,
  };
}

function renderPage(data) {
  const title = __CreateText(pageId);
  __SetClasses(title, "title");
  __AppendElement(title, __CreateRawText("FiberElement Counter"));
  __AppendElement(page, title);

  const button = __CreateView(pageId);
  __SetClasses(button, "button");
  __AddEvent(button, "bindEvent", "tap", "increment");
  __AppendElement(button, __CreateRawText("Tap"));
  __AppendElement(page, button);

  const counter = __CreateText(pageId);
  __SetClasses(counter, "counter");
  __AppendElement(counter, __CreateRawText(String(data.count)));
  counterText = counter;
  __AppendElement(page, counter);
}

function updatePage(patch) {
  if (counterText && patch.count !== undefined) {
    __SetAttribute(counterText, "text", String(patch.count));
  }
  __FlushElementTree();
}

Object.assign(globalThis, { processData, renderPage, updatePage });
```

## src/background.ts

```javascript
let count = 0;

function increment() {
  count += 1;
  lynx.getNativeApp().callLepusMethod("updatePage", { count });
}

const previousPublishEvent = lynxCoreInject.tt.publishEvent;

lynxCoreInject.tt.publishEvent = (handlerName, data) => {
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
}

text {
  color: #ffffff;
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

.counter {
  margin-top: 20px;
  font-size: 48px;
  font-weight: 700;
}
```
