// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import os from 'node:os';
import path from 'node:path';

export function runtimeCacheDirectory(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return path.resolve(
    env['AGENT_LYNX_CACHE_DIR'] || path.join(
      env['XDG_CACHE_HOME'] || env['LOCALAPPDATA']
        || path.join(os.homedir(), '.cache'),
      'agent-lynx',
    ),
  );
}
