# Todo List Composition Example

This example shows how to compose the focused FiberElement demos into a todo list. It assumes the project scaffold from `../references/template-webpack-build.md` and avoids repeating common helpers from references.

Read these first:

- `../references/main-thread-rendering.md` for page setup, `createText`, `replaceChildren`, and lifecycle shape.
- `condition.md` for loading and empty-state slot replacement.
- `repeat.md` for repeated todo rows.
- `../references/double-thread-data-sync.md` for first-screen data, background updates, and double-thread synchronization.

## Data Contract

Place this in `src/types.ts` and import it from both threads.

```typescript
export type Filter = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export interface RenderState {
  loading?: boolean;
  filter?: Filter;
  todos?: Todo[];
}
```

## Main Thread Composition

The todo main thread is just three stable slots:

- summary slot: derived counts and loading state
- filters slot: selected filter buttons
- repeat slot: loading, empty, or visible todo rows

Use the shared page setup and helpers from `../references/main-thread-rendering.md`.

```typescript
import type { ElementRef } from '@lynx-js/type-element-api';
import type { Filter, RenderState, Todo } from './types.js';

let summarySlot: ElementRef | undefined;
let filtersSlot: ElementRef | undefined;
let repeatSlot: ElementRef | undefined;
let currentState: Required<RenderState> | undefined;

const DEFAULT_TODOS: Todo[] = [
  { id: '1', title: 'Create the FiberElement project', completed: true },
  { id: '2', title: 'Render todos with Element PAPI', completed: false },
  { id: '3', title: 'Handle tap events in background.ts', completed: false },
];

function isFilter(value: unknown): value is Filter {
  return value === 'all' || value === 'active' || value === 'completed';
}

function normalizeState(data: RenderState | Record<string, unknown>): Required<RenderState> {
  const raw = data as Record<string, unknown>;

  return {
    loading: Boolean(raw['loading']),
    filter: isFilter(raw['filter']) ? raw['filter'] : 'all',
    todos: Array.isArray(raw['todos']) ? (raw['todos'] as Todo[]) : DEFAULT_TODOS,
  };
}

function mergeState(patch: RenderState): Required<RenderState> {
  currentState = normalizeState({
    ...(currentState ?? {}),
    ...patch,
  });
  return currentState;
}

function visibleTodos(state: Required<RenderState>): Todo[] {
  if (state.filter === 'active') {
    return state.todos.filter((todo) => !todo.completed);
  }

  if (state.filter === 'completed') {
    return state.todos.filter((todo) => todo.completed);
  }

  return state.todos;
}
```

Render each slot independently so background diff updates can merge into local state without special cases.

```typescript
function createButton(className: string, label: string, handlerName: string): ElementRef {
  const button = __CreateView(pageId);
  __SetClasses(button, className);
  __AddEvent(button, 'bindEvent', 'tap', handlerName);
  __AppendElement(button, createText('button-label', label));
  return button;
}

function renderSummary(state: Required<RenderState>): void {
  if (!summarySlot) return;

  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const active = total - completed;
  const summary = __CreateView(pageId);
  __SetClasses(summary, state.loading ? 'summary summary-loading' : 'summary');
  __AppendElement(
    summary,
    createText(
      'summary-title',
      state.loading ? 'Refreshing todos...' : `${active} active, ${completed} done`,
    ),
  );
  __AppendElement(summary, createText('summary-meta', `${total} total tasks`));
  replaceChildren(summarySlot, [summary]);
}

function renderFilters(state: Required<RenderState>): void {
  if (!filtersSlot) return;

  const filters = __CreateView(pageId);
  __SetClasses(filters, 'filters');
  const options: Array<{ label: string; value: Filter }> = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Done', value: 'completed' },
  ];

  for (const option of options) {
    __AppendElement(
      filters,
      createButton(
        state.filter === option.value ? 'filter filter-selected' : 'filter',
        option.label,
        `filter:${option.value}`,
      ),
    );
  }
  replaceChildren(filtersSlot, [filters]);
}

function createTodoRow(todo: Todo): ElementRef {
  const row = __CreateView(pageId);
  __SetClasses(row, todo.completed ? 'todo todo-completed' : 'todo');
  __SetDataset(row, { id: todo.id });
  __AddEvent(row, 'bindEvent', 'tap', `toggle:${todo.id}`);
  __AppendElement(row, createText('todo-title', todo.title));
  __AppendElement(
    row,
    createText('todo-meta', todo.completed ? 'Completed' : 'Tap to complete'),
  );
  return row;
}

function renderTodos(state: Required<RenderState>): void {
  if (!repeatSlot) return;

  if (state.loading) {
    replaceChildren(repeatSlot, [createText('repeat-message', 'Loading tasks...')]);
    return;
  }

  const todos = visibleTodos(state);
  replaceChildren(
    repeatSlot,
    todos.length > 0
      ? todos.map(createTodoRow)
      : [createText('empty-title', 'No tasks yet')],
  );
}
```

Wire the composed slots into the shared lifecycle shape:

```typescript
function renderState(state: Required<RenderState>): void {
  renderSummary(state);
  renderFilters(state);
  renderTodos(state);
}

function renderPage(data: RenderState): void {
  __AppendElement(page, createText('title', 'Todo List'));

  const actions = __CreateView(pageId);
  __SetClasses(actions, 'actions');
  __AppendElement(actions, createButton('button button-primary', 'Reload', 'reloadTodos'));
  __AppendElement(actions, createButton('button', 'Add', 'addTodo'));
  __AppendElement(actions, createButton('button button-danger', 'Clear Done', 'clearCompleted'));
  __AppendElement(page, actions);

  summarySlot = __CreateView(pageId);
  filtersSlot = __CreateView(pageId);
  repeatSlot = __CreateView(pageId);
  __SetClasses(summarySlot, 'summary-slot');
  __SetClasses(filtersSlot, 'filters-slot');
  __SetClasses(repeatSlot, 'todo-repeat');
  __AppendElement(page, summarySlot);
  __AppendElement(page, filtersSlot);
  __AppendElement(page, repeatSlot);

  renderState(mergeState(data));
}
```

## Background Composition

Use `../references/double-thread-data-sync.md` for the shared `readInitialState`, `setRenderState`, `syncState`, diff patch generation, `updateCardData`, and `publishEvent` wrapper. Todo-specific behavior is the mutation set below.

```typescript
import type { Filter, RenderState, Todo } from './types.js';

let renderState = readInitialState();

function addTodo(): void {
  const nextId = String(renderState.todos.length + 1);
  setRenderState({
    todos: [
      ...renderState.todos,
      { id: nextId, title: `New task ${nextId}`, completed: false },
    ],
  });
  syncState();
}

function clearCompleted(): void {
  setRenderState({
    todos: renderState.todos.filter((todo) => !todo.completed),
  });
  syncState();
}

function setFilter(filter: Filter): void {
  setRenderState({ filter });
  syncState();
}

function toggleTodo(id: string): void {
  setRenderState({
    todos: renderState.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  });
  syncState();
}

function reloadTodos(): void {
  setRenderState({ loading: true });
  syncState();

  setTimeout(() => {
    setRenderState({ loading: false });
    syncState();
  }, 600);
}
```

Hook those mutations into the shared `publishEvent` wrapper:

```typescript
function handleTodoEvent(handlerName: string): boolean {
  if (handlerName === 'reloadTodos') {
    reloadTodos();
    return true;
  }

  if (handlerName === 'addTodo') {
    addTodo();
    return true;
  }

  if (handlerName === 'clearCompleted') {
    clearCompleted();
    return true;
  }

  if (handlerName.startsWith('filter:')) {
    const filter = handlerName.slice('filter:'.length);
    if (filter === 'all' || filter === 'active' || filter === 'completed') {
      setFilter(filter);
    }
    return true;
  }

  if (handlerName.startsWith('toggle:')) {
    toggleTodo(handlerName.slice('toggle:'.length));
    return true;
  }

  return false;
}
```

## CSS Scope

Keep todo styling scoped to the classes created by this composition. Do not redefine global `text`, `page`, or shared button defaults if the consuming app already owns them.

```css
.actions {
  margin-top: 24px;
  display: flex;
  gap: 10px;
}

.summary,
.filters,
.todo-repeat {
  margin-top: 16px;
}

.summary {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.summary-loading {
  border-color: var(--color-primary);
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-selected {
  background-color: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.todo-repeat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.todo-completed {
  opacity: 0.72;
}

.empty-title,
.repeat-message {
  color: var(--color-muted);
}
```
