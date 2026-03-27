---
name: sql-guide
description: SQL Guide for Trace Analysis if you want to query trace data using raw SQL
---
# SQL Guide for Trace Analysis

This guide provides instructions on how to write SQL queries for analyzing trace data using the Perfetto trace processor.

## Table of Contents

- [Introduction](#introduction)
- [Core Tables](#core-tables)
  - [Slice and Counter Tables](#slice-and-counter-tables)
  - [Thread and Process Tables](#thread-and-process-tables)
  - [Metadata and Arguments Tables](#metadata-and-arguments-tables)
- [Common SQL Queries](#common-sql-queries)
  - [Basic Queries](#basic-queries)
  - [Time-based Queries](#time-based-queries)
  - [Aggregation Queries](#aggregation-queries)
  - [Joining Tables](#joining-tables)
- [Advanced Techniques](#advanced-techniques)
  - [Working with Arguments](#working-with-arguments)
  - [Time Conversions](#time-conversions)
  - [Subqueries and CTEs](#subqueries-and-ctes)
- [Built-in Functions and Views](#built-in-functions-and-views)
  - [Flow Analysis Functions](#flow-analysis-functions)
  - [Hierarchy Functions](#hierarchy-functions)
- [Table Relationships](#table-relationships)
- [Best Practices](#best-practices)
- [Example Queries from Real Traces](#example-queries-from-real-traces)

## Introduction

Perfetto's trace processor loads trace data into a set of SQL tables, enabling powerful and flexible analysis using standard SQL. This guide explains the key tables, relationships, and patterns to help you write effective queries for performance debugging, bottleneck identification, and system behavior analysis.

## Core Tables

### Slice Tables

The `slice` table contains all duration-based events (e.g., function calls, layout phases), while the `counter` table holds instantaneous numeric samples (e.g., CPU frequency, memory usage).

#### `slice` Table

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `id`         | INTEGER | Unique slice identifier                   |
| `ts`         | INTEGER | Start timestamp (nanoseconds)             |
| `dur`        | INTEGER | Duration (nanoseconds)                    |
| `track_id`   | INTEGER | Track this slice belongs to                |
| `name`       | TEXT    | Slice name                                |
| `depth`      | INTEGER | Nesting depth (0 = top‑level)              |
| `arg_set_id` | INTEGER | Reference to argument set in `args` table |

### Thread and Process Tables

These tables provide context for tracks and slices.

#### `thread` Table

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `utid`       | INTEGER | Unique thread ID (internal)               |
| `upid`       | INTEGER | Unique process ID (parent)                |
| `tid`        | INTEGER | OS thread ID                              |
| `name`       | TEXT    | Thread name                               |
| `arg_set_id` | INTEGER | Arguments for this thread                  |

#### `process` Table

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `upid`       | INTEGER | Unique process ID (internal)              |
| `pid`        | INTEGER | OS process ID                             |
| `name`       | TEXT    | Process name                              |
| `uid`        | INTEGER | User ID                                   |
| `arg_set_id` | INTEGER | Arguments for this process                 |

#### Track Tables

- `thread_track`: maps `track_id` (from `slice`) to a thread (`utid`).
- `process_track`: maps `track_id` to a process (`upid`).

| Table           | Key Columns                          |
|-----------------|--------------------------------------|
| `thread_track`  | `id` (track_id), `utid`              |
| `process_track` | `id` (track_id), `upid`              |

### Metadata and Arguments Tables

- `metadata`: trace‑level information (e.g., system name, tracing timestamps).
- `args`: stores key‑value arguments attached to slices, counters, threads, etc.

#### `metadata` Table

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `name`       | TEXT    | Metadata key                             |
| `str_value`  | TEXT    | String value (if any)                    |
| `int_value`  | INTEGER | Integer value (if any)                   |

#### `args` Table

| Column          | Type    | Description                              |
|-----------------|---------|------------------------------------------|
| `arg_set_id`    | INTEGER | References `arg_set_id` from other tables |
| `key`           | TEXT    | Argument name (often prefixed with "debug.") |
| `display_value` | TEXT    | Human‑readable value                     |

> 💡 Many tables contain an `arg_set_id` column; join with `args` using that field to retrieve detailed event attributes.

## Common SQL Queries

### Basic Queries

```sql
-- First 10 slices
SELECT * FROM slice LIMIT 10;

-- Slices with a specific name
SELECT * FROM slice WHERE name = 'LynxEngine::LoadTemplate' LIMIT 10;

-- Slices on a given track
SELECT * FROM slice WHERE track_id = 123 LIMIT 10;
```

### Time-based Queries

```sql
-- Slices within a time window (nanoseconds)
SELECT * FROM slice
WHERE ts BETWEEN 1000000000 AND 2000000000
LIMIT 10;

-- Long slices (duration > 10 ms)
SELECT * FROM slice
WHERE dur > 10 * 1e6
LIMIT 10;
```

### Aggregation Queries

```sql
-- Count slices by name
SELECT name, COUNT(*) AS count
FROM slice
GROUP BY name
ORDER BY count DESC;

-- Average duration by name
SELECT name, AVG(dur) AS avg_duration_ns
FROM slice
GROUP BY name
ORDER BY avg_duration_ns DESC;
```

### Joining Tables

```sql
-- Slice with thread name
SELECT s.id, s.name, s.ts, t.name AS thread_name
FROM slice s
JOIN thread_track tt ON s.track_id = tt.id
JOIN thread t ON tt.utid = t.utid
LIMIT 10;
```

## Advanced Techniques

### Working with Arguments

Arguments are stored in the `args` table, keyed by `arg_set_id`. To include them in your results:

```sql
-- Slices with a specific argument key
SELECT s.id, s.name, a.key, a.display_value
FROM slice s
JOIN args a ON s.arg_set_id = a.arg_set_id
WHERE a.key = 'debug.bundle_url'
LIMIT 10;

-- Group all arguments of a slice into a JSON-like string
SELECT s.id, s.name,
       '{' || GROUP_CONCAT(
           printf('"%s": "%s"', a.key, a.display_value),
           ', '
       ) || '}' AS args
FROM slice s
LEFT JOIN args a ON s.arg_set_id = a.arg_set_id
GROUP BY s.id
LIMIT 10;
```

### Time Conversions

Timestamps and durations are in nanoseconds. Convert to milliseconds by dividing by `1e6`:
```sql
SELECT id, name,
       ts / 1e6 AS ts_ms,
       dur / 1e6 AS dur_ms
FROM slice
LIMIT 10;
```

### Subqueries and CTEs

```sql
-- Find slice names that appear more than 10 times
WITH freq AS (
  SELECT name, COUNT(*) AS cnt
  FROM slice
  GROUP BY name
)
SELECT name, cnt
FROM freq
WHERE cnt > 10
ORDER BY cnt DESC;
```

### Built-in Functions and Views

Perfetto provides special table‑valued functions for analyzing flow events and slice hierarchies.

#### Flow Analysis Functions
These functions help trace data flow between slices (e.g., task scheduling, IPC).
- `directly_connected_flow(slice_id)`: returns immediate predecessors and successors.
- `preceding_flow(slice_id)`: returns all slices that flow into or out of the given slice (transitive).

```sql
-- Find all slices that flow into slice 123
SELECT slice_in AS slice_id
FROM directly_connected_flow(123);

-- Find all slices that precede slice 123
SELECT slice_in AS slice_id
FROM preceding_flow(123);
```

#### Hierarchy Functions
- `ancestor_slice(slice_id)`: returns the slice itself and all its ancestors (parent, grandparent, …).
- `descendant_slice(slice_id)`: returns the slice itself and all its descendants (children, grandchildren, …).

Each returns rows with the same schema as the `slice` table.
```sql
-- All ancestors of slice 123, from topmost to the slice itself
SELECT id, name, depth
FROM ancestor_slice(123)
ORDER BY depth ASC;

-- All descendants of slice 123, from the slice itself to deepest child
SELECT id, name, depth
FROM descendant_slice(123)
ORDER BY depth DESC;
```

## Table Relationships

## Table Relationships

Understanding how tables link is essential for correct joins.

| Source Table | Source Field   | Target Table   | Target Field | Description                         |
|--------------|----------------|----------------|--------------|-------------------------------------|
| `slice`      | `track_id`     | `thread_track` | `id`         | Slice belongs to a thread track     |
| `slice`      | `arg_set_id`   | `args`         | `arg_set_id` | Slice has arguments                 |
| `thread_track`| `utid`        | `thread`       | `utid`       | Thread track is owned by a thread   |
| `process_track`| `upid`       | `process`      | `upid`       | Process track is owned by a process |
| `thread`     | `upid`         | `process`      | `upid`       | Thread belongs to a process         |

## Best Practices
1. Always use LIMIT when exploring to avoid large result sets.
2. Select only needed columns – SELECT * can be heavy, especially with many arguments.
3. Leverage indexes: The slice table is indexed on ts and track_id; filter on these when possible.
4. Avoid heavy joins on large traces – if you need thread/process names, consider creating a temporary table with pre‑joined data.
5. Use aggregate functions (COUNT, AVG, SUM) to summarize instead of dumping raw events.
6. Convert units (ns → ms) early in the query for readability.
7. Test with small time windows before expanding to full trace.
8. Use CTEs to break complex queries into readable steps.

## Example Queries from Real Traces

### Slice by ID with thread name and arguments

```sql
SELECT
  s.id,
  s.ts,
  s.dur,
  s.track_id,
  s.name,
  t.name AS thread_name,
  '{' || GROUP_CONCAT(
    printf('"%s": "%s"', a.key, a.display_value),
    ', '
  ) || '}' AS args
FROM slice s
LEFT JOIN args a ON s.arg_set_id = a.arg_set_id
JOIN thread_track tt ON s.track_id = tt.id
JOIN thread t ON tt.utid = t.utid
WHERE s.id = 381;
```

### Slices in a time window with depth and thread (excluding a noisy argument)

```sql

SELECT
  s.id,
  s.track_id,
  s.ts,
  s.dur,
  s.name,
  s.depth,
  t.name AS thread_name,
  '{' || GROUP_CONCAT(
    printf('"%s": "%s"', a.key, a.display_value),
    ', '
  ) || '}' AS args
FROM slice s
LEFT JOIN args a ON s.arg_set_id = a.arg_set_id
JOIN thread_track tt ON s.track_id = tt.id
JOIN thread t ON tt.utid = t.utid
WHERE s.ts BETWEEN 1000000000 AND 2000000000
  AND a.key != 'debug.url'
GROUP BY s.id
ORDER BY s.depth, s.ts;
```

### Aggregate slice statistics over a 5‑second window

```sql
SELECT
  s.name,
  COUNT(*) AS total_count,
  SUM(dur) AS total_duration_ns,
  AVG(dur) AS avg_duration_ns,
  MAX(dur) AS max_duration_ns
FROM slice s
WHERE s.ts BETWEEN 0 AND 5e9
GROUP BY s.name
ORDER BY total_duration_ns DESC;
```

For more details, refer to the [official Perfetto SQL tables documentation](https://perfetto.dev/docs/analysis/sql-tables).