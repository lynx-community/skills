// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/** Structured result envelope returned by the daemon command HTTP surface. */
export interface CommandError {
  message: string;
  cause?: string;
  reason?: string;
  recoverable: boolean;
  nextActions: string[];
}

export interface CommandSuccess<T> {
  ok: true;
  action: string;
  data: T;
  error?: never;
}

export interface CommandFailure {
  ok: false;
  action: string;
  data?: never;
  error: CommandError;
}

export type CommandResult<T = unknown> = CommandSuccess<T> | CommandFailure;

export function ok<T>(action: string, data: T): CommandResult<T> {
  return { ok: true, action, data };
}

export interface FailOptions {
  cause?: unknown;
  reason?: string;
  recoverable?: boolean;
  nextActions?: string[];
}

function stringifyCause(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.cause === undefined
      ? cause.message
      : stringifyCause(cause.cause);
  }
  if (typeof cause === 'string') return cause;
  try {
    const serialized = JSON.stringify(cause);
    if (serialized !== undefined) return serialized;
  } catch {
    // Fall back to String for cyclic or otherwise non-serializable causes.
  }
  return String(cause);
}

export function fail(
  action: string,
  message: string,
  options: FailOptions = {},
): CommandFailure {
  const error: CommandError = {
    message,
    recoverable: options.recoverable ?? false,
    nextActions: options.nextActions ?? [],
  };
  if (options.cause !== undefined) {
    error.cause = stringifyCause(options.cause);
  }
  if (options.reason !== undefined) {
    error.reason = options.reason;
  }
  return { ok: false, action, error };
}
