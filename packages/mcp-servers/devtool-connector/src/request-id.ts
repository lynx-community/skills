// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { randomInt } from "node:crypto";

// Native App requests require a signed 32-bit integer. Randomize the starting
// point across processes, then avoid reusing IDs while HDT can retain replies.
const maxRequestId = 0x7FFF_FFFF;
let requestId = randomInt(1, maxRequestId + 1);

export function nextRequestId(): number {
  const id = requestId;
  requestId = id === maxRequestId ? 1 : id + 1;
  return id;
}
