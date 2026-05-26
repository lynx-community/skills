# FiberElement Todo List Example

This example shows a minimal todo list with first-screen data, background events, and patch-based updates.

Read `../references/template-webpack-build.md` for the project scaffold and `../references/double-thread-data-sync.md` for the shared double-thread flow.

## src/main-thread.ts

```javascript
const page = __CreatePage("0", 0);
const pageId = __GetElementUniqueID(page);
__SetClasses(page, "page");

let todoSlot = undefined;
let currentState = undefined;

function processData(data) {
  currentState = {
    loading: typeof data.loading === "boolean" ? data.loading : false,
    todos: Array.isArray(data.todos) ? data.todos : [],
  };
  return currentState;
}

function createTodoRow(todo) {
  const row = __CreateView(pageId);
  __SetClasses(row, todo.completed ? "todo todo-completed" : "todo");
  __SetDataset(row, { id: todo.id });
  __AddEvent(row, "bindEvent", "tap", `toggle:${todo.id}`);
  __AppendElement(row, __CreateRawText(todo.title));
  return row;
}

function renderTodos(state) {
  if (!todoSlot) return;

  const nextChildren = state.loading
    ? [__CreateRawText("Loading...")]
    : state.todos.length > 0
      ? state.todos.map(createTodoRow)
      : [__CreateRawText("No todos yet")];

  __ReplaceElements(todoSlot, nextChildren, __GetChildren(todoSlot));
}

function renderPage(data) {
  const title = __CreateText(pageId);
  __SetClasses(title, "title");
  __AppendElement(title, __CreateRawText("Todo List"));
  __AppendElement(page, title);

  const actions = __CreateView(pageId);
  __SetClasses(actions, "actions");
  __AddEvent(actions, "bindEvent", "tap", "addTodo");
  __AppendElement(actions, __CreateRawText("Add Todo"));
  __AppendElement(page, actions);

  const clearButton = __CreateView(pageId);
  __SetClasses(clearButton, "actions");
  __AddEvent(clearButton, "bindEvent", "tap", "clearCompleted");
  __AppendElement(clearButton, __CreateRawText("Clear Done"));
  __AppendElement(page, clearButton);

  todoSlot = __CreateView(pageId);
  __SetClasses(todoSlot, "todo-repeat");
  __AppendElement(page, todoSlot);

  renderTodos(data);
}

function updatePage(patch) {
  currentState = {
    ...(currentState ?? {}),
    ...patch,
  };
  renderTodos(currentState);
  __FlushElementTree();
}

Object.assign(globalThis, { processData, renderPage, updatePage });
```

## src/background.ts

```javascript
let state = {
  ...(lynxCoreInject.tt._params?.initData ?? {}),
  ...(lynxCoreInject.tt._params?.updateData ?? {}),
};

function syncState() {
  lynx.getNativeApp().callLepusMethod("updatePage", state);
}

function addTodo() {
  const nextId = String((state.todos?.length ?? 0) + 1);
  state = {
    ...state,
    todos: [
      ...(state.todos ?? []),
      { id: nextId, title: `New task ${nextId}`, completed: false },
    ],
  };
  syncState();
}

function clearCompleted() {
  state = {
    ...state,
    todos: (state.todos ?? []).filter((todo) => !todo.completed),
  };
  syncState();
}

function toggleTodo(id) {
  state = {
    ...state,
    todos: (state.todos ?? []).map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  };
  syncState();
}

function reloadTodos() {
  state = { ...state, loading: true };
  syncState();

  setTimeout(() => {
    state = { ...state, loading: false };
    syncState();
  }, 600);
}

const previousPublishEvent = lynxCoreInject.tt.publishEvent;

lynxCoreInject.tt.publishEvent = (handlerName, data) => {
  if (handlerName === "addTodo") {
    addTodo();
    return;
  }

  if (handlerName === "clearCompleted") {
    clearCompleted();
    return;
  }

  if (handlerName === "reloadTodos") {
    reloadTodos();
    return;
  }

  if (handlerName.startsWith("toggle:")) {
    toggleTodo(handlerName.slice("toggle:".length));
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
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
}

.actions {
  padding: 12px 20px;
  border-radius: 8px;
  background-color: #ff351a;
}

.todo-repeat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 360px;
}

.todo {
  padding: 14px;
  border: 1px solid #2c2f38;
  border-radius: 8px;
}

.todo-completed {
  opacity: 0.72;
}
```
