// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';

const DEFAULT_MAX_QUERY_ROWS = 1_000;
const EVENT_SUMMARY_SQL = `SELECT name, COUNT(*) AS count
FROM slice
WHERE name IS NOT NULL AND name <> ''
GROUP BY name
ORDER BY count DESC, name ASC`;

export type TraceFailurePhase = 'processor' | 'parse' | 'query';
export type SerializedSqlValue = string | number | null | { base64: string };

interface TraceProcessorIterator {
  valid(): boolean;
  next(): void;
  get(column: string): unknown;
}

interface TraceProcessorQueryResult {
  columns(): string[];
  numRows(): number;
  error(): string | undefined;
  iter(spec: Record<string, never>): TraceProcessorIterator;
}

interface TraceProcessorEngine {
  parse(data: Uint8Array): Promise<void>;
  notifyEof(): Promise<void> | void;
  query(sql: string): Promise<TraceProcessorQueryResult>;
  [Symbol.dispose](): void;
}

export type TraceProcessorEngineFactory = (
  id: string,
) => Promise<TraceProcessorEngine>;

export interface TraceFileIdentity {
  path: string;
  bytes: number;
  sha256: string;
}

export interface TraceSqlDescriptor {
  source: 'inline' | 'file';
  text: string;
  sha256: string;
  filePath?: string;
}

export interface TraceInspectionError {
  phase: TraceFailurePhase;
  message: string;
}

export interface TraceQuerySuccess {
  success: true;
  parseSucceeded: true;
  trace: TraceFileIdentity;
  query: TraceSqlDescriptor;
  columns: string[];
  totalRows: number;
  returnedRows: number;
  truncated: boolean;
  rows: Array<Record<string, SerializedSqlValue>>;
}

export interface TraceQueryFailure {
  success: false;
  parseSucceeded: boolean;
  trace: TraceFileIdentity;
  query: TraceSqlDescriptor;
  error: TraceInspectionError;
}

export type TraceQueryResult = TraceQuerySuccess | TraceQueryFailure;

export interface TraceEventCount {
  name: string;
  count: number;
}

export interface TraceEventSummarySuccess {
  success: true;
  parseSucceeded: true;
  trace: TraceFileIdentity;
  eventSource: 'slice.name';
  totalEvents: number;
  uniqueEventNames: number;
  events: TraceEventCount[];
}

export interface TraceEventSummaryFailure {
  success: false;
  parseSucceeded: boolean;
  trace: TraceFileIdentity;
  eventSource: 'slice.name';
  error: TraceInspectionError;
}

export type TraceEventSummaryResult =
  | TraceEventSummarySuccess
  | TraceEventSummaryFailure;

interface TraceQueryCommandOptions {
  sql?: string;
  sqlFile?: string;
  maxRows: number;
  output?: string;
}

interface TraceEventSummaryCommandOptions {
  json?: boolean;
  output?: string;
}

async function createTraceProcessorEngine(
  id: string,
): Promise<TraceProcessorEngine> {
  const { WasmEngine } = await import('@lynx-js/trace-processor');
  return new WasmEngine(id) as unknown as TraceProcessorEngine;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sha256(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

async function readTraceFile(
  tracePath: string,
): Promise<{ data: Uint8Array; identity: TraceFileIdentity }> {
  const absolutePath = path.resolve(tracePath);
  const data = await fs.readFile(absolutePath);
  return {
    data,
    identity: {
      path: absolutePath,
      bytes: data.byteLength,
      sha256: sha256(data),
    },
  };
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

function validateRowCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Unexpected Perfetto row count: ${String(value)}`);
  }
  return value;
}

function serializeSqlValue(value: unknown): SerializedSqlValue {
  if (value === null || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError(`Unexpected non-finite SQL number: ${String(value)}`);
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array)
    return { base64: Buffer.from(value).toString('base64') };
  throw new TypeError(`Unexpected SQL value: ${String(value)}`);
}

function readRows(
  result: TraceProcessorQueryResult,
  columns: string[],
  maxRows: number,
): Array<Record<string, SerializedSqlValue>> {
  const rows: Array<Record<string, SerializedSqlValue>> = [];
  const iterator = result.iter({});
  while (iterator.valid() && rows.length < maxRows) {
    const row: Record<string, SerializedSqlValue> = {};
    for (const column of columns)
      row[column] = serializeSqlValue(iterator.get(column));
    rows.push(row);
    iterator.next();
  }
  return rows;
}

function requireQuerySuccess(result: TraceProcessorQueryResult): void {
  const queryError = result.error();
  if (queryError) throw new Error(`Perfetto SQL query failed: ${queryError}`);
}

function createSqlDescriptor(
  sql: string,
  sqlFile?: string,
): TraceSqlDescriptor {
  const filePath = sqlFile === undefined ? undefined : path.resolve(sqlFile);
  return {
    source: filePath === undefined ? 'inline' : 'file',
    text: sql,
    sha256: sha256(sql),
    ...(filePath === undefined ? {} : { filePath }),
  };
}

function queryFailure(
  trace: TraceFileIdentity,
  query: TraceSqlDescriptor,
  parseSucceeded: boolean,
  phase: TraceFailurePhase,
  error: unknown,
): TraceQueryFailure {
  return {
    success: false,
    parseSucceeded,
    trace,
    query,
    error: { phase, message: errorMessage(error) },
  };
}

function eventSummaryFailure(
  trace: TraceFileIdentity,
  parseSucceeded: boolean,
  phase: TraceFailurePhase,
  error: unknown,
): TraceEventSummaryFailure {
  return {
    success: false,
    parseSucceeded,
    trace,
    eventSource: 'slice.name',
    error: { phase, message: errorMessage(error) },
  };
}

export async function runTraceQuery(
  tracePath: string,
  sql: string,
  options: {
    maxRows?: number;
    sqlFile?: string;
    engineFactory?: TraceProcessorEngineFactory;
  } = {},
): Promise<TraceQueryResult> {
  const { data, identity } = await readTraceFile(tracePath);
  const query = createSqlDescriptor(sql, options.sqlFile);
  const maxRows = options.maxRows ?? DEFAULT_MAX_QUERY_ROWS;
  if (!Number.isSafeInteger(maxRows) || maxRows <= 0) {
    throw new TypeError(
      `maxRows must be a positive integer, received ${String(maxRows)}`,
    );
  }
  const engineFactory = options.engineFactory ?? createTraceProcessorEngine;
  let engine: TraceProcessorEngine | undefined;
  let parseSucceeded = false;
  let phase: TraceFailurePhase = 'processor';

  try {
    engine = await engineFactory(`agent-lynx-query-${randomUUID()}`);
    phase = 'parse';
    await engine.parse(data);
    await engine.notifyEof();
    parseSucceeded = true;
    phase = 'query';
    const result = await engine.query(sql);
    requireQuerySuccess(result);
    const columns = result.columns();
    const totalRows = validateRowCount(result.numRows());
    const rows = readRows(result, columns, maxRows);
    return {
      success: true,
      parseSucceeded: true,
      trace: identity,
      query,
      columns,
      totalRows,
      returnedRows: rows.length,
      truncated: rows.length < totalRows,
      rows,
    };
  } catch (error) {
    return queryFailure(identity, query, parseSucceeded, phase, error);
  } finally {
    try {
      engine?.[Symbol.dispose]();
    } catch {
      // Disposing the local WASM worker must not hide the parse/query result.
    }
  }
}

function toSafeCount(value: unknown, eventName: string): number {
  const count = typeof value === 'bigint' ? Number(value) : value;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
    throw new TypeError(
      `Unexpected count for trace event ${eventName}: ${String(value)}`,
    );
  }
  return count;
}

export async function runTraceEventSummary(
  tracePath: string,
  options: { engineFactory?: TraceProcessorEngineFactory } = {},
): Promise<TraceEventSummaryResult> {
  const { data, identity } = await readTraceFile(tracePath);
  const engineFactory = options.engineFactory ?? createTraceProcessorEngine;
  let engine: TraceProcessorEngine | undefined;
  let parseSucceeded = false;
  let phase: TraceFailurePhase = 'processor';

  try {
    engine = await engineFactory(`agent-lynx-event-summary-${randomUUID()}`);
    phase = 'parse';
    await engine.parse(data);
    await engine.notifyEof();
    parseSucceeded = true;
    phase = 'query';
    const result = await engine.query(EVENT_SUMMARY_SQL);
    requireQuerySuccess(result);
    const events: TraceEventCount[] = [];
    const iterator = result.iter({});
    while (iterator.valid()) {
      const name = iterator.get('name');
      if (typeof name !== 'string') {
        throw new TypeError(`Unexpected trace event name: ${String(name)}`);
      }
      events.push({ name, count: toSafeCount(iterator.get('count'), name) });
      iterator.next();
    }
    const totalEvents = events.reduce((total, event) => total + event.count, 0);
    if (!Number.isSafeInteger(totalEvents)) {
      throw new TypeError(
        `Trace event total exceeds the safe integer range: ${String(totalEvents)}`,
      );
    }
    return {
      success: true,
      parseSucceeded: true,
      trace: identity,
      eventSource: 'slice.name',
      totalEvents,
      uniqueEventNames: events.length,
      events,
    };
  } catch (error) {
    return eventSummaryFailure(identity, parseSucceeded, phase, error);
  } finally {
    try {
      engine?.[Symbol.dispose]();
    } catch {
      // Disposing the local WASM worker must not hide the parse/query result.
    }
  }
}

export function renderTraceEventSummary(
  result: TraceEventSummarySuccess,
): string {
  let countWidth = 'COUNT'.length;
  for (const event of result.events)
    countWidth = Math.max(countWidth, String(event.count).length);
  const rows = result.events.map((event) => {
    const name = event.name.replace(/[\t\r\n]+/gu, ' ');
    return `${String(event.count).padStart(countWidth)}  ${name}`;
  });
  return [
    `Trace: ${result.trace.path}`,
    `SHA-256: ${result.trace.sha256}`,
    `Total slice events: ${result.totalEvents}`,
    `Unique event names: ${result.uniqueEventNames}`,
    '',
    `${'COUNT'.padStart(countWidth)}  EVENT NAME`,
    `${'-'.repeat(countWidth)}  ${'-'.repeat('EVENT NAME'.length)}`,
    ...rows,
  ].join('\n');
}

async function readSql(
  options: TraceQueryCommandOptions,
): Promise<{ sql: string; sqlFile?: string }> {
  const hasInlineSql = options.sql !== undefined;
  const hasSqlFile = options.sqlFile !== undefined;
  if (hasInlineSql === hasSqlFile) {
    throw new Error('Use exactly one of --sql or --sql-file.');
  }

  if (options.sqlFile !== undefined) {
    const sqlFile = path.resolve(options.sqlFile);
    const sql = await fs.readFile(sqlFile, 'utf8');
    if (!sql.trim()) throw new Error(`SQL file is empty: ${sqlFile}`);
    return { sql, sqlFile };
  }

  const sql = options.sql!;
  if (!sql.trim()) throw new Error('--sql cannot be empty.');
  return { sql };
}

async function writeOutput(output: string, contents: string): Promise<string> {
  const outputPath = path.resolve(output);
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${randomUUID()}.tmp`,
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await fs.writeFile(temporaryPath, contents, { flag: 'wx' });
    await fs.rename(temporaryPath, outputPath);
    return outputPath;
  } finally {
    await fs.unlink(temporaryPath).catch(() => {});
  }
}

async function emitResult(
  result: TraceQueryResult | TraceEventSummaryResult,
  contents: string,
  output?: string,
): Promise<void> {
  if (output === undefined) {
    console.log(contents);
  } else {
    const filePath = await writeOutput(output, `${contents}\n`);
    console.log(
      JSON.stringify({
        success: result.success,
        parseSucceeded: result.parseSucceeded,
        filePath,
        trace: result.trace,
        ...(result.success ? {} : { error: result.error }),
      }),
    );
  }
  if (!result.success) process.exitCode = 1;
}

export function registerTraceQueryCommands(trace: Command): void {
  trace
    .command('query')
    .description(
      'Run Perfetto SQL against a local trace and emit JSON evidence',
    )
    .argument('<trace>', 'Local .pftrace file')
    .option('--sql <query>', 'Inline Perfetto SQL query')
    .option('--sql-file <path>', 'Read the Perfetto SQL query from a file')
    .option(
      '--max-rows <count>',
      'Maximum result rows to emit without changing the SQL query',
      parsePositiveInteger,
      DEFAULT_MAX_QUERY_ROWS,
    )
    .option('-o, --output <path>', 'Write the JSON evidence to a file')
    .action(async (tracePath: string, options: TraceQueryCommandOptions) => {
      const { sql, sqlFile } = await readSql(options);
      const result = await runTraceQuery(tracePath, sql, {
        maxRows: options.maxRows,
        ...(sqlFile === undefined ? {} : { sqlFile }),
      });
      await emitResult(result, JSON.stringify(result, null, 2), options.output);
    });

  trace
    .command('event-summary')
    .description(
      'List every Perfetto slice event name and its occurrence count',
    )
    .argument('<trace>', 'Local .pftrace file')
    .option('--json', 'Emit machine-readable JSON instead of a text table')
    .option('-o, --output <path>', 'Write the table or JSON evidence to a file')
    .action(
      async (tracePath: string, options: TraceEventSummaryCommandOptions) => {
        const result = await runTraceEventSummary(tracePath);
        const contents =
          result.success && !options.json
            ? renderTraceEventSummary(result)
            : JSON.stringify(result, null, 2);
        await emitResult(result, contents, options.output);
      },
    );
}
