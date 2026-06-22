// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { createProgram } from './devtool.ts';
import { createDevtoolClient } from './sdk.ts';

const client = createDevtoolClient();

try {
  await createProgram(client).parseAsync(process.argv);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close();
}
