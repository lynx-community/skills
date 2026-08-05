// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function throwClientDiscoveryFailures(failures: unknown[]): never {
  if (failures.length === 1) throw failures[0];
  const details = failures
    .map((failure) =>
      failure instanceof Error ? failure.message : String(failure),
    )
    .join('; ');
  throw new AggregateError(
    failures,
    `All client discovery transports failed: ${details}`,
  );
}
