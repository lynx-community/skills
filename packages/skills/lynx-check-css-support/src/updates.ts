// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod';
import { type NumericVersion, NumericVersionSchema } from './schemas.js';
import { compareNumericVersions } from './version.js';

const LATEST_PACKAGE_URL =
  'https://registry.npmjs.org/@lynx-js%2Fcss-defines/latest';

const LatestPackageMetadataSchema = z
  .object({
    version: NumericVersionSchema,
  })
  .readonly();

export type UpdateCheckResult = {
  readonly package: '@lynx-js/css-defines';
  readonly bundled_version: NumericVersion;
  readonly latest_version: NumericVersion;
  readonly update_available: boolean;
};

export class UpdateCheckError extends Error {
  override readonly name = 'UpdateCheckError';
  readonly exitCode = 1;

  constructor(cause: Error) {
    super('Unable to check for css-defines updates.', { cause });
  }
}

export async function checkForUpdates(
  bundledVersion: NumericVersion,
): Promise<UpdateCheckResult> {
  try {
    const response = await fetch(LATEST_PACKAGE_URL, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { accept: 'application/json' },
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const metadata = LatestPackageMetadataSchema.parse(await response.json());
    return {
      package: '@lynx-js/css-defines',
      bundled_version: bundledVersion,
      latest_version: metadata.version,
      update_available:
        compareNumericVersions(metadata.version, bundledVersion) > 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new UpdateCheckError(error);
    }
    throw error;
  }
}
