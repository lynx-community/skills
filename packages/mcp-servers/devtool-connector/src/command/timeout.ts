// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { CommandAction, CommandObject } from "./contract.ts";

export const DEFAULT_COMMAND_TIMEOUT_MS = 30_000;

const HEADLESS_OPEN_TIMEOUT_MS = 6 * 60_000;

export function getDefaultCommandTimeoutMs(action: CommandAction, params: CommandObject): number {
  const clientId = params["clientId"];
  // Headless clients are never auto-selected, so an omitted clientId keeps the
  // regular deadline. Explicit headless preparation may take up to five
  // minutes; leave one extra minute to open the page and return SessionList.
  if (action === "open" && typeof clientId === "string" && clientId.trim().startsWith("headless:")) {
    return HEADLESS_OPEN_TIMEOUT_MS;
  }
  return DEFAULT_COMMAND_TIMEOUT_MS;
}
