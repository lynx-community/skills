// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RsbuildPlugin } from '@lynx-js/rspeedy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_THREAD_LAYER = 'react:main-thread';

// Registers the telemetry-stripping loader on the main-thread layer ONLY.
// Runs after swc (placed `.before(swc)` in the use array; loaders run right-to-left).
export function pluginStripMtTelemetry(): RsbuildPlugin {
  return {
    name: 'lynx:strip-mt-telemetry',
    setup(api) {
      api.modifyBundlerChain({
        order: 'post',
        handler: (
          chain,
          util = {} as { CHAIN_ID?: Record<string, Record<string, string>> },
        ) => {
          const { CHAIN_ID } = util || {};
          const jsRule = chain.module.rule(CHAIN_ID?.RULE?.JS || '');
          // The chain keys ('react:main-thread', CHAIN_ID.RULE.JS, CHAIN_ID.USE.SWC)
          // must match the installed rspeedy version. If they don't, this guard fires
          // and the loader silently does NOTHING — so warn rather than no-op in silence
          // (don't trust a green build that stripped zero calls; verify the layer key).
          if (!jsRule.oneOfs.has(MAIN_THREAD_LAYER)) {
            console.warn(
              `[strip-mt-telemetry] oneOf "${MAIN_THREAD_LAYER}" not found on the JS rule — loader NOT applied. Verify the rspeedy chain layer key for your version.`,
            );
            return;
          }
          const oneOfRule = jsRule.oneOf(MAIN_THREAD_LAYER);
          const swcUse = CHAIN_ID?.USE?.SWC || '';
          const loaderPath = path.resolve(
            __dirname,
            './strip-mt-telemetry-loader.cjs',
          );
          const useChain = oneOfRule
            .use('strip-mt-telemetry')
            .loader(loaderPath);
          if (swcUse && oneOfRule.uses.has(swcUse)) useChain.before(swcUse);
        },
      });
    },
  };
}
