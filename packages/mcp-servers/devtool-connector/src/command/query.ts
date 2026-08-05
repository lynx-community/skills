// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandObject } from './contract.ts';

const STRING_PREFIX = '~lynx-string~';
const JSON_PREFIX = '~lynx-json~';

/** Preserve value types when a command client uses the curl-friendly GET SSE route. */
export function appendCommandQueryParam(
  query: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined) return;
  if (typeof value === 'string') {
    query.append(key, `${STRING_PREFIX}${value}`);
    return;
  }
  const json = JSON.stringify(value);
  if (json !== undefined) query.append(key, `${JSON_PREFIX}${json}`);
}

function decodeCommandQueryValue(value: string): unknown {
  if (value.startsWith(STRING_PREFIX)) return value.slice(STRING_PREFIX.length);
  if (value.startsWith(JSON_PREFIX))
    return JSON.parse(value.slice(JSON_PREFIX.length)) as unknown;
  return value;
}

/** Decode both typed-client values and repeated, unprefixed curl parameters. */
export function decodeCommandQuery(params: URLSearchParams): CommandObject {
  const result: CommandObject = {};
  for (const [key, rawValue] of params) {
    const value = decodeCommandQueryValue(rawValue);
    const previous = result[key];
    if (previous === undefined) result[key] = value;
    else if (Array.isArray(previous)) previous.push(value);
    else result[key] = [previous, value];
  }
  return result;
}
