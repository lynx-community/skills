#!/usr/bin/env node

// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runDocsMcpCli } from './src/mcp.ts';

void runDocsMcpCli({
  importMetaUrl: import.meta.url,
  defaultBaseUrl: 'https://lynxjs.org/next/',
}).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
