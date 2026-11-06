// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod';
import { type NumericVersion, NumericVersionSchema } from './schemas.js';
import { compareNumericVersions } from './version.js';

const LATEST_PACKAGE_URL =
  'https://registry.npmjs.org/@lynx-js%2Fcss-defines/latest';
const MAX_RESPONSE_BYTES = 64 * 1024;

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

class RegistryResponseTooLargeError extends Error {
  override readonly name = 'RegistryResponseTooLargeError';
}

export class UpdateCheckError extends Error {
  override readonly name = 'UpdateCheckError';
  readonly exitCode = 1;

  constructor(cause: Error) {
    super('Unable to check for css-defines updates.', { cause });
  }
}

async function readRegistryMetadata(response: Response): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Registry request failed: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('Registry response has no body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let transferredBytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      transferredBytes += value.byteLength;
      if (transferredBytes > MAX_RESPONSE_BYTES) {
        throw new RegistryResponseTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}

export async function checkForUpdates(
  bundledVersion: NumericVersion,
): Promise<UpdateCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new DOMException('Registry request timed out.', 'TimeoutError'),
    );
  }, 5_000);
  timer.unref();

  try {
    const response = await fetch(LATEST_PACKAGE_URL, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { accept: 'application/json' },
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    const metadata = LatestPackageMetadataSchema.parse(
      await readRegistryMetadata(response),
    );
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
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
