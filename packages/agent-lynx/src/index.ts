#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import 'core-js/modules/es.promise.with-resolvers.js';
import pkg from '../package.json' with { type: 'json' };
import { InterruptedLogOutputError } from './commands/logs.ts';
import { createProgram } from './devtool.ts';
import { resolveUpdateNotice, withUpdateNotice } from './update-notice.ts';

await withUpdateNotice(
  {
    argv: process.argv.slice(2),
    resolveNotice: () =>
      resolveUpdateNotice({ currentVersion: pkg.version, env: process.env }),
  },
  async () => {
    await createProgram({ env: process.env }).parseAsync(process.argv).catch(
      error => {
        // parseAsync has released transports. Do not wait forever for a cancelled
        // stdout write when its downstream consumer is no longer reading.
        if (error instanceof InterruptedLogOutputError) {
          process.exit(process.exitCode ?? 0);
        }
        throw error;
      },
    );
  },
);
