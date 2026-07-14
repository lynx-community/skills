// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  type CompatStatement,
  type NumericVersion,
  NumericVersionSchema,
} from './schemas.js';
import { compareNumericVersions } from './version.js';

const AVAILABILITY = {
  available: 'available',
  unavailable: 'unavailable',
  unknown: 'unknown',
  conditional: 'conditional',
  requiresNewerVersion: 'requires-newer-version',
} as const;

type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];

export type CompatibilityRow = {
  readonly backend: string;
  readonly version_added: string | boolean | null;
  readonly availability: Availability;
  readonly notes?: string | readonly string[];
  readonly partial_implementation?: boolean;
};

function assessAvailability(
  versionAdded: string | boolean | null,
  targetVersion: NumericVersion | undefined,
): Availability {
  if (versionAdded === false) {
    return AVAILABILITY.unavailable;
  }
  if (versionAdded === null) {
    return AVAILABILITY.unknown;
  }
  if (versionAdded === true) {
    return AVAILABILITY.available;
  }
  const parsedVersion = NumericVersionSchema.safeParse(versionAdded);
  if (!parsedVersion.success) {
    return AVAILABILITY.conditional;
  }
  if (targetVersion === undefined) {
    return AVAILABILITY.available;
  }
  return compareNumericVersions(targetVersion, parsedVersion.data) >= 0
    ? AVAILABILITY.available
    : AVAILABILITY.requiresNewerVersion;
}

export function createCompatibilityRows(
  statement: CompatStatement,
  targetVersion: NumericVersion | undefined,
  backend: string | undefined,
): readonly CompatibilityRow[] {
  return Object.entries(statement.support)
    .filter(([name]) => backend === undefined || name === backend)
    .map(([name, support]) => ({
      backend: name,
      version_added: support.version_added,
      availability: assessAvailability(support.version_added, targetVersion),
      ...(support.notes === undefined || support.notes === ''
        ? {}
        : { notes: support.notes }),
      ...(support.partial_implementation === undefined
        ? {}
        : { partial_implementation: support.partial_implementation }),
    }));
}
