# @lynx-js/trace-processor

A WebAssembly build of the [Perfetto Trace Processor](https://perfetto.dev/docs/analysis/trace-processor) providing a JavaScript API for querying Perfetto traces in Node.js.

## Installation

```bash
pnpm add @lynx-js/trace-processor
```

## Usage

```typescript
import { WasmEngine } from "@lynx-js/trace-processor";

// Create an engine instance
using engine = new WasmEngine("my-engine");

// Load a trace file
await engine.parse(traceData);
engine.notifyEof();

// Execute SQL queries
const result = await engine.query("SELECT * FROM slice LIMIT 10");
```

## API

### `WasmEngine`

The main class for interacting with the Perfetto Trace Processor.

#### Constructor

```typescript
new WasmEngine(id: string)
```

- `id` - A unique identifier for the engine instance

#### Methods

- `parse(data: Uint8Array)` - Load trace data into the engine
- `notifyEof()` - Notify the engine that all trace data has been loaded
- `query(sql: string)` - Execute a SQL query and return results
- `tryQuery(sql: string)` - Execute a SQL query and return `Result<QueryResult>`
- `[Symbol.dispose]()` - Clean up resources

### `QueryResult`

The result object returned by `query()` and `tryQuery()`.

#### Methods

- `columns(): string[]` - Get array of column names
- `numRows(): number` - Get total number of rows
- `error(): string | undefined` - Get error message if query failed
- `iter(spec: object)` - Create an iterator over the rows

#### Iterating Results

```typescript
const result = await engine.query("SELECT ts, dur, name FROM slice LIMIT 10");
const columns = result.columns();

for (const it = result.iter({}); it.valid(); it.next()) {
  const row: Record<string, unknown> = {};
  for (const name of columns) {
    row[name] = it.get(name);
  }
  console.log(row);
}
```

#### Iterator Methods

- `valid(): boolean` - Check if iterator points to a valid row
- `next()` - Move to the next row
- `get(column: string): SqlValue` - Get value by column name

`SqlValue` can be `string | number | bigint | Uint8Array | null`.

## Requirements

- Node.js >= 18

## How It Works

This package bundles the Perfetto Trace Processor WebAssembly module along with JavaScript bindings extracted from the [Perfetto UI](https://ui.perfetto.dev). The `prepare` script downloads the latest release and rebuilds the necessary modules for Node.js compatibility.

## License

The vendored Perfetto code is licensed under the [Apache License 2.0](https://github.com/google/perfetto/blob/master/LICENSE).
