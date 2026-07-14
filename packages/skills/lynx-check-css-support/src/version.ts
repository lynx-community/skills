// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type NumericVersion, NumericVersionSchema } from './schemas.js';

export function compareNumericVersions(
  left: NumericVersion,
  right: NumericVersion,
): number {
  const leftParts = NumericVersionSchema.parse(left).split('.').map(Number);
  const rightParts = NumericVersionSchema.parse(right).split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}
