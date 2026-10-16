// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { AsyncLocalStorage } from 'node:async_hooks';

export type TelemetryData = Readonly<Record<string, unknown>>;
export type CliTelemetry = (
  code: number,
  data: TelemetryData,
) => void | PromiseLike<unknown>;

const reporters = new AsyncLocalStorage<CliTelemetry>();

/** Keep reporting scoped to one invocation, including concurrent CLI hosts. */
export function withTelemetry<T>(
  report: CliTelemetry | undefined,
  operation: () => T,
): T {
  return report ? reporters.run(report, operation) : operation();
}

/** Reporting is best-effort and never changes a command's result. */
export function logMonitor(code: number, data: TelemetryData = {}): void {
  const report = reporters.getStore();
  if (!report) return;
  try {
    void Promise.resolve(report(code, data)).catch(() => {});
  } catch {
    // A reporter must not prevent inspection or cleanup.
  }
}

export const MonitorCode = {
  START_CLI: 3000,
  END_CLI: 3001,
  COMMAND_APP: 4001,
  COMMAND_CDP: 4002,
  COMMAND_GET_CONSOLE: 4003,
  COMMAND_GET_SOURCES: 4004,
  COMMAND_LIST_CLIENTS: 4007,
  COMMAND_LIST_SESSIONS: 4008,
  COMMAND_OPEN: 4009,
  COMMAND_TAKE_SCREENSHOT: 4010,
  UTILS_GET_FIRST_CLIENT: 4011,
  UTILS_GET_LATEST_SESSION: 4012,
  COMMAND_TAKE_HEAP_SNAPSHOT: 4013,
  COMMAND_GLOBAL_SWITCH_LIST: 4021,
  COMMAND_GLOBAL_SWITCH_GET: 4022,
  COMMAND_GLOBAL_SWITCH_SET: 4023,
  COMMAND_RECORDING_START: 4025,
  COMMAND_RECORDING_END: 4026,
  COMMAND_RECORDING_ENABLE_DEBUG_MODE: 4027,
  COMMAND_RECORDING_ENABLE_DEBUG_MODE_NOT_PERSISTED: 4028,
  COMMAND_WAIT_FOR_CLIENT: 4029,
  COMMAND_TRACE_START: 4030,
  COMMAND_TRACE_END: 4031,
  COMMAND_TRACE_READ_DATA: 4032,
  COMMAND_TRACE_ENABLE_DEBUG_MODE: 4033,
  COMMAND_APP_SUCCESS: 4101,
  COMMAND_CDP_SUCCESS: 4102,
  COMMAND_GET_CONSOLE_SUCCESS: 4103,
  COMMAND_GET_SOURCES_SUCCESS: 4104,
  COMMAND_LIST_CLIENTS_SUCCESS: 4107,
  COMMAND_LIST_SESSIONS_SUCCESS: 4108,
  COMMAND_OPEN_SUCCESS: 4109,
  COMMAND_TAKE_SCREENSHOT_SUCCESS: 4110,
  UTILS_GET_FIRST_CLIENT_SUCCESS: 4111,
  UTILS_GET_LATEST_SESSION_SUCCESS: 4112,
  COMMAND_TAKE_HEAP_SNAPSHOT_SUCCESS: 4113,
  COMMAND_GLOBAL_SWITCH_LIST_SUCCESS: 4121,
  COMMAND_GLOBAL_SWITCH_GET_SUCCESS: 4122,
  COMMAND_GLOBAL_SWITCH_SET_SUCCESS: 4123,
  COMMAND_RECORDING_START_SUCCESS: 4125,
  COMMAND_RECORDING_END_SUCCESS: 4126,
  COMMAND_RECORDING_ENABLE_DEBUG_MODE_SUCCESS: 4127,
  COMMAND_WAIT_FOR_CLIENT_SUCCESS: 4129,
  COMMAND_WAIT_FOR_CLIENT_LIST_CLIENTS_SUCCESS: 4130,
  COMMAND_TRACE_START_SUCCESS: 4131,
  COMMAND_TRACE_END_SUCCESS: 4132,
  COMMAND_TRACE_READ_DATA_SUCCESS: 4133,
  COMMAND_TRACE_ENABLE_DEBUG_MODE_SUCCESS: 4134,
} as const;
