// Copyright (C) 2018 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export type SqlValue = string | number | bigint | null | Uint8Array;
export type Brand<T, V extends string> = T & {
  __type: V;
};
export type time = Brand<bigint, "time">;
export type duration = bigint;
export interface ErrorResult {
  ok: false;
  error: string;
  value: undefined;
}
export interface OkResult<T> {
  ok: true;
  value: T;
}
export type Result<T = void> = ErrorResult | OkResult<T>;
export interface RowIteratorBase {
  valid(): boolean;
  next(): void;
  get(columnName: string): SqlValue;
}
export interface Row {
  [key: string]: SqlValue;
}
export type RowIterator<T extends Row> = RowIteratorBase & T;
export interface QueryResult {
  iter<T extends Row>(spec: T): RowIterator<T>;
  firstRow<T extends Row>(spec: T): T;
  maybeFirstRow<T extends Row>(spec: T): T | undefined;
  error(): string | undefined;
  numRows(): number;
  isComplete(): boolean;
  waitAllRows(): Promise<QueryResult>;
  waitMoreRows(): Promise<QueryResult>;
  columns(): string[];
  statementCount(): number;
  statementWithOutputCount(): number;
  lastStatementSql(): string;
}
export interface WritableQueryResult {
  appendResultBatch(resBytes: Uint8Array): void;
  isComplete(): boolean;
}
export type EngineMode = "WASM" | "HTTP_RPC";
export type NewEngineMode = "USE_HTTP_RPC_IF_AVAILABLE" | "FORCE_BUILTIN_WASM";
export interface TraceProcessorConfig {
  tokenizeOnly: boolean;
  cropTrackEvents: boolean;
  ingestFtraceInRawTable: boolean;
  analyzeTraceProtoContent: boolean;
  ftraceDropUntilAllCpusValid: boolean;
  extraParsingDescriptors?: ReadonlyArray<Uint8Array>;
  forceFullSort: boolean;
}
interface QueryLog {
  readonly tag?: string;
  readonly query: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly success?: boolean;
}
export interface Engine {
  readonly mode: EngineMode;
  readonly engineId: string;
  /**
   * A list of the most recent queries along with their start times, end times
   * and success status (if completed).
   */
  readonly queryLog: ReadonlyArray<QueryLog>;
  /**
   * Execute a query against the database, returning a promise that resolves
   * when the query has completed but rejected when the query fails for whatever
   * reason. On success, the promise will only resolve once all the resulting
   * rows have been received.
   *
   * The promise will be rejected if the query fails.
   *
   * @param sql The query to execute.
   * @param tag An optional tag used to trace the origin of the query.
   */
  query(sql: string): Promise<QueryResult>;
  /**
   * Execute a query against the database, returning a promise that resolves
   * when the query has completed or failed. The promise will never get
   * rejected, it will always successfully resolve. Use the returned wrapper
   * object to determine whether the query completed successfully.
   *
   * The promise will only resolve once all the resulting rows have been
   * received.
   *
   * @param sql The query to execute.
   * @param tag An optional tag used to trace the origin of the query.
   */
  tryQuery(sql: string): Promise<Result<QueryResult>>;
  getProxy(tag: string): EngineProxy;
  readonly numRequestsPending: number;
  readonly failed: string | undefined;
}
export declare abstract class EngineBase implements Engine, Disposable {
  abstract readonly id: string;
  abstract readonly mode: EngineMode;
  private txSeqId;
  private rxSeqId;
  private rxBuf;
  private pendingParses;
  private pendingEOFs;
  private pendingResetTraceProcessors;
  private pendingQueries;
  private pendingRestoreTables;
  private pendingComputeMetrics;
  private pendingReadMetatrace?;
  private pendingRegisterSqlPackage?;
  private pendingAnalyzeStructuredQueries?;
  private pendingTraceSummary?;
  private _numRequestsPending;
  private _failed;
  private _queryLog;
  get queryLog(): ReadonlyArray<QueryLog>;
  onResponseReceived?: () => void;
  abstract rpcSendRequestBytes(data: Uint8Array): void;
  onRpcResponseBytes(dataWillBeRetained: Uint8Array): void;
  private onRpcResponseMessage;
  parse(data: Uint8Array): Promise<void>;
  notifyEof(): Promise<void>;
  resetTraceProcessor({
    tokenizeOnly,
    cropTrackEvents,
    ingestFtraceInRawTable,
    analyzeTraceProtoContent,
    ftraceDropUntilAllCpusValid,
    extraParsingDescriptors,
    forceFullSort,
  }: TraceProcessorConfig): Promise<void>;
  restoreInitialTables(): Promise<void>;
  streamingQuery(
    result: WritableQueryResult,
    sqlQuery: string,
    tag?: string,
  ): void;
  private logQueryStart;
  query(sqlQuery: string, tag?: string): Promise<QueryResult>;
  tryQuery(sql: string, tag?: string): Promise<Result<QueryResult>>;
  registerSqlPackages(pkg: {
    name: string;
    modules: ReadonlyArray<{
      name: string;
      sql: string;
    }>;
  }): Promise<void>;
  private rpcSendRequest;
  get engineId(): string;
  get numRequestsPending(): number;
  getProxy(tag: string): EngineProxy;
  protected fail(reason: string): void;
  get failed(): string | undefined;
  abstract [Symbol.dispose](): void;
}
export declare class EngineProxy implements Engine, Disposable {
  private engine;
  private disposed;
  private tag;
  get queryLog(): readonly QueryLog[];
  constructor(engine: EngineBase, tag: string);
  query(query: string): Promise<QueryResult>;
  tryQuery(query: string): Promise<Result<QueryResult>>;
  get engineId(): string;
  getProxy(tag: string): EngineProxy;
  get numRequestsPending(): number;
  get mode(): EngineMode;
  get failed(): string | undefined;
  [Symbol.dispose](): void;
}
export interface EngineAttrs {
  engine: Engine;
}
export {};
